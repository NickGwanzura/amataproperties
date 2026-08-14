import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/csv";

const ALLOWED = ["SYSTEM_ADMIN"] as const;

export async function GET() {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session?.user || !ALLOWED.includes(session.user.role as typeof ALLOWED[number]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await db.query.users.findMany({
    orderBy: (u, { asc }) => [asc(u.role), asc(u.name)],
  });

  const header = ["Name", "Email", "Role", "Email Verified", "Created At"];
  const rows = users.map((u) => [
    u.name,
    u.email,
    u.role,
    u.emailVerified ? "Yes" : "No",
    new Date(u.createdAt).toLocaleDateString("en-GB"),
  ]);

  const csv = toCsv([header, ...rows]);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="users-${date}.csv"`,
    },
  });
}
