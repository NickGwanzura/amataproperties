import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionTitle } from "@/components/ui";
import { getSaleById } from "@/lib/db/queries/sales";
import { SaleDetailPanel } from "@/components/sale-detail-panel";

export const dynamic = "force-dynamic";

export default async function AdminSaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = await getSaleById(id);
  if (!sale) notFound();

  return (
    <div className="dashboard-page">
      <div className="mb-4">
        <Link href="/admin/reservations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Reservations
        </Link>
      </div>
      <SectionTitle
        eyebrow={`Admin: Sale Detail — ${sale.saleNumber}`}
        title={`${sale.client?.name ?? "—"} · ${sale.development?.name ?? "—"} Stand ${sale.stand?.standNumber ?? "—"}`}
      />
      <div className="mt-8">
        <SaleDetailPanel sale={sale} receiptBase="/api/client/receipt" />
      </div>
    </div>
  );
}
