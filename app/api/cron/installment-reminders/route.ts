import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inArray } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { sendNotification } from "@/lib/notifications";
import { installmentReminderEmail } from "@/lib/email-templates";
import { auditLog } from "@/lib/audit";

// Called by Railway cron: GET /api/cron/installment-reminders
// Schedule: daily at 08:00
// Set CRON_SECRET env var and configure Railway to send:
//   Authorization: Bearer <CRON_SECRET>
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Fetch all active sales with installment plans ─────────────────────────
  const activeSales = await db.query.sales.findMany({
    where: (s, { eq }) => eq(s.status, "ACTIVE"),
    with: {
      client: { columns: { name: true, email: true, phone: true } },
      development: { columns: { name: true } },
      stand: { columns: { standNumber: true } },
      agent: { with: { user: { columns: { name: true, email: true } } } },
      installmentPlan: {
        with: {
          installments: { orderBy: (i, { asc }) => [asc(i.sequence)] },
        },
      },
    },
    columns: { id: true, saleNumber: true, outstandingBalance: true },
  });

  // ── Counters ──────────────────────────────────────────────────────────────
  let upcomingSent = 0;
  let overdueFirstSent = 0;
  let overdueSecondSent = 0;
  let overdueChronicSent = 0;
  let skipped = 0;
  const agentAlerts: Map<string, { name: string; email: string; overdueCount: number; totalAmount: number; sales: string[] }> = new Map();
  const chronicAlerts: { adminEmail: string; clientName: string; saleNumber: string; amountDue: number; daysOverdue: number }[] = [];

  for (const sale of activeSales) {
    if (!sale.client?.email) { skipped++; continue; }
    if (!sale.installmentPlan?.installments?.length) { skipped++; continue; }

    const allInstallments = sale.installmentPlan.installments;

    // Find the next unpaid or partially-paid installment
    const nextUnpaid = allInstallments.find((i) => {
      const paid = parseFloat(i.amountPaid);
      const due = parseFloat(i.amountDue);
      return paid < due - 0.005; // still owes at least some amount
    });

    if (!nextUnpaid) { skipped++; continue; }

    const paid = parseFloat(nextUnpaid.amountPaid);
    const due = parseFloat(nextUnpaid.amountDue);
    const remaining = due - paid;
    const dueDate = new Date(nextUnpaid.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dueDate.getTime() - today.getTime()) / 86400000);
    const daysOverdue = diffDays < 0 ? Math.abs(diffDays) : 0;
    const isOverdue = diffDays < 0;
    const dueDateLabel = dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    let shouldSend = false;
    let escalationLevel: "upcoming" | "overdue_1" | "overdue_2" | "overdue_chronic" = "upcoming";

    // ── Determine if we should send a reminder and at what level ──────────
    if (diffDays === 7) {
      // 7 days before due date — gentle reminder
      shouldSend = true;
      escalationLevel = "upcoming";
    } else if (daysOverdue >= 1 && daysOverdue <= 3) {
      // 1-3 days overdue — first overdue notice
      shouldSend = true;
      escalationLevel = "overdue_1";
    } else if (daysOverdue >= 7 && daysOverdue <= 10) {
      // 7-10 days overdue — second notice with firmer language
      shouldSend = true;
      escalationLevel = "overdue_2";
    } else if (daysOverdue >= 14 && daysOverdue % 7 === 0) {
      // 14+ days overdue and it's a weekly milestone — chronic notice (+ alert admins)
      shouldSend = true;
      escalationLevel = "overdue_chronic";
    }

    if (!shouldSend) {
      // For overdue sales, track agent alerts regardless of send day
      if (isOverdue && sale.agent?.user?.email) {
        const agentKey = sale.agent.user.email;
        if (!agentAlerts.has(agentKey)) {
          agentAlerts.set(agentKey, {
            name: sale.agent.user.name ?? "Agent",
            email: sale.agent.user.email,
            overdueCount: 0,
            totalAmount: 0,
            sales: [],
          });
        }
        const alert = agentAlerts.get(agentKey)!;
        alert.overdueCount++;
        alert.totalAmount += remaining;
        alert.sales.push(sale.saleNumber);
      }
      skipped++;
      continue;
    }

    // ── Send the reminder to the client ──────────────────────────────────
    let subject: string;
    let urgency: "gentle" | "firm" | "urgent" | "final" = "gentle";

    switch (escalationLevel) {
      case "upcoming":
        subject = `Installment Due in 7 Days — ${sale.saleNumber}`;
        urgency = "gentle";
        upcomingSent++;
        break;
      case "overdue_1":
        subject = `Overdue Installment Notice — ${sale.saleNumber}`;
        urgency = "firm";
        overdueFirstSent++;
        break;
      case "overdue_2":
        subject = `⚠️ Overdue Installment — Second Notice — ${sale.saleNumber}`;
        urgency = "urgent";
        overdueSecondSent++;
        break;
      case "overdue_chronic":
        subject = `🔴 Final Overdue Notice — ${sale.saleNumber} — Action Required`;
        urgency = "final";
        overdueChronicSent++;
        break;
    }

    await sendNotification({
      recipient: sale.client.email,
      subject,
      body: `Your installment of $${remaining.toFixed(2)} for sale ${sale.saleNumber} is ${isOverdue ? "overdue" : `due on ${dueDateLabel}`}. Outstanding balance: $${parseFloat(sale.outstandingBalance).toFixed(2)}.`,
      html: installmentReminderEmail({
        clientName: sale.client.name,
        saleNumber: sale.saleNumber,
        standNumber: sale.stand?.standNumber ?? "—",
        developmentName: sale.development?.name ?? "—",
        amountDue: remaining,
        dueDate: dueDateLabel,
        outstandingBalance: parseFloat(sale.outstandingBalance),
        isOverdue,
        urgency,
        daysOverdue,
      }),
    });

    // ── Track agent alerts for all overdue levels ────────────────────────
    if (isOverdue && sale.agent?.user?.email) {
      const agentKey = sale.agent.user.email;
      if (!agentAlerts.has(agentKey)) {
        agentAlerts.set(agentKey, {
          name: sale.agent.user.name ?? "Agent",
          email: sale.agent.user.email,
          overdueCount: 0,
          totalAmount: 0,
          sales: [],
        });
      }
      const alert = agentAlerts.get(agentKey)!;
      alert.overdueCount++;
      alert.totalAmount += remaining;
      if (!alert.sales.includes(sale.saleNumber)) {
        alert.sales.push(sale.saleNumber);
      }
    }

    // ── Chronic overdue: alert admin ────────────────────────────────────
    if (escalationLevel === "overdue_chronic") {
      chronicAlerts.push({
        adminEmail: "", // resolved after the loop
        clientName: sale.client.name,
        saleNumber: sale.saleNumber,
        amountDue: remaining,
        daysOverdue,
      });
    }
  }

  // ── Send agent summary alerts ─────────────────────────────────────────────
  for (const [, alert] of agentAlerts) {
    const saleList = alert.sales.join(", ");
    await sendNotification({
      recipient: alert.email,
      subject: `Overdue Installment Summary — ${alert.overdueCount} client${alert.overdueCount > 1 ? "s" : ""} overdue`,
      body: `You have ${alert.overdueCount} client${alert.overdueCount > 1 ? "s" : ""} with overdue installments totaling $${alert.totalAmount.toFixed(2)}. Sales affected: ${saleList}. Please follow up with your clients to arrange payment.`,
    });
  }

  // ── Send chronic overdue admin alerts ─────────────────────────────────────
  if (chronicAlerts.length > 0) {
    const admins = await db
      .select({ email: users.email })
      .from(users)
      .where(
        inArray(users.role, ["ADMINISTRATOR", "SYSTEM_ADMIN", "ACCOUNTS"]),
      );

    for (const chronic of chronicAlerts) {
      for (const admin of admins) {
        if (!admin.email?.includes("@")) continue;
        await sendNotification({
          recipient: admin.email,
          subject: `⚠️ Chronic Overdue — ${chronic.saleNumber} (${chronic.daysOverdue} days)`,
          body: `Sale ${chronic.saleNumber} — ${chronic.clientName} has an installment ${chronic.daysOverdue} days overdue. Amount due: $${chronic.amountDue.toFixed(2)}. This requires accounts team attention.`,
        });
      }
    }
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  const totalSent = upcomingSent + overdueFirstSent + overdueSecondSent + overdueChronicSent;
  if (totalSent > 0) {
    await auditLog({
      action: "CRON_INSTALLMENT_REMINDERS",
      module: "CRON",
      newValue: {
        sent: totalSent,
        upcoming: upcomingSent,
        overdueFirst: overdueFirstSent,
        overdueSecond: overdueSecondSent,
        overdueChronic: overdueChronicSent,
        skipped,
        agentAlerts: agentAlerts.size,
        chronicAlerts: chronicAlerts.length,
        date: today.toISOString().slice(0, 10),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    sent: totalSent,
    upcoming: upcomingSent,
    overdueFirst: overdueFirstSent,
    overdueSecond: overdueSecondSent,
    overdueChronic: overdueChronicSent,
    skipped,
    agentAlerts: agentAlerts.size,
    chronicAlerts: chronicAlerts.length,
    date: today.toISOString().slice(0, 10),
  });
}
