import { getD1 } from "../../../../db";

type Context = { params: Promise<{ token: string }> };
type Payload = Record<string, unknown>;

const asText = (value: unknown) => typeof value === "string" ? value.trim() : "";
const normalizedPhone = (value: unknown) => asText(value).replace(/[\s\-()]/g, "");
const now = () => new Date().toISOString();
const json = (payload: unknown, status = 200) => Response.json(payload, { status });
const consentServiceItems = new Set(["霧眉", "霧唇", "修眉", "唇色淡化"]);
const lipRelatedServiceItems = new Set(["霧唇", "唇色淡化"]);
const referralSources = new Set(["Facebook", "Instagram", "親友介紹", "Google 搜尋", "其他"]);

async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
}

async function getLink(db: D1Database, token: string) {
  return db.prepare("SELECT id, status, service_type, expires_at FROM form_links WHERE token_hash = ?")
    .bind(await hash(token)).first<{ id: string; status: string; service_type: string; expires_at: string }>();
}

async function duplicatePhone(db: D1Database, phone: string) {
  const normalized = normalizedPhone(phone);
  const records = await db.prepare("SELECT full_name, phone FROM customers").all<{ full_name: string; phone: string }>();
  return (records.results || []).find((customer) => normalizedPhone(customer.phone) === normalized);
}

export async function GET(_request: Request, context: Context) {
  try {
    const { token } = await context.params;
    const link = await getLink(getD1(), token);
    if (!link) return json({ active: false, reason: "找不到此表單連結。" }, 404);
    if (link.status !== "active") return json({ active: false, reason: "此表單連結已失效或已使用。" }, 410);
    if (new Date(link.expires_at).getTime() <= Date.now()) return json({ active: false, reason: "此表單連結已過期。" }, 410);
    const studioName = await getD1().prepare("SELECT value FROM app_settings WHERE key = 'studio_name'").first<{ value: string }>();
    return json({ active: true, expiresAt: link.expires_at, studioName: studioName?.value || "Lulu Studio紋繡美學" });
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
    const lineId = asText(body.lineId);
    const birthday = asText(body.birthday);
    const referralSource = asText(body.referralSource);
    const referralOther = asText(body.referralOther);
    const signature = asText(body.signature);
    const photoAuthorization = asText(body.photoAuthorization);
    const notices = Array.isArray(body.notices) ? Array.from(new Set(body.notices.map(asText).filter(Boolean))) : [];
    const healthDisclosures = Array.isArray(body.healthDisclosures) ? Array.from(new Set(body.healthDisclosures.map(asText).filter(Boolean))) : [];
    const healthConditions = Array.isArray(body.healthConditions) ? Array.from(new Set(body.healthConditions.map(asText).filter(Boolean))) : [];
    const serviceItems = Array.isArray(body.serviceItems) ? Array.from(new Set(body.serviceItems.map(asText).filter(Boolean))) : [];
    const lipConditions = Array.isArray(body.lipConditions) ? Array.from(new Set(body.lipConditions.map(asText).filter(Boolean))) : [];
    const confirmations = Array.isArray(body.confirmations) ? Array.from(new Set(body.confirmations.map(asText).filter(Boolean))) : [];
    const healthDisclosureOther = asText(body.healthDisclosureOther);
    const healthConditionOther = asText(body.healthConditionOther);
    const lipOther = asText(body.lipOther);
    const marketingChoice = asText(body.marketingChoice);
    const persistedReferralSource = referralSource === "其他" ? `其他：${referralOther}` : referralSource;
    const requiresLipConfirmation = serviceItems.some((item) => lipRelatedServiceItems.has(item));
    const incomplete: string[] = [];
    if (!fullName || !phone || !lineId || !birthday || !referralSources.has(referralSource) || (referralSource === "其他" && !referralOther)) incomplete.push("基本資料");
    if (notices.length !== 6) incomplete.push("服務須知全部同意項目");
    if (!healthDisclosures.length || (healthDisclosures.includes("其他") && !healthDisclosureOther)) incomplete.push("健康揭露");
    if (!serviceItems.length || serviceItems.some((item) => !consentServiceItems.has(item))) incomplete.push("服務項目");
    if (!healthConditions.length || (healthConditions.includes("以上皆非") && healthConditions.length > 1) || (healthConditions.includes("其他") && !healthConditionOther)) incomplete.push("健康狀況");
    if ((requiresLipConfirmation && (!lipConditions.length || (lipConditions.includes("以上皆非") && lipConditions.length > 1))) || (lipConditions.includes("其他") && !lipOther)) incomplete.push("霧唇確認事項");
    if (!photoAuthorization) incomplete.push("照片使用授權");
    if (confirmations.length !== 2) incomplete.push("紋繡服務確認事項");
    if (!["yes", "no"].includes(marketingChoice)) incomplete.push("生日優惠資訊意願");
    // 一次性同意書不蒐集下次提醒意願。
    if (!signature) incomplete.push("手寫簽名");
    if (incomplete.length) return json({ error: "請補齊：" + incomplete.join("、") + "。" }, 400);

    const duplicate = await duplicatePhone(db, phone);
    if (duplicate) return json({ error: "此電話已存在於客戶庫：" + duplicate.full_name + "。請聯絡工作室協助處理。" }, 409);

    const stamp = now();
    const customerId = crypto.randomUUID();
    const consume = db.prepare("UPDATE form_links SET status = 'used', used_at = ? WHERE id = ? AND status = 'active' AND expires_at > ?").bind(stamp, link.id, stamp);
    const customer = db.prepare("INSERT INTO customers (id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?)")
      .bind(customerId, fullName, phone, lineId, birthday, persistedReferralSource, marketingChoice === "yes" ? 1 : 0, 0, stamp, stamp);
    const snapshot = JSON.stringify({
      version: "lulu-consent-2026-08-service-items",
      submittedAt: stamp,
      serviceItems,
      notices,
      healthDisclosures, healthDisclosureOther, healthConditions, healthConditionOther, lipConditions, lipOther,
      photoAuthorization,
      confirmations,
      marketingConsent: marketingChoice === "yes",
      referralSource: persistedReferralSource,
      formType: "綜合表單",
    });
    const consent = db.prepare("INSERT INTO consent_submissions (id, link_id, customer_id, service_type, consent_snapshot, signature_data_url, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), link.id, customerId, serviceItems.join("、"), snapshot, signature, stamp);

    const results = await db.batch([consume, customer, consent]);
    if (!results[0]?.meta?.changes) return json({ error: "此表單連結剛被使用，請勿重複送出。" }, 409);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "表單送出失敗，請稍後重試。" }, 500);
  }
}
