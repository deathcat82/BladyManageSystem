import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const createdAt = () => text("created_at").notNull().default(sql.raw("CURRENT_TIMESTAMP"));
const updatedAt = () => text("updated_at").notNull().default(sql.raw("CURRENT_TIMESTAMP"));

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  lineId: text("line_id").notNull().default(""),
  birthday: text("birthday").notNull(),
  referralSource: text("referral_source").notNull().default(""),
  note: text("note").notNull().default(""),
  marketingConsent: integer("marketing_consent", { mode: "boolean" }).notNull().default(false),
  reminderConsent: integer("reminder_consent", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  serviceType: text("service_type").notNull(),
  startsAt: text("starts_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(120),
  status: text("status").notNull().default("scheduled"),
  depositStatus: text("deposit_status").notNull().default("unpaid"),
  depositAmount: integer("deposit_amount"),
  note: text("note").notNull().default(""),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const serviceRecords = sqliteTable("service_records", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  serviceAt: text("service_at").notNull(),
  serviceType: text("service_type").notNull(),
  note: text("note").notNull().default(""),
  careAt: text("care_at"),
  operationColor: text("operation_color").notNull().default(""),
  skinType: text("skin_type").notNull().default(""),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const formLinks = sqliteTable("form_links", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  status: text("status").notNull().default("active"),
  serviceType: text("service_type").notNull().default("綜合表單"),
  appointmentAt: text("appointment_at"),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: createdAt(),
});

export const consentSubmissions = sqliteTable("consent_submissions", {
  id: text("id").primaryKey(),
  linkId: text("link_id").notNull().unique(),
  customerId: text("customer_id").notNull(),
  serviceType: text("service_type").notNull(),
  consentSnapshot: text("consent_snapshot").notNull(),
  signatureDataUrl: text("signature_data_url").notNull(),
  submittedAt: text("submitted_at").notNull(),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: updatedAt(),
});
