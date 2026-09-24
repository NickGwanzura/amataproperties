import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgePercent, Building2, Check, ClipboardList, Handshake, Home } from "lucide-react";
import { SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Services",
  description: "Residential developments, property sales, marketing, advisory, and developer partnerships from Amata Properties in Zimbabwe.",
  alternates: { canonical: "/services" },
};

const services = [
  { number: "01", icon: Building2, title: "Residential developments", kicker: "Find a place to build", description: "We market residential stands in established and emerging developments, and connect prospective buyers with clear development and payment information.", href: "/developments", action: "Explore developments" },
  { number: "02", icon: Home, title: "Property sales", kicker: "Connect sellers and buyers", description: "We facilitate the sale of residential and other suitable property assets, helping sellers reach qualified buyers and guiding the process forward.", href: "/contact", action: "Discuss a property sale" },
  { number: "03", icon: BadgePercent, title: "Property marketing", kicker: "Give opportunities visibility", description: "Digital campaigns, social media, property showcases, photography, video, and targeted advertising help present properties to prospective clients.", href: "/contact", action: "Plan property marketing" },
  { number: "04", icon: ClipboardList, title: "Property advisory", kicker: "Understand the opportunity", description: "We help clients understand development details, payment structures, documentation, and the general property acquisition process.", href: "/contact", action: "Speak with our team" },
  { number: "05", icon: Handshake, title: "Developer partnerships", kicker: "Build reach and enquiries", description: "We work with developers and landowners on professional sales and marketing solutions designed to grow exposure, enquiries, and sales.", href: "/contact", action: "Partner with Amata" },
];

const support = [
  "Understand your needs and objectives",
  "Advise with relevant property information",
  "Connect you to suitable opportunities",
  "Facilitate clear next steps and transactions",
  "Build lasting client and developer relationships",
];

export default function ServicesPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-black py-20 text-white sm:py-28 lg:py-32">
        <div className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full border-[52px] border-[#DB1F26]/25" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:px-8">
          <div>
            <p className="mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#DB1F26]"><span className="h-px w-8 bg-[#DB1F26]" />Amata services</p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-7xl lg:text-8xl">Property,<br /><span className="text-white">thoughtfully handled.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/80 sm:text-lg">Specialists in residential developments, supported by property sales, marketing, advisory, and developer partnerships.</p>
          </div>
          <div className="border-l border-white/15 pl-6 lg:mb-2 lg:pl-8">
            <p className="text-sm font-semibold text-white">Connecting you to prime property opportunities</p>
            <p className="mt-3 text-sm leading-6 text-white/70">Professional service and transparent information for buyers, investors, sellers, and development partners.</p>
            <Link href="/contact" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#DB1F26] transition hover:text-white">Share your brief <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:py-28 lg:px-8">
        <SectionTitle eyebrow="Our specialisation" title="Residential developments, supported by focused property services.">
          We work with clients and development partners to make property opportunities easier to understand, find, and act on.
        </SectionTitle>
        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border/70 bg-border/70 md:grid-cols-2">
          {services.map(({ number, icon: Icon, title, kicker, description, href, action }) => (
            <article key={title} className="scroll-reveal group relative bg-card p-7 transition-colors duration-300 hover:bg-black hover:text-white sm:p-9">
              <div className="flex items-start justify-between gap-4"><span className="text-[11px] font-semibold tracking-[0.2em] text-primary group-hover:text-[#DB1F26]">{number}</span><span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white"><Icon className="size-5" /></span></div>
              <p className="mt-12 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-white/70">{kicker}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{title}</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground group-hover:text-white/80">{description}</p>
              <Link href={href} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:text-[#DB1F26]">{action}<ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div><p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">The way we work</p><h2 className="text-4xl font-semibold leading-[1] tracking-[-0.05em] sm:text-6xl">Less noise.<br />More direction.</h2></div>
          <div className="grid gap-0 border-t border-[#1a1515]/15">{support.map((item, index) => <div key={item} className="flex items-center gap-5 border-b border-[#1a1515]/15 py-5"><span className="text-xs font-semibold text-primary">0{index + 1}</span><Check className="size-4 text-primary" /><p className="text-base font-medium text-[#1a1515]">{item}</p></div>)}</div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#DB1F26] py-20 text-white sm:py-24"><div className="pointer-events-none absolute -right-20 -top-28 size-96 rounded-full border-[48px] border-white/10" /><div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-8 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white">Let&apos;s connect</p><h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-6xl">Connecting you to your next property opportunity.</h2></div><Link href="/contact" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-900">Contact Amata <ArrowRight className="size-4" /></Link></div></section>
    </main>
  );
}
