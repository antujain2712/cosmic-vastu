"use client";
import { useState } from "react";
import { formatPrice, Currency, site } from "@/config/site";

export type Order = { id: string; amount: number; currency: Currency; provider: "razorpay" | "demo"; keyId: string | null };

type RazorpayCtor = new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };

function loadRazorpay(): Promise<RazorpayCtor> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { Razorpay?: RazorpayCtor };
    if (w.Razorpay) return resolve(w.Razorpay);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error("Razorpay didn't load")));
    s.onerror = () => reject(new Error("Couldn't reach Razorpay. Check your connection."));
    document.body.appendChild(s);
  });
}

/** Opens Razorpay (live keys) or a demo sheet (no keys), then verifies on the server. */
export function useCheckout() {
  const [demo, setDemo] = useState<{ order: Order; description: string; resolve: (ok: boolean) => void } | null>(null);

  async function verify(body: Record<string, unknown>) {
    const res = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Payment couldn't be verified.");
    return j;
  }

  async function pay(order: Order, description: string, prefill?: { name?: string; email?: string; contact?: string }) {
    if (order.amount <= 0) return verify({ orderId: order.id, demo: true });
    if (order.provider === "demo") {
      const ok = await new Promise<boolean>((resolve) => setDemo({ order, description, resolve }));
      setDemo(null);
      if (!ok) throw new Error("Payment cancelled.");
      return verify({ orderId: order.id, demo: true });
    }
    const Rz = await loadRazorpay();
    return new Promise((resolve, reject) => {
      const rz = new Rz({
        key: order.keyId,
        order_id: order.id,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        name: site.brand,
        description,
        prefill,
        theme: { color: "#33506e" },
        handler: async (r: { razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            resolve(await verify({ orderId: order.id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }));
          } catch (e) {
            reject(e);
          }
        },
        modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
      });
      rz.on("payment.failed", () => reject(new Error("The payment failed. No money was taken — try again or use another method.")));
      rz.open();
    });
  }

  const sheet = demo ? (
    <div className="fixed inset-0 z-50 bg-ink/60 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="demo-pay-title">
      <div className="bg-paper-2 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <p id="demo-pay-title" className="display text-3xl">Test payment</p>
        <p className="mt-2 text-ink-soft text-sm">
          Razorpay keys aren&apos;t set yet, so this is a simulated checkout. No money moves.
        </p>
        <div className="mt-5 flex justify-between border-y border-line py-3">
          <span>{demo.description}</span>
          <span className="font-semibold">{formatPrice(demo.order.amount, demo.order.currency)}</span>
        </div>
        <div className="mt-6 flex gap-3">
          <button className="btn btn-ink flex-1" onClick={() => demo.resolve(true)}>Pay {formatPrice(demo.order.amount, demo.order.currency)}</button>
          <button className="btn btn-line" onClick={() => demo.resolve(false)}>Cancel</button>
        </div>
      </div>
    </div>
  ) : null;

  return { pay, sheet };
}
