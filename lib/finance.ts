type MoneyLike = string | number;

export type FinancePayment = {
  type: string;
  status: string;
  amount: MoneyLike;
};

export type FinanceInstallment = {
  id?: string;
  sequence: number;
  dueDate: Date | string;
  amountDue: MoneyLike;
  amountPaid: MoneyLike;
  paidAt?: Date | string | null;
};

export type InstallmentScheduleRow = FinanceInstallment & {
  amountDue: number;
  amountPaid: number;
  remaining: number;
  status: "paid" | "partial" | "overdue" | "upcoming";
};

export type NextInstallmentDue = Pick<InstallmentScheduleRow, "sequence" | "dueDate" | "amountDue" | "amountPaid" | "remaining" | "status">;

export type FinanceSale = {
  purchasePrice: MoneyLike;
  depositPaid: MoneyLike;
  outstandingBalance: MoneyLike;
  payments?: FinancePayment[];
};

const MONEY_EPSILON = 0.01;

export function moneyAmount(value: MoneyLike) {
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isAdjustment(type: string) {
  return type === "ADJUSTMENT" || type === "Adjustment";
}

export function getSaleFinancialSnapshot(sale: FinanceSale) {
  const purchasePrice = moneyAmount(sale.purchasePrice);
  const depositPaid = moneyAmount(sale.depositPaid);
  const storedOutstanding = moneyAmount(sale.outstandingBalance);
  const verifiedPayments = sale.payments?.filter((payment) => payment.status === "VERIFIED") ?? [];
  const verifiedPropertyPaid = verifiedPayments
    .filter((payment) => !isAdjustment(payment.type))
    .reduce((sum, payment) => sum + moneyAmount(payment.amount), 0);
  const adminFees = verifiedPayments
    .filter((payment) => isAdjustment(payment.type))
    .reduce((sum, payment) => sum + moneyAmount(payment.amount), 0);

  const ledgerPropertyPaid = Math.min(purchasePrice, Math.max(depositPaid, verifiedPropertyPaid));
  const ledgerOutstanding = roundMoney(Math.max(0, purchasePrice - ledgerPropertyPaid));
  const outstanding = Math.abs(ledgerOutstanding - storedOutstanding) > MONEY_EPSILON
    ? ledgerOutstanding
    : storedOutstanding;
  const propertyPaid = roundMoney(Math.max(0, Math.min(purchasePrice, purchasePrice - outstanding)));

  return {
    purchasePrice,
    depositPaid,
    adminFees: roundMoney(adminFees),
    propertyPaid,
    totalPaid: roundMoney(propertyPaid + adminFees),
    storedOutstanding,
    ledgerOutstanding,
    outstanding,
    isReconciledFromLedger: Math.abs(ledgerOutstanding - storedOutstanding) > MONEY_EPSILON,
  };
}

export function getVerifiedInstallmentTotal(payments: FinancePayment[] = []) {
  return roundMoney(
    payments
      .filter((payment) => payment.status === "VERIFIED" && payment.type === "INSTALLMENT")
      .reduce((sum, payment) => sum + moneyAmount(payment.amount), 0),
  );
}

export function getInstallmentScheduleSnapshot(
  installments: FinanceInstallment[] = [],
  verifiedInstallmentTotal = 0,
  today = new Date(),
) {
  let ledgerRemaining = Math.max(0, verifiedInstallmentTotal);
  let paidCount = 0;
  let partialCount = 0;
  let overdueCount = 0;
  const rows: InstallmentScheduleRow[] = installments.map((installment) => {
    const due = moneyAmount(installment.amountDue);
    const storedPaid = Math.min(due, moneyAmount(installment.amountPaid));
    const ledgerPaid = Math.min(due, ledgerRemaining);
    const amountPaid = roundMoney(Math.max(storedPaid, ledgerPaid));
    const remaining = roundMoney(Math.max(0, due - amountPaid));
    ledgerRemaining = Math.max(0, ledgerRemaining - due);

    const status = remaining <= MONEY_EPSILON
      ? "paid"
      : amountPaid > MONEY_EPSILON
        ? "partial"
        : new Date(installment.dueDate) < today ? "overdue" : "upcoming";

    if (status === "paid") paidCount += 1;
    if (status === "partial") partialCount += 1;
    if (status === "overdue") overdueCount += 1;

    const row: InstallmentScheduleRow = {
      ...installment,
      amountDue: due,
      amountPaid,
      remaining,
      status,
    };

    return row;
  });
  const firstUnpaid = rows.find((row) => row.status !== "paid");
  const nextDue: NextInstallmentDue | null = firstUnpaid
    ? {
        sequence: firstUnpaid.sequence,
        dueDate: firstUnpaid.dueDate,
        amountDue: firstUnpaid.amountDue,
        amountPaid: firstUnpaid.amountPaid,
        remaining: firstUnpaid.remaining,
        status: firstUnpaid.status,
      }
    : null;

  return {
    rows,
    paidCount,
    partialCount,
    overdueCount,
    remainingCount: Math.max(0, rows.length - paidCount),
    nextDue,
    nextDueDate: nextDue?.dueDate ?? null,
    nextDueAmount: nextDue?.remaining ?? null,
  };
}

export function buildInstallmentAmounts(principal: MoneyLike, months: number) {
  const safeMonths = Math.max(1, Math.trunc(months));
  const totalCents = Math.round(moneyAmount(principal) * 100);
  const baseCents = Math.floor(totalCents / safeMonths);
  let remainder = totalCents - baseCents * safeMonths;

  return Array.from({ length: safeMonths }, () => {
    const cents = baseCents + (remainder > 0 ? 1 : 0);
    remainder -= remainder > 0 ? 1 : 0;
    return (cents / 100).toFixed(2);
  });
}
