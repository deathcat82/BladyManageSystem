UPDATE `app_settings` SET `value` = 'Lulu Studio紋繡美學', `updated_at` = CURRENT_TIMESTAMP WHERE `key` = 'studio_name';
--> statement-breakpoint
UPDATE `customers` SET `full_name` = '林安晴', `referral_source` = 'Instagram', `note` = 'Demo 客戶：可從管理端修改資料。', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 'demo-client-1';
--> statement-breakpoint
UPDATE `customers` SET `full_name` = '陳予恩', `referral_source` = '親友介紹', `note` = '首次服務後請於指定日保養關心。', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 'demo-client-2';
--> statement-breakpoint
UPDATE `appointments` SET `service_type` = '霧眉', `note` = 'Demo 今日預約', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 'demo-appointment-1';
--> statement-breakpoint
UPDATE `appointments` SET `service_type` = '補色', `note` = 'Demo 隔日預約', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 'demo-appointment-2';
--> statement-breakpoint
UPDATE `service_records` SET `service_type` = '霧眉', `note` = 'Demo 保養關心紀錄', `updated_at` = CURRENT_TIMESTAMP WHERE `id` = 'demo-service-1';