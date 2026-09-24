import type { Metadata } from "next";
import { ArrowRight, Building2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "./_form";
import { company, SALES_LINES, waLink } from "@/config";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Amata Properties about residential developments, property sales, marketing, advisory, and developer partnerships.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b bg-black py-20 text-white sm:py-28">
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(#DB1F26 1px, transparent 1px), linear-gradient(90deg, #DB1F26 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glows */}
        <div className="pointer-events-none absolute -left-32 top-0 h-[400px] w-[400px] rounded-full bg-primary/25 blur-[100px]" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-primary/10 blur-[80px]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-white">
            <Building2 className="size-4 text-primary" />
            Get in touch
          </p>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-7xl">
            Let&apos;s make your<br className="hidden sm:block" />
            <span className="text-[#DB1F26]"> next move.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white">
            Tell us what property opportunity you are seeking, selling, or marketing. We&apos;ll help
            clarify the relevant information and next steps.
          </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm sm:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#DB1F26]">Visit the Amata office</p>
            <p className="mt-4 text-2xl font-semibold leading-tight">Amata Properties</p>
            <p className="mt-3 text-sm leading-6 text-white">{company.address}</p>
            <a href={`tel:${company.phone1Tel}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-[#DB1F26]">
              <Phone className="size-4 text-[#DB1F26]" /> {company.phone1}
            </a>
          </div>
        </div>
      </section>

      {/* ── Contact Cards ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:[&>*]:flex lg:[&>*]:flex-col">

          {/* Address */}
          <a
            href="https://www.google.com/maps/search/50+Greendale+Avenue+Greendale"
            target="_blank"
            rel="noopener noreferrer"
            className="scroll-reveal marketing-card group rounded-2xl border bg-card p-6 shadow-sm hover:border-primary/30 hover:shadow-md"
          >
            {/* Icon */}
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10 transition group-hover:from-primary group-hover:to-primary/80 group-hover:text-white group-hover:ring-primary/30">
              <MapPin className="size-5" />
            </span>

            {/* Content */}
            <div className="mt-5 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Office
              </p>
              <p className="mt-2 font-semibold leading-snug">{company.address}</p>
            </div>

            {/* Action */}
            <span className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-primary">
              Get directions
              <ArrowRight className="size-3 transition group-hover:translate-x-0.5" />
            </span>
          </a>

          {/* Phone */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
            {/* Icon */}
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
              <Phone className="size-5" />
            </span>

            {/* Content */}
            <div className="mt-5 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Call us
              </p>
              <ul className="mt-2 grid grid-cols-2 gap-x-2 gap-y-2.5">
                {SALES_LINES.map(({ number, href }) => (
                  <li key={number}>
                    <a
                      href={href}
                      className="group/num flex items-center gap-1.5 text-sm font-semibold transition hover:text-primary"
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
                      {number}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action */}
            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
            >
              <MessageCircle className="size-3.5" />
              Chat on WhatsApp
            </a>
          </div>

          {/* Email */}
          <a
            href={`mailto:${company.email}`}
            className="group rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            {/* Icon */}
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10 transition group-hover:from-primary group-hover:to-primary/80 group-hover:text-white group-hover:ring-primary/30">
              <Mail className="size-5" />
            </span>

            {/* Content */}
            <div className="mt-5 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Email
              </p>
              <div className="mt-2 space-y-1.5">
                <p className="text-sm font-semibold">{company.email}</p>
              </div>
            </div>

            {/* Action */}
            <span className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-primary">
              Send email
              <ArrowRight className="size-3 transition group-hover:translate-x-0.5" />
            </span>
          </a>

          {/* What we do */}
          <div className="scroll-reveal marketing-card rounded-2xl border bg-card p-6 shadow-sm hover:border-primary/30 hover:shadow-md">
            {/* Icon */}
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
              <Building2 className="size-5" />
            </span>

            {/* Content */}
            <div className="mt-5 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Our focus
              </p>
              <p className="mt-2 text-sm font-semibold leading-6">Residential developments, property sales, marketing, and advisory.</p>
            </div>

            {/* Action */}
            <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
              Specialists in residential developments
            </p>
          </div>

        </div>
      </section>

      {/* ── Enquiry Form ───────────────────────────────────────────────── */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <ContactForm />
        </div>
      </section>

      {/* ── Map embed ──────────────────────────────────────────────────── */}
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                Find us
              </p>
              <h2 className="mt-1 text-xl font-semibold">{company.address}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Contact us about residential developments, property sales, marketing, and advisory.
              </p>
            </div>
            <a
              href="https://www.google.com/maps/search/50+Greendale+Avenue+Greendale"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Open in Google Maps <ArrowRight className="size-4" />
            </a>
          </div>

          {/* Map iframe */}
          <div className="mt-6 overflow-hidden rounded-2xl border shadow-sm">
            <iframe
              title="Amata Properties office location"
              src="https://maps.google.com/maps?q=50%20Greendale%20Avenue%2C%20Greendale%2C%20Harare%2C%20Zimbabwe&output=embed"
              width="100%"
              height="400"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
