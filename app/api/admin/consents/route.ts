import { productionEnv } from "@/lib/production/bindings";
import { errorResponse, json, requireString } from "@/lib/production/http";
import { verifyAccess } from "@/lib/production/security";
export async function GET(request:Request){try{const env=productionEnv();await verifyAccess(request,env,"owner");const customerId=requireString(new URL(request.url).searchParams.get("customerId"),"客戶編號");const rows=await env.DB.prepare("SELECT id,contract_version,submitted_at FROM consent_submissions WHERE customer_id=? ORDER BY submitted_at DESC").bind(customerId).all();return json({consents:rows.results});}catch(error){return errorResponse(error);}}
