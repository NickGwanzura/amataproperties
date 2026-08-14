import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-token";
import { verifyCsrf } from "@/lib/csrf";

function clearSession(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: Request) {
  const headers = request.headers;
  const host = headers.get("x-forwarded-host") ?? new URL(request.url).host;
  const proto = headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? "https";
  const url = new URL("/login", `${proto}://${host}`);
  return clearSession(NextResponse.redirect(url));
}

export async function POST(request: Request) {
  const csrfResponse = verifyCsrf(request);
  if (csrfResponse) return csrfResponse;
  return clearSession(NextResponse.json({ ok: true }));
}
