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
    "Learn how Amata Properties connects buyers, investors, sellers, and developers to residential property opportunities in Zimbabwe.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    icon: Shield,
    title: "Integrity",
    desc: "We conduct our business honestly and responsibly.",
  },
  {
    icon: Users,
    title: "Professionalism",
    desc: "We maintain high standards in our communication, service, and conduct.",
  },
  {
    icon: FileCheck2,
    title: "Transparency",
    desc: "We provide clear, relevant property information to support informed decisions.",
  },
  {
    icon: TrendingUp,
    title: "Excellence",
    desc: "We continuously seek to improve the quality of our service.",
  },
  {
    icon: Building2,
    title: "Innovation",
    desc: "We embrace modern technology and digital marketing to improve the property experience.",
  },
  {
    icon: Handshake,
    title: "Relationships",
    desc: "We believe lasting relationships are the foundation of a successful real-estate business.",
  },
];

const clients = [
  "First-time home buyers",
  "Families looking to build homes",
  "Property investors and diaspora investors",
  "Land and property buyers",
  "Property developers",
  "Corporate and institutional clients",
  "Property owners seeking to sell",
];

const process = [
  {
    icon: MapPin,
    step: "01",
    title: "Understand",
    desc: "We take time to understand your needs, requirements, and investment objectives.",
  },
  {
    icon: FileCheck2,
    step: "02",
    title: "Advise",
    desc: "We explain relevant property information, development details, and acquisition steps.",
  },
  {
    icon: Building2,
    step: "03",
    title: "Connect",
    desc: "We connect clients with property opportunities and development partners with prospective buyers.",
  },
  {
    icon: Handshake,
    step: "04",
    title: "Facilitate",
    desc: "We support property marketing and help move enquiries and transactions forward.",
  },
  {
    icon: MessageCircle,
    step: "05",
    title: "Build relationships",
    desc: "We aim to create lasting value for clients, development partners, and stakeholders.",
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
            Connecting you to<br className="hidden sm:block" />
            <span className="text-primary"> prime property opportunities</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/85">
            Amata Properties Private Limited is a Zimbabwean real-estate company connecting
            individuals, families, investors, and businesses with quality property opportunities.
          </p>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────── */}
      <div className="border-b border-t bg-[#0d0d0d]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Who we serve</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {clients.map((client) => <span key={client} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/85">{client}</span>)}
          </div>
        </div>
      </div>

      {/* ── Mission ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionTitle
              eyebrow="Our mission"
              title="Connecting people to property opportunities"
            >
              We connect people to property opportunities through professional service,
              transparent information, and market-driven real-estate solutions. Our aim is to
              create long-term value for clients, development partners, and stakeholders. Our
              client-centred approach combines local market knowledge with strategic marketing
              and clear communication.
            </SectionTitle>

            <div className="mt-8 space-y-3">
              {[
                "Residential developments and stand opportunities",
                "Property sales, marketing, and advisory",
                "Clear information about pricing, terms, and documentation",
                "Professional support for clients and developer partners",
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
              src="/property-hero.jpg"
              alt="Contemporary family home with a landscaped garden"
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
        <SectionTitle eyebrow="Our values" title="What we stand for" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="scroll-reveal marketing-card group rounded-2xl border bg-card p-6 shadow-sm hover:border-primary/30 hover:shadow-md"
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
        <SectionTitle eyebrow="Our approach" title="Understand. Advise. Connect. Facilitate. Build relationships." />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {process.map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="scroll-reveal relative flex flex-col gap-4">
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

      <section className="border-t bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[0.65fr_1.35fr] md:items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Professional standards</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Our regulatory commitment</h2>
          </div>
          <p className="max-w-3xl text-base leading-7 text-foreground">
            Amata Properties is committed to operating in accordance with applicable regulations
            and professional standards for estate agency practice in Zimbabwe. The Estate Agents
            Council (EAC) is the statutory body responsible for regulating estate agency practice.
            We support continuous professional development and compliance among our property professionals,
            including the EAC&apos;s requirement that, from 1 January 2027, firms employ negotiators who have
            passed or are exempt from its Negotiators Programme.
          </p>
        </div>
      </section>

      <section className="border-t bg-[#0d0d0d] py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Our vision</p>
            <p className="mt-3 max-w-xl text-2xl font-semibold leading-snug">To become a trusted, recognised real-estate brand in Zimbabwe, known for professionalism, integrity, innovation, and access to quality property opportunities.</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Our commitment</p>
            <p className="mt-3 max-w-xl text-base leading-7 text-white/75">We are building a property platform where buyers, investors, sellers, and developers can connect through professional service and transparent information.</p>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#DB1F26] py-20 text-white">
        <div className="pointer-events-none absolute -right-20 -top-32 size-96 rounded-full border-[48px] border-white/10" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
            Get started
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready for your next move?
          </h2>
          <p className="mt-4 text-base leading-7 text-white/85">
            Tell us what you need and let our team help you find the right way forward.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-px hover:bg-neutral-900"
            >
              Contact Amata <ArrowRight className="size-4" />
            </Link>
            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/20"
            >
              <MessageCircle className="size-4" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
