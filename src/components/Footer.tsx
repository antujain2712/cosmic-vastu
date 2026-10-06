"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/config/site";

export function Footer() {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;
  return (
    <footer className="bg-ink text-paper-2/85">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="script text-5xl text-paper-2">{site.signoff}…</p>
          <p className="mt-4 text-sm max-w-sm">
            {site.brand}. {site.consultant}, {site.title.toLowerCase()} since {site.since}. Observe, analyse, balance, grow.
          </p>
        </div>
        <div className="text-sm space-y-1.5">
          <p className="text-paper-2 font-medium mb-2">Reach out</p>
          <p><a className="hover:underline" href={`mailto:${site.email}`}>{site.email}</a></p>
          <p><a className="hover:underline" href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a></p>
          <p><a className="hover:underline" href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a></p>
          <p><a className="hover:underline" href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noreferrer">Instagram @{site.instagram}</a></p>
          <p><a className="hover:underline" href={`https://linkedin.com/in/${site.linkedin}`} target="_blank" rel="noreferrer">LinkedIn</a></p>
        </div>
        <div className="text-sm space-y-1.5">
          <p className="text-paper-2 font-medium mb-2">Visit</p>
          <p className="max-w-[24ch]">{site.address}</p>
          <p className="pt-3"><Link className="hover:underline" href="/terms">Terms and disclaimer</Link></p>
        </div>
      </div>
    </footer>
  );
}
