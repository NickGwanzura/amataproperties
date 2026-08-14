"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function PaymentFilters({
  developments,
}: {
  developments: { id: string; slug: string; name: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`/accounts/payments?${next.toString()}`);
    },
    [params, router],
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="form-label">
        Development
        <select
          value={params.get("dev") ?? ""}
          onChange={(e) => update("dev", e.target.value)}
          className="min-w-[200px]"
        >
          <option value="">All developments</option>
          {developments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="form-label">
        Type
        <select
          value={params.get("type") ?? ""}
          onChange={(e) => update("type", e.target.value)}
        >
          <option value="">All types</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="INSTALLMENT">Installment</option>
          <option value="ADJUSTMENT">Admin Fee</option>
        </select>
      </label>

      <label className="form-label">
        Status
        <select
          value={params.get("status") ?? ""}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="VERIFIED">Verified</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REVERSED">Reversed</option>
        </select>
      </label>

      {(params.get("dev") || params.get("type") || params.get("status")) && (
        <button
          type="button"
          onClick={() => router.push("/accounts/payments")}
          className="inline-flex h-11 items-center rounded border bg-background px-4 text-sm font-semibold transition hover:bg-muted"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
