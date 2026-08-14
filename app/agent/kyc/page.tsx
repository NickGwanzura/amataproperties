import { CheckCircle2, Circle, FileText, Search, XCircle } from "lucide-react";
import Link from "next/link";
import { SectionTitle } from "@/components/ui";
import { AgentClientDocuments } from "@/components/agent-client-documents";
import { AgentLeadModal } from "@/components/agent-lead-modal";
import { getAllClients } from "@/lib/db/queries/clients";
import { getAllDevelopmentsWithStandCounts } from "@/lib/db/queries/developments";

export const dynamic = "force-dynamic";

const KYC_DOCS = [
  { key: "nationalIdFrontUrl", label: "National ID Front" },
  { key: "nationalIdBackUrl", label: "National ID Back" },
  { key: "passportCopyUrl", label: "Passport Copy" },
  { key: "proofOfResidenceUrl", label: "Proof of Residence" },
  { key: "passportPhotoUrl", label: "Passport Photo" },
];

const STATUS_CONFIG = {
  COMPLETE: { label: "Complete", icon: CheckCircle2, cls: "text-emerald-700" },
  IN_REVIEW: { label: "In Review", icon: Circle, cls: "text-amber-700" },
  NOT_STARTED: { label: "Not Started", icon: Circle, cls: "text-muted-foreground" },
  REJECTED: { label: "Rejected", icon: XCircle, cls: "text-red-700" },
} as const;

export default async function AgentKycPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").toLowerCase();

  const [clients, developments] = await Promise.all([
    getAllClients(),
    getAllDevelopmentsWithStandCounts(),
  ]);

  const filteredClients = query
    ? clients.filter((client) => {
        const name = client.name?.toLowerCase() ?? "";
        const nationalId = client.nationalId?.toLowerCase() ?? "";
        const status = client.kycStatus?.toLowerCase() ?? "";
        return (
          name.includes(query) ||
          nationalId.includes(query) ||
          status.includes(query)
        );
      })
    : clients;

  const kpiCounts = {
    COMPLETE: clients.filter((c) => c.kycStatus === "COMPLETE").length,
    IN_REVIEW: clients.filter((c) => c.kycStatus === "IN_REVIEW").length,
    NOT_STARTED: clients.filter((c) => c.kycStatus === "NOT_STARTED").length,
    REJECTED: clients.filter((c) => c.kycStatus === "REJECTED").length,
  };
  const developmentOptions = developments
    .filter((development) => development.active)
    .map((development) => ({ id: development.id, name: development.name }));
  const editableClients = filteredClients
    .map((client) => ({
      id: client.id,
      name: client.name,
      nationalId: client.nationalId,
      phone: client.phone,
      email: client.email,
      address: client.address,
      kycStatus: client.kycStatus,
      nationalIdFrontUrl: client.nationalIdFrontUrl,
      nationalIdBackUrl: client.nationalIdBackUrl,
      passportCopyUrl: client.passportCopyUrl,
      proofOfResidenceUrl: client.proofOfResidenceUrl,
      passportPhotoUrl: client.passportPhotoUrl,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="dashboard-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle eyebrow="Agent: KYC Onboarding" title="Client identity verification and document status" />
        <AgentLeadModal
          developments={developmentOptions}
          buttonLabel="Add KYC"
          title="Add KYC Client"
          description="Create a client record, assign it to your lead pipeline, then upload documents."
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {(Object.entries(kpiCounts) as [keyof typeof STATUS_CONFIG, number][]).map(([status, count]) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <div key={status} className="premium-panel p-5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{cfg.label}</p>
              <p className={`kpi-number mt-2 text-3xl font-semibold ${cfg.cls}`}>{count}</p>
            </div>
          );
        })}
      </div>

      <section className="premium-panel mt-8">
        <div className="border-b px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <FileText className="size-5 text-primary" />
                KYC Document Registry
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {filteredClients.length} of {clients.length} clients
              </p>
            </div>

            <form method="GET" className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Client name, National ID, or status…"
                  className="h-9 w-60 rounded-lg border border-border/70 bg-background pl-8 pr-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <Search className="size-3.5" />
                Search
              </button>
              {q && (
                <Link
                  href="/agent/kyc"
                  className="inline-flex h-9 items-center px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Clear
                </Link>
              )}
            </form>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">National ID</th>
                <th className="px-4 py-3">KYC Status</th>
                {KYC_DOCS.map((d) => <th key={d.key} className="px-3 py-3 text-center">{d.label.replace(" ", "\u00a0")}</th>)}
                <th className="px-4 py-3">Docs</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={2 + KYC_DOCS.length + 2} className="px-4 py-12 text-center">
                    <Search className="mx-auto mb-3 size-8 text-muted-foreground/30" />
                    <p className="font-medium text-muted-foreground">No clients match your search.</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const cfg = STATUS_CONFIG[client.kycStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.NOT_STARTED;
                  const docs = KYC_DOCS.map((d) => (client as Record<string, unknown>)[d.key] as string | null);
                  const uploaded = docs.filter(Boolean).length;
                  return (
                    <tr key={client.id} className="border-t">
                      <td className="px-4 py-3 font-semibold">{client.name}</td>
                      <td className="kpi-number px-4 py-3 text-muted-foreground">{client.nationalId}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${cfg.cls}`}>
                          <cfg.icon className="size-3.5" /> {cfg.label}
                        </span>
                      </td>
                      {docs.map((url, i) => (
                        <td key={i} className="px-3 py-3 text-center">
                          {url ? (
                            <CheckCircle2 className="mx-auto size-4 text-emerald-600" />
                          ) : (
                            <Circle className="mx-auto size-4 text-muted-foreground/30" />
                          )}
                        </td>
                      ))}
                      <td className="kpi-number px-4 py-3 font-semibold">{uploaded}/{KYC_DOCS.length}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AgentClientDocuments clients={editableClients} />
    </div>
  );
}
