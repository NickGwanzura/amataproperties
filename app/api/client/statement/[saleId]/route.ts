import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { agentProfiles, sales } from "@/lib/db/schema";
import { createStatementPdf } from "@/lib/documents";
import { getInstallmentScheduleSnapshot, getSaleFinancialSnapshot, getVerifiedInstallmentTotal } from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ saleId: string }> }) {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { saleId } = await params;

  const sale = await db.query.sales.findFirst({
    where: eq(sales.id, saleId),
    with: {
      client: true,
      development: true,
      stand: true,
      payments: { orderBy: (p, { asc }) => [asc(p.paidAt)] },
      installmentPlan: { with: { installments: { orderBy: (i, { asc }) => [asc(i.sequence)] } } },
    },
  });

  if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const staffRoles = ["ACCOUNTS", "ADMINISTRATOR", "CEO", "SYSTEM_ADMIN"];
  let authorized = staffRoles.includes(session.user.role) || sale.client?.userId === session.user.id;

  if (!authorized && session.user.role === "AGENT") {
    const agentProfile = await db.query.agentProfiles.findFirst({
      where: eq(agentProfiles.userId, session.user.id),
    });
    authorized = agentProfile?.id === sale.agentId;
  }

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const typeLabel: Record<string, string> = { DEPOSIT: "Deposit", INSTALLMENT: "Installment", ADJUSTMENT: "Admin Fee" };
  const finance = getSaleFinancialSnapshot(sale);
  const installmentProgress = sale.installmentPlan
    ? getInstallmentScheduleSnapshot(sale.installmentPlan.installments, getVerifiedInstallmentTotal(sale.payments))
    : null;

  const nextDueDate = installmentProgress?.nextDueDate
    ? new Date(installmentProgress.nextDueDate).toISOString()
    : null;

  const buf = await createStatementPdf({
    clientName: sale.client?.name ?? "—",
    nationalId: sale.client?.nationalId ?? "—",
    saleNumber: sale.saleNumber,
    developmentName: sale.development?.name ?? "—",
    standNumber: sale.stand?.standNumber ?? "—",
    purchasePrice: finance.purchasePrice,
    depositPaid: finance.depositPaid,
    outstandingBalance: finance.outstanding,
    statementDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    payments: sale.payments.map((p) => ({
      date: new Date(p.paidAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      reference: p.reference,
      type: typeLabel[p.type] ?? p.type,
      method: p.method.replace(/_/g, " "),
      amount: parseFloat(p.amount),
      status: p.status,
    })),
    installmentPlan: sale.installmentPlan
      ? {
          monthlyAmount: parseFloat(sale.installmentPlan.monthlyAmount),
          months: sale.installmentPlan.months,
          startDate: new Date(sale.installmentPlan.startDate).toISOString(),
          nextDueDate,
          nextDueAmount: installmentProgress?.nextDueAmount ?? null,
          installmentsPaid: installmentProgress?.paidCount ?? 0,
          installments: (installmentProgress?.rows ?? []).map((installment) => ({
            sequence: installment.sequence,
            dueDate: new Date(installment.dueDate).toISOString(),
            amountDue: installment.amountDue,
            amountPaid: installment.amountPaid,
            paidAt: installment.paidAt ? new Date(installment.paidAt).toISOString() : null,
          })),
        }
      : undefined,
  });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, must-revalidate",
      "Content-Disposition": `inline; filename="statement-${sale.saleNumber}.pdf"`,
    },
  });
}
