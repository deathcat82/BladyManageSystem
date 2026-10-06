import test from "node:test";
import assert from "node:assert/strict";
import { bundled } from "./helpers/runtime.mjs";
const smtp=await bundled("lib/production/smtp.ts");
function server(authCode=235){
  let controller;const commands=[],encode=value=>new TextEncoder().encode(value+"\r\n");let closed=false;
  globalThis.__smtpConnect=(address,options)=>{
    assert.equal(address.hostname,"smtp.gmail.com");assert.equal(address.port,465);assert.equal(options.secureTransport,"on");
    return {readable:new ReadableStream({start(stream){controller=stream;controller.enqueue(encode("220 smtp.gmail.com ready"));}}),writable:new WritableStream({write(bytes){const command=new TextDecoder().decode(bytes);commands.push(command);controller.enqueue(encode(command.startsWith("EHLO")?"250-smtp.gmail.com\r\n250 AUTH PLAIN":command.startsWith("AUTH")?`${authCode} authentication response`:command.startsWith("DATA")?"354 send message":"250 accepted"));}}),async close(){closed=true;controller.close();}};
  };
  return {commands,get closed(){return closed;}};
}
test.after(()=>{delete globalThis.__smtpConnect;});
test("Gmail SMTP 經 TLS 驗證、處理多行回應、寄送 UTF-8 信件並關閉連線",async()=>{
  const state=server();await smtp.sendEmail({SMTP_USER:"jerry.master.claw@gmail.com",SMTP_APP_PASSWORD:"test-password"},{to:"owner@example.test",subject:"登入驗證碼",text:"您的驗證碼是：123456"});
  assert.equal(state.closed,true);assert.ok(state.commands.some(command=>command.startsWith("AUTH PLAIN ")));assert.ok(state.commands.some(command=>command.startsWith("RCPT TO:<owner@example.test>")));
  const data=state.commands.at(-1);assert.match(data,/Content-Transfer-Encoding: base64/);assert.match(data,/\r\n\.\r\n$/);assert.match(Buffer.from(data.split("\r\n\r\n")[1].split("\r\n.")[0],"base64").toString("utf8"),/123456/);
});
test("Gmail 拒絕驗證時回傳安全錯誤並關閉連線，不寄出 DATA",async()=>{
  const state=server(535);await assert.rejects(()=>smtp.sendEmail({SMTP_USER:"jerry.master.claw@gmail.com",SMTP_APP_PASSWORD:"private-test-secret"},{to:"owner@example.test",subject:"test",text:"test"}),error=>!error.message.includes("private-test-secret"));assert.equal(state.closed,true);assert.equal(state.commands.some(command=>command.startsWith("DATA")),false);
});
