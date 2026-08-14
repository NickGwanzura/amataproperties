import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { db } from "@/lib/db";
import { toXlsxBuffer, XLSX_CONTENT_TYPE } from "@/lib/xlsx";

const ALLOWED = ["ADMINISTRATOR", "CEO", "SYSTEM_ADMIN"] as const;

export async function GET() {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session?.user || !ALLOWED.includes(session.user.role as typeof ALLOWED[number]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const agents = await db.query.agentProfiles.findMany({
    with: {
      user: true,
      sales: { with: { commissions: true } },
    },
  });

  const header = ["Agent", "Email", "Status", "Commission Rate", "Total Sales", "Total Revenue", "Commission Earned"];
  const rows = agents.map((a) => {
    const totalRevenue = a.sales.reduce((s, sale) => s + parseFloat(sale.purchasePrice as string), 0);
    const commissionEarned = a.sales.flatMap((s) => s.commissions).reduce((s, c) => s + parseFloat(c.amount as string), 0);
    return [
      a.user?.name ?? "",
      a.user?.email ?? "",
      a.active ? "Active" : "Inactive",
      `${a.commissionRate}%`,
      a.sales.length,
      totalRevenue.toFixed(2),
      commissionEarned.toFixed(2),
    ];
  });

  const buffer = toXlsxBuffer(header, rows, "Agent Performance");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="agent-performance-${date}.xlsx"`,
    },
  });
}
