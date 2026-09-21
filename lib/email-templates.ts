// Branded HTML email templates for Amata Properties
// Primary: #6A0B14 | Accent: #6A0B14 | Dark: #171114
import { company } from "@/config";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://amataproperties.co.zw";
const BRAND_COLOR = "#6A0B14";
const ACCENT_COLOR = "#6A0B14";
const BRAND_DARK = "#171114";

function shell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:Manrope,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #E0DCD0;">

<!-- HEADER -->
<tr>
  <td style="background:${BRAND_COLOR};padding:24px 32px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="background:#B89050;width:36px;height:36px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
        <span style="color:#171114;font-size:18px;font-weight:900;line-height:1;">S</span>
      </div>
      <div style="display:inline-block;vertical-align:middle;margin-left:8px;">
        <div style="color:#fff;font-size:17px;font-weight:800;letter-spacing:-0.3px;line-height:1.2;">${company.shortName}</div>
        <div style="color:rgba(255,255,255,0.65);font-size:10px;text-transform:uppercase;letter-spacing:2px;">Real Estate Agency</div>
      </div>
    </div>
  </td>
</tr>

<!-- BODY -->
<tr>
  <td style="padding:36px 32px 28px;">
    ${body}
  </td>
</tr>

<!-- FOOTER -->
<tr>
  <td style="background:#FFFFFF;padding:20px 32px;border-top:1px solid #E0DCD0;">
    <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.7;">
      This is an automated message from ${company.name}. Please do not reply to this email.<br>
      Questions? Contact us at <a href="mailto:${company.infoEmail}" style="color:${ACCENT_COLOR};text-decoration:none;">${company.infoEmail}</a>
      &nbsp;&middot;&nbsp; <a href="tel:${company.accountsPhoneTel}" style="color:${ACCENT_COLOR};text-decoration:none;">${company.accountsPhone}</a><br>
      &copy; ${new Date().getFullYear()} ${company.name} ${company.legalSuffix} &middot; ${company.country}
    </p>
  </td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:${BRAND_DARK};letter-spacing:-0.4px;">${text}</h1>`;
}

function subheading(text: string) {
  return `<p style="margin:0 0 20px;color:#6b7280;font-size:14px;">${text}</p>`;
}

function greeting(name: string) {
  return `<p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>${name}</strong>,</p>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.65;">${text}</p>`;
}

function button(label: string, href: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background:${BRAND_COLOR};border-radius:7px;">
      <a href="${href}" style="display:inline-block;padding:12px 28px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.1px;">${label}</a>
    </td>
  </tr>
</table>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #E0DCD0;margin:20px 0;">`;
}

function infoRow(label: string, value: string) {
  return `<tr>
  <td style="padding:8px 12px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #EDE9E0;">${label}</td>
  <td style="padding:8px 12px;font-size:13px;color:${BRAND_DARK};font-weight:600;border-bottom:1px solid #EDE9E0;">${value}</td>
</tr>`;
}

function infoTable(rows: [string, string][]) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E0DCD0;border-radius:7px;overflow:hidden;margin:16px 0;">
  ${rows.map(([l, v]) => infoRow(l, v)).join("")}
</table>`;
}

function badge(text: string, color = BRAND_COLOR) {
  return `<span style="display:inline-block;background:${color}18;color:${color};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;padding:3px 9px;border-radius:99px;border:1px solid ${color}30;">${text}</span>`;
}

// ─── 1. INVITATION / WELCOME ──────────────────────────────────────────────────

export function inviteEmail(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const roleLabel = data.role.charAt(0) + data.role.slice(1).toLowerCase().replace("_", " ");
  const body = `
    ${heading(`Welcome to ${company.shortName}`)}
    ${subheading("Your account has been created")}
    ${greeting(data.name)}
    ${paragraph(`Your workspace account has been set up. You've been onboarded as <strong>${roleLabel}</strong> on the ${company.name} platform.`)}
    ${infoTable([
      ["Email", data.email],
      ["Temporary Password", data.password],
      ["Role", roleLabel],
    ])}
    ${paragraph(`<strong style="color:#dc2626;">Security:</strong> Please change your password immediately after your first login.`)}
    ${button("Sign In to Your Account", `${BASE}/login`)}
    ${divider()}
    ${paragraph(`If you did not expect this invitation, please contact us immediately at <a href="mailto:${company.infoEmail}" style="color:${ACCENT_COLOR};">${company.infoEmail}</a>.`)}
  `;
  return shell(`Welcome to ${company.shortName}`, body);
}

// ─── 1b. INVITE (link-based, no password) ────────────────────────────────────

export function inviteWithLinkEmail(data: {
  name: string;
  email: string;
  role: string;
  inviteLink: string;
}) {
  const roleLabel = data.role.charAt(0) + data.role.slice(1).toLowerCase().replace("_", " ");
  const body = `
    ${heading(`You've been invited to ${company.shortName}`)}
    ${subheading("Set up your account to get started")}
    ${greeting(data.name)}
    ${paragraph(`You've been added to the ${company.shortName} platform as <strong>${roleLabel}</strong>. Click the button below to create your password and activate your account.`)}
    ${button("Set Up My Account", data.inviteLink)}
    ${divider()}
    ${paragraph(`This invitation link expires in <strong>7 days</strong>. If you didn't expect this invitation, please contact us at <a href="mailto:${company.infoEmail}" style="color:${ACCENT_COLOR};">${company.infoEmail}</a>.`)}
  `;
  return shell(`You've been invited — ${company.shortName}`, body);
}

// ─── 2. PASSWORD RESET ────────────────────────────────────────────────────────

export function passwordResetEmail(data: { name: string; resetLink: string }) {
  const body = `
    ${heading("Reset Your Password")}
    ${subheading("A password reset was requested for your account")}
    ${greeting(data.name)}
    ${paragraph(`We received a request to reset the password for your ${company.shortName} account. Click the button below to choose a new password.`)}
    ${button("Reset My Password", data.resetLink)}
    ${divider()}
    ${paragraph(`This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password will not change.`)}
    ${paragraph(`For security, this link can only be used once.`)}
  `;
  return shell("Reset Your Password", body);
}

// ─── 3. RESERVATION CONFIRMED ────────────────────────────────────────────────

export function reservationConfirmedEmail(data: {
  clientName: string;
  standNumber: string;
  developmentName: string;
  reference: string;
  agentName?: string;
  agentEmail?: string;
}) {
  const rows: [string, string][] = [
    ["Reference", data.reference],
    ["Development", data.developmentName],
    ["Stand No.", data.standNumber],
    ["Stand Held For", "24 hours"],
    ["Status", "Awaiting Deposit"],
  ];
  const body = `
    ${heading("Reservation Confirmed")}
    ${subheading(`${data.developmentName} — Stand ${data.standNumber}`)}
    ${greeting(data.clientName)}
    ${paragraph("Your stand reservation has been received. Your stand is held for <strong>24 hours</strong> — please pay your deposit as soon as possible to secure your allocation.")}
    ${infoTable(rows)}
    ${badge("Deposit Required Within 24 Hours", "#dc2626")}
    ${divider()}
    ${data.agentName
      ? paragraph(`Your assigned agent is <strong>${data.agentName}</strong> (<a href="mailto:${data.agentEmail}" style="color:${ACCENT_COLOR};">${data.agentEmail}</a>) who will contact you shortly with deposit instructions.`)
      : paragraph("Our team will contact you shortly with deposit instructions.")}
    ${button("View Your Reservation", `${BASE}/client`)}
  `;
  return shell(`Reservation ${data.reference} Confirmed`, body);
}

// ─── 4. PRESALE INITIATED ─────────────────────────────────────────────────────

export function presaleEmail(data: {
  clientName: string;
  standNumber: string;
  developmentName: string;
  reference: string;
  agentName?: string;
}) {
  const rows: [string, string][] = [
    ["Reference", data.reference],
    ["Development", data.developmentName],
    ["Stand No.", data.standNumber],
    ["Status", "Presale — Deposit Pending"],
  ];
  const body = `
    ${heading("You're in Presale")}
    ${subheading(`${data.developmentName} — Stand ${data.standNumber}`)}
    ${greeting(data.clientName)}
    ${paragraph("Great news — your reservation has been advanced to <strong>Presale</strong> status. This means your interest in the stand has been noted and you are eligible for presale pricing.")}
    ${paragraph("To confirm your allocation, your deposit must be paid and verified.")}
    ${infoTable(rows)}
    ${badge("Presale Active")}
    ${divider()}
    ${data.agentName
      ? paragraph(`Your agent <strong>${data.agentName}</strong> will be in touch with deposit instructions and payment details.`)
      : paragraph("Our accounts team will be in touch with deposit payment instructions.")}
    ${button("Access Your Account", `${BASE}/client`)}
  `;
  return shell(`Presale Confirmed — ${data.developmentName} Stand ${data.standNumber}`, body);
}

// ─── 4b. PRESALE — AGENT NOTIFICATION ────────────────────────────────────────

export function agentPresaleNotificationEmail(data: {
  agentName: string;
  clientName: string;
  standNumber: string;
  developmentName: string;
  reference: string;
  price: string;
  expiresAt: string;
}) {
  const rows: [string, string][] = [
    ["Reference", data.reference],
    ["Client", data.clientName],
    ["Development", data.developmentName],
    ["Stand No.", data.standNumber],
    ["Price", data.price],
    ["Status", "Awaiting Deposit"],
    ["Expires", data.expiresAt],
  ];
  const body = `
    ${heading("New Presale Created")}
    ${subheading("Action required — follow up with client on deposit")}
    ${greeting(data.agentName)}
    ${paragraph(`A presale reservation has been created under your name. Please follow up with <strong>${data.clientName}</strong> regarding their deposit payment.`)}
    ${infoTable(rows)}
    ${badge("Deposit Required", "#dc2626")}
    ${divider()}
    ${paragraph(`<strong style="color:#dc2626;">This reservation expires on ${data.expiresAt}.</strong> Ensure the client pays their deposit promptly to secure the stand.`)}
    ${button("Manage Presale", `${BASE}/agent/presales`)}
  `;
  return shell(`New Presale — ${data.reference}`, body);
}

// ─── 4c. PRESALE — ADMIN NOTIFICATION ────────────────────────────────────────

export function adminPresaleAlertEmail(data: {
  adminName: string;
  clientName: string;
  agentName: string;
  standNumber: string;
  developmentName: string;
  reference: string;
  price: string;
  expiresAt: string;
}) {
  const rows: [string, string][] = [
    ["Reference",   data.reference],
    ["Client",      data.clientName],
    ["Agent",       data.agentName],
    ["Development", data.developmentName],
    ["Stand No.",   data.standNumber],
    ["Price",       data.price],
    ["Status",      "Awaiting Deposit"],
    ["Expires",     data.expiresAt],
  ];
  const body = `
    ${heading("New Presale Created")}
    ${subheading("Admin notification — review and monitor")}
    ${greeting(data.adminName)}
    ${paragraph(`A new presale reservation has been submitted and is awaiting a deposit. Please review the details below.`)}
    ${infoTable(rows)}
    ${badge("Awaiting Deposit", "#4f46e5")}
    ${divider()}
    ${button("View in Admin Portal", `${BASE}/admin/reservations`)}
  `;
  return shell(`New Presale — ${data.reference}`, body);
}

// ─── 4d. SALE COMPLETED — ADMIN NOTIFICATION ─────────────────────────────────

export function adminSaleAlertEmail(data: {
  adminName: string;
  clientName: string;
  agentName: string;
  saleNumber: string;
  standNumber: string;
  developmentName: string;
  purchasePrice: string;
  depositPaid: string;
  depositReference: string;
  outstanding: string;
  monthlyAmount: string;
  months: number;
}) {
  const rows: [string, string][] = [
    ["Sale Number",      data.saleNumber],
    ["Client",           data.clientName],
    ["Agent",            data.agentName],
    ["Development",      data.developmentName],
    ["Stand No.",        data.standNumber],
    ["Purchase Price",   data.purchasePrice],
    ["Deposit Paid",     data.depositPaid],
    ["Receipt / Ref",    data.depositReference],
    ["Outstanding",      data.outstanding],
    ["Monthly Install.", `${data.monthlyAmount} × ${data.months} months`],
  ];
  const body = `
    ${heading("Sale Completed")}
    ${subheading("A presale has been converted to an active sale")}
    ${greeting(data.adminName)}
    ${paragraph(`A new sale has been confirmed. The deposit has been verified and the stand is now allocated to the client.`)}
    ${infoTable(rows)}
    ${badge("Stand Allocated", "#16a34a")}
    ${divider()}
    ${button("View Sales Register", `${BASE}/sysadmin/sales`)}
  `;
  return shell(`Sale Completed — ${data.saleNumber}`, body);
}

// ─── 5. DEPOSIT RECEIVED ─────────────────────────────────────────────────────

export function depositPaidEmail(data: {
  clientName: string;
  saleNumber: string;
  standNumber: string;
  developmentName: string;
  depositAmount: number;
  depositReference: string;
  depositMethod: string;
}) {
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const rows: [string, string][] = [
    ["Sale No.", data.saleNumber],
    ["Development", data.developmentName],
    ["Stand No.", data.standNumber],
    ["Amount Received", fmt.format(data.depositAmount)],
    ["Payment Method", data.depositMethod.replace("_", " ")],
    ["Payment Reference", data.depositReference],
    ["Date", new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
  ];
  const body = `
    ${heading("Deposit Received")}
    ${subheading(`${data.developmentName} — Stand ${data.standNumber}`)}
    ${greeting(data.clientName)}
    ${paragraph("We have received and verified your deposit payment. Thank you — your stand is now being allocated to you.")}
    ${infoTable(rows)}
    ${badge("Payment Verified", "#16a34a")}
    ${divider()}
    ${paragraph("Please retain your payment reference for your records. A formal allocation letter and account statement will follow shortly.")}
    ${button("View Your Account", `${BASE}/client`)}
  `;
  return shell(`Deposit Received — ${data.saleNumber}`, body);
}

// ─── 6. ALLOCATION CONFIRMED ─────────────────────────────────────────────────

export function allocationEmail(data: {
  clientName: string;
  saleNumber: string;
  standNumber: string;
  developmentName: string;
  sizeSqm: number | string;
  purchasePrice: number;
  outstandingBalance: number;
  monthlyAmount?: number;
  paymentMonths?: number;
  setPasswordLink?: string;
}) {
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const rows: [string, string][] = [
    ["Sale No.", data.saleNumber],
    ["Development", data.developmentName],
    ["Stand No.", data.standNumber],
    ["Stand Size", `${data.sizeSqm} sqm`],
    ["Purchase Price", fmt.format(data.purchasePrice)],
    ["Outstanding Balance", fmt.format(data.outstandingBalance)],
    ...(data.monthlyAmount && data.paymentMonths
      ? [["Monthly Installment", fmt.format(data.monthlyAmount)] as [string, string],
         ["Payment Period", `${data.paymentMonths} months`] as [string, string]]
      : []),
    ["Status", "Active"],
  ];
  const body = `
    ${heading("Stand Allocated — Congratulations!")}
    ${subheading(`${data.developmentName} — Stand ${data.standNumber}`)}
    ${greeting(data.clientName)}
    ${paragraph(`Your deposit has been confirmed and <strong>Stand ${data.standNumber}</strong> at <strong>${data.developmentName}</strong> has been formally allocated to you. Welcome to the ${company.shortName} family!`)}
    ${infoTable(rows)}
    ${badge("Stand Allocated", "#16a34a")}
    ${divider()}
    ${data.outstandingBalance > 0
      ? paragraph(`Your outstanding balance of <strong>${fmt.format(data.outstandingBalance)}</strong> is payable as per your agreed installment schedule. Please ensure payments are made on time to avoid penalties.`)
      : paragraph("Your stand has been paid in full. Your title documentation will be processed in due course.")}
    ${paragraph("Our team will be in touch with your sale agreement and title documentation process.")}
    ${divider()}
    ${paragraph('<strong>Your client portal is ready.</strong> Use the button below to set your password and access your account — track installments, download receipts, and view your stand details.')}
    ${data.setPasswordLink
      ? button("Set Your Password & Log In", data.setPasswordLink)
      : button("Log Into Your Account", `${BASE}/login`)}
    ${paragraph(`<span style="color:#6b7280;font-size:12px;">This set-password link expires in 30 days. You can always use <a href="${BASE}/forgot-password" style="color:${ACCENT_COLOR};">Forgot Password</a> to generate a new one.</span>`)}
  `;
  return shell(`Stand Allocated — ${data.developmentName} Stand ${data.standNumber}`, body);
}

// ─── 7. ACCOUNT STATEMENT ────────────────────────────────────────────────────

export function statementEmail(data: {
  clientName: string;
  saleNumber: string;
  standNumber: string;
  developmentName: string;
  statementDate: string;
  purchasePrice: number;
  totalPaid: number;
  outstandingBalance: number;
  payments: { date: string; amount: number; method: string; reference: string }[];
}) {
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const pct = data.purchasePrice > 0
    ? Math.round((data.totalPaid / data.purchasePrice) * 100)
    : 0;

  const paymentRows = data.payments
    .map((p) => `<tr>
      <td style="padding:7px 10px;font-size:12px;color:#374151;border-bottom:1px solid #EDE9E0;">${p.date}</td>
      <td style="padding:7px 10px;font-size:12px;color:#374151;border-bottom:1px solid #EDE9E0;">${fmt.format(p.amount)}</td>
      <td style="padding:7px 10px;font-size:12px;color:#374151;border-bottom:1px solid #EDE9E0;">${p.method.replace("_", " ")}</td>
      <td style="padding:7px 10px;font-size:12px;color:#374151;border-bottom:1px solid #EDE9E0;font-family:monospace;">${p.reference}</td>
    </tr>`)
    .join("");

  const body = `
    ${heading("Account Statement")}
    ${subheading(`${data.developmentName} — Stand ${data.standNumber} &middot; ${data.statementDate}`)}
    ${greeting(data.clientName)}
    ${paragraph(`Please find below your account statement for <strong>Sale ${data.saleNumber}</strong>.`)}
    ${infoTable([
      ["Sale No.", data.saleNumber],
      ["Development", data.developmentName],
      ["Stand No.", data.standNumber],
      ["Purchase Price", fmt.format(data.purchasePrice)],
      ["Total Paid", fmt.format(data.totalPaid)],
      ["Outstanding Balance", fmt.format(data.outstandingBalance)],
      ["% Paid", `${pct}%`],
      ["Statement Date", data.statementDate],
    ])}
    ${data.payments.length > 0 ? `
    ${divider()}
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${BRAND_DARK};">Payment History</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E0DCD0;border-radius:7px;overflow:hidden;">
      <tr style="background:#FFFFFF;">
        <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#6b7280;text-align:left;font-weight:600;border-bottom:1px solid #E0DCD0;">Date</th>
        <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#6b7280;text-align:left;font-weight:600;border-bottom:1px solid #E0DCD0;">Amount</th>
        <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#6b7280;text-align:left;font-weight:600;border-bottom:1px solid #E0DCD0;">Method</th>
        <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#6b7280;text-align:left;font-weight:600;border-bottom:1px solid #E0DCD0;">Reference</th>
      </tr>
      ${paymentRows}
    </table>` : ""}
    ${divider()}
    ${paragraph(`For queries regarding your account, please contact our accounts team at <a href="mailto:${company.accountsEmail}" style="color:${ACCENT_COLOR};">${company.accountsEmail}</a> or call <a href="tel:${company.accountsPhoneTel}" style="color:${ACCENT_COLOR};">${company.accountsPhone}</a>.`)}
    ${button("View Your Account Online", `${BASE}/client`)}
  `;
  return shell(`Account Statement — ${data.saleNumber}`, body);
}

// ─── 8. INSTALLMENT PAYMENT RECEIVED ─────────────────────────────────────────

export function installmentReceivedEmail(data: {
  clientName: string;
  saleNumber: string;
  standNumber: string;
  developmentName: string;
  amount: number;
  reference: string;
  method: string;
  type: string;
  paidAt: string;
  outstandingBalance: number;
}) {
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const rows: [string, string][] = [
    ["Sale No.",          data.saleNumber],
    ["Development",       data.developmentName],
    ["Stand No.",         data.standNumber],
    ["Payment Type",      data.type],
    ["Amount Paid",       fmt.format(data.amount)],
    ["Payment Method",    data.method.replace(/_/g, " ")],
    ["Receipt / Ref",     data.reference],
    ["Date",              data.paidAt],
    ["Outstanding Balance", fmt.format(data.outstandingBalance)],
  ];
  const body = `
    ${heading("Payment Received")}
    ${subheading(`${data.developmentName} — Stand ${data.standNumber}`)}
    ${greeting(data.clientName)}
    ${paragraph(`We have received and verified your payment of <strong>${fmt.format(data.amount)}</strong> against sale <strong>${data.saleNumber}</strong>. Thank you.`)}
    ${infoTable(rows)}
    ${badge("Payment Verified", "#16a34a")}
    ${divider()}
    ${paragraph(`For queries contact <a href='mailto:${company.accountsEmail}' style='color:${ACCENT_COLOR};'>${company.accountsEmail}</a> or call ${company.accountsPhone}.`)}
    ${button("View Your Account", `${BASE}/client`)}
  `;
  return shell(`Payment Received — ${data.saleNumber}`, body);
}

export function adminPaymentAlertEmail(data: {
  adminName: string;
  clientName: string;
  saleNumber: string;
  standNumber: string;
  developmentName: string;
  amount: number;
  reference: string;
  method: string;
  type: string;
  paidAt: string;
  outstandingBalance: number;
  recordedBy: string;
}) {
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const rows: [string, string][] = [
    ["Sale No.",           data.saleNumber],
    ["Client",             data.clientName],
    ["Development",        data.developmentName],
    ["Stand No.",          data.standNumber],
    ["Payment Type",       data.type],
    ["Amount",             fmt.format(data.amount)],
    ["Method",             data.method.replace(/_/g, " ")],
    ["Receipt / Ref",      data.reference],
    ["Date",               data.paidAt],
    ["Outstanding Balance", fmt.format(data.outstandingBalance)],
    ["Recorded By",        data.recordedBy],
  ];
  const body = `
    ${heading("Payment Recorded")}
    ${subheading("An installment payment has been verified and applied")}
    ${greeting(data.adminName)}
    ${paragraph(`A payment of <strong>${fmt.format(data.amount)}</strong> has been recorded for <strong>${data.clientName}</strong> on sale ${data.saleNumber}.`)}
    ${infoTable(rows)}
    ${button("View Sales Register", `${BASE}/sysadmin/sales`)}
  `;
  return shell(`Payment Recorded — ${data.saleNumber}`, body);
}

export function installmentReminderEmail(data: {
  clientName: string;
  saleNumber: string;
  standNumber: string;
  developmentName: string;
  amountDue: number;
  dueDate: string;
  outstandingBalance: number;
  isOverdue: boolean;
  urgency?: "gentle" | "firm" | "urgent" | "final";
  daysOverdue?: number;
}) {
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const isChronic = (data.daysOverdue ?? 0) >= 14;
  const subject = data.isOverdue
    ? isChronic
      ? "Final Overdue Notice — Action Required"
      : (data.daysOverdue ?? 0) >= 7
        ? "Overdue Installment — Second Notice"
        : "Overdue Installment"
    : "Installment Due Soon";

  const rows: [string, string][] = [
    ["Sale No.",           data.saleNumber],
    ["Development",        data.developmentName],
    ["Stand No.",          data.standNumber],
    ["Amount Due",         fmt.format(data.amountDue)],
    ["Due Date",           data.dueDate],
    ["Outstanding Balance", fmt.format(data.outstandingBalance)],
    ...(data.daysOverdue ? [["Days Overdue", String(data.daysOverdue)] as [string, string]] : []),
  ];

  const warningBadge = isChronic
    ? badge("FINAL NOTICE", "#dc2626")
    : data.isOverdue
      ? badge("OVERDUE", data.urgency === "urgent" ? "#dc2626" : "#ea580c")
      : badge("DUE SOON", "#ca8a04");

  const urgencyMessage = isChronic
    ? `<p style="margin:14px 0 0;padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:7px;color:#dc2626;font-size:13px;font-weight:600;">This is your final reminder. Continued non-payment may result in escalation to our legal department.</p>`
    : data.urgency === "urgent"
      ? `<p style="margin:14px 0 0;padding:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:7px;color:#c2410c;font-size:13px;">Your installment is now significantly overdue. Please arrange payment immediately to avoid further escalation.</p>`
      : data.urgency === "firm"
        ? `<p style="margin:14px 0 0;padding:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:7px;color:#b45309;font-size:13px;">Your installment is now overdue. Prompt payment will help you avoid late-payment penalties.</p>`
        : "";

  const body = `
    ${heading(data.isOverdue ? "Installment " + (isChronic ? "Overdue — Final Notice" : (data.urgency === "urgent" ? "Overdue — Second Notice" : "Overdue")) : "Installment Due Reminder")}
    ${subheading(`${data.developmentName} — Stand ${data.standNumber}`)}
    ${greeting(data.clientName)}
    ${paragraph(data.isOverdue
      ? `Your installment of <strong>${fmt.format(data.amountDue)}</strong> for sale <strong>${data.saleNumber}</strong> was due on <strong>${data.dueDate}</strong>${data.daysOverdue ? ` (${data.daysOverdue} day${data.daysOverdue > 1 ? "s" : ""} overdue)` : ""} and has not been received in full.`
      : `This is a reminder that your installment of <strong>${fmt.format(data.amountDue)}</strong> for sale <strong>${data.saleNumber}</strong> is due on <strong>${data.dueDate}</strong>.`
    )}
    ${paragraph(`Outstanding balance: <strong>${fmt.format(data.outstandingBalance)}</strong>`)}
    ${infoTable(rows)}
    ${warningBadge}
    ${urgencyMessage}
    ${divider()}
    ${paragraph(`To make a payment or for queries contact <a href='mailto:${company.accountsEmail}' style='color:${ACCENT_COLOR};'>${company.accountsEmail}</a> or call ${company.accountsPhone}.`)}
    ${button("View Your Account & Make a Payment", `${BASE}/client/submit-payment`)}
  `;
  return shell(`${subject} — ${data.saleNumber}`, body);
}

export function priceUpdateEmail(data: {
  recipientName: string;
  developmentName: string;
  oldPricePerSqm: number;
  newPricePerSqm: number;
  oldDeposit: number;
  newDeposit: number;
  adminFee?: number;
}) {
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

  const rows: [string, string][] = [
    ["Price per sqm", `${fmt.format(data.oldPricePerSqm)} → ${fmt.format(data.newPricePerSqm)}`],
    ["Deposit required", `${fmt.format(data.oldDeposit)} → ${fmt.format(data.newDeposit)}`],
    ...(data.adminFee ? [["Admin fee", fmt.format(data.adminFee)] as [string, string]] : []),
  ];

  const body = `
    ${heading("Price Update")}
    ${subheading(`${data.developmentName} — effective immediately`)}
    ${greeting(data.recipientName)}
    ${paragraph(`Please note the following pricing update for <strong>${data.developmentName}</strong>, effective immediately:`)}
    ${infoTable(rows)}
    ${badge("EFFECTIVE IMMEDIATELY", "#ca8a04")}
    <p style="margin:16px 0 0;padding:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:7px;color:#92400e;font-size:13px;line-height:1.6;">
      This applies to all stands that have <strong>not yet been sold or reserved</strong>. Existing sales and active reservations keep their originally agreed price and deposit. All currently available stands have already been repriced in the system at the new rate.
    </p>
    ${divider()}
    ${paragraph("Please quote the new figures to all new clients and presales going forward.")}
  `;
  return shell(`Price Update — ${data.developmentName}`, body);
}

export function standRemovalEmail(data: {
  recipientName: string;
  developmentName: string;
  standNumbers: string[];
  reason: string;
}) {
  const standRows = data.standNumbers
    .map((standNumber) => `<span style="display:inline-block;margin:0 6px 6px 0;padding:7px 10px;border-radius:6px;background:#FFFFFF;border:1px solid #E0DCD0;color:${BRAND_DARK};font-size:13px;font-weight:700;">Stand ${standNumber}</span>`)
    .join("");

  const body = `
    ${heading("Stand Removal Notice")}
    ${subheading(`${data.developmentName} — inventory update`)}
    ${greeting(data.recipientName)}
    ${paragraph(`The following stands have been removed from active inventory at <strong>${data.developmentName}</strong> and are no longer available for reservation or sale:`)}
    <div style="margin:18px 0 14px;">${standRows}</div>
    <p style="margin:18px 0 0;padding:14px;background:#fffbeb;border:1px solid #fde68a;border-radius:7px;color:#92400e;font-size:13px;line-height:1.6;">
      <strong>Reason:</strong> ${data.reason}
    </p>
    ${divider()}
    ${paragraph("Please update any active prospect discussions and do not offer these stands to clients.")}
  `;

  return shell(`Stand Removal Notice — ${data.developmentName}`, body);
}

// ─── PLATFORM UPDATE ANNOUNCEMENTS ────────────────────────────────────────────

export function groupBuyingAnnouncementEmail(data: {
  recipientName: string;
  role: "AGENT" | "ADMINISTRATOR" | "SYSTEM_ADMIN" | "CEO";
}) {
  const roleNote: Record<typeof data.role, string> = {
    AGENT: `
      ${paragraph("<strong>What this means for you:</strong>")}
      <ul style="margin:0 0 14px;padding-left:20px;color:#374151;font-size:14px;line-height:1.75;">
        <li>Group allocations are created and managed by admin/group administrators, not through your usual presale flow.</li>
        <li>If a church, company, or diaspora association contacts you wanting to buy multiple stands for their members, refer them to an administrator to get a group set up — don't process it as an individual presale.</li>
        <li>Group sales don't currently carry an agent or commission — this is worth flagging to admin if you bring in a group client, so credit can be arranged manually for now.</li>
      </ul>`,
    ADMINISTRATOR: `
      ${paragraph("<strong>Where to find it and how to run one:</strong>")}
      <ul style="margin:0 0 14px;padding-left:20px;color:#374151;font-size:14px;line-height:1.75;">
        <li>New <strong>Group Buying</strong> link in the Admin sidebar, next to Stand Management.</li>
        <li>Creating a group is a 4-step wizard: Create Group → Assign Stands → Bulk Member Import (CSV or Excel — a template download is right there in the step) → Invite Admin & Publish.</li>
        <li>You can save a group as a draft at any point and come back to finish it — nothing is reserved or allocated until you publish.</li>
        <li>Each group gets its own detail page with the member list, deposits collected, outstanding balance, and buttons to invite/replace/remove that group's administrator.</li>
      </ul>`,
    SYSTEM_ADMIN: `
      ${paragraph("<strong>What's new under the hood:</strong>")}
      <ul style="margin:0 0 14px;padding-left:20px;color:#374151;font-size:14px;line-height:1.75;">
        <li>A new <strong>GROUP_ADMIN</strong> role, wired through the schema, middleware, and sidebar — same pattern as every other role.</li>
        <li>A new <code>groups</code> table plus a nullable <code>clients.groupId</code> — group attribution reflects current client state, not a point-in-time snapshot (flagged in the roadmap).</li>
        <li>Two new data-integrity checks: groups without an assigned administrator, and imported members with no reservation or sale yet. Both already show up on <strong>/sysadmin/data-integrity</strong>.</li>
        <li>Stand allocation reuses the existing sale-conversion engine unmodified — no parallel money-path logic was introduced.</li>
      </ul>`,
    CEO: `
      ${paragraph("<strong>The business case:</strong>")}
      <ul style="margin:0 0 14px;padding-left:20px;color:#374151;font-size:14px;line-height:1.75;">
        <li>Opens a new sales channel: churches, companies, cooperatives, and diaspora associations can now buy multiple stands for their members in one coordinated process, instead of one-by-one presales.</li>
        <li>Each group gets its own dashboard — members, stands allocated, deposits collected, and outstanding balance — visible to whoever you assign as that group's administrator.</li>
        <li>Reporting exports (CSV and Excel) are already in place for every group, so treasurers and finance contacts on their side can pull their own numbers.</li>
      </ul>`,
  };

  const body = `
    ${heading("New: Group Buying is live")}
    ${subheading("Organisations can now buy stands for their members in one coordinated flow")}
    ${greeting(data.recipientName)}
    ${paragraph("We've just shipped <strong>Group Buying</strong> — a new module for organisations (churches, companies, cooperatives, diaspora associations) buying multiple stands for their members, alongside a Stand Management overhaul and Excel import/export across the platform.")}

    <div style="margin:20px 0;padding:16px 18px;background:#FFFFFF;border:1px solid #E0DCD0;border-radius:8px;">
      <p style="margin:0 0 8px;color:${BRAND_DARK};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">What's new, in brief</p>
      <ul style="margin:0;padding-left:18px;color:#374151;font-size:14px;line-height:1.75;">
        <li>A 4-step group onboarding wizard: create the group, assign a pool of stands, bulk-import members from CSV or Excel, then invite a group administrator and publish.</li>
        <li>A dedicated Group Dashboard — members, stands allocated, deposits collected, outstanding balance — with CSV and Excel export.</li>
        <li>Full Stand Management: archive/restore, reserve/release, transfer stands to a new owner, bulk edit, and a per-stand history timeline.</li>
        <li>Excel (.xlsx) import and export now available everywhere CSV already was — bulk stand import, group member import, and every report.</li>
      </ul>
    </div>

    ${roleNote[data.role]}

    ${divider()}
    ${paragraph("Questions or something doesn't look right — reply to this thread or reach out directly. This rolled out to production and has been tested end to end, but we'd rather hear about anything odd from you first.")}
  `;
  return shell(`New: Group Buying is live on ${company.shortName}`, body);
}
