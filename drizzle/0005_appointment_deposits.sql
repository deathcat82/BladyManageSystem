ALTER TABLE `appointments` ADD `deposit_status` text DEFAULT 'unpaid' NOT NULL;
--> statement-breakpoint
ALTER TABLE `appointments` ADD `deposit_amount` integer;
