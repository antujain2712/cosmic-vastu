// Deterministic Vastu rules engine. Runs instantly and for free, gives every report its backbone.
// The AI layer (paid tiers) reads the floor plan and writes on top of these results.
// Placement rules are general Vastu practice — Sanjay-ji should review the table below.

import { Direction, Element, ELEMENTS, directionInfo, elementInfo } from "./knowledge";

export type RoomKey =
  | "entrance" | "kitchen" | "masterBedroom" | "bedroom" | "living" | "pooja" | "toilet"
  | "study" | "dining" | "staircase" | "ugTank" | "ohTank" | "store" | "electrical" | "locker" | "balcony"
  | "cabin" | "reception" | "machinery" | "rawMaterial" | "finishedGoods";

export type PropertyType = "home" | "office" | "shop" | "factory" | "hospital" | "plot";

export const roomInfo: Record<
  RoomKey,
  { name: string; best: Direction[]; ok: Direction[]; avoid: Direction[]; element: Element; types: PropertyType[]; why: string }
> = {
  entrance: { name: "Main entrance", best: ["N", "NE", "E"], ok: ["NW", "W"], avoid: ["SW", "S", "SE"], element: "water", types: ["home", "office", "shop", "factory", "hospital"], why: "The entrance is where opportunity flows in." },
  kitchen: { name: "Kitchen", best: ["SE"], ok: ["NW", "S"], avoid: ["NE", "N", "SW", "C"], element: "fire", types: ["home", "office", "hospital"], why: "Cooking is Fire, which belongs to the south-east." },
  masterBedroom: { name: "Master bedroom", best: ["SW"], ok: ["S", "W"], avoid: ["NE", "SE", "C"], element: "earth", types: ["home"], why: "The head of the family needs Earth's stability." },
  bedroom: { name: "Other bedroom", best: ["W", "S"], ok: ["NW", "E", "N"], avoid: ["SE", "NE"], element: "metal", types: ["home"], why: "Rest suits calm, structured zones." },
  living: { name: "Living room", best: ["N", "NE", "E"], ok: ["NW", "W"], avoid: ["SW"], element: "wood", types: ["home"], why: "Where family and friends meet — relationships and openness." },
  pooja: { name: "Pooja / meditation", best: ["NE"], ok: ["E", "N"], avoid: ["S", "SW", "SE", "C"], element: "water", types: ["home", "office", "shop", "factory", "hospital"], why: "The north-east is kept light and sacred." },
  toilet: { name: "Toilet / bathroom", best: ["NW", "W"], ok: ["S", "SE"], avoid: ["NE", "SW", "C", "N", "E"], element: "water", types: ["home", "office", "shop", "factory", "hospital"], why: "Outflow of water should sit where it does not drain opportunity or stability." },
  study: { name: "Study / work desk", best: ["N", "E", "NE"], ok: ["W"], avoid: ["SW", "SE", "S"], element: "wood", types: ["home", "office"], why: "Focus and growth come from the north and east." },
  dining: { name: "Dining", best: ["W", "E"], ok: ["N", "S", "NW"], avoid: ["SW", "C"], element: "metal", types: ["home"], why: "Nourishment and gathering." },
  staircase: { name: "Staircase", best: ["S", "SW", "W"], ok: ["NW", "SE"], avoid: ["NE", "C", "N"], element: "earth", types: ["home", "office", "shop", "factory", "hospital"], why: "Stairs carry weight; weight belongs in the south and west." },
  ugTank: { name: "Underground water tank / borewell", best: ["N", "NE", "E"], ok: ["NW", "W"], avoid: ["SW", "SE", "S", "C"], element: "water", types: ["home", "office", "factory", "hospital", "plot"], why: "Water at ground level belongs in Water's own zone." },
  ohTank: { name: "Overhead water tank", best: ["SW", "W"], ok: ["S", "NW"], avoid: ["NE", "SE", "C"], element: "earth", types: ["home", "office", "factory", "hospital"], why: "A heavy load on top is carried best by Earth's zone." },
  store: { name: "Storage / heavy items", best: ["SW", "S", "W"], ok: ["NW"], avoid: ["NE", "N", "C"], element: "earth", types: ["home", "office", "shop", "factory", "hospital"], why: "Weight grounds the south-west and keeps the north light." },
  electrical: { name: "Electrical panel / inverter / meter", best: ["SE"], ok: ["S", "NW"], avoid: ["NE", "N", "SW"], element: "fire", types: ["home", "office", "shop", "factory", "hospital"], why: "Electricity is Fire." },
  locker: { name: "Cash locker / safe", best: ["N", "SW"], ok: ["W"], avoid: ["NE", "SE", "E"], element: "metal", types: ["home", "office", "shop", "factory"], why: "Wealth quietly secured, not flaunted." },
  balcony: { name: "Balcony / open area", best: ["N", "E", "NE"], ok: ["NW", "W"], avoid: ["SW", "S"], element: "water", types: ["home", "office", "plot"], why: "Openness lets light and air flow from the north and east." },
  cabin: { name: "Owner / director cabin", best: ["SW"], ok: ["S", "W"], avoid: ["NE", "SE", "NW"], element: "earth", types: ["office", "shop", "factory", "hospital"], why: "Authority sits in the zone of stability." },
  reception: { name: "Reception / waiting", best: ["NE", "N", "E"], ok: ["NW"], avoid: ["SW"], element: "wood", types: ["office", "hospital", "shop"], why: "First relationships with visitors form here." },
  machinery: { name: "Heavy machinery", best: ["SW", "S", "W"], ok: ["SE", "NW"], avoid: ["NE", "N", "C"], element: "metal", types: ["factory", "hospital"], why: "Metal and weight belong to the west and south-west." },
  rawMaterial: { name: "Raw material store", best: ["SW", "S"], ok: ["W"], avoid: ["NE", "N"], element: "earth", types: ["factory"], why: "Material waiting to be completed rests in Earth." },
  finishedGoods: { name: "Finished goods / dispatch", best: ["NW"], ok: ["N", "W"], avoid: ["SW", "NE"], element: "metal", types: ["factory", "shop"], why: "The north-west is the zone of movement — goods that should leave quickly." },
};

export type Placement = { room: RoomKey; direction: Direction };

export type Concern = "money" | "relationships" | "energy" | "stability" | "career" | "health" | "sleep";

export const concernInfo: Record<Concern, { label: string; element: Element }> = {
  money: { label: "Cash flow and money", element: "water" },
  relationships: { label: "Family and relationships", element: "wood" },
  energy: { label: "Energy and motivation", element: "fire" },
  stability: { label: "Stability and finishing things", element: "earth" },
  career: { label: "Career, status and capital", element: "metal" },
  health: { label: "Wellbeing", element: "earth" },
  sleep: { label: "Sleep and calm", element: "earth" },
};

export type AnalysisInput = {
  name?: string;
  email?: string;
  propertyType: PropertyType;
  city?: string;
  entranceHeading?: number; // compass degrees, if captured
  placements: Placement[];
  concerns: Concern[];
  clutter?: Partial<Record<Direction, boolean>>; // zones the user marked as cluttered/heavy
  notes?: string;
};

export type Verdict = "best" | "ok" | "avoid";

export type Finding = {
  id: string;
  room: RoomKey;
  roomName: string;
  direction: Direction;
  verdict: Verdict;
  title: string;
  detail: string;
  remedies: string[];
  impact: 1 | 2 | 3; // 3 = highest priority
  cost: "free" | "low" | "medium";
};

export type RulesResult = {
  score: number;
  elementScores: Record<Element, number>;
  weakest: Element;
  strongest: Element;
  findings: Finding[];
  zoneSummary: { direction: Direction; rooms: string[] }[];
};

function verdictFor(room: RoomKey, d: Direction): Verdict {
  const r = roomInfo[room];
  if (r.best.includes(d)) return "best";
  if (r.avoid.includes(d)) return "avoid";
  return "ok";
}

const SUPPORT: Record<Element, Element> = { earth: "metal", metal: "water", water: "wood", wood: "fire", fire: "earth" };

/** If a controls b (or b controls a), the element that sits between them in the supporting cycle. */
export function mediator(a: Element, b: Element): Element | null {
  if (SUPPORT[SUPPORT[a]] === b) return SUPPORT[a];
  if (SUPPORT[SUPPORT[b]] === a) return SUPPORT[b];
  return null;
}

function remediesFor(room: RoomKey, d: Direction, v: Verdict): { list: string[]; cost: Finding["cost"] } {
  const zoneEls = Object.keys(directionInfo[d].elements) as Element[];
  const zoneEl = zoneEls[0];
  const roomEl = roomInfo[room].element;
  const list: string[] = [];
  if (v === "best") {
    list.push(`Keep it. Strengthen it with ${elementInfo[roomEl].colours.toLowerCase()} and ${elementInfo[roomEl].shape.toLowerCase()} forms.`);
    return { list, cost: "free" };
  }
  if (zoneEl) {
    const z = elementInfo[zoneEl];
    list.push(`Support the ${directionInfo[d].name.toLowerCase()} zone's own element, ${z.name}: use ${z.colours.toLowerCase()} and ${z.shape.toLowerCase()} in décor here.`);
  }
  if (d === "C") list.push("Keep the centre of the space as open, light and uncluttered as possible.");
  if (room === "toilet") list.push("Keep the door closed and the space dry and spotless; fix every leak.");
  if (room === "kitchen" && (d === "NE" || d === "N")) list.push("Place the stove so the cook faces east, and keep the sink away from the stove.");
  if (room === "entrance") list.push("Keep the threshold bright, clean and free of shoes and clutter.");
  if (room === "masterBedroom") list.push("Sleep with your head towards the south or east.");
  if (room === "store" || room === "machinery" || room === "ohTank" || room === "rawMaterial") list.push("Move the heaviest items towards the south-west corner where you can.");
  if (room === "electrical") list.push("Keep wiring covered and neat; add a red or triangular accent near the panel.");
  if (zoneEl && roomEl !== zoneEl) {
    const m = mediator(roomEl, zoneEl);
    if (m) {
      const mi = elementInfo[m];
      list.push(
        `${elementInfo[roomEl].name} and ${elementInfo[zoneEl].name} clash here. ${mi.name} bridges them in the supporting cycle, so add a touch of ${mi.name}: ${mi.colours.toLowerCase()}, ${mi.shape.toLowerCase()}.`
      );
    }
  }
  const relocate = roomInfo[room].best.map((x) => directionInfo[x].name.toLowerCase()).join(" or ");
  if (v === "avoid") list.push(`If you are renovating, the ideal zone is the ${relocate}.`);
  return { list, cost: v === "avoid" ? "medium" : "low" };
}

export function runRules(input: AnalysisInput): RulesResult {
  const base: Record<Element, number> = { water: 70, wood: 70, fire: 70, earth: 70, metal: 70 };
  const findings: Finding[] = [];

  input.placements.forEach((p, i) => {
    const r = roomInfo[p.room];
    if (!r) return;
    const v = verdictFor(p.room, p.direction);
    const zoneEls = directionInfo[p.direction].elements;
    const delta = v === "best" ? 6 : v === "ok" ? -2 : -12;
    for (const [el, w] of Object.entries(zoneEls)) base[el as Element] += delta * (w ?? 0);
    base[r.element] += v === "avoid" ? -5 : v === "best" ? 3 : 0;
    const { list, cost } = remediesFor(p.room, p.direction, v);
    const dn = directionInfo[p.direction].name.toLowerCase();
    findings.push({
      id: `f${i}`,
      room: p.room,
      roomName: r.name,
      direction: p.direction,
      verdict: v,
      title:
        v === "best"
          ? `${r.name} in the ${dn} is well placed`
          : v === "ok"
          ? `${r.name} in the ${dn} is acceptable`
          : `${r.name} in the ${dn} disturbs the balance`,
      detail: `${r.why} ${directionInfo[p.direction].name}: ${directionInfo[p.direction].note}`,
      remedies: list,
      impact: v === "avoid" ? 3 : v === "ok" ? 2 : 1,
      cost,
    });
  });

  // Entrance heading from compass
  if (input.entranceHeading !== undefined && !input.placements.some((p) => p.room === "entrance")) {
    // handled by caller converting heading to a placement; nothing here
  }

  // Clutter in zones weakens that zone's elements (and NE/C clutter is serious)
  for (const [d, on] of Object.entries(input.clutter ?? {})) {
    if (!on) continue;
    const dir = d as Direction;
    for (const [el, w] of Object.entries(directionInfo[dir].elements)) base[el as Element] -= 8 * (w ?? 0);
    const serious = dir === "NE" || dir === "C" || dir === "N";
    findings.push({
      id: `c-${d}`,
      room: "store",
      roomName: "Clutter",
      direction: dir,
      verdict: serious ? "avoid" : "ok",
      title: `Clutter in the ${directionInfo[dir].name.toLowerCase()}`,
      detail: `Stagnant, heavy or unused things block the flow of the ${directionInfo[dir].name.toLowerCase()} zone. ${directionInfo[dir].name}: ${directionInfo[dir].note}`,
      remedies: ["Clear out what you don't use. This is the cheapest, fastest Vastu fix there is.", ...(dir === "SW" ? ["Here, keep the weight but make it orderly: heavy, closed storage is fine."] : [])],
      impact: serious ? 3 : 2,
      cost: "free",
    });
  }

  // Concerns: nudge the related element down (the user feels its absence)
  for (const c of input.concerns) base[concernInfo[c].element] -= 4;

  const elementScores = Object.fromEntries(
    ELEMENTS.map((e) => [e, Math.max(5, Math.min(100, Math.round(base[e])))])
  ) as Record<Element, number>;

  const sorted = [...ELEMENTS].sort((a, b) => elementScores[a] - elementScores[b]);
  const vals = ELEMENTS.map((e) => elementScores[e]);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const spread = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
  // Balance is the point: penalise spread, not just low averages
  const score = Math.max(5, Math.min(100, Math.round(mean - spread * 0.6)));

  findings.sort((a, b) => b.impact - a.impact);

  const zoneMap = new Map<Direction, string[]>();
  for (const p of input.placements) {
    zoneMap.set(p.direction, [...(zoneMap.get(p.direction) ?? []), roomInfo[p.room]?.name ?? p.room]);
  }

  return {
    score,
    elementScores,
    weakest: sorted[0],
    strongest: sorted[sorted.length - 1],
    findings,
    zoneSummary: [...zoneMap.entries()].map(([direction, rooms]) => ({ direction, rooms })),
  };
}

export function roomsFor(type: PropertyType): RoomKey[] {
  return (Object.keys(roomInfo) as RoomKey[]).filter((k) => roomInfo[k].types.includes(type));
}
