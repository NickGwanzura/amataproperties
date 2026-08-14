"use client";

import { useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Loader2,
  Mail,
  Receipt,
  Search,
  User,
} from "lucide-react";
import { sendClientStatementAction, sendClientReceiptAction, sendClientInvoiceAction } from "@/lib/actions";
import { money } from "@/lib/utils";
import { getSaleFinancialSnapshot } from "@/lib/finance";
import type { getAllClientsWithRecords } from "@/lib/db/queries/clients";
type ClientWithRecords = Awaited<ReturnType<typeof getAllClientsWithRecords>>[number];

const kycColors: Record<string, string> = {
  COMPLETE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  IN_REVIEW: "bg-sky-50 text-sky-800 border-sky-200",
  NOT_STARTED: "bg-muted text-muted-foreground border-border",
  REJECTED: "bg-red-50 text-red-800 border-red-200",
};

function useEmailAction(action: (id: string) => Promise<{ ok: boolean; error?: string }>) {
  const [loading, setLoading] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  async function handle(id: string) {
    setLoading(id);
    const res = await action(id);
    setLoading(null);
    if (res.ok) {
      setSent(id);
      setTimeout(() => setSent(null), 3000);
    }
  }

  return { loading, sent, handle };
}

function EmailButton({
  id,
  label,
  loading,
  sent,
  onSend,
}: {
  id: string;
  label: string;
  loading: string | null;
  sent: string | null;
  onSend: (id: string) => void;
}) {
  if (sent === id) {
    return <span className="text-xs font-semibold text-emerald-700">Sent!</span>;
  }
  return (
    <button
      type="button"
      disabled={loading === id}
      onClick={() => onSend(id)}
      className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted disabled:opacity-40"
    >
      {loading === id ? <Loader2 className="size-3 animate-spin" /> : <Mail className="size-3" />}
      {label}
    </button>
  );
}

function SaleSection({ sale }: { sale: ClientWithRecords["sales"][number] }) {
  const [expanded, setExpanded] = useState(false);

  const statement = useEmailAction(sendClientStatementAction);
  const invoice = useEmailAction(sendClientInvoiceAction);
  const receipt = useEmailAction(sendClientReceiptAction);

  const finance = getSaleFinancialSnapshot(sale);
  const totalPaid = finance.propertyPaid;
  const progress = finance.purchasePrice > 0
    ? Math.min(100, (totalPaid / finance.purchasePrice) * 100)
    : 0;

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-muted/30"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full border bg-primary/5 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {sale.status}
          </span>
          <span className="font-semibold">{sale.saleNumber}</span>
          <span className="text-sm text-muted-foreground">
            {sale.development?.name} · Stand {sale.stand?.standNumber}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{money(totalPaid)} / {money(finance.purchasePrice)}</span>
          {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 py-4 space-y-4">
          {/* Sale KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Purchase Price</p>
              <p className="kpi-number mt-0.5 font-semibold">{money(finance.purchasePrice)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Total Paid</p>
              <p className="kpi-number mt-0.5 font-semibold text-emerald-700">{money(totalPaid)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Outstanding</p>
              <p className="kpi-number mt-0.5 font-semibold text-amber-700">{money(finance.outstanding)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Progress</p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{progress.toFixed(0)}%</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <a
              href={`/api/client/statement/${sale.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
            >
              <FileText className="size-3" /> Statement PDF
            </a>
            <a
              href={`/api/client/invoice/${sale.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
            >
              <Download className="size-3" /> Invoice PDF
            </a>
            <EmailButton id={sale.id} label="Email Statement" {...statement} onSend={statement.handle} />
            <EmailButton id={sale.id} label="Email Invoice" {...invoice} onSend={invoice.handle} />
          </div>

          {/* Payments table */}
          {sale.payments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Reference</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Method</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.payments.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-muted/20">
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(p.paidAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="kpi-number px-3 py-2 font-semibold">{p.reference}</td>
                      <td className="px-3 py-2">{p.type}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.method}</td>
                      <td className="kpi-number px-3 py-2 font-semibold">{money(parseFloat(p.amount))}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          p.status === "VERIFIED" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          {p.status === "VERIFIED" && (
                            <a
                              href={`/api/client/receipt/${p.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-semibold text-primary transition hover:bg-primary/5"
                            >
                              <Receipt className="size-3" /> PDF
                            </a>
                          )}
                          {p.status === "VERIFIED" && (
                            <EmailButton id={p.id} label="Email" {...receipt} onSend={receipt.handle} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {sale.payments.length === 0 && (
            <p className="py-2 text-center text-xs text-muted-foreground">No payments recorded for this sale.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function ClientDirectory({ clients }: { clients: ClientWithRecords[] }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.nationalId.toLowerCase().includes(q) ||
      c.nationality?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* Search */}
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search by name, email, phone, national ID, or nationality…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4"
          autoFocus
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Search className="mb-3 size-8 text-muted-foreground/30" />
          <p className="font-semibold text-muted-foreground">No clients match your search</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different name, email, or phone number.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((client) => {
            const activeSales = client.sales.filter((s) => s.status === "ACTIVE");
            const clientSnapshots = client.sales.map((sale) => getSaleFinancialSnapshot(sale));
            const totalPaid = clientSnapshots.reduce((sum, snapshot) => sum + snapshot.propertyPaid, 0);
            const totalOutstanding = clientSnapshots.reduce((sum, snapshot) => sum + snapshot.outstanding, 0);
            const isOpen = expanded === client.id;

            return (
              <div key={client.id} className="premium-panel overflow-hidden">
                {/* Card header */}
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : client.id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/5">
                      <User className="size-6 text-primary" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold">{client.name}</p>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${kycColors[client.kycStatus] ?? ""}`}>
                          {client.kycStatus.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{client.phone}</span>
                        {client.nationalId && <span>ID: {client.nationalId}</span>}
                        {client.nationality && <span>{client.nationality}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden text-right sm:block">
                      <p className="text-sm text-muted-foreground">Sales · {client.sales.length}</p>
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <p className="kpi-number font-semibold text-amber-700">{money(totalOutstanding)}</p>
                    </div>
                    {isOpen ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
                  </div>
                </button>

                {/* Drill-down detail */}
                {isOpen && (
                  <div className="border-t">
                    {/* Client info */}
                    <div className="grid gap-4 px-5 py-4 sm:grid-cols-3 border-b bg-muted/20">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Contact</p>
                        <p className="mt-0.5 text-sm font-semibold">{client.email}</p>
                        <p className="text-sm">{client.phone}</p>
                        {client.address && <p className="text-xs text-muted-foreground">{client.address}</p>}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Identity</p>
                        <p className="mt-0.5 text-sm font-semibold">ID: {client.nationalId}</p>
                        {client.nationality && <p className="text-sm">{client.nationality}</p>}
                        {client.dateOfBirth && (
                          <p className="text-xs text-muted-foreground">
                            DOB: {new Date(client.dateOfBirth).toLocaleDateString("en-GB")}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Employment</p>
                        {client.occupation && <p className="mt-0.5 text-sm">{client.occupation}</p>}
                        {client.employer && <p className="text-sm text-muted-foreground">{client.employer}</p>}
                        {client.nextOfKin && (
                          <>
                            <p className="text-xs text-muted-foreground mt-1">Next of kin: {client.nextOfKin}</p>
                            {client.nextOfKinContact && <p className="text-xs text-muted-foreground">{client.nextOfKinContact}</p>}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-3 border-b bg-card px-5 py-3 sm:grid-cols-4">
                      <div className="text-center">
                        <p className="kpi-number text-2xl font-semibold">{client.sales.length}</p>
                        <p className="text-xs text-muted-foreground">Sales</p>
                      </div>
                      <div className="text-center">
                        <p className="kpi-number text-2xl font-semibold text-emerald-700">{activeSales.length}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                      <div className="text-center">
                        <p className="kpi-number text-2xl font-semibold">{money(totalPaid)}</p>
                        <p className="text-xs text-muted-foreground">Total Paid</p>
                      </div>
                      <div className="text-center">
                        <p className="kpi-number text-2xl font-semibold text-amber-700">{money(totalOutstanding)}</p>
                        <p className="text-xs text-muted-foreground">Outstanding</p>
                      </div>
                    </div>

                    {/* Sales section */}
                    {client.sales.length > 0 ? (
                      <div className="space-y-2 px-5 py-4">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sales</p>
                        {client.sales.map((sale) => (
                          <SaleSection key={sale.id} sale={sale} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-8 text-center">
                        <Building2 className="mb-2 size-8 text-muted-foreground/30" />
                        <p className="text-sm font-semibold text-muted-foreground">No sales found</p>
                        <p className="text-xs text-muted-foreground">This client has no active or past sales.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
