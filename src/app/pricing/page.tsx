import { PlansStrip } from "@/components/PlansStrip";

export const metadata = { title: "Plans · Cosmic Vastu Culture" };

const faqs = [
  { q: "Do I pay before I see anything?", a: "No. Every analysis starts free: you see your five-element score and your top three findings first, then choose whether to unlock more." },
  { q: "Can I upgrade later?", a: "Yes. Upgrading from one plan to the next costs only the difference." },
  { q: "Is the written report written by Sanjay-ji?", a: "It is written by an AI trained on Sanjay-ji's five-element method and his placement rules. For his personal reading, book a consultation — In-depth buyers get credit towards it." },
  { q: "Do I need to break walls?", a: "Almost never. Remedies start with colour, shape, placement, lighting, decluttering and crystals. Renovation is suggested only when nothing else will do." },
  { q: "What do I need for a good report?", a: "A floor plan (a photo of a hand sketch is fine) and the direction your main door faces. On a phone, the site reads the direction from your compass." },
];

export default function PricingPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 pb-4">
        <h1 className="display text-[clamp(3.5rem,11vw,7.5rem)]">Plans</h1>
      </section>
      <PlansStrip detailed />
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-20">
        <h2 className="display text-5xl">Questions</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {faqs.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="cursor-pointer list-none flex justify-between gap-4 font-medium text-lg">
                {f.q}
                <span className="transition-transform group-open:rotate-45 text-2xl leading-none" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-ink-soft measure">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
