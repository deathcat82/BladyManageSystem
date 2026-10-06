PRAGMA foreign_keys = ON;

CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  normalized_phone TEXT NOT NULL UNIQUE,
  line_id TEXT NOT NULL DEFAULT '',
  line_user_id TEXT NOT NULL DEFAULT '',
  birthday TEXT NOT NULL,
  referral_source TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  reminder_consent INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT,
  deletion_review_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_customers_active_name ON customers(archived_at, full_name);
CREATE INDEX idx_customers_birthday ON customers(birthday);

CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  service_type TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  status TEXT NOT NULL DEFAULT 'scheduled',
  note TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_appointments_starts_at ON appointments(starts_at);
CREATE INDEX idx_appointments_customer_date ON appointments(customer_id, starts_at);

CREATE TABLE service_records (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  service_at TEXT NOT NULL,
  service_type TEXT NOT NULL,
  operation_color TEXT NOT NULL DEFAULT '',
  skin_type TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  care_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_service_records_customer_date ON service_records(customer_id, service_at);
CREATE INDEX idx_service_records_care_at ON service_records(care_at) WHERE care_at IS NOT NULL;

CREATE TABLE form_links (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'locked', 'used', 'revoked', 'expired')),
  expires_at TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  locked_at TEXT,
  used_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_form_links_status_expiry ON form_links(status, expires_at);

CREATE TABLE consent_submissions (
  id TEXT PRIMARY KEY,
  link_id TEXT NOT NULL UNIQUE REFERENCES form_links(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  contract_version TEXT NOT NULL,
  snapshot_ciphertext TEXT NOT NULL,
  snapshot_iv TEXT NOT NULL,
  signature_object_key TEXT NOT NULL,
  signature_sha256 TEXT NOT NULL,
  signature_content_type TEXT NOT NULL DEFAULT 'image/png',
  submitted_at TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'public-form'
);
CREATE INDEX idx_consent_submissions_customer ON consent_submissions(customer_id, submitted_at);

CREATE TABLE notification_preferences (
  customer_id TEXT PRIMARY KEY REFERENCES customers(id),
  birthday_offer_opt_in INTEGER NOT NULL DEFAULT 0,
  care_reminder_opt_in INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_outbox (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  kind TEXT NOT NULL CHECK(kind IN ('birthday_offer', 'care_reminder')),
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'held', 'sent', 'cancelled')),
  payload_summary TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notification_outbox_status_date ON notification_outbox(status, scheduled_at);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  changed_fields TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE backup_runs (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL
);

INSERT INTO app_settings(key, value) VALUES
  ('studio_name', 'Lulu Studio紋繡美學'),
  ('retention_years', '5'),
  ('privacy_contact', ''),
  ('consent_notice_version', '待工作室確認正式文字')
ON CONFLICT(key) DO NOTHING;

PRAGMA optimize;