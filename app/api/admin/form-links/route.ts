import { productionEnv } from "@/lib/production/bindings";
import { errorResponse, json, requireString } from "@/lib/production/http";
import { jsonBody, requireAdminWrite, verifyAccess } from "@/lib/production/security";
import { taipeiNow } from "@/lib/production/validation";
async function hash(value: string) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, "0")).join(""); }
export async function POST(request: Request) {
  try {
    const env=productionEnv(); const actor=await verifyAccess(request,env,"owner"); requireAdminWrite(request,env); const body=await jsonBody<{ days?: number; action?: string; id?: string }>(request);
    if (body.action === "revoke") {
      const linkId = requireString(body.id,"連結編號");
      const result = await env.DB.prepare("UPDATE form_links SET status='revoked' WHERE id=? AND status IN ('active','locked')").bind(linkId).run();
      if (!result.meta.changes) throw new Response("此連結已失效或正在送出，無法撤銷",{status:409});
      await env.DB.prepare("INSERT INTO audit_logs(id,actor_email,action,entity_type,entity_id,changed_fields,created_at) VALUES (?,?,'revoke','form_link',?,'[]',?)").bind(crypto.randomUUID(),actor.email,linkId,taipeiNow()).run();
      return json({ok:true});
    }
    const days=Math.max(1,Math.min(30,Math.floor(Number(body.days)||1))); const token=(crypto.randomUUID()+crypto.randomUUID()).replaceAll("-",""); const now=taipeiNow(); const expiresAt=new Date(Date.now()+days*86400000).toISOString();
    await env.DB.prepare("INSERT INTO form_links (id, token_hash, status, expires_at, created_by, created_at) VALUES (?, ?, 'active', ?, ?, ?)").bind(crypto.randomUUID(),await hash(token),expiresAt,actor.email,now).run();
    await env.DB.prepare("INSERT INTO audit_logs (id, actor_email, action, entity_type, entity_id, changed_fields, created_at) VALUES (?, ?, 'create', 'form_link', ?, '[\"一次性同意書\"]', ?)").bind(crypto.randomUUID(),actor.email,token.slice(0,8),now).run();
    return json({ ok:true, token, expiresAt, url:`${env.APP_ORIGIN}/form/${token}` });
  } catch(error) { return errorResponse(error); }
}
