import { NextResponse } from "next/server";
import { reconcileAllBalances } from "@/lib/services/balance-reconciliation";
import { auditLog } from "@/lib/audit";

/**
 * Balance reconciliation cron.
 *
 * Re-syncs the denormalized sales columns (outstanding_balance, deposit_paid)
 * from the authoritative verified-payment ledger, so client balances stay
 * correct at all times and the "Sale balance reconciliation" health check
 * reads 0 drift.
 *
 * Called by Railway cron: GET /api/cron/reconcile-balances
 * Schedule recommendation: daily (or every 6 hours)
 * Auth:       Authorization: Bearer $CRON_SECRET
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ skipped: true, reason: "no database" });
  }

  const result = await reconcileAllBalances();

  if (result.corrected > 0) {
    await auditLog({
      action: "CRON_RECONCILE_BALANCES",
      module: "CRON",
      newValue: {
        checked: result.checked,
        corrected: result.corrected,
        totalOutstandingDelta: Number(result.totalOutstandingDelta.toFixed(2)),
        totalDepositDelta: Number(result.totalDepositDelta.toFixed(2)),
        date: new Date().toISOString().slice(0, 10),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    checked: result.checked,
    corrected: result.corrected,
    totalOutstandingDelta: Number(result.totalOutstandingDelta.toFixed(2)),
    totalDepositDelta: Number(result.totalDepositDelta.toFixed(2)),
    date: new Date().toISOString().slice(0, 10),
  });
}
