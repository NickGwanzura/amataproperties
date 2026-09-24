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
      { q: "What does Amata Properties specialise in?", a: "Our primary specialisation is residential developments, including residential stands and land opportunities. We also provide property sales, marketing, and advisory services, and work with developers." },
      { q: "How do I get started?", a: "Share your brief through our contact form, by phone, or on WhatsApp. We will match you with the right specialist and clarify the next step before any commitment." },
      { q: "Who does Amata work with?", a: "We serve first-time home buyers, families, property and diaspora investors, land buyers, developers, corporate and institutional clients, and property owners seeking to sell." },
      { q: "Where is Amata based?", a: "Our office is at 50 Greendale Avenue, Greendale, Harare, Zimbabwe. We connect clients with property opportunities across Zimbabwe." },
    ],
  },
  {
    category: "Developments and sales",
    items: [
      { q: "How do I enquire about a residential stand?", a: "Browse listed developments or contact us with your preferred location and requirements. We can explain available development information, payment structures, documentation, and the acquisition process." },
      { q: "Can Amata help market a property or development?", a: "Yes. Our marketing approach can include digital advertising, social media campaigns, property photography and video, development showcases, client database marketing, direct sales, viewings, and lead generation." },
      { q: "Can property developers work with Amata?", a: "Yes. We work with developers and landowners on sales and marketing solutions intended to increase exposure, enquiries, and sales." },
      { q: "What should I review before acquiring property?", a: "We help clients understand the available development information, pricing and payment structures, documentation, and general acquisition process. Specific requirements depend on the opportunity." },
    ],
  },
  {
    category: "Professional standards",
    items: [
      { q: "What is Amata's regulatory commitment?", a: "Amata Properties is committed to operating in accordance with applicable Zimbabwean real-estate regulations and professional standards, and supports ongoing professional development and compliance among its property professionals." },
      { q: "How does Amata approach client service?", a: "Our approach is to understand, advise, connect, facilitate, and build relationships. We aim to provide relevant information and professional assistance throughout the property journey." },
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
        Clear answers about residential developments, property sales and marketing, advisory, and working with Amata.
      </SectionTitle>

      <div className="mt-12 space-y-10">
        {FAQS.map(({ category, items }) => (
          <section key={category}>
            <h2 className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary"><span className="h-px w-6 bg-primary" />{category}</h2>
            <div className="scroll-reveal rounded-2xl border border-border/70 bg-card shadow-[0_12px_40px_rgba(33,22,18,0.05)]">
              <div className="px-5">
                {items.map((item) => (
                  <FaqItem key={item.q} {...item} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-primary/20 bg-black p-7 text-white shadow-xl shadow-black/10">
        <p className="font-semibold">Still have questions?</p>
        <p className="mt-1 text-sm text-white">
          Contact our sales team at{" "}
          <a href="mailto:enquiries@amataproperties.co.zw" className="font-semibold text-[#DB1F26] underline underline-offset-2">
            enquiries@amataproperties.co.zw
          </a>{" "}
          or call <a href={`tel:${SITE.phone1Tel}`} className="font-semibold text-[#DB1F26]">{SITE.phone1}</a>.
        </p>
      </div>
    </main>
  );
}
