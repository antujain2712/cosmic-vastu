import { NextResponse } from "next/server";
import { read } from "@/lib/db";
import { bookableDates, slotsFor } from "@/lib/slots";
import { consultations, ConsultType } from "@/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const type = (sp.get("type") as ConsultType) || "online";
  const date = sp.get("date");
  const { blocked, bookings } = await read((db) => ({ blocked: db.blockedDates, bookings: db.bookings }));
  const takenOn = (d: string) =>
    bookings
      .filter((b) => b.date === d && b.status !== "cancelled" && (b.status !== "pending_payment" || Date.now() - Date.parse(b.createdAt) < 15 * 60000))
      .map((b) => `${b.time}|${consultations[b.type].minutes}`);
  const mins = consultations[type].minutes;
  // only offer days that still have at least one free slot
  const dates = bookableDates(blocked).filter((d) => slotsFor(d, takenOn(d), mins).length > 0);
  if (!date) return NextResponse.json({ dates });
  if (!dates.includes(date)) return NextResponse.json({ dates, slots: [] });
  return NextResponse.json({ dates, slots: slotsFor(date, takenOn(date), mins) });
}
