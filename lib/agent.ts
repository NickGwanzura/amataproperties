import { db } from "@/lib/db";
import { agentProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";

export async function getCurrentAgentProfile() {
  const user = await getSessionUser();
  if (!user) return null;
  const profile = await db.query.agentProfiles.findFirst({
    where: eq(agentProfiles.userId, user.id),
    with: { user: true },
  });
  return profile;
}
