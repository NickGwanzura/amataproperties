/**
 * Application-level configuration.
 *
 * Values derived from environment variables at runtime so that changing
 * domains, database, or API keys only requires updating the .env file.
 */

export const app = {
  /** Application name (used in page titles, headers, etc.) */
  name: process.env.NEXT_PUBLIC_APP_NAME || "Amata Properties",

  /** Public-facing URL — no trailing slash */
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  /** Whether the app is running in production */
  isProduction: process.env.NODE_ENV === "production",

  /** Whether the app is running in development */
  isDevelopment: process.env.NODE_ENV === "development",

  /** Current environment label */
  environment: process.env.NODE_ENV || "development",

  /** Default page metadata description */
  description:
    "Amata is a full-service real estate agency helping people buy, sell, lease, and manage exceptional property across Zimbabwe.",
} as const;

/** Build URLs relative to the configured application URL */
export function appUrl(path = ""): string {
  const base = app.url.replace(/\/+$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}
