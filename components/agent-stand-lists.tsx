import { StatusBadge } from "@/components/ui";
import { money } from "@/lib/utils";

type StandListItem = {
  id: string;
  standNumber: string;
  sizeSqm: number;
  price: string;
  status: string;
};

type DevelopmentStandList = {
  id: string;
  name: string;
  stands: StandListItem[];
};

export function AgentStandLists({ developments }: { developments: DevelopmentStandList[] }) {
  const availableCount = developments.reduce(
    (sum, development) => sum + development.stands.filter((stand) => stand.status === "AVAILABLE").length,
    0,
  );

  return (
    <section className="premium-panel mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="text-xl font-semibold">Stand Lists by Development</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Pick available stands when adding a presale.</p>
        </div>
        <span className="text-sm text-muted-foreground">{availableCount} available</span>
      </div>
      <div className="divide-y">
        {developments.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">No active developments found.</div>
        ) : (
          developments.map((development) => {
            const available = development.stands.filter((stand) => stand.status === "AVAILABLE");
            const preview = development.stands.slice(0, 12);

            return (
              <div key={development.id} className="px-5 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{development.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {available.length} available of {development.stands.length} total
                    </p>
                  </div>
                  <StatusBadge status={available.length > 0 ? "Available" : "Reserved"} />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {preview.map((stand) => (
                    <div key={stand.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
                      <div className="min-w-0">
                        <p className="kpi-number truncate text-sm font-semibold">{stand.standNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {stand.sizeSqm} m2 - {money(Number(stand.price))}
                        </p>
                      </div>
                      <StatusBadge status={stand.status} />
                    </div>
                  ))}
                </div>
                {development.stands.length > preview.length ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Showing {preview.length} of {development.stands.length}. Use Add Presale to choose from all available stands.
                  </p>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
