"use client";
import { useEffect, useRef, useState } from "react";
declare global { interface Window { turnstile?: { render:(element:HTMLElement,options:Record<string,unknown>)=>string; reset:(id:string)=>void; remove:(id:string)=>void } } }
export function useTurnstile(siteKey:string) {
  const [token,setToken]=useState("");const host=useRef<HTMLDivElement>(null);const widget=useRef("");
  useEffect(()=>{
    if(!siteKey||!host.current)return;
    let cancelled=false;
    const render=()=>{if(!cancelled&&window.turnstile&&host.current&&!widget.current)widget.current=window.turnstile.render(host.current,{sitekey:siteKey,callback:setToken,"expired-callback":()=>setToken(""),"error-callback":()=>setToken("")});};
    let script=document.querySelector<HTMLScriptElement>('script[src*="turnstile/v0/api.js"]');
    if(window.turnstile)render();else{if(!script){script=document.createElement("script");script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";script.async=true;document.head.appendChild(script);}script.addEventListener("load",render);}
    return()=>{cancelled=true;script?.removeEventListener("load",render);if(widget.current&&window.turnstile)window.turnstile.remove(widget.current);widget.current="";};
  },[siteKey]);
  const reset=()=>{setToken("");if(widget.current&&window.turnstile)window.turnstile.reset(widget.current);};
  return {token,host,reset};
}
