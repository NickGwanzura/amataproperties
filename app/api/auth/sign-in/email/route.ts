import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { applyRateLimit } from "@/lib/rate-limit";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  // Rate limiting: 10 attempts per IP per minute
  // Note: CSRF check intentionally omitted for login — cross-site login is not a meaningful
  // security threat (no data exfiltration risk), and the www vs non-www Origin mismatch
  // would cause a 403 for users accessing via www.amataproperties.com.
  // Rate limiting provides sufficient brute-force protection.
  const rateLimitResponse = await applyRateLimit(request, undefined, { maxRequests: 10, windowSeconds: 60 });
  if (rateLimitResponse) return rateLimitResponse;

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: { message: "Email and password are required." } }, { status: 400 });
  }

  const user = await authenticateUser(email, password);
  if (!user) {
    return NextResponse.json({ error: { message: "Invalid email or password. Please try again." } }, { status: 401 });
  }

  const token = await createSessionToken(user, SESSION_MAX_AGE);
  const response = NextResponse.json({ data: { user } });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}
