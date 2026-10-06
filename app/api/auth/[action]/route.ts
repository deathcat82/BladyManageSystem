import { handleAuth } from "@/lib/production/auth";
import { productionEnv } from "@/lib/production/bindings";
import { errorResponse } from "@/lib/production/http";
type Context={params:Promise<{action:string}>};
async function handle(request:Request,context:Context){try{return await handleAuth(request,productionEnv(),(await context.params).action);}catch(error){return errorResponse(error);}}
export const GET=handle;
export const POST=handle;
