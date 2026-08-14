import { Download, FileText } from "lucide-react";
import { SectionTitle } from "@/components/ui";
import { getClientByUserId } from "@/lib/db/queries/clients";
import { getSessionUser } from "@/lib/session";
import { StatementButton } from "@/components/statement-button";

export const dynamic = "force-dynamic";

const DOC_TYPE_LABELS: Record<string, string> = {
  SALE_AGREEMENT: "Sale Agreement",
  RECEIPT: "Payment Receipt",
  STATEMENT: "Account Statement",
  COMMISSION_VOUCHER: "Commission Voucher",
  BROCHURE: "Development Brochure",
  RESERVATION_FORM: "Reservation Form",
  TITLE_DEED: "Title Deed",
};

export default async function ClientDocumentsPage() {
  const user = await getSessionUser();
  const client = user ? await getClientByUserId(user.id) : null;
  const sale = client?.sales?.[0] ?? null;
  const documents = sale?.documents ?? [];

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="Client: Documents" title="Your property documents" />

      {documents.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
          <FileText className="size-12 text-muted-foreground/30" />
          <p className="font-semibold text-muted-foreground">No documents yet</p>
          <p className="text-sm text-muted-foreground">Documents will appear here once your sale agreement is processed.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="premium-panel flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <FileText className="mt-0.5 size-8 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="font-semibold truncate">{DOC_TYPE_LABELS[doc.type] ?? doc.type}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <Download className="size-3.5" /> Download
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      {sale && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatementButton saleId={sale.id} />
            {[
              { label: "Request Title Deed", desc: "Available on full payment" },
              { label: "Download Sale Agreement", desc: "Signed copy of your agreement" },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                className="premium-panel flex items-center justify-between p-4 text-left transition hover:bg-muted"
              >
                <div>
                  <p className="font-semibold">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Download className="size-5 shrink-0 text-primary" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
