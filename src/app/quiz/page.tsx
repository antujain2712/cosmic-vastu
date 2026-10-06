"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ELEMENTS, Element, elementInfo, directionInfo, headingToDirection, Direction } from "@/lib/knowledge";
import { ElementBars } from "@/components/ElementBars";
import { CompassRose, useHeading } from "@/components/Compass";
import { mediator } from "@/lib/rules";

type Q = { id: string; q: string; el: Element; options: { t: string; v: number }[] };

const QUESTIONS: Q[] = [
  { id: "w1", el: "water", q: "How does money move for you right now?", options: [{ t: "It flows in and out easily", v: 3 }, { t: "Steady, but slow", v: 2 }, { t: "It comes in and leaves just as fast", v: 1 }, { t: "Stuck — payments are delayed", v: 0 }] },
  { id: "w2", el: "water", q: "When an opportunity appears, you…", options: [{ t: "Usually catch it", v: 3 }, { t: "Think about it for a long time", v: 2 }, { t: "Notice it after it's gone", v: 1 }, { t: "Opportunities rarely appear", v: 0 }] },
  { id: "d1", el: "wood", q: "How are the relationships at home, or in your team?", options: [{ t: "Warm and easy", v: 3 }, { t: "Mostly fine, some friction", v: 2 }, { t: "Tense more often than not", v: 1 }, { t: "Distant or broken", v: 0 }] },
  { id: "d2", el: "wood", q: "Do you feel supported by the people around you?", options: [{ t: "Yes, I can count on them", v: 3 }, { t: "By a few people", v: 2 }, { t: "I mostly manage alone", v: 1 }, { t: "Not at all", v: 0 }] },
  { id: "f1", el: "fire", q: "What is your energy like through the day?", options: [{ t: "Strong from morning to evening", v: 3 }, { t: "Good, with an afternoon dip", v: 2 }, { t: "Low most days", v: 1 }, { t: "Restless — busy but not productive", v: 0 }] },
  { id: "f2", el: "fire", q: "How easily do your ideas turn into action?", options: [{ t: "I act quickly", v: 3 }, { t: "With some push", v: 2 }, { t: "I plan a lot and act little", v: 1 }, { t: "I struggle to start", v: 0 }] },
  { id: "e1", el: "earth", q: "Do you finish what you start?", options: [{ t: "Almost always", v: 3 }, { t: "Most things", v: 2 }, { t: "Many things stay half-done", v: 1 }, { t: "Rarely", v: 0 }] },
  { id: "e2", el: "earth", q: "How settled do you feel in your home or workplace?", options: [{ t: "Grounded and calm", v: 3 }, { t: "Mostly settled", v: 2 }, { t: "Unsettled, I sleep poorly", v: 1 }, { t: "I want to leave", v: 0 }] },
  { id: "m1", el: "metal", q: "How clear are you about your direction and your identity?", options: [{ t: "Very clear", v: 3 }, { t: "Fairly clear", v: 2 }, { t: "Confused right now", v: 1 }, { t: "Lost", v: 0 }] },
  { id: "m2", el: "metal", q: "Do your savings and assets grow and stay?", options: [{ t: "They grow steadily", v: 3 }, { t: "They stay about the same", v: 2 }, { t: "They slowly drain away", v: 1 }, { t: "I have nothing put aside", v: 0 }] },
];

const NE_OPTIONS: { t: string; effect: Partial<Record<Element, number>> }[] = [
  { t: "Open, light, or a pooja space", effect: { water: 2, wood: 1 } },
  { t: "A living room or bedroom", effect: {} },
  { t: "A kitchen", effect: { water: -2 } },
  { t: "A toilet or bathroom", effect: { water: -3, wood: -1 } },
  { t: "Storage, heavy furniture or clutter", effect: { water: -2 } },
  { t: "I don't know", effect: {} },
];

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [ne, setNe] = useState<number | null>(null);
  const [door, setDoor] = useState<Direction | null>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<"idle" | "sending" | "done" | "error">("idle");
  const { heading, status, start } = useHeading();

  const total = QUESTIONS.length + 2;
  const done = step >= total;

  const scores = useMemo(() => {
    const raw = Object.fromEntries(ELEMENTS.map((e) => [e, 0])) as Record<Element, number>;
    for (const q of QUESTIONS) raw[q.el] += answers[q.id] ?? 1.5;
    if (ne !== null) for (const [e, v] of Object.entries(NE_OPTIONS[ne].effect)) raw[e as Element] += v ?? 0;
    if (door) {
      if (["N", "NE", "E"].includes(door)) raw.water += 1;
      if (["SW", "S"].includes(door)) raw.earth -= 1;
    }
    return Object.fromEntries(ELEMENTS.map((e) => [e, Math.max(8, Math.min(100, Math.round(20 + (raw[e] / 6) * 80)))])) as Record<Element, number>;
  }, [answers, ne, door]);

  const weakest = [...ELEMENTS].sort((a, b) => scores[a] - scores[b])[0];
  const strongest = [...ELEMENTS].sort((a, b) => scores[b] - scores[a])[0];

  const pick = (id: string, v: number) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    setStep((s) => s + 1);
  };

  async function saveLead() {
    setSent("sending");
    const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, source: "quiz", data: { scores, weakest, door } }) });
    setSent(res.ok ? "done" : "error");
  }

  const concerns = ELEMENTS.filter((e) => scores[e] < 55).map((e) => ({ water: "money", wood: "relationships", fire: "energy", earth: "stability", metal: "career" })[e]);
  const analyseHref = `/analyze?${new URLSearchParams({ ...(door ? { door } : {}), concerns: concerns.join(",") }).toString()}`;

  if (done) {
    const w = elementInfo[weakest];
    const m = mediator(weakest, strongest);
    return (
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-14">
        <p className="text-ink-soft">Your element check</p>
        <h1 className="display text-[clamp(3rem,9vw,6rem)] mt-1">
          Your weakest element is <span style={{ color: w.hex }}>{w.name}</span>
        </h1>
        <div className="mt-10 grid md:grid-cols-[1.2fr_1fr] gap-10 items-start">
          <ElementBars scores={scores} weakest={weakest} />
          <div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              <Image src={w.image} alt="" fill className="object-cover" sizes="40vw" />
              <p className="script absolute bottom-3 left-4 text-5xl text-paper-2 drop-shadow">{directionInfo[w.direction].script}</p>
            </div>
            <p className="mt-5 text-lg">&ldquo;{w.message}&rdquo;</p>
            <p className="mt-2 text-ink-soft">{w.lifeArea}.</p>
          </div>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-px bg-line rounded-xl overflow-hidden">
          <div className="bg-paper-2 p-6">
            <p className="font-medium">Strengthen it this week</p>
            <p className="mt-2 text-ink-soft text-[0.95rem]">
              In the {directionInfo[w.direction].name.toLowerCase()} of your home, bring in {w.colours.toLowerCase()} and {w.shape.toLowerCase()} shapes. Clear any clutter there first.
            </p>
          </div>
          <div className="bg-paper-2 p-6">
            <p className="font-medium">Use the supporting cycle</p>
            <p className="mt-2 text-ink-soft text-[0.95rem]">
              {m
                ? `Your strongest element, ${elementInfo[strongest].name}, works against ${w.name}. A touch of ${elementInfo[m].name} (${elementInfo[m].colours.toLowerCase()}) bridges them.`
                : `${elementInfo[strongest].name} is your strongest element. Keep it, and let it feed the elements next to it.`}
            </p>
          </div>
          <div className="bg-paper-2 p-6">
            <p className="font-medium">Crystals for {w.name}</p>
            <p className="mt-2 text-ink-soft text-[0.95rem]">{w.crystals.join(", ")}. Place one in the {directionInfo[w.direction].name.toLowerCase()}.</p>
          </div>
        </div>

        <div className="mt-12 rounded-2xl bg-denim text-paper-2 p-8 md:p-10 grid md:grid-cols-[1.3fr_1fr] gap-8 items-center">
          <div>
            <p className="display text-4xl">This is how you feel. Now check how your space is laid out.</p>
            <p className="mt-3 text-paper-2/85">Mark your rooms or upload your floor plan. Your answers carry over.</p>
          </div>
          <Link href={analyseHref} className="btn btn-light">Analyse my space</Link>
        </div>

        <div className="mt-10 max-w-lg">
          <label className="label" htmlFor="lead">Email me these results and Sanjay-ji&apos;s monthly balance notes</label>
          {sent === "done" ? (
            <p className="text-sage-deep font-medium">Sent. Check your inbox.</p>
          ) : (
            <div className="flex gap-2">
              <input id="lead" type="email" className="field" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn btn-ink shrink-0" disabled={!email || sent === "sending"} onClick={saveLead}>Send</button>
            </div>
          )}
          {sent === "error" && <p className="text-fire text-sm mt-2">Check the email address and try again.</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-14 min-h-[70vh]">
      <div className="flex items-center gap-4">
        <div className="h-1.5 flex-1 rounded-full bg-ink/10 overflow-hidden">
          <div className="h-full bg-denim transition-[width] duration-300" style={{ width: `${(step / total) * 100}%` }} />
        </div>
        <span className="text-sm text-ink-soft tabular-nums">{step + 1} of {total}</span>
      </div>

      {step < QUESTIONS.length && (() => {
        const q = QUESTIONS[step];
        return (
          <div key={q.id} className="rise">
            <h1 className="display text-[clamp(2.4rem,6vw,4rem)] mt-10">{q.q}</h1>
            <div className="mt-8 grid gap-3">
              {q.options.map((o) => (
                <button key={o.t} onClick={() => pick(q.id, o.v)} className={`text-left rounded-xl border-2 px-5 py-4 text-lg hover:border-denim transition-colors ${answers[q.id] === o.v ? "border-denim bg-denim-pale/40" : "border-line bg-paper-2"}`}>
                  {o.t}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {step === QUESTIONS.length && (
        <div className="rise">
          <h1 className="display text-[clamp(2.4rem,6vw,4rem)] mt-10">What is in the north-east corner of your home?</h1>
          <p className="mt-3 text-ink-soft">Traditionally the lightest, most sacred zone.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {NE_OPTIONS.map((o, i) => (
              <button key={o.t} onClick={() => { setNe(i); setStep((s) => s + 1); }} className="text-left rounded-xl border-2 border-line bg-paper-2 px-5 py-4 hover:border-denim">
                {o.t}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === QUESTIONS.length + 1 && (
        <div className="rise">
          <h1 className="display text-[clamp(2.4rem,6vw,4rem)] mt-10">Which way does your main door face?</h1>
          <p className="mt-3 text-ink-soft">Stand in the doorway looking out, with your phone flat in front of you.</p>
          <div className="mt-6 grid sm:grid-cols-[auto_1fr] gap-8 items-center">
            <div className="bg-denim rounded-2xl p-4 w-fit">
              <CompassRose heading={heading ?? 0} size={240} highlight={door ?? (heading !== null ? headingToDirection(heading) : null)} />
            </div>
            <div>
              {status === "live" && heading !== null ? (
                <button className="btn btn-ink" onClick={() => { setDoor(headingToDirection(heading)); setStep((s) => s + 1); }}>
                  Use {directionInfo[headingToDirection(heading)].name} ({Math.round(heading)}°)
                </button>
              ) : (
                <button className="btn btn-ink" onClick={start} disabled={status === "asking"}>
                  {status === "asking" ? "Reading the compass…" : "Read it with my phone"}
                </button>
              )}
              {(status === "unsupported" || status === "denied") && <p className="text-sm text-ink-soft mt-3">No compass on this device. Pick the direction below.</p>}
              <p className="mt-6 text-sm text-ink-soft">Or choose it:</p>
              <div className="mt-2 grid grid-cols-4 gap-2 max-w-xs">
                {(["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as Direction[]).map((d) => (
                  <button key={d} onClick={() => { setDoor(d); setStep((s) => s + 1); }} className="rounded-lg border border-line bg-paper-2 py-2 hover:border-denim">{d}</button>
                ))}
              </div>
              <button onClick={() => setStep((s) => s + 1)} className="mt-4 text-sm underline underline-offset-4">I don&apos;t know — skip</button>
            </div>
          </div>
        </div>
      )}

      {step > 0 && (
        <button onClick={() => setStep((s) => s - 1)} className="mt-10 text-sm underline underline-offset-4 text-ink-soft">Back</button>
      )}
    </section>
  );
}
