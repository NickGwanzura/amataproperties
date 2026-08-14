"use client";

import React, { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Search,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditLog } from "@/lib/db/schema";

const MODULES = ["ALL", "Reservations", "Sales", "Payments", "Users", "Developments", "Leads", "Auth", "STANDS", "GROUP_BUYING"];

const LIMIT_OPTIONS = [25, 50, 100, 200, 500];

function formatDate(iso: Date): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: Date): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatJson(value: unknown): string {
  if (value === null || value === undefined) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

type Props = {
  logs: Array<AuditLog & { user?: { id: string; name: string; email: string } | null }>;
  total: number;
  limit: number;
  offset: number;
  module: string;
  search: string;
  dateFrom: string;
  dateTo: string;
};

export default function AuditLogTable({ logs, total, limit, offset, module, search, dateFrom, dateTo }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const hasPrev = page > 1;
  const hasNext = offset + limit < total;
  const hasActiveFilters = !!(search || dateFrom || dateTo || (module && module !== "ALL"));

  const buildHref = useCallback(
    (overrides: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(overrides)) {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      return qs ? `?${qs}` : "";
    },
    [searchParams],
  );

  const navigate = useCallback(
    (overrides: Record<string, string | null>) => {
      startTransition(() => {
        router.push(buildHref(overrides));
      });
    },
    [router, buildHref],
  );

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
        {/* Search (full width on mobile) */}
        <div className="relative order-1 w-full sm:order-none sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            defaultValue={search}
            placeholder="Search actions or modules…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const value = (e.target as HTMLInputElement).value.trim();
                navigate({ search: value || null, offset: null });
              }
            }}
            className="h-10 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          {search && (
            <button
              onClick={() => navigate({ search: null, offset: null })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Date filters — hidden on mobile behind a toggle, visible on desktop */}
        <div className="hidden sm:flex sm:items-center sm:gap-2">
          <label className="whitespace-nowrap text-xs font-medium text-muted-foreground">From</label>
          <input
            type="date"
            defaultValue={dateFrom}
            onChange={(e) => navigate({ dateFrom: e.target.value || null, offset: null })}
            className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="hidden sm:flex sm:items-center sm:gap-2">
          <label className="whitespace-nowrap text-xs font-medium text-muted-foreground">To</label>
          <input
            type="date"
            defaultValue={dateTo}
            onChange={(e) => navigate({ dateTo: e.target.value || null, offset: null })}
            className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Limit + CSV — row on mobile */}
        <div className="order-2 flex items-center gap-2 sm:order-none">
          <select
            defaultValue={limit}
            onChange={(e) => navigate({ limit: e.target.value, offset: null })}
            className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <a
            href={`/api/reports/audit/csv?module=${module === "ALL" ? "" : module}&dateFrom=${dateFrom}&dateTo=${dateTo}`}
            download
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:px-4"
            aria-label="Export CSV"
          >
            <Download className="size-4 shrink-0" />
            <span className="text-xs sm:text-sm">CSV</span>
          </a>
        </div>

        {/* Mobile date filter toggle */}
        <div className="order-1 flex sm:hidden">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition",
              dateFrom || dateTo
                ? "border-primary bg-primary/5 text-primary"
                : "bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            <span>Dates</span>
            {hasActiveFilters && <span className="size-1.5 rounded-full bg-primary" />}
          </button>
        </div>
      </div>

      {/* Mobile date filter panel — collapsible */}
      {mobileFilterOpen && (
        <div className="mt-2 flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 sm:hidden">
          <div className="flex items-center gap-3">
            <label className="whitespace-nowrap text-xs font-medium text-muted-foreground">From</label>
            <input
              type="date"
              defaultValue={dateFrom}
              onChange={(e) => navigate({ dateFrom: e.target.value || null, offset: null })}
              className="h-10 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="whitespace-nowrap text-xs font-medium text-muted-foreground">To</label>
            <input
              type="date"
              defaultValue={dateTo}
              onChange={(e) => navigate({ dateTo: e.target.value || null, offset: null })}
              className="h-10 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                navigate({ dateFrom: null, dateTo: null, offset: null });
                setMobileFilterOpen(false);
              }}
              className="self-end text-xs font-semibold text-primary hover:underline"
            >
              Clear dates
            </button>
          )}
        </div>
      )}

      {/* ── Module filter pills — horizontally scrollable on mobile ── */}
      <div className="mt-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-1 sm:flex-wrap">
          {MODULES.map((m) => (
            <button
              key={m}
              onClick={() => navigate({ module: m === "ALL" ? null : m, offset: null })}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition",
                (module === m || (m === "ALL" && !module))
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results count + filter summary ── */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">
          {total.toLocaleString()} record{total !== 1 ? "s" : ""}
        </span>
        {search && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs">
            &ldquo;{search}&rdquo;
            <button
              onClick={() => navigate({ search: null, offset: null })}
              className="ml-0.5 hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3" />
            </button>
          </span>
        )}
        {module && module !== "ALL" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {module}
            <button
              onClick={() => navigate({ module: null, offset: null })}
              className="ml-0.5 hover:text-primary/80"
              aria-label="Clear module"
            >
              <X className="size-3" />
            </button>
          </span>
        )}
      </div>

      {/* ── Desktop table ── */}
      <section className="premium-panel mt-4 hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="size-6 text-muted-foreground/50" />
                      <span>No audit entries for this filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3">
                        {expandedId === log.id ? (
                          <ChevronUp className="size-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-3.5 text-muted-foreground" />
                        )}
                      </td>
                      <td className="kpi-number whitespace-nowrap text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="font-medium">
                        {log.user?.name ?? <span className="text-muted-foreground">System</span>}
                      </td>
                      <td>
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">{log.module}</span>
                      </td>
                      <td className="font-semibold">{log.action.replaceAll("_", " ")}</td>
                      <td className="kpi-number max-w-[200px] truncate font-mono text-xs text-muted-foreground">
                        {log.newValue ? JSON.stringify(log.newValue).slice(0, 80) : "—"}
                      </td>
                      <td className="kpi-number font-mono text-xs text-muted-foreground">{log.ipAddress ?? "—"}</td>
                    </tr>
                    {expandedId === log.id && (
                      <tr className="bg-muted/20">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Previous Value
                              </p>
                              <pre className="max-h-48 overflow-auto rounded border bg-background p-3 font-mono text-xs whitespace-pre-wrap">
                                {formatJson(log.previousValue)}
                              </pre>
                            </div>
                            <div>
                              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                New Value
                              </p>
                              <pre className="max-h-48 overflow-auto rounded border bg-background p-3 font-mono text-xs whitespace-pre-wrap">
                                {formatJson(log.newValue)}
                              </pre>
                            </div>
                          </div>
                          {log.user && (
                            <p className="mt-3 text-xs text-muted-foreground">
                              By: {log.user.name} ({log.user.email}) &middot; Log ID: {log.id}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Mobile card layout ── */}
      <section className="mt-4 space-y-3 md:hidden">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-background px-6 py-12 text-center">
            <AlertCircle className="size-8 text-muted-foreground/50" />
            <p className="font-semibold text-foreground">No audit entries</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="premium-panel overflow-hidden">
              {/* Card header — always visible */}
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left active:bg-muted/20"
              >
                {/* Icon + metadata column */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="size-4 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Top row: module badge + timestamp */}
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold">{log.module}</span>
                    <span className="text-[11px] text-muted-foreground">{formatDateShort(log.createdAt)}</span>
                  </div>

                  {/* Action title — prominent */}
                  <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
                    {log.action.replaceAll("_", " ")}
                  </p>

                  {/* Bottom row: user + IP */}
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span>{log.user?.name ?? "System"}</span>
                    {log.ipAddress && (
                      <>
                        <span className="text-muted-foreground/40">&middot;</span>
                        <span className="font-mono">{log.ipAddress}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                <div className="mt-1 shrink-0">
                  {expandedId === log.id ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded detail section */}
              {expandedId === log.id && (
                <div className="border-t border-border/50 bg-muted/10 px-4 py-3.5">
                  {/* Previous / New values */}
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className="inline-block size-2 rounded-full bg-amber-400" />
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Previous Value
                        </p>
                      </div>
                      <pre className="max-h-40 overflow-auto rounded-lg border bg-background p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                        {formatJson(log.previousValue)}
                      </pre>
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className="inline-block size-2 rounded-full bg-emerald-400" />
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          New Value
                        </p>
                      </div>
                      <pre className="max-h-40 overflow-auto rounded-lg border bg-background p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                        {formatJson(log.newValue)}
                      </pre>
                    </div>
                  </div>

                  {/* Metadata footer */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-background/60 px-3 py-2 text-[10px] text-muted-foreground">
                    {log.user && (
                      <span>
                        By: <strong>{log.user.name}</strong> ({log.user.email})
                      </span>
                    )}
                    <span className="font-mono">ID: {log.id.slice(0, 8)}&hellip;</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          {/* Previous button */}
          <button
            disabled={!hasPrev}
            onClick={() => navigate({ offset: String(offset - limit) })}
            className={cn(
              "inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-5 py-3 text-sm font-semibold transition sm:w-auto sm:px-4 sm:py-2.5",
              hasPrev
                ? "bg-muted text-foreground active:scale-[0.97] hover:bg-muted/70"
                : "cursor-not-allowed bg-muted/30 text-muted-foreground/50",
            )}
          >
            <ChevronLeft className="size-4" />
            <span>Previous</span>
          </button>

          {/* Page indicator */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{page}</span>
            <span className="text-muted-foreground/50">/</span>
            <span>{totalPages}</span>
            <span className="ml-1 text-xs text-muted-foreground/50">
              ({offset + 1}&ndash;{Math.min(offset + limit, total)})
            </span>
          </div>

          {/* Next button */}
          <button
            disabled={!hasNext}
            onClick={() => navigate({ offset: String(offset + limit) })}
            className={cn(
              "inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-5 py-3 text-sm font-semibold transition sm:w-auto sm:px-4 sm:py-2.5",
              hasNext
                ? "bg-muted text-foreground active:scale-[0.97] hover:bg-muted/70"
                : "cursor-not-allowed bg-muted/30 text-muted-foreground/50",
            )}
          >
            <span>Next</span>
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
