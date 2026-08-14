import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { getAllDevelopmentsWithStandCounts } from "@/lib/db/queries/developments";
import { toXlsxBuffer, XLSX_CONTENT_TYPE } from "@/lib/xlsx";

const ALLOWED = ["ACCOUNTS", "ADMINISTRATOR", "CEO", "SYSTEM_ADMIN"] as const;

export async function GET() {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session?.user || !ALLOWED.includes(session.user.role as typeof ALLOWED[number]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const developments = await getAllDevelopmentsWithStandCounts();

  const header = ["Development", "Stand #", "Size (m²)", "Price (USD)", "Status"];
  const rows: (string | number)[][] = [];

  for (const dev of developments) {
    for (const stand of dev.stands) {
      rows.push([
        dev.name,
        stand.standNumber,
        stand.sizeSqm,
        parseFloat(stand.price as string).toFixed(2),
        stand.status,
      ]);
    }
  }

  const buffer = toXlsxBuffer(header, rows, "Stand Inventory");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="stand-inventory-${date}.xlsx"`,
    },
  });
}
