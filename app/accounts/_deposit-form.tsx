"use client";

import { useState } from "react";
import { Banknote, CheckCircle2, X, DollarSign, Hash, FileText } from "lucide-react";
import { recordDepositAndConvert } from "@/lib/actions";
import { useToast } from "@/components/toast";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ECOCASH", label: "EcoCash" },
  { value: "VELOCITY", label: "Velocity" },
  { value: "OTHER", label: "Other" },
];

export function DepositForm({
  reservationId,
  defaultAmount,
  defaultMethod,
}: {
  reservationId: string;
  defaultAmount: number;
  defaultMethod?: string;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount") as string);

    if (!amount || amount <= 0) {
      setError("Deposit amount must be greater than zero.");
      setSubmitting(false);
      return;
    }

    try {
      await recordDepositAndConvert(reservationId, formData);
      toast.success("Deposit recorded", "Presale has been converted to an active sale.");
      setOpen(false);
    } catch {
      setError("Failed to record deposit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md"
        >
          <Banknote className="size-3.5" />
          Record Deposit
        </button>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border/70 bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10">
                  <DollarSign className="size-5 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Record Deposit</p>
                  <p className="text-xs text-muted-foreground">Convert presale to active sale</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-lg border border-border/60 text-muted-foreground transition hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-900">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <label className="form-label">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="size-3.5 text-primary" />
                  Deposit Amount (USD)
                </span>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0.01"
                  defaultValue={defaultAmount}
                  required
                  className="kpi-number text-lg font-semibold"
                  autoFocus
                />
                <span className="helper-text">Expected: ${defaultAmount.toLocaleString()}</span>
              </label>

              {/* Payment method */}
              <label className="form-label">
                <span className="flex items-center gap-1.5">
                  <Banknote className="size-3.5 text-primary" />
                  Payment Method
                </span>
                <select name="method" defaultValue={defaultMethod ?? "BANK_TRANSFER"} required>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Reference */}
              <label className="form-label">
                <span className="flex items-center gap-1.5">
                  <Hash className="size-3.5 text-primary" />
                  Reference / Transaction ID
                </span>
                <input
                  type="text"
                  name="reference"
                  placeholder="e.g. TT-2026-010041"
                  required
                />
              </label>

              {/* Notes */}
              <label className="form-label">
                <span className="flex items-center gap-1.5">
                  <FileText className="size-3.5 text-primary" />
                  Notes (optional)
                </span>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Any additional details about this payment"
                  className="min-h-[3rem]"
                />
              </label>

              {/* Admin fee */}
              <label className="form-label">
                <span className="flex items-center gap-1.5">
                  <Hash className="size-3.5 text-primary" />
                  Admin Fee (optional, billed on top of the price)
                </span>
                <input
                  type="number"
                  name="adminFee"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </label>
              <label className="form-label">
                <span className="flex items-center gap-1.5">
                  <Hash className="size-3.5 text-primary" />
                  Admin Fee Reference
                </span>
                <input
                  type="text"
                  name="adminFeeReference"
                  placeholder="e.g. ADM-2026-010041"
                />
              </label>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border bg-background px-4 text-sm font-semibold transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md disabled:translate-y-0 disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" />
                  {submitting ? "Processing…" : "Confirm & Create Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
