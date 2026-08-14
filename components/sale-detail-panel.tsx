import { BadgeCheck, CalendarDays, CheckCircle2, Clock, Download, FileText, Home, Receipt, ShieldCheck, TriangleAlert, Upload, UserPlus, type LucideIcon } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { money } from "@/lib/utils";
import { getInstallmentScheduleSnapshot, getSaleFinancialSnapshot, getVerifiedInstallmentTotal } from "@/lib/finance";

type Installment = {
  id: string;
  sequence: number;
  dueDate: Date | string;
  amountDue: string;
  amountPaid: string;
  paidAt?: Date | string | null;
};

type Payment = {
  id: string;
  type: string;
  method: string;
  status: string;
  amount: string;
  reference: string;
  paidAt: Date | string;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt?: Date | string;
};

type Document = {
  id: string;
  type: string;
  title: string;
  url: string;
  createdAt: Date | string;
};

type Sale = {
  id: string;
  saleNumber: string;
  status: string;
  purchasePrice: string;
  depositRequired: string;
  depositPaid: string;
  outstandingBalance: string;
  createdAt: Date | string;
  activatedAt?: Date | string;
  client?: {
    name: string;
    email: string;
    phone?: string | null;
    kycStatus?: string;
    nationalIdFrontUrl?: string | null;
    nationalIdBackUrl?: string | null;
    passportCopyUrl?: string | null;
    proofOfResidenceUrl?: string | null;
  } | null;
  reservation?: {
    reference: string;
    status: string;
    expiresAt?: Date | string | null;
    createdAt: Date | string;
  } | null;
  development?: { name: string } | null;
  stand?: { standNumber: string; sizeSqm: number; price: string } | null;
  agent?: { user?: { name: string; email: string } | null } | null;
  installmentPlan?: {
    months: number;
    monthlyAmount: string;
    principal: string;
    startDate: Date | string;
    installments: Installment[];
  } | null;
  payments?: Payment[];
  documents?: Document[];
};

type TimelineItem = {
  key: string;
  date: Date | string;
  icon: LucideIcon;
  title: string;
  detail: string;
  tone: string;
};

const METHOD_LABEL: Record<string, string> = {
  CASH: "Cash", BANK_TRANSFER: "Bank Transfer", ECOCASH: "EcoCash", VELOCITY: "Velocity", OTHER: "Other",
};
const TYPE_LABEL: Record<string, string> = {
  DEPOSIT: "Deposit", INSTALLMENT: "Installment", ADJUSTMENT: "Admin Fee",
};
const DOC_TYPE_LABEL: Record<string, string> = {
  SALE_AGREEMENT: "Sale Agreement", RECEIPT: "Receipt", STATEMENT: "Statement",
  COMMISSION_VOUCHER: "Commission Voucher", TITLE_DEED: "Title Deed", RESERVATION_FORM: "Reservation Form",
};
function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function proofUrlFromNotes(notes?: string | null) {
  const match = notes?.match(/Proof:\s*(https?:\/\/[^\s|]+)/i);
  return match?.[1] ?? null;
}

export function SaleDetailPanel({ sale, receiptBase = "/api/client/receipt" }: { sale: Sale; receiptBase?: string }) {
  const payments = sale.payments ?? [];
  const installments = sale.installmentPlan?.installments ?? [];
  const documents = sale.documents ?? [];

  const finance = getSaleFinancialSnapshot(sale);
  const price = finance.purchasePrice;
  const adminFees = finance.adminFees;
  const outstanding = finance.outstanding;
  const propertyPaid = finance.propertyPaid;
  const totalPaid = propertyPaid;
  const progressPct = price > 0 ? Math.min(100, Math.round((propertyPaid / price) * 100)) : 0;
  const installmentSnapshot = getInstallmentScheduleSnapshot(installments, getVerifiedInstallmentTotal(payments));
  const installmentRows = installmentSnapshot.rows;
  const paidInstallments = installmentSnapshot.paidCount;
  const overdueInstallments = installmentSnapshot.overdueCount;
  const partialInstallments = installmentSnapshot.partialCount;
  const nextDue = installmentSnapshot.nextDue;
  const hasKycUpload = Boolean(
    sale.client?.nationalIdFrontUrl ||
    sale.client?.nationalIdBackUrl ||
    sale.client?.passportCopyUrl ||
    sale.client?.proofOfResidenceUrl,
  );
  const timeline = [
    sale.client ? {
      key: "lead",
      date: sale.reservation?.createdAt ?? sale.createdAt,
      icon: UserPlus,
      title: "Lead created",
      detail: `${sale.client.name} captured for ${sale.development?.name ?? "development"}`,
      tone: "text-sky-700 bg-sky-50 border-sky-200",
    } : null,
    hasKycUpload ? {
      key: "kyc",
      date: sale.createdAt,
      icon: ShieldCheck,
      title: "KYC uploaded",
      detail: `Client KYC status: ${sale.client?.kycStatus?.replace("_", " ") ?? "Submitted"}`,
      tone: "text-violet-700 bg-violet-50 border-violet-200",
    } : null,
    sale.reservation ? {
      key: "reserved",
      date: sale.reservation.createdAt,
      icon: Home,
      title: "Stand reserved",
      detail: `${sale.reservation.reference} for stand ${sale.stand?.standNumber ?? "—"}${sale.reservation.expiresAt ? `, expires ${formatDate(sale.reservation.expiresAt)}` : ""}`,
      tone: "text-indigo-700 bg-indigo-50 border-indigo-200",
    } : null,
    ...payments
      .filter((p) => p.type === "DEPOSIT")
      .map((p) => ({
        key: `deposit-${p.id}`,
        date: p.paidAt,
        icon: Receipt,
        title: p.status === "VERIFIED" ? "Deposit received" : "Deposit submitted",
        detail: `${money(parseFloat(p.amount))} via ${METHOD_LABEL[p.method] ?? p.method} (${p.status})`,
        tone: p.status === "VERIFIED" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-amber-700 bg-amber-50 border-amber-200",
      })),
    {
      key: "approved",
      date: sale.activatedAt ?? sale.createdAt,
      icon: BadgeCheck,
      title: "Sale approved",
      detail: `${sale.saleNumber} is ${sale.status.replace("_", " ")}`,
      tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    ...documents.map((doc) => ({
      key: `doc-${doc.id}`,
      date: doc.createdAt,
      icon: FileText,
      title: "Document generated",
      detail: DOC_TYPE_LABEL[doc.type] ?? doc.title,
      tone: "text-slate-700 bg-slate-50 border-slate-200",
    })),
    ...payments
      .filter((p) => p.type !== "DEPOSIT")
      .map((p) => ({
        key: `payment-${p.id}`,
        date: p.paidAt,
        icon: proofUrlFromNotes(p.notes) ? Upload : Receipt,
        title: p.status === "PENDING" ? "Payment proof uploaded" : p.status === "VERIFIED" ? "Payment made" : "Payment rejected",
        detail: `${money(parseFloat(p.amount))} reference ${p.reference} (${p.status})`,
        tone: p.status === "VERIFIED" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : p.status === "PENDING" ? "text-amber-700 bg-amber-50 border-amber-200" : "text-red-700 bg-red-50 border-red-200",
      })),
  ]
    .filter((item): item is TimelineItem => Boolean(item))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <section className="premium-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Sale Number</p>
            <p className="kpi-number mt-1 text-2xl font-bold">{sale.saleNumber}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {sale.client && <span>Client: <strong className="text-foreground">{sale.client.name}</strong></span>}
              {sale.development && <span>Development: <strong className="text-foreground">{sale.development.name}</strong></span>}
              {sale.stand && <span>Stand: <strong className="text-foreground">{sale.stand.standNumber}</strong> ({sale.stand.sizeSqm} sqm)</span>}
              {sale.agent?.user && <span>Agent: <strong className="text-foreground">{sale.agent.user.name}</strong></span>}
              <span>Date: <strong className="text-foreground">{new Date(sale.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</strong></span>
            </div>
          </div>
          <StatusBadge status={sale.status.replace("_", " ")} />
        </div>

        {/* KPI row */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Purchase Price", value: money(price), color: "" },
            { label: "Total Paid", value: money(totalPaid), color: "text-emerald-700" },
            { label: "Outstanding", value: money(outstanding), color: outstanding > 0 ? "text-red-600" : "text-emerald-700" },
            ...(adminFees > 0 ? [{ label: "Admin Fees", value: money(adminFees), color: "text-amber-700" }] : []),
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</p>
              <p className={`kpi-number mt-1 text-lg font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Repayment progress</span>
            <span className="font-semibold">{progressPct}%</span>
          </div>
          <div className="mt-1.5 h-2.5 rounded-full bg-muted">
            <div className="h-2.5 rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Quick doc links */}
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={`/api/client/statement/${sale.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
          >
            <Download className="size-3.5" /> Account Statement PDF
          </a>
          {payments.filter((p) => p.status === "VERIFIED").slice(0, 1).map((p) => (
            <a
              key={p.id}
              href={`${receiptBase}/${p.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs font-semibold transition hover:bg-muted"
            >
              <Receipt className="size-3.5" /> Latest Receipt PDF
            </a>
          ))}
        </div>
      </section>

      {/* ── Reservation Timeline ── */}
      <section className="premium-panel">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <Clock className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Reservation Timeline</h2>
        </div>
        <div className="space-y-0 p-5">
          {timeline.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="grid grid-cols-[2rem_1fr] gap-3">
                <div className="relative flex justify-center">
                  <span className={`z-10 flex size-8 items-center justify-center rounded-full border ${item.tone}`}>
                    <Icon className="size-4" />
                  </span>
                  {index < timeline.length - 1 && <span className="absolute top-8 h-full w-px bg-border" />}
                </div>
                <div className="pb-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">{item.title}</p>
                    <time className="text-xs font-medium text-muted-foreground">{formatDateTime(item.date)}</time>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Installment Schedule ── */}
      {installments.length > 0 && (
        <section className="premium-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              <h2 className="text-xl font-semibold">Installment Schedule</h2>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="size-3.5" /> {paidInstallments} paid
              </span>
              {overdueInstallments > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <TriangleAlert className="size-3.5" /> {overdueInstallments} overdue
                </span>
              )}
              {partialInstallments > 0 && (
                <span className="flex items-center gap-1 text-amber-700">
                  <Clock className="size-3.5" /> {partialInstallments} partial
                </span>
              )}
              <span className="text-muted-foreground">
                {installmentSnapshot.remainingCount} remaining
              </span>
              {nextDue && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="size-3.5" />
                  Next: {new Date(nextDue.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} — {money(Math.max(0, nextDue.remaining))}
                </span>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Amount Due</th>
                  <th className="px-4 py-3">Amount Paid</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Paid On</th>
                </tr>
              </thead>
              <tbody>
                {installmentRows.map((inst) => {
                  const status = inst.status;
                  return (
                    <tr key={inst.id} className={`border-t ${status === "overdue" ? "bg-red-50/40" : status === "paid" ? "bg-emerald-50/30" : status === "partial" ? "bg-amber-50/30" : ""}`}>
                      <td className="kpi-number px-4 py-2.5 font-semibold text-muted-foreground">{inst.sequence}</td>
                      <td className="px-4 py-2.5">
                        {formatDate(inst.dueDate)}
                      </td>
                      <td className="kpi-number px-4 py-2.5 font-semibold">{money(inst.amountDue)}</td>
                      <td className="kpi-number px-4 py-2.5">
                        {inst.amountPaid > 0 ? (
                          <span className="font-semibold text-emerald-700">{money(inst.amountPaid)}</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        {status === "paid" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="size-3" /> Paid
                          </span>
                        ) : status === "partial" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            <Clock className="size-3" /> Partial
                          </span>
                        ) : status === "overdue" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                            <TriangleAlert className="size-3" /> Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            <Clock className="size-3" /> Upcoming
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {inst.paidAt ? formatDate(inst.paidAt) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Payment History ── */}
      <section className="premium-panel">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <Receipt className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Payment History</h2>
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {payments.filter((p) => p.status === "VERIFIED").length} verified
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No payments recorded yet.</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(p.paidAt)}
                  </td>
                  <td className="kpi-number px-4 py-3 font-semibold">{p.reference}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${
                      p.type === "DEPOSIT" ? "border-indigo-200 bg-indigo-50 text-indigo-800"
                      : p.type === "INSTALLMENT" ? "border-sky-200 bg-sky-50 text-sky-800"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}>
                      {TYPE_LABEL[p.type] ?? p.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{METHOD_LABEL[p.method] ?? p.method}</td>
                  <td className="kpi-number px-4 py-3 font-semibold">{money(parseFloat(p.amount))}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status === "VERIFIED" ? "Approved" : p.status === "PENDING" ? "Pending" : "Rejected"} />
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "VERIFIED" ? (
                      <a
                        href={`${receiptBase}/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                      >
                        <Download className="size-3.5" /> PDF
                      </a>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Documents ── */}
      {documents.length > 0 && (
        <section className="premium-panel">
          <div className="flex items-center gap-2 border-b px-5 py-4">
            <FileText className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">Documents</h2>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-lg border p-4 transition hover:-translate-y-0.5 hover:bg-muted/40 hover:shadow-sm"
              >
                <FileText className="mt-0.5 size-7 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-sm">{DOC_TYPE_LABEL[doc.type] ?? doc.type}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{doc.title}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <Download className="size-3" /> Download
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
