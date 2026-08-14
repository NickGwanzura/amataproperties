import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getCollectedInstallmentRevenue,
  getExpectedInstallmentRevenue,
} from "@/lib/db/queries/revenue";
import { getAllDevelopmentsWithStandCounts } from "@/lib/db/queries/developments";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { toCsv } from "@/lib/csv";

const ALLOWED_ROLES = ["ACCOUNTS", "ADMINISTRATOR", "CEO", "SYSTEM_ADMIN"] as const;

export async function GET() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [collected, expected, developments] = await Promise.all([
    getCollectedInstallmentRevenue(),
    getExpectedInstallmentRevenue(),
    getAllDevelopmentsWithStandCounts(),
  ]);

  // ── Build month columns (sorted, deduped) ──────────────────────────────────
  const monthSet = new Set<string>();
  for (const r of collected) monthSet.add(r.monthKey);
  for (const r of expected) monthSet.add(r.monthKey);
  const months = Array.from(monthSet).sort((a, b) => {
    const da = new Date(a + " 01").getTime();
    const db = new Date(b + " 01").getTime();
    return da - db;
  });

  // ── Build lookup maps ──────────────────────────────────────────────────────
  const collectedMap = new Map<string, number>();
  for (const r of collected) {
    collectedMap.set(`${r.developmentId}::${r.monthKey}`, r.collected);
  }

  // ── CSV header ────────────────────────────────────────────────────────────
  const header = ["Development", ...months, "Total"];

  // ── CSV rows ──────────────────────────────────────────────────────────────
  const rows: string[][] = [];
  let grandTotal = 0;

  for (const dev of developments) {
    const monthly = months.map((m) => collectedMap.get(`${dev.id}::${m}`) ?? 0);
    const rowTotal = monthly.reduce((s, v) => s + v, 0);
    grandTotal += rowTotal;

    if (rowTotal === 0) continue; // skip developments with no activity

    const csvRow = [
      dev.name,
      ...monthly.map((v) => (v > 0 ? v.toFixed(2) : "")),
      rowTotal.toFixed(2),
    ];
    rows.push(csvRow);
  }

  // ── Grand total row ───────────────────────────────────────────────────────
  const colTotals = months.map((_, mi) =>
    rows.reduce((s, row) => s + parseFloat(row[mi + 1] || "0"), 0),
  );
  rows.push(["TOTAL", ...colTotals.map((v) => v.toFixed(2)), grandTotal.toFixed(2)]);

  const csvContent = toCsv([header, ...rows]);

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="installment-revenue-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
