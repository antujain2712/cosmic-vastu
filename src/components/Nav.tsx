"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/elements", label: "The five elements" },
  { href: "/quiz", label: "Free check" },
  { href: "/analyze", label: "Analyse my space" },
  { href: "/pricing", label: "Plans" },
];

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const onBlue = path === "/";
  if (path.startsWith("/admin")) return null;
  return (
    <header className={`${onBlue ? "bg-denim text-paper-2" : "bg-paper text-ink border-b border-line"} relative z-20`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="script text-3xl">Sanjay Raj Jain</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-[0.95rem]">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`hover:underline underline-offset-4 ${path === l.href ? "underline" : ""}`}>
              {l.label}
            </Link>
          ))}
          <Link href="/book" className={`btn ${onBlue ? "btn-light" : "btn-ink"} !py-2`}>
            Book Sanjay-ji
          </Link>
        </nav>
        <button className="md:hidden p-2 -mr-2" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8">
            {open ? <path d="M6 6l14 14M20 6L6 20" /> : <path d="M3 8h20M3 13h20M3 18h20" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav className={`md:hidden px-4 pb-5 flex flex-col gap-3 ${onBlue ? "bg-denim" : "bg-paper"}`}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-1 text-lg">
              {l.label}
            </Link>
          ))}
          <Link href="/book" onClick={() => setOpen(false)} className={`btn ${onBlue ? "btn-light" : "btn-ink"} mt-2`}>
            Book Sanjay-ji
          </Link>
        </nav>
      )}
    </header>
  );
}
