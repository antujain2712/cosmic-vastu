import { NextResponse, after } from "next/server";
import { read } from "@/lib/db";
import { runGeneration } from "@/lib/fulfil";
import { tierRank } from "@/config/site";

export const runtime = "nodejs";
export const maxDuration = 120;

// Retry or start AI generation for a paid report.
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await read((db) => db.reports.find((x) => x.id === id));
  if (!r) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  if (tierRank(r.tier) < tierRank("specialised")) return NextResponse.json({ error: "The written report comes with Specialised and In-depth." }, { status: 402 });
  after(() => runGeneration(id));
  return NextResponse.json({ ok: true });
}
