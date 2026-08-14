import "dotenv/config";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/index";
import { installmentPlans, installments, sales } from "@/lib/db/schema";

const APPLY = process.argv.includes("--apply");
const CONFIRM_PRODUCTION = process.argv.includes("--confirm-production");

type UpdatePlan = {
  saleId: string;
  saleNumber: string;
  purchasePrice: string;
  newPurchasePrice: string;
  planId: string;
  principal: string;
  newPrincipal: string;
  monthlyAmount: string;
  newMonthlyAmount: string;
  unpaidInstallmentIds: string[];
};

function money(value: number) {
  return value.toFixed(2).replace(/\.00$/, "");
}

async function buildUpdatePlans(): Promise<UpdatePlan[]> {
  const allSales = await db.query.sales.findMany({
    with: {
      payments: true,
      installmentPlan: { with: { installments: true } },
    },
    columns: { id: true, saleNumber: true, purchasePrice: true, outstandingBalance: true },
  });

  const plans: UpdatePlan[] = [];

  for (const sale of allSales) {
    const adjustmentPayments = sale.payments.filter((payment) => payment.type === "ADJUSTMENT" && payment.status === "VERIFIED");
    if (adjustmentPayments.length === 0 || !sale.installmentPlan) continue;

    const adminFeeTotal = adjustmentPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    if (!Number.isFinite(adminFeeTotal) || adminFeeTotal <= 0) continue;

    const currentPrice = Number(sale.purchasePrice);
    const currentPrincipal = Number(sale.installmentPlan.principal);
    const deposit = currentPrice - currentPrincipal;
    const newPurchasePrice = currentPrice + adminFeeTotal;
    const newPrincipal = newPurchasePrice - deposit;
    const months = Math.max(sale.installmentPlan.months, 1);
    const newMonthlyAmount = Number((newPrincipal / months).toFixed(2));

    const unpaidInstallmentIds = sale.installmentPlan.installments
      .filter((installment) => Number(installment.amountPaid) === 0 && !installment.paidAt)
      .map((installment) => installment.id);

    plans.push({
      saleId: sale.id,
      saleNumber: sale.saleNumber,
      purchasePrice: money(currentPrice),
      newPurchasePrice: money(newPurchasePrice),
      planId: sale.installmentPlan.id,
      principal: money(currentPrincipal),
      newPrincipal: money(newPrincipal),
      monthlyAmount: sale.installmentPlan.monthlyAmount,
      newMonthlyAmount: money(newMonthlyAmount),
      unpaidInstallmentIds,
    });
  }

  return plans;
}

async function applyPlans(plans: UpdatePlan[]) {
  await db.transaction(async (tx) => {
    for (const plan of plans) {
      await tx
        .update(sales)
        .set({ purchasePrice: plan.newPurchasePrice, updatedAt: new Date() })
        .where(eq(sales.id, plan.saleId));

      await tx
        .update(installmentPlans)
        .set({ principal: plan.newPrincipal, monthlyAmount: plan.newMonthlyAmount })
        .where(eq(installmentPlans.id, plan.planId));

      for (const installmentId of plan.unpaidInstallmentIds) {
        await tx
          .update(installments)
          .set({ amountDue: plan.newMonthlyAmount })
          .where(and(eq(installments.id, installmentId), eq(installments.amountPaid, "0")));
      }
    }
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  if (process.env.NODE_ENV === "production" && APPLY && !CONFIRM_PRODUCTION) {
    throw new Error("Refusing to apply in production without --confirm-production.");
  }

  const plans = await buildUpdatePlans();
  console.log(JSON.stringify({ mode: APPLY ? "apply" : "dry-run", count: plans.length, plans }, null, 2));

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to write these changes.");
    return;
  }

  await applyPlans(plans);
  console.log(`\nApplied ${plans.length} sale price adjustment(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
