"use client";

import type { WizardData } from "./_form";

const COMMON_TERMS = [6, 12, 24, 36, 48, 60];

export function StepPricing({
  data,
  set,
}: {
  data: WizardData;
  set: <K extends keyof WizardData>(field: K, value: WizardData[K]) => void;
}) {
  const toggleTerm = (months: number) => {
    const next = data.installmentMonths.includes(months)
      ? data.installmentMonths.filter((m) => m !== months)
      : [...data.installmentMonths, months].sort((a, b) => a - b);
    set("installmentMonths", next);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Pricing & Stand Configuration</h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="form-label">
          Starting Price ({data.currency}) *
          <input type="number" step="0.01" className="mt-1" value={data.startingPrice} onChange={(e) => set("startingPrice", e.target.value)} required />
        </label>
        <label className="form-label">
          Price per m² ({data.currency}) *
          <input type="number" step="0.01" className="mt-1" value={data.pricePerSqm} onChange={(e) => set("pricePerSqm", e.target.value)} required />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="form-label">
          Deposit Type
          <select className="mt-1" value={data.depositType} onChange={(e) => set("depositType", e.target.value as WizardData["depositType"])}>
            <option value="fixed">Fixed amount</option>
            <option value="percentage">Percentage of price</option>
          </select>
        </label>
        <label className="form-label">
          Deposit {data.depositType === "percentage" ? "(%)" : `(${data.currency})`} *
          <input type="number" step="0.01" className="mt-1" value={data.depositAmount} onChange={(e) => set("depositAmount", e.target.value)} required />
        </label>
        <label className="form-label">
          Reservation Fee ({data.currency})
          <input type="number" step="0.01" className="mt-1" value={data.reservationFeeAmount} onChange={(e) => set("reservationFeeAmount", e.target.value)} placeholder="Optional" />
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Installment Term Options</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_TERMS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggleTerm(m)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                data.installmentMonths.includes(m) ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
            >
              {m} months
            </button>
          ))}
        </div>
        <label className="form-label mt-3">
          Default Payment Duration (months) *
          <input type="number" className="mt-1 max-w-[160px]" value={data.paymentDurationMonths} onChange={(e) => set("paymentDurationMonths", e.target.value)} required />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="form-label">
          Interest Rate (% p.a.)
          <input type="number" step="0.01" className="mt-1" value={data.interestRate} onChange={(e) => set("interestRate", e.target.value)} />
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Late-Payment Penalty Rules</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="form-label">
            Penalty Rate (%)
            <input type="number" step="0.01" className="mt-1" value={data.penaltyRatePercent} onChange={(e) => set("penaltyRatePercent", e.target.value)} placeholder="e.g. 2" />
          </label>
          <label className="form-label">
            Grace Period (days)
            <input type="number" className="mt-1" value={data.penaltyGraceDays} onChange={(e) => set("penaltyGraceDays", e.target.value)} placeholder="e.g. 7" />
          </label>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Captured for reference on statements; penalties are not auto-applied to balances yet.</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Agent Commission</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="form-label">
            Type
            <select className="mt-1" value={data.commissionType} onChange={(e) => set("commissionType", e.target.value as WizardData["commissionType"])}>
              <option value="flat">Flat amount</option>
              <option value="percentage">Percentage of sale</option>
            </select>
          </label>
          <label className="form-label">
            Value {data.commissionType === "percentage" ? "(%)" : `(${data.currency})`}
            <input type="number" step="0.01" className="mt-1" value={data.commissionValue} onChange={(e) => set("commissionValue", e.target.value)} />
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Discount Rules (optional)</p>
        <div className="grid gap-5 sm:grid-cols-3">
          <label className="form-label">
            Early Settlement (%)
            <input type="number" step="0.01" className="mt-1" value={data.discountEarlySettlementPct} onChange={(e) => set("discountEarlySettlementPct", e.target.value)} />
          </label>
          <label className="form-label">
            Bulk Threshold (stands)
            <input type="number" className="mt-1" value={data.discountBulkThreshold} onChange={(e) => set("discountBulkThreshold", e.target.value)} />
          </label>
          <label className="form-label">
            Bulk Discount (%)
            <input type="number" step="0.01" className="mt-1" value={data.discountBulkDiscountPct} onChange={(e) => set("discountBulkDiscountPct", e.target.value)} />
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Stand Numbering</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="form-label">
            Stand Number Prefix
            <input className="mt-1" value={data.standNumberPrefix} onChange={(e) => set("standNumberPrefix", e.target.value)} placeholder="e.g. NG" />
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input type="checkbox" className="size-4" checked={data.standNumberAutoIncrement} onChange={(e) => set("standNumberAutoIncrement", e.target.checked)} />
            Auto-increment stand numbers
          </label>
        </div>
      </div>

      <label className="form-label">
        Payment Terms
        <textarea className="mt-1 min-h-[70px]" value={data.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} />
      </label>
      <label className="form-label">
        Terms & Conditions
        <textarea className="mt-1 min-h-[70px]" value={data.termsAndConditions} onChange={(e) => set("termsAndConditions", e.target.value)} />
      </label>
    </div>
  );
}
