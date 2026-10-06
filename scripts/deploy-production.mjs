import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
const config=process.env.WRANGLER_TARGET_CONFIG||"wrangler.production.jsonc";
const cli="node_modules/wrangler/bin/wrangler.js";
async function run(args,capture=false){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{stdio:capture?["ignore","pipe","pipe"]:"inherit"});let output="";if(capture)child.stdout.on("data",chunk=>output+=chunk);child.once("error",reject);child.once("exit",code=>code===0?resolve(output):reject(new Error("正式發布檢查或部署失敗")));});}
const names=new Set(JSON.parse(await run([cli,"secret","list","--config",config],true)).map(secret=>secret.name));
for(const name of ["DATA_ENCRYPTION_KEY","BACKUP_ENCRYPTION_KEY","TURNSTILE_SECRET_KEY","SMTP_APP_PASSWORD","AUTH_HMAC_SECRET"])if(!names.has(name))throw new Error(`缺少 ${name}，停止發布。`);
const settings=JSON.parse(await readFile(config,"utf8"));
const accounts=JSON.parse(await run([cli,"d1","execute",settings.d1_databases[0].database_name,"--remote","--config",config,"--json","--command","SELECT COUNT(*) AS ready FROM auth_accounts WHERE disabled=0 AND ((email='jl89bb020@gmail.com' AND role='owner') OR (email='jerry.master.claw@gmail.com' AND role='developer'))"],true));
if(accounts[0]?.results?.[0]?.ready!==2)throw new Error("預設帳號或權限尚未初始化，停止發布。");
await run(["scripts/build-production.mjs"]);
await run([cli,"deploy","--config","dist/server/wrangler.json"]);
