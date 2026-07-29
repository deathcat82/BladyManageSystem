import { getD1 } from "../../../db";

type JsonRecord = Record<string, unknown>;

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const asText = (value: unknown) => typeof value === "string" ? value.trim() : "";
const asNumber = (value: unknown, fallback: number) => {
  const valueAsNumber = Number(value);
  return Number.isFinite(valueAsNumber) ? valueAsNumber : fallback;
};
const json = (payload: unknown, status = 200) => Response.json(payload, { status });

async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
}

async function settings(db: D1Database) {
  const result = await db.prepare("SELECT key, value FROM app_settings").all<{ key: string; value: string }>();
  return Object.fromEntries((result.results || []).map((item) => [item.key, item.value]));
}

async function seed(db: D1Database) {
  const marker = await db.prepare("SELECT value FROM app_settings WHERE key = 'seeded_at'").first();
  if (marker) return;
  const stamp = now();
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)").bind("studio_name", "Lulu Studio紋繡美學", stamp),
    db.prepare("INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)").bind("default_link_days", "1", stamp),
    db.prepare("INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)").bind("seeded_at", stamp, stamp),
    db.prepare("INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("demo-client-1", "林安晴", "0912-345-678", "ann.lulu", "1995-08-18", "Instagram", "Demo 客戶：可從管理端修改資料。", 1, 1, stamp, stamp),
    db.prepare("INSERT OR IGNORE INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("demo-client-2", "陳予恩", "0988-226-009", "", "1991-11-02", "親友介紹", "首次服務後請於指定日保養關心。", 0, 1, stamp, stamp),
    db.prepare("INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("demo-appointment-1", "demo-client-1", "霧眉", new Date().toISOString().slice(0, 10) + "T14:00:00.000Z", 120, "scheduled", "Demo 今日預約", stamp, stamp),
    db.prepare("INSERT OR IGNORE INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("demo-appointment-2", "demo-client-2", "補色", new Date(Date.now() + 86400000).toISOString().slice(0, 10) + "T11:30:00.000Z", 90, "scheduled", "Demo 隔日預約", stamp, stamp),
    db.prepare("INSERT OR IGNORE INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind("demo-service-1", "demo-client-2", new Date().toISOString().slice(0, 10) + "T10:00:00.000Z", "霧眉", "Demo 保養關心紀錄", new Date().toISOString().slice(0, 10), stamp, stamp),
  ]);
}

async function bootstrap(db: D1Database) {
  await seed(db);
  const [customers, appointments, services, links, currentSettings] = await Promise.all([
    db.prepare("SELECT * FROM customers ORDER BY updated_at DESC").all(),
    db.prepare("SELECT * FROM appointments ORDER BY starts_at ASC").all(),
    db.prepare("SELECT * FROM service_records ORDER BY service_at DESC").all(),
    db.prepare("SELECT id, status, service_type, expires_at, used_at, created_at FROM form_links ORDER BY created_at DESC LIMIT 30").all(),
    settings(db),
  ]);
  return { customers: customers.results || [], appointments: appointments.results || [], services: services.results || [], links: links.results || [], settings: currentSettings };
}

function missing(body: JsonRecord, fields: string[]) {
  return fields.some((field) => !asText(body[field]));
}

export async function GET() {
  try {
    return json(await bootstrap(getD1()));
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "無法讀取管理資料。" }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json<JsonRecord>();
    const action = asText(body.action);
    const db = getD1();
    await seed(db);
    const stamp = now();

    if (action === "createCustomer") {
      if (missing(body, ["fullName", "phone", "birthday"])) return json({ error: "請填寫姓名、電話與生日。" }, 400);
      const customerId = id();
      await db.prepare("INSERT INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(customerId, asText(body.fullName), asText(body.phone), asText(body.lineId), asText(body.birthday), asText(body.referralSource), asText(body.note), body.marketingConsent ? 1 : 0, body.reminderConsent ? 1 : 0, stamp, stamp).run();
      return json({ ok: true, id: customerId });
    }

    if (action === "updateCustomer") {
      if (!asText(body.id)) return json({ error: "缺少客戶識別碼。" }, 400);
      if (missing(body, ["fullName", "phone", "birthday"])) return json({ error: "請填寫姓名、電話與生日。" }, 400);
      await db.prepare("UPDATE customers SET full_name = ?, phone = ?, line_id = ?, birthday = ?, referral_source = ?, note = ?, marketing_consent = ?, reminder_consent = ?, updated_at = ? WHERE id = ?")
        .bind(asText(body.fullName), asText(body.phone), asText(body.lineId), asText(body.birthday), asText(body.referralSource), asText(body.note), body.marketingConsent ? 1 : 0, body.reminderConsent ? 1 : 0, stamp, asText(body.id)).run();
      return json({ ok: true });
    }

    if (action === "saveAppointment") {
      if (missing(body, ["customerId", "serviceType", "startsAt"])) return json({ error: "請選擇客戶、服務與預約時間。" }, 400);
      const appointmentId = asText(body.id) || id();
      await db.prepare("INSERT INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET customer_id = excluded.customer_id, service_type = excluded.service_type, starts_at = excluded.starts_at, duration_minutes = excluded.duration_minutes, status = excluded.status, note = excluded.note, updated_at = excluded.updated_at")
        .bind(appointmentId, asText(body.customerId), asText(body.serviceType), asText(body.startsAt), asNumber(body.durationMinutes, 120), asText(body.status) || "scheduled", asText(body.note), stamp, stamp).run();
      return json({ ok: true, id: appointmentId });
    }

    if (action === "saveService") {
      if (missing(body, ["customerId", "serviceType", "serviceAt"])) return json({ error: "請選擇客戶、服務與服務時間。" }, 400);
      const serviceId = asText(body.id) || id();
      await db.prepare("INSERT INTO service_records (id, customer_id, service_at, service_type, note, care_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET customer_id = excluded.customer_id, service_at = excluded.service_at, service_type = excluded.service_type, note = excluded.note, care_at = excluded.care_at, updated_at = excluded.updated_at")
        .bind(serviceId, asText(body.customerId), asText(body.serviceAt), asText(body.serviceType), asText(body.note), asText(body.careAt) || null, stamp, stamp).run();
      return json({ ok: true, id: serviceId });
    }

    if (action === "createFormLink") {
      const rawToken = (crypto.randomUUID() + crypto.randomUUID()).replaceAll("-", "");
      const days = Math.max(1, Math.min(30, asNumber(body.days, 1)));
      const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
      const linkId = id();
      await db.prepare("INSERT INTO form_links (id, token_hash, status, service_type, appointment_at, expires_at, created_at) VALUES (?, ?, 'active', ?, NULL, ?, ?)")
        .bind(linkId, await hash(rawToken), "綜合表單", expiresAt, stamp).run();
      return json({ ok: true, link: { id: linkId, token: rawToken, expiresAt, status: "active" } });
    }

    if (action === "revokeFormLink") {
      await db.prepare("UPDATE form_links SET status = 'revoked' WHERE id = ? AND status = 'active'").bind(asText(body.id)).run();
      return json({ ok: true });
    }

    if (action === "saveSettings") {
      const defaultDays = String(Math.max(1, Math.min(30, asNumber(body.defaultLinkDays, 1))));
      await db.batch([
        db.prepare("INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").bind("studio_name", asText(body.studioName) || "Lulu Studio紋繡美學", stamp),
        db.prepare("INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").bind("default_link_days", defaultDays, stamp),
      ]);
      return json({ ok: true });
    }

    return json({ error: "未知操作。" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "無法保存資料。" }, 500);
  }
}
