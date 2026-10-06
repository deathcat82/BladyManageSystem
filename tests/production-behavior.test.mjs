import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { bundled, database, bucket } from "./helpers/runtime.mjs";

const env=globalThis.__cloudflareTestEnv={};
const key=Buffer.alloc(32,19).toString("base64");
const keyPair=await crypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
const jwk={...await crypto.subtle.exportKey("jwk",keyPair.publicKey),kid:"acceptance-test"};
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{if(String(url).includes("/cdn-cgi/access/certs"))return Response.json({keys:[jwk]});if(String(url).includes("turnstile/v0/siteverify"))return Response.json({success:options.body.get("response")==="valid-turnstile"});throw new Error(`Unexpected test network request: ${url}`);};
test.after(()=>{globalThis.fetch=originalFetch;});
const routes={};for(const name of ["appointments","services","customers","form-links","bootstrap","consents"])routes[name]=await bundled(`app/api/admin/${name}/route.ts`);
const publicRoute=await bundled("app/api/public/form/[token]/route.ts");
const photos=await bundled("app/api/service-photos/route.ts");
const photoFile=await bundled("app/api/service-photos/[id]/route.ts");
const developer=await bundled("app/api/developer/settings/route.ts");
const repository=await bundled("lib/production/repository.ts");
const storage=await bundled("lib/production/storage.ts");
const consent=await bundled("lib/production/consent.ts");
const security=await bundled("lib/production/security.ts");
async function reset(){Object.assign(env,{DB:await database(),SIGNATURES:bucket(),SERVICE_PHOTOS:bucket(),OWNER_EMAILS:"owner@example.test",DEVELOPER_EMAILS:"dev@example.test",ACCESS_AUD:"test-audience",ACCESS_TEAM_DOMAIN:"test.cloudflareaccess.com",APP_ORIGIN:"https://studio.example.test",DATA_ENCRYPTION_KEY:key,BACKUP_ENCRYPTION_KEY:key,TURNSTILE_SITE_KEY:"test",TURNSTILE_SECRET_KEY:"test"});}
async function jwt(email="owner@example.test",claims={}) {const b64=value=>Buffer.from(JSON.stringify(value)).toString("base64url");const unsigned=b64({alg:"RS256",kid:jwk.kid})+"."+b64({email,aud:env.ACCESS_AUD,iss:`https://${env.ACCESS_TEAM_DOMAIN}`,exp:Math.floor(Date.now()/1000)+3600,...claims});return unsigned+"."+Buffer.from(await crypto.subtle.sign("RSASSA-PKCS1-v1_5",keyPair.privateKey,new TextEncoder().encode(unsigned))).toString("base64url");}
async function request(path,body,email="owner@example.test",headers={}){return new Request(env.APP_ORIGIN+path,{method:body?"POST":"GET",headers:{"Cf-Access-Jwt-Assertion":await jwt(email),origin:env.APP_ORIGIN,cookie:"lulu_csrf=test-csrf; photo_csrf=photo-test","x-csrf-token":"test-csrf","x-photo-csrf":"photo-test","content-type":"application/json",...headers},body:body?JSON.stringify(body):undefined});}
async function customer(){return repository.createCustomer(env,{fullName:"驗收客戶",phone:"0912345678",birthday:"1990-01-01"},"owner@example.test");}
const png="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS2kAAAAASUVORK5CYII=";
function payload(overrides={}){return {fullName:"表單驗收",phone:"0999888777",lineId:"test",birthday:"1990-01-01",referralSource:"Instagram",serviceItems:["霧眉"],healthDisclosure:["我沒有懷孕"],healthConditions:["以上皆非"],lipConfirmation:[],serviceNotices:Array(6).fill(true),serviceConfirmation:Array(2).fill(true),photoAuthorization:"僅作為本人術前術後紀錄保存",birthdayOfferConsent:false,reminderConsent:true,signatureDataUrl:png,turnstileToken:"valid-turnstile",...overrides};}
async function link(){const token=crypto.randomUUID();const hash=Buffer.from(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token))).toString("hex");const id=crypto.randomUUID();env.DB.sqlite.prepare("INSERT INTO form_links(id,token_hash,expires_at,created_by) VALUES(?,?,?,?)").run(id,hash,new Date(Date.now()+86400000).toISOString(),"test");return {id,token,hash};}
async function submit(token,body){return publicRoute.POST(new Request(env.APP_ORIGIN+"/api/public/form/"+token,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}),{params:Promise.resolve({token})});}

test("增量 migration 保留舊客戶、預約、已簽同意書與外鍵，舊預約預設未付訂金",async()=>{
  const db=await database(false);const s=db.sqlite;
  s.exec("INSERT INTO customers(id,full_name,phone,normalized_phone,birthday) VALUES('c','舊客','0912345678','0912345678','1990-01-01'); INSERT INTO appointments(id,customer_id,service_type,starts_at,created_by) VALUES('a','c','霧眉','2026-10-06T10:00','owner'); INSERT INTO form_links(id,token_hash,status,expires_at,created_by) VALUES('l','hash','used','2026-01-01','owner'); INSERT INTO consent_submissions(id,link_id,customer_id,contract_version,snapshot_ciphertext,snapshot_iv,signature_object_key,signature_sha256,submitted_at) VALUES('s','l','c','old-version','cipher','iv','old/key','sha','2026-01-01');");
  s.exec("BEGIN");s.exec(await readFile("drizzle-production/0001_demo_parity.sql","utf8"));s.exec("COMMIT");
  assert.equal(s.prepare("SELECT contract_version FROM consent_submissions").get().contract_version,"old-version");assert.equal(s.prepare("SELECT deposit_status FROM appointments").get().deposit_status,"unpaid");assert.deepEqual(s.prepare("PRAGMA foreign_key_check").all(),[]);assert.equal(s.prepare("SELECT COUNT(*) n FROM customers").get().n,1);
});
test("正式客戶、預約訂金、服務編輯、取消及封存恢復會持久保存",async()=>{
  await reset();const id=await customer();const base={customerId:id,serviceType:"霧眉",startsAt:"2026-10-06T10:15",durationMinutes:120,depositStatus:"paid",depositAmount:1000};
  assert.equal((await routes.appointments.POST(await request("/api/admin/appointments",base))).status,200);
  const appointment=env.DB.sqlite.prepare("SELECT * FROM appointments").get();assert.equal(appointment.deposit_amount,1000);
  assert.equal((await routes.appointments.POST(await request("/api/admin/appointments",{...base,id:appointment.id,status:"cancelled",depositStatus:"unpaid"}))).status,200);
  assert.equal(env.DB.sqlite.prepare("SELECT status,deposit_amount FROM appointments").get().status,"cancelled");assert.equal(env.DB.sqlite.prepare("SELECT deposit_amount FROM appointments").get().deposit_amount,null);
  for(const amount of [0,99,5001,100.5])assert.equal((await routes.appointments.POST(await request("/api/admin/appointments",{...base,depositAmount:amount}))).status,422);
  const service={customerId:id,serviceType:"霧眉",serviceAt:"2026-10-06T10:15",skinType:"油肌",careAt:"2026-10-13"};assert.equal((await routes.services.POST(await request("/api/admin/services",service))).status,200);
  const serviceId=env.DB.sqlite.prepare("SELECT id FROM service_records").get().id;assert.equal((await routes.services.POST(await request("/api/admin/services",{...service,id:serviceId,skinType:"乾肌",note:"補記"}))).status,200);
  assert.equal(env.DB.sqlite.prepare("SELECT skin_type FROM service_records").get().skin_type,"乾肌");
  for(const action of ["archive","restore"])assert.equal((await routes.customers.POST(await request("/api/admin/customers",{action,id}))).status,200);
  assert.equal(env.DB.sqlite.prepare("SELECT archived_at FROM customers").get().archived_at,null);
  assert.equal((await routes.customers.GET(await request("/api/admin/customers?q=1990-01-01"))).status,200);
});
test("Access 驗證拒絕匿名、錯誤 audience、過期與越權；寫入要求同源 CSRF",async()=>{
  await reset();assert.equal((await routes.bootstrap.GET(new Request(env.APP_ORIGIN+"/api/admin/bootstrap"))).status,401);
  for(const claims of [{aud:"wrong"},{exp:1}]){const response=await routes.bootstrap.GET(await request("/api/admin/bootstrap",undefined,"owner@example.test",{"Cf-Access-Jwt-Assertion":await jwt("owner@example.test",claims)}));assert.equal(response.status,401);}
  assert.equal((await developer.GET(await request("/api/developer/settings"))).status,403);
  assert.equal((await developer.GET(await request("/api/developer/settings",undefined,"dev@example.test"))).status,200);
  assert.equal((await routes.customers.POST(await request("/api/admin/customers",{action:"create"},"owner@example.test",{"x-csrf-token":"bad"}))).status,403);
});
test("服務照片私有上傳、調閱、格式與大小限制、移除及客戶刪除",async()=>{
  await reset();const id=await customer();await repository.saveService(env,{customerId:id,serviceType:"霧眉",serviceAt:"2026-10-06T10:00"},"test");const serviceId=env.DB.sqlite.prepare("SELECT id FROM service_records").get().id;
  const upload={action:"upload",serviceId,stage:"before",dataUrl:png,originalName:"before.png"};const response=await photos.POST(await request("/api/service-photos",upload));assert.equal(response.status,200);const photoId=(await response.json()).id;
  const photoCsrf="a".repeat(32);const listing=await photos.GET(await request("/api/service-photos?serviceId="+serviceId,undefined,"owner@example.test",{cookie:"photo_csrf="+photoCsrf}));assert.equal((await listing.json()).csrf,photoCsrf,"展開另一份服務紀錄不可使先前照片表單的 CSRF 失效");
  assert.equal((await photoFile.GET(await request("/api/service-photos/"+photoId),{params:Promise.resolve({id:photoId})})).status,200);
  assert.equal((await photoFile.GET(new Request(env.APP_ORIGIN+"/api/service-photos/"+photoId),{params:Promise.resolve({id:photoId})})).status,401);
  assert.equal((await photos.POST(await request("/api/service-photos",{...upload,dataUrl:"data:image/gif;base64,AA=="}))).status,400);
  assert.equal((await photos.POST(await request("/api/service-photos",{...upload,dataUrl:"data:image/png;base64,"+"A".repeat(6*1024*1024)}))).status,413);
  assert.equal((await photos.POST(await request("/api/service-photos",{action:"delete",photoId}))).status,200);assert.equal(env.SERVICE_PHOTOS.objects.size,0);
  assert.equal((await photos.POST(await request("/api/service-photos",upload))).status,200);
  assert.equal((await routes.customers.POST(await request("/api/admin/customers",{action:"delete",id,confirmation:"永久刪除"}))).status,200);assert.equal(env.SERVICE_PHOTOS.objects.size,0);assert.equal(env.DB.sqlite.prepare("SELECT COUNT(*) n FROM service_photos").get().n,0);
});
test("新客同意書原子保存加密快照與私有簽名，一次性連結不可重複使用",async()=>{
  await reset();const {id,token}=await link();assert.equal((await submit(token,payload())).status,200);assert.equal(env.DB.sqlite.prepare("SELECT status FROM form_links WHERE id=?").get(id).status,"used");
  const saved=env.DB.sqlite.prepare("SELECT * FROM consent_submissions").get();const snapshot=JSON.parse(await storage.decryptText(key,saved.snapshot_ciphertext,saved.snapshot_iv));assert.deepEqual(snapshot.serviceItems,["霧眉"]);assert.equal(snapshot.contractContent.notices.length,6);assert.equal(snapshot.turnstileToken,undefined);assert.equal(snapshot.signatureDataUrl,undefined);assert.equal(env.SIGNATURES.objects.size,1);
  assert.equal((await submit(token,payload())).status,410);const second=await link();assert.equal((await submit(second.token,payload())).status,409);assert.equal(env.DB.sqlite.prepare("SELECT status FROM form_links WHERE id=?").get(second.id).status,"active");
});
test("同意書驗證服務、全部確認、霧唇條件、通知選擇、真人驗證及簽名",async()=>{
  await reset();const {token}=await link();for(const overrides of [{serviceItems:[]},{serviceNotices:[true]},{healthConditions:["以上皆非","其他"]},{serviceItems:["霧唇"],lipConfirmation:[]},{birthdayOfferConsent:undefined},{signatureDataUrl:""},{turnstileToken:"invalid"}])assert.equal((await submit(token,payload(overrides))).status,422);
  assert.doesNotThrow(()=>consent.validateConsent(payload()));
  assert.equal((await submit(token,payload({serviceItems:["霧唇"],lipConfirmation:["以上皆非"]}))).status,200);
});
test("資料庫失敗會回滾客戶及通知資料、清除 R2 簽名並允許重試",async()=>{
  await reset();const {id,token}=await link();env.DB.sqlite.exec("CREATE TRIGGER fail_consent BEFORE INSERT ON consent_submissions BEGIN SELECT RAISE(ABORT,'injected failure'); END;");
  assert.equal((await submit(token,payload())).status,500);assert.equal(env.DB.sqlite.prepare("SELECT COUNT(*) n FROM customers").get().n,0);assert.equal(env.DB.sqlite.prepare("SELECT COUNT(*) n FROM notification_preferences").get().n,0);assert.equal(env.SIGNATURES.objects.size,0);assert.equal(env.DB.sqlite.prepare("SELECT status FROM form_links WHERE id=?").get(id).status,"active");
  env.DB.sqlite.exec("DROP TRIGGER fail_consent");assert.equal((await submit(token,payload())).status,200);
});
test("同時送出僅接受一份；撤銷與過期連結無法提交",async()=>{
  await reset();let l=await link();const responses=await Promise.all([submit(l.token,payload()),submit(l.token,payload())]);assert.equal(responses.filter(item=>item.status===200).length,1);assert.equal(env.DB.sqlite.prepare("SELECT COUNT(*) n FROM consent_submissions").get().n,1);
  l=await link();assert.equal((await routes["form-links"].POST(await request("/api/admin/form-links",{action:"revoke",id:l.id}))).status,200);assert.equal((await submit(l.token,payload({phone:"0988777666"}))).status,410);
  l=await link();env.DB.sqlite.prepare("UPDATE form_links SET expires_at=? WHERE id=?").run(new Date(Date.now()-1000).toISOString(),l.id);assert.equal((await submit(l.token,payload())).status,410);
});
test("備份含照片中繼資料；CSP 允許真人驗證 iframe",async()=>{
  await reset();const backup=await storage.weeklyBackup(env);const object=env.SIGNATURES.objects.get(backup.objectKey);const encrypted=JSON.parse(new TextDecoder().decode(object.value));const saved=JSON.parse(await storage.decryptText(key,encrypted.ciphertext,encrypted.iv));assert.ok(Array.isArray(saved.tables.service_photos));assert.equal(security.securityHeaders(Response.json({ok:true})).headers.get("content-security-policy").includes("frame-src https://challenges.cloudflare.com"),true);
});
