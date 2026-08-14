import * as XLSX from "xlsx";

/**
 * Builds a single-sheet .xlsx workbook buffer from the same header+rows shape
 * every CSV report route already produces — the two formats are siblings,
 * not separate report implementations.
 */
export function toXlsxBuffer(
  header: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
  sheetName = "Sheet1",
): Buffer {
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows.map((r) => r.map((v) => v ?? ""))]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
