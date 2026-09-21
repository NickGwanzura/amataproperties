import path from "path";
import { Document, Page, Text, View, StyleSheet, renderToBuffer, Font } from "@react-pdf/renderer";
import { company } from "@/config";

const GEIST_REGULAR_PATH = path.join(process.cwd(), "public", "fonts", "Geist-Regular.ttf");
const GEIST_SEMIBOLD_PATH = path.join(process.cwd(), "public", "fonts", "Geist-SemiBold.ttf");

Font.register({ family: "Geist", src: GEIST_REGULAR_PATH });
Font.register({ family: "Geist-SemiBold", src: GEIST_SEMIBOLD_PATH });

// Brand palette — Amata Properties
const GOLD        = "#6A0B14";
const GOLD_LIGHT  = "#F3E5D0";
const GOLD_MID    = "#B89050";
const CHARCOAL    = "#6A0B14";
const FOREST_GREEN = "#6A0B14";
const MUTED       = "#5C5A54";
const MUTED_LIGHT = "#8C8980";
const BORDER      = "#E0DCD0";
const WHITE       = "#FFFFFF";
const GREEN       = "#16a34a";
const GREEN_LIGHT = "#f0fdf4";
const GREEN_BORDER= "#bbf7d0";
const RED         = "#dc2626";

const base = StyleSheet.create({
  page: {
    padding: 44,
    fontSize: 10,
    color: CHARCOAL,
    backgroundColor: WHITE,
    fontFamily: "Geist",
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: 2.5,
    borderBottomColor: GOLD,
  },
  logo: { width: 58, height: 58, objectFit: "contain" },
  headerRight: { marginLeft: 16, flex: 1, alignItems: "flex-end" },
  headerCompany: { fontSize: 15, fontFamily: "Geist-SemiBold", color: FOREST_GREEN, letterSpacing: 0.3 },
  headerSub: { fontSize: 7.5, color: MUTED_LIGHT, marginTop: 3, letterSpacing: 2 },
  headerContact: { fontSize: 7, color: MUTED_LIGHT, marginTop: 5, textAlign: "right" },

  // ── Title block ──
  titleBlock: { marginBottom: 18 },
  docTitle: { fontSize: 22, fontFamily: "Geist-SemiBold", color: CHARCOAL },
  docMeta: { fontSize: 8.5, color: MUTED, marginTop: 4, letterSpacing: 0.3 },

  // ── Field label/value ──
  section: { marginBottom: 10 },
  label: { fontSize: 7.5, color: MUTED_LIGHT, marginBottom: 2.5, letterSpacing: 1.2, fontFamily: "Geist-SemiBold" },
  value: { fontSize: 11, color: CHARCOAL, fontFamily: "Geist" },

  // ── Summary box ──
  summaryBox: {
    backgroundColor: GOLD_LIGHT,
    border: 1,
    borderColor: BORDER,
    borderRadius: 5,
    padding: 16,
    marginBottom: 18,
  },
  summaryTitle: { fontSize: 8, fontFamily: "Geist-SemiBold", color: GOLD, marginBottom: 12, letterSpacing: 1.5 },

  // ── KPI row ──
  kpiRow: { flexDirection: "row", gap: 8 },
  kpiBox: {
    flex: 1,
    backgroundColor: WHITE,
    border: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 10,
    borderLeft: 3,
    borderLeftColor: GOLD,
  },
  kpiValue: { fontSize: 16, fontFamily: "Geist-SemiBold", color: CHARCOAL },
  kpiLabel: { fontSize: 7, color: MUTED_LIGHT, marginTop: 4, letterSpacing: 0.5 },

  // ── Table ──
  table: { marginTop: 4 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: CHARCOAL,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  tableHeaderText: { fontSize: 7.5, fontFamily: "Geist-SemiBold", color: WHITE, letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", borderBottom: 1, borderBottomColor: BORDER, paddingVertical: 6, paddingHorizontal: 8 },
  tableRowAlt: { flexDirection: "row", borderBottom: 1, borderBottomColor: BORDER, paddingVertical: 6, paddingHorizontal: 8, backgroundColor: "#FAFAF8" },
  tableRowTotal: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 8,
    backgroundColor: CHARCOAL,
    borderRadius: 3,
    marginTop: 2,
  },
  tableRowTotalText: { fontSize: 9, fontFamily: "Geist-SemiBold", color: WHITE },
  cellDev: { flex: 2, fontSize: 9, color: CHARCOAL },
  cell: { flex: 1, textAlign: "right", fontSize: 8.5, color: CHARCOAL },
  cellLeft: { flex: 1, textAlign: "left", fontSize: 8.5, color: CHARCOAL },
  cellTotal: { flex: 1, textAlign: "right", fontSize: 8.5, fontFamily: "Geist-SemiBold", color: CHARCOAL },

  // ── Footer ──
  footer: {
    marginTop: "auto",
    paddingTop: 12,
    borderTop: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 7.5, color: MUTED_LIGHT },
  footerBadge: {
    fontSize: 7,
    color: WHITE,
    backgroundColor: GOLD,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 2,
    letterSpacing: 0.8,
    fontFamily: "Geist-SemiBold",
  },
});

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Header() {
  return (
    <View style={base.header}>
      <View style={base.logo}>
        <Text style={{ color: GOLD, fontSize: 28, fontFamily: "Geist-SemiBold", textAlign: "center" }}>A</Text>
      </View>
      <View style={base.headerRight}>
        <Text style={base.headerCompany}>Amata Properties</Text>
        <Text style={base.headerSub}>PROPERTY MANAGEMENT · ZIMBABWE</Text>
        <Text style={base.headerContact}>
          {company.accountsEmail}  ·  {company.accountsPhone}
        </Text>
      </View>
    </View>
  );
}

function Footer({ label }: { label: string }) {
  return (
    <View style={base.footer} fixed>
      <Text style={base.footerText}>
        50 Greendale Avenue, Greendale, Zimbabwe  ·  © {new Date().getFullYear()} Amata Properties
      </Text>
      <Text style={base.footerBadge}>{label}</Text>
    </View>
  );
}

function SectionHeading({ text }: { text: string }) {
  return (
    <View style={{ marginBottom: 10, borderBottom: 1, borderBottomColor: BORDER, paddingBottom: 6 }}>
      <Text style={{ fontSize: 8, fontFamily: "Geist-SemiBold", color: GOLD, letterSpacing: 1.5 }}>
        {text}
      </Text>
    </View>
  );
}

// ── RESERVATION FORM ──────────────────────────────────────────────────────────

export async function createReservationPdf(input: {
  reference: string;
  clientName: string;
  developmentName: string;
  standNumber: string;
  price: string;
}) {
  return renderToBuffer(
    <Document>
      <Page size="A4" style={base.page}>
        <Header />

        <View style={base.titleBlock}>
          <Text style={base.docTitle}>Reservation Form</Text>
          <Text style={base.docMeta}>
            Issued {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </View>

        <View style={base.summaryBox}>
          <Text style={base.summaryTitle}>RESERVATION DETAILS</Text>
          <View style={{ flexDirection: "row", gap: 28 }}>
            <View style={{ flex: 1 }}>
              <View style={base.section}>
                <Text style={base.label}>REFERENCE</Text>
                <Text style={[base.value, { fontFamily: "Geist-SemiBold" }]}>{input.reference}</Text>
              </View>
              <View style={base.section}>
                <Text style={base.label}>CLIENT</Text>
                <Text style={base.value}>{input.clientName}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <View style={base.section}>
                <Text style={base.label}>DEVELOPMENT</Text>
                <Text style={base.value}>{input.developmentName}</Text>
              </View>
              <View style={base.section}>
                <Text style={base.label}>STAND NUMBER</Text>
                <Text style={[base.value, { fontFamily: "Geist-SemiBold" }]}>{input.standNumber}</Text>
              </View>
            </View>
          </View>

          <View style={{
            borderTop: 1,
            borderTopColor: BORDER,
            paddingTop: 12,
            marginTop: 6,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}>
            <View style={{ flex: 2 }}>
              <Text style={base.label}>PURCHASE PRICE</Text>
              <Text style={[base.value, { fontSize: 20, fontFamily: "Geist-SemiBold", color: GOLD }]}>
                {input.price}
              </Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: WHITE,
              border: 1,
              borderColor: BORDER,
              borderRadius: 4,
              padding: 10,
              borderLeft: 3,
              borderLeftColor: GOLD,
            }}>
              <Text style={{ fontSize: 7.5, color: MUTED_LIGHT, fontFamily: "Geist-SemiBold", letterSpacing: 1 }}>
                STATUS
              </Text>
              <Text style={{ fontSize: 10, fontFamily: "Geist-SemiBold", color: "#ca8a04", marginTop: 3 }}>
                Reservation
              </Text>
            </View>
          </View>
        </View>

        <View style={{ fontSize: 8, color: MUTED, marginTop: 8 }}>
          <Text>
            This reservation form confirms your interest in the above stand. For queries contact{" "}
            {company.accountsEmail} or {company.accountsPhone}.
          </Text>
        </View>

        <Footer label="RESERVATION FORM" />
      </Page>
    </Document>
  );
}

// ── PAYMENT RECEIPT ───────────────────────────────────────────────────────────

export async function createReceiptPdf(input: {
  reference: string;
  receiptNumber: string;
  date: string;
  clientName: string;
  nationalId: string;
  developmentName: string;
  standNumber: string;
  type: string;
  method: string;
  amount: string;
  saleNumber: string;
}) {
  return renderToBuffer(
    <Document>
      <Page size="A4" style={base.page}>
        <Header />

        {/* Title + PAYMENT CONFIRMED banner */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 18, gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={base.docTitle}>Payment Receipt</Text>
            <Text style={base.docMeta}>
              Receipt No. {input.receiptNumber}  ·  Issued {input.date}
            </Text>
            <Text style={[base.docMeta, { marginTop: 2 }]}>Sale: {input.saleNumber}</Text>
          </View>
          {/* PAID stamp */}
          <View style={{
            backgroundColor: GREEN,
            borderRadius: 5,
            paddingHorizontal: 14,
            paddingVertical: 10,
            alignItems: "center",
          }}>
            <Text style={{ fontSize: 14, fontFamily: "Geist-SemiBold", color: WHITE, letterSpacing: 1 }}>
              PAID
            </Text>
            <Text style={{ fontSize: 7, color: "#bbf7d0", marginTop: 2, letterSpacing: 0.5 }}>
              VERIFIED
            </Text>
          </View>
        </View>

        {/* Client + stand details */}
        <View style={base.summaryBox}>
          <Text style={base.summaryTitle}>PAYMENT DETAILS</Text>
          <View style={{ flexDirection: "row", gap: 28, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <View style={base.section}>
                <Text style={base.label}>CLIENT NAME</Text>
                <Text style={base.value}>{input.clientName}</Text>
              </View>
              <View style={base.section}>
                <Text style={base.label}>NATIONAL ID</Text>
                <Text style={base.value}>{input.nationalId}</Text>
              </View>
              <View style={base.section}>
                <Text style={base.label}>TRANSACTION REFERENCE</Text>
                <Text style={[base.value, { fontFamily: "Geist-SemiBold" }]}>{input.reference}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <View style={base.section}>
                <Text style={base.label}>DEVELOPMENT</Text>
                <Text style={base.value}>{input.developmentName}</Text>
              </View>
              <View style={base.section}>
                <Text style={base.label}>STAND NUMBER</Text>
                <Text style={[base.value, { fontFamily: "Geist-SemiBold" }]}>{input.standNumber}</Text>
              </View>
              <View style={base.section}>
                <Text style={base.label}>PAYMENT TYPE</Text>
                <Text style={base.value}>{input.type}</Text>
              </View>
            </View>
          </View>

          {/* Amount + method highlight */}
          <View style={{
            borderTop: 1,
            borderTopColor: BORDER,
            paddingTop: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 20,
          }}>
            <View style={{ flex: 2 }}>
              <Text style={base.label}>AMOUNT PAID</Text>
              <Text style={{ fontSize: 28, fontFamily: "Geist-SemiBold", color: GOLD, marginTop: 2 }}>
                {input.amount}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={base.label}>PAYMENT METHOD</Text>
              <Text style={[base.value, { fontSize: 13, fontFamily: "Geist-SemiBold" }]}>{input.method}</Text>
            </View>
          </View>
        </View>

        {/* Verified banner */}
        <View style={{
          backgroundColor: GREEN_LIGHT,
          border: 1,
          borderColor: GREEN_BORDER,
          borderRadius: 4,
          padding: 12,
          borderLeft: 3,
          borderLeftColor: GREEN,
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: 8.5, fontFamily: "Geist-SemiBold", color: "#15803d" }}>
            PAYMENT VERIFIED
          </Text>
          <Text style={{ fontSize: 8, color: "#166534", marginTop: 3 }}>
            This receipt confirms your payment has been received and processed by Amata Properties. Please retain this document for your records.
          </Text>
        </View>

        {/* Contact */}
        <View style={{ fontSize: 8, color: MUTED }}>
          <Text>
            For queries, contact {company.accountsEmail} or call {company.accountsPhone}.
          </Text>
          <Text style={{ marginTop: 3 }}>50 Greendale Avenue, Greendale, Zimbabwe</Text>
        </View>

        <Footer label="PAYMENT RECEIPT" />
      </Page>
    </Document>
  );
}

// ── ACCOUNT STATEMENT ─────────────────────────────────────────────────────────

export async function createStatementPdf(input: {
  clientName: string;
  nationalId: string;
  saleNumber: string;
  developmentName: string;
  standNumber: string;
  purchasePrice: number;
  depositPaid: number;
  outstandingBalance: number;
  statementDate: string;
  payments: { date: string; reference: string; type: string; method: string; amount: number; status: string }[];
  installmentPlan?: {
    monthlyAmount: number;
    months: number;
    startDate: string; // ISO string (raw from DB)
    nextDueDate?: string | null; // ISO string of first row that still has balance
    nextDueAmount?: number | null; // amount still owed on that row (less than monthly when partial)
    installmentsPaid?: number; // count of fully-paid installment rows
    installments?: {
      sequence: number;
      dueDate: string;
      amountDue: number;
      amountPaid: number;
      paidAt?: string | null;
    }[];
  };
}) {
  const isAdjustment = (type: string) => type === "Adjustment" || type === "ADJUSTMENT" || type === "Admin Fee";
  const isInstallment = (type: string) => type === "Installment" || type === "INSTALLMENT";
  const verifiedPropertyPayments = input.payments
    .filter((p) => p.status === "VERIFIED" && !isAdjustment(p.type))
    .reduce((s, p) => s + p.amount, 0);
  const ledgerPaidTowardProperty = Math.max(input.depositPaid, verifiedPropertyPayments);
  const ledgerOutstandingBalance = Math.max(0, input.purchasePrice - ledgerPaidTowardProperty);
  const effectiveOutstandingBalance = Math.abs(ledgerOutstandingBalance - input.outstandingBalance) > 0.01
    ? ledgerOutstandingBalance
    : input.outstandingBalance;
  const totalPaidTowardProperty = Math.max(0, input.purchasePrice - effectiveOutstandingBalance);
  const adminFees = input.payments
    .filter((p) => p.status === "VERIFIED" && isAdjustment(p.type))
    .reduce((s, p) => s + p.amount, 0);
  const totalPaid = totalPaidTowardProperty;
  const progressPct = input.purchasePrice > 0
    ? Math.min(100, Math.round((totalPaidTowardProperty / input.purchasePrice) * 100))
    : 0;

  // ── Running balance (only DEPOSIT + INSTALLMENT reduce the property balance) ──
  let runningBalance = input.purchasePrice;
  const paymentsWithBalance = input.payments.map((p) => {
    const affectsBalance = p.status === "VERIFIED" && !isAdjustment(p.type);
    if (affectsBalance) runningBalance = Math.max(0, runningBalance - p.amount);
    return { ...p, balance: affectsBalance ? runningBalance : null };
  });

  // ── Installment plan calculations ──
  let installmentsPaidCount = 0;
  let nextDueLabel: string | null = null;
  let remainingMonths = 0;

  if (input.installmentPlan) {
    installmentsPaidCount = input.installmentPlan.installmentsPaid ?? input.payments.filter(
      (p) => p.status === "VERIFIED" && isInstallment(p.type)
    ).length;
    remainingMonths = Math.max(0, input.installmentPlan.months - installmentsPaidCount);

    if (remainingMonths > 0) {
      let nextDue: Date;
      if (input.installmentPlan.nextDueDate) {
        nextDue = new Date(input.installmentPlan.nextDueDate);
      } else {
        const startDate = new Date(input.installmentPlan.startDate);
        nextDue = new Date(startDate);
        nextDue.setMonth(nextDue.getMonth() + installmentsPaidCount + 1);
      }
      const today = new Date();
      const isOverdue = nextDue < today;
      nextDueLabel = isOverdue
        ? `OVERDUE (was ${nextDue.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })})`
        : nextDue.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    } else {
      nextDueLabel = "Fully Paid";
    }
  }

  const installmentScheduleChunks: NonNullable<NonNullable<typeof input.installmentPlan>["installments"]>[] = [];
  for (const [index, installment] of (input.installmentPlan?.installments ?? []).entries()) {
    const chunkIndex = Math.floor(index / 24);
    (installmentScheduleChunks[chunkIndex] ??= []).push(installment);
  }

  return renderToBuffer(
    <Document>
      <Page size="A4" style={base.page}>
        <Header />

        {/* Title */}
        <View style={base.titleBlock}>
          <Text style={base.docTitle}>Account Statement</Text>
          <Text style={base.docMeta}>
            Statement Date: {input.statementDate}  ·  Sale: {input.saleNumber}
          </Text>
        </View>

        {/* Account summary box */}
        <View style={base.summaryBox}>
          <Text style={base.summaryTitle}>ACCOUNT SUMMARY</Text>

          {/* Client / stand info */}
          <View style={{ flexDirection: "row", gap: 28, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <View style={base.section}>
                <Text style={base.label}>CLIENT</Text>
                <Text style={[base.value, { fontFamily: "Geist-SemiBold" }]}>{input.clientName}</Text>
              </View>
              <View style={base.section}>
                <Text style={base.label}>NATIONAL ID</Text>
                <Text style={base.value}>{input.nationalId}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <View style={base.section}>
                <Text style={base.label}>DEVELOPMENT</Text>
                <Text style={base.value}>{input.developmentName}</Text>
              </View>
              <View style={base.section}>
                <Text style={base.label}>STAND</Text>
                <Text style={[base.value, { fontFamily: "Geist-SemiBold" }]}>{input.standNumber}</Text>
              </View>
            </View>
          </View>

          {/* KPI row */}
          <View style={base.kpiRow}>
            <View style={base.kpiBox}>
              <Text style={base.kpiValue}>{fmt(input.purchasePrice)}</Text>
              <Text style={base.kpiLabel}>PURCHASE PRICE</Text>
            </View>
            <View style={[base.kpiBox, { borderLeftColor: GREEN }]}>
              <Text style={[base.kpiValue, { color: GREEN }]}>{fmt(totalPaid)}</Text>
              <Text style={base.kpiLabel}>TOTAL PAID</Text>
              {adminFees > 0 && (
                <Text style={{ fontSize: 6.5, color: "#ca8a04", marginTop: 3, fontFamily: "Geist-SemiBold" }}>
                  + {fmt(adminFees)} ADMIN FEE PAID ✓
                </Text>
              )}
            </View>
            <View style={[base.kpiBox, { borderLeftColor: effectiveOutstandingBalance > 0 ? RED : GREEN }]}>
              <Text style={[base.kpiValue, { color: effectiveOutstandingBalance > 0 ? RED : GREEN }]}>
                {fmt(effectiveOutstandingBalance)}
              </Text>
              <Text style={base.kpiLabel}>OUTSTANDING</Text>
            </View>
            {adminFees > 0 ? (
              <View style={[base.kpiBox, { borderLeftColor: "#ca8a04" }]}>
                <Text style={[base.kpiValue, { color: "#ca8a04" }]}>{fmt(adminFees)}</Text>
                <Text style={base.kpiLabel}>ADMIN FEES</Text>
              </View>
            ) : (
            <View style={base.kpiBox}>
              <Text style={[base.kpiValue, { color: progressPct >= 100 ? GREEN : CHARCOAL }]}>
                {progressPct}%
              </Text>
              <Text style={base.kpiLabel}>PAID</Text>
              {/* Progress bar */}
              <View style={{ height: 4, backgroundColor: BORDER, borderRadius: 2, marginTop: 5, overflow: "hidden" }}>
                <View style={{
                  height: 4,
                  backgroundColor: progressPct >= 100 ? GREEN : GOLD,
                  borderRadius: 2,
                  width: `${progressPct}%`,
                }} />
              </View>
            </View>
            )}
          </View>
        </View>

        {/* Payment history table */}
        <SectionHeading text="PAYMENT HISTORY" />
        <View style={base.table}>
          <View style={base.tableHeader}>
            <Text style={[base.tableHeaderText, { flex: 1.3 }]}>Date</Text>
            <Text style={[base.tableHeaderText, { flex: 1.6 }]}>Reference</Text>
            <Text style={[base.tableHeaderText, { flex: 1 }]}>Type</Text>
            <Text style={[base.tableHeaderText, { flex: 1.2 }]}>Method</Text>
            <Text style={[base.tableHeaderText, { flex: 1, textAlign: "right" }]}>Amount</Text>
            <Text style={[base.tableHeaderText, { flex: 0.8, textAlign: "center" }]}>Status</Text>
            <Text style={[base.tableHeaderText, { flex: 1.2, textAlign: "right" }]}>Balance</Text>
          </View>

          {paymentsWithBalance.length === 0 && (
            <View style={[base.tableRow, { justifyContent: "center" }]}>
              <Text style={{ fontSize: 8.5, color: MUTED_LIGHT, paddingVertical: 4 }}>
                No payments recorded yet.
              </Text>
            </View>
          )}

          {paymentsWithBalance.map((p, i) => {
            const isAdj = isAdjustment(p.type);
            const rowStyle = isAdj
              ? [base.tableRowAlt, { borderLeftColor: GOLD_MID, borderLeft: 2 }]
              : (i % 2 === 1 ? base.tableRowAlt : base.tableRow);
            const statusColor = p.status === "VERIFIED" ? GREEN : "#ca8a04";
            return (
              <View key={`${p.reference}-${i}`} style={rowStyle} wrap={false}>
                <Text style={[base.cellLeft, { flex: 1.3 }]}>{p.date}</Text>
                <Text style={[base.cellLeft, { flex: 1.6 }]}>{p.reference}</Text>
                <Text style={[base.cellLeft, { flex: 1, color: isAdj ? MUTED : CHARCOAL }]}>{p.type}</Text>
                <Text style={[base.cellLeft, { flex: 1.2, color: MUTED }]}>{p.method}</Text>
                <Text style={[base.cell, { flex: 1, fontFamily: "Geist-SemiBold" }]}>{fmt(p.amount)}</Text>
                <Text style={[base.cell, { flex: 0.8, color: statusColor, fontSize: 7.5 }]}>
                  {p.status === "VERIFIED" ? "Paid" : "Pending"}
                </Text>
                <Text style={[base.cell, { flex: 1.2, color: p.balance !== null ? CHARCOAL : MUTED_LIGHT }]}>
                  {p.balance !== null ? fmt(p.balance) : "—"}
                </Text>
              </View>
            );
          })}

          {/* Total row */}
          <View style={base.tableRowTotal} wrap={false}>
            <Text style={[base.tableRowTotalText, { flex: 1.3 }]}> </Text>
            <Text style={[base.tableRowTotalText, { flex: 1.6 }]}>TOTAL PAID TO DATE</Text>
            <Text style={[base.tableRowTotalText, { flex: 1 }]}> </Text>
            <Text style={[base.tableRowTotalText, { flex: 1.2 }]}> </Text>
            <Text style={[base.tableRowTotalText, { flex: 1, textAlign: "right", color: GOLD }]}>
              {fmt(totalPaidTowardProperty)}
            </Text>
            <Text style={[base.tableRowTotalText, { flex: 0.8 }]}> </Text>
            <Text style={[base.tableRowTotalText, { flex: 1.2, textAlign: "right", color: effectiveOutstandingBalance > 0 ? RED : GREEN }]}>
              {fmt(effectiveOutstandingBalance)}
            </Text>
          </View>
        </View>

        {/* Installment plan summary */}
        {input.installmentPlan && (
          <View style={{ marginTop: 16, backgroundColor: GOLD_LIGHT, border: 1, borderColor: BORDER, borderRadius: 5, padding: 14 }}>
            <Text style={[base.summaryTitle, { marginBottom: 10 }]}>INSTALLMENT PLAN</Text>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View style={base.kpiBox}>
                <Text style={[base.kpiValue, { fontSize: 14, color: GOLD }]}>
                  {fmt(input.installmentPlan.monthlyAmount)}
                </Text>
                <Text style={base.kpiLabel}>MONTHLY INSTALLMENT</Text>
              </View>
              <View style={base.kpiBox}>
                <Text style={base.kpiValue}>{installmentsPaidCount} / {input.installmentPlan.months}</Text>
                <Text style={base.kpiLabel}>INSTALLMENTS PAID</Text>
              </View>
              <View style={[base.kpiBox, { flex: 1.5 }]}>
                <Text style={[base.kpiValue, { fontSize: 12 }]}>
                  {remainingMonths > 0 ? `${remainingMonths} months` : "Complete"}
                </Text>
                <Text style={base.kpiLabel}>REMAINING</Text>
              </View>
              <View style={[base.kpiBox, { flex: 2, borderLeftColor: nextDueLabel?.startsWith("OVERDUE") ? RED : GOLD }]}>
                <Text style={[base.kpiValue, { fontSize: 10, color: nextDueLabel?.startsWith("OVERDUE") ? RED : CHARCOAL }]}>
                  {nextDueLabel}
                </Text>
                <Text style={base.kpiLabel}>NEXT PAYMENT DUE</Text>
                {input.installmentPlan.nextDueAmount != null &&
                  input.installmentPlan.nextDueAmount < input.installmentPlan.monthlyAmount - 0.005 && (
                  <Text style={{ fontSize: 6.5, color: "#ca8a04", marginTop: 3, fontFamily: "Geist-SemiBold" }}>
                    PARTIALLY PAID — {fmt(input.installmentPlan.nextDueAmount)} REMAINING
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {installmentScheduleChunks.map((schedule, chunkIndex) => (
          <View key={`installment-schedule-${chunkIndex}`} break style={{ marginTop: 16 }}>
            <SectionHeading text={chunkIndex === 0 ? "INSTALLMENT SCHEDULE" : "INSTALLMENT SCHEDULE (CONTINUED)"} />
            <View style={base.table}>
              <View style={base.tableHeader}>
                <Text style={[base.tableHeaderText, { flex: 0.7 }]}>No.</Text>
                <Text style={[base.tableHeaderText, { flex: 1.5 }]}>Due date</Text>
                <Text style={[base.tableHeaderText, { flex: 1.2, textAlign: "right" }]}>Due</Text>
                <Text style={[base.tableHeaderText, { flex: 1.2, textAlign: "right" }]}>Paid</Text>
                <Text style={[base.tableHeaderText, { flex: 1.4, textAlign: "right" }]}>Remaining</Text>
                <Text style={[base.tableHeaderText, { flex: 1.2, textAlign: "right" }]}>Status</Text>
              </View>
              {schedule.map((installment, index) => {
                const remaining = Math.max(0, installment.amountDue - installment.amountPaid);
                const status = remaining <= 0.005
                  ? "Paid"
                  : installment.amountPaid > 0
                    ? "Partial"
                    : new Date(installment.dueDate) < new Date() ? "Overdue" : "Upcoming";
                const tone = status === "Paid" ? GREEN : status === "Overdue" ? RED : status === "Partial" ? "#ca8a04" : MUTED;
                return (
                  <View key={installment.sequence} style={index % 2 ? base.tableRowAlt : base.tableRow} wrap={false}>
                    <Text style={[base.cellLeft, { flex: 0.7 }]}>{installment.sequence}</Text>
                    <Text style={[base.cellLeft, { flex: 1.5 }]}>{new Date(installment.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</Text>
                    <Text style={[base.cell, { flex: 1.2 }]}>{fmt(installment.amountDue)}</Text>
                    <Text style={[base.cell, { flex: 1.2, color: installment.amountPaid > 0 ? GREEN : MUTED_LIGHT }]}>{installment.amountPaid > 0 ? fmt(installment.amountPaid) : "—"}</Text>
                    <Text style={[base.cell, { flex: 1.4, fontFamily: "Geist-SemiBold" }]}>{fmt(remaining)}</Text>
                    <Text style={[base.cell, { flex: 1.2, color: tone, fontFamily: "Geist-SemiBold", fontSize: 7.5 }]}>{status}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Contact footer */}
        <View style={{ marginTop: 14, fontSize: 7.5, color: MUTED }}>
          <Text>
            For queries: {company.accountsEmail}  ·  {company.accountsPhone}  ·  50 Greendale Avenue, Greendale, Zimbabwe
          </Text>
          <Text style={{ marginTop: 3, color: MUTED_LIGHT }}>
            This statement is computer-generated and reflects all transactions recorded as of {input.statementDate}.
          </Text>
        </View>

        <Footer label="ACCOUNT STATEMENT" />
      </Page>
    </Document>
  );
}

// ── INSTALLMENT REVENUE REPORT ────────────────────────────────────────────────

export async function generateInstallmentRevenuePdf(input: {
  summary: { totalCollected: number; totalExpected: number; collectionRate: number; overdueInstallments: number; activePlans: number };
  collected: { monthKey: string; developmentId: string; developmentName: string; collected: number }[];
  developments: { id: string; name: string }[];
}) {
  const { summary, collected, developments } = input;

  const monthSet = new Set<string>();
  for (const r of collected) monthSet.add(r.monthKey);
  const months = Array.from(monthSet).sort((a, b) =>
    new Date(a + " 01").getTime() - new Date(b + " 01").getTime()
  );

  const collectedMap = new Map<string, number>();
  for (const r of collected) {
    collectedMap.set(`${r.developmentId}::${r.monthKey}`, r.collected);
  }

  const devRows = developments
    .map((dev) => {
      const monthly = months.map((m) => collectedMap.get(`${dev.id}::${m}`) ?? 0);
      const rowTotal = monthly.reduce((s, v) => s + v, 0);
      return { name: dev.name, monthly, rowTotal };
    })
    .filter((r) => r.rowTotal > 0);

  const colTotals = months.map((_, mi) => devRows.reduce((s, row) => s + row.monthly[mi], 0));
  const grandTotal = colTotals.reduce((s, v) => s + v, 0);

  const fmtK = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`);

  return renderToBuffer(
    <Document>
      <Page size="A4" style={base.page} orientation="landscape">
        <Header />

        <View style={base.titleBlock}>
          <Text style={base.docTitle}>Installment Revenue Report</Text>
          <Text style={base.docMeta}>
            Generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </View>

        {/* KPIs */}
        <View style={base.summaryBox}>
          <Text style={base.summaryTitle}>PERFORMANCE SUMMARY</Text>
          <View style={base.kpiRow}>
            <View style={[base.kpiBox, { borderLeftColor: GREEN }]}>
              <Text style={[base.kpiValue, { color: GREEN }]}>{fmtK(summary.totalCollected)}</Text>
              <Text style={base.kpiLabel}>REVENUE COLLECTED</Text>
            </View>
            <View style={base.kpiBox}>
              <Text style={base.kpiValue}>{fmtK(summary.totalExpected)}</Text>
              <Text style={base.kpiLabel}>EXPECTED REVENUE</Text>
            </View>
            <View style={[base.kpiBox, { borderLeftColor: summary.collectionRate >= 0.8 ? GREEN : RED }]}>
              <Text style={[base.kpiValue, { color: summary.collectionRate >= 0.8 ? GREEN : RED }]}>
                {(summary.collectionRate * 100).toFixed(1)}%
              </Text>
              <Text style={base.kpiLabel}>COLLECTION RATE</Text>
            </View>
            <View style={base.kpiBox}>
              <Text style={base.kpiValue}>{summary.activePlans}</Text>
              <Text style={base.kpiLabel}>ACTIVE PLANS</Text>
            </View>
            <View style={[base.kpiBox, { borderLeftColor: summary.overdueInstallments > 0 ? RED : GREEN }]}>
              <Text style={[base.kpiValue, { color: summary.overdueInstallments > 0 ? RED : CHARCOAL }]}>
                {summary.overdueInstallments}
              </Text>
              <Text style={base.kpiLabel}>OVERDUE INSTALLMENTS</Text>
            </View>
          </View>
        </View>

        {/* Monthly table */}
        <View style={base.table}>
          <View style={base.tableHeader}>
            <Text style={[base.tableHeaderText, { flex: 2 }]}>Development</Text>
            {months.map((m) => (
              <Text key={m} style={[base.tableHeaderText, { flex: 1, textAlign: "right" }]}>
                {m.replace(" ", "\n")}
              </Text>
            ))}
            <Text style={[base.tableHeaderText, { flex: 1, textAlign: "right" }]}>Total</Text>
          </View>

          {devRows.map((row, i) => (
            <View key={row.name} style={i % 2 === 1 ? base.tableRowAlt : base.tableRow} wrap={false}>
              <Text style={base.cellDev}>{row.name}</Text>
              {row.monthly.map((v, mi) => (
                <Text key={`${row.name}-${months[mi]}`} style={base.cell}>
                  {v > 0 ? fmtK(v) : "—"}
                </Text>
              ))}
              <Text style={base.cellTotal}>{fmtK(row.rowTotal)}</Text>
            </View>
          ))}

          <View style={base.tableRowTotal} wrap={false}>
            <Text style={[base.tableRowTotalText, { flex: 2 }]}>TOTAL</Text>
            {colTotals.map((v, mi) => (
              <Text key={`total-${months[mi]}`} style={[base.tableRowTotalText, { flex: 1, textAlign: "right" }]}>
                {v > 0 ? fmtK(v) : "—"}
              </Text>
            ))}
            <Text style={[base.tableRowTotalText, { flex: 1, textAlign: "right", color: GOLD }]}>
              {fmtK(grandTotal)}
            </Text>
          </View>
        </View>

        <Footer label="CONFIDENTIAL" />
      </Page>
    </Document>
  );
}

// ── SALES REPORT ──────────────────────────────────────────────────────────────

export async function generateSalesReportPdf(input: {
  sales: {
    saleNumber: string;
    status: string;
    clientName: string;
    developmentName: string;
    standNumber: string;
    agentName: string;
    purchasePrice: number;
    depositPaid: number;
    outstandingBalance: number;
  }[];
}) {
  const { sales } = input;

  const totalRevenue = sales.reduce((s, r) => s + r.purchasePrice, 0);
  const totalCollected = sales.reduce((s, r) => s + r.depositPaid, 0);
  const totalOutstanding = sales.reduce((s, r) => s + r.outstandingBalance, 0);
  const activeCount = sales.filter((s) => s.status === "ACTIVE").length;

  const fmtK = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`);

  return renderToBuffer(
    <Document>
      <Page size="A4" style={base.page} orientation="landscape">
        <Header />

        <View style={base.titleBlock}>
          <Text style={base.docTitle}>Current Sales Report</Text>
          <Text style={base.docMeta}>
            Generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </View>

        <View style={base.summaryBox}>
          <Text style={base.summaryTitle}>PERFORMANCE SUMMARY</Text>
          <View style={base.kpiRow}>
            <View style={base.kpiBox}>
              <Text style={base.kpiValue}>{sales.length}</Text>
              <Text style={base.kpiLabel}>TOTAL SALES</Text>
            </View>
            <View style={[base.kpiBox, { borderLeftColor: GREEN }]}>
              <Text style={[base.kpiValue, { color: GREEN }]}>{activeCount}</Text>
              <Text style={base.kpiLabel}>ACTIVE SALES</Text>
            </View>
            <View style={base.kpiBox}>
              <Text style={base.kpiValue}>{fmtK(totalRevenue)}</Text>
              <Text style={base.kpiLabel}>TOTAL SALE VALUE</Text>
            </View>
            <View style={[base.kpiBox, { borderLeftColor: GREEN }]}>
              <Text style={[base.kpiValue, { color: GREEN }]}>{fmtK(totalCollected)}</Text>
              <Text style={base.kpiLabel}>COLLECTED</Text>
            </View>
            <View style={[base.kpiBox, { borderLeftColor: totalOutstanding > 0 ? RED : GREEN }]}>
              <Text style={[base.kpiValue, { color: totalOutstanding > 0 ? RED : GREEN }]}>
                {fmtK(totalOutstanding)}
              </Text>
              <Text style={base.kpiLabel}>OUTSTANDING</Text>
            </View>
          </View>
        </View>

        <View style={base.table}>
          <View style={base.tableHeader}>
            <Text style={[base.tableHeaderText, { flex: 1.4 }]}>Sale #</Text>
            <Text style={[base.tableHeaderText, { flex: 1.8 }]}>Client</Text>
            <Text style={[base.tableHeaderText, { flex: 1.8 }]}>Development</Text>
            <Text style={[base.tableHeaderText, { flex: 1 }]}>Stand</Text>
            <Text style={[base.tableHeaderText, { flex: 1.6 }]}>Agent</Text>
            <Text style={[base.tableHeaderText, { flex: 1, textAlign: "right" }]}>Price</Text>
            <Text style={[base.tableHeaderText, { flex: 1, textAlign: "right" }]}>Outstanding</Text>
            <Text style={[base.tableHeaderText, { flex: 1, textAlign: "right" }]}>Status</Text>
          </View>

          {sales.length === 0 && (
            <View style={[base.tableRow, { justifyContent: "center" }]}>
              <Text style={{ fontSize: 8.5, color: MUTED_LIGHT, paddingVertical: 4 }}>
                No sales recorded yet.
              </Text>
            </View>
          )}

          {sales.map((row, i) => (
            <View key={row.saleNumber} style={i % 2 === 1 ? base.tableRowAlt : base.tableRow} wrap={false}>
              <Text style={[base.cellLeft, { flex: 1.4 }]}>{row.saleNumber}</Text>
              <Text style={[base.cellLeft, { flex: 1.8 }]}>{row.clientName}</Text>
              <Text style={[base.cellLeft, { flex: 1.8 }]}>{row.developmentName}</Text>
              <Text style={[base.cellLeft, { flex: 1 }]}>{row.standNumber}</Text>
              <Text style={[base.cellLeft, { flex: 1.6, color: MUTED }]}>{row.agentName}</Text>
              <Text style={[base.cell, { flex: 1, fontFamily: "Geist-SemiBold" }]}>{fmtK(row.purchasePrice)}</Text>
              <Text style={[base.cell, { flex: 1, color: row.outstandingBalance > 0 ? RED : GREEN }]}>
                {fmtK(row.outstandingBalance)}
              </Text>
              <Text style={[base.cell, { flex: 1, fontSize: 7.5 }]}>{row.status}</Text>
            </View>
          ))}

          <View style={base.tableRowTotal} wrap={false}>
            <Text style={[base.tableRowTotalText, { flex: 1.4 }]}>TOTAL</Text>
            <Text style={[base.tableRowTotalText, { flex: 1.8 }]}> </Text>
            <Text style={[base.tableRowTotalText, { flex: 1.8 }]}> </Text>
            <Text style={[base.tableRowTotalText, { flex: 1 }]}> </Text>
            <Text style={[base.tableRowTotalText, { flex: 1.6 }]}> </Text>
            <Text style={[base.tableRowTotalText, { flex: 1, textAlign: "right", color: GOLD }]}>
              {fmtK(totalRevenue)}
            </Text>
            <Text style={[base.tableRowTotalText, { flex: 1, textAlign: "right" }]}>{fmtK(totalOutstanding)}</Text>
            <Text style={[base.tableRowTotalText, { flex: 1 }]}> </Text>
          </View>
        </View>

        <Footer label="CONFIDENTIAL" />
      </Page>
    </Document>
  );
}

// ── CEO EXECUTIVE REPORT ──────────────────────────────────────────────────────

export async function createCeoReportPdf(input: {
  generatedDate: string;
  kpis: {
    totalSales: number;
    activeSales: number;
    completedSales: number;
    totalPortfolioValue: number;
    totalCollected: number;
    totalOutstanding: number;
    adminFeesCollected: number;
    monthlyRecurring: number;
  };
  developments: {
    name: string;
    standsTotal: number;
    standsSold: number;
    standsReserved: number;
    standsAvailable: number;
    salesCount: number;
    salesValue: number;
    salesCollected: number;
    salesOutstanding: number;
  }[];
  monthlyCollections: { month: string; amount: number; count: number }[];
  salesRegister: {
    saleNumber: string;
    clientName: string;
    development: string;
    standNumber: string;
    sizeSqm: number;
    purchasePrice: number;
    depositPaid: number;
    outstanding: number;
    monthlyInstallment: number;
    progressPct: number;
    status: string;
  }[];
}) {
  const { kpis, developments, monthlyCollections, salesRegister } = input;

  const BLUE = "#1D4ED8";

  const maxMonthly = Math.max(...monthlyCollections.map((m) => m.amount), 1);

  return renderToBuffer(
    <Document>
      {/* ── PAGE 1: KPIs + Development Breakdown ── */}
      <Page size="A4" style={base.page}>
        <Header />

        <View style={base.titleBlock}>
          <Text style={base.docTitle}>CEO Executive Report</Text>
          <Text style={base.docMeta}>
            Generated {input.generatedDate} · CONFIDENTIAL
          </Text>
        </View>

        {/* ── Executive KPIs ── */}
        <View style={base.summaryBox}>
          <Text style={base.summaryTitle}>EXECUTIVE SUMMARY</Text>
          <View style={[base.kpiRow, { marginBottom: 8 }]}>
            <View style={[base.kpiBox, { borderLeftColor: GOLD }]}>
              <Text style={base.kpiValue}>{kpis.totalSales}</Text>
              <Text style={base.kpiLabel}>TOTAL SALES</Text>
            </View>
            <View style={[base.kpiBox, { borderLeftColor: GREEN }]}>
              <Text style={[base.kpiValue, { color: GREEN }]}>{kpis.activeSales}</Text>
              <Text style={base.kpiLabel}>ACTIVE</Text>
            </View>
            <View style={[base.kpiBox, { borderLeftColor: BLUE }]}>
              <Text style={[base.kpiValue, { color: BLUE }]}>{kpis.completedSales}</Text>
              <Text style={base.kpiLabel}>PAID OFF</Text>
            </View>
            <View style={[base.kpiBox, { borderLeftColor: GOLD }]}>
              <Text style={base.kpiValue}>{fmt(kpis.monthlyRecurring)}</Text>
              <Text style={base.kpiLabel}>MONTHLY RECURRING</Text>
            </View>
          </View>
          <View style={base.kpiRow}>
            <View style={base.kpiBox}>
              <Text style={base.kpiValue}>{fmt(kpis.totalPortfolioValue)}</Text>
              <Text style={base.kpiLabel}>PORTFOLIO VALUE</Text>
            </View>
            <View style={[base.kpiBox, { borderLeftColor: GREEN }]}>
              <Text style={[base.kpiValue, { color: GREEN }]}>{fmt(kpis.totalCollected)}</Text>
              <Text style={base.kpiLabel}>TOTAL COLLECTED</Text>
            </View>
            <View style={[base.kpiBox, { borderLeftColor: RED }]}>
              <Text style={[base.kpiValue, { color: RED }]}>{fmt(kpis.totalOutstanding)}</Text>
              <Text style={base.kpiLabel}>OUTSTANDING BALANCE</Text>
            </View>
            <View style={[base.kpiBox, { borderLeftColor: GOLD_MID }]}>
              <Text style={[base.kpiValue, { color: GOLD }]}>{fmt(kpis.adminFeesCollected)}</Text>
              <Text style={base.kpiLabel}>ADMIN FEES COLLECTED</Text>
            </View>
          </View>
        </View>

        {/* ── Development Breakdown ── */}
        <View style={{ marginBottom: 20 }}>
          <SectionHeading text="DEVELOPMENT BREAKDOWN" />
          <View style={base.table}>
            <View style={base.tableHeader}>
              <Text style={[base.tableHeaderText, { flex: 2.2 }]}>Development</Text>
              <Text style={[base.tableHeaderText, { flex: 0.8, textAlign: "center" }]}>Stands</Text>
              <Text style={[base.tableHeaderText, { flex: 0.8, textAlign: "center" }]}>Sold</Text>
              <Text style={[base.tableHeaderText, { flex: 0.8, textAlign: "center" }]}>Avail.</Text>
              <Text style={[base.tableHeaderText, { flex: 0.7, textAlign: "center" }]}>Sales</Text>
              <Text style={[base.tableHeaderText, { flex: 1.2, textAlign: "right" }]}>Value</Text>
              <Text style={[base.tableHeaderText, { flex: 1.2, textAlign: "right" }]}>Collected</Text>
              <Text style={[base.tableHeaderText, { flex: 1.2, textAlign: "right" }]}>Outstanding</Text>
            </View>
            {developments.map((d, i) => (
              <View key={d.name} style={i % 2 === 1 ? base.tableRowAlt : base.tableRow} wrap={false}>
                <Text style={[base.cellDev, { flex: 2.2 }]}>{d.name}</Text>
                <Text style={[base.cell, { flex: 0.8, textAlign: "center" }]}>{d.standsTotal}</Text>
                <Text style={[base.cell, { flex: 0.8, textAlign: "center", color: GREEN }]}>{d.standsSold}</Text>
                <Text style={[base.cell, { flex: 0.8, textAlign: "center" }]}>{d.standsAvailable}</Text>
                <Text style={[base.cell, { flex: 0.7, textAlign: "center" }]}>{d.salesCount}</Text>
                <Text style={[base.cell, { flex: 1.2 }]}>{fmt(d.salesValue)}</Text>
                <Text style={[base.cell, { flex: 1.2, color: GREEN }]}>{fmt(d.salesCollected)}</Text>
                <Text style={[base.cell, { flex: 1.2, color: RED }]}>{fmt(d.salesOutstanding)}</Text>
              </View>
            ))}
            <View style={base.tableRowTotal} wrap={false}>
              <Text style={[base.tableRowTotalText, { flex: 2.2 }]}>TOTAL</Text>
              <Text style={[base.tableRowTotalText, { flex: 0.8, textAlign: "center" }]}>
                {developments.reduce((s, d) => s + d.standsTotal, 0)}
              </Text>
              <Text style={[base.tableRowTotalText, { flex: 0.8, textAlign: "center" }]}>
                {developments.reduce((s, d) => s + d.standsSold, 0)}
              </Text>
              <Text style={[base.tableRowTotalText, { flex: 0.8, textAlign: "center" }]}>
                {developments.reduce((s, d) => s + d.standsAvailable, 0)}
              </Text>
              <Text style={[base.tableRowTotalText, { flex: 0.7, textAlign: "center" }]}>
                {developments.reduce((s, d) => s + d.salesCount, 0)}
              </Text>
              <Text style={[base.tableRowTotalText, { flex: 1.2, textAlign: "right", color: GOLD }]}>
                {fmt(developments.reduce((s, d) => s + d.salesValue, 0))}
              </Text>
              <Text style={[base.tableRowTotalText, { flex: 1.2, textAlign: "right", color: GOLD }]}>
                {fmt(developments.reduce((s, d) => s + d.salesCollected, 0))}
              </Text>
              <Text style={[base.tableRowTotalText, { flex: 1.2, textAlign: "right", color: GOLD }]}>
                {fmt(developments.reduce((s, d) => s + d.salesOutstanding, 0))}
              </Text>
            </View>
          </View>
        </View>

        <Footer label="CEO REPORT — CONFIDENTIAL" />
      </Page>

      {/* ── PAGE 2: Monthly Collections + Sales Register ── */}
      <Page size="A4" style={base.page}>
        <Header />

        {/* ── Monthly Collections ── */}
        <View style={{ marginBottom: 20 }}>
          <SectionHeading text="MONTHLY CASH COLLECTIONS (VERIFIED PAYMENTS)" />
          <View style={base.table}>
            <View style={base.tableHeader}>
              <Text style={[base.tableHeaderText, { flex: 2 }]}>Month</Text>
              <Text style={[base.tableHeaderText, { flex: 0.8, textAlign: "center" }]}>Payments</Text>
              <Text style={[base.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Amount</Text>
              <Text style={[base.tableHeaderText, { flex: 2.5 }]}>  Bar</Text>
            </View>
            {monthlyCollections.map((m, i) => {
              const barPct = maxMonthly > 0 ? (m.amount / maxMonthly) * 100 : 0;
              return (
                <View key={m.month} style={i % 2 === 1 ? base.tableRowAlt : base.tableRow} wrap={false}>
                  <Text style={[base.cellLeft, { flex: 2 }]}>{m.month}</Text>
                  <Text style={[base.cell, { flex: 0.8, textAlign: "center" }]}>{m.count}</Text>
                  <Text style={[base.cell, { flex: 1.5, color: GREEN }]}>{fmt(m.amount)}</Text>
                  <View style={{ flex: 2.5, justifyContent: "center", paddingHorizontal: 4 }}>
                    <View style={{ height: 8, backgroundColor: BORDER, borderRadius: 2 }}>
                      <View style={{ height: 8, width: `${barPct}%`, backgroundColor: GOLD, borderRadius: 2 }} />
                    </View>
                  </View>
                </View>
              );
            })}
            <View style={base.tableRowTotal} wrap={false}>
              <Text style={[base.tableRowTotalText, { flex: 2 }]}>TOTAL</Text>
              <Text style={[base.tableRowTotalText, { flex: 0.8, textAlign: "center" }]}>
                {monthlyCollections.reduce((s, m) => s + m.count, 0)}
              </Text>
              <Text style={[base.tableRowTotalText, { flex: 1.5, textAlign: "right", color: GOLD }]}>
                {fmt(monthlyCollections.reduce((s, m) => s + m.amount, 0))}
              </Text>
              <Text style={[base.tableRowTotalText, { flex: 2.5 }]} />
            </View>
          </View>
        </View>

        {/* ── Active Sales Register ── */}
        <View>
          <SectionHeading text="ACTIVE SALES REGISTER" />
          <View style={base.table}>
            <View style={base.tableHeader}>
              <Text style={[base.tableHeaderText, { flex: 1.4 }]}>Sale No.</Text>
              <Text style={[base.tableHeaderText, { flex: 2 }]}>Client</Text>
              <Text style={[base.tableHeaderText, { flex: 1.5 }]}>Development</Text>
              <Text style={[base.tableHeaderText, { flex: 0.7, textAlign: "center" }]}>Stand</Text>
              <Text style={[base.tableHeaderText, { flex: 1.2, textAlign: "right" }]}>Price</Text>
              <Text style={[base.tableHeaderText, { flex: 1.2, textAlign: "right" }]}>Outstanding</Text>
              <Text style={[base.tableHeaderText, { flex: 1, textAlign: "right" }]}>Monthly</Text>
              <Text style={[base.tableHeaderText, { flex: 0.7, textAlign: "center" }]}>Paid %</Text>
            </View>
            {salesRegister.map((s, i) => (
              <View key={s.saleNumber} style={i % 2 === 1 ? base.tableRowAlt : base.tableRow} wrap={false}>
                <Text style={[base.cellLeft, { flex: 1.4, fontSize: 7.5, fontFamily: "Geist-SemiBold" }]}>{s.saleNumber}</Text>
                <Text style={[base.cellLeft, { flex: 2, fontSize: 7.5 }]}>{s.clientName}</Text>
                <Text style={[base.cellLeft, { flex: 1.5, fontSize: 7.5, color: MUTED }]}>{s.development}</Text>
                <Text style={[base.cell, { flex: 0.7, textAlign: "center", fontSize: 7.5 }]}>{s.standNumber}</Text>
                <Text style={[base.cell, { flex: 1.2, fontSize: 7.5 }]}>{fmt(s.purchasePrice)}</Text>
                <Text style={[base.cell, { flex: 1.2, fontSize: 7.5, color: s.outstanding > 0 ? RED : GREEN }]}>
                  {fmt(s.outstanding)}
                </Text>
                <Text style={[base.cell, { flex: 1, fontSize: 7.5 }]}>
                  {s.monthlyInstallment > 0 ? fmt(s.monthlyInstallment) : "—"}
                </Text>
                <Text style={[base.cell, { flex: 0.7, textAlign: "center", fontSize: 7.5, color: s.progressPct >= 100 ? GREEN : CHARCOAL }]}>
                  {s.progressPct}%
                </Text>
              </View>
            ))}
            {salesRegister.length === 0 && (
              <View style={base.tableRow}>
                <Text style={[base.cellLeft, { color: MUTED }]}>No active sales on record.</Text>
              </View>
            )}
          </View>
        </View>

        <Footer label="CEO REPORT — CONFIDENTIAL" />
      </Page>
    </Document>
  );
}

// ── INVOICE ───────────────────────────────────────────────────────────────────

export async function createInvoicePdf(input: {
  invoiceNumber: string;
  saleNumber: string;
  date: string;
  clientName: string;
  nationalId: string;
  developmentName: string;
  standNumber: string;
  purchasePrice: number;
  depositRequired: number;
  outstandingBalance: number;
  paymentTerms: string;
}) {
  return renderToBuffer(
    <Document>
      <Page size="A4" style={base.page}>
        <Header />
        <View style={base.titleBlock}>
          <Text style={base.docTitle}>Invoice</Text>
          <Text style={base.docMeta}>
            {input.invoiceNumber}  ·  {input.date}
          </Text>
        </View>
        <View style={base.summaryBox}>
          <Text style={base.summaryTitle}>SALE DETAILS</Text>
          <View style={{ flexDirection: "row", gap: 28, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <View style={base.section}><Text style={base.label}>CLIENT</Text><Text style={base.value}>{input.clientName}</Text></View>
              <View style={base.section}><Text style={base.label}>NATIONAL ID</Text><Text style={base.value}>{input.nationalId}</Text></View>
              <View style={base.section}><Text style={base.label}>SALE NO.</Text><Text style={[base.value, { fontFamily: "Geist-SemiBold" }]}>{input.saleNumber}</Text></View>
            </View>
            <View style={{ flex: 1 }}>
              <View style={base.section}><Text style={base.label}>DEVELOPMENT</Text><Text style={base.value}>{input.developmentName}</Text></View>
              <View style={base.section}><Text style={base.label}>STAND NUMBER</Text><Text style={[base.value, { fontFamily: "Geist-SemiBold" }]}>{input.standNumber}</Text></View>
              <View style={base.section}><Text style={base.label}>INVOICE DATE</Text><Text style={base.value}>{input.date}</Text></View>
            </View>
          </View>
          <View style={base.kpiRow}>
            <View style={base.kpiBox}>
              <Text style={base.kpiValue}>{fmt(input.purchasePrice)}</Text>
              <Text style={base.kpiLabel}>PURCHASE PRICE</Text>
            </View>
            <View style={[base.kpiBox, { borderLeftColor: "#ca8a04" }]}>
              <Text style={[base.kpiValue, { color: "#ca8a04" }]}>{fmt(input.depositRequired)}</Text>
              <Text style={base.kpiLabel}>DEPOSIT REQUIRED</Text>
            </View>
            <View style={[base.kpiBox, { borderLeftColor: input.outstandingBalance > 0 ? RED : GREEN }]}>
              <Text style={[base.kpiValue, { color: input.outstandingBalance > 0 ? RED : GREEN }]}>
                {fmt(input.outstandingBalance)}
              </Text>
              <Text style={base.kpiLabel}>OUTSTANDING</Text>
            </View>
          </View>
        </View>

        <View style={{
          backgroundColor: "#fef3c7",
          border: 1,
          borderColor: "#fde68a",
          borderRadius: 4,
          borderLeft: 3,
          borderLeftColor: "#ca8a04",
          padding: 12,
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: 8, fontFamily: "Geist-SemiBold", color: "#92400e", letterSpacing: 0.5 }}>
            PAYMENT TERMS
          </Text>
          <Text style={{ fontSize: 9, color: "#78350f", marginTop: 4 }}>{input.paymentTerms}</Text>
        </View>

        <View style={{ fontSize: 7.5, color: MUTED }}>
          <Text>For queries: {company.accountsEmail}  ·  {company.accountsPhone}  ·  50 Greendale Avenue, Greendale, Zimbabwe</Text>
        </View>

        <Footer label={`INVOICE ${input.invoiceNumber}`} />
      </Page>
    </Document>
  );
}
