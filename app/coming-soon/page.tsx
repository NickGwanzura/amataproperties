import type { Metadata } from "next";
import { ArrowUpRight, MapPin } from "lucide-react";
import { LaunchCountdown } from "./_countdown";

export const metadata: Metadata = {
  title: "Launching 01 September | Amata Properties",
  description: "Amata Properties is launching on 01 September.",
};

export default function ComingSoonPage() {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(#D71920 1px, transparent 1px), linear-gradient(90deg, #D71920 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
      <div className="pointer-events-none absolute -left-40 top-1/4 size-[32rem] rounded-full bg-[#D71920]/20 blur-[140px]" />
      <div className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-[#D71920]/15 blur-[120px]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 lg:px-16">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          <span>Amata Properties</span>
          <span className="flex items-center gap-2"><MapPin className="size-3.5 text-[#F0444C]" /> Zimbabwe</span>
        </div>

        <section className="max-w-4xl py-24 sm:py-32 lg:py-40">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#F0444C]/40 bg-[#D71920]/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F0444C]">
            New chapter loading
          </p>
          <h1 className="max-w-4xl text-6xl font-semibold leading-[0.9] tracking-[-0.07em] sm:text-8xl lg:text-[9.5rem]">
            Property,<br /><span className="text-[#D71920]">thoughtfully.</span>
          </h1>
          <p className="mt-8 max-w-xl text-base leading-7 text-white/55 sm:text-lg">
            A sharper, more considered way to move through Zimbabwean property is almost here.
          </p>
          <div className="mt-12 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Launching</p>
              <p className="mt-1 text-3xl font-semibold tracking-[-0.04em]">01 September</p>
            </div>
            <span className="hidden h-10 w-px bg-white/15 sm:block" />
            <a href="mailto:enquiries@amataproperties.co.zw" className="inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-[#F0444C]">
              enquiries@amataproperties.co.zw <ArrowUpRight className="size-4" />
            </a>
          </div>
          <div className="mt-10">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Countdown to launch</p>
            <LaunchCountdown />
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-[10px] uppercase tracking-[0.18em] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>Office 210, Century House · 49 Nelson Mandela Avenue · Harare</span>
          <span>+263 78 699 9404</span>
        </div>
      </div>
    </main>
  );
}
