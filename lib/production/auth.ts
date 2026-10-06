import { randomInt } from "node:crypto";
import { CODE_SECONDS, SESSION_SECONDS, equal, hashPassword, mac, randomToken, tokenHash, validateNewPassword, verifyPassword } from "./auth-crypto";
import { cookieValue, getSession } from "./session";
import { jsonBody, requireAdminWrite, csrfToken, type ProductionEnv } from "./security";
import { sendEmail, type Mail } from "./smtp";

type Account={id:string;email:string;password_hash:string;password_version:number;must_change_password:number};
type Challenge={id:string;account_id:string;purpose:"login"|"reset";device_hash:string;code_mac:string;password_version:number;expires_at:number;sent_at:number;attempts:number;status:string};
type Sender=(env:ProductionEnv,mail:Mail)=>Promise<void>;
const now=()=>Math.floor(Date.now()/1000);
function fail(status=401):never{throw new Response("資料不正確或驗證已失效，請重新操作。",{status});}
function cookie(name:string,value:string,seconds:number):string{return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${seconds}`;}
function result(body:unknown,cookies:string[]=[]):Response{
  const response=Response.json(body,{headers:{"cache-control":"no-store"}});
  for(const value of cookies)response.headers.append("Set-Cookie",value);
  return response;
}
async function audit(env:ProductionEnv,email:string,action:string){
  await env.DB.prepare("INSERT INTO audit_logs(id,actor_email,action,entity_type,entity_id,changed_fields,created_at) VALUES(?,?,?,'auth',?,'[]',?)")
    .bind(crypto.randomUUID(),email,action,email,new Date().toISOString()).run();
}
async function limit(env:ProductionEnv,key:string,max:number,seconds:number,rolling=false){
  const current=now(),expires=rolling?current+seconds:(Math.floor(current/seconds)+1)*seconds;
  const row=await env.DB.prepare("INSERT INTO auth_rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END,expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING count")
    .bind(mac(env.AUTH_HMAC_SECRET,key),expires,current,current).first<{count:number}>();
  if(!row || row.count>max)throw new Response("嘗試次數過多，請稍後再試。",{status:429});
}
function emailValue(value:unknown):string{
  return typeof value==="string" && value.length<=254?value.trim().toLowerCase():"";
}
async function issue(env:ProductionEnv,account:Account,purpose:"login"|"reset",device:string,send:Sender):Promise<string>{
  const last=await env.DB.prepare("SELECT sent_at FROM auth_challenges WHERE account_id=? ORDER BY sent_at DESC LIMIT 1").bind(account.id).first<{sent_at:number}>();
  if(last && now()-last.sent_at<60)throw new Response("請等待 60 秒後再寄送驗證碼。",{status:429});
  // A database reservation prevents parallel requests from bypassing the cooldown.
  await limit(env,`send-cooldown:${account.id}`,1,60,true);
  await limit(env,`send:${account.id}`,5,3600);
  const id=randomToken(),code=String(randomInt(1000000)).padStart(6,"0"),sent=now();
  await env.DB.batch([
    env.DB.prepare("UPDATE auth_challenges SET status='failed' WHERE account_id=? AND status IN ('sending','sent')").bind(account.id),
    env.DB.prepare("INSERT INTO auth_challenges(id,account_id,purpose,device_hash,code_mac,password_version,expires_at,sent_at,status) VALUES(?,?,?,?,?,?,?,?,'sending')")
      .bind(id,account.id,purpose,tokenHash(device),mac(env.AUTH_HMAC_SECRET,`${id}:${code}`),account.password_version,sent+CODE_SECONDS,sent),
  ]);
  try{
    await send(env,{to:account.email,subject:purpose==="login"?"Lulu Studio 登入驗證碼":"Lulu Studio 重設密碼驗證碼",text:`您的${purpose==="login"?"登入":"重設密碼"}驗證碼是：${code}\n\n10 分鐘內有效，請勿轉交他人。若非本人操作，可忽略此信。`});
    const ready=await env.DB.prepare("UPDATE auth_challenges SET status='sent' WHERE id=? AND status='sending'").bind(id).run();
    if(!ready.meta.changes)throw new Error("驗證挑戰已替換");
    await audit(env,account.email,purpose==="login"?"send_login_code":"send_reset_code");
    return id;
  }catch{
    await env.DB.prepare("UPDATE auth_challenges SET status='failed' WHERE id=? AND status='sending'").bind(id).run();
    throw new Response("無法寄送驗證碼，請稍後再試。",{status:503});
  }
}
async function challenge(request:Request,env:ProductionEnv):Promise<Challenge>{
  const id=cookieValue(request,"__Host-lulu_challenge"),device=cookieValue(request,"__Host-lulu_device");
  if(!id || !device)fail();
  const row=await env.DB.prepare("SELECT * FROM auth_challenges WHERE id=? AND device_hash=? AND status='sent' AND expires_at>? AND attempts<5").bind(id,tokenHash(device),now()).first<Challenge>();
  if(!row)fail();return row;
}
export async function handleAuth(request:Request,env:ProductionEnv,action:string,send:Sender=sendEmail):Promise<Response>{
  if(!env.APP_ORIGIN || !env.AUTH_HMAC_SECRET)throw new Response("登入系統尚未設定完成",{status:503});
  if(action==="session" && request.method==="GET"){
    const session=await getSession(request,env),existing=cookieValue(request,"lulu_csrf"),csrf=existing && /^[a-f0-9]{32}$/.test(existing)?existing:csrfToken();
    return result({csrf,authenticated:session?.kind==="full",requiresPasswordChange:session?.kind==="change",actor:session?{email:session.email,role:session.role}:null},[cookie("lulu_csrf",csrf,SESSION_SECONDS)]);
  }
  if(request.method!=="POST")throw new Response("不支援的操作",{status:405});
  requireAdminWrite(request,env);
  const body=await jsonBody<{email?:unknown;password?:unknown;code?:unknown}>(request);
  const ip=request.headers.get("cf-connecting-ip")||"unknown";
  if(action==="login" || action==="forgot-password"){
    const email=emailValue(body.email);
    await limit(env,`password-ip:${ip}`,50,900);await limit(env,`password-email:${email}`,10,900);
    const account=await env.DB.prepare("SELECT * FROM auth_accounts WHERE email=? AND disabled=0").bind(email).first<Account>();
    if(action==="login"){
      const password=typeof body.password==="string" && body.password.length<=128?body.password:"";
      // Use an equally expensive dummy derivation for unknown accounts.
      const encoded=account?.password_hash||"scrypt$32768$8$1$00000000000000000000000000000000$"+"0".repeat(64);
      const valid=await verifyPassword(password,encoded);
      if(!account || !valid)fail();
    }
    if(!account)return result({ok:true,message:"若帳號可用，驗證碼將寄至該信箱。"});
    await limit(env,`send-ip:${ip}`,20,3600);
    const device=randomToken(),id=await issue(env,account,action==="login"?"login":"reset",device,send);
    return result({ok:true,message:"若帳號可用，驗證碼將寄至該信箱。"},[cookie("__Host-lulu_device",device,CODE_SECONDS),cookie("__Host-lulu_challenge",id,CODE_SECONDS)]);
  }
  if(action==="resend"){
    await limit(env,`send-ip:${ip}`,20,3600);
    const row=await challenge(request,env);
    const account=await env.DB.prepare("SELECT * FROM auth_accounts WHERE id=? AND disabled=0 AND password_version=?").bind(row.account_id,row.password_version).first<Account>();
    if(!account)fail();
    const device=randomToken(),id=await issue(env,account,row.purpose,device,send);
    return result({ok:true},[cookie("__Host-lulu_device",device,CODE_SECONDS),cookie("__Host-lulu_challenge",id,CODE_SECONDS)]);
  }
  if(action==="verify"){
    await limit(env,`verify-ip:${ip}`,50,900);
    const row=await challenge(request,env);
    const code=typeof body.code==="string"?body.code:"";
    if(!/^\d{6}$/.test(code) || !equal(mac(env.AUTH_HMAC_SECRET,`${row.id}:${code}`),row.code_mac)){
      await env.DB.prepare("UPDATE auth_challenges SET attempts=attempts+1 WHERE id=? AND status='sent' AND attempts<5").bind(row.id).run();fail();
    }
    const token=randomToken(),claim=randomToken(),created=now();
    const batches=await env.DB.batch([
      env.DB.prepare("UPDATE auth_challenges SET status='consumed',consumed_by=? WHERE id=? AND status='sent' AND attempts<5 AND expires_at>? AND EXISTS(SELECT 1 FROM auth_accounts WHERE id=account_id AND disabled=0 AND password_version=auth_challenges.password_version)").bind(claim,row.id,created),
      env.DB.prepare("INSERT INTO auth_sessions(token_hash,account_id,password_version,kind,expires_at,created_at) SELECT ?,a.id,a.password_version,CASE WHEN c.purpose='reset' OR a.must_change_password=1 THEN 'change' ELSE 'full' END,CASE WHEN c.purpose='reset' OR a.must_change_password=1 THEN ? ELSE ? END,? FROM auth_accounts a JOIN auth_challenges c ON c.account_id=a.id WHERE c.id=? AND c.consumed_by=? AND c.status='consumed'")
        .bind(tokenHash(token),created+CODE_SECONDS,created+SESSION_SECONDS,created,row.id,claim),
    ]);
    if(!batches[1].meta.changes)fail();
    const session=await env.DB.prepare("SELECT kind FROM auth_sessions WHERE token_hash=?").bind(tokenHash(token)).first<{kind:string}>();
    await audit(env,(await env.DB.prepare("SELECT email FROM auth_accounts WHERE id=?").bind(row.account_id).first<{email:string}>())!.email,"verify_email");
    return result({ok:true,requiresPasswordChange:session?.kind==="change"},[cookie("__Host-lulu_session",token,session?.kind==="change"?CODE_SECONDS:SESSION_SECONDS),cookie("__Host-lulu_challenge","",0),cookie("__Host-lulu_device","",0)]);
  }
  if(action==="change-password"){
    const session=await getSession(request,env);if(!session || session.kind!=="change")fail();
    validateNewPassword(body.password);
    const passwordHash=await hashPassword(body.password),token=randomToken(),created=now();
    const batches=await env.DB.batch([
      env.DB.prepare("UPDATE auth_accounts SET password_hash=?,must_change_password=0,password_version=password_version+1 WHERE id=? AND password_version=? AND disabled=0").bind(passwordHash,session.account_id,session.password_version),
      env.DB.prepare("DELETE FROM auth_sessions WHERE account_id=? AND EXISTS(SELECT 1 FROM auth_accounts WHERE id=? AND password_hash=?)").bind(session.account_id,session.account_id,passwordHash),
      env.DB.prepare("UPDATE auth_challenges SET status='failed' WHERE account_id=? AND status IN ('sent','sending') AND EXISTS(SELECT 1 FROM auth_accounts WHERE id=? AND password_hash=?)").bind(session.account_id,session.account_id,passwordHash),
      env.DB.prepare("INSERT INTO auth_sessions(token_hash,account_id,password_version,kind,expires_at,created_at) SELECT ?,id,password_version,'full',?,? FROM auth_accounts WHERE id=? AND password_hash=?")
        .bind(tokenHash(token),created+SESSION_SECONDS,created,session.account_id,passwordHash),
    ]);
    if(!batches[0].meta.changes || !batches[3].meta.changes)fail();
    await audit(env,session.email,"change_password");return result({ok:true},[cookie("__Host-lulu_session",token,SESSION_SECONDS)]);
  }
  if(action==="logout"){
    const token=cookieValue(request,"__Host-lulu_session");
    if(token)await env.DB.prepare("DELETE FROM auth_sessions WHERE token_hash=?").bind(tokenHash(token)).run();
    return result({ok:true},[cookie("__Host-lulu_session","",0),cookie("__Host-lulu_challenge","",0),cookie("__Host-lulu_device","",0),cookie("lulu_csrf","",0)]);
  }
  throw new Response("找不到此操作",{status:404});
}
