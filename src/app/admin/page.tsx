"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { consultations, formatPrice, tiers, Tier, Currency, ConsultType } from "@/config/site";
import { elementInfo, Element } from "@/lib/knowledge";

type Data = {
  bookings: { id: string; type: ConsultType; date: string; time: string; name: string; email: string; phone: string; city?: string; address?: string; message?: string; status: string; amount: number; currency: Currency; reportId?: string }[];
  reports: { id: string; createdAt: string; tier: Tier; name?: string; email?: string; propertyType: string; city?: string; score: number; weakest: Element; aiStatus?: string; questionsUsed: number }[];
  payments: { id: string; createdAt: string; kind: string; amount: number; currency: Currency; status: string; provider: string; tier?: Tier }[];
  leads: { email: string; source: string; at: string }[];
  blockedDates: string[];
};

const TABS = ["Bookings", "Reports", "Payments", "Leads", "Diary"] as const;

export default function Admin() {
  const [data, setData] = useState<Data | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Bookings");
  const [block, setBlock] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/data", { cache: "no-store" });
    if (res.status === 401) return setAuthed(false);
    setData(await res.json());
    setAuthed(true);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (!res.ok) return setErr("Wrong password.");
    setErr(null);
    load();
  }

  async function update(body: Record<string, string>) {
    await fetch("/api/admin/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    load();
  }

  if (authed === false)
    return (
      <section className="min-h-screen grid place-items-center bg-denim px-4">
        <form onSubmit={login} className="bg-paper-2 rounded-2xl p-8 w-full max-w-sm">
          <p className="script text-4xl">Sanjay Raj Jain</p>
          <p className="display text-3xl mt-2">Studio</p>
          <label className="label mt-6" htmlFor="pw">Password</label>
          <input id="pw" type="password" className="field" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
          {err && <p className="text-fire text-sm mt-2">{err}</p>}
          <button className="btn btn-ink w-full mt-5">Sign in</button>
        </form>
      </section>
    );
  if (!data) return <p className="p-10">Loading…</p>;

  const paid = data.payments.filter((p) => p.status === "paid");
  const sum = (c: Currency) => paid.filter((p) => p.currency === c).reduce((a, p) => a + p.amount, 0);
  const upcoming = data.bookings.filter((b) => b.status === "confirmed" && b.date >= new Date().toISOString().slice(0, 10));

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink text-paper-2">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="script text-2xl">Sanjay Raj Jain · Studio</span>
          <Link href="/" className="text-sm underline">View site</Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line rounded-xl overflow-hidden">
          {[
            ["Upcoming sessions", String(upcoming.length)],
            ["Reports created", String(data.reports.length)],
            ["Paid (₹)", formatPrice(sum("INR"), "INR")],
            ["Paid ($)", formatPrice(sum("USD"), "USD")],
          ].map(([k, v]) => (
            <div key={k} className="bg-paper-2 p-5"><dt className="text-sm text-ink-soft">{k}</dt><dd className="display text-4xl mt-1">{v === "Free" ? "0" : v}</dd></div>
          ))}
        </dl>

        <nav className="mt-8 flex gap-5 border-b border-line">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`pb-2 -mb-px ${tab === t ? "border-b-2 border-ink font-medium" : "text-ink-soft"}`}>{t}</button>
          ))}
        </nav>

        <div className="mt-6 overflow-x-auto">
          {tab === "Bookings" && (
            <table className="w-full text-sm text-left">
              <thead className="text-ink-soft"><tr><th className="py-2 pr-4">When (IST)</th><th className="pr-4">Client</th><th className="pr-4">Session</th><th className="pr-4">Paid</th><th className="pr-4">Status</th><th /></tr></thead>
              <tbody>
                {data.bookings.length === 0 && <tr><td colSpan={6} className="py-6 text-ink-soft">No bookings yet. Share the booking page: /book</td></tr>}
                {data.bookings.map((b) => (
                  <tr key={b.id} className="border-t border-line align-top">
                    <td className="py-3 pr-4 whitespace-nowrap">{b.date}<br />{b.time}</td>
                    <td className="py-3 pr-4"><span className="font-medium">{b.name}</span><br />{b.email}<br />{b.phone}{b.city ? <><br />{b.city}</> : null}{b.address ? <><br /><span className="text-ink-soft">{b.address}</span></> : null}{b.message ? <><br /><span className="text-ink-soft italic">{b.message}</span></> : null}{b.reportId ? <><br /><Link className="underline" href={`/report/${b.reportId}`} target="_blank">Their report</Link></> : null}</td>
                    <td className="py-3 pr-4">{consultations[b.type].name}</td>
                    <td className="py-3 pr-4">{formatPrice(b.amount, b.currency)}</td>
                    <td className="py-3 pr-4 capitalize">{b.status.replace("_", " ")}</td>
                    <td className="py-3 whitespace-nowrap space-x-2">
                      {b.status === "confirmed" && <button className="underline" onClick={() => update({ action: "bookingStatus", id: b.id, status: "completed" })}>Mark done</button>}
                      {b.status !== "cancelled" && b.status !== "completed" && <button className="underline text-fire" onClick={() => update({ action: "bookingStatus", id: b.id, status: "cancelled" })}>Cancel</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "Reports" && (
            <table className="w-full text-sm text-left">
              <thead className="text-ink-soft"><tr><th className="py-2 pr-4">Created</th><th className="pr-4">Client</th><th className="pr-4">Space</th><th className="pr-4">Score</th><th className="pr-4">Weakest</th><th className="pr-4">Plan</th><th className="pr-4">Questions</th><th /></tr></thead>
              <tbody>
                {data.reports.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="py-3 pr-4 whitespace-nowrap">{r.createdAt.slice(0, 10)}</td>
                    <td className="pr-4">{r.name ?? "—"}<br /><span className="text-ink-soft">{r.email ?? ""}</span></td>
                    <td className="pr-4 capitalize">{r.propertyType}{r.city ? `, ${r.city}` : ""}</td>
                    <td className="pr-4 display text-xl">{r.score}</td>
                    <td className="pr-4" style={{ color: elementInfo[r.weakest].hex }}>{elementInfo[r.weakest].name}</td>
                    <td className="pr-4">{tiers[r.tier].name}{r.aiStatus === "error" ? " (AI error)" : ""}</td>
                    <td className="pr-4">{r.questionsUsed}</td>
                    <td><Link className="underline" href={`/report/${r.id}`} target="_blank">Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "Payments" && (
            <table className="w-full text-sm text-left">
              <thead className="text-ink-soft"><tr><th className="py-2 pr-4">Date</th><th className="pr-4">For</th><th className="pr-4">Amount</th><th className="pr-4">Status</th><th>Order</th></tr></thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="py-3 pr-4">{p.createdAt.slice(0, 16).replace("T", " ")}</td>
                    <td className="pr-4">{p.kind === "report" ? `${tiers[p.tier!]?.name} report` : "Consultation"}</td>
                    <td className="pr-4">{formatPrice(p.amount, p.currency)}</td>
                    <td className="pr-4 capitalize">{p.status}{p.provider === "demo" ? " (test)" : ""}</td>
                    <td className="text-ink-soft">{p.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "Leads" && (
            <div>
              <a className="btn btn-line !py-1.5 text-sm" href={`data:text/csv;charset=utf-8,${encodeURIComponent("email,source,date\n" + data.leads.map((l) => `${l.email},${l.source},${l.at}`).join("\n"))}`} download="leads.csv">Download CSV</a>
              <ul className="mt-4 text-sm divide-y divide-line">
                {data.leads.map((l, i) => <li key={i} className="py-2 flex justify-between gap-4"><span>{l.email}</span><span className="text-ink-soft">{l.source} · {l.at.slice(0, 10)}</span></li>)}
              </ul>
            </div>
          )}
          {tab === "Diary" && (
            <div className="max-w-md">
              <p className="text-ink-soft text-sm">Block days when Sanjay-ji is away. Weekly hours are set in <code>src/config/site.ts</code>.</p>
              <div className="mt-4 flex gap-2">
                <input type="date" className="field" value={block} onChange={(e) => setBlock(e.target.value)} />
                <button className="btn btn-ink shrink-0" disabled={!block} onClick={() => { update({ action: "blockDate", date: block }); setBlock(""); }}>Block day</button>
              </div>
              <ul className="mt-6 space-y-2">
                {data.blockedDates.map((d) => (
                  <li key={d} className="flex justify-between border-b border-line pb-2"><span>{d}</span><button className="underline text-sm" onClick={() => update({ action: "unblockDate", date: d })}>Unblock</button></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
