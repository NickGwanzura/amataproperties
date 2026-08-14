import { SectionTitle, StatCard, StatusBadge } from "@/components/ui";
import { getAllLeads, getLeadsByAgent } from "@/lib/db/queries/leads";
import { getCurrentAgentProfile } from "@/lib/agent";
import { updateLeadStatus } from "@/lib/actions";
import { Ban, Forward, Mail, Phone, Search } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  SITE_VISIT_BOOKED: "Site Visit Booked",
  NEGOTIATING: "Negotiating",
  PRESALE_INITIATED: "Presale Initiated",
  CONVERTED_TO_SALE: "Converted",
  LOST: "Lost",
};

const NEXT_STATUS: Record<
  string,
  { label: string; status: "CONTACTED" | "INTERESTED" | "SITE_VISIT_BOOKED" | "NEGOTIATING" | "PRESALE_INITIATED"; color: string }
> = {
  NEW: { label: "Mark Contacted", status: "CONTACTED", color: "bg-indigo-50 text-indigo-800 ring-indigo-200" },
  CONTACTED: { label: "Mark Interested", status: "INTERESTED", color: "bg-cyan-50 text-cyan-800 ring-cyan-200" },
  INTERESTED: { label: "Book Site Visit", status: "SITE_VISIT_BOOKED", color: "bg-teal-50 text-teal-800 ring-teal-200" },
  SITE_VISIT_BOOKED: { label: "Mark Negotiating", status: "NEGOTIATING", color: "bg-amber-50 text-amber-800 ring-amber-200" },
  NEGOTIATING: { label: "Initiate Presale", status: "PRESALE_INITIATED", color: "bg-orange-50 text-orange-800 ring-orange-200" },
};

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  WALK_IN: "Walk-in",
  SOCIAL_MEDIA: "Social Media",
  PHONE: "Phone",
  EMAIL: "Email",
  OTHER: "Other",
};

export default async function AgentLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const agent = await getCurrentAgentProfile();
  const allLeads = agent
    ? await getLeadsByAgent(agent.id)
    : await getAllLeads();

  const query = (await searchParams).q?.toLowerCase() ?? "";

  const filtered = query
    ? allLeads.filter((l) => {
        const name = l.client?.name ?? l.name;
        const phone = l.client?.phone ?? l.phone;
        return (
          name.toLowerCase().includes(query) ||
          (phone != null && phone.toLowerCase().includes(query)) ||
          (l.email != null && l.email.toLowerCase().includes(query)) ||
          (l.notes != null && l.notes.toLowerCase().includes(query))
        );
      })
    : allLeads;

  const active = allLeads.filter((l) => l.status !== "LOST" && l.status !== "CONVERTED_TO_SALE");
  const converted = allLeads.filter((l) => l.status === "CONVERTED_TO_SALE");
  const lost = allLeads.filter((l) => l.status === "LOST");

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="Agent: All Leads" title="Full lead register across all stages" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Leads" value={String(allLeads.length)} />
        <StatCard label="Active" value={String(active.length)} />
        <StatCard label="Converted" value={String(converted.length)} detail="to sale" />
        <StatCard label="Lost" value={String(lost.length)} />
      </div>

      <section className="premium-panel mt-8">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold">All Leads</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{filtered.length} total</p>
          </div>
          <form method="GET">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search leads…"
                className="h-9 rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Development</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    {query ? "No leads match your search." : "No leads yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => {
                  const name = lead.client?.name ?? lead.name;
                  const phone = lead.client?.phone ?? lead.phone;
                  const nextAction = NEXT_STATUS[lead.status];
                  const isDone =
                    lead.status === "CONVERTED_TO_SALE" || lead.status === "LOST";

                  return (
                    <tr key={lead.id} className={`border-t hover:bg-muted/30 ${isDone ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3 font-semibold">{name}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-muted-foreground">{phone}</p>
                        <div className="mt-1 flex items-center gap-1">
                          <a
                            href={`tel:${phone}`}
                            className="grid size-7 place-items-center rounded-md border bg-background text-muted-foreground transition hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <Phone className="size-3.5" />
                          </a>
                          <a
                            href={`mailto:${lead.email}`}
                            className="grid size-7 place-items-center rounded-md border bg-background text-muted-foreground transition hover:bg-sky-50 hover:text-sky-700"
                          >
                            <Mail className="size-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.development?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.notes ? (
                          <span className="block max-w-[200px] truncate" title={lead.notes}>
                            {lead.notes}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {SOURCE_LABELS[lead.source] ?? lead.source}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={STATUS_LABELS[lead.status] ?? lead.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {!isDone && (
                          <div className="flex flex-wrap gap-1.5">
                            {nextAction && (
                              <form action={updateLeadStatus.bind(null, lead.id, nextAction.status)}>
                                <button
                                  type="submit"
                                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold ring-1 transition hover:opacity-80 ${nextAction.color}`}
                                >
                                  <Forward className="size-3" />
                                  {nextAction.label}
                                </button>
                              </form>
                            )}
                            <form action={updateLeadStatus.bind(null, lead.id, "LOST")}>
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200 transition hover:bg-red-50"
                              >
                                <Ban className="size-3" />
                                Lost
                              </button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
