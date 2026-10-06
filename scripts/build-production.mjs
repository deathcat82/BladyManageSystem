import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const targetConfig = process.env.WRANGLER_TARGET_CONFIG || "wrangler.production.jsonc";
const productionConfig = new URL(`../${targetConfig}`, import.meta.url);
let replacement;
try { replacement = await readFile(productionConfig, "utf8"); }
catch { throw new Error("找不到目標 Wrangler 設定檔。請先由 wrangler.production.jsonc.example 複製並填入新 Cloudflare 帳號資源 ID。"); }

const config = JSON.parse(replacement);
const vars = config.vars || {};
const secrets = ["OWNER_EMAILS", "DEVELOPER_EMAILS", "DATA_ENCRYPTION_KEY", "BACKUP_ENCRYPTION_KEY", "TURNSTILE_SECRET_KEY", "SMTP_APP_PASSWORD", "AUTH_HMAC_SECRET"];
if (secrets.some(name => name in vars)) throw new Error("Secret 不得放在 Wrangler vars，請使用 Cloudflare Secret。");
if (!vars.APP_ORIGIN || !vars.SMTP_USER || !vars.TURNSTILE_SITE_KEY) throw new Error("正式環境缺少 Origin、寄件帳號或 Turnstile 設定。");
if ([config.name, ...Object.values(vars), config.d1_databases?.[0]?.database_id].some(value => typeof value !== "string" || /pending|replace|your[_-]/i.test(value))) throw new Error("設定仍有未填入的佔位值，停止發布。");
if (config.name.includes("demo") || config.d1_databases?.length !== 1 || config.d1_databases[0].database_name.includes("demo") || config.d1_databases[0].migrations_dir !== "./drizzle-production") throw new Error("拒絕使用 Demo 資源或 migrations 發布正式版。");
for (const binding of ["SIGNATURES", "SERVICE_PHOTOS"]) if (!config.r2_buckets?.some(item => item.binding === binding && !item.bucket_name.includes("demo"))) throw new Error(`缺少正式私有 ${binding} 綁定。`);
if (!config.triggers?.crons?.length) throw new Error("缺少正式備份排程。");
const run = () => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [fileURLToPath(new URL("../node_modules/vinext/dist/cli.js", import.meta.url)), "build"], { stdio: "inherit", env: { ...process.env, WRANGLER_TARGET_CONFIG: targetConfig } });
  child.once("error", reject);
  child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`正式版建置失敗（exit ${code}）`)));
});

await run();
const generatedPath = new URL("../dist/server/wrangler.json", import.meta.url);
const generated = JSON.parse(await readFile(generatedPath, "utf8"));
if (generated.name !== config.name || generated.d1_databases?.[0]?.database_id !== config.d1_databases[0].database_id) throw new Error("建置產物的 Worker 或 D1 與目標不符，停止發布。");
generated.r2_buckets = config.r2_buckets;
generated.triggers = config.triggers;
generated.vars = vars;
generated.d1_databases = config.d1_databases.map(item => ({ ...item, migrations_dir: resolve(item.migrations_dir) }));
await writeFile(generatedPath, JSON.stringify(generated, null, 2) + "\n");
const verified = JSON.parse(await readFile(generatedPath, "utf8"));
if (["SIGNATURES", "SERVICE_PHOTOS"].some(name => !verified.r2_buckets.some(item => item.binding === name))) throw new Error("產物遺失 R2 綁定。");
console.log(`正式產物驗證完成：${verified.name}`);
