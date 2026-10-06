import assert from "node:assert/strict";
import test from "node:test";
import { bundled,database } from "./helpers/runtime.mjs";
const env=globalThis.__cloudflareTestEnv={};
const auth=await bundled("lib/production/auth.ts");
const crypt=await bundled("lib/production/auth-crypto.ts");
const sessions=await bundled("lib/production/session.ts");
let letters=[],jar=new Map();
const send=async(_env,mail)=>{letters.push(mail);};
const temporary=await crypt.hashPassword("00000000");
async function reset(){Object.assign(env,{DB:await database(),APP_ORIGIN:"https://studio.example.test",AUTH_HMAC_SECRET:"test-hmac-secret",SMTP_USER:"jerry.master.claw@gmail.com",SMTP_APP_PASSWORD:"test"});letters=[];jar=new Map();env.DB.sqlite.prepare("INSERT INTO auth_accounts(id,email,role,password_hash) VALUES('owner','owner@example.test','owner',?)").run(temporary);await call("session",null);}
async function call(action,body={},sender=send,override={}){
  const cookie=[...jar].map(([key,value])=>`${key}=${value}`).join("; ");
  const request=new Request(env.APP_ORIGIN+"/api/auth/"+action,{method:body===null?"GET":"POST",headers:{origin:env.APP_ORIGIN,"content-type":"application/json",cookie,"x-csrf-token":jar.get("lulu_csrf")||"","cf-connecting-ip":"127.0.0.1",...override},body:body===null?undefined:JSON.stringify(body)});
  try{const response=await auth.handleAuth(request,env,action,sender);for(const cookie of response.headers.getSetCookie()){const [pair]=cookie.split(";");const [key,value]=pair.split("=");if(value)jar.set(key,value);else jar.delete(key);}return response;}catch(error){if(error instanceof Response)return error;throw error;}
}
const code=()=>letters.at(-1).text.match(/：([0-9]{6})/)[1];
function req(){return new Request(env.APP_ORIGIN+"/admin",{headers:{cookie:[...jar].map(([key,value])=>`${key}=${value}`).join("; ")}});}
test("密碼使用獨立 salt 的固定 scrypt 參數，拒絕錯誤及無效新密碼",async()=>{
  assert.equal(await crypt.verifyPassword("00000000",temporary),true);assert.equal(await crypt.verifyPassword("wrong",temporary),false);
  assert.notEqual(temporary,await crypt.hashPassword("00000000"));assert.match(temporary,/^scrypt\$32768\$8\$1\$/);
  for(const value of ["00000000","aaaaaaaaaaaa","short",null])assert.throws(()=>crypt.validateNewPassword(value));
});
test("臨時密碼＋OTP 只核發改密碼權限，改密碼後固定 72 小時並撤銷舊權限",async()=>{
  await reset();assert.equal((await call("login",{email:" OWNER@example.test ",password:"00000000"})).status,200);
  assert.equal((await call("verify",{code:code()})).status,200);assert.equal((await sessions.getSession(req(),env)).kind,"change");
  await assert.rejects(()=>sessions.requireSession(req(),env,"owner"),error=>error.status===401);
  assert.equal((await call("change-password",{password:"new-strong-password"})).status,200);
  const session=await sessions.getSession(req(),env);assert.equal(session.kind,"full");assert.equal(session.expires_at-Math.floor(Date.now()/1000),72*3600);assert.equal(env.DB.sqlite.prepare("SELECT count(*) n FROM auth_sessions").get().n,1);
  const expiry=session.expires_at;await call("session",null);assert.equal((await sessions.getSession(req(),env)).expires_at,expiry);
  await assert.rejects(()=>sessions.requireSession(req(),env,"developer"),error=>error.status===403);
  await call("logout");assert.equal(await sessions.getSession(req(),env),null);
});
test("驗證碼綁定瀏覽器、最多 5 次、過期及用後不能重播",async()=>{
  await reset();await call("login",{email:"owner@example.test",password:"00000000"});const realCode=code(),original=new Map(jar);
  jar.set("__Host-lulu_device","0".repeat(64));assert.equal((await call("verify",{code:realCode})).status,401);jar=original;
  for(let n=0;n<5;n++)assert.equal((await call("verify",{code:"invalid"})).status,401);assert.equal((await call("verify",{code:realCode})).status,401);
  await reset();await call("login",{email:"owner@example.test",password:"00000000"});env.DB.sqlite.exec("UPDATE auth_challenges SET expires_at=1");assert.equal((await call("verify",{code:code()})).status,401);
  await reset();await call("login",{email:"owner@example.test",password:"00000000"});const saved=new Map(jar);await call("verify",{code:code()});jar=saved;assert.equal((await call("verify",{code:code()})).status,401);
});
test("同時提交驗證碼只建立一份權限；重寄冷卻、密碼及 CSRF 防護有效",async()=>{
  await reset();assert.equal((await call("login",{email:"owner@example.test",password:"incorrect"})).status,401);assert.equal(letters.length,0);
  assert.equal((await call("login",{email:"owner@example.test",password:"00000000"},send,{"x-csrf-token":"bad"})).status,403);
  await call("login",{email:"owner@example.test",password:"00000000"});assert.equal((await call("resend")).status,429);
  const responses=await Promise.all([call("verify",{code:code()}),call("verify",{code:code()})]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,401]);assert.equal(env.DB.sqlite.prepare("SELECT count(*) n FROM auth_sessions").get().n,1);
});
test("寄信失敗不留下可使用驗證码；冷卻後可以安全重試",async()=>{
  await reset();assert.equal((await call("login",{email:"owner@example.test",password:"00000000"},async()=>{throw new Error("SMTP unavailable");})).status,503);
  assert.equal(env.DB.sqlite.prepare("SELECT status FROM auth_challenges").get().status,"failed");assert.equal(env.DB.sqlite.prepare("SELECT count(*) n FROM auth_sessions").get().n,0);
  env.DB.sqlite.exec("UPDATE auth_challenges SET sent_at=1; DELETE FROM auth_rate_limits;");assert.equal((await call("login",{email:"owner@example.test",password:"00000000"})).status,200);
});
test("忘記密碼須先收碼，更新後撤銷全部舊 session；超額寄信被拒絕",async()=>{
  await reset();assert.equal((await call("forgot-password",{email:"nobody@example.test"})).status,200);assert.equal(letters.length,0);
  await call("forgot-password",{email:"owner@example.test"});await call("verify",{code:code()});const old=req();await call("change-password",{password:"reset-strong-password"});assert.equal(await sessions.getSession(old,env),null);
  assert.equal(await crypt.verifyPassword("reset-strong-password",env.DB.sqlite.prepare("SELECT password_hash FROM auth_accounts").get().password_hash),true);
  env.DB.sqlite.exec("UPDATE auth_challenges SET sent_at=1; DELETE FROM auth_rate_limits;");
  for(let n=0;n<5;n++){await call("forgot-password",{email:"owner@example.test"});env.DB.sqlite.exec("UPDATE auth_challenges SET sent_at=1; DELETE FROM auth_rate_limits WHERE count=1;");}
  // An exhausted reservation is enforced atomically by the database.
  env.DB.sqlite.prepare("INSERT OR REPLACE INTO auth_rate_limits(key,count,expires_at) VALUES(?,5,?)").run(crypt.mac(env.AUTH_HMAC_SECRET,"send:owner"),Math.floor(Date.now()/1000)+3600);
  assert.equal((await call("forgot-password",{email:"owner@example.test"})).status,429);
});
