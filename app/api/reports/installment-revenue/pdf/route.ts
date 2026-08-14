import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getCollectedInstallmentRevenue,
  getInstallmentRevenueSummary,
} from "@/lib/db/queries/revenue";
import { getAllDevelopmentsWithStandCounts } from "@/lib/db/queries/developments";
import { generateInstallmentRevenuePdf } from "@/lib/documents";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";

const ALLOWED_ROLES = ["ACCOUNTS", "ADMINISTRATOR", "CEO", "SYSTEM_ADMIN"] as const;

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [summary, collected, developments] = await Promise.all([
    getInstallmentRevenueSummary(),
    getCollectedInstallmentRevenue(),
    getAllDevelopmentsWithStandCounts(),
  ]);

  const pdfBuffer = await generateInstallmentRevenuePdf({
    summary,
    collected,
    developments,
  });

  // Convert Buffer to Uint8Array for NextResponse compatibility
  const uint8 = new Uint8Array(pdfBuffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, must-revalidate",
      "Content-Disposition": `attachment; filename="installment-revenue-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
