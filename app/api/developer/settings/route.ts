import { productionEnv } from "@/lib/production/bindings";
import { errorResponse, json, requireString } from "@/lib/production/http";
import { jsonBody, requireAdminWrite, verifyAccess } from "@/lib/production/security";
import { writeAudit } from "@/lib/production/repository";
import { taipeiNow } from "@/lib/production/validation";
export async function GET(request:Request){try{const env=productionEnv();await verifyAccess(request,env,"developer");const rows=await env.DB.prepare("SELECT key,value,updated_at FROM app_settings ORDER BY key").all();return json({settings:rows.results});}catch(error){return errorResponse(error);}}
export async function POST(request:Request){try{const env=productionEnv();const actor=await verifyAccess(request,env,"developer");requireAdminWrite(request,env);const body=await jsonBody<{studioName?:string;privacyContact?:string;retentionYears?:number;consentNoticeVersion?:string}>(request);const retention=Math.max(1,Math.min(20,Math.floor(Number(body.retentionYears)||5)));const now=taipeiNow();await env.DB.batch([
  env.DB.prepare("INSERT INTO app_settings(key,value,updated_at) VALUES('studio_name',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(requireString(body.studioName,"工作室名稱"),now),
  env.DB.prepare("INSERT INTO app_settings(key,value,updated_at) VALUES('privacy_contact',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(requireString(body.privacyContact,"個資聯絡窗口"),now),
  env.DB.prepare("INSERT INTO app_settings(key,value,updated_at) VALUES('retention_years',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(String(retention),now),
  env.DB.prepare("INSERT INTO app_settings(key,value,updated_at) VALUES('consent_notice_version',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(requireString(body.consentNoticeVersion,"同意書版本"),now),
]);await writeAudit(env.DB,actor.email,"update","settings","global",["工作室設定"]);return json({ok:true});}catch(error){return errorResponse(error);}}