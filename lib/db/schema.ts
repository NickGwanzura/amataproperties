import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "PUBLIC", "CLIENT", "AGENT", "ACCOUNTS", "ADMINISTRATOR", "CEO", "SYSTEM_ADMIN", "GROUP_ADMIN",
]);
export const standStatusEnum = pgEnum("stand_status", [
  "AVAILABLE", "PRESALE", "RESERVED", "SOLD", "BLOCKED",
]);
export const reservationStatusEnum = pgEnum("reservation_status", [
  "PENDING", "PRESALE", "AWAITING_DEPOSIT", "APPROVED", "CANCELLED", "EXPIRED",
]);
export const leadStatusEnum = pgEnum("lead_status", [
  "NEW", "CONTACTED", "INTERESTED", "SITE_VISIT_BOOKED",
  "NEGOTIATING", "PRESALE_INITIATED", "CONVERTED_TO_SALE", "LOST",
]);
export const kycStatusEnum = pgEnum("kyc_status", [
  "NOT_STARTED", "IN_REVIEW", "COMPLETE", "REJECTED",
]);
export const saleStatusEnum = pgEnum("sale_status", [
  "ACTIVE", "PAID_OFF", "DEFAULTED", "CANCELLED",
]);
export const paymentTypeEnum = pgEnum("payment_type", [
  "DEPOSIT", "INSTALLMENT", "ADJUSTMENT",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "CASH", "BANK_TRANSFER", "ECOCASH", "VELOCITY", "OTHER",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING", "VERIFIED", "FAILED", "REVERSED",
]);
export const commissionStatusEnum = pgEnum("commission_status", [
  "PENDING", "APPROVED", "PAID", "VOID",
]);
export const groupStatusEnum = pgEnum("group_status", [
  "DRAFT", "ACTIVE", "ARCHIVED",
]);
export const documentTypeEnum = pgEnum("document_type", [
  "BROCHURE", "RESERVATION_FORM", "SALE_AGREEMENT",
  "RECEIPT", "STATEMENT", "COMMISSION_VOUCHER", "TITLE_DEED",
]);
export const notificationChannelEnum = pgEnum("notification_channel", [
  "EMAIL", "IN_APP", "SMS",
]);

// ─── Auth Tables ──────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("CLIENT"),
  phone: text("phone"),
  nationalId: text("national_id"),
  address: text("address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Business Tables ──────────────────────────────────────────────────────────

export const agentProfiles = pgTable("agent_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique().references(() => users.id),
  licenseNumber: text("license_number"),
  active: boolean("active").notNull().default(true),
  commissionRate: numeric("commission_rate", { precision: 12, scale: 2 }).notNull().default("500"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const developments = pgTable("developments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  province: text("province").notNull(),
  description: text("description").notNull(),
  developerName: text("developer_name").notNull(),
  developerContact: text("developer_contact").notNull(),
  startingPrice: numeric("starting_price", { precision: 14, scale: 2 }).notNull(),
  pricePerSqm: numeric("price_per_sqm", { precision: 12, scale: 2 }).notNull(),
  depositAmount: numeric("deposit_amount", { precision: 14, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 6, scale: 2 }).notNull(),
  paymentDurationMonths: integer("payment_duration_months").notNull(),
  paymentTerms: text("payment_terms").notNull(),
  termsAndConditions: text("terms_and_conditions").notNull(),
  amenities: text("amenities").array().notNull().default([]),
  infrastructureStatus: text("infrastructure_status").notNull(),
  heroImage: text("hero_image").notNull(),
  gallery: jsonb("gallery").notNull().$type<string[]>().default([]),
  brochureUrl: text("brochure_url"),
  geoJson: jsonb("geo_json"),
  active: boolean("active").notNull().default(true),
  archivedAt: timestamp("archived_at"),
  deletedAt: timestamp("deleted_at"),

  // ── Step 1 (Development Info) extras ──
  developmentType: text("development_type"),
  currency: text("currency").notNull().default("USD"),
  latitude: numeric("latitude", { precision: 10, scale: 6 }),
  longitude: numeric("longitude", { precision: 10, scale: 6 }),

  // ── Step 2 (Pricing & Stand Configuration) extras — additive, data-capture only. ──
  // No interest/penalty math is implemented anywhere in this codebase; these
  // columns store operator-entered configuration for display/reference only.
  depositType: text("deposit_type").notNull().default("fixed"), // 'fixed' | 'percentage'
  installmentOptions: jsonb("installment_options").$type<{ months: number; label: string }[]>().default([]),
  penaltyRules: jsonb("penalty_rules").$type<{ ratePercent: number; graceDays: number } | null>(),
  reservationFeeAmount: numeric("reservation_fee_amount", { precision: 14, scale: 2 }),
  commissionRules: jsonb("commission_rules").$type<{ type: "flat" | "percentage"; value: number } | null>(),
  discountRules: jsonb("discount_rules").$type<{ earlySettlementPct?: number; bulkThreshold?: number; bulkDiscountPct?: number } | null>(),
  standNumberPrefix: text("stand_number_prefix"),
  standNumberAutoIncrement: boolean("stand_number_auto_increment").notNull().default(true),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const stands = pgTable("stands", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  developmentId: text("development_id").notNull().references(() => developments.id, { onDelete: "cascade" }),
  standNumber: text("stand_number").notNull(),
  sizeSqm: integer("size_sqm").notNull(),
  price: numeric("price", { precision: 14, scale: 2 }).notNull(),
  status: standStatusEnum("status").notNull().default("AVAILABLE"),
  phase: text("phase").notNull(),
  geometry: jsonb("geometry"),
  coordinates: jsonb("coordinates"),
  notes: text("notes"),
  archivedAt: timestamp("archived_at"),
  deletedAt: timestamp("deleted_at"),
  importBatchId: text("import_batch_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  unique().on(table.developmentId, table.standNumber),
  index("stands_status_idx").on(table.status),
]);

export const groups = pgTable("groups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  orgType: text("org_type").notNull(),
  registrationNumber: text("registration_number"),
  contactPersonName: text("contact_person_name").notNull(),
  contactPersonEmail: text("contact_person_email").notNull(),
  contactPersonPhone: text("contact_person_phone").notNull(),
  address: text("address"),
  logoUrl: text("logo_url"),
  agreementDocUrl: text("agreement_doc_url"),
  defaultPaymentPlanMonths: integer("default_payment_plan_months"),
  defaultDepositAmount: numeric("default_deposit_amount", { precision: 14, scale: 2 }),
  status: groupStatusEnum("status").notNull().default("DRAFT"),
  developmentId: text("development_id").notNull().references(() => developments.id),
  groupAdminUserId: text("group_admin_user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").unique().references(() => users.id),
  groupId: text("group_id").references(() => groups.id),
  name: text("name").notNull(),
  nationalId: text("national_id").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  nationality: text("nationality"),
  occupation: text("occupation"),
  employer: text("employer"),
  nextOfKin: text("next_of_kin"),
  nextOfKinContact: text("next_of_kin_contact"),
  kycStatus: kycStatusEnum("kyc_status").notNull().default("NOT_STARTED"),
  nationalIdFrontUrl: text("national_id_front_url"),
  nationalIdBackUrl: text("national_id_back_url"),
  passportCopyUrl: text("passport_copy_url"),
  proofOfResidenceUrl: text("proof_of_residence_url"),
  passportPhotoUrl: text("passport_photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => clients.id),
  agentId: text("agent_id").references(() => agentProfiles.id),
  developmentId: text("development_id").references(() => developments.id),
  name: text("name").notNull(),
  nationalId: text("national_id"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address"),
  notes: text("notes"),
  source: text("source").notNull().default("website"),
  status: leadStatusEnum("status").notNull().default("NEW"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reservations = pgTable("reservations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  reference: text("reference").notNull().unique(),
  clientId: text("client_id").notNull().references(() => clients.id),
  agentId: text("agent_id").references(() => agentProfiles.id),
  developmentId: text("development_id").notNull().references(() => developments.id),
  standId: text("stand_id").notNull().references(() => stands.id),
  status: reservationStatusEnum("status").notNull().default("PENDING"),
  message: text("message"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sales = pgTable("sales", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  saleNumber: text("sale_number").notNull().unique(),
  reservationId: text("reservation_id").notNull().unique().references(() => reservations.id),
  clientId: text("client_id").notNull().references(() => clients.id),
  agentId: text("agent_id").references(() => agentProfiles.id),
  developmentId: text("development_id").notNull().references(() => developments.id),
  standId: text("stand_id").notNull().unique().references(() => stands.id),
  purchasePrice: numeric("purchase_price", { precision: 14, scale: 2 }).notNull(),
  depositRequired: numeric("deposit_required", { precision: 14, scale: 2 }).notNull(),
  depositPaid: numeric("deposit_paid", { precision: 14, scale: 2 }).notNull().default("0"),
  outstandingBalance: numeric("outstanding_balance", { precision: 14, scale: 2 }).notNull(),
  status: saleStatusEnum("status").notNull().default("ACTIVE"),
  activatedAt: timestamp("activated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const installmentPlans = pgTable("installment_plans", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  saleId: text("sale_id").notNull().unique().references(() => sales.id),
  principal: numeric("principal", { precision: 14, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 6, scale: 2 }).notNull(),
  months: integer("months").notNull(),
  monthlyAmount: numeric("monthly_amount", { precision: 14, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const installments = pgTable("installments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  planId: text("plan_id").notNull().references(() => installmentPlans.id),
  sequence: integer("sequence").notNull(),
  dueDate: timestamp("due_date").notNull(),
  amountDue: numeric("amount_due", { precision: 14, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 14, scale: 2 }).notNull().default("0"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  unique().on(table.planId, table.sequence),
]);

export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull().references(() => clients.id),
  reservationId: text("reservation_id").references(() => reservations.id),
  saleId: text("sale_id").references(() => sales.id),
  installmentId: text("installment_id").references(() => installments.id),
  type: paymentTypeEnum("type").notNull(),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").notNull().default("PENDING"),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  reference: text("reference").notNull(),
  receiptNumber: text("receipt_number"),
  velocityTrace: text("velocity_trace"),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  verifiedByUserId: text("verified_by_user_id"),
  paidAt: timestamp("paid_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const commissions = pgTable("commissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  saleId: text("sale_id").notNull().references(() => sales.id),
  agentId: text("agent_id").notNull().references(() => agentProfiles.id),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull().default("500"),
  status: commissionStatusEnum("status").notNull().default("PENDING"),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: documentTypeEnum("type").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  developmentId: text("development_id").references(() => developments.id),
  saleId: text("sale_id").references(() => sales.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channel: notificationChannelEnum("channel").notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(),
  module: text("module").notNull(),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("audit_logs_module_created_idx").on(table.module, table.createdAt),
]);

export const standHistory = pgTable("stand_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  standId: text("stand_id").notNull().references(() => stands.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("stand_history_stand_idx").on(table.standId, table.createdAt),
]);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  client: one(clients, { fields: [users.id], references: [clients.userId] }),
  agentProfile: one(agentProfiles, { fields: [users.id], references: [agentProfiles.userId] }),
  sessions: many(sessions),
  accounts: many(accounts),
  auditLogs: many(auditLogs),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const agentProfilesRelations = relations(agentProfiles, ({ one, many }) => ({
  user: one(users, { fields: [agentProfiles.userId], references: [users.id] }),
  leads: many(leads),
  reservations: many(reservations),
  sales: many(sales),
  commissions: many(commissions),
}));

export const developmentsRelations = relations(developments, ({ many }) => ({
  stands: many(stands),
  leads: many(leads),
  reservations: many(reservations),
  sales: many(sales),
  documents: many(documents),
}));

export const standsRelations = relations(stands, ({ one, many }) => ({
  development: one(developments, { fields: [stands.developmentId], references: [developments.id] }),
  reservations: many(reservations),
  sale: one(sales, { fields: [stands.id], references: [sales.standId] }),
  history: many(standHistory),
}));

export const standHistoryRelations = relations(standHistory, ({ one }) => ({
  stand: one(stands, { fields: [standHistory.standId], references: [stands.id] }),
  user: one(users, { fields: [standHistory.userId], references: [users.id] }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  group: one(groups, { fields: [clients.groupId], references: [groups.id] }),
  leads: many(leads),
  reservations: many(reservations),
  sales: many(sales),
  payments: many(payments),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  development: one(developments, { fields: [groups.developmentId], references: [developments.id] }),
  groupAdmin: one(users, { fields: [groups.groupAdminUserId], references: [users.id] }),
  members: many(clients),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  client: one(clients, { fields: [leads.clientId], references: [clients.id] }),
  agent: one(agentProfiles, { fields: [leads.agentId], references: [agentProfiles.id] }),
  development: one(developments, { fields: [leads.developmentId], references: [developments.id] }),
}));

export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  client: one(clients, { fields: [reservations.clientId], references: [clients.id] }),
  agent: one(agentProfiles, { fields: [reservations.agentId], references: [agentProfiles.id] }),
  development: one(developments, { fields: [reservations.developmentId], references: [developments.id] }),
  stand: one(stands, { fields: [reservations.standId], references: [stands.id] }),
  sale: one(sales, { fields: [reservations.id], references: [sales.reservationId] }),
  payments: many(payments),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  reservation: one(reservations, { fields: [sales.reservationId], references: [reservations.id] }),
  client: one(clients, { fields: [sales.clientId], references: [clients.id] }),
  agent: one(agentProfiles, { fields: [sales.agentId], references: [agentProfiles.id] }),
  development: one(developments, { fields: [sales.developmentId], references: [developments.id] }),
  stand: one(stands, { fields: [sales.standId], references: [stands.id] }),
  installmentPlan: one(installmentPlans, { fields: [sales.id], references: [installmentPlans.saleId] }),
  payments: many(payments),
  commissions: many(commissions),
  documents: many(documents),
}));

export const installmentPlansRelations = relations(installmentPlans, ({ one, many }) => ({
  sale: one(sales, { fields: [installmentPlans.saleId], references: [sales.id] }),
  installments: many(installments),
}));

export const installmentsRelations = relations(installments, ({ one, many }) => ({
  plan: one(installmentPlans, { fields: [installments.planId], references: [installmentPlans.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  client: one(clients, { fields: [payments.clientId], references: [clients.id] }),
  reservation: one(reservations, { fields: [payments.reservationId], references: [reservations.id] }),
  sale: one(sales, { fields: [payments.saleId], references: [sales.id] }),
  installment: one(installments, { fields: [payments.installmentId], references: [installments.id] }),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  sale: one(sales, { fields: [commissions.saleId], references: [sales.id] }),
  agent: one(agentProfiles, { fields: [commissions.agentId], references: [agentProfiles.id] }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  development: one(developments, { fields: [documents.developmentId], references: [developments.id] }),
  sale: one(sales, { fields: [documents.saleId], references: [sales.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export const blogPosts = pgTable("blog_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  authorName: text("author_name").notNull().default("Amata Properties"),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AgentProfile = typeof agentProfiles.$inferSelect;
export type Development = typeof developments.$inferSelect;
export type NewDevelopment = typeof developments.$inferInsert;
export type Stand = typeof stands.$inferSelect;
export type NewStand = typeof stands.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type Sale = typeof sales.$inferSelect;
export type InstallmentPlan = typeof installmentPlans.$inferSelect;
export type Installment = typeof installments.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Commission = typeof commissions.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
