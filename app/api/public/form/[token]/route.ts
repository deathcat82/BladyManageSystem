import { productionEnv } from "@/lib/production/bindings";
import { errorResponse, json } from "@/lib/production/http";
import { claimPublicLink, releasePublicLink } from "@/lib/production/repository";
import { jsonBody, type ProductionEnv } from "@/lib/production/security";
import { validateConsent, type FormPayload } from "@/lib/production/consent";
import { savePublicSubmission } from "@/lib/production/public-submission";
async function tokenHash(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
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
  let env:ProductionEnv|undefined; let linkId:string|undefined;
  try {
    const {token}=await context.params; env=productionEnv();
    const payload=await jsonBody<FormPayload>(request); validateConsent(payload);
    await verifyTurnstile(env,payload.turnstileToken,request.headers.get("CF-Connecting-IP"));
    linkId=(await claimPublicLink(env,await tokenHash(token))).id;
    await savePublicSubmission(env,linkId,payload);
    return json({ok:true,message:"資料已安全送出，謝謝您。"});
  } catch(error) {
    if(env&&linkId) { try { await releasePublicLink(env,linkId); } catch { return json({error:"送出未完成，請聯絡工作室確認連結狀態"},{status:503}); } }
    return errorResponse(error);
  }
}
