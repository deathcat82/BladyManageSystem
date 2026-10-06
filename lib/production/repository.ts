import { DEFAULT_RETENTION_YEARS, FORM_MAX_ATTEMPTS } from "./constants";
import { normalizePhone, taipeiNow } from "./validation";
import type { ProductionEnv } from "./security";

type CustomerInput = { fullName: string; phone: string; lineId?: string; lineUserId?: string; birthday: string; referralSource?: string; note?: string; marketingConsent?: boolean; reminderConsent?: boolean };
type ServiceInput = { id?: string; customerId: string; serviceAt: string; serviceType: string; operationColor?: string; skinType?: string; note?: string; careAt?: string | null };
type AppointmentInput = { id?: string; customerId: string; serviceType: string; startsAt: string; durationMinutes?: number; status?: string; depositStatus?: string; depositAmount?: number | null; note?: string };

export const id = () => crypto.randomUUID();

export async function ensureCustomerExists(db: D1Database, customerId: string): Promise<void> {
  const customer = await db.prepare("SELECT id FROM customers WHERE id = ? AND archived_at IS NULL").bind(customerId).first();
  if (!customer) throw new Response("找不到可用客戶資料", { status: 422 });
}

export async function writeAudit(db: D1Database, actorEmail: string, action: string, entityType: string, entityId: string, changedFields: string[]): Promise<void> {
  await db.prepare("INSERT INTO audit_logs (id, actor_email, action, entity_type, entity_id, changed_fields, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id(), actorEmail, action, entityType, entityId, JSON.stringify(changedFields), taipeiNow()).run();
}

export async function createCustomer(env: ProductionEnv, input: CustomerInput, actor: string): Promise<string> {
  const normalized = normalizePhone(input.phone);
  if (normalized.length < 8) throw new Response("請輸入有效手機號碼", { status: 422 });
  const existing = await env.DB.prepare("SELECT full_name FROM customers WHERE normalized_phone = ?").bind(normalized).first<{ full_name: string }>();
  if (existing) throw new Response(`此手機號碼已由「${existing.full_name}」使用`, { status: 409 });
  const customerId = id();
  const now = taipeiNow();
  const retentionYears = Number((await env.DB.prepare("SELECT value FROM app_settings WHERE key = 'retention_years'").first<{ value: string }>())?.value || DEFAULT_RETENTION_YEARS);
  const reviewAt = new Date(new Date(now).setFullYear(new Date(now).getFullYear() + retentionYears)).toISOString();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO customers (id, full_name, phone, normalized_phone, line_id, line_user_id, birthday, referral_source, note, marketing_consent, reminder_consent, deletion_review_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(customerId, input.fullName.trim(), input.phone.trim(), normalized, input.lineId?.trim() || "", input.lineUserId?.trim() || "", input.birthday, input.referralSource?.trim() || "", input.note?.trim() || "", input.marketingConsent ? 1 : 0, input.reminderConsent ? 1 : 0, reviewAt, now, now),
    env.DB.prepare("INSERT INTO notification_preferences (customer_id, birthday_offer_opt_in, care_reminder_opt_in, updated_at) VALUES (?, ?, ?, ?)")
      .bind(customerId, input.marketingConsent ? 1 : 0, input.reminderConsent ? 1 : 0, now),
  ]);
  await writeAudit(env.DB, actor, "create", "customer", customerId, ["基本資料"]);
  return customerId;
}

export async function updateCustomer(env: ProductionEnv, customerId: string, input: CustomerInput, actor: string): Promise<void> {
  const normalized = normalizePhone(input.phone);
  const existing = await env.DB.prepare("SELECT full_name FROM customers WHERE normalized_phone = ? AND id != ?").bind(normalized, customerId).first<{ full_name: string }>();
  if (existing) throw new Response(`此手機號碼已由「${existing.full_name}」使用`, { status: 409 });
  const now = taipeiNow();
  const result = await env.DB.prepare("UPDATE customers SET full_name=?, phone=?, normalized_phone=?, line_id=?, line_user_id=?, birthday=?, referral_source=?, note=?, marketing_consent=?, reminder_consent=?, updated_at=? WHERE id=?")
    .bind(input.fullName.trim(), input.phone.trim(), normalized, input.lineId?.trim() || "", input.lineUserId?.trim() || "", input.birthday, input.referralSource?.trim() || "", input.note?.trim() || "", input.marketingConsent ? 1 : 0, input.reminderConsent ? 1 : 0, now, customerId).run();
  if (!result.meta.changes) throw new Response("找不到客戶資料", { status: 404 });
  await env.DB.prepare("INSERT INTO notification_preferences (customer_id, birthday_offer_opt_in, care_reminder_opt_in, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(customer_id) DO UPDATE SET birthday_offer_opt_in=excluded.birthday_offer_opt_in, care_reminder_opt_in=excluded.care_reminder_opt_in, updated_at=excluded.updated_at")
    .bind(customerId, input.marketingConsent ? 1 : 0, input.reminderConsent ? 1 : 0, now).run();
  await writeAudit(env.DB, actor, "update", "customer", customerId, ["基本資料"]);
}

export async function saveService(env: ProductionEnv, input: ServiceInput, actor: string): Promise<void> {
  await ensureCustomerExists(env.DB, input.customerId);
  const recordId = input.id || id();
  const now = taipeiNow();
  await env.DB.prepare("INSERT INTO service_records (id, customer_id, service_at, service_type, operation_color, skin_type, note, care_at, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET customer_id=excluded.customer_id, service_at=excluded.service_at, service_type=excluded.service_type, operation_color=excluded.operation_color, skin_type=excluded.skin_type, note=excluded.note, care_at=excluded.care_at, updated_at=excluded.updated_at")
    .bind(recordId, input.customerId, input.serviceAt, input.serviceType, input.operationColor || "", input.skinType || "", input.note || "", input.careAt || null, actor, now, now).run();
  await writeAudit(env.DB, actor, input.id ? "update" : "create", "service_record", recordId, ["服務紀錄"]);
}

export async function saveAppointment(env: ProductionEnv, input: AppointmentInput, actor: string): Promise<void> {
  await ensureCustomerExists(env.DB, input.customerId);
  const appointmentId = input.id || id();
  const now = taipeiNow();
  await env.DB.prepare("INSERT INTO appointments (id, customer_id, service_type, starts_at, duration_minutes, status, deposit_status, deposit_amount, note, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET customer_id=excluded.customer_id, service_type=excluded.service_type, starts_at=excluded.starts_at, duration_minutes=excluded.duration_minutes, status=excluded.status, deposit_status=excluded.deposit_status, deposit_amount=excluded.deposit_amount, note=excluded.note, updated_at=excluded.updated_at")
    .bind(appointmentId, input.customerId, input.serviceType, input.startsAt, input.durationMinutes || 120, input.status || "scheduled", input.depositStatus || "unpaid", input.depositStatus === "paid" ? input.depositAmount ?? null : null, input.note || "", actor, now, now).run();
  await writeAudit(env.DB, actor, input.id ? "update" : "create", "appointment", appointmentId, ["預約"]);
}

export async function archiveCustomer(env: ProductionEnv, customerId: string, actor: string, restore = false): Promise<void> {
  const result = await env.DB.prepare("UPDATE customers SET archived_at=?, updated_at=? WHERE id=?").bind(restore ? null : taipeiNow(), taipeiNow(), customerId).run();
  if (!result.meta.changes) throw new Response("找不到客戶資料", { status: 404 });
  await writeAudit(env.DB, actor, restore ? "restore" : "archive", "customer", customerId, ["封存狀態"]);
}

export async function registerPublicAttempt(env: ProductionEnv, tokenHash: string): Promise<{ id: string; expiresAt: string }> {
  const link = await env.DB.prepare("SELECT id, expires_at, status, attempt_count FROM form_links WHERE token_hash=?").bind(tokenHash).first<{ id: string; expires_at: string; status: string; attempt_count: number }>();
  if (!link || link.status !== "active" || new Date(link.expires_at) <= new Date()) throw new Response("此表單連結已失效", { status: 410 });
  if (link.attempt_count >= FORM_MAX_ATTEMPTS) {
    await env.DB.prepare("UPDATE form_links SET status='locked', locked_at=? WHERE id=?").bind(taipeiNow(), link.id).run();
    throw new Response("此連結嘗試次數過多，已鎖定", { status: 429 });
  }
  await env.DB.prepare("UPDATE form_links SET attempt_count=attempt_count+1 WHERE id=? AND status='active'").bind(link.id).run();
  return { id: link.id, expiresAt: link.expires_at };
}export async function claimPublicLink(env: ProductionEnv, tokenHash: string): Promise<{ id: string }> {
  const now = taipeiNow();
  const result = await env.DB.prepare("UPDATE form_links SET status='submitting', attempt_count=attempt_count+1 WHERE token_hash=? AND status='active' AND julianday(expires_at)>julianday(?) AND attempt_count<?")
    .bind(tokenHash, now, FORM_MAX_ATTEMPTS).run();
  if (!result.meta.changes) {
    const link = await env.DB.prepare("SELECT status, attempt_count FROM form_links WHERE token_hash=?").bind(tokenHash).first<{ status: string; attempt_count: number }>();
    if (link?.status === "active" && link.attempt_count >= FORM_MAX_ATTEMPTS) await env.DB.prepare("UPDATE form_links SET status='locked', locked_at=? WHERE token_hash=?").bind(now, tokenHash).run();
    throw new Response(link?.status === "submitting" ? "此表單正在送出，請勿重複提交" : "此表單連結已失效或嘗試次數過多", { status: link?.status === "submitting" ? 409 : 410 });
  }
  const link = await env.DB.prepare("SELECT id FROM form_links WHERE token_hash=?").bind(tokenHash).first<{ id: string }>();
  if (!link) throw new Response("找不到表單連結", { status: 404 });
  return link;
}

export async function releasePublicLink(env: ProductionEnv, linkId: string): Promise<void> {
  await env.DB.prepare("UPDATE form_links SET status=CASE WHEN attempt_count>=? THEN 'locked' ELSE 'active' END, locked_at=CASE WHEN attempt_count>=? THEN ? ELSE locked_at END WHERE id=? AND status='submitting'")
    .bind(FORM_MAX_ATTEMPTS, FORM_MAX_ATTEMPTS, taipeiNow(), linkId).run();
}
