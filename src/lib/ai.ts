import Anthropic from "@anthropic-ai/sdk";
import { models, tiers, Tier, site } from "@/config/site";
import {
  elementInfo, directionInfo, supportingCycle, balancePrinciple, philosophy, presences, hospitalMapping,
  ELEMENTS, DIRECTIONS, Direction, Element,
} from "./knowledge";
import { roomInfo, RoomKey, Placement, concernInfo, mediator } from "./rules";
import type { AIReport, Report, ChatMessage } from "./db";
import { loadUpload } from "./db";

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);
const client = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Sanjay-ji's method, compiled into a system prompt. */
export function knowledgePrompt() {
  const els = ELEMENTS.map((e) => {
    const i = elementInfo[e];
    return `- ${i.name} — direction ${directionInfo[i.direction].name} (${i.sanskrit}); shape: ${i.shape}; colours: ${i.colours}; qualities: ${i.qualities.join(", ")}; life area: ${i.lifeArea}; message: "${i.message}". Teaching: ${i.teaching}`;
  }).join("\n");
  const dirs = DIRECTIONS.map((d) => `- ${directionInfo[d].name}: ${directionInfo[d].note}${directionInfo[d].confirmed ? "" : " (general practice)"}`).join("\n");
  const rooms = (Object.keys(roomInfo) as RoomKey[]).map((k) => {
    const r = roomInfo[k];
    const n = (ds: Direction[]) => ds.map((d) => directionInfo[d].name).join(", ");
    return `- ${r.name}: best ${n(r.best)}; acceptable ${n(r.ok)}; avoid ${n(r.avoid)}. ${r.why}`;
  }).join("\n");
  const pres = Object.values(presences).map((p) => `- ${p.title}: ${p.items.join("; ")}`).join("\n");

  return `You are the Vastu assistant of ${site.brand}, the practice of ${site.consultant}, a Vastu Shastra consultant since ${site.since} with ${site.consultations} consultations. You speak in his method, warmly and plainly, for people who are new to Vastu.

HIS METHOD: ${philosophy.method.join(" → ")}. ${balancePrinciple.text}
${balancePrinciple.life}
${philosophy.choice}

THE FIVE ELEMENTS (his system — follow it exactly):
${els}

SUPPORTING CYCLE:
${supportingCycle.map((s) => "- " + s.how).join("\n")}
When two elements clash (one controls the other), the element between them in the supporting cycle bridges them.

DIRECTIONS:
${dirs}

ROOM PLACEMENT GUIDE:
${rooms}

WHAT BELONGS TO EACH ELEMENT IN A SPACE (the six presences):
${pres}
In a hospital: ${hospitalMapping.map((h) => `${elementInfo[h.element].name} = ${h.covers}`).join("; ")}.

RULES FOR YOU:
- Prefer remedies that need no demolition: colour, shape, material, placement, lighting, decluttering, crystals. Mention renovation only as a last resort.
- Never frighten people. No predictions of illness, death, divorce or ruin. Vastu supports balance; it does not curse.
- You are not a structural engineer, doctor or financial adviser. Say so if asked about those.
- For anything complex (plots, factories, full renovations, serious problems), recommend a consultation with ${site.consultant}.
- Use Indian English. Keep answers short unless asked for depth.`;
}

async function imageBlocks(names: string[]) {
  const out: Anthropic.ImageBlockParam[] = [];
  for (const n of names.slice(0, 10)) {
    const img = await loadUpload(n);
    if (img) out.push({ type: "image", source: { type: "base64", media_type: img.mediaType as "image/jpeg", data: img.data } });
  }
  return out;
}

function parseJSON<T>(text: string): T | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

const textOf = (m: Anthropic.Message) => m.content.map((c) => (c.type === "text" ? c.text : "")).join("");

// ---------- 1. Detect rooms from a floor plan (cheap model, before purchase) ----------

export async function detectRooms(
  images: string[],
  northAt: "top" | "right" | "bottom" | "left",
  propertyType: string
): Promise<{ placements: Placement[]; observations: string; demo: boolean }> {
  if (!aiEnabled() || images.length === 0) {
    return { placements: [], observations: "Room detection needs the AI key. Add rooms by hand below.", demo: true };
  }
  const roomKeys = Object.keys(roomInfo).join(", ");
  const msg = await client().messages.create({
    model: models.detect,
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: [
          ...(await imageBlocks(images)),
          {
            type: "text",
            text: `This is a floor plan of a ${propertyType}. The user says north is at the ${northAt} of the image (if a north arrow is drawn, trust the arrow instead).
Divide the plan into a 3×3 grid of zones: N, NE, E, SE, S, SW, W, NW and C (centre), oriented to true north.
For each room you can identify, say which zone its centre falls in.
Use only these room keys: ${roomKeys}.
Reply with JSON only: {"placements":[{"room":"kitchen","direction":"SE"}],"observations":"one or two sentences on what you could and could not read"}`,
          },
        ],
      },
    ],
  });
  const j = parseJSON<{ placements: Placement[]; observations: string }>(textOf(msg));
  const valid = (j?.placements ?? []).filter(
    (p) => p.room in roomInfo && (DIRECTIONS as string[]).includes(p.direction)
  );
  return { placements: valid, observations: j?.observations ?? "", demo: false };
}

// ---------- 2. Full written report (after purchase) ----------

export async function generateReport(r: Report): Promise<AIReport> {
  if (!aiEnabled()) return demoReport(r);
  const tier = r.tier;
  const deep = tier === "indepth";
  const facts = reportFacts(r);
  const msg = await client().messages.create({
    model: models.report,
    max_tokens: deep ? 6000 : 3500,
    system: knowledgePrompt(),
    messages: [
      {
        role: "user",
        content: [
          ...(await imageBlocks(r.images)),
          {
            type: "text",
            text: `Write a ${tiers[tier].name} Vastu report for this client.

CLIENT AND RULES-ENGINE RESULTS:
${facts}

${r.images.length ? "The images are the client's floor plan and/or photos. Photos with a dark strip along the bottom were taken on the site with the phone compass: the strip names the room, its zone and the heading, and the red needle points north. Read them carefully: look for the entrance, kitchen, toilets, staircase, heavy items, clutter, light and anything the room list missed. Note anything that contradicts the client's own room list." : "No images were provided."}

Reply with JSON only, in this shape:
{
 "summary": "3-4 sentences: overall balance, the most important thing to fix, the most encouraging thing",
 ${r.images.length ? '"floorPlanReading": "what you see in the plan/photos, zone by zone, 4-8 sentences",' : ""}
 "elementNarrative": {"water":"2-3 sentences","wood":"...","fire":"...","earth":"...","metal":"..."},
 ${deep ? '"lifeAreas": {"cash flow":"...","relationships":"...","action and energy":"...","stability and completion":"...","capital and status":"..."},' : ""}
 "actionPlan": [{"step":"specific thing to do","why":"which element/zone it balances","cost":"free | low | medium"}],
 "crystals": [{"crystal":"name","where":"zone/room","why":"short reason"}],
 "closing": "one warm line in Sanjay-ji's voice"
}
actionPlan: ${deep ? "8-12 steps ordered by impact, free fixes first within each impact level" : "5-7 steps"}. crystals: 3-5 entries.`,
          },
        ],
      },
    ],
  });
  const j = parseJSON<Omit<AIReport, "generatedBy" | "generatedAt">>(textOf(msg));
  if (!j || !j.summary) throw new Error("The AI reply could not be read. Try again.");
  return { ...j, generatedBy: models.report, generatedAt: new Date().toISOString() };
}

function reportFacts(r: Report) {
  const i = r.input;
  const lines = [
    `Property: ${i.propertyType}${i.city ? ", " + i.city : ""}. Name: ${i.name ?? "not given"}.`,
    `Concerns: ${i.concerns.map((c) => concernInfo[c].label).join(", ") || "none given"}.`,
    i.entranceHeading !== undefined ? `Entrance compass heading (facing out): ${Math.round(i.entranceHeading)}°.` : "",
    `Rooms: ${i.placements.map((p) => `${roomInfo[p.room].name} in ${directionInfo[p.direction].name}`).join("; ")}.`,
    `Cluttered zones: ${Object.entries(i.clutter ?? {}).filter(([, v]) => v).map(([d]) => directionInfo[d as Direction].name).join(", ") || "none"}.`,
    `Balance score ${r.rules.score}/100. Element scores: ${ELEMENTS.map((e) => `${e} ${r.rules.elementScores[e]}`).join(", ")}. Weakest: ${r.rules.weakest}. Strongest: ${r.rules.strongest}.`,
    `Findings: ${r.rules.findings.map((f) => `[${f.verdict}] ${f.title}`).join("; ")}.`,
    i.notes ? `Client notes: ${i.notes}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

function demoReport(r: Report): AIReport {
  const w = elementInfo[r.rules.weakest];
  const s = elementInfo[r.rules.strongest];
  const avoid = r.rules.findings.filter((f) => f.verdict === "avoid");
  const narrative = Object.fromEntries(
    ELEMENTS.map((e) => {
      const i = elementInfo[e];
      const sc = r.rules.elementScores[e];
      const state = sc >= 75 ? "is well supported" : sc >= 55 ? "is present but could be stronger" : "needs attention";
      return [e, `${i.name} (${directionInfo[i.direction].name}) ${state} at ${sc}/100. ${i.message} Bring in ${i.colours.toLowerCase()} and ${i.shape.toLowerCase()} forms in the ${directionInfo[i.direction].name.toLowerCase()}.`];
    })
  );
  const m = mediator(r.rules.weakest, r.rules.strongest);
  return {
    summary: `Your space scores ${r.rules.score}/100 for balance. ${s.name} is your strongest element and ${w.name} your weakest, which touches your ${w.lifeArea.split("—")[0].trim().toLowerCase()}: ${w.lifeArea.split("—")[1]?.trim() ?? ""}. ${avoid.length ? `Start with the ${avoid.length} placement${avoid.length > 1 ? "s" : ""} marked "disturbs the balance".` : "None of your rooms sit in a zone to avoid, which is a strong start."}`,
    elementNarrative: narrative,
    lifeAreas: r.tier === "indepth" ? Object.fromEntries(ELEMENTS.map((e) => [elementInfo[e].lifeArea.split("—")[0].trim(), `${elementInfo[e].teaching}`])) : undefined,
    actionPlan: [
      ...r.rules.findings.filter((f) => f.verdict !== "best").slice(0, 8).map((f) => ({ step: f.remedies[0], why: f.title, cost: f.cost })),
      ...(m ? [{ step: `Add ${elementInfo[m].name} between your strongest and weakest elements: ${elementInfo[m].colours.toLowerCase()}.`, why: "Supporting cycle bridge", cost: "low" }] : []),
    ],
    crystals: [
      { crystal: w.crystals[0], where: `${directionInfo[w.direction].name} zone`, why: `Strengthens ${w.name}` },
      { crystal: w.crystals[1], where: "Where you work or sit most", why: w.qualities.join(", ") },
      { crystal: "Clear quartz", where: "North-east, kept clean", why: "Clarity and light" },
    ],
    closing: `${site.signoff}. Magnificently yours, ${site.consultant}.`,
    generatedBy: "demo (no API key)",
    generatedAt: new Date().toISOString(),
  };
}

// ---------- 3. Chat assistant ----------

export async function chatReply(r: Report | null, history: ChatMessage[], message: string): Promise<string> {
  if (!aiEnabled()) return demoChat(r, message);
  const ctx = r ? `\n\nTHIS CLIENT'S REPORT:\n${reportFacts(r)}\nTier: ${tiers[r.tier].name}.` : "";
  const msg = await client().messages.create({
    model: models.chat,
    max_tokens: 700,
    system: knowledgePrompt() + ctx,
    messages: [
      ...history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: message },
    ],
  });
  return textOf(msg).trim();
}

function demoChat(r: Report | null, message: string): string {
  const q = message.toLowerCase();
  const el = ELEMENTS.find((e) => q.includes(e));
  if (el) {
    const i = elementInfo[el];
    return `${i.name} belongs to the ${directionInfo[i.direction].name.toLowerCase()} (${i.sanskrit}). Its shape is ${i.shape.toLowerCase()} and its colours are ${i.colours.toLowerCase()}. ${i.message}\n\n(Demo answer — add an Anthropic API key for full conversations.)`;
  }
  const room = (Object.keys(roomInfo) as RoomKey[]).find((k) => q.includes(roomInfo[k].name.toLowerCase().split(" ")[0]));
  if (room) {
    const ri = roomInfo[room];
    return `${ri.name}: best in the ${ri.best.map((d) => directionInfo[d].name.toLowerCase()).join(" or ")}; avoid the ${ri.avoid.map((d) => directionInfo[d].name.toLowerCase()).join(", ")}. ${ri.why}\n\n(Demo answer — add an Anthropic API key for full conversations.)`;
  }
  const w = r ? elementInfo[r.rules.weakest] : null;
  return `${w ? `Your weakest element is ${w.name}, in the ${directionInfo[w.direction].name.toLowerCase()}. ` : ""}Ask me about any element (water, wood, fire, earth, metal) or room (kitchen, toilet, entrance, bedroom…).\n\n(Demo answer — add an Anthropic API key for full conversations.)`;
}

export function questionsLeft(r: Report | null, tier: Tier) {
  return tiers[tier].questions - (r?.questionsUsed ?? 0);
}

export type { Element };
