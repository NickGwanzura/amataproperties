import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { getAllDevelopmentsWithStandCounts } from "@/lib/db/queries/developments";
import { toCsv } from "@/lib/csv";

const ALLOWED = ["ACCOUNTS", "ADMINISTRATOR", "CEO", "SYSTEM_ADMIN"] as const;

export async function GET() {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session?.user || !ALLOWED.includes(session.user.role as typeof ALLOWED[number]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const developments = await getAllDevelopmentsWithStandCounts();

  const header = ["Development", "Stand #", "Size (m²)", "Price (USD)", "Status"];
  const rows: string[][] = [];

  for (const dev of developments) {
    for (const stand of dev.stands) {
      rows.push([
        dev.name,
        stand.standNumber,
        String(stand.sizeSqm),
        parseFloat(stand.price as string).toFixed(2),
        stand.status,
      ]);
    }
  }

  const csv = toCsv([header, ...rows]);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stand-inventory-${date}.csv"`,
    },
  });
}
