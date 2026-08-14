import { SectionTitle, StatCard } from "@/components/ui";
import { getDevelopmentBySlug } from "@/lib/db/queries/developments";
import { getClientByUserId } from "@/lib/db/queries/clients";
import { StandMap } from "@/components/stand-map";
import { money } from "@/lib/utils";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ClientMapPage() {
  const user = await getSessionUser();
  const client = user ? await getClientByUserId(user.id) : null;
  const sale = client?.sales?.[0] ?? null;

  const development = sale?.development?.slug
    ? await getDevelopmentBySlug(sale.development.slug)
    : null;

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="Client: Stand Map" title="Your allocated stand on the estate map" />

      {development ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <StatCard label="Development" value={development.name} />
            <StatCard label="Your Stand" value={sale?.stand?.standNumber ?? "—"} detail={`${sale?.stand?.sizeSqm ?? "—"} sqm`} />
            <StatCard
              label="Available"
              value={String(development.stands.filter((s) => s.status === "AVAILABLE").length)}
            />
            <StatCard
              label="Total Stands"
              value={String(development.stands.length)}
            />
          </div>

          {development?.geoJson && (
            <section className="mt-8">
              <h2 className="mb-4 text-xl font-semibold">{development.name}: Stand Layout</h2>
              <StandMap
                stands={development.stands.map((s) => ({
                  id: s.id,
                  standNumber: s.standNumber,
                  sizeSqm: s.sizeSqm,
                  price: parseFloat(s.price),
                  status: s.status as "AVAILABLE" | "PRESALE" | "RESERVED" | "SOLD" | "BLOCKED",
                }))}
                geoJson={development.geoJson}
              />
            </section>
          )}

          <section className="premium-panel mt-8 p-5">
            <h2 className="text-xl font-semibold">Stand Details</h2>
            {sale ? (
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">Stand Number</dt>
                  <dd className="kpi-number mt-1 text-lg font-semibold">{sale.stand.standNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">Phase</dt>
                  <dd className="mt-1 font-semibold">{sale.stand.phase}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">Size</dt>
                  <dd className="kpi-number mt-1 font-semibold">{sale.stand.sizeSqm} sqm</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">Purchase Price</dt>
                  <dd className="kpi-number mt-1 font-semibold">{money(parseFloat(sale.purchasePrice))}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">Development</dt>
                  <dd className="mt-1 font-semibold">{development.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">Location</dt>
                  <dd className="mt-1 font-semibold">{development.location}, {development.province}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No stand allocated yet.</p>
            )}
          </section>
        </>
      ) : (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
          <p className="font-semibold text-muted-foreground">No development linked</p>
          <p className="text-sm text-muted-foreground">The stand map will appear here once your sale is processed.</p>
        </div>
      )}
    </div>
  );
}
