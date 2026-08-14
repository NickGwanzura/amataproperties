"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { AlertTriangle, CheckCircle2, FileDown, Upload, X } from "lucide-react";
import { bulkImportGroupMembersAction, listGroupMembersForWizardAction } from "@/lib/actions";
import { isExcelFile } from "@/lib/spreadsheet-utils";
import { parseXlsxFile } from "@/lib/xlsx-client";

type RawRow = { name: string; nationalId: string; phone: string; email: string; address?: string };
export type StagedMember = { id: string; name: string; email: string; imported: boolean };

function validateRows(rows: RawRow[]) {
  const seen = new Map<string, number>();
  rows.forEach((r) => {
    const key = r.email?.trim().toLowerCase();
    if (key) seen.set(key, (seen.get(key) ?? 0) + 1);
  });
  return rows.map((r) => {
    const errors: string[] = [];
    if (!r.name?.trim()) errors.push("Missing name");
    if (!r.nationalId?.trim()) errors.push("Missing national ID");
    if (!r.phone?.trim()) errors.push("Missing phone");
    const email = r.email?.trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push("Invalid email");
    else if ((seen.get(email) ?? 0) > 1) errors.push("Duplicate in batch");
    return { ...r, _errors: errors };
  });
}

export function StepMembers({
  groupId,
  members,
  onMembersChange,
}: {
  groupId: string;
  members: StagedMember[];
  onMembersChange: (members: StagedMember[]) => void;
}) {
  const [rows, setRows] = useState<RawRow[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvError, setCsvError] = useState("");
  const [importResults, setImportResults] = useState<{ email: string; ok: boolean; message: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validated = validateRows(rows);
  const errorCount = validated.filter((r) => r._errors.length > 0).length;

  const toRawRows = (data: Record<string, string>[]): RawRow[] =>
    data.map((row) => ({
      name: row.name || row.fullname || "",
      nationalId: row.nationalid || row.idnumber || "",
      phone: row.phone || row.phonenumber || "",
      email: row.email || "",
      address: row.address || "",
    }));

  const handleFile = async (file: File) => {
    setCsvError("");
    setCsvFileName(file.name);

    if (isExcelFile(file)) {
      try {
        const data = await parseXlsxFile(file);
        setRows(toRawRows(data));
      } catch (err) {
        setCsvError(err instanceof Error ? err.message : "Could not read that Excel file.");
      }
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/[\s_]+/g, ""),
      complete: (results) => {
        if (results.errors.length > 0) {
          setCsvError(results.errors[0].message);
          return;
        }
        setRows(toRawRows(results.data));
      },
      error: (err) => setCsvError(err.message),
    });
  };

  const updateCell = (index: number, field: keyof RawRow, value: string) => {
    const next = rows.slice();
    next[index] = { ...next[index], [field]: value };
    setRows(next);
  };

  const removeRow = (index: number) => setRows(rows.filter((_, i) => i !== index));

  const commitImport = async () => {
    setImporting(true);
    const fd = new FormData();
    fd.append("rows", JSON.stringify(rows));
    const result = await bulkImportGroupMembersAction(groupId, fd);
    if (result.ok) {
      setImportResults(result.results.map((r) => ({ email: r.email, ok: r.ok, message: r.message })));
      const canonical = await listGroupMembersForWizardAction(groupId);
      onMembersChange(canonical.map((c) => ({ id: c.id, name: c.name, email: c.email, imported: true })));
      setRows([]);
      setCsvFileName("");
    } else {
      setCsvError(result.error);
    }
    setImporting(false);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Bulk Member Import</h2>
      <p className="text-sm text-muted-foreground">
        Import the group&apos;s members from a CSV or Excel file. Columns: name, nationalId, phone, email, address.
      </p>

      {members.length > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <CheckCircle2 className="mr-1 inline size-4" /> {members.length} member{members.length === 1 ? "" : "s"} imported so far.
        </div>
      )}

      {rows.length === 0 && (
        <div className="space-y-3">
          <div className="rounded-lg border border-dashed p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Upload className="mx-auto mb-2 size-6 text-muted-foreground" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="font-semibold text-primary hover:underline">
              Choose a CSV or Excel file
            </button>
            <p className="mt-1 text-xs text-muted-foreground">Columns: name, nationalId, phone, email, address</p>
          </div>
          <a
            href="/api/templates/group-members"
            download
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <FileDown className="size-4" /> Download Excel template
          </a>
          {csvError && <p className="text-sm text-red-600">{csvError}</p>}
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {rows.length} row{rows.length === 1 ? "" : "s"} staged {csvFileName && `(${csvFileName})`}
              {errorCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-700">
                  <AlertTriangle className="size-3.5" /> {errorCount} need correction
                </span>
              )}
            </p>
            <button type="button" onClick={() => { setRows([]); setCsvFileName(""); }} className="text-sm text-red-600 hover:underline">
              Clear
            </button>
          </div>

          <div className="max-h-80 overflow-auto rounded border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted text-left">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">National ID</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Email</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {validated.map((row, i) => (
                  <tr key={i} className={row._errors.length > 0 ? "bg-red-50" : ""}>
                    <td className="p-1.5"><input className="w-full rounded border px-2 py-1" value={row.name} onChange={(e) => updateCell(i, "name", e.target.value)} /></td>
                    <td className="p-1.5"><input className="w-28 rounded border px-2 py-1" value={row.nationalId} onChange={(e) => updateCell(i, "nationalId", e.target.value)} /></td>
                    <td className="p-1.5"><input className="w-28 rounded border px-2 py-1" value={row.phone} onChange={(e) => updateCell(i, "phone", e.target.value)} /></td>
                    <td className="p-1.5"><input className="w-40 rounded border px-2 py-1" value={row.email} onChange={(e) => updateCell(i, "email", e.target.value)} /></td>
                    <td className="p-1.5">
                      {row._errors.length > 0 ? <span className="text-xs text-red-700">{row._errors.join(", ")}</span> : <CheckCircle2 className="size-4 text-emerald-600" />}
                    </td>
                    <td className="p-1.5">
                      <button type="button" onClick={() => removeRow(i)} className="text-muted-foreground hover:text-red-600"><X className="size-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={commitImport}
            disabled={importing || errorCount > 0}
            className="h-10 rounded bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {importing ? "Importing…" : `Import ${rows.length} Members`}
          </button>
          {errorCount > 0 && <p className="text-xs text-amber-700">Fix the highlighted rows before importing.</p>}
        </div>
      )}

      {importResults.length > 0 && (
        <div className="rounded-lg border p-3 text-sm">
          <p className="font-semibold">Last import: {importResults.filter((r) => r.ok).length} succeeded, {importResults.filter((r) => !r.ok).length} failed</p>
          {importResults.filter((r) => !r.ok).map((r, i) => (
            <p key={i} className="mt-1 text-xs text-red-700">{r.email}: {r.message}</p>
          ))}
        </div>
      )}
    </div>
  );
}
