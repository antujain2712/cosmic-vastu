import { NextResponse } from "next/server";
import { tx, newId, Booking } from "@/lib/db";
import { bookableDates, slotsFor } from "@/lib/slots";
import { consultations, ConsultType, Currency } from "@/config/site";
import { createOrder } from "@/lib/payments";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const b = await req.json();
  const type = b.type as ConsultType;
  const currency = (b.currency === "USD" ? "USD" : "INR") as Currency;
  if (!(type in consultations)) return NextResponse.json({ error: "Choose online or in-person." }, { status: 400 });
  for (const f of ["name", "email", "phone", "date", "time"]) {
    if (!b[f] || typeof b[f] !== "string") return NextResponse.json({ error: `Fill in your ${f}.` }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(b.email)) return NextResponse.json({ error: "Check your email address." }, { status: 400 });
  if (type === "inperson" && !b.address) return NextResponse.json({ error: "Add the address of the property for an in-person visit." }, { status: 400 });

  const c = consultations[type];
  const amount = c.price[currency];

  try {
    const booking = await tx(async (db) => {
      if (!bookableDates(db.blockedDates).includes(b.date)) throw new Error("That date isn't available any more. Pick another.");
      const taken = db.bookings
        .filter((x) => x.date === b.date && x.status !== "cancelled" && (x.status !== "pending_payment" || Date.now() - Date.parse(x.createdAt) < 15 * 60000))
        .map((x) => `${x.time}|${consultations[x.type].minutes}`);
      if (!slotsFor(b.date, taken, c.minutes).includes(b.time)) throw new Error("Someone just took that time. Pick another slot.");
      const bk: Booking = {
        id: newId("b"),
        createdAt: new Date().toISOString(),
        type,
        date: b.date,
        time: b.time,
        name: String(b.name).slice(0, 120),
        email: String(b.email).slice(0, 160),
        phone: String(b.phone).slice(0, 30),
        city: b.city?.slice(0, 80),
        address: b.address?.slice(0, 300),
        propertyType: b.propertyType,
        message: b.message?.slice(0, 1500),
        reportId: b.reportId || undefined,
        status: "pending_payment",
        amount,
        currency,
      };
      db.bookings.push(bk);
      return bk;
    });

    let order;
    try {
      order = await createOrder(amount, currency, booking.id);
    } catch (e) {
      await tx((db) => { db.bookings = db.bookings.filter((x) => x.id !== booking.id); });
      throw e;
    }
    await tx((db) => {
      db.payments.push({ id: order.id, createdAt: new Date().toISOString(), kind: "booking", refId: booking.id, amount, currency, status: "created", provider: order.provider });
    });
    return NextResponse.json({ bookingId: booking.id, order: { id: order.id, amount, currency, provider: order.provider, keyId: order.keyId } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Booking failed." }, { status: 409 });
  }
}
