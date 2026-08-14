"use client";

import { useState } from "react";
import { Loader2, Tags } from "lucide-react";
import { repriceAvailableStandsAction } from "@/lib/actions";
import { useToast } from "@/components/toast";

export function BulkReprice({
  developmentId,
  currentPricePerSqm,
  currentDepositAmount,
  availableCount,
}: {
  developmentId: string;
  currentPricePerSqm: string;
  currentDepositAmount: string;
  availableCount: number;
}) {
  const toast = useToast();
  const [pricePerSqm, setPricePerSqm] = useState(currentPricePerSqm);
  const [depositAmount, setDepositAmount] = useState(currentDepositAmount);
  const [notifyTeam, setNotifyTeam] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const priceChanged = parseFloat(pricePerSqm || "0") !== parseFloat(currentPricePerSqm);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    const fd = new FormData();
    fd.set("pricePerSqm", pricePerSqm);
    fd.set("depositAmount", depositAmount);
    if (notifyTeam) fd.set("notifyTeam", "on");

    const result = await repriceAvailableStandsAction(developmentId, fd);
    setPending(false);
    if (result.ok) {
      toast.success("Stands repriced", `${result.count} available stand${result.count === 1 ? "" : "s"} updated to the new rate.`);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="premium-panel space-y-5 p-6">
      <div>
        <h2 className="flex items-center gap-2 font-semibold">
          <Tags className="size-4 text-primary" />
          Bulk Reprice Available Stands
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Updates the development&apos;s rate and recalculates the price of every currently
          AVAILABLE stand ({availableCount} right now). Sold, reserved, and blocked stands
          keep their existing price.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="form-label">
            New Price per sqm (USD) *
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={pricePerSqm}
              onChange={(e) => setPricePerSqm(e.target.value)}
            />
          </label>
          <label className="form-label">
            New Deposit Amount (USD)
            <input
              type="number"
              step="0.01"
              min="0"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
          </label>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={notifyTeam} onChange={(e) => setNotifyTeam(e.target.checked)} className="size-4" />
          Email all agents, admins, and CEO about this price change
        </label>

        {priceChanged && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            This will reprice <strong>{availableCount}</strong> available stand{availableCount === 1 ? "" : "s"} from{" "}
            <strong>${parseFloat(currentPricePerSqm).toFixed(2)}/sqm</strong> to{" "}
            <strong>${parseFloat(pricePerSqm || "0").toFixed(2)}/sqm</strong>.
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Tags className="size-4" />}
          {pending ? "Repricing…" : "Apply New Rate"}
        </button>
      </form>
    </div>
  );
}
