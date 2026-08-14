import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Building2, Check, Home, KeyRound } from "lucide-react";
import { SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Services",
  description: "Developments, sales, rentals, management, and valuations with Amata Properties in Zimbabwe.",
  alternates: { canonical: "/services" },
};

const services = [
  { number: "01", icon: Building2, title: "Developments", kicker: "Buy land with a plan", description: "Discover serviced stands in carefully selected developments, with transparent availability and guidance from reservation through to ownership.", href: "/developments", action: "View developments" },
  { number: "02", icon: KeyRound, title: "Rentals & management", kicker: "Let better. Live easier.", description: "From finding the right tenant or home to keeping a property performing, we handle the details with clear communication and practical care.", href: "/contact", action: "Talk about rentals" },
  { number: "03", icon: BadgeDollarSign, title: "Valuations", kicker: "Know your position", description: "Get a market-informed view of what your property is worth before a sale, purchase, refinance, estate process, or investment decision.", href: "/contact", action: "Request a valuation" },
  { number: "04", icon: Home, title: "Sales", kicker: "Move property with purpose", description: "Buy or sell homes and investment property with positioning, qualified interest, negotiation, and transaction support working together.", href: "/contact", action: "Start a sales brief" },
];

const support = [
  "One specialist who understands your brief",
  "Local context before recommendations",
  "Straight answers and visible next steps",
  "Support from first conversation to completion",
];

export default function ServicesPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[#161314] py-20 text-white sm:py-28 lg:py-32">
        <div className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full border-[52px] border-[#d71920]/25" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:px-8">
          <div>
            <p className="mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f0444c]"><span className="h-px w-8 bg-[#f0444c]" />02 — Amata services</p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-7xl lg:text-8xl">Property,<br /><span className="text-white/40">thoughtfully handled.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/60 sm:text-lg">Four focused services. One calm, capable team to help you make a better move across Zimbabwe.</p>
          </div>
          <div className="border-l border-white/15 pl-6 lg:mb-2 lg:pl-8">
            <p className="text-sm font-semibold text-white">A more considered agency</p>
            <p className="mt-3 text-sm leading-6 text-white/50">We bring the market context, human attention, and follow-through that property decisions deserve.</p>
            <Link href="/contact" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#f0444c] transition hover:text-white">Share your brief <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:py-28 lg:px-8">
        <SectionTitle eyebrow="The Amata brief" title="Choose the kind of move you are making.">
          From a first property search to an active portfolio, we make the next step feel clear and considered.
        </SectionTitle>
        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border/70 bg-border/70 md:grid-cols-2">
          {services.map(({ number, icon: Icon, title, kicker, description, href, action }) => (
            <article key={title} className="group relative bg-card p-7 transition hover:bg-[#161314] hover:text-white sm:p-9">
              <div className="flex items-start justify-between gap-4"><span className="text-[11px] font-semibold tracking-[0.2em] text-primary group-hover:text-[#f0444c]">{number}</span><span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white"><Icon className="size-5" /></span></div>
              <p className="mt-12 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-white/45">{kicker}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{title}</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground group-hover:text-white/60">{description}</p>
              <Link href={href} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:text-[#f0444c]">{action}<ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y bg-[#f3efeb] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div><p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">03 — The way we work</p><h2 className="text-4xl font-semibold leading-[1] tracking-[-0.05em] sm:text-6xl">Less noise.<br />More direction.</h2></div>
          <div className="grid gap-0 border-t border-[#1a1515]/15">{support.map((item, index) => <div key={item} className="flex items-center gap-5 border-b border-[#1a1515]/15 py-5"><span className="text-xs font-semibold text-primary">0{index + 1}</span><Check className="size-4 text-primary" /><p className="text-base font-medium text-[#1a1515]">{item}</p></div>)}</div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#d71920] py-20 text-white sm:py-24"><div className="pointer-events-none absolute -right-20 -top-28 size-96 rounded-full border-[48px] border-white/10" /><div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-8 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">04 — Begin here</p><h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-6xl">Tell us what a better move looks like.</h2></div><Link href="/contact" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[#161314] px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black">Contact Amata <ArrowRight className="size-4" /></Link></div></section>
    </main>
  );
}
