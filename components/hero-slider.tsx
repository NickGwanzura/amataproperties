"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, ChevronLeft, ChevronRight, FileCheck2, Handshake, Home, MapPin, Megaphone, Pause, Play, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

const slides = [
  {
    label: "Developments",
    title: "Find your next place to build.",
    description: "Explore residential stands in established and emerging developments, with clear information to help you assess each opportunity.",
    href: "/developments",
    action: "Explore developments",
    icon: Building2,
  },
  {
    label: "Property sales",
    title: "Connect property with its next owner.",
    description: "We facilitate residential and other suitable property sales, connecting sellers with prospective buyers.",
    href: "/contact",
    action: "Discuss a property sale",
    icon: Home,
  },
  {
    label: "Property marketing",
    title: "Give property opportunities more visibility.",
    description: "Digital campaigns, social media, showcases, photography, and video help developers and sellers reach prospective clients.",
    href: "/services",
    action: "Explore marketing services",
    icon: Megaphone,
  },
  {
    label: "Property advisory",
    title: "Understand the details before you decide.",
    description: "We help clients understand development information, payment structures, documentation, and the property acquisition process.",
    href: "/contact",
    action: "Speak with our team",
    icon: FileCheck2,
  },
  {
    label: "Developer partnerships",
    title: "Bring developments to more buyers.",
    description: "We partner with developers and landowners on professional sales and marketing solutions that grow exposure and enquiries.",
    href: "/contact",
    action: "Partner with Amata",
    icon: Handshake,
  },
];

export function HeroSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  // Hovering or focusing inside the hero holds the current slide without
  // overriding an explicit pause from the play/pause button.
  const [holding, setHolding] = useState(false);
  const slide = slides[active];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  }, []);

  useEffect(() => {
    if (paused || holding) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused, holding]);

  const move = (direction: number) => setActive((current) => (current + direction + slides.length) % slides.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Amata services"
      className="relative min-h-[min(820px,88vh)] overflow-hidden bg-black text-white"
      onMouseEnter={() => setHolding(true)}
      onMouseLeave={() => setHolding(false)}
      onFocus={() => setHolding(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHolding(false);
      }}
    >
      <Image src="/amata-hero.png" alt="Premium Amata property" fill priority className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,8,9,.96)_0%,rgba(10,8,9,.84)_38%,rgba(10,8,9,.22)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(183,18,27,.28),transparent_34%)]" />

      <div className="relative mx-auto flex min-h-[min(820px,88vh)] max-w-7xl flex-col justify-between px-4 pb-8 pt-28 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-7 flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 backdrop-blur-md"><ShieldCheck className="size-3.5 text-[#DB1F26]" /> Amata real estate agency</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-[#DB1F26]" /> Zimbabwe</span>
            </div>
            <div className="min-h-[310px] sm:min-h-[330px]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#DB1F26]">{slide.label}</p>
              <h1 key={slide.title} className="mt-4 max-w-3xl animate-fade-in text-5xl font-semibold leading-[0.94] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
                {slide.title}
              </h1>
              <p key={`${slide.title}-description`} className="mt-6 max-w-xl animate-fade-in text-base leading-7 text-white/85 sm:text-lg">
                {slide.description}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={slide.href} className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#DB1F26] px-5 text-sm font-semibold text-white shadow-xl shadow-black/25 transition hover:-translate-y-0.5 hover:bg-[#c41b22]">
                  {slide.action} <ArrowRight className="size-4" />
                </Link>
                <Link href="/contact" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15">
                  Speak to Amata
                </Link>
              </div>
            </div>
          </div>

          <aside className="hidden rounded-3xl border border-white/15 bg-black/25 p-3 shadow-2xl backdrop-blur-xl lg:block">
            <div className="flex items-center justify-between px-3 pb-3 pt-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">Our services</span>
              <span className="text-xs tabular-nums text-white/70">0{active + 1} / 0{slides.length}</span>
            </div>
            <div className="space-y-1">
              {slides.map((item, index) => {
                const ItemIcon = item.icon;
                const selected = index === active;
                return (
                  <button key={item.label} type="button" aria-current={selected ? "true" : undefined} onClick={() => setActive(index)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${selected ? "bg-[#DB1F26] text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${selected ? "bg-white/15" : "bg-white/10"}`}><ItemIcon className="size-4" /></span>
                    <span className="min-w-0"><span className="block text-sm font-semibold">{item.label}</span><span className={`mt-0.5 block truncate text-xs ${selected ? "text-white/90" : "text-white/60"}`}>{item.action}</span></span>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>

        <div className="flex items-center justify-between border-t border-white/15 pt-5">
          <div className="flex items-center gap-2">
            {slides.map((item, index) => <button key={item.label} type="button" aria-label={`Show ${item.label}`} aria-current={index === active ? "true" : undefined} onClick={() => setActive(index)} className={`h-1.5 rounded-full transition-all ${index === active ? "w-10 bg-[#DB1F26]" : "w-5 bg-white/30 hover:bg-white/60"}`} />)}
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
