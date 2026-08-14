import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getInstallmentAgingByDevelopment,
  getOverdueInstallmentsDetail,
} from "@/lib/db/queries/revenue";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { escapeCsvCell } from "@/lib/csv";

const ALLOWED_ROLES = ["ACCOUNTS", "ADMINISTRATOR", "CEO", "SYSTEM_ADMIN"] as const;

export async function GET() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [aging, detail] = await Promise.all([
    getInstallmentAgingByDevelopment(),
    getOverdueInstallmentsDetail(),
  ]);

  const lines: string[] = [];

  // ── Sheet 1: Aging Summary by Development ──────────────────────────────────
  lines.push("Installment Aging Report");
  lines.push(`Generated,${new Date().toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push("Aging Summary by Development");
  lines.push(["Development", "0-30 Days", "31-60 Days", "61-90 Days", "90+ Days", "Total Overdue", "Count"].join(","));

  for (const row of aging) {
    lines.push(
      [
        escapeCsvCell(row.developmentName),
        row.bucket0_30.toFixed(2),
        row.bucket31_60.toFixed(2),
        row.bucket61_90.toFixed(2),
        row.bucket90plus.toFixed(2),
        row.totalOverdue.toFixed(2),
        String(row.overdueCount),
      ].join(","),
    );
  }

  // Grand total
  lines.push(
    [
      "TOTAL",
      aging.reduce((s, r) => s + r.bucket0_30, 0).toFixed(2),
      aging.reduce((s, r) => s + r.bucket31_60, 0).toFixed(2),
      aging.reduce((s, r) => s + r.bucket61_90, 0).toFixed(2),
      aging.reduce((s, r) => s + r.bucket90plus, 0).toFixed(2),
      aging.reduce((s, r) => s + r.totalOverdue, 0).toFixed(2),
      String(aging.reduce((s, r) => s + r.overdueCount, 0)),
    ].join(","),
  );

  // ── Sheet 2: Overdue Installments Detail ───────────────────────────────────
  lines.push("");
  lines.push("Overdue Installments Detail");
  lines.push(
    ["Client Name", "Client Phone", "Development", "Stand", "Amount Due", "Due Date", "Days Overdue"].join(","),
  );

  for (const row of detail) {
    lines.push(
      [
        escapeCsvCell(row.clientName),
        escapeCsvCell(row.clientPhone),
        escapeCsvCell(row.developmentName),
        escapeCsvCell(row.standNumber),
        row.amountDue.toFixed(2),
        row.dueDate.toISOString().slice(0, 10),
        String(row.daysOverdue),
      ].join(","),
    );
  }

  const csvContent = lines.join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="installment-aging-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
