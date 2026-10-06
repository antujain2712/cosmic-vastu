import Link from "next/link";
import Image from "next/image";
import { HeroCompass } from "@/components/HeroCompass";
import { ELEMENTS, elementInfo, directionInfo, services, philosophy } from "@/lib/knowledge";
import { site } from "@/config/site";
import { PlansStrip } from "@/components/PlansStrip";

export default function Home() {
  const years = new Date().getFullYear() - site.since;
  return (
    <>
      {/* Hero — the booklet cover, live */}
      <section className="bg-denim text-paper-2 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-16 md:pt-16 md:pb-24 grid md:grid-cols-[1.15fr_1fr] gap-10 items-center">
          <div className="rise">
            <h1 className="display text-[clamp(4.5rem,15vw,10.5rem)]">
              The 5
              <br />
              Element
            </h1>
            <p className="script text-[clamp(2.2rem,5vw,3.4rem)] mt-1 md:-mt-2 ml-1 text-denim-pale">Cosmic Vastu Culture</p>
            <p className="mt-6 text-lg measure text-paper-2/90">
              Vastu for your home, office or factory, in {site.consultant}&apos;s five-element method. Check your space for free, get a floor-plan
              report in minutes, or book Sanjay-ji himself.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/quiz" className="btn btn-light">Take the free element check</Link>
              <Link href="/analyze" className="btn btn-line">Analyse my floor plan</Link>
            </div>
          </div>
          <HeroCompass />
        </div>
      </section>

      {/* Method — a real sequence */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <h2 className="display text-5xl sm:text-6xl">Observe, analyse, balance, grow</h2>
        <p className="mt-4 measure text-ink-soft">
          Sanjay-ji&apos;s method has four movements. The site follows the same order, and you can stop at any step.
        </p>
        <ol className="mt-12 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4 rounded-xl overflow-hidden">
          {[
            { t: "Observe", d: "Answer a few questions about your life and space. Free, two minutes.", href: "/quiz", cta: "Start the check" },
            { t: "Analyse", d: "Mark your rooms on the compass or upload your floor plan. Use your phone at the main door to read its direction.", href: "/analyze", cta: "Analyse my space" },
            { t: "Balance", d: "Get your five-element score, room-by-room fixes, and a written report built on Sanjay-ji's teaching.", href: "/pricing", cta: "See the plans" },
            { t: "Grow", d: "Book Sanjay-ji online or in person when you want the expert eye on it.", href: "/book", cta: "Book a consultation" },
          ].map((s, i) => (
            <li key={s.t} className="bg-paper p-6 flex flex-col">
              <span className="display text-6xl text-denim">{i + 1}</span>
              <span className="script text-4xl mt-3">{s.t}</span>
              <p className="mt-3 text-[0.98rem] text-ink-soft flex-1">{s.d}</p>
              <Link href={s.href} className="mt-5 font-medium underline underline-offset-4 hover:text-denim-deep">{s.cta}</Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Elements */}
      <section className="bg-paper-2 border-y border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="display text-5xl sm:text-6xl">Every space holds five elements</h2>
            <Link href="/elements" className="font-medium underline underline-offset-4">Read the full guide</Link>
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-x-5 gap-y-10">
            {ELEMENTS.map((e) => {
              const i = elementInfo[e];
              return (
                <Link key={e} href={`/elements#${e}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-lg">
                    <Image src={i.image} alt={`${i.name} element`} fill sizes="(min-width: 768px) 20vw, 45vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <p className="display text-3xl mt-4">{i.name}</p>
                  <p className="script text-3xl" style={{ color: i.hex }}>{directionInfo[i.direction].script}</p>
                  <p className="mt-2 text-sm text-ink-soft">&ldquo;{i.message}&rdquo;</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-sage text-paper-2">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 grid md:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden max-w-md">
            <Image src="/img/sanjay-portrait.jpg" alt={`${site.consultant} in his studio`} fill sizes="(min-width: 768px) 40vw, 90vw" className="object-cover" priority={false} />
          </div>
          <div>
            <p className="display text-[clamp(3rem,8vw,6rem)] tracking-[0.12em]">Magnificent</p>
            <p className="script text-5xl -mt-1 text-paper-2/90">{site.consultant}</p>
            <p className="mt-6 measure">
              A Vastu Shastra consultant since {site.since} — {years} years and {site.consultations} consultations across homes, offices, hospitals,
              factories and plots. He reads a space through the interplay of the five elements and the influence of directions, and gives
              remedies people can live with.
            </p>
            <p className="mt-4 measure text-paper-2/85">
              Beyond Vastu, he serves as a Global Statistician with Landmark Worldwide, a Past President with Lions International, and Vice
              President of Shree Taran Taran Digamber Jain Trust.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book" className="btn btn-light">Book a consultation</Link>
              <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn-line">Message on WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <h2 className="display text-5xl sm:text-6xl">What Sanjay-ji does</h2>
        <dl className="mt-10 grid md:grid-cols-2 gap-x-14">
          {services.map((s) => (
            <div key={s.key} className="border-t border-ink/25 py-6 grid grid-cols-[minmax(0,13rem)_1fr] gap-5">
              <dt className="font-medium text-lg">{s.title}</dt>
              <dd className="text-ink-soft">{s.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <PlansStrip />

      {/* Closing */}
      <section className="bg-denim text-paper-2">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 text-center">
          <p className="display text-[clamp(2.6rem,7vw,5.5rem)] max-w-4xl mx-auto">
            It&apos;s mine; expands the environment <span className="script normal-case text-[1.15em]">to grow with</span> you
          </p>
          <p className="mt-6 text-paper-2/80">{philosophy.tagline}.</p>
          <Link href="/quiz" className="btn btn-light mt-10">Find your weakest element</Link>
        </div>
      </section>
    </>
  );
}
