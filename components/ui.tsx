import Link from "next/link";
import type { ComponentProps } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function ButtonLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn("inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-55 bg-primary", className)}
      {...props}
    />
  );
}

export function GhostLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn("inline-flex h-11 items-center justify-center rounded-lg border bg-background px-5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-muted disabled:pointer-events-none disabled:opacity-55", className)}
      {...props}
    />
  );
}

export function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  const numeric = /[\d$%]/.test(value);

  return (
    <div className="premium-panel overflow-hidden">
      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
        <p className={cn("mt-2.5 text-[2rem] font-semibold leading-none tracking-tight", numeric && "kpi-number")}>{value}</p>
        {detail ? <p className="mt-2 text-[13px] text-muted-foreground">{detail}</p> : null}
      </div>
    </div>
  );
}

export function SectionTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="mb-3 flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
          <span className="h-px w-7 bg-primary" />{eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold leading-[1.03] tracking-[-0.04em] sm:text-5xl">{title}</h2>
      {children ? <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{children}</p> : null}
    </div>
  );
}

const statusClasses: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Available: "bg-emerald-50 text-emerald-800 border-emerald-200",
  PRESALE: "bg-amber-50 text-amber-800 border-amber-200",
  Presale: "bg-amber-50 text-amber-800 border-amber-200",
  RESERVED: "bg-orange-50 text-orange-800 border-orange-200",
  Reserved: "bg-orange-50 text-orange-800 border-orange-200",
  SOLD: "bg-red-50 text-red-800 border-red-200",
  Sold: "bg-red-50 text-red-800 border-red-200",
  BLOCKED: "bg-zinc-100 text-zinc-700 border-zinc-200",
  Blocked: "bg-zinc-100 text-zinc-700 border-zinc-200",
  Pending: "bg-sky-50 text-sky-800 border-sky-200",
  "Pending Approval": "bg-sky-50 text-sky-800 border-sky-200",
  Approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Paid: "bg-indigo-50 text-indigo-800 border-indigo-200",
  New: "bg-slate-50 text-slate-700 border-slate-200",
  Contacted: "bg-sky-50 text-sky-800 border-sky-200",
  Interested: "bg-emerald-50 text-emerald-800 border-emerald-200",
  "Site Visit Booked": "bg-indigo-50 text-indigo-800 border-indigo-200",
  Negotiating: "bg-amber-50 text-amber-800 border-amber-200",
  "Presale Initiated": "bg-orange-50 text-orange-800 border-orange-200",
  "Converted to Sale": "bg-emerald-50 text-emerald-800 border-emerald-200",
  Lost: "bg-red-50 text-red-800 border-red-200",
  Complete: "bg-emerald-50 text-emerald-800 border-emerald-200",
  "In Review": "bg-sky-50 text-sky-800 border-sky-200",
  "Pending Proof of Residence": "bg-amber-50 text-amber-800 border-amber-200",
  "Awaiting Deposit": "bg-amber-50 text-amber-800 border-amber-200",
  "KYC Review": "bg-sky-50 text-sky-800 border-sky-200",
  "Client Confirmation Sent": "bg-indigo-50 text-indigo-800 border-indigo-200",
  ACTIVE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  PAID_OFF: "bg-indigo-50 text-indigo-800 border-indigo-200",
  DEFAULTED: "bg-red-50 text-red-800 border-red-200",
  CANCELLED: "bg-zinc-100 text-zinc-700 border-zinc-200",
  Rejected: "bg-red-50 text-red-800 border-red-200",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5", statusClasses[status] ?? "border-border bg-muted text-muted-foreground", className)}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function EmptyState({ title, detail, icon }: { title: string; detail: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-background px-6 py-12 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-full bg-muted text-muted-foreground/60">
        {icon ?? <Inbox className="size-6" />}
      </span>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  );
}

export function LoadingState({ label = "Loading workspace" }: { label?: string }) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-6">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <span className="flex gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="inline-block size-1.5 animate-pulse rounded-full bg-primary/60"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
        {label}
      </div>
      <div className="space-y-2.5">
        <div className="skeleton h-3.5 rounded-md" style={{ width: "72%" }} />
        <div className="skeleton h-3.5 rounded-md" style={{ width: "48%" }} />
        <div className="skeleton h-3.5 rounded-md" style={{ width: "60%" }} />
      </div>
    </div>
  );
}

export function ErrorState({ title = "Something needs attention", detail }: { title?: string; detail: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-relaxed">{detail}</p>
    </div>
  );
}
