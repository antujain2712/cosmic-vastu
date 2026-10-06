// The one place that stores data. The rest of the app only talks to this file.
// - Locally: a JSON file in DATA_DIR (default ./data), uploads beside it. Zero setup.
// - On Vercel: Upstash Redis holds the same JSON document (guarded by a lock so
//   concurrent serverless requests don't clobber each other), and uploads go to a
//   private Vercel Blob store. Switched on by the env vars those integrations inject.
// The whole DB is one document; fine for thousands of reports. Split it per record
// (or move to Postgres) if it grows past a few MB.
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { Redis } from "@upstash/redis";
import { put as blobPut, get as blobGet } from "@vercel/blob";
import type { AnalysisInput, RulesResult } from "./rules";
import type { Tier, ConsultType, Currency } from "@/config/site";

export type AIReport = {
  summary: string;
  floorPlanReading?: string;
  elementNarrative?: Record<string, string>;
  lifeAreas?: Record<string, string>;
  actionPlan?: { step: string; why: string; cost: string }[];
  crystals?: { crystal: string; where: string; why: string }[];
  closing?: string;
  generatedBy: string;
  generatedAt: string;
};

export type Report = {
  id: string;
  createdAt: string;
  tier: Tier;
  input: AnalysisInput;
  rules: RulesResult;
  images: string[]; // stored file names in data/uploads
  ai?: AIReport;
  aiStatus?: "idle" | "running" | "done" | "error";
  aiError?: string;
  questionsUsed: number;
};

export type Booking = {
  id: string;
  createdAt: string;
  type: ConsultType;
  date: string; // YYYY-MM-DD (IST)
  time: string; // HH:mm (IST)
  name: string;
  email: string;
  phone: string;
  city?: string;
  address?: string;
  propertyType?: string;
  message?: string;
  reportId?: string;
  status: "pending_payment" | "confirmed" | "cancelled" | "completed";
  paymentId?: string;
  amount: number;
  currency: Currency;
};

export type Payment = {
  id: string; // our order id or razorpay order id
  createdAt: string;
  kind: "report" | "booking";
  refId: string; // report id or booking id
  tier?: Tier;
  amount: number;
  currency: Currency;
  status: "created" | "paid" | "failed";
  provider: "razorpay" | "demo";
  providerPaymentId?: string;
};

export type ChatMessage = { role: "user" | "assistant"; content: string; at: string };

export type Lead = { email: string; name?: string; source: string; at: string; data?: unknown };

type DB = {
  reports: Report[];
  bookings: Booking[];
  payments: Payment[];
  chats: Record<string, ChatMessage[]>;
  leads: Lead[];
  blockedDates: string[];
};

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "db.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const empty = (): DB => ({ reports: [], bookings: [], payments: [], chats: {}, leads: [], blockedDates: [] });

// Upstash via the Vercel Marketplace injects KV_REST_API_*; a direct Upstash setup uses UPSTASH_REDIS_REST_*.
const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const DB_KEY = "cv:db";
const LOCK_KEY = "cv:db:lock";

let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<DB> {
  if (redis) return { ...empty(), ...((await redis.get<DB>(DB_KEY)) ?? {}) };
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return empty();
  }
}

async function save(db: DB) {
  if (redis) {
    await redis.set(DB_KEY, db);
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, FILE);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Cross-instance lock in Redis; serverless requests may run on different machines. */
async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  if (!redis) return fn();
  const token = crypto.randomBytes(8).toString("hex");
  const deadline = Date.now() + 10_000;
  while (!(await redis.set(LOCK_KEY, token, { nx: true, px: 15_000 }))) {
    if (Date.now() > deadline) throw new Error("The site is busy. Try again in a moment.");
    await sleep(40 + Math.random() * 60);
  }
  try {
    return await fn();
  } finally {
    // release only our own lock
    await redis.eval("if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end", [LOCK_KEY], [token]);
  }
}

/** Serialised read-modify-write so concurrent requests don't clobber each other. */
export function tx<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = queue.then(() =>
    withLock(async () => {
      const db = await load();
      const out = await fn(db);
      await save(db);
      return out;
    })
  );
  queue = run.catch(() => undefined);
  return run;
}

export async function read<T>(fn: (db: DB) => T): Promise<T> {
  await queue;
  return fn(await load());
}

export const newId = (prefix: string) => `${prefix}_${crypto.randomBytes(8).toString("hex")}`;

export async function saveUpload(dataUrl: string): Promise<string | null> {
  const m = /^data:(image\/(png|jpeg|webp|gif));base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const buf = Buffer.from(m[3], "base64");
  if (buf.length > 6 * 1024 * 1024) return null;
  const ext = m[2] === "jpeg" ? "jpg" : m[2];
  const name = `${crypto.randomBytes(10).toString("hex")}.${ext}`;
  if (useBlob) {
    // floor plans of people's homes: private, served only through /api/uploads
    await blobPut(`uploads/${name}`, buf, { access: "private", addRandomSuffix: false, contentType: m[1] });
    return name;
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
  return name;
}

export async function loadUpload(name: string): Promise<{ data: string; mediaType: string } | null> {
  if (!/^[a-f0-9]{20}\.(png|jpg|webp|gif)$/.test(name)) return null;
  const ext = name.split(".").pop()!;
  const mediaType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  try {
    if (useBlob) {
      const res = await blobGet(`uploads/${name}`, { access: "private" });
      if (!res || res.statusCode !== 200) return null;
      const buf = Buffer.from(await new Response(res.stream).arrayBuffer());
      return { data: buf.toString("base64"), mediaType };
    }
    const buf = await fs.readFile(path.join(UPLOAD_DIR, name));
    return { data: buf.toString("base64"), mediaType };
  } catch {
    return null;
  }
}

const hits = new Map<string, number[]>();

/** Counts an attempt and says whether it is within `limit` per `windowMs`. Shared across instances on Redis. */
export async function allow(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (redis) {
    const k = `cv:rl:${key}`;
    const n = await redis.incr(k);
    if (n === 1) await redis.pexpire(k, windowMs);
    return n <= limit;
  }
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) return false;
  hits.set(key, [...recent, now]);
  return true;
}
