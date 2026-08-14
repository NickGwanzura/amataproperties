import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { db } from "@/lib/db";
import { and, desc, gte, lte, sql, eq } from "drizzle-orm";
import { auditLogs } from "@/lib/db/schema";
import { toXlsxBuffer, XLSX_CONTENT_TYPE } from "@/lib/xlsx";
import type { SQL } from "drizzle-orm";

const ALLOWED = ["ADMINISTRATOR", "SYSTEM_ADMIN"] as const;

export async function GET(request: NextRequest) {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session?.user || !ALLOWED.includes(session.user.role as typeof ALLOWED[number]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const selectedModule = searchParams.get("module") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const search = searchParams.get("search") || undefined;

  const conditions: SQL<unknown>[] = [];

  if (selectedModule && selectedModule !== "ALL") {
    conditions.push(eq(auditLogs.module, selectedModule));
  }

  if (search) {
    const term = `%${search}%`;
    conditions.push(
      sql`(${auditLogs.action} ilike ${term} or ${auditLogs.module} ilike ${term})`,
    );
  }

  if (dateFrom) {
    conditions.push(gte(auditLogs.createdAt, new Date(dateFrom)));
  }

  if (dateTo) {
    const end = new Date(dateTo);
    end.setDate(end.getDate() + 1);
    conditions.push(lte(auditLogs.createdAt, end));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const logs = await db.query.auditLogs.findMany({
    where,
    orderBy: [desc(auditLogs.createdAt)],
    limit: 5000,
  });

  const header = ["Timestamp", "Module", "Action", "User ID", "Details"];
  const rows = logs.map((l) => [
    new Date(l.createdAt).toISOString(),
    l.module,
    l.action,
    l.userId ?? "",
    JSON.stringify(l.newValue ?? {}),
  ]);

  const buffer = toXlsxBuffer(header, rows, "Audit Log");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="audit-log-${date}.xlsx"`,
    },
  });
}
