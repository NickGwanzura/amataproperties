"use client";
import { usePathname } from "next/navigation";
import { AppFooter } from "./app-footer";

const AUTH_PATHS = ["/login", "/forgot-password", "/reset-password"];

export function FooterWrapper() {
  const pathname = usePathname();
  if (pathname === "/coming-soon") return null;
  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;
  return <AppFooter />;
}
