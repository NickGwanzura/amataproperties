import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getInstallmentAgingByDevelopment,
  getOverdueInstallmentsDetail,
} from "@/lib/db/queries/revenue";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { XLSX_CONTENT_TYPE } from "@/lib/xlsx";
import * as XLSX from "xlsx";

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

  const agingHeader = ["Development", "0-30 Days", "31-60 Days", "61-90 Days", "90+ Days", "Total Overdue", "Count"];
  const agingRows = aging.map((row) => [
    row.developmentName,
    row.bucket0_30.toFixed(2),
    row.bucket31_60.toFixed(2),
    row.bucket61_90.toFixed(2),
    row.bucket90plus.toFixed(2),
    row.totalOverdue.toFixed(2),
    row.overdueCount,
  ]);
  agingRows.push([
    "TOTAL",
    aging.reduce((s, r) => s + r.bucket0_30, 0).toFixed(2),
    aging.reduce((s, r) => s + r.bucket31_60, 0).toFixed(2),
    aging.reduce((s, r) => s + r.bucket61_90, 0).toFixed(2),
    aging.reduce((s, r) => s + r.bucket90plus, 0).toFixed(2),
    aging.reduce((s, r) => s + r.totalOverdue, 0).toFixed(2),
    aging.reduce((s, r) => s + r.overdueCount, 0),
  ]);

  const detailHeader = ["Client Name", "Client Phone", "Development", "Stand", "Amount Due", "Due Date", "Days Overdue"];
  const detailRows = detail.map((row) => [
    row.clientName,
    row.clientPhone,
    row.developmentName,
    row.standNumber,
    row.amountDue.toFixed(2),
    row.dueDate.toISOString().slice(0, 10),
    row.daysOverdue,
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([agingHeader, ...agingRows]), "Aging Summary");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([detailHeader, ...detailRows]), "Overdue Detail");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="installment-aging-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
