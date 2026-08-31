CREATE TABLE `service_photos` (
  `id` text PRIMARY KEY NOT NULL,
  `service_record_id` text NOT NULL REFERENCES `service_records`(`id`) ON DELETE CASCADE,
  `customer_id` text NOT NULL REFERENCES `customers`(`id`) ON DELETE CASCADE,
  `stage` text NOT NULL CHECK(`stage` IN ('before', 'after', 'supplementary')),
  `object_key` text NOT NULL UNIQUE,
  `content_type` text NOT NULL,
  `original_name` text NOT NULL DEFAULT '',
  `byte_size` integer NOT NULL,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_service_photos_record_stage` ON `service_photos` (`service_record_id`, `stage`, `created_at`);

