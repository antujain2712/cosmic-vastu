import { NextResponse } from "next/server";
import { read } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const data = await read((db) => ({
    bookings: [...db.bookings].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    reports: [...db.reports].reverse().slice(0, 200).map((r) => ({
      id: r.id, createdAt: r.createdAt, tier: r.tier, name: r.input.name, email: r.input.email,
      propertyType: r.input.propertyType, city: r.input.city, score: r.rules.score, weakest: r.rules.weakest,
      aiStatus: r.aiStatus, questionsUsed: r.questionsUsed, images: r.images,
    })),
    payments: [...db.payments].reverse(),
    leads: [...db.leads].reverse().slice(0, 500),
    blockedDates: db.blockedDates,
  }));
  return NextResponse.json(data);
}
