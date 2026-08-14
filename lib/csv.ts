const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const raw = value == null ? "" : String(value);
  const formulaSafe = FORMULA_PREFIX.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(formulaSafe) ? `"${formulaSafe.replace(/"/g, '""')}"` : formulaSafe;
}

export function toCsv(rows: Array<Array<string | number | boolean | null | undefined>>): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}
