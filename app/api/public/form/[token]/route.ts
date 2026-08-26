import { CONTRACT_VERSION } from "@/lib/production/constants";
import { productionEnv } from "@/lib/production/bindings";
import { errorResponse, json, requireString } from "@/lib/production/http";
import { claimPublicLink, createCustomer, releasePublicLink } from "@/lib/production/repository";
import type { ProductionEnv } from "@/lib/production/security";
import { jsonBody } from "@/lib/production/security";
import { encryptText, putSignature } from "@/lib/production/storage";
import { normalizePhone, taipeiNow } from "@/lib/production/validation";

const requiredAgreementKeys = ["serviceNotices", "serviceConfirmation"] as const;
type FormPayload = {
  fullName?: string; phone?: string; lineId?: string; birthday?: string; referralSource?: string; referralOther?: string;
  photoAuthorization?: string; signatureDataUrl?: string; turnstileToken?: string;
  healthDisclosure?: string[]; healthOther?: string; healthConditions?: string[]; conditionOther?: string; lipConfirmation?: string[]; lipOther?: string;
  serviceNotices?: boolean[]; serviceConfirmation?: boolean[]; birthdayOfferConsent?: boolean; reminderConsent?: boolean;
};

async function tokenHash(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validate(payload: FormPayload): void {
  requireString(payload.fullName, "姓名");
  if (normalizePhone(requireString(payload.phone, "手機號碼")).length < 8) throw new Response("請填寫有效手機號碼", { status: 422 });
  requireString(payload.lineId, "LINE ID");
  requireString(payload.birthday, "生日");
  const source = requireString(payload.referralSource, "得知管道");
  if (source === "其他") requireString(payload.referralOther, "其他得知管道");
  requireString(payload.photoAuthorization, "照片授權選項");
  requireString(payload.signatureDataUrl, "手寫簽名");
  for (const key of requiredAgreementKeys) if (!payload[key]?.length || payload[key].some((checked) => !checked)) throw new Response("請勾選所有服務同意與確認事項", { status: 422 });
  for (const [items, other, title] of [[payload.healthDisclosure, payload.healthOther, "健康揭露"], [payload.healthConditions, payload.conditionOther, "健康狀況"], [payload.lipConfirmation, payload.lipOther, "霧唇確認"]] as const) {
    if (!items?.length) throw new Response(`請至少選擇一項${title}`, { status: 422 });
    if (items.includes("以上皆非") && items.length > 1) throw new Response(`${title}的「以上皆非」不可與其他項目並選`, { status: 422 });
    if (items.includes("其他")) requireString(other, `${title}其他說明`);
  }
}

async function verifyTurnstile(env: ProductionEnv, token: string | undefined, ip: string | null): Promise<void> {
  if (!env.TURNSTILE_SECRET_KEY) throw new Response("正式環境尚未完成 Turnstile 設定", { status: 503 });
  if (!token) throw new Response("請完成真人驗證", { status: 422 });
  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const result = await response.json() as { success?: boolean };
  if (!result.success) throw new Response("真人驗證未通過，請重新操作", { status: 422 });
}

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const env = productionEnv();
    const tokenHashValue = await tokenHash(token);
    const link = await env.DB.prepare("SELECT expires_at FROM form_links WHERE token_hash=? AND status='active'").bind(tokenHashValue).first<{ expires_at: string }>();
    if (!link || new Date(link.expires_at) <= new Date()) return json({ error: "此表單連結已失效" }, { status: 410 });
    const studio = await env.DB.prepare("SELECT value FROM app_settings WHERE key='studio_name'").first<{ value: string }>();
    return json({ studioName: studio?.value || "Lulu Studio紋繡美學", expiresAt: link.expires_at, turnstileSiteKey: env.TURNSTILE_SITE_KEY || "" });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  let env: ProductionEnv | undefined;
  let linkId: string | undefined;
  try {
    const { token } = await context.params;
    env = process.env as unknown as ProductionEnv;
    const payload = await jsonBody<FormPayload>(request);
    validate(payload);
    await verifyTurnstile(env, payload.turnstileToken, request.headers.get("CF-Connecting-IP"));
    linkId = (await claimPublicLink(env, await tokenHash(token))).id;
    const duplicate = await env.DB.prepare("SELECT full_name FROM customers WHERE normalized_phone=?").bind(normalizePhone(payload.phone!)).first<{ full_name: string }>();
    if (duplicate) throw new Response("此手機號碼已存在，請聯絡工作室協助處理。", { status: 409 });
    const customerId = await createCustomer(env, {
      fullName: payload.fullName!, phone: payload.phone!, lineId: payload.lineId!, birthday: payload.birthday!,
      referralSource: payload.referralSource === "其他" ? `其他：${payload.referralOther}` : payload.referralSource!,
      marketingConsent: payload.birthdayOfferConsent === true, reminderConsent: payload.reminderConsent === true,
    }, "public-form");
    const consentId = crypto.randomUUID();
    const signature = await putSignature(env, consentId, payload.signatureDataUrl!);
    const snapshot = await encryptText(env.DATA_ENCRYPTION_KEY, JSON.stringify({ ...payload, signatureDataUrl: undefined, submittedAt: taipeiNow(), contractVersion: CONTRACT_VERSION }));
    await env.DB.batch([
      env.DB.prepare("INSERT INTO consent_submissions (id, link_id, customer_id, contract_version, snapshot_ciphertext, snapshot_iv, signature_object_key, signature_sha256, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(consentId, linkId, customerId, CONTRACT_VERSION, snapshot.ciphertext, snapshot.iv, signature.objectKey, signature.sha256, taipeiNow()),
      env.DB.prepare("UPDATE form_links SET status='used', used_at=? WHERE id=? AND status='submitting'").bind(taipeiNow(), linkId),
    ]);
    return json({ ok: true, message: "資料已安全送出，謝謝您。" });
  } catch (error) {
    if (env && linkId) await releasePublicLink(env, linkId);
    return errorResponse(error);
  }
}