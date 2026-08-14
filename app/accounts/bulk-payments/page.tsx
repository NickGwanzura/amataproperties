"use client";

export const dynamic = "force-dynamic";

import { useRef, useState, useTransition } from "react";
import { Upload, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";
import { bulkInstallmentUploadAction } from "@/lib/actions";
import { money } from "@/lib/utils";

type ParsedRow = {
  saleNumber: string;
  amount: string;
  method: string;
  reference: string;
  date: string;
  notes: string;
  error?: string;
};

type ResultRow = { saleNumber: string; amount: string; reference: string; ok: boolean; message: string };

const METHOD_OPTIONS = ["CASH", "BANK_TRANSFER", "ECOCASH", "VELOCITY", "OTHER"];

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const rows: ParsedRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [saleNumber, amount, method, reference, date, ...rest] = cols;
    const notes = rest.join(",").trim();
    const error =
      !saleNumber ? "Missing saleNumber" :
      !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 ? "Invalid amount" :
      !METHOD_OPTIONS.includes((method ?? "").toUpperCase()) ? `Invalid method (use: ${METHOD_OPTIONS.join(", ")})` :
      !reference ? "Missing reference" :
      undefined;
    rows.push({ saleNumber, amount, method: (method ?? "").toUpperCase(), reference, date: date ?? "", notes, error });
  }
  return rows;
}

export default function BulkPaymentsPage() {
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRows(parseCSV(text));
      setResults(null);
    };
    reader.readAsText(file);
  }

  function handleSubmit() {
    if (!rows || rows.some((r) => r.error)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("rows", JSON.stringify(rows));
      const res = await bulkInstallmentUploadAction(fd);
      setResults(res);
    });
  }

  const validRows = rows?.filter((r) => !r.error) ?? [];
  const invalidRows = rows?.filter((r) => r.error) ?? [];

  return (
    <div className="dashboard-page">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accounts</p>
        <h1 className="mt-1 text-2xl font-semibold">Bulk Installment Upload</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV to record multiple installment payments at once.
        </p>
      </div>

      {/* CSV format guide */}
      <section className="premium-panel mb-6 p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">CSV Format</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              First row must be headers. Columns (in order):
            </p>
            <code className="mt-2 block rounded bg-muted px-3 py-2 text-xs">
              saleNumber,amount,method,reference,date,notes
            </code>
            <p className="mt-2 text-xs text-muted-foreground">
              method: CASH · BANK_TRANSFER · ECOCASH · VELOCITY · OTHER &nbsp;|&nbsp; date: YYYY-MM-DD (optional, defaults to today)
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Example: <code>SALE-2026-MYDY,222.22,CASH,INS-AUG-001,2026-08-07,August installment</code>
            </p>
          </div>
        </div>
      </section>

      {/* Upload */}
      <section className="premium-panel p-5">
        <label className="block">
          <div className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-6 py-10 text-center transition hover:bg-primary/10">
            <Upload className="size-8 text-primary/60" />
            <p className="font-semibold">Click to upload CSV</p>
            <p className="text-xs text-muted-foreground">or drag and drop</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="sr-only" />
        </label>
      </section>

      {/* Preview */}
      {rows && !results && (
        <section className="premium-panel mt-6">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">Preview — {rows.length} rows</h2>
              <p className="text-sm text-muted-foreground">
                {validRows.length} valid · {invalidRows.length} invalid
              </p>
            </div>
            {validRows.length > 0 && (
              <button
                onClick={handleSubmit}
                disabled={isPending || invalidRows.length > 0}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <CheckCircle2 className="size-4" />
                {isPending ? "Processing…" : `Process ${validRows.length} payments`}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Sale</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Method</th>
                  <th className="px-4 py-2">Reference</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-t ${r.error ? "bg-red-50 dark:bg-red-950/20" : ""}`}>
                    <td className="kpi-number px-4 py-2 font-semibold">{r.saleNumber}</td>
                    <td className="px-4 py-2">{r.amount ? money(parseFloat(r.amount)) : "—"}</td>
                    <td className="px-4 py-2">{r.method}</td>
                    <td className="px-4 py-2">{r.reference}</td>
                    <td className="px-4 py-2 text-muted-foreground">{r.date || "today"}</td>
                    <td className="px-4 py-2">
                      {r.error
                        ? <span className="flex items-center gap-1 text-xs text-red-600"><XCircle className="size-3.5" />{r.error}</span>
                        : <span className="flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="size-3.5" />OK</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invalidRows.length > 0 && (
            <div className="border-t px-5 py-3 text-sm text-red-600">
              <AlertCircle className="inline size-4 mr-1" />
              Fix the {invalidRows.length} invalid row{invalidRows.length !== 1 ? "s" : ""} before processing.
            </div>
          )}
        </section>
      )}

      {/* Results */}
      {results && (
        <section className="premium-panel mt-6">
          <div className="border-b px-5 py-4">
            <h2 className="text-lg font-semibold">Results</h2>
            <p className="text-sm text-muted-foreground">
              {results.filter((r) => r.ok).length} succeeded · {results.filter((r) => !r.ok).length} failed
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Sale</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Reference</th>
                  <th className="px-4 py-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="kpi-number px-4 py-2 font-semibold">{r.saleNumber}</td>
                    <td className="px-4 py-2">{money(parseFloat(r.amount))}</td>
                    <td className="px-4 py-2">{r.reference}</td>
                    <td className="px-4 py-2">
                      {r.ok
                        ? <span className="flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="size-3.5" />{r.message}</span>
                        : <span className="flex items-center gap-1 text-xs text-red-600"><XCircle className="size-3.5" />{r.message}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t px-5 py-3">
            <button onClick={() => { setRows(null); setResults(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="text-sm font-semibold text-primary hover:underline">
              Upload another file
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
