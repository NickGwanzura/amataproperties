"use client";

import { useActionState, useRef, useState } from "react";
import {
  CheckCircle2, DollarSign, FileText, Hash, LoaderCircle, PlusCircle, Upload, X,
} from "lucide-react";
import { recordInstallmentPayment } from "@/lib/actions";
import { useToast } from "@/components/toast";

const METHODS = [
  { value: "CASH",          label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ECOCASH",       label: "EcoCash" },
  { value: "VELOCITY",      label: "Velocity" },
  { value: "OTHER",         label: "Other" },
];

type Sale = { id: string; saleNumber: string; clientId: string; clientName: string; standNumber: string; outstanding: number };

export function RecordPaymentForm({ sales, agentMode = false }: { sales: Sale[]; agentMode?: boolean }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(sales[0] ?? null);
  const [paymentType, setPaymentType] = useState<"DEPOSIT" | "INSTALLMENT" | "ADJUSTMENT">("INSTALLMENT");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [state, formAction, pending] = useActionState(recordInstallmentPayment, null);
  const prevOkRef = useRef(false);

  // Only show toast + close when state transitions from non-ok to ok
  if (state?.ok && !prevOkRef.current) {
    prevOkRef.current = true;
    toast.success(
      agentMode ? "Payment submitted" : "Payment recorded",
      agentMode ? "The receipt is attached and accounts has been notified for review." : "The receipt is attached and the payment has been applied to the sale.",
    );
    setReceiptUrl("");
    setOpen(false);
  }
  if (!state?.ok) prevOkRef.current = false;

  const inputCls = "h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary";

  async function uploadReceipt(file: File) {
    if (!selectedSale) return;
    setIsUploadingReceipt(true);
    setReceiptUrl("");
    try {
      const data = new FormData();
      data.set("file", file);
      data.set("clientId", selectedSale.clientId);
      const response = await fetch("/api/upload/document", { method: "POST", body: data });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Receipt upload failed.");
      setReceiptUrl(result.url);
      toast.success("Receipt uploaded", "The payment proof is attached to this submission.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Receipt upload failed.");
    } finally {
      setIsUploadingReceipt(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setReceiptUrl(""); setOpen(true); }}
        disabled={sales.length === 0}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PlusCircle className="size-4" />
        {agentMode ? "Submit Payment" : "Record Payment"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border/70 bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10">
                  <DollarSign className="size-5 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{agentMode ? "Submit Payment" : "Record Payment"}</p>
                  <p className="text-xs text-muted-foreground">
                    {agentMode ? "Accounts verifies the receipt before it updates the sale." : "Deposits and installments reduce the sale balance; admin fees stay separate."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setReceiptUrl(""); setOpen(false); }}
                className="grid size-8 place-items-center rounded-lg border border-border/60 text-muted-foreground transition hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form action={formAction} className="space-y-4 p-5">
              {/* Hidden fields */}
              <input type="hidden" name="clientId" value={selectedSale?.clientId ?? ""} />
              <input type="hidden" name="receiptUrl" value={receiptUrl} />

              {/* Sale select */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sale</p>
                <select
                  name="saleId"
                  required
                  className={inputCls}
                  onChange={(e) => {
                    const s = sales.find((s) => s.id === e.target.value) ?? null;
                    setSelectedSale(s);
                    setReceiptUrl("");
                    // update hidden clientId
                    const f = e.target.closest("form");
                    if (f) (f.elements.namedItem("clientId") as HTMLInputElement).value = s?.clientId ?? "";
                  }}
                  defaultValue={selectedSale?.id ?? ""}
                >
                  {sales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.saleNumber}: {s.clientName} · {s.standNumber}
                    </option>
                  ))}
                </select>
                {selectedSale && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Outstanding: <strong className="text-foreground">${selectedSale.outstanding.toLocaleString()}</strong> · The payment will update the schedule and statement.
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <label htmlFor="payment-type" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Type</label>
                <select
                  id="payment-type"
                  name="type"
                  required
                  className={inputCls}
                  value={paymentType}
                  onChange={(event) => setPaymentType(event.target.value as "DEPOSIT" | "INSTALLMENT" | "ADJUSTMENT")}
                >
                  <option value="DEPOSIT">Deposit</option>
                  <option value="INSTALLMENT">Installment</option>
                  <option value="ADJUSTMENT">Admin Fee</option>
                </select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {paymentType === "ADJUSTMENT"
                    ? "Admin fees are recorded separately and do not reduce the property balance."
                    : paymentType === "DEPOSIT"
                      ? "Deposits reduce the property balance and are applied to the earliest unpaid schedule items."
                      : "Installments are applied to the earliest unpaid schedule items automatically."}
                </p>
              </div>

              {/* Receipt number */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Receipt Number <span className="text-red-500">*</span>
                </p>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    name="receiptNumber"
                    required
                    placeholder="e.g. REC-2026-001234"
                    className={`${inputCls} pl-8`}
                  />
                </div>
              </div>

              {/* Receipt upload */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Receipt Upload <span className="text-red-500">*</span>
                </p>
                <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2.5 text-sm transition ${receiptUrl ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-border/80 bg-muted/20 hover:bg-muted/40"}`}>
                  <span className="flex min-w-0 items-center gap-2">
                    {isUploadingReceipt ? <LoaderCircle className="size-4 shrink-0 animate-spin" /> : <Upload className="size-4 shrink-0" />}
                    <span className="truncate">{isUploadingReceipt ? "Uploading receipt…" : receiptUrl ? "Receipt attached" : "Upload PDF or image"}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold">Choose file</span>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={isUploadingReceipt}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadReceipt(file);
                    }}
                  />
                </label>
                <p className="mt-1 text-[11px] text-muted-foreground">PDF, JPEG, PNG, or WebP - required before payment can be submitted.</p>
              </div>

              {/* Amount + Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Amount (USD) <span className="text-red-500">*</span>
                  </p>
                  <div className="relative">
                    <DollarSign className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      name="amount"
                      min="0.01"
                      step="0.01"
                      required
                      className={`${inputCls} pl-8 font-semibold`}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Method</p>
                  <select name="method" required className={inputCls} defaultValue="BANK_TRANSFER">
                    {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Reference */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Reference / Transaction ID <span className="text-red-500">*</span>
                </p>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    name="reference"
                    required
                    placeholder="e.g. TT-2026-001234"
                    className={`${inputCls} pl-8`}
                  />
                </div>
              </div>

              {/* Date paid */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date Paid</p>
                <input
                  type="date"
                  name="paidAt"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className={inputCls}
                />
              </div>

              {/* Notes */}
              <div>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                  <span className="text-[11px] text-muted-foreground/60">(optional)</span>
                </div>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-3 top-3 size-3.5 text-muted-foreground" />
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Additional details…"
                    className="w-full rounded-lg border border-border/70 bg-background px-3 py-2.5 pl-8 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Error */}
              {state && !state.ok && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-900">
                  {state.error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setReceiptUrl(""); setOpen(false); }}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border bg-background text-sm font-semibold transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || isUploadingReceipt || !receiptUrl}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" />
                  {pending ? "Saving…" : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
