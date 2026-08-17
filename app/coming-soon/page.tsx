import type { Metadata } from "next";
import { ArrowUpRight, CalendarDays, Mail, Phone } from "lucide-react";
import { appUrl, company } from "@/config";
import { LaunchCountdown } from "./_countdown";
import { ShareButton } from "./_share-button";

export const metadata: Metadata = {
  title: "Amata Properties Zimbabwe | Launching 01 September 2026",
  description: "Amata Properties is launching 01 September 2026. Discover a sharper way to buy, sell, rent and manage property across Zimbabwe.",
  keywords: ["Amata Properties", "Zimbabwe real estate", "Harare property", "property for sale Zimbabwe", "property rentals Harare", "property valuations Zimbabwe"],
  alternates: { canonical: appUrl("/coming-soon") },
  openGraph: {
    type: "website",
    url: appUrl("/coming-soon"),
    siteName: company.name,
    title: "Amata Properties Zimbabwe | Launching 01 September 2026",
    description: "A sharper way to buy, sell, rent and manage property across Zimbabwe.",
    images: [{ url: appUrl("/opengraph-image"), width: 1200, height: 630, alt: "Amata Properties — Zimbabwe real estate" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amata Properties Zimbabwe | Launching 01 September 2026",
    description: "A sharper way to buy, sell, rent and manage property across Zimbabwe.",
    images: [appUrl("/opengraph-image")],
  },
};

export default function ComingSoonPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        name: company.name,
        url: appUrl(),
        email: `mailto:${company.email}`,
        telephone: company.phone1,
        address: { "@type": "PostalAddress", streetAddress: "Office 210, Century House, 49 Nelson Mandela Avenue", addressLocality: "Harare", addressCountry: "ZW" },
        areaServed: "Zimbabwe",
        description: company.tagline,
      }) }} />
      <div className="grid min-h-screen lg:grid-cols-[1.03fr_0.97fr]">
        <section className="relative flex flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-12">
          <div className="pointer-events-none absolute -left-40 top-1/3 size-[28rem] rounded-full bg-[#D71920]/20 blur-[150px]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(#D71920 1px, transparent 1px), linear-gradient(90deg, #D71920 1px, transparent 1px)", backgroundSize: "72px 72px" }} />

          <div className="relative flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
            <span className="size-2 rounded-full bg-[#D71920] shadow-[0_0_18px_rgba(215,25,32,0.9)]" />
            A new property experience is arriving
          </div>

          <div className="relative py-20 sm:py-24 lg:py-16">
            <p className="mb-7 text-xs font-semibold uppercase tracking-[0.28em] text-[#F0444C]">Launching 01 September 2026</p>
            <h1 className="max-w-3xl text-[clamp(3.8rem,8vw,8.5rem)] font-semibold leading-[0.86] tracking-[-0.085em]">
              Find your<br /><span className="text-[#D71920]">place.</span>
            </h1>
            <p className="mt-8 max-w-lg text-base leading-7 text-white/55 sm:text-lg">
              Amata is bringing a sharper, more considered way to buy, sell, rent and manage property across Zimbabwe.
            </p>

            <div className="mt-12 max-w-xl rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                  <CalendarDays className="size-4 text-[#F0444C]" /> Countdown to launch
                </div>
                <span className="rounded-full border border-[#D71920]/40 bg-[#D71920]/10 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#F0444C]">Almost here</span>
              </div>
              <LaunchCountdown />
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7">
              <a href="mailto:enquiries@amataproperties.co.zw" className="group inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-[#F0444C]">
                <Mail className="size-4 text-[#F0444C]" /> enquiries@amataproperties.co.zw
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a href="tel:+263786999404" className="inline-flex items-center gap-2 text-sm font-semibold text-white/55 transition-colors hover:text-white">
                <Phone className="size-4 text-[#F0444C]" /> +263 78 699 9404
              </a>
            </div>
          </div>

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Office 210 · Century House · 49 Nelson Mandela Avenue · Harare</p>
            <ShareButton />
          </div>
        </section>

        <section className="relative min-h-[32rem] overflow-hidden lg:min-h-screen">
          <div className="absolute inset-0 bg-[url('/property-hero.jpg')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/15 lg:bg-gradient-to-r lg:from-black/55 lg:via-black/10 lg:to-transparent" />
          <div className="absolute bottom-8 left-6 right-6 flex items-end justify-between gap-4 sm:bottom-10 sm:left-10 sm:right-10">
            <p className="max-w-xs text-sm leading-6 text-white/65">Property decisions, made with clarity.</p>
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Zimbabwe · 2026</span>
          </div>
        </section>
      </div>
    </main>
  );
}
