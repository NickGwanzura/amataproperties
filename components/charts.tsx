"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { monthlyRevenue } from "@/lib/dashboard-data";

type RevenueRow = { month: string; revenue: number; collections: number };

function ChartTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3.5 py-2.5 text-sm shadow-lg backdrop-blur-md">
      <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: entry.color }} />
            <span className="font-medium text-foreground">{entry.name}</span>
          </span>
          <span className="kpi-number font-semibold">${Number(entry.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart({ data }: { data?: RevenueRow[] }) {
  const chartData = data ?? monthlyRevenue;
  return (
    <div className="premium-panel flex h-72 flex-col p-5">
      <p className="mb-3 text-sm font-semibold text-foreground">Revenue vs Collections</p>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border) / 0.3)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
            <Bar dataKey="revenue" name="Revenue" fill="#136f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="collections" name="Collections" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type MethodRow = { method: string; amount: number };

export type InstallmentTrendRow = { month: string; [key: string]: string | number };

const DEV_COLORS = [
  "#136f5e",
  "#0d9488",
  "#0891b2",
  "#6366f1",
  "#8b5cf6",
  "#a21caf",
  "#e11d48",
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#65a30d",
  "#16a34a",
];

export function InstallmentTrendChart({ data }: { data: InstallmentTrendRow[] }) {
  const developments = data.length > 0
    ? Object.keys(data[0]).filter((k) => k !== "month")
    : [];

  return (
    <div className="premium-panel flex h-80 flex-col p-5">
      <p className="mb-3 text-sm font-semibold text-foreground">Monthly Installment Trend by Development</p>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border) / 0.3)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
            />
            {developments.map((dev, i) => (
              <Bar
                key={dev}
                dataKey={dev}
                name={dev}
                stackId="installments"
                fill={DEV_COLORS[i % DEV_COLORS.length]}
                radius={i === developments.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {developments.map((dev, i) => (
          <div key={dev} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="size-2.5 rounded-sm"
              style={{ backgroundColor: DEV_COLORS[i % DEV_COLORS.length] }}
            />
            <span className="font-medium">{dev}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
const METHOD_COLORS = ["#136f5e", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"];

export function PaymentMethodChart({ data }: { data: MethodRow[] }) {
  return (
    <div className="flex h-64 flex-col">
      <p className="mb-3 text-sm font-semibold text-foreground">Payment Methods</p>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="method"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={50}
              paddingAngle={3}
              cornerRadius={4}
              label={({ method, percent }: { method: string; percent: number }) =>
                `${method} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={{ stroke: "hsl(var(--border) / 0.4)" }}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={METHOD_COLORS[index % METHOD_COLORS.length]}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
