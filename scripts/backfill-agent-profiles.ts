import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentProfiles, users } from "@/lib/db/schema";

async function main() {
  const agentUsers = await db.query.users.findMany({
    where: eq(users.role, "AGENT"),
    with: { agentProfile: true },
  });

  const missing = agentUsers.filter((user) => !user.agentProfile);
  if (missing.length > 0) {
    await db.insert(agentProfiles).values(
      missing.map((user) => ({
        userId: user.id,
        active: true,
      })),
    );
  }

  const profiles = await db.query.agentProfiles.findMany({
    where: inArray(agentProfiles.userId, agentUsers.map((user) => user.id)),
    with: { user: { columns: { name: true, email: true, role: true } } },
  });

  console.log(JSON.stringify({
    agentUsers: agentUsers.length,
    createdProfiles: missing.length,
    profiles: profiles.map((profile) => ({
      id: profile.id,
      active: profile.active,
      user: profile.user,
      commissionRate: profile.commissionRate,
    })),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
