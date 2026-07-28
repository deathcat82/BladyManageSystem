import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const createdAt = () => text("created_at").notNull().default(sql.raw("CURRENT_TIMESTAMP"));

export const staffUsers = sqliteTable("staff_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const consentVersions = sqliteTable("consent_versions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const formLinks = sqliteTable("form_links", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  status: text("status").notNull().default("active"),
  expiresAt: text("expires_at").notNull(),
  consentVersionId: text("consent_version_id").notNull(),
  createdBy: text("created_by").notNull(),
  usedAt: text("used_at"),
  createdAt: createdAt(),
});

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  fullNameEncrypted: text("full_name_encrypted").notNull(),
  phoneEncrypted: text("phone_encrypted").notNull(),
  lineIdEncrypted: text("line_id_encrypted"),
  birthdayEncrypted: text("birthday_encrypted").notNull(),
  referralSource: text("referral_source").notNull(),
  noteEncrypted: text("note_encrypted").notNull().default(""),
  marketingConsent: integer("marketing_consent", { mode: "boolean" }).notNull().default(false),
  reminderConsent: integer("reminder_consent", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export const consentSubmissions = sqliteTable("consent_submissions", {
  id: text("id").primaryKey(),
  linkId: text("link_id").notNull().unique(),
  customerId: text("customer_id").notNull(),
  consentVersionId: text("consent_version_id").notNull(),
  signatureKey: text("signature_key").notNull(),
  documentHash: text("document_hash").notNull(),
  submittedAt: text("submitted_at").notNull(),
});

export const serviceRecords = sqliteTable("service_records", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  serviceAt: text("service_at").notNull(),
  serviceName: text("service_name").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(120),
  noteEncrypted: text("note_encrypted").notNull().default(""),
  reminderAt: text("reminder_at"),
  createdAt: createdAt(),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql.raw("CURRENT_TIMESTAMP")),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  createdAt: createdAt(),
});
