import { NextResponse } from "next/server";
import { and, eq, lte, inArray } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { reservations, stands } from "@/lib/db/schema";
import { sendNotification } from "@/lib/notifications";

// Call this route on a schedule (e.g. every 15 min via Vercel Cron or external cron).
// Protect with CRON_SECRET so only your scheduler can trigger it.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ skipped: true, reason: "no database" });
  }

  const now = new Date();

  // Find PENDING / PRESALE reservations whose 24-hour window has passed
  const expired = await db.query.reservations.findMany({
    where: and(
      inArray(reservations.status, ["PENDING", "PRESALE"]),
      lte(reservations.expiresAt, now),
    ),
    with: {
      client: true,
      stand: true,
      development: true,
      agent: { with: { user: true } },
    },
  });

  if (expired.length === 0) {
    return NextResponse.json({ released: 0 });
  }

  const standIds = expired.map((r) => r.standId);

  // Mark reservations as EXPIRED
  await db
    .update(reservations)
    .set({ status: "EXPIRED", updatedAt: new Date() })
    .where(
      and(
        inArray(reservations.status, ["PENDING", "PRESALE"]),
        lte(reservations.expiresAt, now),
      ),
    );

  // Release stands back to AVAILABLE
  for (const standId of standIds) {
    await db
      .update(stands)
      .set({ status: "AVAILABLE", updatedAt: new Date() })
      .where(and(eq(stands.id, standId), eq(stands.status, "RESERVED")));
  }

  // Send notifications to clients + agents
  await Promise.all(
    expired.flatMap((r) => {
      const clientEmail = r.client?.email;
      const agentEmail = r.agent?.user?.email;
      const standNumber = r.stand?.standNumber ?? r.standId;
      const devName = r.development?.name ?? "";

      const notifications: Promise<void>[] = [];

      if (clientEmail) {
        notifications.push(
          sendNotification({
            recipient: clientEmail,
            subject: `Reservation ${r.reference} has expired`,
            body: `Your reservation for stand ${standNumber} at ${devName} (ref: ${r.reference}) has expired because no deposit was received within 24 hours.

The stand has been released and is now available to other buyers.

If you are still interested, please visit our website to make a new reservation or contact our sales team directly.`,
          }),
        );
      }

      if (agentEmail) {
        notifications.push(
          sendNotification({
            recipient: agentEmail,
            subject: `Reservation ${r.reference} expired — stand ${standNumber} released`,
            body: `The reservation ${r.reference} for stand ${standNumber} at ${devName} has expired.
Client: ${r.client?.name ?? "Unknown"} (${clientEmail ?? "—"})

No deposit was received within the 24-hour window. The stand has been released back to available inventory.`,
          }),
        );
      }

      return notifications;
    }),
  );

  return NextResponse.json({ released: expired.length, standIds });
}
