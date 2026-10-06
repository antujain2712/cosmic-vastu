import { NextResponse } from "next/server";
import { tx, newId, saveUpload, Report } from "@/lib/db";
import { runRules, AnalysisInput, roomInfo } from "@/lib/rules";
import { DIRECTIONS, headingToDirection } from "@/lib/knowledge";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as { input: AnalysisInput; images?: string[] };
  const input = body.input;
  if (!input || !input.propertyType) return NextResponse.json({ error: "Choose a property type." }, { status: 400 });

  input.placements = (input.placements ?? []).filter(
    (p) => p.room in roomInfo && (DIRECTIONS as string[]).includes(p.direction)
  );
  // Compass heading becomes the entrance placement if the user didn't add one by hand
  if (typeof input.entranceHeading === "number" && !input.placements.some((p) => p.room === "entrance")) {
    input.placements.unshift({ room: "entrance", direction: headingToDirection(input.entranceHeading) });
  }
  if (input.placements.length === 0) return NextResponse.json({ error: "Add at least one room and its direction." }, { status: 400 });
  input.concerns = input.concerns ?? [];

  const images: string[] = [];
  for (const d of (body.images ?? []).slice(0, 4)) {
    const n = await saveUpload(d);
    if (n) images.push(n);
  }

  const report: Report = {
    id: newId("r"),
    createdAt: new Date().toISOString(),
    tier: "free",
    input,
    rules: runRules(input),
    images,
    questionsUsed: 0,
    aiStatus: "idle",
  };
  await tx((db) => {
    db.reports.push(report);
    if (input.email) db.leads.push({ email: input.email, name: input.name, source: "analysis", at: report.createdAt });
  });
  return NextResponse.json({ id: report.id });
}
