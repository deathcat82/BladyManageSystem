import { getD1 } from "../../../../db";

type Context = { params: Promise<{ token: string }> };
type Payload = Record<string, unknown>;

const asText = (value: unknown) => typeof value === "string" ? value.trim() : "";
const now = () => new Date().toISOString();
const json = (payload: unknown, status = 200) => Response.json(payload, { status });

async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
}

async function getLink(db: D1Database, token: string) {
  return db.prepare("SELECT id, status, service_type, expires_at FROM form_links WHERE token_hash = ?")
    .bind(await hash(token)).first<{ id: string; status: string; service_type: string; expires_at: string }>();
}

export async function GET(_request: Request, context: Context) {
  try {
    const { token } = await context.params;
    const link = await getLink(getD1(), token);
    if (!link) return json({ active: false, reason: "找不到此表單連結。" }, 404);
    if (link.status !== "active") return json({ active: false, reason: "此表單連結已失效或已使用。" }, 410);
    if (new Date(link.expires_at).getTime() <= Date.now()) return json({ active: false, reason: "此表單連結已過期。" }, 410);
    return json({ active: true, expiresAt: link.expires_at });
  } catch (error) {
    return json({ active: false, reason: error instanceof Error ? error.message : "無法讀取表單。" }, 500);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const { token } = await context.params;
    const body = await request.json<Payload>();
    const db = getD1();
    const link = await getLink(db, token);
    if (!link || link.status !== "active" || new Date(link.expires_at).getTime() <= Date.now()) {
      return json({ error: "此表單連結已失效、過期或已使用。" }, 410);
    }

    const fullName = asText(body.fullName);
    const phone = asText(body.phone);
    const birthday = asText(body.birthday);
    const signature = asText(body.signature);
    const photoAuthorization = asText(body.photoAuthorization);
    const notices = Array.isArray(body.notices) ? body.notices.map(asText).filter(Boolean) : [];
    const confirmations = Array.isArray(body.confirmations) ? body.confirmations.map(asText).filter(Boolean) : [];

    if (!fullName || !phone || !birthday || !signature || !photoAuthorization || notices.length < 6 || confirmations.length < 2) {
      return json({ error: "請完成基本資料、服務須知、照片授權、服務確認與手寫簽名。" }, 400);
    }

    const stamp = now();
    const customerId = crypto.randomUUID();
    const consume = db.prepare("UPDATE form_links SET status = 'used', used_at = ? WHERE id = ? AND status = 'active' AND expires_at > ?").bind(stamp, link.id, stamp);
    const customer = db.prepare("INSERT INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?)")
      .bind(customerId, fullName, phone, asText(body.lineId), birthday, asText(body.referralSource), body.marketingConsent ? 1 : 0, body.reminderConsent ? 1 : 0, stamp, stamp);
    const snapshot = JSON.stringify({
      version: "lulu-consent-2026-07-complete",
      submittedAt: stamp,
      notices,
      healthDisclosures: Array.isArray(body.healthDisclosures) ? body.healthDisclosures.map(asText).filter(Boolean) : [],
      healthConditions: Array.isArray(body.healthConditions) ? body.healthConditions.map(asText).filter(Boolean) : [],
      lipConditions: Array.isArray(body.lipConditions) ? body.lipConditions.map(asText).filter(Boolean) : [],
      photoAuthorization,
      confirmations,
      formType: "綜合表單",
    });
    const consent = db.prepare("INSERT INTO consent_submissions (id, link_id, customer_id, service_type, consent_snapshot, signature_data_url, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), link.id, customerId, "綜合表單", snapshot, signature, stamp);

    const results = await db.batch([consume, customer, consent]);
    if (!results[0]?.meta?.changes) return json({ error: "此表單連結剛被使用，請勿重複送出。" }, 409);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "表單送出失敗，請稍後重試。" }, 500);
  }
}
