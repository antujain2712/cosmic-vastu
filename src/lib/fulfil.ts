import { tx, read, Report } from "./db";
import { generateReport } from "./ai";
import { tierRank, tiers, consultations, site, formatPrice } from "@/config/site";
import { sendEmail, adminEmail } from "./notify";

/** Mark a payment as paid and deliver what was bought. Idempotent. */
export async function fulfilPayment(orderId: string, providerPaymentId: string) {
  const result = await tx((db) => {
    const p = db.payments.find((x) => x.id === orderId);
    if (!p) throw new Error("Payment not found");
    if (p.status === "paid") return { already: true, payment: p };
    p.status = "paid";
    p.providerPaymentId = providerPaymentId;
    if (p.kind === "report") {
      const r = db.reports.find((x) => x.id === p.refId);
      if (r && p.tier && tierRank(p.tier) > tierRank(r.tier)) {
        r.tier = p.tier;
        if (tierRank(p.tier) >= tierRank("specialised")) r.aiStatus = "running";
      }
    } else {
      const b = db.bookings.find((x) => x.id === p.refId);
      if (b) {
        b.status = "confirmed";
        b.paymentId = providerPaymentId;
      }
    }
    return { already: false, payment: p };
  });

  if (!result.already) {
    const p = result.payment;
    if (p.kind === "report") {
      const r = await read((db) => db.reports.find((x) => x.id === p.refId));
      if (r?.input.email) {
        await sendEmail(
          r.input.email,
          `Your ${tiers[r.tier].name} Vastu report`,
          `<p>Thank you. Your report is ready at <a href="${baseUrl()}/report/${r.id}">${baseUrl()}/report/${r.id}</a>. Keep this link — it is your access to the report and the Vastu assistant.</p><p>${site.signoff}<br/>${site.consultant}</p>`
        );
      }
    } else {
      const b = await read((db) => db.bookings.find((x) => x.id === p.refId));
      if (b) {
        const c = consultations[b.type];
        const when = `${b.date} at ${b.time} IST`;
        await sendEmail(
          b.email,
          `Booked: ${c.name} with ${site.consultant}`,
          `<p>Namaste ${b.name},</p><p>Your ${c.name.toLowerCase()} is confirmed for <b>${when}</b> (${c.minutes} minutes). Paid: ${formatPrice(b.amount, b.currency)}.</p>${b.type === "online" ? "<p>The video call link will be sent to you before the session.</p>" : "<p>Sanjay-ji's office will call you to confirm the address and the final fee.</p>"}<p>${site.signoff}</p>`
        );
        await sendEmail(
          adminEmail(),
          `New booking: ${c.name} — ${when}`,
          `<p>${b.name} · ${b.email} · ${b.phone}</p><p>${b.city ?? ""} ${b.address ?? ""}</p><p>${b.message ?? ""}</p>${b.reportId ? `<p>Report: ${baseUrl()}/report/${b.reportId}</p>` : ""}`
        );
      }
    }
  }
  return result.payment;
}

export function baseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/** Run AI generation for a report. Safe to call repeatedly. */
export async function runGeneration(reportId: string) {
  const r = await read((db) => db.reports.find((x) => x.id === reportId));
  if (!r || tierRank(r.tier) < tierRank("specialised")) return;
  if (r.ai && r.ai.generatedAt && r.aiStatus === "done" && reportTierMatches(r)) return;
  await tx((db) => {
    const x = db.reports.find((y) => y.id === reportId);
    if (x) x.aiStatus = "running";
  });
  try {
    const ai = await generateReport(r);
    ai.generatedBy += `|${r.tier}`;
    await tx((db) => {
      const x = db.reports.find((y) => y.id === reportId);
      if (x) {
        x.ai = ai;
        x.aiStatus = "done";
        x.aiError = undefined;
      }
    });
  } catch (e) {
    await tx((db) => {
      const x = db.reports.find((y) => y.id === reportId);
      if (x) {
        x.aiStatus = "error";
        x.aiError = e instanceof Error ? e.message : "Generation failed";
      }
    });
  }
}

function reportTierMatches(r: Report) {
  return r.ai?.generatedBy.endsWith(`|${r.tier}`);
}
