"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/ui";
import { SITE } from "@/lib/site-config";

const FAQS = [
  {
    category: "Working with Amata",
    items: [
      { q: "What does Amata help with?", a: "We are a full-service real estate agency. Our team supports developments and stand sales, residential and commercial sales, rentals and property management, and market-informed valuations." },
      { q: "How do I get started?", a: "Share your brief through our contact form, by phone, or on WhatsApp. We will match you with the right specialist and clarify the next step before any commitment." },
      { q: "Do you work with individuals and businesses?", a: "Yes. We work with first-time buyers, families, landlords, investors, developers, and businesses looking for property or ongoing portfolio support." },
      { q: "Where does Amata operate?", a: "Our team is based in Harare and works across key Zimbabwean markets. Tell us the area and property type you have in mind and we will advise on availability." },
    ],
  },
  {
    category: "Developments & sales",
    items: [
      { q: "How do I buy a serviced stand?", a: "Browse a live development, request availability, and speak with an Amata specialist. We will guide you through selection, reservation, documentation, and the payment process." },
      { q: "Can Amata help me sell a home or investment property?", a: "Yes. We prepare the positioning, pricing, marketing, viewings, negotiation, and paperwork coordination needed to move a property confidently." },
      { q: "Can I view a property before deciding?", a: "Absolutely. We arrange viewings around your schedule and share the practical details you need to compare a property properly." },
      { q: "What documents are needed to buy or sell?", a: "Requirements vary by transaction. We will provide a clear checklist covering identity, ownership, proof of funds, and any documents needed for transfer or compliance." },
    ],
  },
  {
    category: "Rentals & management",
    items: [
      { q: "What does property management include?", a: "Our management service can include tenant placement, screening, lease coordination, rent follow-up, inspections, maintenance coordination, and regular owner updates." },
      { q: "Can Amata find me a rental home or office?", a: "Yes. Tell us your preferred location, budget, timing, and property type. We will share suitable options and arrange viewings." },
      { q: "How do you help landlords?", a: "We help landlords reduce vacancy, present the property well, find suitable tenants, and keep the day-to-day details moving with clear communication." },
    ],
  },
  {
    category: "Valuations",
    items: [
      { q: "When should I request a valuation?", a: "A valuation is useful before selling, refinancing, buying, insuring, reporting an estate, or reviewing an investment portfolio." },
      { q: "What does a valuation consider?", a: "We consider location, property condition, improvements, comparable evidence, demand, and the intended purpose of the valuation." },
      { q: "How do I request a valuation?", a: "Contact us with the property address, type, and reason for the valuation. We will confirm the scope, timing, and information required." },
    ],
  },
]; 

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/70 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-semibold text-foreground transition hover:text-primary"
      >
        {q}
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform group-hover:text-primary", open && "rotate-180")} />
      </button>
      {open && (
        <p className="pb-4 text-[14px] leading-relaxed text-muted-foreground">{a}</p>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <SectionTitle eyebrow="Amata help desk" title="Frequently Asked Questions">
        Clear answers for buying, selling, renting, managing, valuing, and investing in property with Amata.
      </SectionTitle>

      <div className="mt-12 space-y-10">
        {FAQS.map(({ category, items }) => (
          <section key={category}>
            <h2 className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary"><span className="h-px w-6 bg-primary" />{category}</h2>
            <div className="rounded-2xl border border-border/70 bg-card shadow-[0_12px_40px_rgba(33,22,18,0.05)]">
              <div className="px-5">
                {items.map((item) => (
                  <FaqItem key={item.q} {...item} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-primary/20 bg-[#161314] p-7 text-white shadow-xl shadow-black/10">
        <p className="font-semibold">Still have questions?</p>
        <p className="mt-1 text-sm text-white/60">
          Contact our sales team at{" "}
          <a href="mailto:sales@amataproperties.com" className="font-semibold text-[#f0444c] underline underline-offset-2">
            sales@amataproperties.com
          </a>{" "}
          or call <a href={`tel:${SITE.phone1Tel}`} className="font-semibold text-[#f0444c]">{SITE.phone1}</a>.
        </p>
      </div>
    </main>
  );
}
