import crypto from "crypto";
import Razorpay from "razorpay";
import { Currency } from "@/config/site";

export const paymentsLive = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

/** Test checkout: on locally, and in production only if ALLOW_TEST_PAYMENTS=true (private preview). */
export const testPaymentsAllowed = () =>
  !paymentsLive() && (process.env.NODE_ENV !== "production" || process.env.ALLOW_TEST_PAYMENTS === "true");

export class PaymentsOffError extends Error {
  constructor() {
    super("Online payments aren't switched on yet. Message Sanjay-ji on WhatsApp to book or buy a report.");
  }
}

export async function createOrder(amount: number, currency: Currency, receipt: string) {
  if (!paymentsLive()) {
    if (!testPaymentsAllowed()) throw new PaymentsOffError();
    return { id: `demo_order_${crypto.randomBytes(6).toString("hex")}`, provider: "demo" as const, keyId: null };
  }
  const rz = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
  // Razorpay amounts are in the smallest unit (paise / cents)
  const order = await rz.orders.create({ amount: Math.round(amount * 100), currency, receipt: receipt.slice(0, 40) });
  return { id: order.id as string, provider: "razorpay" as const, keyId: process.env.RAZORPAY_KEY_ID! };
}

export function verifySignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature || "");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
