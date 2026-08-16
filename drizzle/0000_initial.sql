CREATE TYPE "public"."commission_status" AS ENUM('PENDING', 'APPROVED', 'PAID', 'VOID');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('BROCHURE', 'RESERVATION_FORM', 'SALE_AGREEMENT', 'RECEIPT', 'STATEMENT', 'COMMISSION_VOUCHER', 'TITLE_DEED');--> statement-breakpoint
CREATE TYPE "public"."group_status" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('NOT_STARTED', 'IN_REVIEW', 'COMPLETE', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('NEW', 'CONTACTED', 'INTERESTED', 'SITE_VISIT_BOOKED', 'NEGOTIATING', 'PRESALE_INITIATED', 'CONVERTED_TO_SALE', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('EMAIL', 'IN_APP', 'SMS');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'BANK_TRANSFER', 'ECOCASH', 'VELOCITY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'VERIFIED', 'FAILED', 'REVERSED');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('DEPOSIT', 'INSTALLMENT', 'ADJUSTMENT');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('PENDING', 'PRESALE', 'AWAITING_DEPOSIT', 'APPROVED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('ACTIVE', 'PAID_OFF', 'DEFAULTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."stand_status" AS ENUM('AVAILABLE', 'PRESALE', 'RESERVED', 'SOLD', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('PUBLIC', 'CLIENT', 'AGENT', 'ACCOUNTS', 'ADMINISTRATOR', 'CEO', 'SYSTEM_ADMIN', 'GROUP_ADMIN');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"license_number" text,
	"active" boolean DEFAULT true NOT NULL,
	"commission_rate" numeric(12, 2) DEFAULT '500' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"module" text NOT NULL,
	"previous_value" jsonb,
	"new_value" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"cover_image" text,
	"author_name" text DEFAULT 'Amata Properties' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"group_id" text,
	"name" text NOT NULL,
	"national_id" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"address" text NOT NULL,
	"date_of_birth" timestamp,
	"nationality" text,
	"occupation" text,
	"employer" text,
	"next_of_kin" text,
	"next_of_kin_contact" text,
	"kyc_status" "kyc_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"national_id_front_url" text,
	"national_id_back_url" text,
	"passport_copy_url" text,
	"proof_of_residence_url" text,
	"passport_photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" text PRIMARY KEY NOT NULL,
	"sale_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"amount" numeric(14, 2) DEFAULT '500' NOT NULL,
	"status" "commission_status" DEFAULT 'PENDING' NOT NULL,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "developments" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"province" text NOT NULL,
	"description" text NOT NULL,
	"developer_name" text NOT NULL,
	"developer_contact" text NOT NULL,
	"starting_price" numeric(14, 2) NOT NULL,
	"price_per_sqm" numeric(12, 2) NOT NULL,
	"deposit_amount" numeric(14, 2) NOT NULL,
	"interest_rate" numeric(6, 2) NOT NULL,
	"payment_duration_months" integer NOT NULL,
	"payment_terms" text NOT NULL,
	"terms_and_conditions" text NOT NULL,
	"amenities" text[] DEFAULT '{}' NOT NULL,
	"infrastructure_status" text NOT NULL,
	"hero_image" text NOT NULL,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"brochure_url" text,
	"geo_json" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp,
	"deleted_at" timestamp,
	"development_type" text,
	"currency" text DEFAULT 'USD' NOT NULL,
	"latitude" numeric(10, 6),
	"longitude" numeric(10, 6),
	"deposit_type" text DEFAULT 'fixed' NOT NULL,
	"installment_options" jsonb DEFAULT '[]'::jsonb,
	"penalty_rules" jsonb,
	"reservation_fee_amount" numeric(14, 2),
	"commission_rules" jsonb,
	"discount_rules" jsonb,
	"stand_number_prefix" text,
	"stand_number_auto_increment" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "developments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "document_type" NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"development_id" text,
	"sale_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"org_type" text NOT NULL,
	"registration_number" text,
	"contact_person_name" text NOT NULL,
	"contact_person_email" text NOT NULL,
	"contact_person_phone" text NOT NULL,
	"address" text,
	"logo_url" text,
	"agreement_doc_url" text,
	"default_payment_plan_months" integer,
	"default_deposit_amount" numeric(14, 2),
	"status" "group_status" DEFAULT 'DRAFT' NOT NULL,
	"development_id" text NOT NULL,
	"group_admin_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installment_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"sale_id" text NOT NULL,
	"principal" numeric(14, 2) NOT NULL,
	"interest_rate" numeric(6, 2) NOT NULL,
	"months" integer NOT NULL,
	"monthly_amount" numeric(14, 2) NOT NULL,
	"start_date" timestamp NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "installment_plans_sale_id_unique" UNIQUE("sale_id")
);
--> statement-breakpoint
CREATE TABLE "installments" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"sequence" integer NOT NULL,
	"due_date" timestamp NOT NULL,
	"amount_due" numeric(14, 2) NOT NULL,
	"amount_paid" numeric(14, 2) DEFAULT '0' NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "installments_plan_id_sequence_unique" UNIQUE("plan_id","sequence")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text,
	"agent_id" text,
	"development_id" text,
	"name" text NOT NULL,
	"national_id" text,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"address" text,
	"notes" text,
	"source" text DEFAULT 'website' NOT NULL,
	"status" "lead_status" DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"recipient" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"sent_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"reservation_id" text,
	"sale_id" text,
	"installment_id" text,
	"type" "payment_type" NOT NULL,
	"method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"reference" text NOT NULL,
	"receipt_number" text,
	"velocity_trace" text,
	"receipt_url" text,
	"notes" text,
	"verified_by_user_id" text,
	"paid_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"client_id" text NOT NULL,
	"agent_id" text,
	"development_id" text NOT NULL,
	"stand_id" text NOT NULL,
	"status" "reservation_status" DEFAULT 'PENDING' NOT NULL,
	"message" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reservations_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" text PRIMARY KEY NOT NULL,
	"sale_number" text NOT NULL,
	"reservation_id" text NOT NULL,
	"client_id" text NOT NULL,
	"agent_id" text,
	"development_id" text NOT NULL,
	"stand_id" text NOT NULL,
	"purchase_price" numeric(14, 2) NOT NULL,
	"deposit_required" numeric(14, 2) NOT NULL,
	"deposit_paid" numeric(14, 2) DEFAULT '0' NOT NULL,
	"outstanding_balance" numeric(14, 2) NOT NULL,
	"status" "sale_status" DEFAULT 'ACTIVE' NOT NULL,
	"activated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_sale_number_unique" UNIQUE("sale_number"),
	CONSTRAINT "sales_reservation_id_unique" UNIQUE("reservation_id"),
	CONSTRAINT "sales_stand_id_unique" UNIQUE("stand_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "stand_history" (
	"id" text PRIMARY KEY NOT NULL,
	"stand_id" text NOT NULL,
	"event_type" text NOT NULL,
	"previous_value" jsonb,
	"new_value" jsonb,
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stands" (
	"id" text PRIMARY KEY NOT NULL,
	"development_id" text NOT NULL,
	"stand_number" text NOT NULL,
	"size_sqm" integer NOT NULL,
	"price" numeric(14, 2) NOT NULL,
	"status" "stand_status" DEFAULT 'AVAILABLE' NOT NULL,
	"phase" text NOT NULL,
	"geometry" jsonb,
	"coordinates" jsonb,
	"notes" text,
	"archived_at" timestamp,
	"deleted_at" timestamp,
	"import_batch_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stands_development_id_stand_number_unique" UNIQUE("development_id","stand_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'CLIENT' NOT NULL,
	"phone" text,
	"national_id" text,
	"address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_agent_id_agent_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_development_id_developments_id_fk" FOREIGN KEY ("development_id") REFERENCES "public"."developments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_development_id_developments_id_fk" FOREIGN KEY ("development_id") REFERENCES "public"."developments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_group_admin_user_id_users_id_fk" FOREIGN KEY ("group_admin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installments" ADD CONSTRAINT "installments_plan_id_installment_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."installment_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_agent_id_agent_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_development_id_developments_id_fk" FOREIGN KEY ("development_id") REFERENCES "public"."developments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_installment_id_installments_id_fk" FOREIGN KEY ("installment_id") REFERENCES "public"."installments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_agent_id_agent_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_development_id_developments_id_fk" FOREIGN KEY ("development_id") REFERENCES "public"."developments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_stand_id_stands_id_fk" FOREIGN KEY ("stand_id") REFERENCES "public"."stands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_agent_id_agent_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_development_id_developments_id_fk" FOREIGN KEY ("development_id") REFERENCES "public"."developments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_stand_id_stands_id_fk" FOREIGN KEY ("stand_id") REFERENCES "public"."stands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stand_history" ADD CONSTRAINT "stand_history_stand_id_stands_id_fk" FOREIGN KEY ("stand_id") REFERENCES "public"."stands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stand_history" ADD CONSTRAINT "stand_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stands" ADD CONSTRAINT "stands_development_id_developments_id_fk" FOREIGN KEY ("development_id") REFERENCES "public"."developments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_module_created_idx" ON "audit_logs" USING btree ("module","created_at");--> statement-breakpoint
CREATE INDEX "stand_history_stand_idx" ON "stand_history" USING btree ("stand_id","created_at");--> statement-breakpoint
CREATE INDEX "stands_status_idx" ON "stands" USING btree ("status");