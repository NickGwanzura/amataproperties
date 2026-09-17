"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, Menu, Phone, X } from "lucide-react";
import { useState, useEffect } from "react";
import { SITE } from "@/lib/site-config";
import { ThemeToggle } from "@/components/theme-toggle";

const dashboardProfiles: Record<string, { name: string; role: string }> = {
  "/sysadmin": { name: "System Admin", role: "Sys Admin" },
  "/agent": { name: "Agent", role: "Sales Agent" },
  "/accounts": { name: "Accounts Team", role: "Accounts" },
  "/admin": { name: "Admin User", role: "Administrator" },
  "/ceo": { name: "Executive", role: "CEO" },
  "/client": { name: "Client Portal", role: "Client" },
};

const navLinks = [
  { href: "/developments", label: "Properties" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const roleLabels: Record<string, string> = {
  SYSTEM_ADMIN: "Sys Admin",
  ADMINISTRATOR: "Administrator",
  AGENT: "Sales Agent",
  ACCOUNTS: "Accounts",
  CEO: "CEO",
  CLIENT: "Client",
};

function getProfile(pathname: string) {
  const route = Object.keys(dashboardProfiles).find(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  return route ? dashboardProfiles[route] : null;
}

export function AppHeader() {
  const pathname = usePathname();
  const profile = getProfile(pathname);
  const isAuthPage = ["/login", "/forgot-password", "/reset-password"].some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [sessionProfile, setSessionProfile] = useState<{ name: string; role: string } | null>(null);

  const displayProfile = sessionProfile ?? profile;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!profile) {
      setSessionProfile(null);
      return;
    }

    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { user?: { name?: string; role?: string } } | null) => {
        if (cancelled || !data?.user?.name) return;
        setSessionProfile({
          name: data.user.name,
          role: data.user.role ? roleLabels[data.user.role] ?? data.user.role.replaceAll("_", " ") : profile.role,
        });
      })
      .catch(() => {
        if (!cancelled) setSessionProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, [profile]);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-border/60 transition-all duration-300 ${
        scrolled
          ? "bg-background/97 shadow-[0_1px_24px_rgba(0,0,0,0.10)] backdrop-blur-xl"
          : "bg-background/90 backdrop-blur-md"
      }`}
    >
      {/* Announcement bar */}
      {!displayProfile && !isAuthPage && (
        <div className="border-b border-border/40 bg-black px-4 py-2 text-center text-[11px] font-medium tracking-wide text-white/70">
          <span className="mr-2 inline-block size-1.5 rounded-full bg-[#f0444c] align-middle" />
          A clearer way to move through Zimbabwean property.{" "}
          <Link href="/developments" className="font-semibold text-primary underline-offset-2 hover:underline">
            Explore the brief
          </Link>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Amata wordmark */}
        <Link href="/" className="group flex min-w-0 items-center">
          <span className="flex items-center gap-3">
            <span className="grid size-10 rotate-[-6deg] place-items-center rounded-[13px] bg-primary text-sm font-semibold tracking-tight text-white shadow-md shadow-primary/20 transition group-hover:rotate-0">A</span>
            <span className="leading-none"><span className="block text-lg font-semibold tracking-[0.2em] text-foreground">AMATA</span><span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.28em] text-muted-foreground">Property, thoughtfully</span></span>
          </span>
        </Link>

        {/* Dashboard mode */}
        {displayProfile ? (
          <nav className="flex items-center gap-2">
            {/* Profile pill — desktop only */}
            <div className="hidden items-center gap-2.5 rounded-full border border-border/60 bg-muted/60 px-3 py-1.5 sm:flex">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {displayProfile.name.charAt(0)}
              </span>
              <span className="text-sm leading-tight">
                <span className="block font-semibold text-foreground">{displayProfile.name}</span>
                <span className="block text-[11px] text-muted-foreground">{displayProfile.role}</span>
              </span>
            </div>
            {/* Avatar initial — mobile only */}
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground sm:hidden">
              {displayProfile.name.charAt(0)}
            </span>
            {/* Use <a> not <Link> so sign-out is a real full-page GET,
                not an RSC soft-navigation that would leak the redirect payload */}
            <a
              href="/api/auth/sign-out"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <LogOut className="size-4 text-muted-foreground" />
              <span className="text-sm">Logout</span>
            </a>
          </nav>
        ) : (
          <>
            {/* Desktop nav */}
            <nav className="hidden items-center gap-0.5 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] origin-left scale-x-0 rounded-full bg-primary transition-transform duration-200 group-hover:scale-x-100" />
                </Link>
              ))}

              <span className="mx-3 h-5 w-px bg-border" />

              {/* Phone */}
              <a
                href={`tel:${SITE.phone1Tel}`}
                className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground lg:flex"
              >
                <Phone className="size-3.5 text-primary" />
                {SITE.phone1}
              </a>

              <span className="mx-3 hidden h-5 w-px bg-border lg:block" />

              <ThemeToggle />

              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border/80 bg-background px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted hover:shadow-md"
              >
                <LogIn className="size-4 text-primary" />
                Log In
              </Link>

              <Link
                href="/developments"
                className="ml-2 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:-translate-y-px hover:shadow-lg hover:shadow-primary/30"
              >
                Reserve a Stand
              </Link>
            </nav>

            {/* Mobile toggle */}
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition hover:bg-muted md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </>
        )}
      </div>

      {/* Mobile menu */}
      {mobileOpen && !displayProfile && (
        <div className="border-t border-border/60 bg-background/98 px-4 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/40 pt-4">
            <div className="col-span-2 flex justify-end">
              <ThemeToggle />
            </div>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/80 bg-background py-2.5 text-sm font-semibold text-foreground"
            >
              <LogIn className="size-4 text-primary" />
              Log In
            </Link>
            <Link
              href="/developments"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm"
            >
              Reserve
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
