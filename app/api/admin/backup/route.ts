import { productionEnv } from "@/lib/production/bindings";
import { errorResponse, json } from "@/lib/production/http";
import { requireAdminWrite, verifyAccess } from "@/lib/production/security";
import { weeklyBackup } from "@/lib/production/storage";
export async function POST(request:Request){try{const env=productionEnv();const actor=await verifyAccess(request,env,"developer");requireAdminWrite(request,env);const backup=await weeklyBackup(env);await env.DB.prepare("UPDATE backup_runs SET created_by=? WHERE object_key=?").bind(actor.email,backup.objectKey).run();return json({ok:true,...backup});}catch(error){return errorResponse(error);}}