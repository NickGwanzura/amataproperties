import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileCheck2,
  Handshake,
  MapPin,
  MessageCircle,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { SectionTitle } from "@/components/ui";
import { getMarketingImageUrl } from "@/lib/site-settings";
import { waLink } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn how Amata helps people buy, sell, lease, and manage property with clarity and confidence across Zimbabwe.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    icon: Shield,
    title: "Clear Advice",
    desc: "Straightforward guidance that helps you understand the opportunity, the process, and the decision in front of you.",
  },
  {
    icon: TrendingUp,
    title: "Personal Service",
    desc: "A responsive team that listens first and stays with you from first conversation to completion.",
  },
  {
    icon: MapPin,
    title: "Local Expertise",
    desc: "Deep knowledge of Zimbabwe's neighbourhoods, property market, and the details that matter.",
  },
  {
    icon: Users,
    title: "End-to-End Support",
    desc: "Buying, selling, leasing, and management support under one trusted agency.",
  },
];

const stats = [
  { value: "500+", label: "Clients supported" },
  { value: "6",    label: "Locations served" },
  { value: "8+",   label: "Years in market" },
  { value: "100%", label: "Focused on your goals" },
];

const process = [
  {
    icon: MapPin,
    step: "01",
    title: "Tell us your goals",
    desc: "Share what you are looking for, whether that is a home, investment, tenant, buyer, or a reliable management partner.",
  },
  {
    icon: FileCheck2,
    step: "02",
    title: "Get a clear shortlist",
    desc: "We combine your brief with our market knowledge to surface practical opportunities and explain the trade-offs clearly.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Move forward confidently",
    desc: "From viewings and negotiation to paperwork and handover, your agent keeps every next step visible.",
  },
  {
    icon: Handshake,
    step: "04",
    title: "Stay supported",
    desc: "Our relationship does not end at completion. We remain available for future moves, leasing, and property management needs.",
  },
];

export default async function AboutPage() {
  const marketingImageUrl = await getMarketingImageUrl();

  return (
    <main>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[60vh] overflow-hidden">
        <Image
          src={marketingImageUrl}
          alt="Amata Properties aerial"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

        <div className="relative mx-auto flex min-h-[60vh] max-w-7xl flex-col justify-end px-4 pb-14 text-white">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-white">
            <Building2 className="size-4 text-primary" />
            About Amata Properties
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            A better way to<br className="hidden sm:block" />
            <span className="text-primary"> move through property</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white">
            Founded in Harare, Amata is a full-service real estate agency helping people and
            businesses make confident property decisions across Zimbabwe.
          </p>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────── */}
      <div className="border-b border-t bg-[#0d0d0d]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/[0.07] lg:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="px-8 py-7 text-center">
              <p className="text-3xl font-semibold tracking-tight text-primary">{value}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mission ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionTitle
              eyebrow="Our Mission"
              title="Property advice built around real life"
            >
              We believe property should be easier to understand and easier to act on. Amata
              brings together local knowledge, trusted relationships, and practical technology to
              make every move more transparent—from first enquiry to final handover.
            </SectionTitle>

            <div className="mt-8 space-y-3">
              {[
                "Buy, sell, lease, or manage with one team",
                "Local insight translated into clear choices",
                "Responsive support at every stage",
                "A digital experience that keeps you informed",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="/services"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-px hover:shadow-lg hover:shadow-primary/30"
            >
              Explore Our Services <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={marketingImageUrl}
              alt="Development site"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────────────── */}
      <section className="border-t bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle eyebrow="Our Values" title="What we stand for" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10 transition group-hover:from-primary group-hover:to-primary/80 group-hover:text-white group-hover:ring-primary/30">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <SectionTitle eyebrow="The Amata way" title="A clearer path to your next property move" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {process.map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="relative flex flex-col gap-4">
              {/* Connector line */}
              <div className="absolute left-6 top-6 -z-10 hidden h-px w-full bg-border lg:block" />
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-primary/20 bg-background text-primary">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/60">
                  Step {step}
                </p>
                <h3 className="mt-1 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t bg-[#0d0d0d] py-20 text-white">
        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#DB1F26 1px, transparent 1px), linear-gradient(90deg, #DB1F26 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Get started
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready for your next move?
          </h2>
          <p className="mt-4 text-base leading-7 text-white">
            Tell us what you need and let our team help you find the right way forward.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 transition hover:-translate-y-px hover:shadow-lg hover:shadow-primary/40"
            >
              Explore Our Services <ArrowRight className="size-4" />
            </Link>
            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              <MessageCircle className="size-4 text-emerald-400" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
