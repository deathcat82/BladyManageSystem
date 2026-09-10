import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";

const liveConfig = new URL("../wrangler.jsonc", import.meta.url);
const targetConfig = process.env.WRANGLER_TARGET_CONFIG || "wrangler.production.jsonc";
const productionConfig = new URL(`../${targetConfig}`, import.meta.url);
const original = await readFile(liveConfig, "utf8");
let replacement;
try { replacement = await readFile(productionConfig, "utf8"); }
catch { throw new Error("找不到目標 Wrangler 設定檔。請先由 wrangler.production.jsonc.example 複製並填入新 Cloudflare 帳號資源 ID。"); }

const npmCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
const run = () => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [npmCli, "run", "build"], { stdio: "inherit" });
  child.once("error", reject);
  child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`正式版建置失敗（exit ${code}）`)));
});

await writeFile(liveConfig, replacement, "utf8");
try { await run(); }
finally { await writeFile(liveConfig, original, "utf8"); }
