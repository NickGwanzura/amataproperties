"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { submitPaymentProofAction } from "@/lib/actions";

export default function SubmitPaymentPage() {
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setFileName(e.target.files?.[0]?.name ?? null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitPaymentProofAction(fd);
      setState(result);
      if (result.ok) formRef.current?.reset();
    });
  }

  return (
    <div className="dashboard-page max-w-xl">
      <Link
        href="/client"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Dashboard
      </Link>

      <h1 className="text-2xl font-semibold">Submit Payment Proof</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload your bank transfer receipt, EcoCash screenshot, or any proof of payment.
        Our accounts team will verify and record it within 24 hours.
      </p>

      {state?.ok ? (
        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
          <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
          <p className="mt-3 font-semibold text-emerald-800 dark:text-emerald-300">Submitted successfully</p>
          <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p>
          <button
            onClick={() => setState(null)}
            className="mt-4 text-sm font-semibold text-primary hover:underline"
          >
            Submit another
          </button>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="mt-8 space-y-5">
          {state && !state.ok && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              {state.message}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium">Amount Paid (USD) *</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="1"
              required
              placeholder="e.g. 309.72"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Payment Method *</label>
            <select
              name="method"
              required
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select method…</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="ECOCASH">EcoCash</option>
              <option value="CASH">Cash</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Transaction Reference *</label>
            <input
              name="reference"
              type="text"
              required
              placeholder="e.g. ECO123456 or bank ref"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Date Paid *</label>
            <input
              name="paidAt"
              type="date"
              required
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Proof of Payment (optional)</label>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-6 py-8 text-center transition hover:bg-primary/10">
              <Upload className="size-6 text-primary/60" />
              <span className="text-sm font-medium">{fileName ?? "Click to attach receipt / screenshot"}</span>
              <span className="text-xs text-muted-foreground">JPG, PNG, or PDF · max 5 MB</span>
              <input
                name="proof"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFile}
                className="sr-only"
              />
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Notes (optional)</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Any additional details…"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:opacity-50"
          >
            {isPending ? "Submitting…" : "Submit Payment"}
          </button>
        </form>
      )}
    </div>
  );
}
