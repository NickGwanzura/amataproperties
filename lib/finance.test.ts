import { describe, expect, it } from "vitest";
import { buildInstallmentAmounts, getInstallmentScheduleSnapshot, getSaleFinancialSnapshot } from "./finance";

describe("getSaleFinancialSnapshot", () => {
  it("uses verified property payments for balance and keeps adjustments separate", () => {
    const snapshot = getSaleFinancialSnapshot({
      purchasePrice: "10000",
      depositPaid: "2000",
      outstandingBalance: "9000",
      payments: [
        { status: "VERIFIED", type: "DEPOSIT", amount: "2000" },
        { status: "VERIFIED", type: "INSTALLMENT", amount: "1500" },
        { status: "VERIFIED", type: "ADJUSTMENT", amount: "75" },
        { status: "PENDING", type: "INSTALLMENT", amount: "500" },
      ],
    });

    expect(snapshot.propertyPaid).toBe(3500);
    expect(snapshot.adminFees).toBe(75);
    expect(snapshot.totalPaid).toBe(3575);
    expect(snapshot.outstanding).toBe(6500);
    expect(snapshot.isReconciledFromLedger).toBe(true);
  });

  it("does not let overpayments make property paid exceed purchase price", () => {
    const snapshot = getSaleFinancialSnapshot({
      purchasePrice: "1000",
      depositPaid: "1000",
      outstandingBalance: "0",
      payments: [{ status: "VERIFIED", type: "INSTALLMENT", amount: "100" }],
    });

    expect(snapshot.propertyPaid).toBe(1000);
    expect(snapshot.outstanding).toBe(0);
  });
});

describe("getInstallmentScheduleSnapshot", () => {
  it("fills stale installment rows from the verified installment ledger", () => {
    const snapshot = getInstallmentScheduleSnapshot([
      { sequence: 1, dueDate: "2026-01-01", amountDue: "100", amountPaid: "0" },
      { sequence: 2, dueDate: "2026-02-01", amountDue: "100", amountPaid: "0" },
      { sequence: 3, dueDate: "2026-03-01", amountDue: "100", amountPaid: "0" },
    ], 250, new Date("2026-01-15"));

    expect(snapshot.paidCount).toBe(2);
    expect(snapshot.partialCount).toBe(1);
    expect(snapshot.nextDueAmount).toBe(50);
    expect(snapshot.rows.map((row) => row.amountPaid)).toEqual([100, 100, 50]);
  });
});

describe("buildInstallmentAmounts", () => {
  it("allocates cents exactly across the schedule", () => {
    const amounts = buildInstallmentAmounts(100, 3);
    expect(amounts).toEqual(["33.34", "33.33", "33.33"]);
    expect(amounts.reduce((sum, amount) => sum + Number(amount), 0)).toBeCloseTo(100, 2);
  });
});
