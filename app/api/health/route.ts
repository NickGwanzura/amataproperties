import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, canUseDatabase } from "@/lib/db";
import { isStorageConfigured } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Check = {
  name: string;
  status: "pass" | "fail";
  detail: string;
};

export async function GET() {
  const checks: Check[] = [
    {
      name: "DATABASE_URL",
      status: process.env.DATABASE_URL ? "pass" : "fail",
      detail: process.env.DATABASE_URL ? "Configured" : "Missing",
    },
    {
      name: "AUTH_SECRET",
      status: process.env.AUTH_SECRET ? "pass" : "fail",
      detail: process.env.AUTH_SECRET ? "Configured" : "Missing",
    },
    {
      name: "CRON_SECRET",
      status: process.env.CRON_SECRET ? "pass" : "fail",
      detail: process.env.CRON_SECRET ? "Configured" : "Missing",
    },
    {
      name: "Storage",
      status: isStorageConfigured() ? "pass" : "fail",
      detail: isStorageConfigured() ? "Configured" : "Missing storage variables",
    },
  ];

  if (canUseDatabase()) {
    try {
      await db.execute(sql`select 1`);
      checks.push({ name: "Database connectivity", status: "pass", detail: "Query succeeded" });
    } catch (error) {
      checks.push({
        name: "Database connectivity",
        status: "fail",
        detail: error instanceof Error ? error.message : "Query failed",
      });
    }
  } else {
    checks.push({ name: "Database connectivity", status: "fail", detail: "DATABASE_URL not configured" });
  }

  const ok = checks.every((check) => check.status === "pass");
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      checkedAt: new Date().toISOString(),
      checks,
    },
    { status: ok ? 200 : 503 },
  );
}
