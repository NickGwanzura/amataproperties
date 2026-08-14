import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getCollectedInstallmentRevenue,
  getExpectedInstallmentRevenue,
} from "@/lib/db/queries/revenue";
import { getAllDevelopmentsWithStandCounts } from "@/lib/db/queries/developments";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { toXlsxBuffer, XLSX_CONTENT_TYPE } from "@/lib/xlsx";

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

  const monthSet = new Set<string>();
  for (const r of collected) monthSet.add(r.monthKey);
  for (const r of expected) monthSet.add(r.monthKey);
  const months = Array.from(monthSet).sort((a, b) => {
    const da = new Date(a + " 01").getTime();
    const db = new Date(b + " 01").getTime();
    return da - db;
  });

  const collectedMap = new Map<string, number>();
  for (const r of collected) {
    collectedMap.set(`${r.developmentId}::${r.monthKey}`, r.collected);
  }

  const header = ["Development", ...months, "Total"];
  const rows: (string | number)[][] = [];
  let grandTotal = 0;

  for (const dev of developments) {
    const monthly = months.map((m) => collectedMap.get(`${dev.id}::${m}`) ?? 0);
    const rowTotal = monthly.reduce((s, v) => s + v, 0);
    grandTotal += rowTotal;

    if (rowTotal === 0) continue;

    rows.push([dev.name, ...monthly.map((v) => (v > 0 ? v.toFixed(2) : "")), rowTotal.toFixed(2)]);
  }

  const colTotals = months.map((_, mi) =>
    rows.reduce((s, row) => s + parseFloat(String(row[mi + 1] || "0")), 0),
  );
  rows.push(["TOTAL", ...colTotals.map((v) => v.toFixed(2)), grandTotal.toFixed(2)]);

  const buffer = toXlsxBuffer(header, rows, "Installment Revenue");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="installment-revenue-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
