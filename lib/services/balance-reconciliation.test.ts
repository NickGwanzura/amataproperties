import { describe, expect, it } from "vitest";
import { computeBalanceCorrection, type ReconcilableSale } from "./balance-reconciliation";

function sale(overrides: Partial<ReconcilableSale> = {}): ReconcilableSale {
  return {
    id: "sale-1",
    purchasePrice: "10000",
    depositPaid: "2000",
    outstandingBalance: "8000",
    payments: [],
    ...overrides,
  };
}

describe("computeBalanceCorrection", () => {
  it("returns no change when stored balances already match the ledger", () => {
    const correction = computeBalanceCorrection(
      sale({
        depositPaid: "3500",
        outstandingBalance: "6500",
        payments: [
          { status: "VERIFIED", type: "DEPOSIT", amount: "2000" },
          { status: "VERIFIED", type: "INSTALLMENT", amount: "1500" },
          { status: "VERIFIED", type: "ADJUSTMENT", amount: "75" },
        ],
      }),
    );
    expect(correction.changed).toBe(false);
    expect(correction.ledgerOutstanding).toBe(6500);
    expect(correction.ledgerDeposit).toBe(3500);
  });

  it("corrects a stale deposit_paid that never tracked installments", () => {
    // Stored deposit_paid stuck at 2000 even though 3500 was actually paid.
    const correction = computeBalanceCorrection(
      sale({
        depositPaid: "2000",
        outstandingBalance: "6500",
        payments: [
          { status: "VERIFIED", type: "DEPOSIT", amount: "2000" },
          { status: "VERIFIED", type: "INSTALLMENT", amount: "1500" },
        ],
      }),
    );
    expect(correction.changed).toBe(true);
    expect(correction.ledgerDeposit).toBe(3500);
    expect(correction.ledgerOutstanding).toBe(6500);
  });

  it("keeps admin fees (ADJUSTMENT) out of the property balance", () => {
    const correction = computeBalanceCorrection(
      sale({
        payments: [
          { status: "VERIFIED", type: "DEPOSIT", amount: "2000" },
          { status: "VERIFIED", type: "ADJUSTMENT", amount: "300" },
        ],
      }),
    );
    // Admin fee does not reduce the property balance or count as principal paid.
    expect(correction.ledgerDeposit).toBe(2000);
    expect(correction.ledgerOutstanding).toBe(8000);
    expect(correction.changed).toBe(false);
  });

  it("ignores unverified (PENDING/FAILED) payments", () => {
    const correction = computeBalanceCorrection(
      sale({
        depositPaid: "0",
        outstandingBalance: "10000",
        payments: [
          { status: "PENDING", type: "INSTALLMENT", amount: "3000" },
          { status: "FAILED", type: "INSTALLMENT", amount: "2000" },
        ],
      }),
    );
    expect(correction.ledgerDeposit).toBe(0);
    expect(correction.ledgerOutstanding).toBe(10000);
    expect(correction.changed).toBe(false);
  });

  it("clamps overpayment so property paid never exceeds purchase price", () => {
    const correction = computeBalanceCorrection(
      sale({
        purchasePrice: "5000",
        depositPaid: "1000",
        outstandingBalance: "4000",
        payments: [
          { status: "VERIFIED", type: "INSTALLMENT", amount: "8000" },
        ],
      }),
    );
    expect(correction.ledgerDeposit).toBe(5000);
    expect(correction.ledgerOutstanding).toBe(0);
    expect(correction.changed).toBe(true);
  });
});
