import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionTitle } from "@/components/ui";
import { getSaleById } from "@/lib/db/queries/sales";
import { SaleDetailPanel } from "@/components/sale-detail-panel";
import { getCurrentAgentProfile } from "@/lib/agent";
import { RecordPaymentForm } from "@/app/accounts/payments/_record-payment-form";

export const dynamic = "force-dynamic";

export default async function AgentSaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sale, agent] = await Promise.all([getSaleById(id), getCurrentAgentProfile()]);
  if (!sale) notFound();

  // Agents can only view sales they own
  if (!agent || sale.agentId !== agent.id) notFound();

  const saleForPayment = [{
    id: sale.id,
    saleNumber: sale.saleNumber,
    clientId: sale.clientId,
    clientName: sale.client?.name ?? "—",
    standNumber: sale.stand?.standNumber ?? "—",
    outstanding: parseFloat(sale.outstandingBalance),
  }];

  return (
    <div className="dashboard-page">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/agent/presales" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Presales
        </Link>
        <RecordPaymentForm sales={saleForPayment} agentMode />
      </div>
      <SectionTitle
        eyebrow={`Agent: Sale Detail — ${sale.saleNumber}`}
        title={`${sale.client?.name ?? "—"} · ${sale.development?.name ?? "—"} Stand ${sale.stand?.standNumber ?? "—"}`}
      />
      <div className="mt-8">
        <SaleDetailPanel sale={sale} receiptBase="/api/client/receipt" />
      </div>
    </div>
  );
}
