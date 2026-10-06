import { NextResponse } from "next/server";
import { tx } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await req.json();
  await tx((db) => {
    if (body.action === "bookingStatus") {
      const b = db.bookings.find((x) => x.id === body.id);
      if (b && ["confirmed", "cancelled", "completed"].includes(body.status)) b.status = body.status;
    }
    if (body.action === "blockDate" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      if (!db.blockedDates.includes(body.date)) db.blockedDates.push(body.date);
      db.blockedDates.sort();
    }
    if (body.action === "unblockDate") db.blockedDates = db.blockedDates.filter((d) => d !== body.date);
  });
  return NextResponse.json({ ok: true });
}
