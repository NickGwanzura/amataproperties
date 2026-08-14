"use client";

/**
 * Parses an uploaded .xlsx/.xls file's first sheet into header-normalized row
 * objects — same shape papaparse produces for CSV, so both step components
 * can feed either format into one validation/preview pipeline.
 *
 * The `xlsx` (SheetJS) library is dynamically imported here rather than at
 * module scope, so CSV-only users never pay for it in their initial bundle.
 */
export async function parseXlsxFile(file: File): Promise<Record<string, string>[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: "" });

  return raw.map((row) => {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = key.trim().toLowerCase().replace(/[\s_]+/g, "");
      normalized[normalizedKey] = String(value ?? "").trim();
    }
    return normalized;
  });
}
