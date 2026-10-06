"use client";
import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ReportView } from "@/lib/view";
import { ElementBars } from "@/components/ElementBars";
import { elementInfo, directionInfo, ELEMENTS } from "@/lib/knowledge";
import { tiers, tierOrder, tierRank, formatPrice, Tier, site } from "@/config/site";
import { useCurrency, CurrencyToggle } from "@/components/Currency";
import { useCheckout, Order } from "@/components/Checkout";

const verdictStyle = {
  best: { label: "Well placed", cls: "bg-wood text-paper-2" },
  ok: { label: "Acceptable", cls: "bg-metal text-paper-2" },
  avoid: { label: "Disturbs balance", cls: "bg-fire text-paper-2" },
};

export default function ReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ plan?: string }> }) {
  const { id } = use(params);
  const { plan: chosen } = use(searchParams);
  const [r, setR] = useState<ReportView | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { currency } = useCurrency();
  const { pay, sheet } = useCheckout();
  const [paying, setPaying] = useState<Tier | null>(null);
  const [payErr, setPayErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/report/${id}`, { cache: "no-store" });
    const j = await res.json();
    if (!res.ok) setErr(j.error);
    else setR(j);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (r?.aiStatus !== "running") return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [r?.aiStatus, load]);

  async function upgrade(t: Tier) {
    setPaying(t);
    setPayErr(null);
    try {
      const res = await fetch("/api/payments/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId: id, tier: t, currency }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      await pay(j.order as Order, `${tiers[t].name} Vastu report`, { name: r?.input.name });
      await load();
      document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      setPayErr(e instanceof Error ? e.message : "Payment failed.");
    } finally {
      setPaying(null);
    }
  }

  async function retry() {
    await fetch(`/api/report/${id}/generate`, { method: "POST" });
    setTimeout(load, 800);
  }

  if (err) return <section className="mx-auto max-w-3xl px-4 py-24"><h1 className="display text-5xl">Report not found</h1><p className="mt-4 text-ink-soft">{err}</p><Link href="/analyze" className="btn btn-ink mt-8">Start a new analysis</Link></section>;
  if (!r) return <section className="mx-auto max-w-3xl px-4 py-24"><p className="script text-5xl">Observing…</p></section>;

  const rank = tierRank(r.tier);
  const w = elementInfo[r.rules.weakest];
  const s = elementInfo[r.rules.strongest];
  const upgrades = tierOrder.filter((t) => tierRank(t) > rank);

  return (
    <div id="top">
      {sheet}
      <section className="bg-denim text-paper-2">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 grid md:grid-cols-[1fr_1.2fr] gap-10 items-end">
          <div>
            <p className="text-paper-2/80">{r.input.name ? `${r.input.name}'s ` : "Your "}{r.input.propertyType}{r.input.city ? `, ${r.input.city}` : ""} · {tiers[r.tier].name}</p>
            <p className="display text-[clamp(7rem,22vw,14rem)] leading-[0.8] mt-4">{r.rules.score}</p>
            <p className="script text-4xl mt-2">balance out of 100</p>
            <p className="mt-6 measure text-paper-2/90">
              {s.name} is your strongest element and <span className="font-semibold">{w.name}</span> your weakest. {w.name} governs {w.lifeArea.split("—")[0].trim().toLowerCase()}: {w.lifeArea.split("—")[1]?.trim()}.
            </p>
          </div>
          <div className="bg-paper-2 text-ink rounded-2xl p-5">
            <ElementBars scores={r.rules.elementScores} weakest={r.rules.weakest} />
            <p className="text-xs text-ink-soft mt-3">The dashed line marks a healthy level. Balance matters more than any single high score.</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 grid lg:grid-cols-[1.5fr_1fr] gap-12">
        <div className="min-w-0">
          {/* AI written report */}
          {rank >= 2 && (
            <section className="mb-14">
              <h2 className="display text-5xl">Your written report</h2>
              {r.aiStatus === "running" && (
                <div className="mt-6 rounded-2xl border border-line bg-paper-2 p-8">
                  <p className="script text-4xl">Observe · analyse · balance…</p>
                  <p className="mt-2 text-ink-soft">Reading your plan and writing your report. This takes about a minute; the page updates by itself.</p>
                </div>
              )}
              {r.aiStatus === "error" && (
                <div className="mt-6 rounded-2xl border border-fire/40 bg-paper-2 p-6">
                  <p className="font-medium">The report didn&apos;t finish.</p>
                  <p className="text-ink-soft mt-1">{r.aiError}</p>
                  <button className="btn btn-ink mt-4" onClick={retry}>Write it again</button>
                </div>
              )}
              {(r.aiStatus === "idle") && !r.ai && <button className="btn btn-ink mt-6" onClick={retry}>Write my report</button>}
              {r.ai && (
                <article className="mt-6 space-y-8">
                  <p className="text-xl measure">{r.ai.summary}</p>
                  {r.ai.floorPlanReading && (
                    <div><h3 className="font-semibold text-lg">What we see in your plan</h3><p className="mt-2 text-ink-soft measure whitespace-pre-line">{r.ai.floorPlanReading}</p></div>
                  )}
                  {r.ai.elementNarrative && (
                    <div className="grid sm:grid-cols-2 gap-5">
                      {ELEMENTS.map((e) => r.ai!.elementNarrative![e] && (
                        <div key={e} className="border-t-2 pt-3" style={{ borderColor: elementInfo[e].hex }}>
                          <p className="font-medium">{elementInfo[e].name} · {directionInfo[elementInfo[e].direction].name}</p>
                          <p className="text-ink-soft text-[0.95rem] mt-1">{r.ai!.elementNarrative![e]}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {r.ai.lifeAreas && (
                    <div>
                      <h3 className="font-semibold text-lg">Your life areas</h3>
                      <dl className="mt-3 space-y-3">
                        {Object.entries(r.ai.lifeAreas).map(([k, v]) => (
                          <div key={k}><dt className="font-medium capitalize">{k}</dt><dd className="text-ink-soft measure">{v}</dd></div>
                        ))}
                      </dl>
                    </div>
                  )}
                  {r.ai.actionPlan && (
                    <div>
                      <h3 className="font-semibold text-lg">Your action plan</h3>
                      <ol className="mt-3 space-y-3">
                        {r.ai.actionPlan.map((a, i) => (
                          <li key={i} className="grid grid-cols-[2rem_1fr_auto] gap-3 items-start border-b border-line pb-3">
                            <span className="display text-2xl text-denim">{i + 1}</span>
                            <span><span className="block">{a.step}</span><span className="text-sm text-ink-soft">{a.why}</span></span>
                            <span className="text-xs rounded-full border border-line px-2 py-0.5 capitalize">{a.cost}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {r.ai.crystals && (
                    <div>
                      <h3 className="font-semibold text-lg">Crystals</h3>
                      <ul className="mt-3 grid sm:grid-cols-2 gap-3">
                        {r.ai.crystals.map((c) => (
                          <li key={c.crystal + c.where} className="rounded-xl bg-paper-2 border border-line p-4"><p className="font-medium">{c.crystal}</p><p className="text-sm text-ink-soft">{c.where} — {c.why}</p></li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {r.ai.closing && <p className="script text-4xl">{r.ai.closing}</p>}
                  {rank >= 3 && <button className="btn btn-line print:hidden" onClick={() => window.print()}>Print or save as PDF</button>}
                </article>
              )}
            </section>
          )}

          <section>
            <h2 className="display text-5xl">Room by room</h2>
            <ul className="mt-6 space-y-4">
              {r.rules.findings.map((f) => (
                <li key={f.id} className="rounded-2xl border border-line bg-paper-2 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`text-xs rounded-full px-2.5 py-1 ${verdictStyle[f.verdict].cls}`}>{verdictStyle[f.verdict].label}</span>
                    <span className="text-sm text-ink-soft">{directionInfo[f.direction].name}</span>
                  </div>
                  <p className="font-medium text-lg mt-2">{f.title}</p>
                  <p className="text-ink-soft text-[0.95rem] mt-1">{f.detail}</p>
                  {f.remedies.length > 0 && (
                    <ul className="mt-3 space-y-1.5 text-[0.95rem]">
                      {f.remedies.map((x) => <li key={x} className="pl-4 border-l-2 border-denim">{x}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            {r.hiddenFindings > 0 && (
              <div className="mt-4 relative rounded-2xl border border-line bg-paper-2 p-6 overflow-hidden">
                <div className="space-y-3 blur-[5px] select-none" aria-hidden>
                  <div className="h-4 w-2/3 bg-ink/15 rounded" /><div className="h-3 w-full bg-ink/10 rounded" /><div className="h-3 w-5/6 bg-ink/10 rounded" />
                </div>
                <div className="absolute inset-0 grid place-items-center text-center p-4">
                  <p className="font-medium">{r.hiddenFindings} more finding{r.hiddenFindings > 1 ? "s" : ""} and every remedy unlock with Basic.</p>
                </div>
              </div>
            )}
          </section>

          {rank < 2 && (
            <section className="mt-14 rounded-2xl bg-ink text-paper-2 p-8">
              <p className="display text-4xl">Want it in writing?</p>
              <p className="mt-3 text-paper-2/80 measure">
                With Specialised, the AI reads your {r.hasImages ? "floor plan and photos" : "rooms"} and writes a full report in Sanjay-ji&apos;s five-element method, with an action plan and crystal placements.
              </p>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-8 lg:sticky lg:top-6 self-start print:hidden">
          {upgrades.length > 0 && (
            <div className="rounded-2xl border border-line bg-paper-2 p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-lg">Unlock more</p>
                <CurrencyToggle />
              </div>
              <div className="mt-5 space-y-3">
                {upgrades.map((t) => {
                  const diff = tiers[t].price[currency] - tiers[r.tier].price[currency];
                  const picked = t === chosen;
                  return (
                    <div key={t} className={`rounded-xl p-4 ${t === "specialised" ? "bg-denim text-paper-2" : "bg-paper border border-line"} ${picked ? "ring-2 ring-fire ring-offset-2 ring-offset-paper-2" : ""}`}>
                      {picked && <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${t === "specialised" ? "text-paper-2" : "text-fire"}`}>The plan you chose</p>}
                      <div className="flex justify-between items-baseline gap-2">
                        <p className="font-medium">{tiers[t].name}</p>
                        <p className="display text-2xl">{formatPrice(diff, currency)}</p>
                      </div>
                      <p className={`text-sm mt-1 ${t === "specialised" ? "text-paper-2/85" : "text-ink-soft"}`}>{tiers[t].blurb}</p>
                      <button className={`btn w-full mt-3 !py-2 ${t === "specialised" ? "btn-light" : "btn-ink"}`} disabled={!!paying} onClick={() => upgrade(t)}>
                        {paying === t ? "Opening payment…" : `Unlock ${tiers[t].name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
              {payErr && <p className="text-fire text-sm mt-3" role="alert">{payErr}</p>}
              {payErr?.includes("WhatsApp") && (
                <a className="btn btn-ink w-full mt-3 !py-2" target="_blank" rel="noreferrer" href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Namaste, I'd like to unlock my Vastu report: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}>Message on WhatsApp</a>
              )}
            </div>
          )}

          <Chat reportId={id} initialLeft={r.questionsLeft} onUsed={load} canUpgrade={upgrades.length > 0} />

          <div className="rounded-2xl bg-sage text-paper-2 p-6">
            <p className="script text-4xl">Ask Sanjay-ji</p>
            <p className="mt-2 text-paper-2/90 text-[0.95rem]">Book a session and he&apos;ll go through this report with you{r.tier === "indepth" ? " — your In-depth credit applies" : ""}.</p>
            <Link href={`/book?report=${id}`} className="btn btn-light mt-4 w-full">Book a consultation</Link>
          </div>

          <p className="text-xs text-ink-soft">Keep this page&apos;s link — it is your access to this report. {site.brand}.</p>
        </aside>
      </div>
    </div>
  );
}

function Chat({ reportId, initialLeft, onUsed, canUpgrade }: { reportId: string; initialLeft: number; onUsed: () => void; canUpgrade: boolean }) {
  const [msgs, setMsgs] = useState<{ role: string; content: string }[]>([]);
  const [text, setText] = useState("");
  const [left, setLeft] = useState(initialLeft);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setLeft(initialLeft), [initialLeft]);
  useEffect(() => {
    fetch(`/api/chat?reportId=${reportId}`).then((r) => r.json()).then((j) => setMsgs(j.messages ?? []));
  }, [reportId]);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [msgs]);

  async function send() {
    const q = text.trim();
    if (!q) return;
    setBusy(true);
    setErr(null);
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setText("");
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId, message: q }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setMsgs((m) => [...m, { role: "assistant", content: j.answer }]);
      setLeft(j.questionsLeft);
      onUsed();
    } catch (e) {
      setMsgs((m) => m.slice(0, -1));
      setText(q);
      setErr(e instanceof Error ? e.message : "No answer. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-paper-2 p-6">
      <div className="flex justify-between items-baseline">
        <p className="font-semibold text-lg">Ask the Vastu assistant</p>
        <p className="text-sm text-ink-soft tabular-nums">{left} left</p>
      </div>
      <div ref={box} className="mt-4 max-h-80 overflow-y-auto space-y-3" aria-live="polite">
        {msgs.length === 0 && <p className="text-sm text-ink-soft">Try: &ldquo;What colour should the wall in my north-east be?&rdquo; or &ldquo;My kitchen is in the north — what can I do without moving it?&rdquo;</p>}
        {msgs.map((m, i) => (
          <div key={i} className={`rounded-xl px-3.5 py-2.5 text-[0.95rem] whitespace-pre-line ${m.role === "user" ? "bg-ink text-paper-2 ml-8" : "bg-paper mr-4"}`}>{m.content}</div>
        ))}
        {busy && <div className="bg-paper rounded-xl px-3.5 py-2.5 text-ink-soft text-sm mr-4">Thinking…</div>}
      </div>
      {left > 0 ? (
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <label htmlFor="q" className="sr-only">Your question</label>
          <input id="q" className="field" placeholder="Ask about your space" value={text} onChange={(e) => setText(e.target.value)} disabled={busy} />
          <button className="btn btn-ink shrink-0 !px-4" disabled={busy || !text.trim()}>Ask</button>
        </form>
      ) : (
        <p className="mt-4 text-sm">You&apos;ve used your questions{canUpgrade ? ". Unlock a higher plan above for more." : "."}</p>
      )}
      {err && <p className="text-fire text-sm mt-2" role="alert">{err}</p>}
    </div>
  );
}
