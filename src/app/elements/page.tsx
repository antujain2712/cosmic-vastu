import Image from "next/image";
import Link from "next/link";
import { ELEMENTS, elementInfo, directionInfo, presences, balancePrinciple, supportingCycle, hospitalMapping, philosophy } from "@/lib/knowledge";
import { SupportingCycle } from "@/components/SupportingCycle";

export const metadata = { title: "The five elements · Cosmic Vastu Culture" };

export default function ElementsPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 pb-10">
        <h1 className="display text-[clamp(4rem,13vw,9rem)]">The 5 Elements</h1>
        <p className="mt-6 measure text-lg text-ink-soft">
          Vastu Shastra shows that happiness, health and positive energy come from the balance of the five elements within a space. When we
          align our surroundings with them, joy, progress and success flow more easily into life.
        </p>
        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Jump to element">
          {ELEMENTS.map((e) => (
            <a key={e} href={`#${e}`} className="rounded-full px-4 py-1.5 text-sm text-paper-2" style={{ background: elementInfo[e].hex }}>
              {elementInfo[e].name} · {directionInfo[elementInfo[e].direction].name}
            </a>
          ))}
        </nav>
      </section>

      {ELEMENTS.map((e, idx) => {
        const i = elementInfo[e];
        const flip = idx % 2 === 1;
        return (
          <section key={e} id={e} className="border-t border-line scroll-mt-4">
            <div className={`mx-auto max-w-6xl px-4 sm:px-6 py-16 grid md:grid-cols-2 gap-10 items-center ${flip ? "md:[&>*:first-child]:order-2" : ""}`}>
              <div className="relative">
                <div className="relative aspect-square max-w-md rounded-xl overflow-hidden">
                  <Image src={i.image} alt="" fill sizes="(min-width: 768px) 40vw, 90vw" className="object-cover" />
                </div>
                <p className="script absolute -bottom-6 left-4 text-[clamp(3.5rem,9vw,6rem)] drop-shadow-sm" style={{ color: i.hex }}>
                  {directionInfo[i.direction].script}
                </p>
              </div>
              <div>
                <h2 className="display text-[clamp(4rem,10vw,7rem)]" style={{ color: i.hex }}>{i.name}</h2>
                <p className="text-ink-soft -mt-1">{directionInfo[i.direction].name} · {i.sanskrit}</p>
                <p className="mt-6 text-xl measure">&ldquo;{i.message}&rdquo;</p>
                <p className="mt-4 measure text-ink-soft">{i.teaching}</p>
                <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 text-[0.95rem]">
                  <div><dt className="text-ink-soft text-sm">Qualities</dt><dd>{i.qualities.join(", ")}</dd></div>
                  <div><dt className="text-ink-soft text-sm">Life area</dt><dd>{i.lifeArea.split("—")[0]}</dd></div>
                  <div><dt className="text-ink-soft text-sm">Shape</dt><dd>{i.shape}</dd></div>
                  <div><dt className="text-ink-soft text-sm">Colours</dt><dd>{i.colours}</dd></div>
                </dl>
                <div className="mt-5 flex gap-1.5" aria-label={`${i.name} colour palette`}>
                  {i.swatches.map((s) => <span key={s} className="h-7 flex-1 max-w-12 rounded" style={{ background: s }} />)}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <section className="bg-ink text-paper-2">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="display text-6xl">The supporting cycle</h2>
            <p className="mt-4 text-paper-2/80 measure">Each element nourishes the next. Use the cycle to strengthen a weak element through the one that feeds it.</p>
            <ul className="mt-8 space-y-3 measure">
              {supportingCycle.map((s) => <li key={s.from} className="border-l-2 pl-4" style={{ borderColor: elementInfo[s.from].hex }}>{s.how}</li>)}
            </ul>
          </div>
          <div className="flex justify-center"><SupportingCycle tone="light" /></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <h2 className="display text-6xl">{balancePrinciple.question}</h2>
        <p className="mt-4 measure text-lg">{balancePrinciple.text}</p>
        <div className="mt-10 grid md:grid-cols-3 gap-px bg-line rounded-xl overflow-hidden">
          {balancePrinciple.disturbed.map((d) => (
            <div key={d.title} className="bg-paper p-6">
              <p className="font-medium">{d.title}</p>
              <p className="text-ink-soft mt-1">{d.text}</p>
            </div>
          ))}
        </div>

        <h3 className="display text-4xl mt-20">What belongs to each element</h3>
        <p className="mt-3 measure text-ink-soft">Sanjay-ji counts six presences in any premises: the five elements, and the people who use it.</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
          {(Object.keys(presences) as (keyof typeof presences)[]).map((k) => (
            <div key={k} className="border-t-2 pt-4" style={{ borderColor: k === "people" ? "#1f2328" : elementInfo[k].hex }}>
              <p className="font-medium text-lg">{presences[k].title}</p>
              <ul className="mt-2 text-ink-soft text-[0.95rem] space-y-1">{presences[k].items.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          ))}
        </div>

        <h3 className="display text-4xl mt-20">In a hospital</h3>
        <p className="mt-3 measure text-ink-soft">From Sanjay-ji&apos;s forthcoming book on Vastu and Feng Shui for hospitals.</p>
        <table className="mt-6 w-full max-w-3xl text-left">
          <tbody>
            {hospitalMapping.map((h) => (
              <tr key={h.element} className="border-t border-line">
                <th className="py-3 pr-6 font-medium" style={{ color: elementInfo[h.element].hex }}>{elementInfo[h.element].name}</th>
                <td className="py-3 text-ink-soft">{h.covers}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-20 rounded-2xl bg-sage text-paper-2 p-8 md:p-12">
          <p className="script text-5xl">Choice is yours</p>
          <p className="mt-4 measure">{philosophy.choice}</p>
          <Link href="/quiz" className="btn btn-light mt-8">Check my balance</Link>
        </div>
      </section>
    </>
  );
}
