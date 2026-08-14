"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Columns3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  DollarSign,
} from "lucide-react";
import { getSaleFinancialSnapshot } from "@/lib/finance";
import { money } from "@/lib/utils";
import { useToast } from "@/components/toast";
import type { getSalesRegisterData } from "@/lib/db/queries/sales";
import {
  bulkUpdateSalesStatus,
  updateSaleStatusAction,
  updateSaleOutstandingAction,
} from "@/lib/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type SaleRow = Awaited<ReturnType<typeof getSalesRegisterData>>[number];

type ColumnKey =
  | "select"
  | "saleNumber"
  | "client"
  | "development"
  | "stand"
  | "agent"
  | "price"
  | "deposit"
  | "paid"
  | "balance"
  | "commission"
  | "overdue"
  | "nextDue"
  | "status"
  | "date"
  | "actions";

interface SavedView {
  name: string;
  q?: string;
  status?: string;
  development?: string;
}

const ALL_COLUMNS: { key: ColumnKey; label: string; default: boolean }[] = [
  { key: "select", label: "", default: true },
  { key: "saleNumber", label: "Sale No.", default: true },
  { key: "client", label: "Client", default: true },
  { key: "development", label: "Development", default: true },
  { key: "stand", label: "Stand", default: false },
  { key: "agent", label: "Agent", default: false },
  { key: "price", label: "Price", default: true },
  { key: "deposit", label: "Deposit", default: false },
  { key: "paid", label: "Paid", default: false },
  { key: "balance", label: "Balance", default: true },
  { key: "commission", label: "Commission", default: false },
  { key: "overdue", label: "Overdue", default: false },
  { key: "nextDue", label: "Next Due", default: true },
  { key: "status", label: "Status", default: true },
  { key: "date", label: "Date", default: false },
  { key: "actions", label: "", default: true },
];

const STATUSES = ["ACTIVE", "PAID_OFF", "DEFAULTED", "CANCELLED"] as const;

const QUICK_FILTERS = [
  { label: "All", status: undefined as string | undefined, dev: undefined as string | undefined },
  { label: "⚠️ Overdue", status: "ACTIVE" as const, dev: undefined as string | undefined, filterFn: (s: SaleRow) => getOverdueCount(s) > 0 },
  { label: "💰 Active", status: "ACTIVE" as const, dev: undefined as string | undefined },
  { label: "✅ Paid Off", status: "PAID_OFF" as const, dev: undefined as string | undefined },
  { label: "🔴 Defaulted", status: "DEFAULTED" as const, dev: undefined as string | undefined },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: "text-emerald-600 bg-emerald-50 border-emerald-200",
    PAID_OFF: "text-indigo-600 bg-indigo-50 border-indigo-200",
    DEFAULTED: "text-red-600 bg-red-50 border-red-200",
    CANCELLED: "text-muted-foreground bg-muted border-border",
  };
  return colors[status] ?? "bg-muted text-muted-foreground";
}

function getCommissionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "text-amber-700 bg-amber-50 border-amber-200",
    APPROVED: "text-emerald-700 bg-emerald-50 border-emerald-200",
    PAID: "text-indigo-700 bg-indigo-50 border-indigo-200",
    VOID: "text-muted-foreground bg-muted border-border",
  };
  return colors[status] ?? "bg-muted text-muted-foreground";
}

function getOverdueCount(sale: SaleRow): number {
  return sale.installmentPlan?.installments?.filter((i) => {
    const paid = parseFloat(i.amountPaid);
    const due = parseFloat(i.amountDue);
    return paid < due - 0.005 && new Date(i.dueDate) < new Date();
  }).length ?? 0;
}

function getOverdueAmount(sale: SaleRow): number {
  return sale.installmentPlan?.installments?.reduce((sum, i) => {
    const paid = parseFloat(i.amountPaid);
    const due = parseFloat(i.amountDue);
    if (paid < due - 0.005 && new Date(i.dueDate) < new Date()) {
      return sum + (due - paid);
    }
    return sum;
  }, 0) ?? 0;
}

function getCommissionForSale(sale: SaleRow) {
  return sale.commissions?.[0] ?? null;
}

function getOverdueInstallments(sale: SaleRow) {
  return sale.installmentPlan?.installments?.filter((i) => {
    const paid = parseFloat(i.amountPaid);
    const due = parseFloat(i.amountDue);
    return paid < due - 0.005 && new Date(i.dueDate) < new Date();
  }) ?? [];
}

function getNextUnpaidInstallment(sale: SaleRow) {
  return sale.installmentPlan?.installments?.find((i) => {
    const paid = parseFloat(i.amountPaid);
    const due = parseFloat(i.amountDue);
    return paid < due - 0.005;
  }) ?? null;
}

const COLUMNS_STORAGE_KEY = "sales-register-columns-v2";
const VIEWS_STORAGE_KEY = "sales-register-views";

// ─── Component ────────────────────────────────────────────────────────────────

export function SalesRegister({
  sales,
  developments,
  statuses,
  initialQ,
  initialStatus,
  initialDev,
  actionsEnabled = true,
  basePath = "/sysadmin/sales",
  title = "Sales Register",
}: {
  sales: SaleRow[];
  developments: string[];
  statuses: string[];
  initialQ: string;
  initialStatus: string;
  initialDev: string;
  /** Enable bulk actions, inline editing, and row selection (sysadmin-only features) */
  actionsEnabled?: boolean;
  /** Base path for filter URL updates and row detail links */
  basePath?: string;
  /** Section title in the panel header */
  title?: string;
}) {
  const router = useRouter();
  const toast = useToast();

  // ── State ──────────────────────────────────────────────────────────────
  const [q, setQ] = useState(initialQ);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [devFilter, setDevFilter] = useState(initialDev);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const defaultColumns = Object.fromEntries(
    ALL_COLUMNS.filter((c) => actionsEnabled || c.key !== "select").map((c) => [c.key, c.default]),
  ) as Record<ColumnKey, boolean>;

  const [columnVisibility, setColumnVisibility] = useState<Record<ColumnKey, boolean>>(() => {
    if (typeof window === "undefined") return defaultColumns;
    try {
      const stored = localStorage.getItem(COLUMNS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        return Object.fromEntries(
          ALL_COLUMNS.filter((c) => actionsEnabled || c.key !== "select").map((c) => [c.key, parsed[c.key] ?? c.default]),
        ) as Record<ColumnKey, boolean>;
      }
    } catch { /* ignore */ }
    return defaultColumns;
  });
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(VIEWS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showSaveViewDialog, setShowSaveViewDialog] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [editingBalance, setEditingBalance] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editStatusValue, setEditStatusValue] = useState<string>("");
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const [overduePopoverSaleId, setOverduePopoverSaleId] = useState<string | null>(null);
  const overduePopoverRef = useRef<HTMLDivElement>(null);

  // ── Filtering ──────────────────────────────────────────────────────────
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const query = q.trim().toLowerCase();
      if (query) {
        const clientName = s.client?.name ?? "";
        const clientEmail = s.client?.email ?? "";
        const devName = s.development?.name ?? "";
        const standNum = s.stand?.standNumber ?? "";
        const agentName = s.agent?.user?.name ?? "";
        const status = s.status.replace("_", " ");
        const matches =
          s.saleNumber.toLowerCase().includes(query) ||
          clientName.toLowerCase().includes(query) ||
          clientEmail.toLowerCase().includes(query) ||
          devName.toLowerCase().includes(query) ||
          standNum.toLowerCase().includes(query) ||
          agentName.toLowerCase().includes(query) ||
          status.toLowerCase().includes(query);
        if (!matches) return false;
      }

      if (statusFilter && s.status !== statusFilter) return false;
      if (devFilter && s.development?.name !== devFilter) return false;

      return true;
    });
  }, [sales, q, statusFilter, devFilter]);

  // ── Active quick filter ────────────────────────────────────────────────
  const activeQuickFilter = useMemo(() => {
    return QUICK_FILTERS.findIndex(
      (f) => f.status === (statusFilter || undefined) && f.dev === (devFilter || undefined) && !f.filterFn,
    );
  }, [statusFilter, devFilter]);

  // ── Close dropdowns on outside click ───────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setShowColumnMenu(false);
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setShowViewMenu(false);
      }
      if (overduePopoverRef.current && !overduePopoverRef.current.contains(e.target as Node)) {
        setOverduePopoverSaleId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────
  const applyFilters = useCallback(() => {
    if (!actionsEnabled) return;
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statusFilter) params.set("status", statusFilter);
    if (devFilter) params.set("development", devFilter);
    const qs = params.toString();
    router.push(`${basePath}${qs ? `?${qs}` : ""}`);
  }, [q, statusFilter, devFilter, router, basePath, actionsEnabled]);

  const clearFilters = useCallback(() => {
    setQ("");
    setStatusFilter("");
    setDevFilter("");
    setSelectedIds(new Set());
    if (actionsEnabled) {
      router.push(basePath);
    }
  }, [router, basePath, actionsEnabled]);

  const applyQuickFilter = useCallback((idx: number) => {
    const f = QUICK_FILTERS[idx];
    if (f.status || f.dev) {
      setStatusFilter(f.status ?? "");
      setDevFilter(f.dev ?? "");
      setQ("");
    }
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredSales.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSales.map((s) => s.id)));
    }
  }, [filteredSales, selectedIds]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleColumn = useCallback((key: ColumnKey) => {
    setColumnVisibility((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const handleBulkAction = useCallback(async (status: string) => {
    if (!selectedIds.size || !status) return;
    const ids = Array.from(selectedIds);
    const result = await bulkUpdateSalesStatus(ids, status as "ACTIVE" | "PAID_OFF" | "DEFAULTED" | "CANCELLED");
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(`Updated ${result.count} sales`, `Status changed to ${status.replace("_", " ")}`);
      setSelectedIds(new Set());
      setBulkStatus("");
      router.refresh();
    }
  }, [selectedIds, toast, router]);

  const handleSaveView = useCallback(() => {
    const name = newViewName.trim();
    if (!name) return;
    const view: SavedView = { name, q: q || undefined, status: statusFilter || undefined, development: devFilter || undefined };
    const updated = [...savedViews.filter((v) => v.name !== name), view];
    setSavedViews(updated);
    try { localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
    setNewViewName("");
    setShowSaveViewDialog(false);
    toast.success("View saved", `"${name}" is now available in Saved Views.`);
  }, [newViewName, savedViews, q, statusFilter, devFilter, toast]);

  const loadView = useCallback((view: SavedView) => {
    setQ(view.q ?? "");
    setStatusFilter(view.status ?? "");
    setDevFilter(view.development ?? "");
    setShowViewMenu(false);
  }, []);

  const deleteView = useCallback((name: string) => {
    const updated = savedViews.filter((v) => v.name !== name);
    setSavedViews(updated);
    try { localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  }, [savedViews]);

  const handleInlineBalanceEdit = useCallback(async (saleId: string) => {
    const result = await updateSaleOutstandingAction(saleId, editValue);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Balance updated");
      setEditingBalance(null);
      router.refresh();
    }
  }, [editValue, toast, router]);

  const handleInlineStatusEdit = useCallback(async (saleId: string) => {
    const result = await updateSaleStatusAction(saleId, editStatusValue as "ACTIVE" | "PAID_OFF" | "DEFAULTED" | "CANCELLED");
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Status updated");
      setEditingStatus(null);
      setBulkStatus("");
      router.refresh();
    }
  }, [editStatusValue, toast, router]);

  // ── Build export URL with current filters ──────────────────────────────
  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statusFilter) params.set("status", statusFilter);
    if (devFilter) params.set("development", devFilter);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [q, statusFilter, devFilter]);

  const hasActiveFilters = q || statusFilter || devFilter;
  const anySelected = selectedIds.size > 0;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Quick-filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {QUICK_FILTERS.map((f, idx) => {
          const isActive = idx === activeQuickFilter || (f.filterFn && idx === 0 && !statusFilter && !devFilter);
          return (
            <button
              key={f.label}
              onClick={() => {
                if (idx === 0) {
                  clearFilters();
                } else {
                  applyQuickFilter(idx);
                }
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          );
        })}

        {/* Saved views */}
        {savedViews.length > 0 && (
          <div className="relative ml-auto" ref={viewMenuRef}>
            <button
              onClick={() => setShowViewMenu(!showViewMenu)}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
            >
              <Save className="size-3.5" />
              Saved Views
              <ChevronDown className="size-3" />
            </button>
            {showViewMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border bg-background p-1 shadow-lg">
                {savedViews.map((view) => (
                  <div key={view.name} className="group flex items-center rounded-md px-2 py-1.5 text-xs hover:bg-muted">
                    <button
                      onClick={() => loadView(view)}
                      className="flex-1 text-left font-medium"
                    >
                      {view.name}
                    </button>
                    <button
                      onClick={() => deleteView(view.name)}
                      className="ml-2 hidden rounded p-0.5 text-muted-foreground hover:text-red-600 group-hover:inline-flex"
                      title="Delete view"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters bar */}
      <section className="premium-panel mt-4">
        <div className="flex flex-wrap items-center justify-between gap-y-3 border-b px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <DollarSign className="size-5 text-primary" />
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {hasActiveFilters
                ? `${filteredSales.length} of ${sales.length}`
                : `${sales.length}`}{" "}
              sale{sales.length !== 1 ? "s" : ""}
            </span>
            <form
              onSubmit={(e) => { e.preventDefault(); applyFilters(); }}
              className="flex flex-wrap items-center gap-2"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search…"
                  className="h-8 w-40 rounded-lg border bg-background pl-8 pr-2.5 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-lg border bg-background px-2.5 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
              <select
                value={devFilter}
                onChange={(e) => setDevFilter(e.target.value)}
                className="h-8 rounded-lg border bg-background px-2.5 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All developments</option>
                {developments.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <SlidersHorizontal className="size-3.5 mr-1" />
                Filter
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-8 items-center justify-center rounded-lg border bg-background px-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
                  title="Clear filters"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </form>

            {/* Save current view */}
            <button
              onClick={() => setShowSaveViewDialog(true)}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border bg-background px-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
              title="Save current filters as a view"
            >
              <Save className="size-3.5" />
              Save View
            </button>
          </div>
        </div>

        {/* Export + Column visibility row */}
        <div className="flex items-center justify-between px-5 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Export:</span>
            <a
              href={`/api/reports/sales/csv${exportUrl}`}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
            >
              <FileSpreadsheet className="size-3.5" />
              CSV
            </a>
            <a
              href={`/api/reports/sales/pdf${exportUrl}`}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
            >
              <FileText className="size-3.5" />
              PDF
            </a>
          </div>
          <div className="relative" ref={columnMenuRef}>
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
            >
              <Columns3 className="size-3.5" />
              Columns
              <ChevronDown className="size-3" />
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border bg-background p-1 shadow-lg">
                {ALL_COLUMNS.filter((c) => c.key !== "actions" && (actionsEnabled || c.key !== "select")).map((col) => (
                  <label
                    key={col.key}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={columnVisibility[col.key]}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded border-gray-300"
                    />
                    {columnVisibility[col.key] ? (
                      <Eye className="size-3 text-muted-foreground" />
                    ) : (
                      <EyeOff className="size-3 text-muted-foreground" />
                    )}
                    {col.label || "(icon)"}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Save view dialog */}
      {showSaveViewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="w-80 rounded-xl border bg-background p-5 shadow-xl">
            <h3 className="font-semibold">Save Current View</h3>
            <p className="mt-1 text-xs text-muted-foreground">Name this filter combination so you can come back to it.</p>
            <input
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="e.g. Active Harare Sales"
              className="mt-3 h-9 w-full rounded-lg border bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleSaveView(); }
                if (e.key === "Escape") setShowSaveViewDialog(false);
              }}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowSaveViewDialog(false)}
                className="inline-flex h-8 items-center rounded-lg border bg-background px-3 text-xs font-semibold transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveView}
                className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <Check className="size-3.5 mr-1" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {actionsEnabled && anySelected && (
        <div className="premium-panel mt-4 flex items-center gap-4 border-l-4 border-l-primary px-5 py-3">
          <span className="text-sm font-semibold">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="h-8 rounded-lg border bg-background px-2.5 text-xs"
            >
              <option value="">Change status…</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
            <button
              onClick={() => handleBulkAction(bulkStatus)}
              disabled={!bulkStatus}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              <CheckCheck className="size-3.5" />
              Apply
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="inline-flex h-8 items-center gap-1 rounded-lg border bg-background px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
            >
              <X className="size-3.5" />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <section className="premium-panel mt-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                {columnVisibility.select && (
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={filteredSales.length > 0 && selectedIds.size === filteredSales.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                {columnVisibility.saleNumber && <th className="px-3 py-3">Sale & date</th>}
                {columnVisibility.client && <th className="px-3 py-3">Client</th>}
                {columnVisibility.development && <th className="px-3 py-3">Property</th>}
                {columnVisibility.stand && <th className="px-3 py-3">Stand</th>}
                {columnVisibility.agent && <th className="px-3 py-3">Agent</th>}
                {columnVisibility.price && <th className="px-3 py-3 text-right">Sale value</th>}
                {columnVisibility.deposit && <th className="px-3 py-3 text-right">Deposit</th>}
                {columnVisibility.paid && <th className="px-3 py-3 text-right">Paid</th>}
                {columnVisibility.balance && <th className="px-3 py-3 text-right">Account</th>}
                {columnVisibility.commission && <th className="px-3 py-3">Commission</th>}
                {columnVisibility.overdue && <th className="px-3 py-3 text-center">Overdue</th>}
                {columnVisibility.nextDue && <th className="px-3 py-3">Schedule</th>}
                {columnVisibility.status && <th className="px-3 py-3">Status</th>}
                {columnVisibility.date && <th className="px-3 py-3">Date</th>}
                {columnVisibility.actions && <th className="px-3 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSales.length === 0 ? (
                <tr>
                  <td
                    colSpan={Object.values(columnVisibility).filter(Boolean).length}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    {hasActiveFilters
                      ? "No sales match the current filters."
                      : "No sales recorded yet."}
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const overdueCount = getOverdueCount(s);
                  const overdueAmount = getOverdueAmount(s);
                  const commission = getCommissionForSale(s);
                  const finance = getSaleFinancialSnapshot(s);
                  const nextDue = getNextUnpaidInstallment(s);
                  const isOverdue = overdueCount > 0;

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-muted/30 ${isOverdue ? "bg-red-50/30" : ""} ${selectedIds.has(s.id) ? "bg-primary/5" : ""}`}
                    >
                      {columnVisibility.select && (
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(s.id)}
                            onChange={() => toggleSelect(s.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                      )}
                      {columnVisibility.saleNumber && (
                        <td className="px-3 py-3">
                          <p className="kpi-number font-semibold">{s.saleNumber}</p>
                          {!columnVisibility.date && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {new Date(s.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                          )}
                        </td>
                      )}
                      {columnVisibility.client && (
                        <td className="px-3 py-3">
                          <p className="font-medium">{s.client?.name ?? "—"}</p>
                          {s.client?.email && (
                            <p className="text-xs text-muted-foreground">{s.client.email}</p>
                          )}
                        </td>
                      )}
                      {columnVisibility.development && (
                        <td className="px-3 py-3">
                          <p className="font-medium">{s.development?.name ?? "—"}</p>
                          {(!columnVisibility.stand || !columnVisibility.agent) && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {!columnVisibility.stand && <>Stand {s.stand?.standNumber ?? "—"}</>}
                              {!columnVisibility.stand && !columnVisibility.agent && " · "}
                              {!columnVisibility.agent && (s.agent?.user?.name ?? "Unassigned")}
                            </p>
                          )}
                        </td>
                      )}
                      {columnVisibility.stand && (
                        <td className="kpi-number px-3 py-3 font-semibold">{s.stand?.standNumber ?? "—"}</td>
                      )}
                      {columnVisibility.agent && (
                        <td className="px-3 py-3 text-muted-foreground">{s.agent?.user?.name ?? "—"}</td>
                      )}
                      {columnVisibility.price && (
                        <td className="kpi-number px-3 py-3 text-right">
                          <p className="font-semibold">{money(parseFloat(s.purchasePrice))}</p>
                          {!columnVisibility.deposit && (
                            <p className="mt-0.5 text-xs text-emerald-700">Deposit {money(parseFloat(s.depositPaid))}</p>
                          )}
                        </td>
                      )}
                      {columnVisibility.deposit && (
                        <td className="kpi-number px-3 py-3 text-right text-emerald-600">
                          {money(parseFloat(s.depositPaid))}
                        </td>
                      )}
                      {columnVisibility.paid && (
                        <td className="kpi-number px-3 py-3 text-right font-semibold text-emerald-700">
                          <span>{money(finance.propertyPaid)}</span>
                          {finance.isReconciledFromLedger ? (
                            <p className="mt-0.5 text-[10px] font-medium text-amber-700">ledger</p>
                          ) : null}
                        </td>
                      )}
                      {columnVisibility.balance && (
                        <td className="kpi-number px-3 py-3 text-right">
                          {!columnVisibility.paid && (
                            <p className="mb-0.5 text-xs font-semibold text-emerald-700">Paid {money(finance.propertyPaid)}</p>
                          )}
                          {actionsEnabled && editingBalance === s.id ? (
                            <form
                              onSubmit={(e) => { e.preventDefault(); handleInlineBalanceEdit(s.id); }}
                              className="inline-flex items-center gap-1"
                            >
                              <input
                                type="number"
                                step="0.01"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-7 w-24 rounded border bg-background px-2 text-xs text-right ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                autoFocus
                                onBlur={() => setTimeout(() => setEditingBalance(null), 150)}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") setEditingBalance(null);
                                }}
                              />
                              <button
                                type="submit"
                                className="inline-flex size-6 items-center justify-center rounded bg-primary text-primary-foreground"
                              >
                                <Check className="size-3" />
                              </button>
                            </form>
                          ) : actionsEnabled ? (
                            <button
                              onClick={() => {
                                setEditingBalance(s.id);
                                setEditValue(String(finance.outstanding));
                              }}
                              className="hover:text-primary transition-colors"
                              title="Click to edit balance"
                            >
                              {money(finance.outstanding)}
                            </button>
                          ) : (
                            <span className="font-semibold">Balance {money(finance.outstanding)}</span>
                          )}
                        </td>
                      )}
                      {columnVisibility.commission && (
                        <td className="px-3 py-3">
                          {commission ? (
                            <div className="space-y-0.5">
                              <span className="kpi-number text-xs font-semibold">
                                {money(parseFloat(commission.amount))}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${getCommissionStatusColor(commission.status)}`}
                              >
                                {commission.status}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                      {columnVisibility.overdue && (
                        <td className="px-3 py-3 text-center relative">
                          {isOverdue ? (
                            <div className="relative inline-flex" ref={overduePopoverSaleId === s.id ? overduePopoverRef : undefined}>
                              <button
                                onClick={() => setOverduePopoverSaleId(overduePopoverSaleId === s.id ? null : s.id)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
                              >
                                <AlertTriangle className="size-3.5" />
                                <span className="hidden lg:inline">
                                  {overdueCount} overdue
                                </span>
                              </button>
                              {overduePopoverSaleId === s.id && (
                                <div
                                  className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border bg-background p-4 shadow-xl"
                                >
                                  <div className="flex items-start justify-between gap-2 mb-3">
                                    <div>
                                      <p className="text-sm font-semibold text-red-700">
                                        {overdueCount} Overdue Installment{overdueCount > 1 ? "s" : ""}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {money(overdueAmount)} total overdue
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => setOverduePopoverSaleId(null)}
                                      className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    >
                                      <X className="size-3.5" />
                                    </button>
                                  </div>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {getOverdueInstallments(s).map((inst, idx) => {
                                      const paid = parseFloat(inst.amountPaid);
                                      const due = parseFloat(inst.amountDue);
                                      const remaining = due - paid;
                                      const daysOverdue = Math.round(
                                        (new Date().getTime() - new Date(inst.dueDate).getTime()) / 86400000
                                      );
                                      return (
                                        <div
                                          key={inst.id}
                                          className={`flex items-center justify-between rounded-lg border p-2.5 text-xs ${
                                            idx === 0
                                              ? "border-red-200 bg-red-50"
                                              : "border-border bg-muted/30"
                                          }`}
                                        >
                                          <div>
                                            <p className="font-semibold">
                                              Installment #{inst.sequence}
                                            </p>
                                            <p className="text-muted-foreground">
                                              Due: {new Date(inst.dueDate).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                              })}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-semibold text-red-600">
                                              {money(remaining)}
                                            </p>
                                            <p className="text-muted-foreground">
                                              {daysOverdue}d overdue
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : s.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                              <Clock className="size-3" />
                              <span className="hidden lg:inline">Current</span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                      {columnVisibility.nextDue && (
                        <td className="px-3 py-3">
                          {!columnVisibility.overdue && (
                            <div className={`mb-1 text-xs font-semibold ${isOverdue ? "text-red-600" : "text-emerald-700"}`}>
                              {isOverdue ? `${overdueCount} overdue · ${money(overdueAmount)}` : s.status === "ACTIVE" ? "Current" : ""}
                            </div>
                          )}
                          {nextDue ? (
                            <div className="text-xs">
                              <p className="kpi-number font-semibold">
                                {money(Math.max(0, parseFloat(nextDue.amountDue) - parseFloat(nextDue.amountPaid)))}
                              </p>
                              <p className="text-muted-foreground">
                                {new Date(nextDue.dueDate).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          ) : s.status === "PAID_OFF" ? (
                            <span className="text-xs font-semibold text-emerald-700">Settled</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                      {columnVisibility.status && (
                        <td className="px-3 py-3">
                          {actionsEnabled && editingStatus === s.id ? (
                            <form
                              onSubmit={(e) => { e.preventDefault(); handleInlineStatusEdit(s.id); }}
                              className="inline-flex items-center gap-1"
                            >
                              <select
                                value={editStatusValue}
                                onChange={(e) => setEditStatusValue(e.target.value)}
                                className="h-7 rounded border bg-background px-2 text-xs"
                                autoFocus
                                onBlur={() => setTimeout(() => setEditingStatus(null), 150)}
                              >
                                {STATUSES.map((st) => (
                                  <option key={st} value={st}>{st.replace("_", " ")}</option>
                                ))}
                              </select>
                              <button
                                type="submit"
                                className="inline-flex size-6 items-center justify-center rounded bg-primary text-primary-foreground"
                              >
                                <Check className="size-3" />
                              </button>
                            </form>
                          ) : (
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${getStatusColor(s.status)}`}
                            >
                              {s.status.replace("_", " ")}
                            </span>
                          )}
                        </td>
                      )}
                      {columnVisibility.date && (
                        <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(s.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      )}
                      {columnVisibility.actions && (
                        <td className="px-3 py-3">
                          <Link
                            href={`${basePath}/${s.id}`}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Open record →
                          </Link>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
