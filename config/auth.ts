/**
 * Authentication configuration.
 *
 * Secrets and URLs are sourced from environment variables so that
 * different environments (local dev, staging, production) use their
 * own credentials without code changes.
 */

export const auth = {
  /** Secret used for JWT/HMAC signing (min 32 chars, recommended 64 hex chars) */
  secret: process.env.AUTH_SECRET || "",

  /** NextAuth / Better Auth URL (must match the deployed domain) */
  url: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  /** Session cookie name */
  sessionCookie: process.env.SESSION_COOKIE_NAME || "amata_session",

  /** Session max age in seconds (default: 7 days) */
  sessionMaxAgeSeconds: 60 * 60 * 24 * 7,

  /** List of allowed sign-in methods */
  providers: ["email"] as const,

  /** Whether auth is fully configured */
  isConfigured: !!(process.env.AUTH_SECRET),
} as const;
