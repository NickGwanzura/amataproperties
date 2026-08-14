import { SectionTitle } from "@/components/ui";
import { getAllClientsWithRecords } from "@/lib/db/queries/clients";
import { ClientDirectory } from "./_client-directory";

export const dynamic = "force-dynamic";

export default async function AccountsClientsPage() {
  const clients = await getAllClientsWithRecords();

  const complete = clients.filter((c) => c.kycStatus === "COMPLETE").length;
  const inReview = clients.filter((c) => c.kycStatus === "IN_REVIEW").length;

  const withSales = clients.filter((c) => c.sales.length > 0).length;

  return (
    <div className="dashboard-page">
      <SectionTitle
        eyebrow="Accounts: Clients"
        title="Client directory with sales, presales, and lead records"
      >
        Search across all clients to view their full portfolio: sales, presale
        reservations, and lead pipeline history.
      </SectionTitle>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Clients", value: String(clients.length), color: "text-foreground" },
          { label: "KYC Complete", value: String(complete), color: "text-emerald-700" },
          { label: "In Review", value: String(inReview), color: "text-sky-700" },
          { label: "With Sales", value: String(withSales), color: "text-indigo-700" },
        ].map((stat) => (
          <div key={stat.label} className="premium-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {stat.label}
            </p>
            <p className={`mt-2 text-3xl font-semibold leading-none kpi-number ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="premium-panel mt-8">
        <div className="border-b px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Client Registry</h2>
            <span className="text-sm text-muted-foreground">
              {clients.length} clients
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            KYC must be COMPLETE before presale allocation can proceed.
          </p>
        </div>
        <div className="p-5">
          <ClientDirectory clients={clients} />
        </div>
      </section>
    </div>
  );
}
