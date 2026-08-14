"use client";

import { useMemo, useState } from "react";
import { Maximize2, Search } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { money, cn } from "@/lib/utils";

type StandRow = {
  id: string;
  standNumber: string;
  sizeSqm: number;
  price: number;
  status: string;
};

type SortKey = "standNumber" | "sizeSqm" | "price";

export function StandsExplorer({ stands, largeThreshold }: { stands: StandRow[]; largeThreshold: number }) {
  const [query, setQuery] = useState("");
  const [largeOnly, setLargeOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("standNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let rows = stands;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((s) => s.standNumber.toLowerCase().includes(q));
    }
    if (largeOnly) {
      rows = rows.filter((s) => s.sizeSqm >= largeThreshold);
    }
    const sorted = [...rows].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "standNumber") return a.standNumber.localeCompare(b.standNumber) * dir;
      return (a[sortKey] - b[sortKey]) * dir;
    });
    return sorted;
  }, [stands, query, largeOnly, largeThreshold, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/50 bg-card p-3 shadow-sm">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stand number…"
            className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary">
          <input type="checkbox" checked={largeOnly} onChange={(e) => setLargeOnly(e.target.checked)} className="size-4" />
          <Maximize2 className="size-4" /> Large stands only
        </label>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-muted-foreground">Sort:</span>
          {([
            ["standNumber", "Stand #"],
            ["sizeSqm", "Size"],
            ["price", "Price"],
          ] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSort(key)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 font-semibold transition hover:bg-muted",
                sortKey === key && "bg-primary/10 text-primary"
              )}
            >
              {label} {sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="table-wrap mt-4 max-h-[640px] overflow-y-auto rounded-xl border border-border/50">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Stand Number</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((s, i) => {
                const isLarge = s.sizeSqm >= largeThreshold;
                return (
                  <tr key={s.id} className={cn("border-t transition hover:bg-muted/50", i === 0 && "border-t-0")}>
                    <td className="px-4 py-3 font-medium">
                      <span className="flex items-center gap-2">
                        {s.standNumber}
                        {isLarge && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                            <Maximize2 className="size-3" /> Large
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="kpi-number px-4 py-3">{s.sizeSqm} sqm</td>
                    <td className="kpi-number px-4 py-3 font-semibold">{money(s.price)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3">
                      {s.status === "AVAILABLE" ? (
                        <a
                          href={`?stand=${s.id}#reserve`}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
                        >
                          Reserve Now
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No stands match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
