import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { getAllSales } from "@/lib/db/queries/sales";
import { getSaleFinancialSnapshot } from "@/lib/finance";
import { toXlsxBuffer, XLSX_CONTENT_TYPE } from "@/lib/xlsx";

const ALLOWED = ["ACCOUNTS", "ADMINISTRATOR", "CEO", "SYSTEM_ADMIN"] as const;

export async function GET(request: Request) {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session?.user || !ALLOWED.includes(session.user.role as typeof ALLOWED[number]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase();
  const statusFilter = searchParams.get("status");
  const devFilter = searchParams.get("development");

  let sales = await getAllSales();

  if (q || statusFilter || devFilter) {
    sales = sales.filter((s) => {
      if (q) {
        const clientName = s.client?.name ?? "";
        const clientEmail = s.client?.email ?? "";
        const devName = s.development?.name ?? "";
        const standNum = s.stand?.standNumber ?? "";
        const agentName = s.agent?.user?.name ?? "";
        const status = s.status.replace("_", " ");
        const matches =
          s.saleNumber.toLowerCase().includes(q) ||
          clientName.toLowerCase().includes(q) ||
          clientEmail.toLowerCase().includes(q) ||
          devName.toLowerCase().includes(q) ||
          standNum.toLowerCase().includes(q) ||
          agentName.toLowerCase().includes(q) ||
          status.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (statusFilter && s.status !== statusFilter) return false;
      if (devFilter && s.development?.name !== devFilter) return false;
      return true;
    });
  }

  const header = ["Sale #", "Date", "Client", "Development", "Stand", "Purchase Price", "Outstanding", "Status"];
  const rows = sales.map((s) => {
    const finance = getSaleFinancialSnapshot(s);
    return [
      s.saleNumber,
      new Date(s.createdAt).toLocaleDateString("en-GB"),
      s.client?.name ?? "",
      s.development?.name ?? "",
      s.stand?.standNumber ?? "",
      finance.purchasePrice.toFixed(2),
      finance.outstanding.toFixed(2),
      s.status,
    ];
  });

  const buffer = toXlsxBuffer(header, rows, "Sales Register");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="sales-register-${date}.xlsx"`,
    },
  });
}
