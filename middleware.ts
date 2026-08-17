import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { roleHome, SESSION_COOKIE, verifySessionToken } from "@/lib/auth-token";

/**
 * Route → allowed roles mapping.
 * Each protected route prefix lists the roles that are permitted to access it.
 */
const routePermissions: Record<string, string[]> = {
  "/sysadmin": ["SYSTEM_ADMIN"],
  "/admin": ["ADMINISTRATOR", "SYSTEM_ADMIN"],
  "/agent": ["AGENT"],
  "/ceo": ["CEO", "SYSTEM_ADMIN"],
  "/accounts": ["ACCOUNTS", "ADMINISTRATOR", "SYSTEM_ADMIN", "CEO"],
  "/client": ["CLIENT"],
  "/group-admin": ["GROUP_ADMIN", "ADMINISTRATOR", "SYSTEM_ADMIN"],
};

/**
 * When a user's role doesn't match the requested route,
 * redirect them to the dashboard that corresponds to their role.
 * Roles not in this map (e.g. PUBLIC) have no dashboard and will be sent to login.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public launch gate: keep the site private until the announced launch date.
  // API routes and framework assets remain available for deployment/runtime needs.
  if (
    pathname !== "/coming-soon" &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.includes(".")
  ) {
    return NextResponse.redirect(new URL("/coming-soon", request.url));
  }

  // Find which protection rule (if any) applies to this path
  const matchedRule = Object.entries(routePermissions).find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // Not a protected route — allow through
  if (!matchedRule) return NextResponse.next();

  const [, allowedRoles] = matchedRule;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const user = session?.user;

  // Authenticated AND has an allowed role → permit
  if (user?.role && allowedRoles.includes(user.role)) {
    return NextResponse.next();
  }

  // Authenticated but wrong role → redirect to their own dashboard
  if (user?.role) {
    const home = roleHome[user.role];
    if (home && pathname !== home && home !== "/login") {
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  // Not authenticated → redirect to login with a return path
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|coming-soon|api).*)",
  ],
};
