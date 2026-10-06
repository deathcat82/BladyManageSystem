import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { Miniflare } from "miniflare";

test("實際 workerd 可執行固定參數 scrypt（含兩筆並行）且密碼驗證正確",async()=>{
  const buildResult=await build({stdin:{contents:'import {hashPassword,verifyPassword} from "./lib/production/auth-crypto.ts"; export default {async fetch(){const start=Date.now();const hashes=await Promise.all([hashPassword("runtime-check-password"),hashPassword("runtime-check-password")]);return Response.json({valid:await verifyPassword("runtime-check-password",hashes[0]),invalid:await verifyPassword("wrong",hashes[0]),unique:hashes[0]!==hashes[1],elapsedMs:Date.now()-start});}}',resolveDir:process.cwd()},bundle:true,write:false,format:"esm",platform:"node"});
  // The installed workerd binary supports dates through 2026-05-22; production
  // keeps its existing date. Both runtimes use native node:crypto scrypt.
  const runtime=new Miniflare({modules:true,script:buildResult.outputFiles[0].text,compatibilityDate:"2026-05-22",compatibilityFlags:["nodejs_compat"]});
  try{const response=await runtime.dispatchFetch("https://runtime.test/");assert.equal(response.status,200);const result=await response.json();assert.equal(result.valid,true);assert.equal(result.invalid,false);assert.equal(result.unique,true);assert.ok(result.elapsedMs<15000,`scrypt 耗時 ${result.elapsedMs}ms`);console.log(`workerd scrypt（2 次雜湊＋2 次驗證）：${result.elapsedMs}ms；每次 scrypt 工作記憶體約 32 MiB。`);}finally{await runtime.dispose();}
});
