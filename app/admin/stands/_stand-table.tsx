"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Loader2, Trash2, UserCog } from "lucide-react";
import {
  bulkArchiveStandsAction,
  bulkAssignAgentAction,
  bulkDeleteStandsAction,
  bulkUpdateStandStatusAction,
  restoreStandAction,
} from "@/lib/actions";
import { useToast } from "@/components/toast";
import { money } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  PRESALE: "bg-amber-50 text-amber-800 border-amber-200",
  RESERVED: "bg-blue-50 text-blue-800 border-blue-200",
  SOLD: "bg-primary/10 text-primary border-primary/20",
  BLOCKED: "bg-muted text-muted-foreground",
};

export type StandRow = {
  id: string;
  standNumber: string;
  sizeSqm: number;
  price: string;
  status: string;
  phase: string;
  archivedAt: Date | null;
  deletedAt: Date | null;
  developmentName: string;
  developmentId: string;
};

export function StandTable({
  stands,
  agents,
  layout,
  view,
}: {
  stands: StandRow[];
  agents: { id: string; name: string }[];
  layout: "table" | "grid";
  view: "active" | "archived" | "deleted";
}) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");

  const allSelected = stands.length > 0 && selected.size === stands.length;

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(stands.map((s) => s.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const ids = useMemo(() => Array.from(selected), [selected]);

  async function run(label: string, fn: () => Promise<{ ok: boolean; error?: string; count?: number }>) {
    setPending(true);
    try {
      const result = await fn();
      if (result.ok) {
        toast.success(label, result.count !== undefined ? `${result.count} stand(s) updated.` : undefined);
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error("Couldn't complete this action", result.error);
      }
    } catch {
      toast.error("Something went wrong", "Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleRestoreMany() {
    setPending(true);
    try {
      const results = await Promise.all(ids.map((id) => restoreStandAction(id)));
      const failed = results.filter((r) => !r.ok);
      if (failed.length) toast.error("Some restores failed", `${failed.length} of ${ids.length} failed.`);
      else toast.success("Stands restored");
      setSelected(new Set());
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/50 px-5 py-3">
          <span className="text-sm font-semibold">{selected.size} selected</span>

          {view === "active" && (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => run("Stands archived", () => bulkArchiveStandsAction(ids))}
                className="inline-flex items-center gap-1.5 rounded border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
              >
                <Archive className="size-3.5" /> Archive
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (confirm(`Delete ${selected.size} stand(s)? Sold/reserved stands will be skipped.`))
                    run("Stands deleted", () => bulkDeleteStandsAction(ids));
                }}
                className="inline-flex items-center gap-1.5 rounded border bg-background px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
              <select
                value={bulkStatus}
                onChange={(e) => {
                  setBulkStatus(e.target.value);
                  if (e.target.value) run("Status updated", () => bulkUpdateStandStatusAction(ids, e.target.value));
                }}
                className="h-8 rounded border px-2 text-xs"
              >
                <option value="">Set status…</option>
                <option value="AVAILABLE">Available</option>
                <option value="PRESALE">Presale</option>
                <option value="BLOCKED">Blocked</option>
              </select>
              <div className="flex items-center gap-1.5">
                <UserCog className="size-3.5 text-muted-foreground" />
                <select
                  value={agentId}
                  onChange={(e) => {
                    setAgentId(e.target.value);
                    run("Agent assigned", () => bulkAssignAgentAction(ids, e.target.value || null));
                  }}
                  className="h-8 rounded border px-2 text-xs"
                >
                  <option value="">Assign agent…</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                  <option value="">Unassign</option>
                </select>
              </div>
            </>
          )}

          {view !== "active" && (
            <button
              type="button"
              disabled={pending}
              onClick={handleRestoreMany}
              className="inline-flex items-center gap-1.5 rounded border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <ArchiveRestore className="size-3.5" />} Restore
            </button>
          )}
        </div>
      )}

      {layout === "grid" ? (
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {stands.map((s) => (
            <Link
              key={s.id}
              href={`/admin/stands/${s.id}`}
              className="rounded-lg border p-4 transition hover:border-primary hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="kpi-number font-semibold">{s.standNumber}</span>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[s.status] ?? ""}`}>{s.status}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{s.developmentName}</p>
              <p className="mt-2 text-sm">{s.sizeSqm} m² · {s.phase}</p>
              <p className="kpi-number mt-1 font-semibold">{money(parseFloat(s.price))}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-4" />
                </th>
                <th className="px-4 py-3">Stand #</th>
                <th className="px-4 py-3">Development</th>
                <th className="px-4 py-3">Phase</th>
                <th className="px-4 py-3">Size (sqm)</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {stands.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No stands match filters.</td>
                </tr>
              ) : (
                stands.map((stand) => (
                  <tr key={stand.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(stand.id)} onChange={() => toggleOne(stand.id)} className="size-4" />
                    </td>
                    <td className="kpi-number px-4 py-3 font-semibold">
                      <Link href={`/admin/stands/${stand.id}`} className="hover:underline">{stand.standNumber}</Link>
                    </td>
                    <td className="px-4 py-3">{stand.developmentName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{stand.phase}</td>
                    <td className="kpi-number px-4 py-3">{stand.sizeSqm}</td>
                    <td className="kpi-number px-4 py-3 font-semibold">{money(parseFloat(stand.price))}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${STATUS_COLORS[stand.status] ?? ""}`}>
                        {stand.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
