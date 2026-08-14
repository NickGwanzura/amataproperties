import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  Ban,
  CheckCircle2,
  FileText,
  Forward,
  Handshake,
  Mail,
  Phone,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { DashboardAlerts } from "@/components/dashboard-alerts";
import { SectionTitle, StatCard, StatusBadge } from "@/components/ui";
import { AgentLeadModal } from "@/components/agent-lead-modal";
import { AgentPresaleModal } from "@/components/agent-presale-modal";
import { AgentPresaleGuide } from "@/components/agent-presale-guide";
import { AgentStandLists } from "@/components/agent-stand-lists";
import { AgentClientDocuments } from "@/components/agent-client-documents";
import { getCurrentAgentProfile } from "@/lib/agent";
import { getAllLeads, getLeadsByAgent } from "@/lib/db/queries/leads";
import { getAllClients } from "@/lib/db/queries/clients";
import { getAllDevelopmentsWithStandCounts } from "@/lib/db/queries/developments";
import {
  getAllReservations,
  getReservationsByAgent,
} from "@/lib/db/queries/reservations";
import {
  getAllCommissions,
  getCommissionsByAgent,
} from "@/lib/db/queries/commissions";

import { money } from "@/lib/utils";
import {
  updateLeadStatus,
  updateReservationStatus,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

const STATUS_BADGES: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  SITE_VISIT_BOOKED: "Site Visit Booked",
  NEGOTIATING: "Negotiating",
  PRESALE_INITIATED: "Presale Initiated",
  CONVERTED_TO_SALE: "Converted to Sale",
  LOST: "Lost",
};

const LEAD_NEXT_STATUS: Record<
  string,
  {
    label: string;
    status:
      | "CONTACTED"
      | "INTERESTED"
      | "SITE_VISIT_BOOKED"
      | "NEGOTIATING"
      | "PRESALE_INITIATED";
    color: string;
  }
> = {
  NEW: {
    label: "Mark Contacted",
    status: "CONTACTED",
    color: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  },
  CONTACTED: {
    label: "Mark Interested",
    status: "INTERESTED",
    color: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  },
  INTERESTED: {
    label: "Book Site Visit",
    status: "SITE_VISIT_BOOKED",
    color: "bg-teal-50 text-teal-800 ring-teal-200",
  },
  SITE_VISIT_BOOKED: {
    label: "Mark Negotiating",
    status: "NEGOTIATING",
    color: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  NEGOTIATING: {
    label: "Initiate Presale",
    status: "PRESALE_INITIATED",
    color: "bg-orange-50 text-orange-800 ring-orange-200",
  },
};

export default async function AgentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").toLowerCase();

  const agent = await getCurrentAgentProfile();
  const agentId = agent?.id;

  const [allLeads, clients, reservations, commissions, developments] =
    await Promise.all([
      agentId ? getLeadsByAgent(agentId) : getAllLeads(),
      getAllClients(),
      agentId ? getReservationsByAgent(agentId) : getAllReservations(),
      agentId ? getCommissionsByAgent(agentId) : getAllCommissions(),
      getAllDevelopmentsWithStandCounts(),
    ]);

  const activeLeads = allLeads.filter(
    (l) => l.status !== "LOST" && l.status !== "CONVERTED_TO_SALE",
  );
  const convertedLeads = allLeads.filter(
    (l) => l.status === "CONVERTED_TO_SALE",
  );

  const filteredLeads = query
    ? activeLeads.filter((lead) => {
        const name = (lead.client?.name ?? lead.name).toLowerCase();
        const phone = (lead.phone ?? "").toLowerCase();
        const email = (lead.email ?? "").toLowerCase();
        return (
          name.includes(query) ||
          phone.includes(query) ||
          email.includes(query)
        );
      })
    : activeLeads;

  const pendingReservations = reservations.filter(
    (r) =>
      r.status !== "APPROVED" &&
      r.status !== "EXPIRED" &&
      r.status !== "CANCELLED",
  );

  const pendingComm = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + parseFloat(c.amount), 0);
  const paidComm = commissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + parseFloat(c.amount), 0);

  const quickLinks = [
    {
      label: "KYC Onboarding",
      href: "/agent/kyc",
      icon: Users,
      value: `${clients.filter((c) => c.kycStatus !== "COMPLETE").length} pending`,
    },
    {
      label: "Presale Allocation",
      href: "/agent/presales",
      icon: Handshake,
      value: `${pendingReservations.length} active`,
    },
    {
      label: "Presale Records",
      href: "/agent/records",
      icon: FileText,
      value: `${reservations.filter((r) => r.status === "APPROVED").length} approved`,
    },
    {
      label: "Commissions",
      href: "/agent/commissions",
      icon: BadgeDollarSign,
      value: money(pendingComm) + " pending",
    },
  ];

  const visibleDevelopments = developments
    .filter((development) => development.active)
    .map((development) => ({
      id: development.id,
      name: development.name,
      stands: development.stands
        .map((stand) => ({
          id: stand.id,
          standNumber: stand.standNumber,
          sizeSqm: stand.sizeSqm,
          price: stand.price,
          status: stand.status,
        }))
        .sort((a, b) => a.standNumber.localeCompare(b.standNumber, undefined, { numeric: true })),
    }));
  const dashboardClients = clients
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

  const warmLeads = activeLeads.filter((lead) => ["NEW", "CONTACTED", "INTERESTED"].includes(lead.status)).length;
  const kycUploadsMissing = dashboardClients.filter((client) =>
    client.kycStatus !== "COMPLETE" ||
    !client.nationalIdFrontUrl ||
    !client.nationalIdBackUrl ||
    !client.proofOfResidenceUrl
  ).length;
  const awaitingDepositPresales = pendingReservations.filter((reservation) => reservation.status === "AWAITING_DEPOSIT").length;
  const agentAlerts = [
    ...(warmLeads > 0 ? [{
      title: `${warmLeads} warm leads need follow-up`,
      detail: "Move contacted or interested clients toward site visit, negotiation, or presale while the context is fresh.",
      href: "/agent",
      label: "Leads",
      tone: "info" as const,
    }] : []),
    ...(awaitingDepositPresales > 0 ? [{
      title: `${awaitingDepositPresales} presales are waiting for deposit`,
      detail: "Follow up with the client and accounts team so the reserved stand does not expire silently.",
      href: "/agent/presales",
      label: "Presales",
      tone: "warning" as const,
    }] : []),
    ...(kycUploadsMissing > 0 ? [{
      title: `${kycUploadsMissing} client files need KYC documents`,
      detail: "Upload or update the missing identity and proof-of-residence files from the dashboard document panel.",
      href: "/agent#client-documents",
      label: "Documents",
      tone: "warning" as const,
    }] : []),
  ];

  return (
    <main className="dashboard-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle
          eyebrow="Agent Dashboard"
          title="Your leads, presales, and quick actions"
        >
          Manage your pipeline from lead to sale. Contact clients, advance
          stages, and convert presales.
        </SectionTitle>
        <div className="flex flex-wrap gap-2">
          <AgentLeadModal developments={visibleDevelopments.map(({ id, name }) => ({ id, name }))} />
          <AgentPresaleModal developments={visibleDevelopments} />
        </div>
      </div>

      <DashboardAlerts alerts={agentAlerts} className="mt-6" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Leads"
          value={String(filteredLeads.length)}
          detail={`${convertedLeads.length} converted`}
        />
        <StatCard
          label="Clients"
          value={String(clients.length)}
          detail={`${clients.filter((c) => c.kycStatus === "COMPLETE").length} KYC complete`}
        />
        <StatCard
          label="Pending Presales"
          value={String(pendingReservations.length)}
          detail={`${reservations.filter((r) => r.status === "APPROVED").length} approved`}
        />
        <StatCard
          label="Commission Earned"
          value={money(paidComm)}
          detail="paid out"
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((ql) => (
          <Link
            key={ql.href}
            href={ql.href}
            className="premium-panel flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <ql.icon className="size-8 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{ql.label}</p>
              <p className="truncate text-sm text-muted-foreground">
                {ql.value}
              </p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <AgentPresaleGuide />

      <AgentStandLists developments={visibleDevelopments} />

      <AgentClientDocuments clients={dashboardClients} />

      {/* My Leads */}
      <section className="premium-panel mt-10">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">My Leads</h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredLeads.length} active
          </span>
        </div>

        <div className="border-b px-5 py-3">
          <form className="relative" method="GET">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by name, phone or email"
              className="w-full rounded-lg border bg-background py-2 pl-9 pr-4 text-sm outline-none ring-0 focus:ring-2 focus:ring-primary/20"
            />
          </form>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center p-10 text-center">
            <UserPlus className="mb-3 size-10 text-muted-foreground/30" />
            <p className="font-semibold">No active leads</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {query
                ? "No leads match your search."
                : "Use Add Lead to capture a prospect, or wait for website leads to appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name / Client</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Development</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.slice(0, 25).map((lead) => {
                  const nextAction = LEAD_NEXT_STATUS[lead.status];
                  const displayName = lead.client?.name ?? lead.name;
                  const clientPhone = lead.client?.phone ?? lead.phone;
                  const clientEmail = lead.client?.email ?? lead.email;

                  return (
                    <tr key={lead.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {lead.source} ·{" "}
                          {new Date(lead.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {clientPhone}
                          </span>
                          <div className="flex items-center gap-1">
                            <a
                              href={`tel:${clientPhone}`}
                              title="Call client"
                              className="grid size-7 place-items-center rounded-md border bg-background text-muted-foreground transition hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <Phone className="size-3.5" />
                            </a>
                            <a
                              href={`mailto:${clientEmail}`}
                              title="Email client"
                              className="grid size-7 place-items-center rounded-md border bg-background text-muted-foreground transition hover:bg-sky-50 hover:text-sky-700"
                            >
                              <Mail className="size-3.5" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.development?.name ?? "\u2014"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={STATUS_BADGES[lead.status] ?? lead.status}
                        />
                      </td>
                      <td
                        className="max-w-[200px] truncate px-4 py-3 text-xs text-muted-foreground"
                        title={lead.notes ?? undefined}
                      >
                        {lead.notes
                          ? lead.notes.length > 60
                            ? lead.notes.slice(0, 60) + "\u2026"
                            : lead.notes
                          : "\u2014"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {nextAction ? (
                            <form
                              action={updateLeadStatus.bind(
                                null,
                                lead.id,
                                nextAction.status,
                              )}
                            >
                              <button
                                type="submit"
                                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold ring-1 transition ${nextAction.color} hover:opacity-80`}
                              >
                                <Forward className="size-3" />
                                {nextAction.label}
                              </button>
                            </form>
                          ) : null}
                          {lead.status !== "LOST" ? (
                            <form
                              action={updateLeadStatus.bind(
                                null,
                                lead.id,
                                "LOST",
                              )}
                            >
                              <button
                                type="submit"
                                title="Mark as lost"
                                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200 transition hover:bg-red-50"
                              >
                                <Ban className="size-3" />
                                Lost
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* My Presales */}
      <section className="premium-panel mt-8">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Handshake className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">My Presales</h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {pendingReservations.length} pending
          </span>
        </div>

        {pendingReservations.length === 0 ? (
          <div className="flex flex-col items-center p-10 text-center">
            <Handshake className="mb-3 size-10 text-muted-foreground/30" />
            <p className="font-semibold">No pending presales</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Convert a lead to presale to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Development</th>
                  <th className="px-4 py-3">Stand</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingReservations.map((r) => {
                  const isPending = r.status === "PENDING";
                  const isPresale = r.status === "PRESALE";

                  return (
                    <tr key={r.id} className="border-t hover:bg-muted/30">
                      <td className="kpi-number px-4 py-3 font-semibold">
                        {r.reference}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.client.phone}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.development.name}
                      </td>
                      <td className="kpi-number px-4 py-3 font-semibold">
                        {r.stand.standNumber}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={r.status.replace("_", " ")}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {isPending && (
                            <form
                              action={updateReservationStatus.bind(
                                null,
                                r.id,
                                "PRESALE",
                              )}
                            >
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100"
                              >
                                <Forward className="size-3" />
                                Convert to Presale
                              </button>
                            </form>
                          )}
                          {(isPending || isPresale) && (
                            <form
                              action={updateReservationStatus.bind(
                                null,
                                r.id,
                                "AWAITING_DEPOSIT",
                              )}
                            >
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-800 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
                              >
                                <CheckCircle2 className="size-3" />
                                Await Deposit
                              </button>
                            </form>
                          )}
                          <Link
                            href={`/agent/presales`}
                            className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground ring-1 ring-border transition hover:bg-muted"
                          >
                            <ArrowRight className="size-3" />
                            Full View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
