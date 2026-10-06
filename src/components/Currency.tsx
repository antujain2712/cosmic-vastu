"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Currency } from "@/config/site";

const Ctx = createContext<{ currency: Currency; setCurrency: (c: Currency) => void }>({ currency: "INR", setCurrency: () => {} });

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("INR");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cvc_currency") as Currency | null;
      if (saved === "INR" || saved === "USD") return setCurrencyState(saved);
    } catch {}
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setCurrencyState(tz === "Asia/Kolkata" || tz === "Asia/Calcutta" ? "INR" : "USD");
  }, []);
  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem("cvc_currency", c);
    } catch {}
  };
  return <Ctx.Provider value={{ currency, setCurrency }}>{children}</Ctx.Provider>;
}

export const useCurrency = () => useContext(Ctx);

export function CurrencyToggle({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className={`inline-flex rounded-full border border-current/30 p-0.5 text-sm ${className}`} role="group" aria-label="Currency">
      {(["INR", "USD"] as Currency[]).map((c) => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          aria-pressed={currency === c}
          className={`px-3 py-1 rounded-full ${currency === c ? "bg-ink text-paper-2" : ""}`}
        >
          {c === "INR" ? "₹ INR" : "$ USD"}
        </button>
      ))}
    </div>
  );
}
