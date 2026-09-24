export const dynamic = "force-dynamic";

import { ArrowRight, Building2, CheckCircle2, ClipboardList, CreditCard, Handshake, Home, MapPin, Megaphone, TrendingUp } from "lucide-react";
import { DevelopmentCard } from "@/components/development-card";
import { HeroSlider } from "@/components/hero-slider";
import { ButtonLink, SectionTitle } from "@/components/ui";
import { getAllDevelopments } from "@/lib/db/queries/developments";

export default async function HomePage() {
  // Keep the public marketing page usable in local development before a
  // database has been configured. The admin and transactional areas still
  // require DATABASE_URL, but an empty property list is a valid public state.
  let developments = [] as Awaited<ReturnType<typeof getAllDevelopments>>;
  try {
    developments = await getAllDevelopments();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to load developments; rendering the empty state.", error);
    }
  }

  const availableStands = developments.reduce((sum, d) => sum + d.stands.filter((s) => s.status === "AVAILABLE").length, 0);

  return (
    <main>
      <HeroSlider />

      {/* ── Services ── */}
      <section id="services" className="relative overflow-hidden border-b bg-black py-16 text-white sm:py-24">
        <div className="pointer-events-none absolute -right-20 top-12 size-72 rounded-full bg-[#DB1F26]/15 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#DB1F26]">01 — The Amata brief</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1] tracking-[-0.05em] sm:text-6xl">Connecting you to<br /><span className="text-white">prime opportunities.</span></h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white">Specialists in residential developments, with practical sales, marketing, and advisory support for clients and developers.</p>
          </div>
          <div className="relative mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Building2, title: "Residential developments", desc: "Explore residential stands in established and emerging developments.", href: "/developments" },
              { icon: Home, title: "Property sales", desc: "Connect property sellers with prospective buyers and facilitate the sales process.", href: "/contact" },
              { icon: Megaphone, title: "Property marketing", desc: "Showcase property through digital campaigns, social media, photography, and video.", href: "/services" },
              { icon: Handshake, title: "Advisory & partnerships", desc: "Understand an opportunity or work with us to grow a development’s reach.", href: "/services" },
            ].map(({ icon: Icon, title, desc, href }) => (
              <a key={title} href={href} className="scroll-reveal group bg-black p-6 transition-colors duration-300 hover:bg-[#DB1F26]">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[#DB1F26]/15 text-[#DB1F26] ring-1 ring-[#DB1F26]/25 transition group-hover:bg-[#DB1F26] group-hover:text-white">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white">{desc}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#DB1F26] group-hover:text-white">Learn more <ArrowRight className="size-3 transition group-hover:translate-x-1" /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── At a glance ── */}
      <section className="border-b bg-white shadow-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4">
            {[
            { icon: Building2, label: "Our focus", value: "Residential" },
            { icon: MapPin, label: "Based in", value: "Harare" },
            { icon: TrendingUp, label: "Available stands", value: String(availableStands), highlight: true },
            { icon: Handshake, label: "We work with", value: "Developers" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                <stat.icon className="size-5" />
              </span>
              <div>
                <p className={stat.highlight ? "text-2xl font-semibold text-primary" : "text-2xl font-semibold"}>
                  {stat.value}
                </p>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Developments Grid ── */}
      <section id="developments" className="mx-auto max-w-7xl px-4 py-20 sm:py-24">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <SectionTitle eyebrow="02 — Residential developments" title="Explore property opportunities">
            Browse residential developments and stands, with development information and a team ready to explain the next steps.
          </SectionTitle>
        </div>
        {developments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
            <Building2 className="mb-4 size-10 text-muted-foreground/40" />
            <p className="text-lg font-semibold text-muted-foreground">No developments listed yet</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Check back soon. New developments will appear here.</p>
          </div>
        ) : developments.length === 1 ? (
          <DevelopmentCard development={developments[0]} horizontal />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {developments.map((development) => <DevelopmentCard key={development.id} development={development} />)}
          </div>
        )}
      </section>

      {/* ── Property Journey ── */}
      <section className="border-y bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">03 — How we work</p>
            <h2 className="text-4xl font-semibold leading-[1] tracking-[-0.05em] sm:text-6xl">A clearer path<br />to your next move.</h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              From first conversation to completion, with the right specialist alongside you at every step.
            </p>
          </div>

          <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {/* Connector line (desktop) */}
            <div className="absolute left-[10%] right-[10%] top-10 hidden h-px bg-border lg:block" />

            {[
              {
                step: "01",
                icon: MapPin,
                title: "Understand",
                desc: "We take time to understand your needs and investment objectives.",
                color: "bg-black text-white",
                dot: "bg-primary",
              },
              {
                step: "02",
                icon: ClipboardList,
                title: "Advise",
                desc: "We explain relevant property information and acquisition steps.",
                color: "bg-[#efe7e1] text-primary",
                dot: "bg-primary",
              },
              {
                step: "03",
                icon: Building2,
                title: "Connect",
                desc: "We connect clients and developers with suitable opportunities.",
                color: "bg-primary text-white",
                dot: "bg-black",
              },
              {
                step: "04",
                icon: CreditCard,
                title: "Facilitate",
                desc: "We help move enquiries and property transactions forward.",
                color: "bg-[#efe7e1] text-primary",
                dot: "bg-primary",
              },
              {
                step: "05",
                icon: Handshake,
                title: "Build relationships",
                desc: "We aim to create lasting value for clients and partners.",
                color: "bg-black text-white",
                dot: "bg-primary",
              },
            ].map(({ step, icon: Icon, title, desc, color, dot }) => (
              <div key={step} className="scroll-reveal relative flex flex-col items-center text-center">
                {/* Step circle */}
                <div className={`relative z-10 mb-5 grid size-20 place-items-center rounded-full border-4 border-background shadow-md ${color}`}>
                  <Icon className="size-8" />
                  <span className={`absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow ${dot}`}>
                    {step.replace("0", "")}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{desc}</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <CheckCircle2 className="size-3.5" />
                  {step === "01" ? "Client-centred" : step === "02" ? "Transparent information" : step === "03" ? "Quality opportunities" : step === "04" ? "Professional service" : "Long-term value"}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <a
              href="#reserve"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 hover:shadow-lg"
            >
              Talk to our team <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section id="reserve" className="relative overflow-hidden bg-[#DB1F26] py-20 text-white sm:py-24">
        <div className="pointer-events-none absolute -right-20 -top-32 size-96 rounded-full border-[48px] border-white/10" />
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-80">04 — Begin here</p>
            <h2 className="mt-3 text-4xl font-semibold leading-[1] tracking-[-0.05em] sm:text-6xl">Ready for a better move?</h2>
            <p className="mt-2 text-base leading-7 opacity-85">
              Tell us what you are looking for. We connect buyers, investors, sellers, and developers with property opportunities.
            </p>
          </div>
          <ButtonLink
            href="/contact"
            className="shrink-0 bg-accent text-accent-foreground shadow-lg hover:shadow-xl"
          >
            Contact Amata <ArrowRight className="ml-2 size-4" />
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
