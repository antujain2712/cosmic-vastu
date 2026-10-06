"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { roomInfo, roomsFor, RoomKey, PropertyType, Placement, Concern, concernInfo } from "@/lib/rules";
import { tiers, Tier } from "@/config/site";
import { Direction, directionInfo, headingToDirection, elementInfo, ELEMENTS } from "@/lib/knowledge";
import { compressImage } from "@/lib/image";
import { CameraCompass } from "@/components/CameraCompass";

const TYPES: { k: PropertyType; label: string }[] = [
  { k: "home", label: "Home" },
  { k: "office", label: "Office" },
  { k: "shop", label: "Shop" },
  { k: "factory", label: "Factory or warehouse" },
  { k: "hospital", label: "Hospital or clinic" },
];

// Vastu grid, north at the top
const GRID: Direction[] = ["NW", "N", "NE", "W", "C", "E", "SW", "S", "SE"];
const zoneColour = (d: Direction) => {
  const e = ELEMENTS.find((x) => elementInfo[x].direction === d);
  return e ? elementInfo[e].hex : undefined;
};

const STEPS = ["Your space", "Main door", "Floor plan", "Rooms", "Review"];

function Analyze() {
  const router = useRouter();
  const sp = useSearchParams();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<PropertyType>("home");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [heading, setHeading] = useState<number | undefined>();
  const [door, setDoor] = useState<Direction | null>(null);
  const [doorPhoto, setDoorPhoto] = useState<string | null>(null);
  const [camera, setCamera] = useState(false);
  const [plans, setPlans] = useState<string[]>([]);
  const [northAt, setNorthAt] = useState<"top" | "right" | "bottom" | "left">("top");
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [activeRoom, setActiveRoom] = useState<RoomKey | null>(null);
  const [clutter, setClutter] = useState<Partial<Record<Direction, boolean>>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const d = sp.get("door") as Direction | null;
    if (d && d in directionInfo) setDoor(d);
    const c = (sp.get("concerns") ?? "").split(",").filter((x) => x in concernInfo) as Concern[];
    if (c.length) setConcerns(c);
  }, [sp]);

  // each step starts at the top, not wherever the last one was scrolled to
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // plan picked on the pricing cards; carried through to the report so it can be unlocked there
  const planParam = sp.get("plan");
  const plan = planParam && planParam !== "free" && planParam in tiers ? (planParam as Tier) : null;

  const rooms = useMemo(() => roomsFor(type).filter((r) => r !== "entrance"), [type]);

  const allPlacements: Placement[] = useMemo(
    () => (door ? [{ room: "entrance" as RoomKey, direction: door }, ...placements.filter((p) => p.room !== "entrance")] : placements),
    [door, placements]
  );

  async function addPlans(files: FileList | null) {
    if (!files) return;
    setErr(null);
    try {
      const out: string[] = [];
      for (const f of Array.from(files).slice(0, 4 - plans.length)) out.push(await compressImage(f));
      setPlans((p) => [...p, ...out].slice(0, 4));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't read that file.");
    }
  }

  async function detect() {
    if (!plans[0]) return;
    setDetecting(true);
    setDetectMsg(null);
    try {
      const res = await fetch("/api/detect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: plans[0], northAt, propertyType: type }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      if (j.placements?.length) {
        setPlacements((cur) => {
          const merged = [...cur];
          for (const p of j.placements as Placement[]) {
            if (p.room === "entrance") { if (!door) setDoor(p.direction); continue; }
            if (!merged.some((m) => m.room === p.room && m.direction === p.direction)) merged.push(p);
          }
          return merged;
        });
        setDetectMsg(`Found ${j.placements.length} rooms. Check them on the grid in the next step. ${j.observations ?? ""}`);
      } else {
        setDetectMsg(j.observations || "No rooms found. Add them by hand in the next step.");
      }
    } catch (e) {
      setDetectMsg(e instanceof Error ? e.message : "Detection failed. Add rooms by hand.");
    } finally {
      setDetecting(false);
    }
  }

  function place(d: Direction) {
    if (!activeRoom) return;
    setPlacements((p) => [...p, { room: activeRoom, direction: d }]);
    // single-instance rooms deselect after placing
    if (!["toilet", "bedroom", "balcony", "store"].includes(activeRoom)) setActiveRoom(null);
  }

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { name, email: email || undefined, propertyType: type, city, entranceHeading: heading, placements: allPlacements, concerns, clutter, notes },
          images: [...plans, ...(doorPhoto ? [doorPhoto] : [])],
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      router.push(`/report/${j.id}${plan ? `?plan=${plan}` : ""}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  const canNext = [true, true, true, allPlacements.length > 0, true][step];

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <h1 className="display text-[clamp(3rem,9vw,6rem)]">Analyse your space</h1>
      {plan && (
        <p className="mt-4 measure rounded-xl border border-denim/40 bg-denim-pale/40 px-4 py-3 text-[0.95rem]">
          You chose <span className="font-semibold">{tiers[plan].name}</span>. First, tell us about your space. Your free result comes
          next, and you unlock {tiers[plan].name} right there.
        </p>
      )}
      <ol className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button onClick={() => i < step && setStep(i)} className={`${i === step ? "font-semibold text-ink" : i < step ? "underline underline-offset-4 text-ink-soft" : "text-ink-soft/60"}`} aria-current={i === step ? "step" : undefined}>
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-10 min-h-[24rem]">
        {step === 0 && (
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <p className="label">What kind of space?</p>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((t) => (
                  <button key={t.k} onClick={() => setType(t.k)} className={`rounded-xl border-2 px-4 py-3 text-left ${type === t.k ? "border-denim bg-denim-pale/40" : "border-line bg-paper-2"}`}>{t.label}</button>
                ))}
              </div>
              <p className="label mt-8">What would you like to improve?</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(concernInfo) as Concern[]).map((c) => {
                  const on = concerns.includes(c);
                  return (
                    <button key={c} aria-pressed={on} onClick={() => setConcerns((x) => (on ? x.filter((y) => y !== c) : [...x, c]))} className={`rounded-full border px-4 py-1.5 text-sm ${on ? "bg-ink text-paper-2 border-ink" : "border-line bg-paper-2"}`}>
                      {concernInfo[c].label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-4">
              <div><label className="label" htmlFor="nm">Your name</label><input id="nm" className="field" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div>
                <label className="label" htmlFor="em">Email</label>
                <input id="em" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
                <p className="text-xs text-ink-soft mt-1">We send your report link here so you don&apos;t lose it.</p>
              </div>
              <div><label className="label" htmlFor="ct">City</label><input id="ct" className="field" value={city} onChange={(e) => setCity(e.target.value)} /></div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="display text-4xl">Which way does the main door face?</h2>
              <p className="mt-3 text-ink-soft measure">Stand in the doorway, looking out. That is the direction the door faces. On your phone, the camera and compass read it for you.</p>
              <button className="btn btn-ink mt-6" onClick={() => setCamera(true)}>Open camera compass</button>
              {doorPhoto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={doorPhoto} alt="Your main door" className="mt-6 w-48 rounded-lg" />
              )}
            </div>
            <div>
              <p className="label">Or choose it</p>
              <div className="grid grid-cols-3 gap-2 max-w-xs">
                {GRID.map((d) =>
                  d === "C" ? (
                    <div key={d} className="aspect-square grid place-items-center text-xs text-ink-soft">Door faces</div>
                  ) : (
                    <button key={d} onClick={() => { setDoor(d); setHeading(undefined); }} aria-pressed={door === d} className={`aspect-square rounded-xl border-2 display text-2xl ${door === d ? "bg-ink text-paper-2 border-ink" : "border-line bg-paper-2"}`}>{d}</button>
                  )
                )}
              </div>
              {door && (
                <p className="mt-5 measure">
                  <span className="font-medium">{directionInfo[door].name}{heading !== undefined ? ` (${Math.round(heading)}°)` : ""}.</span>{" "}
                  <span className="text-ink-soft">{directionInfo[door].note}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="display text-4xl">Add your floor plan</h2>
              <p className="mt-3 text-ink-soft measure">An architect&apos;s plan, a builder&apos;s brochure, or a photo of a hand sketch. You can add room photos too — up to four images.</p>
              <label className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-paper-2 p-8 text-center cursor-pointer hover:border-denim">
                <span className="font-medium">Choose images</span>
                <span className="text-sm text-ink-soft">JPG, PNG or WebP</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addPlans(e.target.files)} />
              </label>
              {plans.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {plans.map((p, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p} alt={`Upload ${i + 1}`} className="h-24 w-24 object-cover rounded-lg border border-line" />
                      <button onClick={() => setPlans((x) => x.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 bg-ink text-paper-2 rounded-full w-6 h-6 text-sm" aria-label={`Remove upload ${i + 1}`}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-6 text-sm text-ink-soft">No plan? Skip this step and mark rooms on the grid.</p>
            </div>
            <div>
              <p className="label">Where is north on your plan?</p>
              <div className="flex gap-2">
                {(["top", "right", "bottom", "left"] as const).map((n) => (
                  <button key={n} onClick={() => setNorthAt(n)} aria-pressed={northAt === n} className={`rounded-full border px-4 py-1.5 text-sm capitalize ${northAt === n ? "bg-ink text-paper-2 border-ink" : "border-line bg-paper-2"}`}>{n}</button>
                ))}
              </div>
              <p className="text-xs text-ink-soft mt-2">If the plan has a north arrow, we follow the arrow.</p>
              <button className="btn btn-ink mt-6" disabled={!plans.length || detecting} onClick={detect}>
                {detecting ? "Reading your plan…" : "Find rooms on my plan"}
              </button>
              {detectMsg && <p className="mt-4 measure text-[0.95rem] bg-paper-2 border border-line rounded-xl p-4">{detectMsg}</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid md:grid-cols-[1fr_1.1fr] gap-10">
            <div>
              <h2 className="display text-4xl">Place each room</h2>
              <p className="mt-3 text-ink-soft">Pick a room, then tap the zone where it sits. North is at the top.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {rooms.map((r) => (
                  <button key={r} onClick={() => setActiveRoom(activeRoom === r ? null : r)} aria-pressed={activeRoom === r} className={`rounded-full border px-3.5 py-1.5 text-sm ${activeRoom === r ? "bg-denim text-paper-2 border-denim" : "border-line bg-paper-2"}`}>
                    {roomInfo[r].name}
                  </button>
                ))}
              </div>
              <p className="label mt-8">Any zone cluttered or crammed with heavy things?</p>
              <div className="flex flex-wrap gap-2">
                {GRID.map((d) => (
                  <button key={d} aria-pressed={!!clutter[d]} onClick={() => setClutter((c) => ({ ...c, [d]: !c[d] }))} className={`rounded-full border px-3 py-1 text-sm ${clutter[d] ? "bg-earth text-paper-2 border-earth" : "border-line bg-paper-2"}`}>
                    {directionInfo[d].name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="grid grid-cols-3 gap-1.5 bg-ink/80 p-1.5 rounded-2xl" role="grid" aria-label="Vastu grid, north at the top">
                {GRID.map((d) => {
                  const here = allPlacements.map((p, i) => ({ p, i })).filter(({ p }) => p.direction === d);
                  const col = zoneColour(d);
                  return (
                    <div key={d} role="gridcell" className={`relative aspect-square rounded-xl bg-paper-2 p-2 flex flex-col ${activeRoom ? "cursor-pointer hover:ring-2 ring-denim" : ""}`} onClick={() => place(d)} style={col ? { boxShadow: `inset 0 4px 0 ${col}` } : undefined}>
                      <span className="display text-lg leading-none" style={{ color: col ?? "#4a4f57" }}>{d}</span>
                      {clutter[d] && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-earth" title="Cluttered" />}
                      <div className="mt-1 flex flex-col gap-1 overflow-auto text-[0.7rem] sm:text-xs leading-tight">
                        {here.map(({ p, i }) => (
                          <span key={i} className="flex items-center justify-between gap-1 bg-paper rounded px-1.5 py-0.5">
                            <span className="truncate">{roomInfo[p.room].name}</span>
                            <button aria-label={`Remove ${roomInfo[p.room].name}`} onClick={(e) => { e.stopPropagation(); if (p.room === "entrance") setDoor(null); else setPlacements((x) => x.filter((y) => !(y.room === p.room && y.direction === p.direction))); }} className="text-ink-soft hover:text-fire">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-ink-soft">{allPlacements.length} placed{activeRoom ? ` · placing ${roomInfo[activeRoom].name}` : ""}</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="display text-4xl">Anything else Sanjay-ji should know?</h2>
              <textarea className="field mt-4 min-h-36" placeholder="e.g. We moved in last year; business slowed down since. The plot slopes towards the south." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="bg-paper-2 border border-line rounded-2xl p-6 space-y-2 text-[0.95rem]">
              <p><span className="text-ink-soft">Space:</span> {TYPES.find((t) => t.k === type)?.label}{city ? `, ${city}` : ""}</p>
              <p><span className="text-ink-soft">Main door:</span> {door ? directionInfo[door].name : "not set"}</p>
              <p><span className="text-ink-soft">Rooms placed:</span> {allPlacements.length}</p>
              <p><span className="text-ink-soft">Images:</span> {plans.length + (doorPhoto ? 1 : 0)}</p>
              <p><span className="text-ink-soft">Improving:</span> {concerns.map((c) => concernInfo[c].label.toLowerCase()).join(", ") || "—"}</p>
              <button className="btn btn-ink w-full !mt-6" disabled={busy || allPlacements.length === 0} onClick={submit}>
                {busy ? "Balancing your elements…" : "See my free result"}
              </button>
              {allPlacements.length === 0 && <p className="text-sm text-fire">Place at least one room first.</p>}
            </div>
          </div>
        )}
      </div>

      {err && <p className="mt-6 text-fire" role="alert">{err}</p>}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <button className="btn btn-line" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</button>
        {step < STEPS.length - 1 && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {!canNext && step === 3 && <p className="text-sm text-ink-soft">Place at least one room to continue.</p>}
            <button className="btn btn-ink" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              {step === 2 && plans.length === 0 ? "Skip — no plan" : "Continue"}
            </button>
          </div>
        )}
      </div>

      {camera && (
        <CameraCompass
          onClose={() => setCamera(false)}
          onCapture={(h, photo) => {
            if (h !== null) { setHeading(h); setDoor(headingToDirection(h)); }
            if (photo) setDoorPhoto(photo);
            setCamera(false);
          }}
        />
      )}
    </section>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense>
      <Analyze />
    </Suspense>
  );
}
