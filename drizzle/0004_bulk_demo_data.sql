INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-01', '王宛庭', '0910000137', 'lulu.demo.01', '1988-02-04', 'Instagram', 'Demo 虛構客戶 01，皮膚偏乾，建議加強術後保濕。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-01', 'demo-bulk-01', '2026-07-03T11:00:00', '霧唇', '本次留色穩定，持續安排保養關心。', '2026-07-04', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-01', 'demo-bulk-01', '補色', '2026-07-06T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：已說明術後注意事項與回覆窗口。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-02', '李品妍', '0910000274', 'lulu.demo.02', '1989-03-07', '親友介紹', 'Demo 虛構客戶 02，本次留色穩定，持續安排保養關心。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-02', 'demo-bulk-02', '2026-07-05T11:00:00', '補色', '已說明術後注意事項與回覆窗口。', '2026-07-06', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-02', 'demo-bulk-02', '霧眉', '2026-07-11T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：喜歡較柔和的色澤，後續視恢復狀況補色。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-03', '張安琪', '0910000411', 'lulu.demo.03', '1990-04-10', 'Google 搜尋', 'Demo 虛構客戶 03，已說明術後注意事項與回覆窗口。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-03', 'demo-bulk-03', '2026-08-07T11:00:00', '霧眉', '喜歡較柔和的色澤，後續視恢復狀況補色。', '2026-08-08', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-03', 'demo-bulk-03', '霧唇', '2026-07-16T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：偏好自然柔霧感，服務前再次確認眉型。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-04', '陳思妤', '0910000548', 'lulu.demo.04', '1991-05-13', 'Facebook', 'Demo 虛構客戶 04，喜歡較柔和的色澤，後續視恢復狀況補色。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-04', 'demo-bulk-04', '2026-07-09T11:00:00', '霧唇', '偏好自然柔霧感，服務前再次確認眉型。', '2026-07-10', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-04', 'demo-bulk-04', '補色', '2026-08-21T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：皮膚偏乾，建議加強術後保濕。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-05', '林佳蓉', '0910000685', 'lulu.demo.05', '1992-06-16', 'Instagram', 'Demo 虛構客戶 05，偏好自然柔霧感，服務前再次確認眉型。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-05', 'demo-bulk-05', '2026-07-11T11:00:00', '補色', '皮膚偏乾，建議加強術後保濕。', '2026-07-12', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-05', 'demo-bulk-05', '霧眉', '2026-07-26T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：本次留色穩定，持續安排保養關心。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-06', '黃書妍', '0910000822', 'lulu.demo.06', '1993-07-19', '親友介紹', 'Demo 虛構客戶 06，皮膚偏乾，建議加強術後保濕。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-06', 'demo-bulk-06', '2026-08-13T11:00:00', '霧眉', '本次留色穩定，持續安排保養關心。', '2026-08-14', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-06', 'demo-bulk-06', '霧唇', '2026-07-03T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：已說明術後注意事項與回覆窗口。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-07', '吳雅婷', '0910000959', 'lulu.demo.07', '1994-08-22', 'Google 搜尋', 'Demo 虛構客戶 07，本次留色穩定，持續安排保養關心。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-07', 'demo-bulk-07', '2026-07-15T11:00:00', '霧唇', '已說明術後注意事項與回覆窗口。', '2026-07-16', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-07', 'demo-bulk-07', '補色', '2026-07-08T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：喜歡較柔和的色澤，後續視恢復狀況補色。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-08', '劉若彤', '0910001096', 'lulu.demo.08', '1995-09-25', 'Facebook', 'Demo 虛構客戶 08，已說明術後注意事項與回覆窗口。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-08', 'demo-bulk-08', '2026-07-17T11:00:00', '補色', '喜歡較柔和的色澤，後續視恢復狀況補色。', '2026-07-18', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-08', 'demo-bulk-08', '霧眉', '2026-08-13T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：偏好自然柔霧感，服務前再次確認眉型。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-09', '蔡依潔', '0910001233', 'lulu.demo.09', '1996-10-01', 'Instagram', 'Demo 虛構客戶 09，喜歡較柔和的色澤，後續視恢復狀況補色。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-09', 'demo-bulk-09', '2026-08-19T11:00:00', '霧眉', '偏好自然柔霧感，服務前再次確認眉型。', '2026-08-20', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-09', 'demo-bulk-09', '霧唇', '2026-07-18T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：皮膚偏乾，建議加強術後保濕。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-10', '楊雨晴', '0910001370', 'lulu.demo.10', '1997-11-04', '親友介紹', 'Demo 虛構客戶 10，偏好自然柔霧感，服務前再次確認眉型。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-10', 'demo-bulk-10', '2026-07-21T11:00:00', '霧唇', '皮膚偏乾，建議加強術後保濕。', '2026-07-22', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-10', 'demo-bulk-10', '補色', '2026-07-23T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：本次留色穩定，持續安排保養關心。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-11', '王宛庭', '0910001507', 'lulu.demo.11', '1998-12-07', 'Google 搜尋', 'Demo 虛構客戶 11，皮膚偏乾，建議加強術後保濕。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-11', 'demo-bulk-11', '2026-07-23T11:00:00', '補色', '本次留色穩定，持續安排保養關心。', '2026-07-24', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-11', 'demo-bulk-11', '霧眉', '2026-07-28T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：已說明術後注意事項與回覆窗口。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-12', '李品妍', '0910001644', 'lulu.demo.12', '1999-01-10', 'Facebook', 'Demo 虛構客戶 12，本次留色穩定，持續安排保養關心。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-12', 'demo-bulk-12', '2026-08-25T11:00:00', '霧眉', '已說明術後注意事項與回覆窗口。', '2026-08-26', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-12', 'demo-bulk-12', '霧唇', '2026-08-05T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：喜歡較柔和的色澤，後續視恢復狀況補色。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-13', '張安琪', '0910001781', 'lulu.demo.13', '2000-02-13', 'Instagram', 'Demo 虛構客戶 13，已說明術後注意事項與回覆窗口。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-13', 'demo-bulk-13', '2026-07-27T11:00:00', '霧唇', '喜歡較柔和的色澤，後續視恢復狀況補色。', '2026-07-28', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-13', 'demo-bulk-13', '補色', '2026-07-10T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：偏好自然柔霧感，服務前再次確認眉型。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-14', '陳思妤', '0910001918', 'lulu.demo.14', '2001-03-16', '親友介紹', 'Demo 虛構客戶 14，喜歡較柔和的色澤，後續視恢復狀況補色。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-14', 'demo-bulk-14', '2026-07-01T11:00:00', '補色', '偏好自然柔霧感，服務前再次確認眉型。', '2026-07-02', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-14', 'demo-bulk-14', '霧眉', '2026-07-15T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：皮膚偏乾，建議加強術後保濕。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-15', '林佳蓉', '0910002055', 'lulu.demo.15', '1987-04-19', 'Google 搜尋', 'Demo 虛構客戶 15，偏好自然柔霧感，服務前再次確認眉型。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-15', 'demo-bulk-15', '2026-08-03T11:00:00', '霧眉', '皮膚偏乾，建議加強術後保濕。', '2026-08-04', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-15', 'demo-bulk-15', '霧唇', '2026-07-20T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：本次留色穩定，持續安排保養關心。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-16', '黃書妍', '0910002192', 'lulu.demo.16', '1988-05-22', 'Facebook', 'Demo 虛構客戶 16，皮膚偏乾，建議加強術後保濕。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-16', 'demo-bulk-16', '2026-07-05T11:00:00', '霧唇', '本次留色穩定，持續安排保養關心。', '2026-07-06', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-16', 'demo-bulk-16', '補色', '2026-08-25T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：已說明術後注意事項與回覆窗口。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-17', '吳雅婷', '0910002329', 'lulu.demo.17', '1989-06-25', 'Instagram', 'Demo 虛構客戶 17，本次留色穩定，持續安排保養關心。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-17', 'demo-bulk-17', '2026-07-07T11:00:00', '補色', '已說明術後注意事項與回覆窗口。', '2026-07-08', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-17', 'demo-bulk-17', '霧眉', '2026-07-02T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：喜歡較柔和的色澤，後續視恢復狀況補色。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-18', '劉若彤', '0910002466', 'lulu.demo.18', '1990-07-01', '親友介紹', 'Demo 虛構客戶 18，已說明術後注意事項與回覆窗口。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-18', 'demo-bulk-18', '2026-08-09T11:00:00', '霧眉', '喜歡較柔和的色澤，後續視恢復狀況補色。', '2026-08-10', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-18', 'demo-bulk-18', '霧唇', '2026-07-07T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：偏好自然柔霧感，服務前再次確認眉型。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-19', '蔡依潔', '0910002603', 'lulu.demo.19', '1991-08-04', 'Google 搜尋', 'Demo 虛構客戶 19，喜歡較柔和的色澤，後續視恢復狀況補色。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-19', 'demo-bulk-19', '2026-07-11T11:00:00', '霧唇', '偏好自然柔霧感，服務前再次確認眉型。', '2026-07-12', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-19', 'demo-bulk-19', '補色', '2026-07-12T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：皮膚偏乾，建議加強術後保濕。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-20', '楊雨晴', '0910002740', 'lulu.demo.20', '1992-09-07', 'Facebook', 'Demo 虛構客戶 20，偏好自然柔霧感，服務前再次確認眉型。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-20', 'demo-bulk-20', '2026-07-13T11:00:00', '補色', '皮膚偏乾，建議加強術後保濕。', '2026-07-14', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-20', 'demo-bulk-20', '霧眉', '2026-08-17T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：本次留色穩定，持續安排保養關心。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-21', '王宛庭', '0910002877', 'lulu.demo.21', '1993-10-10', 'Instagram', 'Demo 虛構客戶 21，皮膚偏乾，建議加強術後保濕。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-21', 'demo-bulk-21', '2026-08-15T11:00:00', '霧眉', '本次留色穩定，持續安排保養關心。', '2026-08-16', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-21', 'demo-bulk-21', '霧唇', '2026-07-22T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：已說明術後注意事項與回覆窗口。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-22', '李品妍', '0910003014', 'lulu.demo.22', '1994-11-13', '親友介紹', 'Demo 虛構客戶 22，本次留色穩定，持續安排保養關心。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-22', 'demo-bulk-22', '2026-07-17T11:00:00', '霧唇', '已說明術後注意事項與回覆窗口。', '2026-07-18', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-22', 'demo-bulk-22', '補色', '2026-07-27T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：喜歡較柔和的色澤，後續視恢復狀況補色。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-23', '張安琪', '0910003151', 'lulu.demo.23', '1995-12-16', 'Google 搜尋', 'Demo 虛構客戶 23，已說明術後注意事項與回覆窗口。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-23', 'demo-bulk-23', '2026-07-19T11:00:00', '補色', '喜歡較柔和的色澤，後續視恢復狀況補色。', '2026-07-20', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-23', 'demo-bulk-23', '霧眉', '2026-07-04T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：偏好自然柔霧感，服務前再次確認眉型。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-24', '陳思妤', '0910003288', 'lulu.demo.24', '1996-01-19', 'Facebook', 'Demo 虛構客戶 24，喜歡較柔和的色澤，後續視恢復狀況補色。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-24', 'demo-bulk-24', '2026-08-21T11:00:00', '霧眉', '偏好自然柔霧感，服務前再次確認眉型。', '2026-08-22', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-24', 'demo-bulk-24', '霧唇', '2026-08-09T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：皮膚偏乾，建議加強術後保濕。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-25', '林佳蓉', '0910003425', 'lulu.demo.25', '1997-02-22', 'Instagram', 'Demo 虛構客戶 25，偏好自然柔霧感，服務前再次確認眉型。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-25', 'demo-bulk-25', '2026-07-23T11:00:00', '霧唇', '皮膚偏乾，建議加強術後保濕。', '2026-07-24', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-25', 'demo-bulk-25', '補色', '2026-07-14T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：本次留色穩定，持續安排保養關心。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-26', '黃書妍', '0910003562', 'lulu.demo.26', '1998-03-25', '親友介紹', 'Demo 虛構客戶 26，皮膚偏乾，建議加強術後保濕。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-26', 'demo-bulk-26', '2026-07-25T11:00:00', '補色', '本次留色穩定，持續安排保養關心。', '2026-07-26', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-26', 'demo-bulk-26', '霧眉', '2026-07-19T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：已說明術後注意事項與回覆窗口。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-27', '吳雅婷', '0910003699', 'lulu.demo.27', '1999-04-01', 'Google 搜尋', 'Demo 虛構客戶 27，本次留色穩定，持續安排保養關心。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-27', 'demo-bulk-27', '2026-08-27T11:00:00', '霧眉', '已說明術後注意事項與回覆窗口。', '2026-08-28', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-27', 'demo-bulk-27', '霧唇', '2026-07-24T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：喜歡較柔和的色澤，後續視恢復狀況補色。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-28', '劉若彤', '0910003836', 'lulu.demo.28', '2000-05-04', 'Facebook', 'Demo 虛構客戶 28，已說明術後注意事項與回覆窗口。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-28', 'demo-bulk-28', '2026-07-01T11:00:00', '霧唇', '喜歡較柔和的色澤，後續視恢復狀況補色。', '2026-07-02', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-28', 'demo-bulk-28', '補色', '2026-08-01T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：偏好自然柔霧感，服務前再次確認眉型。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-29', '蔡依潔', '0910003973', 'lulu.demo.29', '2001-06-07', 'Instagram', 'Demo 虛構客戶 29，喜歡較柔和的色澤，後續視恢復狀況補色。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-29', 'demo-bulk-29', '2026-07-03T11:00:00', '補色', '偏好自然柔霧感，服務前再次確認眉型。', '2026-07-04', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-29', 'demo-bulk-29', '霧眉', '2026-07-06T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：皮膚偏乾，建議加強術後保濕。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-30', '楊雨晴', '0910004110', 'lulu.demo.30', '1987-07-10', '親友介紹', 'Demo 虛構客戶 30，偏好自然柔霧感，服務前再次確認眉型。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-30', 'demo-bulk-30', '2026-08-05T11:00:00', '霧眉', '皮膚偏乾，建議加強術後保濕。', '2026-08-06', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-30', 'demo-bulk-30', '霧唇', '2026-07-11T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：本次留色穩定，持續安排保養關心。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-31', '王宛庭', '0910004247', 'lulu.demo.31', '1988-08-13', 'Google 搜尋', 'Demo 虛構客戶 31，皮膚偏乾，建議加強術後保濕。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-31', 'demo-bulk-31', '2026-07-07T11:00:00', '霧唇', '本次留色穩定，持續安排保養關心。', '2026-07-08', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-31', 'demo-bulk-31', '補色', '2026-07-16T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：已說明術後注意事項與回覆窗口。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-32', '李品妍', '0910004384', 'lulu.demo.32', '1989-09-16', 'Facebook', 'Demo 虛構客戶 32，本次留色穩定，持續安排保養關心。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-32', 'demo-bulk-32', '2026-07-09T11:00:00', '補色', '已說明術後注意事項與回覆窗口。', '2026-07-10', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-32', 'demo-bulk-32', '霧眉', '2026-08-21T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：喜歡較柔和的色澤，後續視恢復狀況補色。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-33', '張安琪', '0910004521', 'lulu.demo.33', '1990-10-19', 'Instagram', 'Demo 虛構客戶 33，已說明術後注意事項與回覆窗口。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-33', 'demo-bulk-33', '2026-08-11T11:00:00', '霧眉', '喜歡較柔和的色澤，後續視恢復狀況補色。', '2026-08-12', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-33', 'demo-bulk-33', '霧唇', '2026-07-26T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：偏好自然柔霧感，服務前再次確認眉型。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-34', '陳思妤', '0910004658', 'lulu.demo.34', '1991-11-22', '親友介紹', 'Demo 虛構客戶 34，喜歡較柔和的色澤，後續視恢復狀況補色。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-34', 'demo-bulk-34', '2026-07-13T11:00:00', '霧唇', '偏好自然柔霧感，服務前再次確認眉型。', '2026-07-14', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-34', 'demo-bulk-34', '補色', '2026-07-03T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：皮膚偏乾，建議加強術後保濕。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-35', '林佳蓉', '0910004795', 'lulu.demo.35', '1992-12-25', 'Google 搜尋', 'Demo 虛構客戶 35，偏好自然柔霧感，服務前再次確認眉型。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-35', 'demo-bulk-35', '2026-07-15T11:00:00', '補色', '皮膚偏乾，建議加強術後保濕。', '2026-07-16', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-35', 'demo-bulk-35', '霧眉', '2026-07-08T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：本次留色穩定，持續安排保養關心。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-36', '黃書妍', '0910004932', 'lulu.demo.36', '1993-01-01', 'Facebook', 'Demo 虛構客戶 36，皮膚偏乾，建議加強術後保濕。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-36', 'demo-bulk-36', '2026-08-17T11:00:00', '霧眉', '本次留色穩定，持續安排保養關心。', '2026-08-18', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-36', 'demo-bulk-36', '霧唇', '2026-08-13T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：已說明術後注意事項與回覆窗口。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-37', '吳雅婷', '0910005069', 'lulu.demo.37', '1994-02-04', 'Instagram', 'Demo 虛構客戶 37，本次留色穩定，持續安排保養關心。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-37', 'demo-bulk-37', '2026-07-19T11:00:00', '霧唇', '已說明術後注意事項與回覆窗口。', '2026-07-20', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-37', 'demo-bulk-37', '補色', '2026-07-18T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：喜歡較柔和的色澤，後續視恢復狀況補色。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-38', '劉若彤', '0910005206', 'lulu.demo.38', '1995-03-07', '親友介紹', 'Demo 虛構客戶 38，已說明術後注意事項與回覆窗口。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-38', 'demo-bulk-38', '2026-07-21T11:00:00', '補色', '喜歡較柔和的色澤，後續視恢復狀況補色。', '2026-07-22', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-38', 'demo-bulk-38', '霧眉', '2026-07-23T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：偏好自然柔霧感，服務前再次確認眉型。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-39', '蔡依潔', '0910005343', 'lulu.demo.39', '1996-04-10', 'Google 搜尋', 'Demo 虛構客戶 39，喜歡較柔和的色澤，後續視恢復狀況補色。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-39', 'demo-bulk-39', '2026-08-23T11:00:00', '霧眉', '偏好自然柔霧感，服務前再次確認眉型。', '2026-08-24', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-39', 'demo-bulk-39', '霧唇', '2026-07-28T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：皮膚偏乾，建議加強術後保濕。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-40', '楊雨晴', '0910005480', 'lulu.demo.40', '1997-05-13', 'Facebook', 'Demo 虛構客戶 40，偏好自然柔霧感，服務前再次確認眉型。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-40', 'demo-bulk-40', '2026-07-25T11:00:00', '霧唇', '皮膚偏乾，建議加強術後保濕。', '2026-07-26', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-40', 'demo-bulk-40', '補色', '2026-08-05T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：本次留色穩定，持續安排保養關心。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-41', '王宛庭', '0910005617', 'lulu.demo.41', '1998-06-16', 'Instagram', 'Demo 虛構客戶 41，皮膚偏乾，建議加強術後保濕。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-41', 'demo-bulk-41', '2026-07-27T11:00:00', '補色', '本次留色穩定，持續安排保養關心。', '2026-07-28', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-41', 'demo-bulk-41', '霧眉', '2026-07-10T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：已說明術後注意事項與回覆窗口。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-42', '李品妍', '0910005754', 'lulu.demo.42', '1999-07-19', '親友介紹', 'Demo 虛構客戶 42，本次留色穩定，持續安排保養關心。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-42', 'demo-bulk-42', '2026-08-01T11:00:00', '霧眉', '已說明術後注意事項與回覆窗口。', '2026-08-02', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-42', 'demo-bulk-42', '霧唇', '2026-07-15T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：喜歡較柔和的色澤，後續視恢復狀況補色。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-43', '張安琪', '0910005891', 'lulu.demo.43', '2000-08-22', 'Google 搜尋', 'Demo 虛構客戶 43，已說明術後注意事項與回覆窗口。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-43', 'demo-bulk-43', '2026-07-03T11:00:00', '霧唇', '喜歡較柔和的色澤，後續視恢復狀況補色。', '2026-07-04', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-43', 'demo-bulk-43', '補色', '2026-07-20T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：偏好自然柔霧感，服務前再次確認眉型。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-44', '陳思妤', '0910006028', 'lulu.demo.44', '2001-09-25', 'Facebook', 'Demo 虛構客戶 44，喜歡較柔和的色澤，後續視恢復狀況補色。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-44', 'demo-bulk-44', '2026-07-05T11:00:00', '補色', '偏好自然柔霧感，服務前再次確認眉型。', '2026-07-06', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-44', 'demo-bulk-44', '霧眉', '2026-08-25T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：皮膚偏乾，建議加強術後保濕。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-45', '林佳蓉', '0910006165', 'lulu.demo.45', '1987-10-01', 'Instagram', 'Demo 虛構客戶 45，偏好自然柔霧感，服務前再次確認眉型。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-45', 'demo-bulk-45', '2026-08-07T11:00:00', '霧眉', '皮膚偏乾，建議加強術後保濕。', '2026-08-08', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-45', 'demo-bulk-45', '霧唇', '2026-07-02T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：本次留色穩定，持續安排保養關心。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-46', '黃書妍', '0910006302', 'lulu.demo.46', '1988-11-04', '親友介紹', 'Demo 虛構客戶 46，皮膚偏乾，建議加強術後保濕。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-46', 'demo-bulk-46', '2026-07-09T11:00:00', '霧唇', '本次留色穩定，持續安排保養關心。', '2026-07-10', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-46', 'demo-bulk-46', '補色', '2026-07-07T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：已說明術後注意事項與回覆窗口。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-47', '吳雅婷', '0910006439', 'lulu.demo.47', '1989-12-07', 'Google 搜尋', 'Demo 虛構客戶 47，本次留色穩定，持續安排保養關心。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-47', 'demo-bulk-47', '2026-07-11T11:00:00', '補色', '已說明術後注意事項與回覆窗口。', '2026-07-12', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-47', 'demo-bulk-47', '霧眉', '2026-07-12T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：喜歡較柔和的色澤，後續視恢復狀況補色。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-48', '劉若彤', '0910006576', 'lulu.demo.48', '1990-01-10', 'Facebook', 'Demo 虛構客戶 48，已說明術後注意事項與回覆窗口。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-48', 'demo-bulk-48', '2026-08-13T11:00:00', '霧眉', '喜歡較柔和的色澤，後續視恢復狀況補色。', '2026-08-14', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-48', 'demo-bulk-48', '霧唇', '2026-08-17T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：偏好自然柔霧感，服務前再次確認眉型。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-49', '蔡依潔', '0910006713', 'lulu.demo.49', '1991-02-13', 'Instagram', 'Demo 虛構客戶 49，喜歡較柔和的色澤，後續視恢復狀況補色。', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-49', 'demo-bulk-49', '2026-07-15T11:00:00', '霧唇', '偏好自然柔霧感，服務前再次確認眉型。', '2026-07-16', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-49', 'demo-bulk-49', '補色', '2026-07-22T10:00:00', 90, 'scheduled', 'Demo 行事曆待辦：皮膚偏乾，建議加強術後保濕。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES ('demo-bulk-50', '楊雨晴', '0910006850', 'lulu.demo.50', '1992-03-16', '親友介紹', 'Demo 虛構客戶 50，偏好自然柔霧感，服務前再次確認眉型。', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES ('demo-bulk-service-50', 'demo-bulk-50', '2026-07-17T11:00:00', '補色', '皮膚偏乾，建議加強術後保濕。', '2026-07-18', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES ('demo-bulk-appointment-50', 'demo-bulk-50', '霧眉', '2026-07-27T14:00:00', 120, 'scheduled', 'Demo 行事曆待辦：本次留色穩定，持續安排保養關心。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
