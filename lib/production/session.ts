import { tokenHash } from "./auth-crypto";
import type { ProductionEnv } from "./security";

export type AccountRole = "owner" | "developer";
export function cookieValue(request: Request,name: string): string | undefined {
  return request.headers.get("cookie")?.split(";").map(v=>v.trim()).find(v=>v.startsWith(`${name}=`))?.slice(name.length+1);
}
export type Session = { account_id:string; email:string; role:AccountRole; password_version:number; kind:"full"|"change"; expires_at:number };
export async function getSession(request:Request,env:ProductionEnv):Promise<Session|null>{
  const token=cookieValue(request,"__Host-lulu_session");
  if(!token || !/^[a-f0-9]{64}$/.test(token))return null;
  return env.DB.prepare("SELECT s.account_id,a.email,a.role,s.password_version,s.kind,s.expires_at FROM auth_sessions s JOIN auth_accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>? AND a.disabled=0 AND a.password_version=s.password_version")
    .bind(tokenHash(token),Math.floor(Date.now()/1000)).first<Session>();
}
export async function requireSession(request:Request,env:ProductionEnv,required:AccountRole):Promise<{email:string;role:AccountRole}>{
  const session=await getSession(request,env);
  if(!session || session.kind!=="full")throw new Response("請先完成登入驗證",{status:401});
  if(required==="developer" && session.role!=="developer")throw new Response("沒有此頁面權限",{status:403});
  return {email:session.email,role:session.role};
}
