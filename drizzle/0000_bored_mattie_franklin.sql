CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `consent_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`link_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`consent_version_id` text NOT NULL,
	`signature_key` text NOT NULL,
	`document_hash` text NOT NULL,
	`submitted_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `consent_submissions_link_id_unique` ON `consent_submissions` (`link_id`);--> statement-breakpoint
CREATE TABLE `consent_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name_encrypted` text NOT NULL,
	`phone_encrypted` text NOT NULL,
	`line_id_encrypted` text,
	`birthday_encrypted` text NOT NULL,
	`referral_source` text NOT NULL,
	`note_encrypted` text DEFAULT '' NOT NULL,
	`marketing_consent` integer DEFAULT false NOT NULL,
	`reminder_consent` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `form_links` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`expires_at` text NOT NULL,
	`consent_version_id` text NOT NULL,
	`created_by` text NOT NULL,
	`used_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `form_links_token_hash_unique` ON `form_links` (`token_hash`);--> statement-breakpoint
CREATE TABLE `service_records` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`service_at` text NOT NULL,
	`service_name` text NOT NULL,
	`duration_minutes` integer DEFAULT 120 NOT NULL,
	`note_encrypted` text DEFAULT '' NOT NULL,
	`reminder_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_users_email_unique` ON `staff_users` (`email`);