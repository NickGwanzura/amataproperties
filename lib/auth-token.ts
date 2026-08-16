import { auth as authConfig } from "@/config";

export const SESSION_COOKIE = authConfig.sessionCookie;

export type UserRole =
  | "PUBLIC"
  | "CLIENT"
  | "AGENT"
  | "ACCOUNTS"
  | "ADMINISTRATOR"
  | "CEO"
  | "SYSTEM_ADMIN"
  | "GROUP_ADMIN";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type Session = {
  user: AuthUser;
  expiresAt: string;
};

type SessionPayload = AuthUser & {
  exp: number;
};

export const roleHome: Record<UserRole, string> = {
  CEO: "/ceo",
  SYSTEM_ADMIN: "/sysadmin",
  ADMINISTRATOR: "/admin",
  ACCOUNTS: "/accounts",
  AGENT: "/agent",
  CLIENT: "/client",
  GROUP_ADMIN: "/group-admin",
  PUBLIC: "/login",
};

// Demo users — only available in local development without a database.
// Removed from bundle in production builds.
const demoUsers: AuthUser[] = process.env.NODE_ENV !== "production" && process.env.DEMO_MODE === "true"
  ? [
      { id: "demo-sysadmin", name: "System Admin", email: "sysadmin@amataproperties.com", role: "SYSTEM_ADMIN" },
      { id: "demo-ceo", name: "Executive", email: "ceo@amataproperties.com", role: "CEO" },
      { id: "demo-admin", name: "Admin User", email: "admin@amataproperties.com", role: "ADMINISTRATOR" },
      { id: "demo-agent", name: "Tariro Moyo", email: "tariro@amataproperties.com", role: "AGENT" },
      { id: "demo-accounts", name: "Accounts Team", email: "enquiries@amataproperties.co.zw", role: "ACCOUNTS" },
      { id: "demo-client-nyasha", name: "Nyasha Dube", email: "nyasha@example.com", role: "CLIENT" },
      { id: "demo-client-kundai", name: "Kundai Charamba", email: "kundai@example.com", role: "CLIENT" },
    ]
  : [];

const encoder = new TextEncoder();

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET environment variable is required in production");
    }
    return "amata-local-development-secret";
  }
  return secret;
}

function base64UrlEncode(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

async function signPayload(encodedPayload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function createSessionToken(user: AuthUser, maxAgeSeconds = authConfig.sessionMaxAgeSeconds) {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token?: string | null): Promise<Session | null> {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = await signPayload(encodedPayload);
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.id || !payload.email || !payload.name || !payload.role) return null;

    return {
      user: {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      },
      expiresAt: new Date(payload.exp * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

export function findDemoUser(email: string) {
  return demoUsers.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}
