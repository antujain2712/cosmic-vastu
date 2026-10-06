import { NextResponse } from "next/server";
import { tx } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email, name, source, data } = await req.json();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Check your email address." }, { status: 400 });
  await tx((db) => {
    db.leads.push({ email: String(email).slice(0, 160), name: name?.slice?.(0, 120), source: String(source ?? "site").slice(0, 40), at: new Date().toISOString(), data });
  });
  return NextResponse.json({ ok: true });
}
