import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/csv";

const ALLOWED = ["ACCOUNTS", "ADMINISTRATOR", "CEO", "SYSTEM_ADMIN"] as const;

export async function GET() {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session?.user || !ALLOWED.includes(session.user.role as typeof ALLOWED[number]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const reservations = await db.query.reservations.findMany({
    with: {
      client: true,
      development: true,
      stand: true,
      agent: { with: { user: true } },
    },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });

  const header = ["Reference", "Date", "Client", "Development", "Stand", "Agent", "Status"];
  const rows = reservations.map((r) => [
    r.reference,
    new Date(r.createdAt).toLocaleDateString("en-GB"),
    r.client?.name ?? "",
    r.development?.name ?? "",
    r.stand?.standNumber ?? "",
    r.agent?.user?.name ?? "—",
    r.status,
  ]);

  const csv = toCsv([header, ...rows]);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservations-${date}.csv"`,
    },
  });
}
