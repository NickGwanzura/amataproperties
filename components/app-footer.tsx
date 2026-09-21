import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { company, SALES_LINES, waLink } from "@/config";

const exploreLinks = [
  { href: "/developments", label: "Developments" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "Our story" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const serviceLinks = [
  { href: "/developments", label: "Selling stands" },
  { href: "/services", label: "Rentals & management" },
  { href: "/contact", label: "Property valuations" },
  { href: "/contact", label: "Homes & sales" },
];

export function AppFooter() {
  return (
    <footer className="overflow-hidden bg-[#0d0b0c] text-white">
      <section className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
        <div className="pointer-events-none absolute -right-24 top-0 size-80 rounded-full bg-[#6a0b14]/20 blur-3xl" />
        <div className="relative grid gap-10 border-b border-white/10 pb-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:pb-20">
          <div>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a0b14]">The Amata brief</p>
            <h2 className="max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.05em] text-white sm:text-6xl">
              Property decisions,<br /><span className="text-white">made clearer.</span>
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-white sm:text-base">
              A considered approach to developments, homes, rentals and value across Zimbabwe. Tell us where you are going next.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/contact" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#6a0b14] px-6 text-sm font-semibold text-white shadow-lg shadow-[#6a0b14]/20 transition hover:-translate-y-0.5 hover:bg-[#ed252d]">
              Start a conversation <ArrowUpRight className="size-4" />
            </Link>
            <a href={waLink()} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/10">
              <MessageCircle className="size-4 text-[#6a0b14]" /> WhatsApp us
            </a>
          </div>
        </div>

        <div className="grid gap-12 border-b border-white/10 py-14 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.75fr_0.85fr_1.2fr] lg:py-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-3" aria-label="Amata Properties home">
              <Image src="/amata-logo-white.svg" alt="Amata Properties" width={320} height={84} className="h-20 w-auto object-contain" />
            </Link>
            <p className="mt-6 max-w-xs text-sm leading-6 text-white">Zimbabwean property expertise with a more human point of view.</p>
            <div className="mt-7 flex gap-2">
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid size-10 place-items-center rounded-full border border-white/10 text-white transition hover:border-[#6a0b14] hover:bg-[#6a0b14] hover:text-white"><Instagram className="size-4" /></a>
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="grid size-10 place-items-center rounded-full border border-white/10 text-white transition hover:border-[#6a0b14] hover:bg-[#6a0b14] hover:text-white"><Linkedin className="size-4" /></a>
              <a href={`mailto:${company.email}`} aria-label="Email Amata" className="grid size-10 place-items-center rounded-full border border-white/10 text-white transition hover:border-[#6a0b14] hover:bg-[#6a0b14] hover:text-white"><Mail className="size-4" /></a>
            </div>
          </div>

          <div>
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white">Navigate</p>
            <ul className="space-y-3">{exploreLinks.map(({ href, label }) => <li key={href}><Link href={href} className="text-sm text-white transition hover:text-white">{label}</Link></li>)}</ul>
          </div>

          <div>
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white">What we do</p>
            <ul className="space-y-3">{serviceLinks.map(({ href, label }) => <li key={label}><Link href={href} className="text-sm text-white transition hover:text-white">{label}</Link></li>)}</ul>
          </div>

          <div>
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white">Find us</p>
            <a href="https://www.google.com/maps/search/50+Greendale+Avenue+Greendale" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-sm leading-6 text-white transition hover:text-white"><MapPin className="mt-1 size-4 shrink-0 text-[#6a0b14]" />50 Greendale Avenue, Greendale,<br />50 Greendale Avenue,<br />Greendale, Zimbabwe</a>
            <div className="mt-5 flex items-start gap-3"><Phone className="mt-1 size-4 shrink-0 text-[#6a0b14]" /><div className="space-y-1">{SALES_LINES.slice(0, 2).map(({ number, href }) => <a key={number} href={href} className="block text-sm text-white transition hover:text-white">{number}</a>)}</div></div>
            <a href={`mailto:${company.email}`} className="mt-5 block text-sm text-white transition hover:text-white">{company.email}</a>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 pt-6 text-[11px] text-white sm:flex-row">
          <span>© 2026 {company.name} {company.legalSuffix}. All rights reserved.</span>
          <span>Developed &amp; Maintained by <a href="https://spiritusglobal.tech" target="_blank" rel="noopener noreferrer" className="font-semibold text-white transition hover:text-white">Spiritus Systems</a> — <a href="https://spiritusglobal.tech" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">spiritusglobal.tech</a></span>
        </div>
      </section>
    </footer>
  );
}
