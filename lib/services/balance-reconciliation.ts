import { db } from "@/lib/db/index";
import { sales as salesTable } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getSaleFinancialSnapshot, moneyAmount } from "@/lib/finance";

const MONEY_EPSILON = 0.01;

/**
 * A minimal, DB-free view of a sale needed to compute its correct balances.
 * Mirrors the shape getSaleFinancialSnapshot expects.
 */
export type ReconcilableSale = {
  id: string;
  purchasePrice: string | number;
  depositPaid: string | number;
  outstandingBalance: string | number;
  payments: {
    type: string;
    status: string;
    amount: string | number;
  }[];
};

export type BalanceCorrection = {
  saleId: string;
  storedOutstanding: number;
  ledgerOutstanding: number;
  storedDeposit: number;
  ledgerDeposit: number;
  changed: boolean;
};

/**
 * Pure computation — no DB access, so it's trivially unit-testable.
 *
 * The authoritative source of truth is the verified-payment ledger, exactly as
 * the client dashboards render it via getSaleFinancialSnapshot:
 *   - outstanding  = purchase price − principal actually paid (floored at 0)
 *   - deposit_paid = principal actually paid (deposit + installments, capped
 *                    at purchase price)
 *   - admin fees (ADJUSTMENT payments) are EXCLUDED from the property balance.
 *
 * Returns the corrected values plus a flag indicating whether the stored
 * columns differ from the ledger by more than $0.01.
 */
export function computeBalanceCorrection(sale: ReconcilableSale): BalanceCorrection {
  const snapshot = getSaleFinancialSnapshot(sale);

  const storedOutstanding = moneyAmount(sale.outstandingBalance);
  const storedDeposit = moneyAmount(sale.depositPaid);

  const ledgerOutstanding = snapshot.outstanding;
  const ledgerDeposit = snapshot.propertyPaid;

  const changed =
    Math.abs(ledgerOutstanding - storedOutstanding) > MONEY_EPSILON ||
    Math.abs(ledgerDeposit - storedDeposit) > MONEY_EPSILON;

  return {
    saleId: sale.id,
    storedOutstanding,
    ledgerOutstanding,
    storedDeposit,
    ledgerDeposit,
    changed,
  };
}

/**
 * Applies corrections for all provided sales. Only rows whose stored values
 * differ from the ledger are updated. Runs each update within a transaction.
 * Returns the list of corrections (including unchanged rows for reporting).
 */
export async function reconcileSaleBalances(sales: ReconcilableSale[]) {
  const corrections = sales.map(computeBalanceCorrection);
  const toFix = corrections.filter((c) => c.changed);

  for (const c of toFix) {
    await db.transaction(async (tx) => {
      await tx
        .update(salesTable)
        .set({
          outstandingBalance: c.ledgerOutstanding.toFixed(2),
          depositPaid: c.ledgerDeposit.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(salesTable.id, c.saleId));
    });
  }

  const totalOutstandingDelta = toFix.reduce(
    (sum, c) => sum + (c.ledgerOutstanding - c.storedOutstanding),
    0,
  );
  const totalDepositDelta = toFix.reduce((sum, c) => sum + (c.ledgerDeposit - c.storedDeposit), 0);

  return {
    checked: corrections.length,
    corrected: toFix.length,
    corrections,
    totalOutstandingDelta,
    totalDepositDelta,
  };
}

/** Loads the active/paid-off sales (with verified property payments) for reconciliation. */
export async function loadReconcilableSales() {
  return db.query.sales.findMany({
    where: inArray(salesTable.status, ["ACTIVE", "PAID_OFF"]),
    columns: { id: true, purchasePrice: true, depositPaid: true, outstandingBalance: true, saleNumber: true },
    with: {
      payments: {
        columns: { type: true, status: true, amount: true },
      },
    },
  });
}

/** Convenience wrapper: load and reconcile in one call. Used by the cron route. */
export async function reconcileAllBalances() {
  const sales = await loadReconcilableSales();
  return reconcileSaleBalances(sales);
}
