-- Additive upgrade only: never execute the Demo seed migrations in production.
ALTER TABLE appointments ADD COLUMN deposit_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(deposit_status IN ('paid','unpaid'));
ALTER TABLE appointments ADD COLUMN deposit_amount INTEGER;

CREATE TABLE service_photos (
  id TEXT PRIMARY KEY NOT NULL,
  service_record_id TEXT NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK(stage IN ('before','after','supplementary')),
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  original_name TEXT NOT NULL DEFAULT '',
  byte_size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_service_photos_record_stage ON service_photos(service_record_id,stage,created_at);

-- D1 wraps migrations in a transaction. Defer references while replacing the
-- CHECK constraint, preserving form_links IDs referenced by existing consents.
PRAGMA defer_foreign_keys = ON;
CREATE TABLE form_links_upgrade (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','submitting','locked','used','revoked','expired')),
  expires_at TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  locked_at TEXT,
  used_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO form_links_upgrade SELECT id,token_hash,status,expires_at,attempt_count,locked_at,used_at,created_by,created_at FROM form_links;
DROP TABLE form_links;
ALTER TABLE form_links_upgrade RENAME TO form_links;
CREATE INDEX idx_form_links_status_expiry ON form_links(status,expires_at);
PRAGMA defer_foreign_keys = OFF;
PRAGMA foreign_key_check;
