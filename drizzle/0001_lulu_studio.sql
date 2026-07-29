DROP TABLE IF EXISTS audit_logs;
--> statement-breakpoint
DROP TABLE IF EXISTS staff_users;
--> statement-breakpoint
DROP TABLE IF EXISTS consent_versions;
--> statement-breakpoint
DROP TABLE IF EXISTS consent_submissions;
--> statement-breakpoint
DROP TABLE IF EXISTS form_links;
--> statement-breakpoint
DROP TABLE IF EXISTS service_records;
--> statement-breakpoint
DROP TABLE IF EXISTS customers;
--> statement-breakpoint
DROP TABLE IF EXISTS app_settings;
--> statement-breakpoint
CREATE TABLE `customers` (
  `id` text PRIMARY KEY NOT NULL,
  `full_name` text NOT NULL,
  `phone` text NOT NULL,
  `line_id` text DEFAULT '' NOT NULL,
  `birthday` text NOT NULL,
  `referral_source` text DEFAULT '' NOT NULL,
  `note` text DEFAULT '' NOT NULL,
  `marketing_consent` integer DEFAULT false NOT NULL,
  `reminder_consent` integer DEFAULT false NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customers_search_idx` ON `customers` (`full_name`, `phone`, `birthday`, `line_id`);
--> statement-breakpoint
CREATE TABLE `appointments` (
  `id` text PRIMARY KEY NOT NULL,
  `customer_id` text NOT NULL,
  `service_type` text NOT NULL,
  `starts_at` text NOT NULL,
  `duration_minutes` integer DEFAULT 120 NOT NULL,
  `status` text DEFAULT 'scheduled' NOT NULL,
  `note` text DEFAULT '' NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `appointments_starts_at_idx` ON `appointments` (`starts_at`);
--> statement-breakpoint
CREATE TABLE `service_records` (
  `id` text PRIMARY KEY NOT NULL,
  `customer_id` text NOT NULL,
  `service_at` text NOT NULL,
  `service_type` text NOT NULL,
  `note` text DEFAULT '' NOT NULL,
  `care_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `service_records_care_at_idx` ON `service_records` (`care_at`);
--> statement-breakpoint
CREATE TABLE `form_links` (
  `id` text PRIMARY KEY NOT NULL,
  `token_hash` text NOT NULL UNIQUE,
  `status` text DEFAULT 'active' NOT NULL,
  `service_type` text DEFAULT '霧眉' NOT NULL,
  `appointment_at` text,
  `expires_at` text NOT NULL,
  `used_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `consent_submissions` (
  `id` text PRIMARY KEY NOT NULL,
  `link_id` text NOT NULL UNIQUE,
  `customer_id` text NOT NULL,
  `service_type` text NOT NULL,
  `consent_snapshot` text NOT NULL,
  `signature_data_url` text NOT NULL,
  `submitted_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);