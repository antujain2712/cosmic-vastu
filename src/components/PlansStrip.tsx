"use client";
import Link from "next/link";
import { tiers, tierOrder, formatPrice, consultations } from "@/config/site";
import { CurrencyToggle, useCurrency } from "./Currency";

export function PlansStrip({ detailed = false }: { detailed?: boolean }) {
  const { currency } = useCurrency();
  return (
    <section className="bg-paper-2 border-y border-line">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="display text-5xl sm:text-6xl">Start free, go as deep as you need</h2>
            <p className="mt-3 text-ink-soft measure">
              One-time payments per space. No subscription. Every plan starts with a short analysis of your space: you see your free result
              first, then unlock the plan you chose.
            </p>
          </div>
          <CurrencyToggle />
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {tierOrder.map((t) => {
            const p = tiers[t];
            const featured = t === "specialised";
            return (
              <div key={t} className={`rounded-xl p-6 flex flex-col ${featured ? "bg-denim text-paper-2" : "bg-paper border border-line"}`}>
                <p className="font-medium">{p.name}</p>
                <p className="display text-5xl mt-3">{formatPrice(p.price[currency], currency)}</p>
                <p className={`mt-3 text-[0.95rem] ${featured ? "text-paper-2/85" : "text-ink-soft"}`}>{p.blurb}</p>
                {detailed && (
                  <ul className={`mt-5 space-y-2 text-sm ${featured ? "text-paper-2/90" : ""}`}>
                    {p.includes.map((x) => (
                      <li key={x} className="flex gap-2"><span aria-hidden>✓</span><span>{x}</span></li>
                    ))}
                  </ul>
                )}
                <div className="flex-1" />
                <Link href={t === "free" ? "/analyze" : `/analyze?plan=${t}`} className={`btn mt-6 ${featured ? "btn-light" : "btn-ink"}`}>
                  {t === "free" ? "Start free" : `Start with ${p.name}`}
                </Link>
              </div>
            );
          })}
        </div>
        <div className="mt-8 rounded-xl border border-ink/20 p-6 grid md:grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <p className="font-medium text-lg">Want Sanjay-ji to look at it himself?</p>
            <p className="text-ink-soft text-[0.95rem]">
              {consultations.online.name}: {formatPrice(consultations.online.price[currency], currency)} for {consultations.online.minutes} minutes.
              In-person visits: {formatPrice(consultations.inperson.price[currency], currency)} booking deposit, final fee discussed on a call based on location.
            </p>
          </div>
          <Link href="/book" className="btn btn-ink">Book a consultation</Link>
        </div>
      </div>
    </section>
  );
}
