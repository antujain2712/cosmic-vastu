import { site } from "@/config/site";

export const metadata = { title: "Terms and disclaimer · Cosmic Vastu Culture" };

export default function Terms() {
  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <h1 className="display text-6xl">Terms and disclaimer</h1>
      <div className="mt-8 space-y-5 measure text-ink-soft">
        <p className="text-ink font-medium">Draft — to be reviewed by a lawyer before launch.</p>
        <p>Vastu guidance on this site is traditional and advisory. It is not structural, engineering, medical, legal or financial advice. Consult a qualified professional before structural changes, and for health, legal or money matters.</p>
        <p>AI reports are generated from {site.consultant}&apos;s method and the information you provide. They can be wrong if the floor plan or directions are wrong. For a personal assessment, book a consultation.</p>
        <p>Reports are one-time purchases for one space. Your report link is your access — keep it private. Refunds on reports are offered within 7 days if the written report failed to generate.</p>
        <p>Online consultations can be rescheduled once with 24 hours&apos; notice. In-person deposits are adjusted against the final fee; the final fee depends on the location and is agreed with Sanjay-ji on a call before the visit.</p>
        <p>We store your floor plan, photos and answers to produce your report and to help Sanjay-ji prepare for consultations. We do not sell your data. To have it deleted, write to {site.email}.</p>
      </div>
    </section>
  );
}
