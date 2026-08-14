import { SectionTitle } from "@/components/ui";
import { getClientByUserId } from "@/lib/db/queries/clients";
import { getSessionUser } from "@/lib/session";
import { SaleDetailPanel } from "@/components/sale-detail-panel";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientPaymentsPage() {
  const user = await getSessionUser();
  const client = user ? await getClientByUserId(user.id) : null;
  const sale = client?.sales?.[0] ?? null;

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="Client: Payments & Schedule" title="Your installment plan, payments, and receipts" />

      {!sale ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
          <FileText className="size-12 text-muted-foreground/30" />
          <p className="font-semibold text-muted-foreground">No active sale found</p>
          <p className="text-sm text-muted-foreground">Your sale details will appear here once your reservation is converted.</p>
        </div>
      ) : (
        <div className="mt-8">
          <SaleDetailPanel sale={sale} receiptBase="/api/client/receipt" />
        </div>
      )}
    </div>
  );
}
