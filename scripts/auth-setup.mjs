import { readFile,writeFile,mkdir,unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import { randomBytes, scrypt } from "node:crypto";
const [target,mode]=process.argv.slice(2);
if(!["staging","production"].includes(target)||!["smtp","accounts"].includes(mode))throw new Error("請指定 staging/production 與 smtp/accounts");
const config=`wrangler.${target}.jsonc`,settings=JSON.parse(await readFile(config,"utf8"));
if(settings.name!==(target==="production"?"lulu-studio-tw":"lulu-studio-tw-staging"))throw new Error("Worker 名稱不符，停止設定。");
let secret="";for await(const chunk of process.stdin)secret+=chunk;
secret=secret.trim();
const cli="node_modules/wrangler/bin/wrangler.js";
async function run(args,input){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,[cli,...args,"--config",config],{stdio:["pipe","pipe","pipe"]});let output="";child.stdout.on("data",chunk=>output+=chunk);child.stdin.end(input);child.once("error",reject);child.once("exit",code=>code===0?resolve(output):reject(new Error("Cloudflare 設定失敗；請確認授权、migration 與資源設定。")));});}
if(mode==="smtp"){
  secret=secret.replaceAll(" ","");if(!/^[a-zA-Z]{16}$/.test(secret))throw new Error("應用程式密碼格式不符");
  const names=JSON.parse(await run(["secret","list"])).map(value=>value.name);
  if(!names.includes("AUTH_HMAC_SECRET"))await run(["secret","put","AUTH_HMAC_SECRET"],randomBytes(32).toString("hex"));
  await run(["secret","put","SMTP_APP_PASSWORD"],secret);
}else{
  if(secret.length<8 || secret.length>128)throw new Error("臨時密碼長度不符");
  const rows=[];
  for(const [email,role] of [["jl89bb020@gmail.com","owner"],["jerry.master.claw@gmail.com","developer"]]){
    const salt=randomBytes(16).toString("hex"),key=await new Promise((resolve,reject)=>scrypt(secret,salt,32,{N:32768,r:8,p:1,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key)));
    const hash=`scrypt$32768$8$1$${salt}$${key.toString("hex")}`;
    rows.push(`INSERT OR IGNORE INTO auth_accounts(id,email,role,password_hash,must_change_password) VALUES('${randomBytes(16).toString("hex")}','${email}','${role}','${hash}',1);`);
  }
  await mkdir("outputs",{recursive:true});const path=`outputs/auth-initialize-${randomBytes(8).toString("hex")}.sql`;
  try{await writeFile(path,rows.join("\n"),{mode:0o600});await run(["d1","execute",settings.d1_databases[0].database_name,"--remote","--file",path]);}finally{await unlink(path).catch(()=>undefined);}
}
secret="";console.log(`${target} ${mode} 設定完成（未輸出任何密碼；帳號初始化不覆寫既有帳號）。`);
