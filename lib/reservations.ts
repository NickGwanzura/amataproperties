"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/index";
import { agentProfiles, clients, leads, reservations, stands } from "@/lib/db/schema";
import { auditLog } from "@/lib/audit";
import { sendNotification } from "@/lib/notifications";
import { reservationConfirmedEmail } from "@/lib/email-templates";

const reservationSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  nationalId: z.string().min(5, "National ID must be at least 5 characters"),
  phone: z.string().min(7, "Phone number must be at least 7 characters"),
  email: z.string().email("Enter a valid email address"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  developmentSlug: z.string().min(1),
  standId: z.string().min(1),
  message: z.string().optional(),
});

export type ReservationState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[]>;
  reference?: string;
};

export async function reserveStand(
  _previous: ReservationState,
  formData: FormData,
): Promise<ReservationState> {
  const parsed = reservationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      message: "Please fix the highlighted fields and try again.",
      errors: flat.fieldErrors,
    };
  }

  const { fullName, nationalId, phone, email, address, standId, message } = parsed.data;

  // Atomically claim the stand — only succeeds if still AVAILABLE
  const [stand] = await db
    .update(stands)
    .set({ status: "RESERVED", updatedAt: new Date() })
    .where(and(eq(stands.id, standId), eq(stands.status, "AVAILABLE")))
    .returning();

  if (!stand) {
    return { ok: false, message: "This stand is no longer available for reservation." };
  }

  const standWithDev = await db.query.stands.findFirst({
    where: eq(stands.id, stand.id),
    with: { development: true },
  });

  const reference = `PRE-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // Pick the least-loaded active agent (round-robin)
  const assignedAgent = await pickActiveAgent();

  // Upsert client
  let client = await db.query.clients.findFirst({ where: eq(clients.email, email) });
  if (!client) {
    const [created] = await db
      .insert(clients)
      .values({ name: fullName, nationalId, phone, email, address })
      .returning();
    client = created;
  }

  const developmentId = standWithDev?.developmentId ?? stand.developmentId;
  const developmentName = standWithDev?.development?.name ?? "";

  // Create lead
  await db.insert(leads).values({
    clientId: client.id,
    developmentId,
    agentId: assignedAgent?.id ?? null,
    name: fullName,
    phone,
    email,
    notes: message,
    source: "website",
    status: "NEW",
  });

  // Create reservation
  await db.insert(reservations).values({
    reference,
    clientId: client.id,
    agentId: assignedAgent?.id ?? null,
    developmentId,
    standId: stand.id,
    status: "PENDING",
    message,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  // Notify assigned agent + client
  const agentEmail = assignedAgent?.user?.email;
  const agentName = assignedAgent?.user?.name;
  await Promise.all([
    sendNotification({
      recipient: agentEmail ?? "accounts@amataproperties.com",
      subject: `New lead assigned: ${fullName} — ${reference}`,
      body: `You have been assigned a new reservation lead.

Client: ${fullName}
Email: ${email}
Phone: ${phone}
Stand: ${stand.standNumber} at ${developmentName}
Reference: ${reference}
Message: ${message || "—"}

Follow up with the client to process their deposit and move them toward allocation.`,
    }),
    sendNotification({
      recipient: email,
      subject: `Reservation ${reference} confirmed — deposit due within 24 hours`,
      body: `Your reservation for stand ${stand.standNumber} at ${developmentName} has been received. Reference: ${reference}. Your stand is held for 24 hours.`,
      html: reservationConfirmedEmail({
        clientName: fullName,
        standNumber: stand.standNumber,
        developmentName,
        reference,
        agentName: agentName ?? undefined,
        agentEmail: assignedAgent?.user?.email ?? undefined,
      }),
    }),
  ]);

  await auditLog({
    action: "CREATE_RESERVATION",
    module: "RESERVATION",
    newValue: {
      reference,
      standId: stand.id,
      clientEmail: email,
      assignedAgentId: assignedAgent?.id ?? null,
      assignedAgentName: assignedAgent?.user?.name ?? null,
    },
  });

  revalidatePath("/");
  revalidatePath(`/developments/${developmentName.toLowerCase().replace(/\s+/g, "-")}`);

  return {
    ok: true,
    reference,
    message: `Reservation ${reference} received. Our team will contact you with deposit instructions.`,
  };
}

/**
 * Pick the active agent with the fewest current reservations (round-robin).
 * Falls back to null if no active agents exist.
 */
async function pickActiveAgent(): Promise<{ id: string; user: { name: string; email: string } } | null> {
  const agents = await db.query.agentProfiles.findMany({
    where: eq(agentProfiles.active, true),
    with: {
      user: { columns: { name: true, email: true } },
      reservations: true,
    },
  });

  const valid = agents.filter((a) => a.user);
  if (valid.length === 0) return null;

  // Sort by fewest reservations (round-robin to the least loaded)
  valid.sort((a, b) => a.reservations.length - b.reservations.length);

  return {
    id: valid[0].id,
    user: { name: valid[0].user.name, email: valid[0].user.email },
  };
}
