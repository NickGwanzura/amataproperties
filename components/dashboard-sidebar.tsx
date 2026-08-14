"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  Banknote,
  BarChart2,
  Bell,
  CircleSlash,
  ClipboardCheck,
  Clock,
  CreditCard,
  FileDown,
  FileText,
  Handshake,
  Home,
  LockKeyhole,
  Map,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Server,
  Shield,
  TrendingUp,
  Trophy,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

type NavItem = { label: string; href: string; icon: LucideIcon };

const STORAGE_KEY = "amata:sidebar-collapsed";
const MAX_MOBILE_NAV_ITEMS = 5;

const DASHBOARDS: Record<string, { title: string; role: string; items: NavItem[] }> = {
  sysadmin: {
    title: "System Control",
    role: "System Admin",
    items: [
      { label: "Platform Overview", href: "/sysadmin",               icon: Activity },
      { label: "Data Integrity",    href: "/sysadmin/data-integrity", icon: AlertTriangle },
      { label: "Sales Register",    href: "/sysadmin/sales",         icon: TrendingUp },
      { label: "Presales",          href: "/sysadmin/presales",      icon: Handshake },
      { label: "All Clients",       href: "/sysadmin/clients",       icon: Users },
      { label: "Users & Roles",     href: "/sysadmin/users",         icon: UserPlus },
      { label: "Developments",      href: "/sysadmin/developments",  icon: Upload },
      { label: "Blog & News",       href: "/sysadmin/blog",          icon: Newspaper },
      { label: "Full Audit Trail",  href: "/sysadmin/audit",         icon: Shield },
      { label: "Reports",           href: "/sysadmin/reports",       icon: FileDown },
      { label: "Notifications",     href: "/sysadmin/notifications", icon: Bell },
      { label: "System Settings",   href: "/sysadmin/settings",      icon: Server },
    ],
  },
  accounts: {
    title: "Collections",
    role: "Accounts",
    items: [
      { label: "Presale Queue", href: "/accounts", icon: Banknote },
      { label: "Clients", href: "/accounts/clients", icon: Users },
      { label: "Statements & Receipts", href: "/accounts/statements", icon: FileDown },
      { label: "Payments", href: "/accounts/payments", icon: CreditCard },
      { label: "Bulk Upload", href: "/accounts/bulk-payments", icon: Upload },
      { label: "Installment Revenue", href: "/accounts/revenue", icon: TrendingUp },
      { label: "Installment Aging", href: "/accounts/revenue/aging", icon: Clock },
      { label: "Revenue Reports", href: "/accounts/reports", icon: BarChart2 },
    ],
  },
  agent: {
    title: "Sales Workspace",
    role: "Agent CRM",
    items: [
      { label: "Lead Pipeline", href: "/agent", icon: UserPlus },
      { label: "All Leads", href: "/agent/leads", icon: FileText },
      { label: "KYC Onboarding", href: "/agent/kyc", icon: Users },
      { label: "Presale Allocation", href: "/agent/presales", icon: Handshake },
      { label: "Presale Records", href: "/agent/records", icon: FileText },
      { label: "Commissions", href: "/agent/commissions", icon: BadgeDollarSign },
      { label: "Restrictions", href: "/agent/restrictions", icon: CircleSlash },
    ],
  },
  admin: {
    title: "Admin ERP",
    role: "Administrator",
    items: [
      { label: "Overview", href: "/admin", icon: ClipboardCheck },
      { label: "Developments", href: "/admin/developments", icon: Upload },
      { label: "Stand Management", href: "/admin/stands", icon: Map },
      { label: "Group Buying", href: "/admin/groups", icon: Handshake },
      { label: "Reservations", href: "/admin/reservations", icon: Handshake },
      { label: "Agents & Users", href: "/admin/users", icon: Users },
      { label: "Reports", href: "/admin/reports", icon: FileDown },
      { label: "Audit Log", href: "/admin/audit", icon: Shield },
      { label: "System Health", href: "/admin/health", icon: Activity },
      { label: "System Settings", href: "/admin/settings", icon: LockKeyhole },
    ],
  },
  ceo: {
    title: "CEO Dashboard",
    role: "Executive",
    items: [
      { label: "Executive Overview", href: "/ceo", icon: BarChart2 },
      { label: "Revenue & Collections", href: "/ceo/revenue", icon: TrendingUp },
      { label: "Agent Rankings", href: "/ceo/agents", icon: Trophy },
      { label: "Aging Report", href: "/ceo/aging", icon: Clock },
      { label: "Reports", href: "/ceo/reports", icon: FileDown },
    ],
  },
  client: {
    title: "Client Portal",
    role: "Buyer",
    items: [
      { label: "My Property", href: "/client", icon: Home },
      { label: "Submit Payment", href: "/client/submit-payment", icon: Upload },
      { label: "Payments", href: "/client/payments", icon: CreditCard },
      { label: "Statements & Receipts", href: "/client/statements", icon: FileDown },
      { label: "Documents", href: "/client/documents", icon: FileText },
      { label: "Stand Map", href: "/client/map", icon: Map },
    ],
  },
  groupAdmin: {
    title: "Group Buying",
    role: "Group Administrator",
    items: [
      { label: "Group Dashboard", href: "/group-admin", icon: BarChart2 },
      { label: "Members", href: "/group-admin/members", icon: Users },
      { label: "Reports", href: "/group-admin/reports", icon: FileDown },
    ],
  },
};

export function DashboardSidebar({
  dashboard,
  badges = {},
}: {
  dashboard: keyof typeof DASHBOARDS;
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const { title, role, items } = DASHBOARDS[dashboard];

  const [collapsed, setCollapsed] = useState(false);

  // Hydrate from localStorage on mount (no hydration mismatch since server also renders false)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setCollapsed(true);
    } catch {
      // localStorage unavailable — use default
    }
  }, []);

  // Persist preference
  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/accounts" &&
      href !== "/agent" &&
      href !== "/admin" &&
      href !== "/ceo" &&
      href !== "/client" &&
      href !== "/group-admin" &&
      pathname.startsWith(href));

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r bg-card transition-all duration-300 ease-in-out md:flex",
          "sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto",
          collapsed ? "w-16" : "w-56",
        )}
      >
        {/* Header — hides labels when collapsed */}
        <div
          className={cn(
            "flex items-center border-b transition-opacity duration-200",
            collapsed ? "justify-center px-0 py-4" : "justify-between px-4 py-4",
          )}
        >
          {collapsed ? (
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-xs font-semibold uppercase text-primary">
              {role.charAt(0)}
            </span>
          ) : (
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                {role}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{title}</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 p-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center rounded-lg text-sm font-medium transition",
                collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {/* Active indicator bar */}
              {isActive(item.href) && !collapsed && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary-foreground/40" />
              )}
              <span
                className={cn(
                  "relative flex items-center justify-center",
                  collapsed ? "w-full" : "size-4 shrink-0",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {/* Badge dot on icon when collapsed */}
                {collapsed && badges[item.href] ? (
                  <span className="absolute -right-1 -top-1 flex min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 py-px text-[8px] font-semibold leading-tight text-white ring-1 ring-card">
                    {badges[item.href] > 99 ? "99+" : badges[item.href]}
                  </span>
                ) : null}
              </span>

              {/* Label — hidden when collapsed */}
              <span
                className={cn(
                  "flex items-center gap-1.5 overflow-hidden whitespace-nowrap transition-all duration-200",
                  collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
                )}
              >
                {item.label}
                {/* Badge number next to label when expanded */}
                {!collapsed && badges[item.href] ? (
                  <span className="flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 py-px text-[10px] font-semibold leading-tight text-white">
                    {badges[item.href] > 99 ? "99+" : badges[item.href]}
                  </span>
                ) : null}
              </span>

              {/* Tooltip on hover when collapsed — include badge count */}
              {collapsed && (
                <span className="absolute left-full ml-2 z-50 hidden rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-lg group-hover:block whitespace-nowrap">
                  {item.label}
                  {badges[item.href] ? (
                    <span className="ml-2 rounded-full bg-red-500 px-1.5 py-px text-[10px] font-semibold text-white">
                      {badges[item.href] > 99 ? "99+" : badges[item.href]}
                    </span>
                  ) : null}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Toggle button pinned to bottom */}
        <div className="border-t p-2">
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "flex w-full items-center justify-center rounded-lg py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground",
              collapsed ? "px-0" : "gap-2 px-3",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="size-4 shrink-0" />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile bottom navigation bar — max 5 items to avoid overflow */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center border-t bg-card/95 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur-xl md:hidden">
        {items.slice(0, MAX_MOBILE_NAV_ITEMS).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold transition",
              isActive(item.href)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="relative">
              <item.icon className={cn("size-5 transition", isActive(item.href) && "scale-110")} />
              {badges[item.href] ? (
                <span className="absolute -right-1.5 -top-1.5 flex min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 py-px text-[8px] font-semibold leading-tight text-white ring-1 ring-card">
                  {badges[item.href] > 99 ? "99+" : badges[item.href]}
                </span>
              ) : null}
            </span>
            <span className="w-full truncate text-center leading-tight">{item.label}</span>
            {isActive(item.href) && (
              <span className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
            )}
          </Link>
        ))}
      </nav>
    </>
  );
}
