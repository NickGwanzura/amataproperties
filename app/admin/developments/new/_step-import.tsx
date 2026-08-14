"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { AlertTriangle, CheckCircle2, FileDown, Upload, X } from "lucide-react";
import { isExcelFile } from "@/lib/spreadsheet-utils";
import { parseXlsxFile } from "@/lib/xlsx-client";

export type ImportRow = {
  standNumber: string;
  sizeSqm: string;
  price: string;
  section?: string;
  phase?: string;
  block?: string;
  road?: string;
  notes?: string;
};

type ValidatedRow = ImportRow & { _errors: string[] };

function validateRows(rows: ImportRow[]): ValidatedRow[] {
  const seen = new Map<string, number>();
  rows.forEach((r) => {
    const key = r.standNumber?.trim();
    if (key) seen.set(key, (seen.get(key) ?? 0) + 1);
  });

  return rows.map((r) => {
    const errors: string[] = [];
    const num = r.standNumber?.trim();
    if (!num) errors.push("Missing stand number");
    else if ((seen.get(num) ?? 0) > 1) errors.push("Duplicate in this batch");
    const size = parseInt(r.sizeSqm, 10);
    if (!size || size <= 0) errors.push("Invalid size (m²)");
    const price = parseFloat(r.price);
    if (!price || price <= 0) errors.push("Invalid price");
    return { ...r, _errors: errors };
  });
}

export function StepImport({
  defaultPrefix,
  defaultSizeSqm,
  defaultPrice,
  defaultPhase,
  rows,
  onRowsChange,
  atomic,
  onAtomicChange,
}: {
  defaultPrefix: string;
  defaultSizeSqm: string;
  defaultPrice: string;
  defaultPhase: string;
  rows: ImportRow[];
  onRowsChange: (rows: ImportRow[]) => void;
  atomic: boolean;
  onAtomicChange: (v: boolean) => void;
}) {
  const [mode, setMode] = useState<"none" | "csv" | "sequential">(rows.length > 0 ? "csv" : "none");
  const [csvFileName, setCsvFileName] = useState("");
  const [csvError, setCsvError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [seqPrefix, setSeqPrefix] = useState(defaultPrefix || "STD");
  const [seqStart, setSeqStart] = useState("1");
  const [seqCount, setSeqCount] = useState("10");
  const [seqSize, setSeqSize] = useState(defaultSizeSqm || "300");
  const [seqPrice, setSeqPrice] = useState(defaultPrice || "");
  const [seqPhase, setSeqPhase] = useState(defaultPhase || "Phase 1");

  const validated = validateRows(rows);
  const errorCount = validated.filter((r) => r._errors.length > 0).length;

  const toImportRows = (data: Record<string, string>[]): ImportRow[] =>
    data.map((row) => ({
      standNumber: row.standnumber || row.stand || row.number || "",
      sizeSqm: row.sizesqm || row.size || row.sqm || "",
      price: row.price || "",
      section: row.section || "",
      phase: row.phase || "",
      block: row.block || "",
      road: row.road || row.street || "",
      notes: row.notes || "",
    }));

  const handleFile = async (file: File) => {
    setCsvError("");
    setCsvFileName(file.name);

    if (isExcelFile(file)) {
      try {
        const data = await parseXlsxFile(file);
        onRowsChange(toImportRows(data));
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
        onRowsChange(toImportRows(results.data));
      },
      error: (err) => setCsvError(err.message),
    });
  };

  const generateSequential = () => {
    const count = parseInt(seqCount, 10) || 0;
    const start = parseInt(seqStart, 10) || 1;
    const generated: ImportRow[] = Array.from({ length: count }).map((_, i) => ({
      standNumber: `${seqPrefix}-${String(start + i).padStart(3, "0")}`,
      sizeSqm: seqSize,
      price: seqPrice,
      phase: seqPhase,
    }));
    onRowsChange(generated);
  };

  const updateCell = (index: number, field: keyof ImportRow, value: string) => {
    const next = rows.slice();
    next[index] = { ...next[index], [field]: value };
    onRowsChange(next);
  };

  const removeRow = (index: number) => {
    onRowsChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Bulk Stand Import</h2>
      <p className="text-sm text-muted-foreground">
        Optional — you can skip this step and add stands later from the Stands page.
      </p>

      {mode === "none" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("csv")}
            className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center transition hover:border-primary hover:bg-primary/5"
          >
            <Upload className="size-6 text-primary" />
            <span className="font-semibold">Import from CSV or Excel</span>
            <span className="text-xs text-muted-foreground">Upload a spreadsheet of stands</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("sequential")}
            className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center transition hover:border-primary hover:bg-primary/5"
          >
            <CheckCircle2 className="size-6 text-primary" />
            <span className="font-semibold">Generate Sequentially</span>
            <span className="text-xs text-muted-foreground">Auto-number a batch of stands</span>
          </button>
        </div>
      )}

      {mode === "csv" && rows.length === 0 && (
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
            <p className="mt-1 text-xs text-muted-foreground">Columns: standNumber, sizeSqm, price, section, phase, block, road, notes</p>
          </div>
          <a
            href="/api/templates/stand-import"
            download
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <FileDown className="size-4" /> Download Excel template
          </a>
          {csvError && <p className="text-sm text-red-600">{csvError}</p>}
          <button type="button" onClick={() => setMode("none")} className="block text-sm text-muted-foreground hover:underline">
            ← Back
          </button>
        </div>
      )}

      {mode === "sequential" && rows.length === 0 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="form-label">
              Prefix
              <input className="mt-1" value={seqPrefix} onChange={(e) => setSeqPrefix(e.target.value)} />
            </label>
            <label className="form-label">
              Start Number
              <input type="number" className="mt-1" value={seqStart} onChange={(e) => setSeqStart(e.target.value)} />
            </label>
            <label className="form-label">
              Count
              <input type="number" className="mt-1" value={seqCount} onChange={(e) => setSeqCount(e.target.value)} />
            </label>
            <label className="form-label">
              Size (m²)
              <input type="number" className="mt-1" value={seqSize} onChange={(e) => setSeqSize(e.target.value)} />
            </label>
            <label className="form-label">
              Price
              <input type="number" step="0.01" className="mt-1" value={seqPrice} onChange={(e) => setSeqPrice(e.target.value)} />
            </label>
            <label className="form-label">
              Phase
              <input className="mt-1" value={seqPhase} onChange={(e) => setSeqPhase(e.target.value)} />
            </label>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={generateSequential} className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Generate {seqCount || 0} Stands
            </button>
            <button type="button" onClick={() => setMode("none")} className="text-sm text-muted-foreground hover:underline">
              ← Back
            </button>
          </div>
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
            <button
              type="button"
              onClick={() => {
                onRowsChange([]);
                setMode("none");
                setCsvFileName("");
              }}
              className="text-sm text-red-600 hover:underline"
            >
              Clear all
            </button>
          </div>

          <div className="max-h-80 overflow-auto rounded border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted text-left">
                <tr>
                  <th className="p-2">Stand #</th>
                  <th className="p-2">Size (m²)</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Phase</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {validated.map((row, i) => (
                  <tr key={i} className={row._errors.length > 0 ? "bg-red-50" : ""}>
                    <td className="p-1.5">
                      <input className="w-full rounded border px-2 py-1" value={row.standNumber} onChange={(e) => updateCell(i, "standNumber", e.target.value)} />
                    </td>
                    <td className="p-1.5">
                      <input className="w-24 rounded border px-2 py-1" value={row.sizeSqm} onChange={(e) => updateCell(i, "sizeSqm", e.target.value)} />
                    </td>
                    <td className="p-1.5">
                      <input className="w-28 rounded border px-2 py-1" value={row.price} onChange={(e) => updateCell(i, "price", e.target.value)} />
                    </td>
                    <td className="p-1.5">
                      <input className="w-24 rounded border px-2 py-1" value={row.phase ?? ""} onChange={(e) => updateCell(i, "phase", e.target.value)} />
                    </td>
                    <td className="p-1.5">
                      {row._errors.length > 0 ? (
                        <span className="text-xs text-red-700">{row._errors.join(", ")}</span>
                      ) : (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      )}
                    </td>
                    <td className="p-1.5">
                      <button type="button" onClick={() => removeRow(i)} className="text-muted-foreground hover:text-red-600">
                        <X className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" checked={atomic} onChange={(e) => onAtomicChange(e.target.checked)} />
            All-or-nothing (abort the entire import if any row fails)
          </label>
          {errorCount > 0 && (
            <p className="text-xs text-amber-700">Fix the highlighted rows before continuing — invalid rows will fail to import on publish.</p>
          )}
        </div>
      )}
    </div>
  );
}
