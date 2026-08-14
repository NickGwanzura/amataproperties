import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { db } from "@/lib/db";
import { createCeoReportPdf } from "@/lib/documents";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SYSTEM_ADMIN", "CEO", "ADMINISTRATOR"];

export async function GET() {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Fetch all data in parallel ──
  const [allSales, allStands, allDevelopments] = await Promise.all([
    db.query.sales.findMany({
      with: {
        client:          { columns: { name: true } },
        development:     { columns: { id: true, name: true } },
        stand:           { columns: { standNumber: true, sizeSqm: true } },
        installmentPlan: { columns: { monthlyAmount: true, months: true } },
        payments:        { columns: { amount: true, type: true, status: true, paidAt: true } },
      },
    }),
    db.query.stands.findMany({
      columns: { status: true },
      with: { development: { columns: { id: true, name: true } } },
    }),
    db.query.developments.findMany({ columns: { id: true, name: true } }),
  ]);

  // ── KPIs ──
  const activeSales    = allSales.filter((s) => s.status === "ACTIVE");
  const completedSales = allSales.filter((s) => s.status === "PAID_OFF");
  const relevantSales  = [...activeSales, ...completedSales];

  const totalPortfolioValue = relevantSales.reduce((s, sale) => s + parseFloat(sale.purchasePrice), 0);
  const totalOutstanding    = activeSales.reduce((s, sale) => s + parseFloat(sale.outstandingBalance), 0);

  let totalCollected = 0;
  let adminFeesCollected = 0;
  for (const sale of allSales) {
    for (const p of sale.payments) {
      if (p.status !== "VERIFIED") continue;
      const amt = parseFloat(p.amount);
      totalCollected += amt;
      if (p.type === "ADJUSTMENT") adminFeesCollected += amt;
    }
  }

  const monthlyRecurring = activeSales.reduce(
    (s, sale) => s + (sale.installmentPlan ? parseFloat(sale.installmentPlan.monthlyAmount) : 0),
    0
  );

  // ── Development breakdown ──
  const devMap = new Map<string, {
    name: string;
    standsTotal: number; standsSold: number; standsReserved: number; standsAvailable: number;
    salesCount: number; salesValue: number; salesCollected: number; salesOutstanding: number;
  }>();

  for (const dev of allDevelopments) {
    devMap.set(dev.id, {
      name: dev.name,
      standsTotal: 0, standsSold: 0, standsReserved: 0, standsAvailable: 0,
      salesCount: 0, salesValue: 0, salesCollected: 0, salesOutstanding: 0,
    });
  }

  for (const stand of allStands) {
    const row = devMap.get(stand.development?.id ?? "");
    if (!row) continue;
    row.standsTotal++;
    if (stand.status === "SOLD")      row.standsSold++;
    else if (stand.status === "RESERVED") row.standsReserved++;
    else row.standsAvailable++;
  }

  for (const sale of relevantSales) {
    const devId = sale.development?.id ?? "";
    const row = devMap.get(devId);
    if (!row) continue;
    const price       = parseFloat(sale.purchasePrice);
    const outstanding = parseFloat(sale.outstandingBalance);
    const collected   = sale.payments
      .filter((p) => p.status === "VERIFIED")
      .reduce((s, p) => s + parseFloat(p.amount), 0);
    row.salesCount++;
    row.salesValue       += price;
    row.salesCollected   += collected;
    row.salesOutstanding += outstanding;
  }

  const developments = Array.from(devMap.values()).filter((d) => d.standsTotal > 0);

  // ── Monthly collections (last 12 months + all time) ──
  const allVerified = allSales.flatMap((sale) =>
    sale.payments.filter((p) => p.status === "VERIFIED").map((p) => ({
      amount: parseFloat(p.amount),
      month: new Date(p.paidAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
      monthKey: new Date(p.paidAt).toISOString().slice(0, 7),
    }))
  );

  const monthMap = new Map<string, { month: string; amount: number; count: number }>();
  for (const p of allVerified) {
    const entry = monthMap.get(p.monthKey) ?? { month: p.month, amount: 0, count: 0 };
    entry.amount += p.amount;
    entry.count++;
    monthMap.set(p.monthKey, entry);
  }
  const monthlyCollections = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  // ── Active sales register ──
  const salesRegister = activeSales.map((sale) => {
    const price       = parseFloat(sale.purchasePrice);
    const outstanding = parseFloat(sale.outstandingBalance);
    const collected   = Math.max(0, price - outstanding);
    const progressPct = price > 0 ? Math.min(100, Math.round((collected / price) * 100)) : 0;
    return {
      saleNumber:        sale.saleNumber,
      clientName:        sale.client?.name ?? "—",
      development:       sale.development?.name ?? "—",
      standNumber:       sale.stand?.standNumber ?? "—",
      sizeSqm:           sale.stand?.sizeSqm ?? 0,
      purchasePrice:     price,
      depositPaid:       parseFloat(sale.depositPaid),
      outstanding,
      monthlyInstallment: sale.installmentPlan ? parseFloat(sale.installmentPlan.monthlyAmount) : 0,
      progressPct,
      status:            sale.status,
    };
  }).sort((a, b) => a.saleNumber.localeCompare(b.saleNumber));

  const generatedDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const buf = await createCeoReportPdf({
    generatedDate,
    kpis: {
      totalSales:        allSales.length,
      activeSales:       activeSales.length,
      completedSales: completedSales.length,
      totalPortfolioValue,
      totalCollected,
      totalOutstanding,
      adminFeesCollected,
      monthlyRecurring,
    },
    developments,
    monthlyCollections,
    salesRegister,
  });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, must-revalidate",
      "Content-Disposition": `inline; filename="amata-ceo-report-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
