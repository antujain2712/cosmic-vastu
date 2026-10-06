import { NextResponse, after } from "next/server";
import crypto from "crypto";
import { read } from "@/lib/db";
import { fulfilPayment, runGeneration } from "@/lib/fulfil";
import { tierRank } from "@/config/site";

export const runtime = "nodejs";
export const maxDuration = 120;

// Razorpay webhook (event: payment.captured). Backs up the browser-side verify call
// in case the customer closes the tab right after paying.
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }
  const evt = JSON.parse(raw);
  if (evt.event === "payment.captured" || evt.event === "order.paid") {
    const pay = evt.payload?.payment?.entity;
    const orderId = pay?.order_id;
    const exists = await read((db) => db.payments.some((x) => x.id === orderId));
    if (orderId && exists) {
      const paid = await fulfilPayment(orderId, pay.id);
      if (paid.kind === "report" && paid.tier && tierRank(paid.tier) >= tierRank("specialised")) after(() => runGeneration(paid.refId));
    }
  }
  return NextResponse.json({ ok: true });
}
