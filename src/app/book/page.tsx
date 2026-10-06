"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { consultations, ConsultType, formatPrice, site, availability } from "@/config/site";
import { useCurrency, CurrencyToggle } from "@/components/Currency";
import { useCheckout, Order } from "@/components/Checkout";

const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-IN", { timeZone: "UTC", ...opts });

function localTime(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, hh, mm) - 330 * 60000);
  return utc.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function Book() {
  const sp = useSearchParams();
  const router = useRouter();
  const { currency } = useCurrency();
  const { pay, sheet } = useCheckout();
  const [type, setType] = useState<ConsultType>("online");
  const [dates, setDates] = useState<string[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", address: "", propertyType: "Home", message: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const reportId = sp.get("report") ?? undefined;

  const userTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const inIndia = userTz === "Asia/Kolkata" || userTz === "Asia/Calcutta";

  useEffect(() => {
    fetch(`/api/slots?type=${type}`).then((r) => r.json()).then((j) => setDates(j.dates ?? []));
  }, [type]);

  useEffect(() => {
    if (!date) return;
    setSlots(null);
    setTime(null);
    fetch(`/api/slots?type=${type}&date=${date}`).then((r) => r.json()).then((j) => setSlots(j.slots ?? []));
  }, [date, type]);

  const c = consultations[type];
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) return setErr("Pick a date and time.");
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, type, date, time, currency, reportId }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      await pay(j.order as Order, `${c.name}, ${fmtDate(date, { day: "numeric", month: "short" })} ${time} IST`, { name: form.name, email: form.email, contact: form.phone });
      router.push(`/book/confirmed?b=${j.bookingId}&d=${date}&t=${time}&type=${type}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Booking failed.");
      if (date) fetch(`/api/slots?type=${type}&date=${date}`).then((r) => r.json()).then((j) => setSlots(j.slots ?? []));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      {sheet}
      <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end">
        <div>
          <h1 className="display text-[clamp(3rem,9vw,6rem)]">Book Sanjay-ji</h1>
          <p className="mt-3 text-ink-soft measure">Online from anywhere in the world, or in person at your home, office or site.{reportId ? " Your report will be shared with him before the session." : ""}</p>
        </div>
        <div className="relative w-28 h-28 rounded-full overflow-hidden hidden md:block">
          <Image src="/img/sanjay-event.jpg" alt={site.consultant} fill className="object-cover" sizes="112px" />
        </div>
      </div>

      <form onSubmit={submit} className="mt-10 grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-12">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="label !mb-0">Type of session</p>
            <CurrencyToggle />
          </div>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            {(Object.keys(consultations) as ConsultType[]).map((k) => {
              const x = consultations[k];
              return (
                <button type="button" key={k} onClick={() => setType(k)} aria-pressed={type === k} className={`text-left rounded-2xl border-2 p-5 ${type === k ? "border-denim bg-denim-pale/40" : "border-line bg-paper-2"}`}>
                  <p className="font-semibold">{x.name}</p>
                  <p className="display text-3xl mt-2">{formatPrice(x.price[currency], currency)}</p>
                  <p className="text-sm text-ink-soft">{x.deposit ? "booking deposit" : `${x.minutes} minutes`}</p>
                  <p className="text-sm text-ink-soft mt-3">{x.note}</p>
                </button>
              );
            })}
          </div>

          <p className="label mt-10">Date</p>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {dates.map((d) => (
              <button type="button" key={d} onClick={() => setDate(d)} aria-pressed={date === d} className={`shrink-0 w-16 rounded-xl border-2 py-2 text-center ${date === d ? "border-ink bg-ink text-paper-2" : "border-line bg-paper-2"}`}>
                <span className="block text-xs">{fmtDate(d, { weekday: "short" })}</span>
                <span className="block display text-2xl">{fmtDate(d, { day: "numeric" })}</span>
                <span className="block text-xs">{fmtDate(d, { month: "short" })}</span>
              </button>
            ))}
          </div>

          {date && (
            <>
              <p className="label mt-8">Time <span className="font-normal text-ink-soft">(India time{!inIndia ? `; yours shown below` : ""})</span></p>
              {slots === null ? (
                <p className="text-ink-soft">Checking Sanjay-ji&apos;s diary…</p>
              ) : slots.length === 0 ? (
                <p className="text-ink-soft">That day is full. Pick another date.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((s) => (
                    <button type="button" key={s} onClick={() => setTime(s)} aria-pressed={time === s} className={`rounded-xl border-2 py-2 ${time === s ? "border-ink bg-ink text-paper-2" : "border-line bg-paper-2"}`}>
                      <span className="block font-medium">{s}</span>
                      {!inIndia && <span className="block text-xs opacity-75">{localTime(date, s)}</span>}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <p className="text-xs text-ink-soft mt-4">Sessions run {availability.start}–{availability.end} IST, Monday to Saturday.</p>
        </div>

        <div className="space-y-4">
          <div><label className="label" htmlFor="b-name">Full name</label><input id="b-name" required className="field" value={form.name} onChange={set("name")} autoComplete="name" /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label" htmlFor="b-email">Email</label><input id="b-email" type="email" required className="field" value={form.email} onChange={set("email")} autoComplete="email" /></div>
            <div><label className="label" htmlFor="b-phone">Phone / WhatsApp</label><input id="b-phone" type="tel" required className="field" value={form.phone} onChange={set("phone")} autoComplete="tel" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label" htmlFor="b-city">City</label><input id="b-city" className="field" value={form.city} onChange={set("city")} /></div>
            <div>
              <label className="label" htmlFor="b-type">Property</label>
              <select id="b-type" className="field" value={form.propertyType} onChange={set("propertyType")}>
                {["Home", "Office", "Shop", "Factory / warehouse", "Hospital / clinic", "Plot / land", "Under construction"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
          </div>
          {type === "inperson" && <div><label className="label" htmlFor="b-addr">Address of the property</label><textarea id="b-addr" required className="field min-h-20" value={form.address} onChange={set("address")} /></div>}
          <div><label className="label" htmlFor="b-msg">What would you like to focus on?</label><textarea id="b-msg" className="field min-h-24" value={form.message} onChange={set("message")} /></div>

          <div className="rounded-2xl bg-paper-2 border border-line p-5">
            <div className="flex justify-between"><span>{c.name}</span><span className="font-semibold">{formatPrice(c.price[currency], currency)}</span></div>
            {c.deposit && <p className="text-sm text-ink-soft mt-1">Booking deposit. The final fee is discussed with Sanjay-ji on a call, based on location.</p>}
            <p className="text-sm text-ink-soft mt-1">{date && time ? `${fmtDate(date, { weekday: "long", day: "numeric", month: "long" })}, ${time} IST` : "Choose a date and time"}</p>
            <button className="btn btn-ink w-full mt-4" disabled={busy || !date || !time}>{busy ? "Booking…" : `Pay and book`}</button>
            {err && <p className="text-fire text-sm mt-3" role="alert">{err}</p>}
            {err?.includes("WhatsApp") && (
              <a className="btn btn-line w-full mt-3" target="_blank" rel="noreferrer" href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Namaste, I'd like to book a ${c.name.toLowerCase()}${date && time ? ` on ${date} at ${time} IST` : ""}. Name: ${form.name}`)}`}>Book on WhatsApp</a>
            )}
            <p className="text-xs text-ink-soft mt-3">Payments by Razorpay: UPI, cards, net banking and international cards. Reschedule once with 24 hours&apos; notice.</p>
          </div>
        </div>
      </form>
    </section>
  );
}

export default function BookPage() {
  return <Suspense><Book /></Suspense>;
}
