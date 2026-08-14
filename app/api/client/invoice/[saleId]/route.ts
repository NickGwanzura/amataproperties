import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { getSaleFinancialSnapshot } from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ saleId: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { saleId } = await params;

  const sale = await db.query.sales.findFirst({
    where: eq(sales.id, saleId),
    with: { client: true, development: true, stand: true },
  });

  if (!sale?.client) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  // Authorize — staff can access any, clients can only access their own
  const isStaff = ["ACCOUNTS", "ADMINISTRATOR", "CEO", "SYSTEM_ADMIN"].includes(session.role);
  const isOwner = sale.client.userId === session.id;
  if (!isStaff && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { createInvoicePdf } = await import("@/lib/documents");

  const invoiceNumber = `INV-${sale.saleNumber}`;
  const finance = getSaleFinancialSnapshot(sale);
  const pdf = await createInvoicePdf({
    invoiceNumber,
    saleNumber: sale.saleNumber,
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    clientName: sale.client.name,
    nationalId: sale.client.nationalId,
    developmentName: sale.development.name,
    standNumber: sale.stand.standNumber,
    purchasePrice: finance.purchasePrice,
    depositRequired: parseFloat(sale.depositRequired),
    outstandingBalance: finance.outstanding,
    paymentTerms: sale.development.paymentTerms ?? "Per agreed schedule",
  });

  return new NextResponse(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, must-revalidate",
      "Content-Disposition": `attachment; filename="invoice-${sale.saleNumber}.pdf"`,
    },
  });
}
