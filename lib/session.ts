import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "./auth-token";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  return session?.user ?? null;
}
