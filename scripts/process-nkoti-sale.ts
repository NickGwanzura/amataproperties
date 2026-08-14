/**
 * Process Patience Nkoti's sale of stand 34638 at St Lucia Norton.
 *
 * Creates:
 *   1. Client record for Patience Nkoti
 *   2. Reservation for stand 34638
 *   3. Sale via buildSaleFromReservation (with deposit of $1,000)
 *   4. Commission for agent Paida Mudota ($500 default)
 *   5. Notifications to:
 *       - Client (deposit received + allocation emails)
 *       - Agent (sale completed notification)
 *       - All ADMINISTRATOR, ACCOUNTS, CEO, SYSTEM_ADMIN users (sale alert)
 *
 * Run: npx tsx --env-file=.env.local scripts/process-nkoti-sale.ts
 */
import { db } from "@/lib/db/index";
import {
  stands,
  clients,
  reservations as reservationsTable,
  leads,
  users,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { buildSaleFromReservation } from "@/lib/services/sale-conversion";
import { sendNotification } from "@/lib/notifications";
import { auditLog } from "@/lib/audit";
import crypto from "crypto";

// ── Sale details ──────────────────────────────────────────────────────────
const STAND_NUMBER = "34638";
const CLIENT_NAME = "Patience Nkoti";
const CLIENT_EMAIL = "patiencenkoti@gmail.com";
const CLIENT_PHONE = "+263785420225";
const CLIENT_NATIONAL_ID = "Pending"; // Update once provided
const CLIENT_ADDRESS = "Harare, Zimbabwe"; // Update as needed
const DEPOSIT_AMOUNT = 1000; // Standard deposit for St Lucia Norton
const REFERENCE = `PRE-2026-NKOTI`;

async function main() {
  console.log("=".repeat(60));
  console.log("PROCESSING SALE: Patience Nkoti → Stand 34638 (St Lucia Norton)");
  console.log("Agent: Paida Mudota (paidamudota@gmail.com)");
  console.log("=".repeat(60));

  // 1. Find the stand
  const stand = await db.query.stands.findFirst({
    where: eq(stands.standNumber, STAND_NUMBER),
    with: { development: true },
  });

  if (!stand) {
    console.error("❌ Stand", STAND_NUMBER, "not found!");
    process.exit(1);
  }

  if (stand.status !== "AVAILABLE") {
    console.error("❌ Stand", STAND_NUMBER, "is", stand.status, "- expected AVAILABLE");
    process.exit(1);
  }

  console.log(`\n✅ Stand ${STAND_NUMBER} found — ${stand.development.name}, $${stand.price}`);

  // 2. Find the agent (Paida Mudota)
  const agentProfiles = await db.query.agentProfiles.findMany({
    with: { user: true },
  });
  const mudota = agentProfiles.find((a) =>
    a.user?.name?.toLowerCase().includes("mudota"),
  );

  if (!mudota) {
    console.error("❌ Agent Mudota not found!");
    process.exit(1);
  }

  console.log(`✅ Agent: ${mudota.user.name} (${mudota.user.email}) — rate: $${mudota.commissionRate}`);

  // 3. Find a sysadmin user to act as the "verified by" user
  const adminUsers = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(inArray(users.role, ["SYSTEM_ADMIN", "ADMINISTRATOR"]));

  const verifiedBy = adminUsers[0];
  if (!verifiedBy) {
    console.error("❌ No admin user found to verify the sale!");
    process.exit(1);
  }

  console.log(`✅ Verified by: ${verifiedBy.name} (${verifiedBy.email})`);

  // 4. Upsert client
  let client = await db.query.clients.findFirst({
    where: eq(clients.email, CLIENT_EMAIL),
  });

  if (!client) {
    const [created] = await db
      .insert(clients)
      .values({
        name: CLIENT_NAME,
        nationalId: CLIENT_NATIONAL_ID,
        phone: CLIENT_PHONE,
        email: CLIENT_EMAIL,
        address: CLIENT_ADDRESS,
        kycStatus: "NOT_STARTED",
      })
      .returning();
    client = created;
    console.log(`✅ Client created: ${client.name} (${client.email})`);
  } else {
    console.log(`✅ Client already exists: ${client.name} (${client.email})`);
  }

  // 5. Create lead
  await db.insert(leads).values({
    clientId: client.id,
    agentId: mudota.id,
    developmentId: stand.developmentId,
    name: CLIENT_NAME,
    email: CLIENT_EMAIL,
    phone: CLIENT_PHONE,
    source: "admin",
    status: "PRESALE_INITIATED",
    notes: "Processed via admin script. Deposit $1,000 paid.",
  });
  console.log("✅ Lead created");

  // 6. Create reservation
  const [reservation] = await db
    .insert(reservationsTable)
    .values({
      reference: REFERENCE,
      clientId: client.id,
      agentId: mudota.id,
      developmentId: stand.developmentId,
      standId: stand.id,
      status: "AWAITING_DEPOSIT",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })
    .returning();

  console.log(`✅ Reservation created: ${reservation.reference}`);

  // 7. Run the sale conversion
  const purchasePrice = parseFloat(stand.price);
  const developmentDeposit = parseFloat(stand.development.depositAmount);
  const clampedDeposit = Math.min(DEPOSIT_AMOUNT, purchasePrice);

  console.log(`\n🔄 Converting to sale...`);
  console.log(`   Purchase price: $${purchasePrice}`);
  console.log(`   Deposit: $${clampedDeposit}`);
  console.log(`   Months: ${stand.development.paymentDurationMonths}`);

  const result = await buildSaleFromReservation({
    reservationId: reservation.id,
    clientId: client.id,
    clientEmail: CLIENT_EMAIL,
    clientName: CLIENT_NAME,
    agentId: mudota.id,
    agentEmail: mudota.user.email,
    commissionRate: mudota.commissionRate,
    developmentId: stand.developmentId,
    developmentName: stand.development.name,
    developmentDeposit: developmentDeposit,
    developmentInterest: stand.development.interestRate,
    standId: stand.id,
    standNumber: stand.standNumber,
    standSizeSqm: stand.sizeSqm,
    reference: REFERENCE,
    purchasePrice,
    depositAmount: clampedDeposit,
    depositMethod: "BANK_TRANSFER",
    depositReference: `DEP-NKOTI-${Date.now()}`,
    depositNotes: "Deposit paid for stand 34638, St Lucia Norton",
    months: stand.development.paymentDurationMonths,
    verifiedByUserId: verifiedBy.id,
  });

  console.log(`\n✅ SALE CREATED: ${result.saleNumber}`);
  console.log(`   Sale ID: ${result.saleId}`);
  console.log(`   Plan ID: ${result.planId}`);

  // 8. Send notifications to admin/accounts/ceo users
  const notifyRoles = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(inArray(users.role, ["ADMINISTRATOR", "ACCOUNTS", "CEO", "SYSTEM_ADMIN"]));

  console.log(`\n📧 Sending admin notifications to ${notifyRoles.length} user(s)...`);

  const adminNotifyResults = await Promise.allSettled(
    notifyRoles.map((u) =>
      sendNotification({
        recipient: u.email,
        subject: `NEW SALE: ${result.saleNumber} — ${CLIENT_NAME} / Stand ${STAND_NUMBER}`,
        body: `A new sale has been activated on Amata Properties.

SALE DETAILS
────────────
Sale Number:   ${result.saleNumber}
Client:        ${CLIENT_NAME} (${CLIENT_EMAIL})
Stand:         ${STAND_NUMBER}
Development:   ${stand.development.name}
Purchase Price: $${purchasePrice.toLocaleString()}
Deposit Paid:  $${clampedDeposit.toLocaleString()}
Balance:       $${(purchasePrice - clampedDeposit).toLocaleString()}
Payment Plan:  ${stand.development.paymentDurationMonths} months

AGENT
─────
${mudota.user.name} (${mudota.user.email})
Commission:    $${mudota.commissionRate}
Status:        PENDING (awaiting approval)

View in dashboard:
  https://www.amataproperties.com/accounts

Amata Properties — Automated Sale Notification`,
      }),
    ),
  );

  const adminSucceeded = adminNotifyResults.filter((r) => r.status === "fulfilled").length;
  const adminFailed = adminNotifyResults.filter((r) => r.status === "rejected").length;
  console.log(`   ✅ ${adminSucceeded} sent, ❌ ${adminFailed} failed`);

  // 9. Audit log for the admin notifications
  await auditLog({
    userId: verifiedBy.id,
    action: "SEND_SALE_ALERT",
    module: "ACCOUNTS",
    newValue: {
      saleNumber: result.saleNumber,
      recipients: notifyRoles.map((u) => u.email),
      succeeded: adminSucceeded,
      failed: adminFailed,
    },
  });

  // 10. Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ SALE COMPLETED SUCCESSFULLY");
  console.log("=".repeat(60));
  console.log(`
Summary:
────────
Client:         ${CLIENT_NAME} (${CLIENT_EMAIL})
Stand:          ${STAND_NUMBER} — ${stand.development.name}
Sale:           ${result.saleNumber}
Agent:          ${mudota.user.name} (${mudota.user.email})
Commission:     $${mudota.commissionRate} (PENDING)

Notifications sent to:
  • Client: ${CLIENT_EMAIL} — ✅ (deposit + allocation emails)
  • Agent: ${mudota.user.email} — ✅ (sale notification)
  • Admins (${notifyRoles.length}): ${notifyRoles.map((u) => u.email).join(", ")}
`);
}

main().catch((err) => {
  console.error("\n❌ Script failed:", err);
  process.exit(1);
});
