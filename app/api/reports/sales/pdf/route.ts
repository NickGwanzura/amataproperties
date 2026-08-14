import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllSales } from "@/lib/db/queries/sales";
import { generateSalesReportPdf } from "@/lib/documents";
import { getSaleFinancialSnapshot } from "@/lib/finance";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";

const ALLOWED_ROLES = ["ACCOUNTS", "ADMINISTRATOR", "CEO", "SYSTEM_ADMIN"] as const;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const pdfBuffer = await generateSalesReportPdf({
    sales: sales.map((s) => {
      const finance = getSaleFinancialSnapshot(s);
      return {
        saleNumber: s.saleNumber,
        status: s.status,
        clientName: s.client.name,
        developmentName: s.development.name,
        standNumber: s.stand.standNumber,
        agentName: s.agent?.user?.name ?? "—",
        purchasePrice: finance.purchasePrice,
        depositPaid: finance.depositPaid,
        outstandingBalance: finance.outstanding,
      };
    }),
  });

  const uint8 = new Uint8Array(pdfBuffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, must-revalidate",
      "Content-Disposition": `attachment; filename="sales-report-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
