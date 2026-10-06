import type { Report } from "./db";
import { tierRank, tiers } from "@/config/site";

/** What the client is allowed to see, enforced on the server. */
export function reportView(r: Report) {
  const rank = tierRank(r.tier);
  const findings = rank >= 1 ? r.rules.findings : r.rules.findings.slice(0, 3).map((f) => ({ ...f, remedies: f.remedies.slice(0, 1) }));
  let ai = rank >= 2 ? r.ai : undefined;
  if (ai && rank < 3) ai = { ...ai, lifeAreas: undefined };
  return {
    id: r.id,
    createdAt: r.createdAt,
    tier: r.tier,
    input: { ...r.input, email: undefined },
    rules: { ...r.rules, findings },
    hiddenFindings: r.rules.findings.length - findings.length,
    hasImages: r.images.length > 0,
    images: r.images,
    ai,
    aiStatus: r.aiStatus ?? "idle",
    aiError: r.aiError,
    questionsLeft: Math.max(0, tiers[r.tier].questions - r.questionsUsed),
  };
}

export type ReportView = ReturnType<typeof reportView>;
