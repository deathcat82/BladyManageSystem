import { connect } from "cloudflare:sockets";

export type Mail = {to:string;subject:string;text:string};
export type MailEnv = {SMTP_USER:string;SMTP_APP_PASSWORD:string};
export async function sendEmail(env:MailEnv,mail:Mail):Promise<void>{
  if(!/^[a-zA-Z0-9._+%-]+@gmail\.com$/.test(env.SMTP_USER) || !env.SMTP_APP_PASSWORD || !/^[a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+$/.test(mail.to))throw new Error("寄信設定不完整");
  const socket=connect({hostname:"smtp.gmail.com",port:465},{secureTransport:"on",allowHalfOpen:false});
  const reader=socket.readable.getReader(),writer=socket.writable.getWriter();
  const timer=setTimeout(()=>{void socket.close().catch(()=>undefined);},15000);
  let pending="";
  const decoder=new TextDecoder();
  async function reply(expected:number){
    let total=0;
    for(;;){
      const end=pending.indexOf("\r\n");
      if(end<0){const data=await reader.read();if(data.done)throw new Error("寄信連線已中斷");pending+=decoder.decode(data.value,{stream:true});if(pending.length>16384)throw new Error("SMTP 回應過長");continue;}
      const line=pending.slice(0,end);pending=pending.slice(end+2);total+=line.length;
      if(total>16384 || !/^\d{3}[ -]/.test(line))throw new Error("SMTP 回應格式不符");
      if(line[3]===" "){if(Number(line.slice(0,3))!==expected)throw new Error("Gmail 暫時無法寄送，請檢查寄信設定或稍後再試。");return;}
    }
  }
  async function command(value:string,expected:number){await writer.write(new TextEncoder().encode(value+"\r\n"));await reply(expected);}
  try{
    await reply(220);await command("EHLO lulu-studio",250);
    await command("AUTH PLAIN "+Buffer.from(`\0${env.SMTP_USER}\0${env.SMTP_APP_PASSWORD.replaceAll(" ","")}`).toString("base64"),235);
    await command(`MAIL FROM:<${env.SMTP_USER}>`,250);await command(`RCPT TO:<${mail.to}>`,250);await command("DATA",354);
    const subject=Buffer.from(mail.subject).toString("base64");
    const body=Buffer.from(mail.text).toString("base64").match(/.{1,76}/g)?.join("\r\n")||"";
    await command(`From: Lulu Studio <${env.SMTP_USER}>\r\nTo: <${mail.to}>\r\nSubject: =?UTF-8?B?${subject}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${body}\r\n.`,250);
    // Once DATA is accepted the message is sent; QUIT failure must not invalidate its code.
  }finally{clearTimeout(timer);reader.releaseLock();writer.releaseLock();await socket.close().catch(()=>undefined);}
}
