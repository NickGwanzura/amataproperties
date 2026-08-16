import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2, Download, Info, MapPinned, Maximize2 } from "lucide-react";
import { ReservationForm } from "@/components/reservation-form";
import { ButtonLink, SectionTitle, StatCard } from "@/components/ui";
import { StandMapLoader } from "@/components/stand-map-loader";
import { StandsExplorer } from "@/components/stands-explorer";
import { getDevelopmentBySlug } from "@/lib/db/queries/developments";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dev = await getDevelopmentBySlug(slug);
  if (!dev) return {};

  const description = `${dev.description.slice(0, 155).trimEnd()}…`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://amataproperties.co.zw";
  const url = `${appUrl}/developments/${slug}`;

  const ogImageUrl = dev.heroImage?.startsWith("http") ? dev.heroImage : "/opengraph-image";

  return {
    title: dev.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${dev.name} | Amata`,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: dev.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${dev.name} | Amata`,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function DevelopmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ stand?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const dev = await getDevelopmentBySlug(slug);
  if (!dev) notFound();

  const available = dev.stands.filter((s) => s.status === "AVAILABLE");
  const sizes = dev.stands.map((s) => s.sizeSqm);
  const totalStands = dev.stands.length;
  const soldCount = dev.stands.filter((s) => s.status === "SOLD").length;
  const reservedCount = dev.stands.filter((s) => s.status === "RESERVED").length;
  const presaleCount = dev.stands.filter((s) => s.status === "PRESALE").length;

  const avgSize = sizes.reduce((s, v) => s + v, 0) / sizes.length;
  const largeThreshold = Math.round(avgSize * 1.5);
  const largeStands = dev.stands.filter((s) => s.sizeSqm >= largeThreshold);
  const maxSize = Math.max(...sizes);

  return (
    <main>
      {/* ── Hero ── */}
      <section className="relative min-h-[65vh] overflow-hidden">
        <Image
          src={dev.heroImage}
          alt={dev.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative mx-auto flex min-h-[65vh] max-w-7xl flex-col justify-end px-4 pb-10 text-white">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-white/80">
            <MapPinned className="size-4" /> {dev.location}, {dev.province}
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
            {dev.name}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
            {dev.description}
          </p>
        </div>
      </section>

      {/* ── Quick Stats ── */}
      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Starting Price" value={money(Number(dev.startingPrice))} />
        <StatCard label="Price Per SQM" value={money(Number(dev.pricePerSqm))} />
        <StatCard label="Deposit Required" value={money(Number(dev.depositAmount))} />
        <StatCard
          label="Stand Sizes"
          value={`${Math.min(...sizes)}–${maxSize} sqm`}
          detail={`${totalStands} total stands`}
        />
        {largeStands.length > 0 && (
          <StatCard
            label="Large Stands"
            value={String(largeStands.length)}
            detail={`${largeThreshold}+ sqm, up to ${maxSize} sqm`}
          />
        )}
      </section>

      {/* ── Main Content + Sidebar ── */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-12">
          {/* Overview */}
          <div>
            <SectionTitle eyebrow="Overview" title="Development Details">
              {dev.description}
            </SectionTitle>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {dev.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm transition hover:border-primary/20 hover:shadow-md">
                  <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  <span className="text-sm font-semibold">{amenity}</span>
                </div>
              ))}
            </div>
            {/* Infrastructure status */}
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>{dev.infrastructureStatus}</span>
            </div>
            {/* Large stand callout */}
            {largeStands.length > 0 && (
              <div className="mt-3 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
                <Maximize2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  <strong>{largeStands.length} large stand{largeStands.length === 1 ? "" : "s"}</strong> available at{" "}
                  {largeThreshold}+ sqm, including sizes up to <strong>{maxSize} sqm</strong> — ideal for buyers wanting extra space.
                </span>
              </div>
            )}
          </div>

          {/* Gallery */}
          <div>
            <SectionTitle title="Gallery" />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {dev.gallery.map((image) => (
                <a
                  key={image}
                  href={image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition hover:shadow-md"
                >
                  <Image
                    src={image}
                    alt={`${dev.name} gallery image`}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(min-width: 1024px) 25vw, 100vw"
                  />
                </a>
              ))}
            </div>
          </div>

          {!!dev.geoJson && (
            <div>
              <SectionTitle title="Interactive GIS Stand Map">
                Green is available, yellow is presale, orange is reserved, red is sold, and grey is
                blocked.
              </SectionTitle>
              <div className="mt-5 rounded-xl border border-border/50 overflow-hidden shadow-sm">
                <StandMapLoader
                  stands={dev.stands.map((s) => ({
                    id: s.id,
                    standNumber: s.standNumber,
                    sizeSqm: s.sizeSqm,
                    price: Number(s.price),
                    status: s.status,
                  }))}
                  geoJson={dev.geoJson}
                />
              </div>
            </div>
          )}

          {/* Stands Table */}
          <div id="stands">
            <SectionTitle
              title="Available Stands"
              eyebrow={`${available.length} of ${totalStands} available`}
            >
              {soldCount > 0 || reservedCount > 0 || presaleCount > 0
                ? `${soldCount} sold · ${reservedCount} reserved · ${presaleCount} in presale`
                : "All stands currently available for reservation."}
            </SectionTitle>
            <div className="mt-5">
              {available.length > 0 ? (
                <StandsExplorer
                  stands={available.map((s) => ({
                    id: s.id,
                    standNumber: s.standNumber,
                    sizeSqm: s.sizeSqm,
                    price: Number(s.price),
                    status: s.status,
                  }))}
                  largeThreshold={largeThreshold}
                />
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No stands currently available. Check back soon or contact our sales team.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <aside className="space-y-6">
          {/* Pricing Card */}
          <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Pricing &amp; Terms</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Infrastructure Status</p>
                <p className="text-sm font-semibold">{dev.infrastructureStatus}</p>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Payment Terms</p>
                <p className="text-sm leading-6 text-muted-foreground">{dev.paymentTerms}</p>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Terms &amp; Conditions</p>
                <p className="text-sm leading-6 text-muted-foreground">{dev.termsAndConditions}</p>
              </div>
            </div>
            <ButtonLink
              href={dev.brochureUrl ?? "#"}
              className="mt-5 w-full"
            >
              <Download className="mr-2 size-4" /> Download Brochure
            </ButtonLink>
          </div>

          {/* Reservation Form - Sticky on desktop */}
          <div className="rounded-xl border border-primary/20 bg-card shadow-lg shadow-primary/5 ring-1 ring-primary/10">
            <div className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Quick Reserve</p>
            </div>
            <ReservationForm development={dev} preselectedStandId={sp.stand} />
          </div>
        </aside>
      </section>
    </main>
  );
}
