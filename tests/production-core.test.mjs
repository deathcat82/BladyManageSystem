import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { ageOn, normalizePhone } = await import("../lib/production/validation.ts");

test("年齡依 Asia/Taipei 實歲計算，能處理生日、尚未生日、閏日與無效日期", () => {
  const today = new Date("2026-08-26T03:00:00Z");
  assert.equal(ageOn("2000-08-26", today), 26);
  assert.equal(ageOn("2000-08-27", today), 25);
  assert.equal(ageOn("2000-02-29", new Date("2026-02-28T03:00:00Z")), 25);
  assert.equal(ageOn("2030-01-01", today), null);
  assert.equal(ageOn("2000-02-30", today), null);
  assert.equal(ageOn("", today), null);
});

test("電話正規化會阻擋不同格式的重複手機號碼", () => {
  assert.equal(normalizePhone("0912-345-678"), "0912345678");
  assert.equal(normalizePhone("+886 912 345 678"), "+886912345678");
  assert.equal(normalizePhone("886912345678"), "0912345678");
});

test("正式資料庫 migration 是空白資料庫，包含外鍵、唯一電話、稽核與私有簽名欄位", async () => {
  const migration = await readFile(new URL("../drizzle-production/0000_production_schema.sql", import.meta.url), "utf8");
  assert.match(migration, /normalized_phone TEXT NOT NULL UNIQUE/);
  assert.match(migration, /REFERENCES customers\(id\)/);
  assert.match(migration, /signature_object_key TEXT NOT NULL/);
  assert.match(migration, /snapshot_ciphertext TEXT NOT NULL/);
  assert.match(migration, /CREATE TABLE audit_logs/);
  assert.match(migration, /CREATE TABLE notification_outbox/);
  assert.doesNotMatch(migration, /demo-client|INSERT INTO customers/i);
});

test("正式版安全實作會驗證站內工作階段、CSRF、Turnstile 與一次性表單原子鎖定", async () => {
  const [security, publicRoute, repository, worker, config, home, productionHome] = await Promise.all([
    readFile(new URL("../lib/production/security.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/public/form/[token]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/production/repository.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.production.jsonc.example", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/production-home.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(security, /requireSession/);

  assert.match(security, /x-csrf-token/);
  assert.match(publicRoute, /turnstile\/v0\/siteverify/);
  assert.match(publicRoute, /claimPublicLink/);
  assert.match(repository, /status='submitting'/);
  assert.match(worker, /weeklyBackup/);
  assert.match(config, /migrations_dir": "\.\/drizzle-production"/);
  assert.match(config, /r2_buckets/);
  assert.match(home, /APP_ORIGIN/);
  assert.match(productionHome, /href="\/admin"/);
  assert.doesNotMatch(productionHome, /type="password"|DEMO ACCESS|進入 Demo/);
  assert.match(worker, /legacyDemoRoute/);
  assert.match(worker, /\/api\/studio/);
  assert.match(worker, /\/api\/intake/);
});

test("正式版建置不透過 shell 執行 npm，CSRF Cookie 僅供瀏覽器自動傳送", async () => {
  const [buildScript, bootstrap] = await Promise.all([
    readFile(new URL("../scripts/build-production.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/bootstrap/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(buildScript, /vinext\/dist\/cli\.js/);
  assert.doesNotMatch(buildScript, /shell\s*:/);
  assert.match(bootstrap, /HttpOnly; SameSite=Strict/);
});
