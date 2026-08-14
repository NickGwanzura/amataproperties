import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { payments } from "@/lib/db/schema";
import { createReceiptPdf } from "@/lib/documents";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { paymentId } = await params;

  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
    with: {
      client: true,
      sale: { with: { development: true, stand: true } },
    },
  });

  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Clients can only access their own receipts; staff can access all
  const staffRoles = ["ACCOUNTS", "ADMINISTRATOR", "CEO", "SYSTEM_ADMIN"];
  if (
    !staffRoles.includes(session.user.role) &&
    payment.client?.userId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (payment.status !== "VERIFIED") {
    return NextResponse.json({ error: "Receipt only available for verified payments" }, { status: 400 });
  }

  const typeLabel: Record<string, string> = {
    DEPOSIT: "Deposit",
    INSTALLMENT: "Installment",
    ADJUSTMENT: "Admin Fee",
  };

  const buf = await createReceiptPdf({
    reference: payment.reference,
    receiptNumber: payment.receiptNumber ?? payment.reference,
    date: new Date(payment.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    clientName: payment.client?.name ?? "—",
    nationalId: payment.client?.nationalId ?? "—",
    developmentName: payment.sale?.development?.name ?? "—",
    standNumber: payment.sale?.stand?.standNumber ?? "—",
    saleNumber: payment.sale?.saleNumber ?? "—",
    type: typeLabel[payment.type] ?? payment.type,
    method: payment.method.replace(/_/g, " "),
    amount: money(parseFloat(payment.amount)),
  });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, must-revalidate",
      "Content-Disposition": `inline; filename="receipt-${payment.reference}.pdf"`,
    },
  });
}
