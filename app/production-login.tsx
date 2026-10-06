"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Screen="login"|"verify"|"change-password"|"forgot-password";
type AuthReply={csrf:string;error?:string;authenticated?:boolean;requiresPasswordChange?:boolean};
  const destination=()=>new URLSearchParams(window.location.search).get("next")==="/developer"?"/developer":"/admin";
  const go=(path:string)=>window.location.assign(path+"?next="+encodeURIComponent(destination()));
export default function ProductionLogin({screen="login"}:{screen?:Screen}){
  const [csrf,setCsrf]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirmation,setConfirmation]=useState(""),[code,setCode]=useState(""),[error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  useEffect(()=>{let active=true;void fetch("/api/auth/session",{cache:"no-store"}).then(async response=>{const data=await response.json() as AuthReply;if(!response.ok)throw new Error(data.error||"登入系統暫時無法使用");if(!active)return;setCsrf(data.csrf);if(data.authenticated)window.location.assign(destination());else if(data.requiresPasswordChange && screen!=="change-password")go("/login/change-password");else if(!data.requiresPasswordChange && screen==="change-password")go("/login");}).catch(reason=>{if(active)setError(reason.message);});return()=>{active=false;};},[screen]);
  async function send(action:string,body:unknown){const response=await fetch("/api/auth/"+action,{method:"POST",headers:{"content-type":"application/json","x-csrf-token":csrf},body:JSON.stringify(body)});const data=await response.json() as AuthReply;if(!response.ok)throw new Error(data.error||"暫時無法完成，請稍後再試。");return data;}
  async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setError("");try{
    if(screen==="change-password" && password!==confirmation)throw new Error("兩次輸入的密碼不一致。");
    const data=await send(screen==="verify"?"verify":screen,{email,password,code});
    if(screen==="login" || screen==="forgot-password")go("/login/verify");else if(data.requiresPasswordChange)go("/login/change-password");else window.location.assign(destination());
  }catch(reason){setError(reason instanceof Error?reason.message:"無法完成登入");}finally{setBusy(false);}}
  const title={login:"管理端登入",verify:"輸入 Email 驗證碼","change-password":"設定新密碼","forgot-password":"忘記密碼"}[screen];
  return <main className="public-shell"><section className="public-card auth-card"><Link className="brand" href="/">Lulu Studio</Link><h1>{title}</h1><p className="muted">{screen==="login"?"使用 Email 與密碼登入，再至信箱確認驗證碼。成功登入後，同一瀏覽器可保持 3 天。":screen==="verify"?"請輸入信箱收到的 6 位數驗證碼，10 分鐘內有效。":screen==="change-password"?"請設定 12–128 字元的新密碼，不能全部使用相同字元。":"輸入帳號 Email，若帳號可用，系統會寄出重設密碼驗證碼。"}</p>
    {error&&<p className="notice error" role="alert">{error}</p>}{message&&<p className="notice" role="status">{message}</p>}
    <form onSubmit={submit}>
      {(screen==="login" || screen==="forgot-password")&&<label>Email<input type="email" autoComplete="username" value={email} onChange={event=>setEmail(event.target.value)} required maxLength={254}/></label>}
      {(screen==="login" || screen==="change-password")&&<label>{screen==="login"?"密碼":"新密碼"}<input type="password" autoComplete={screen==="login"?"current-password":"new-password"} value={password} onChange={event=>setPassword(event.target.value)} required minLength={screen==="login"?8:12} maxLength={128}/></label>}
      {screen==="change-password"&&<label>再次輸入新密碼<input type="password" autoComplete="new-password" value={confirmation} onChange={event=>setConfirmation(event.target.value)} required minLength={12} maxLength={128}/></label>}
      {screen==="verify"&&<label>驗證碼<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,""))} required/></label>}
      <button className="button primary" disabled={busy||!csrf}>{busy?"處理中…":screen==="verify"?"確認驗證碼":screen==="change-password"?"儲存密碼並登入":"下一步"}</button>
    </form>
    {screen==="verify"&&<button className="button secondary" disabled={busy||!csrf} onClick={()=>{setBusy(true);setError("");void send("resend",{}).then(()=>setMessage("已重新寄出，請使用最新驗證碼。")).catch(reason=>setError(reason.message)).finally(()=>setBusy(false));}}>重寄驗證碼（間隔 60 秒）</button>}
    {screen==="login"?<Link href="/login/forgot-password">忘記密碼</Link>:<Link href="/login">重新登入</Link>}
  </section></main>;
}
