"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Building2, ChevronLeft, ChevronRight, Home, KeyRound, MapPin, Pause, Play, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

const slides = [
  {
    label: "Developments",
    title: "Find your next place to build.",
    description: "Explore serviced stands in carefully selected developments, with clear information and a team ready to guide your decision.",
    href: "/developments",
    action: "Explore developments",
    icon: Building2,
  },
  {
    label: "Rentals & Management",
    title: "Live well. Manage better.",
    description: "Find a home or let your property with dependable support, thoughtful tenant care, and practical ongoing management.",
    href: "/services",
    action: "Discover rentals",
    icon: KeyRound,
  },
  {
    label: "Valuations",
    title: "Know what your property is worth.",
    description: "Make confident decisions with a clear, market-informed valuation for your home, land, or investment property.",
    href: "/contact",
    action: "Request a valuation",
    icon: BadgeDollarSign,
  },
  {
    label: "Sales",
    title: "Move property with purpose.",
    description: "Buy or sell houses and investment property with an experienced agent, sharp positioning, and calm negotiation.",
    href: "/contact",
    action: "Talk to a sales agent",
    icon: Home,
  },
];

export function HeroSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[active];

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused]);

  const move = (direction: number) => setActive((current) => (current + direction + slides.length) % slides.length);

  return (
    <section className="relative min-h-[min(820px,88vh)] overflow-hidden bg-black text-white">
      <Image src="/amata-hero.png" alt="Premium Amata property" fill priority className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,8,9,.96)_0%,rgba(10,8,9,.84)_38%,rgba(10,8,9,.22)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(183,18,27,.28),transparent_34%)]" />

      <div className="relative mx-auto flex min-h-[min(820px,88vh)] max-w-7xl flex-col justify-between px-4 pb-8 pt-28 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-7 flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/65">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 backdrop-blur-md"><ShieldCheck className="size-3.5 text-[#F0444C]" /> Amata real estate agency</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-[#F0444C]" /> Zimbabwe</span>
            </div>
            <div className="min-h-[310px] sm:min-h-[330px]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F0444C]">{slide.label}</p>
              <h1 key={slide.title} className="mt-4 max-w-3xl animate-fade-in text-5xl font-semibold leading-[0.94] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
                {slide.title}
              </h1>
              <p key={`${slide.title}-description`} className="mt-6 max-w-xl animate-fade-in text-base leading-7 text-white/70 sm:text-lg">
                {slide.description}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={slide.href} className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#D71920] px-5 text-sm font-semibold text-white shadow-xl shadow-black/25 transition hover:-translate-y-0.5 hover:bg-[#E0222C]">
                  {slide.action} <ArrowRight className="size-4" />
                </Link>
                <Link href="/contact" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15">
                  Speak to Amata
                </Link>
              </div>
            </div>
          </div>

          <aside className="hidden rounded-3xl border border-white/15 bg-black/25 p-3 shadow-2xl backdrop-blur-xl lg:block" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <div className="flex items-center justify-between px-3 pb-3 pt-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Our services</span>
              <span className="text-xs text-white/40">0{active + 1} / 0{slides.length}</span>
            </div>
            <div className="space-y-1">
              {slides.map((item, index) => {
                const ItemIcon = item.icon;
                const selected = index === active;
                return (
                  <button key={item.label} type="button" onClick={() => setActive(index)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${selected ? "bg-[#D71920] text-white" : "text-white/55 hover:bg-white/10 hover:text-white"}`}>
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${selected ? "bg-white/15" : "bg-white/10"}`}><ItemIcon className="size-4" /></span>
                    <span className="min-w-0"><span className="block text-sm font-semibold">{item.label}</span><span className={`mt-0.5 block truncate text-xs ${selected ? "text-white/70" : "text-white/35"}`}>{item.action}</span></span>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>

        <div className="flex items-center justify-between border-t border-white/15 pt-5">
          <div className="flex items-center gap-2">
            {slides.map((item, index) => <button key={item.label} type="button" aria-label={`Show ${item.label}`} onClick={() => setActive(index)} className={`h-1.5 rounded-full transition-all ${index === active ? "w-10 bg-[#F0444C]" : "w-5 bg-white/30 hover:bg-white/60"}`} />)}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Previous service" onClick={() => move(-1)} className="grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20"><ChevronLeft className="size-4" /></button>
            <button type="button" aria-label="Next service" onClick={() => move(1)} className="grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20"><ChevronRight className="size-4" /></button>
            <button type="button" aria-label={paused ? "Play slider" : "Pause slider"} onClick={() => setPaused((value) => !value)} className="ml-1 grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20">{paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
