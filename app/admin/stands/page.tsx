import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { SectionTitle } from "@/components/ui";
import { getAllDevelopmentsWithStandCounts } from "@/lib/db/queries/developments";
import { getStandsFiltered, getAgentOptions } from "@/lib/db/queries/stands";
import { StandFilters } from "./_filters";
import { CreateStandsForm } from "./_create-stands";
import { StandTable } from "./_stand-table";

export const dynamic = "force-dynamic";

export default async function AdminStandsPage({
  searchParams,
}: {
  searchParams: Promise<{
    dev?: string; status?: string; phase?: string; q?: string;
    priceMin?: string; priceMax?: string; view?: string; layout?: string;
  }>;
}) {
  const { dev, status, phase, q, priceMin, priceMax, view, layout } = await searchParams;
  const developments = await getAllDevelopmentsWithStandCounts();
  const devOptions = developments.map((d) => ({ id: d.id, name: d.name }));
  const selectedDevelopment = dev ? developments.find((d) => d.id === dev) : undefined;
  const isAvailableDrilldown = Boolean(selectedDevelopment && status === "AVAILABLE");

  const viewMode = view === "archived" || view === "deleted" ? view : "active";
  const layoutMode = layout === "grid" ? "grid" : "table";

  const [filtered, agents] = await Promise.all([
    getStandsFiltered({
      developmentId: dev || undefined,
      status: (status as "AVAILABLE" | "PRESALE" | "RESERVED" | "SOLD" | "BLOCKED") || undefined,
      phase: phase || undefined,
      search: q || undefined,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      includeArchived: viewMode !== "active",
      includeDeleted: viewMode === "deleted",
    }),
    getAgentOptions(),
  ]);

  const visible = filtered.filter((s) => {
    if (viewMode === "active") return !s.archivedAt && !s.deletedAt;
    if (viewMode === "archived") return !!s.archivedAt && !s.deletedAt;
    return !!s.deletedAt;
  });

  const rows = visible.map((s) => ({
    id: s.id,
    standNumber: s.standNumber,
    sizeSqm: s.sizeSqm,
    price: s.price,
    status: s.status,
    phase: s.phase,
    archivedAt: s.archivedAt,
    deletedAt: s.deletedAt,
    developmentName: s.development?.name ?? "—",
    developmentId: s.developmentId,
  }));

  const allStands = developments.flatMap((d) => d.stands);

  return (
    <div className="dashboard-page">
      <SectionTitle
        eyebrow={isAvailableDrilldown ? "Admin: Development inventory" : "Admin: Stands"}
        title={isAvailableDrilldown ? `${selectedDevelopment!.name}: available stands` : "Stand inventory browser"}
      >
        {isAvailableDrilldown ? "Only active, available stands are shown below." : undefined}
      </SectionTitle>

      {isAvailableDrilldown && (
        <Link
          href="/admin/developments"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded border bg-background px-4 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to developments
        </Link>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-5">
        {(["AVAILABLE", "PRESALE", "RESERVED", "SOLD", "BLOCKED"] as const).map((s) => (
          <div key={s} className="premium-panel p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{s}</p>
            <p className="kpi-number mt-2 text-2xl font-semibold">{allStands.filter((st) => st.status === s).length}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-5">
        <CreateStandsForm developments={devOptions} />
        <Suspense>
          <StandFilters developments={devOptions} />
        </Suspense>
      </div>

      <section className="premium-panel mt-5">
        <div className="border-b px-5 py-4">
          <h2 className="text-xl font-semibold">Stands Register</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{rows.length} stands</p>
        </div>
        <StandTable stands={rows} agents={agents} layout={layoutMode} view={viewMode} />
      </section>
    </div>
  );
}
