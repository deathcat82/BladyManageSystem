INSERT INTO `app_settings` (`key`, `value`, `updated_at`)
VALUES ('default_link_days', '1', CURRENT_TIMESTAMP)
ON CONFLICT(`key`) DO UPDATE SET `value` = '1', `updated_at` = CURRENT_TIMESTAMP;