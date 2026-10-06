import { NextResponse } from "next/server";
import { read, tx } from "@/lib/db";
import { tiers, Tier, tierRank, Currency } from "@/config/site";
import { createOrder } from "@/lib/payments";

export const runtime = "nodejs";

// Create an order to unlock a report tier. Upgrades pay only the difference.
export async function POST(req: Request) {
  const { reportId, tier, currency: cur } = (await req.json()) as { reportId: string; tier: Tier; currency: Currency };
  const currency: Currency = cur === "USD" ? "USD" : "INR";
  if (!(tier in tiers) || tier === "free") return NextResponse.json({ error: "Choose a plan." }, { status: 400 });
  const r = await read((db) => db.reports.find((x) => x.id === reportId));
  if (!r) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  if (tierRank(r.tier) >= tierRank(tier)) return NextResponse.json({ error: "You already have this plan." }, { status: 400 });

  const amount = tiers[tier].price[currency] - tiers[r.tier].price[currency];
  let order;
  try {
    order = await createOrder(amount, currency, `${reportId}-${tier}`);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Payment couldn't start." }, { status: 503 });
  }
  await tx((db) => {
    db.payments.push({ id: order.id, createdAt: new Date().toISOString(), kind: "report", refId: reportId, tier, amount, currency, status: "created", provider: order.provider });
  });
  return NextResponse.json({ order: { id: order.id, amount, currency, provider: order.provider, keyId: order.keyId } });
}
