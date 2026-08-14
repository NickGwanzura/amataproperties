"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, use, useRef } from "react";
import { AlertCircle, CheckCircle2, Plus, Trash2, Upload, Map as MapIcon, Pencil, ChevronDown, ChevronUp, FileText, ExternalLink, X } from "lucide-react";
import { updateDevelopmentAction, updateDevelopmentGeoJsonAction, updateStandAction, deleteStandAction, createStandsAction, bulkUpdateStandStatusAction, bulkDeleteStandsAction } from "@/lib/actions";
import { ImageUpload } from "@/components/image-upload";
import { BulkReprice } from "./_bulk-reprice";

const AMENITY_OPTIONS = [
  "Electricity", "Water & Reticulation", "Tarred Roads", "Security Gate",
  "Drainage System", "Street Lighting", "Borehole", "Communal Ablution",
  "Recreational Park", "School Site", "Commercial Zone",
];

const PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
];

const STATUS_OPTIONS = ["AVAILABLE", "PRESALE", "RESERVED", "SOLD", "BLOCKED"] as const;

type StandRow = {
  id: string;
  standNumber: string;
  sizeSqm: number;
  price: string;
  status: string;
  phase: string;
  notes: string;
};

type DevData = {
  id: string;
  name: string;
  location: string;
  province: string;
  description: string;
  developerName: string;
  developerContact: string;
  startingPrice: string;
  pricePerSqm: string;
  depositAmount: string;
  interestRate: string;
  paymentDurationMonths: number;
  paymentTerms: string;
  termsAndConditions: string;
  infrastructureStatus: string;
  heroImage: string;
  gallery: string[];
  amenities: string[];
  brochureUrl: string;
  stands: StandRow[];
};

function statusBadgeClass(status: string): string {
  switch (status) {
    case "AVAILABLE": return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "PRESALE":   return "bg-amber-50 text-amber-800 border-amber-200";
    case "RESERVED":  return "bg-blue-50 text-blue-800 border-blue-200";
    case "SOLD":      return "bg-primary/10 text-primary border-primary/20";
    case "BLOCKED":   return "bg-muted text-muted-foreground border-border";
    default:          return "bg-muted text-muted-foreground border-border";
  }
}

type EditData = {
  standNumber: string;
  phase: string;
  sizeSqm: string;
  price: string;
  status: string;
  notes: string;
};

function StandsSection({ devId, initialStands, slug }: { devId: string; initialStands: StandRow[]; slug: string }) {
  const [stands, setStands] = useState<StandRow[]>(initialStands);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditData>({ standNumber: "", phase: "", sizeSqm: "", price: "", status: "", notes: "" });
  const [adding, setAdding] = useState(false);
  const [addMode, setAddMode] = useState<"auto" | "custom">("auto");
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("AVAILABLE");
  const [bulkMsg, setBulkMsg] = useState("");

  // Add panel state
  const [addPrefix, setAddPrefix] = useState("");
  const [addStartNum, setAddStartNum] = useState("1");
  const [addCount, setAddCount] = useState("10");
  const [addCustomNumbers, setAddCustomNumbers] = useState("");
  const [addSizeSqm, setAddSizeSqm] = useState("300");
  const [addPrice, setAddPrice] = useState("");
  const [addPhase, setAddPhase] = useState("Phase 1");

  const counts: Record<string, number> = {};
  for (const s of stands) {
    counts[s.status] = (counts[s.status] ?? 0) + 1;
  }

  async function refreshStands() {
    const res = await fetch(`/api/sysadmin/developments/${slug}`, { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setStands(d.stands ?? []);
    }
  }

  function startEdit(s: StandRow) {
    setEditingId(s.id);
    setEditData({
      standNumber: s.standNumber,
      phase: s.phase,
      sizeSqm: String(s.sizeSqm),
      price: s.price,
      status: s.status,
      notes: s.notes,
    });
    setRowError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setRowError("");
  }

  async function handleSave(id: string) {
    setBusy(true);
    setRowError("");
    const fd = new FormData();
    fd.set("standNumber", editData.standNumber);
    fd.set("phase", editData.phase);
    fd.set("sizeSqm", editData.sizeSqm);
    fd.set("price", editData.price);
    fd.set("status", editData.status);
    fd.set("notes", editData.notes);
    const result = await updateStandAction(id, fd);
    setBusy(false);
    if (result.ok) {
      setStands((prev) => prev.map((s) =>
        s.id === id
          ? { ...s, standNumber: editData.standNumber, phase: editData.phase, sizeSqm: parseInt(editData.sizeSqm), price: editData.price, status: editData.status, notes: editData.notes }
          : s
      ));
      setEditingId(null);
    } else {
      setRowError(result.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this stand? This cannot be undone.")) return;
    setBusy(true);
    const result = await deleteStandAction(id);
    setBusy(false);
    if (result.ok) {
      setStands((prev) => prev.filter((s) => s.id !== id));
    } else {
      setRowError(result.error);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === stands.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(stands.map((s) => s.id)));
    }
  }

  async function handleBulkStatus() {
    if (!selectedIds.size) return;
    setBusy(true);
    setBulkMsg("");
    const result = await bulkUpdateStandStatusAction([...selectedIds], bulkStatus);
    setBusy(false);
    if (result.ok) {
      const st = bulkStatus;
      setStands((prev) => prev.map((s) => selectedIds.has(s.id) ? { ...s, status: st } : s));
      setSelectedIds(new Set());
      setBulkMsg(`${result.count} stand${result.count === 1 ? "" : "s"} updated to ${st}.`);
    } else {
      setBulkMsg(`Error: ${result.error}`);
    }
  }

  async function handleBulkDelete() {
    if (!selectedIds.size) return;
    if (!confirm(`Delete ${selectedIds.size} selected stand${selectedIds.size === 1 ? "" : "s"}? SOLD and RESERVED stands will be skipped.`)) return;
    setBusy(true);
    setBulkMsg("");
    const result = await bulkDeleteStandsAction([...selectedIds]);
    setBusy(false);
    if (result.ok) {
      setStands((prev) => prev.filter((s) => !selectedIds.has(s.id) || s.status === "SOLD" || s.status === "RESERVED"));
      setSelectedIds(new Set());
      const msg = result.skipped > 0 ? `${result.count} deleted, ${result.skipped} skipped (SOLD/RESERVED).` : `${result.count} stand${result.count === 1 ? "" : "s"} deleted.`;
      setBulkMsg(msg);
    } else {
      setBulkMsg(`Error: ${result.error}`);
    }
  }

  async function handleAdd() {
    setBusy(true);
    setAddError("");
    setAddSuccess(false);
    const fd = new FormData();
    fd.set("developmentId", devId);
    fd.set("mode", addMode);
    fd.set("sizeSqm", addSizeSqm);
    fd.set("price", addPrice);
    fd.set("phase", addPhase);
    if (addMode === "auto") {
      fd.set("prefix", addPrefix);
      fd.set("startNum", addStartNum);
      fd.set("count", addCount);
    } else {
      fd.set("customNumbers", addCustomNumbers);
    }
    const result = await createStandsAction(fd);
    setBusy(false);
    if (result.ok) {
      setAddSuccess(true);
      setAdding(false);
      await refreshStands();
    } else {
      setAddError(result.error ?? "Failed to create stands.");
    }
  }

  return (
    <div className="premium-panel space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Stands ({stands.length})</h2>
        {addSuccess && (
          <span className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="size-4" /> Stands created
          </span>
        )}
      </div>

      {/* Status chips */}
      {stands.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((st) =>
            counts[st] ? (
              <span key={st} className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(st)}`}>
                {st} <span className="opacity-70">{counts[st]}</span>
              </span>
            ) : null
          )}
        </div>
      )}

      {rowError && (
        <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 p-2.5 text-sm text-red-800">
          <AlertCircle className="size-4 shrink-0" /> {rowError}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-sm font-semibold">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="h-8 rounded border px-2 text-xs"
            >
              {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
            </select>
            <button
              type="button"
              onClick={handleBulkStatus}
              disabled={busy}
              className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              Set Status
            </button>
          </div>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={busy}
            className="rounded border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Delete Selected
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Deselect all
          </button>
        </div>
      )}

      {bulkMsg && (
        <div className={`flex items-center gap-2 rounded border p-2.5 text-sm ${bulkMsg.startsWith("Error") ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {bulkMsg.startsWith("Error") ? <AlertCircle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
          {bulkMsg}
        </div>
      )}

      {stands.length > 0 ? (
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="w-8 px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={stands.length > 0 && selectedIds.size === stands.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-3 py-2.5">Stand #</th>
                <th className="px-3 py-2.5">Phase</th>
                <th className="px-3 py-2.5">Size (sqm)</th>
                <th className="px-3 py-2.5">Price (USD)</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Notes</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stands.map((s) =>
                editingId === s.id ? (
                  <tr key={s.id} className="bg-primary/5">
                    <td className="px-3 py-2" />
                    <td className="px-2 py-2">
                      <input
                        value={editData.standNumber}
                        onChange={(e) => setEditData((d) => ({ ...d, standNumber: e.target.value }))}
                        className="w-24"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={editData.phase}
                        onChange={(e) => setEditData((d) => ({ ...d, phase: e.target.value }))}
                        className="w-24"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={editData.sizeSqm}
                        onChange={(e) => setEditData((d) => ({ ...d, sizeSqm: e.target.value }))}
                        className="w-20"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={editData.price}
                        onChange={(e) => setEditData((d) => ({ ...d, price: e.target.value }))}
                        className="w-24"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData((d) => ({ ...d, status: e.target.value }))}
                        className="w-32"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={editData.notes}
                        onChange={(e) => setEditData((d) => ({ ...d, notes: e.target.value }))}
                        className="w-32"
                        placeholder="Notes"
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleSave(s.id)}
                          disabled={busy}
                          className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={busy}
                          className="rounded border px-3 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={s.id} className={`hover:bg-muted/30 ${selectedIds.has(s.id) ? "bg-primary/5" : ""}`}>
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                      />
                    </td>
                    <td className="px-3 py-2.5 font-semibold">{s.standNumber}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.phase}</td>
                    <td className="px-3 py-2.5">{s.sizeSqm}</td>
                    <td className="px-3 py-2.5">${Number(s.price).toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.notes}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(s)}
                          className="inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-semibold hover:bg-muted"
                        >
                          <Pencil className="size-3" /> Edit
                        </button>
                        {s.status !== "SOLD" && s.status !== "RESERVED" && (
                          <button
                            type="button"
                            onClick={() => handleDelete(s.id)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="size-3" /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No stands yet. Add some below.</p>
      )}

      {/* Add Stands panel */}
      <div className="border-t pt-4">
        <button
          type="button"
          onClick={() => { setAdding((v) => !v); setAddError(""); setAddSuccess(false); }}
          className="inline-flex items-center gap-2 rounded border px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          {adding ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          {adding ? "Hide" : "Add Stands"}
        </button>

        {adding && (
          <div className="mt-4 space-y-4 rounded-lg border bg-muted/20 p-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAddMode("auto")}
                className={`rounded border px-3 py-1.5 text-sm font-semibold transition ${addMode === "auto" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                Auto-generate
              </button>
              <button
                type="button"
                onClick={() => setAddMode("custom")}
                className={`rounded border px-3 py-1.5 text-sm font-semibold transition ${addMode === "custom" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                Custom numbers
              </button>
            </div>

            {addMode === "auto" ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="form-label">
                  Prefix *
                  <input value={addPrefix} onChange={(e) => setAddPrefix(e.target.value)} placeholder="e.g. STD" />
                </label>
                <label className="form-label">
                  Start number
                  <input type="number" value={addStartNum} onChange={(e) => setAddStartNum(e.target.value)} />
                </label>
                <label className="form-label">
                  Count *
                  <input type="number" value={addCount} onChange={(e) => setAddCount(e.target.value)} />
                </label>
              </div>
            ) : (
              <label className="form-label">
                Stand numbers (one per line) *
                <textarea
                  value={addCustomNumbers}
                  onChange={(e) => setAddCustomNumbers(e.target.value)}
                  rows={4}
                  placeholder={"STD-001\nSTD-002\nSTD-003"}
                />
              </label>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="form-label">
                Size (sqm) *
                <input type="number" value={addSizeSqm} onChange={(e) => setAddSizeSqm(e.target.value)} />
              </label>
              <label className="form-label">
                Price (USD) *
                <input type="number" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} placeholder="e.g. 5000" />
              </label>
              <label className="form-label">
                Phase
                <input value={addPhase} onChange={(e) => setAddPhase(e.target.value)} placeholder="Phase 1" />
              </label>
            </div>

            {addError && (
              <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 p-2.5 text-sm text-red-800">
                <AlertCircle className="size-4 shrink-0" /> {addError}
              </div>
            )}

            <button
              type="button"
              onClick={handleAdd}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Plus className="size-4" />
              {busy ? "Creating…" : "Create Stands"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GeoJsonUploadSection({ devId }: { devId: string; slug: string }) {
  const [geoJsonRaw, setGeoJsonRaw] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus("idle");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      // Basic validation - try to parse as JSON
      try {
        JSON.parse(text);
        setGeoJsonRaw(text);
      } catch {
        setUploadStatus("error");
        setGeoJsonRaw("");
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!geoJsonRaw) return;
    setUploadStatus("uploading");
    try {
      const result = await updateDevelopmentGeoJsonAction(devId, geoJsonRaw);
      if (result.ok) {
        setUploadStatus("success");
      } else {
        setUploadStatus("error");
      }
    } catch {
      setUploadStatus("error");
    }
  };

  return (
    <div className="premium-panel space-y-5 p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <MapIcon className="size-5 text-primary" />
        Stand Map (GeoJSON)
      </h2>
      <p className="text-sm text-muted-foreground">
        Upload a GeoJSON file to display interactive stand boundaries on the public site, agent portal, and client dashboard.
      </p>
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".geojson,.json"
          onChange={handleFile}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
        />
      </div>
      {geoJsonRaw && (
        <>
          <textarea
            value={geoJsonRaw}
            onChange={(e) => setGeoJsonRaw(e.target.value)}
            rows={8}
            className="w-full rounded border bg-muted/30 p-3 font-mono text-xs"
            placeholder="Paste GeoJSON content here…"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={uploadStatus === "uploading"}
              className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Upload className="size-4" />
              {uploadStatus === "uploading" ? "Saving…" : "Save Map Data"}
            </button>
            {uploadStatus === "success" && (
              <span className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="size-4" /> Map saved
              </span>
            )}
            {uploadStatus === "error" && (
              <span className="flex items-center gap-1 text-sm font-semibold text-red-700">
                <AlertCircle className="size-4" /> Failed to save. Check JSON is valid.
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BrochureUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setErrorMsg("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload/document", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { setErrorMsg(json.error ?? "Upload failed."); setStatus("error"); return; }
      onChange(json.url);
      setStatus("idle");
    } catch {
      setErrorMsg("Upload failed. Try again."); setStatus("error");
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <FileText className="size-5 shrink-0 text-primary" />
          <a href={value} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-sm font-semibold text-primary hover:underline">
            View brochure <ExternalLink className="ml-1 inline size-3" />
          </a>
          <button type="button" onClick={() => onChange("")} className="text-muted-foreground hover:text-red-500">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 px-6 py-8 text-center text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-muted/30"
        >
          <FileText className="size-8 text-muted-foreground/50" />
          <span>{status === "uploading" ? "Uploading…" : "Click to upload PDF brochure"}</span>
          <span className="text-xs">PDF only · max 20 MB</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleFile} />
      {status === "error" && (
        <p className="flex items-center gap-1 text-sm text-red-600"><AlertCircle className="size-4" /> {errorMsg}</p>
      )}
    </div>
  );
}

async function fetchDev(slug: string): Promise<DevData | null> {
  const res = await fetch(`/api/sysadmin/developments/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default function EditDevelopmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [dev, setDev] = useState<DevData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load on first render
  if (!loaded) {
    setLoaded(true);
    fetchDev(slug).then((d) => {
      if (d) setDev(d);
      else setError("Development not found.");
    });
  }

  const set = (field: keyof DevData, value: string | string[] | number) =>
    setDev((prev) => prev ? { ...prev, [field]: value } : prev);

  const toggleAmenity = (a: string) => {
    if (!dev) return;
    const next = dev.amenities.includes(a)
      ? dev.amenities.filter((x) => x !== a)
      : [...dev.amenities, a];
    set("amenities", next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dev) return;
    setError("");
    setSaved(false);
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement);
      fd.set("amenities", dev.amenities.join(","));
      fd.set("heroImage", dev.heroImage);
      fd.set("gallery", JSON.stringify((dev.gallery ?? []).filter(Boolean)));
      fd.set("brochureUrl", dev.brochureUrl ?? "");
      const result = await updateDevelopmentAction(dev.id, fd);
      if (result?.ok) {
        setSaved(true);
      } else {
        setError(result?.error ?? "An unexpected error occurred. Please try again.");
      }
    });
  };

  if (!dev && !error) {
    return <div className="dashboard-page animate-pulse text-muted-foreground">Loading…</div>;
  }

  if (error && !dev) {
    return <div className="dashboard-page text-red-600">{error}</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">System Admin: Developments</p>
          <h1 className="mt-1 text-3xl font-semibold">Edit Development</h1>
          <p className="mt-1 text-muted-foreground">{dev!.name}</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/sysadmin/developments")}
          className="rounded border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="size-4 shrink-0" /> Development updated successfully.
          </div>
        )}

        <div className="premium-panel space-y-5 p-6">
          <h2 className="font-semibold">Basic Information</h2>
          <label className="form-label">
            Development Name *
            <input name="name" required value={dev!.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="form-label">
              Province *
              <select name="province" value={dev!.province} onChange={(e) => set("province", e.target.value)}>
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <label className="form-label">
              Area / Location *
              <input name="location" required value={dev!.location} onChange={(e) => set("location", e.target.value)} />
            </label>
          </div>
          <label className="form-label">
            Description *
            <textarea name="description" required value={dev!.description} onChange={(e) => set("description", e.target.value)} />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="form-label">
              Developer Name *
              <input name="developerName" required value={dev!.developerName} onChange={(e) => set("developerName", e.target.value)} />
            </label>
            <label className="form-label">
              Developer Contact *
              <input name="developerContact" required value={dev!.developerContact} onChange={(e) => set("developerContact", e.target.value)} />
            </label>
          </div>
          <div className="form-label">
            Hero Image
            <div className="mt-1">
              <ImageUpload value={dev!.heroImage} onChange={(url) => set("heroImage", url)} />
            </div>
          </div>
          <div className="form-label">
            Development Brochure (PDF)
            <div className="mt-1">
              <BrochureUpload value={dev!.brochureUrl ?? ""} onChange={(url) => set("brochureUrl", url)} />
            </div>
          </div>
        </div>

        <div className="premium-panel space-y-5 p-6">
          <h2 className="font-semibold">Commercial Terms</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="form-label">
              Starting Price (USD) *
              <input type="number" name="startingPrice" required value={dev!.startingPrice} onChange={(e) => set("startingPrice", e.target.value)} />
            </label>
            <label className="form-label">
              Price per sqm (USD) *
              <input type="number" name="pricePerSqm" required value={dev!.pricePerSqm} onChange={(e) => set("pricePerSqm", e.target.value)} />
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <label className="form-label">
              Deposit Amount (USD) *
              <input type="number" name="depositAmount" required value={dev!.depositAmount} onChange={(e) => set("depositAmount", e.target.value)} />
            </label>
            <label className="form-label">
              Interest Rate (%)
              <input type="number" step="0.01" name="interestRate" value={dev!.interestRate} onChange={(e) => set("interestRate", e.target.value)} />
            </label>
            <label className="form-label">
              Payment Duration (months) *
              <input type="number" name="paymentDurationMonths" required value={dev!.paymentDurationMonths} onChange={(e) => set("paymentDurationMonths", parseInt(e.target.value))} />
            </label>
          </div>
          <label className="form-label">
            Payment Terms *
            <textarea name="paymentTerms" required value={dev!.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} />
          </label>
          <label className="form-label">
            Terms & Conditions *
            <textarea name="termsAndConditions" required value={dev!.termsAndConditions} onChange={(e) => set("termsAndConditions", e.target.value)} />
          </label>
        </div>

        <div className="premium-panel space-y-5 p-6">
          <h2 className="font-semibold">Infrastructure & Amenities</h2>
          <label className="form-label">
            Infrastructure Status *
            <select name="infrastructureStatus" value={dev!.infrastructureStatus} onChange={(e) => set("infrastructureStatus", e.target.value)}>
              <option>Services in progress</option>
              <option>Fully serviced</option>
              <option>Planning phase</option>
              <option>Phase 1 complete</option>
              <option>Phase 2 complete</option>
            </select>
          </label>
          <div>
            <p className="mb-3 text-sm font-semibold">Amenities</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AMENITY_OPTIONS.map((a) => (
                <label key={a} className="flex cursor-pointer items-center gap-2 rounded border p-2.5 hover:bg-muted has-[:checked]:bg-primary/5 has-[:checked]:border-primary">
                  <input
                    type="checkbox"
                    checked={dev!.amenities.includes(a)}
                    onChange={() => toggleAmenity(a)}
                    className="size-4"
                  />
                  <span className="text-sm">{a}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── Gallery Images ───────────────────────────────────────────── */}
        <div className="premium-panel space-y-5 p-6">
          <h2 className="font-semibold">Gallery Images</h2>
          <p className="text-sm text-muted-foreground">
            These images appear in the development gallery on the public listing page.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(dev!.gallery ?? []).map((url, i) => (
              <div key={i} className="space-y-1.5">
                <ImageUpload
                  value={url}
                  onChange={(next) => {
                    const g = [...(dev!.gallery ?? [])];
                    if (next) { g[i] = next; } else { g.splice(i, 1); }
                    set("gallery", g);
                  }}
                  aspectRatio="4/3"
                />
                <button
                  type="button"
                  onClick={() => {
                    const g = [...(dev!.gallery ?? [])];
                    g.splice(i, 1);
                    set("gallery", g);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline"
                >
                  <Trash2 className="size-3" /> Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set("gallery", [...(dev!.gallery ?? []), ""])}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-muted/50"
            >
              <Plus className="size-6" />
              Add image
            </button>
          </div>
        </div>

        {/* ── Stands ───────────────────────────────────────────────────── */}
        <StandsSection devId={dev!.id} initialStands={dev!.stands ?? []} slug={slug} />

        {/* ── GeoJSON Map Upload ───────────────────────────────────────── */}
        <GeoJsonUploadSection devId={dev!.id} slug={slug} />

        <div className="flex justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.push("/sysadmin/developments")}
            className="rounded border bg-background px-6 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>

      <div className="mx-auto mt-6 max-w-3xl">
        <BulkReprice
          developmentId={dev!.id}
          currentPricePerSqm={dev!.pricePerSqm}
          currentDepositAmount={dev!.depositAmount}
          availableCount={dev!.stands.filter((s) => s.status === "AVAILABLE").length}
        />
      </div>
    </div>
  );
}
