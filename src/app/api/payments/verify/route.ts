import { NextResponse, after } from "next/server";
import { read } from "@/lib/db";
import { testPaymentsAllowed, verifySignature } from "@/lib/payments";
import { fulfilPayment, runGeneration } from "@/lib/fulfil";
import { tierRank } from "@/config/site";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const { orderId, paymentId, signature, demo } = await req.json();
  const p = await read((db) => db.payments.find((x) => x.id === orderId));
  if (!p) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (p.provider === "demo") {
    // Demo payments only work while live keys are absent
    if (!testPaymentsAllowed() || !demo) return NextResponse.json({ error: "Demo payments are switched off." }, { status: 400 });
  } else if (!verifySignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "Payment couldn't be verified. If money left your account, contact us with your payment ID." }, { status: 400 });
  }

  const paid = await fulfilPayment(orderId, paymentId ?? `demo_pay_${Date.now()}`);
  if (paid.kind === "report" && paid.tier && tierRank(paid.tier) >= tierRank("specialised")) {
    after(() => runGeneration(paid.refId));
  }
  return NextResponse.json({ ok: true, kind: paid.kind, refId: paid.refId });
}
