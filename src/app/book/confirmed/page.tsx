import Link from "next/link";
import { consultations, ConsultType, site } from "@/config/site";

export default async function Confirmed({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const type = (sp.type as ConsultType) in consultations ? (sp.type as ConsultType) : "online";
  const when = sp.d ? new Date(sp.d + "T12:00:00Z").toLocaleDateString("en-IN", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }) : "";
  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-20">
      <p className="script text-5xl text-sage-deep">Subh aur mangalmay ho</p>
      <h1 className="display text-[clamp(3rem,9vw,6rem)] mt-3">You&apos;re booked</h1>
      <p className="mt-6 text-lg measure">
        {consultations[type].name} with {site.consultant} on {when} at {sp.t} IST. A confirmation is on its way to your email.
      </p>
      <p className="mt-3 text-ink-soft measure">
        {type === "online"
          ? "The video call link arrives before the session. Keep your floor plan handy."
          : "Sanjay-ji's office will call to confirm the address and the final fee."}
      </p>
      <p className="mt-3 text-sm text-ink-soft">Booking reference: {sp.b}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <a href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Namaste, I just booked a session (ref ${sp.b}).`)}`} className="btn btn-ink" target="_blank" rel="noreferrer">Send floor plan on WhatsApp</a>
        <Link href="/elements" className="btn btn-line">Read about the five elements</Link>
      </div>
    </section>
  );
}
