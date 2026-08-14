import { NextResponse } from "next/server";

/**
 * Verify that the request's Origin (or Referer) header matches the application's
 * base URL. This prevents malicious third-party sites from forging authenticated
 * requests to our API routes.
 *
 * Call this at the top of mutation API route handlers (POST, PUT, DELETE, PATCH).
 */
export function verifyCsrf(request: Request): NextResponse | null {
  // Only check mutation methods
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    return null;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.amataproperties.com";

  const allowedOrigins = [appUrl];

  // In development, allow localhost
  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.push("http://localhost:3000");
    allowedOrigins.push("http://localhost:3001");
  }

  // Check Origin header first (more reliable)
  if (origin) {
    const originBase = extractBaseUrl(origin);
    if (allowedOrigins.some((allowed) => originBase === extractBaseUrl(allowed))) {
      return null;
    }
    return NextResponse.json({ error: "CSRF validation failed: origin not allowed" }, { status: 403 });
  }

  // Fall back to Referer header
  if (referer) {
    const refererBase = extractBaseUrl(referer);
    if (allowedOrigins.some((allowed) => refererBase === extractBaseUrl(allowed))) {
      return null;
    }
    return NextResponse.json({ error: "CSRF validation failed: referer not allowed" }, { status: 403 });
  }

  // In production, require Origin or Referer for state-changing requests
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CSRF validation failed: missing origin or referer" }, { status: 403 });
  }

  // In development, allow requests without Origin/Referer (e.g. from curl/Postman)
  return null;
}

function extractBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Strip www. prefix so www.example.com matches example.com
    const host = parsed.host.replace(/^www\./, "");
    return `${parsed.protocol}//${host}`;
  } catch {
    return url;
  }
}
