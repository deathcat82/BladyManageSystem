import { productionEnv } from "@/lib/production/bindings";
import { errorResponse, json } from "@/lib/production/http";
import { verifyAccess } from "@/lib/production/security";
export async function GET(request:Request){try{const env=productionEnv();await verifyAccess(request,env,"developer");const rows=await env.DB.prepare("SELECT id,actor_email,action,entity_type,entity_id,changed_fields,created_at FROM audit_logs ORDER BY created_at DESC LIMIT 300").all();return json({logs:rows.results});}catch(error){return errorResponse(error);}}