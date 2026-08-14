import { Suspense } from "react";
import { SectionTitle, StatCard, LoadingState } from "@/components/ui";
import { getSalesRegisterData } from "@/lib/db/queries/sales";
import { getSaleFinancialSnapshot } from "@/lib/finance";
import { money } from "@/lib/utils";
import { SalesRegister } from "./_sales-register";

export const dynamic = "force-dynamic";

export default async function SysadminSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; development?: string }>;
}) {
  const sales = await getSalesRegisterData();

  const { q, status: statusFilter, development: devFilter } = await searchParams;
  const query = q?.trim() ?? "";
  const initialStatus = statusFilter ?? "";
  const initialDev = devFilter ?? "";

  // Extract unique development names for the dropdown
  const developments = [...new Set(sales.map((s) => s.development?.name).filter(Boolean))].sort();

  // Known sale statuses
  const statuses = ["ACTIVE", "PAID_OFF", "DEFAULTED", "CANCELLED"];

  const snapshots = sales.map((s) => getSaleFinancialSnapshot(s));
  const totalRevenue = snapshots.reduce((sum, s) => sum + s.purchasePrice, 0);
  const totalOutstanding = snapshots.reduce((sum, s) => sum + s.outstanding, 0);
  const totalCollected = snapshots.reduce((sum, s) => sum + s.propertyPaid, 0);
  const activeSales = sales.filter((s) => s.status === "ACTIVE").length;
  const paidOff = sales.filter((s) => s.status === "PAID_OFF").length;

  return (
    <div className="dashboard-page">
      <SectionTitle
        eyebrow="Sysadmin: Sales Register"
        title="Every sale across all developments"
      />

      {/* KPI row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Sales" value={String(sales.length)} />
        <StatCard
          label="Active"
          value={String(activeSales)}
          detail={activeSales > 0 ? `${((activeSales / sales.length) * 100).toFixed(0)}% of total` : "—"}
        />
        <StatCard label="Paid Off" value={String(paidOff)} />
        <StatCard label="Total Revenue" value={money(totalRevenue)} />
        <StatCard label="Outstanding" value={money(totalOutstanding)} detail={`${money(totalCollected)} collected`} />
      </div>

      {/* Interactive Sales Register */}
      <Suspense fallback={<div className="mt-8"><LoadingState label="Loading sales register" /></div>}>
        <div className="mt-8">
          <SalesRegister
            sales={sales}
            developments={developments}
            statuses={statuses}
            initialQ={query}
            initialStatus={initialStatus}
            initialDev={initialDev}
          />
        </div>
      </Suspense>
    </div>
  );
}
