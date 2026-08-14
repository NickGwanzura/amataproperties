"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export function StandFilters({ developments }: { developments: { id: string; name: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`/admin/stands?${next.toString()}`);
    },
    [params, router],
  );

  const hasFilters = ["dev", "status", "phase", "q", "priceMin", "priceMax"].some((k) => params.get(k));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="form-label">
          Development
          <select value={params.get("dev") ?? ""} onChange={(e) => update("dev", e.target.value)} className="min-w-[200px]">
            <option value="">All developments</option>
            {developments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Status
          <select value={params.get("status") ?? ""} onChange={(e) => update("status", e.target.value)}>
            <option value="">All statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="PRESALE">Presale</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </label>
        <label className="form-label">
          Phase
          <input value={params.get("phase") ?? ""} onChange={(e) => update("phase", e.target.value)} placeholder="Phase 1" className="w-32" />
        </label>
        <label className="form-label">
          Search
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && update("q", search)}
            onBlur={() => update("q", search)}
            placeholder="Stand # or notes"
            className="w-40"
          />
        </label>
        <label className="form-label">
          Min Price
          <input type="number" defaultValue={params.get("priceMin") ?? ""} onBlur={(e) => update("priceMin", e.target.value)} className="w-28" />
        </label>
        <label className="form-label">
          Max Price
          <input type="number" defaultValue={params.get("priceMax") ?? ""} onBlur={(e) => update("priceMax", e.target.value)} className="w-28" />
        </label>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push("/admin/stands")}
            className="inline-flex h-11 items-center rounded border bg-background px-4 text-sm font-semibold transition hover:bg-muted"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["active", "archived", "deleted"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => update("view", v === "active" ? "" : v)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
              (params.get("view") ?? "active") === v ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
            }`}
          >
            {v}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 rounded-full border p-0.5">
          {(["table", "grid"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => update("layout", v === "table" ? "" : v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                (params.get("layout") ?? "table") === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
