# Lulu Studio紋繡美學｜正式營運版

本分支為正式版上線準備：與既有 Demo 的 Cloudflare 帳號、D1 資料庫及資料完全隔離。**不要將 Demo 資料匯入正式資料庫。**

## 已完成的正式版功能

- 路由：`/` 工作室入口、`/form/[token]` 一次性同意書、`/admin` 經營者端、`/developer` 開發者設定。
- Cloudflare Access：管理與開發 API 在伺服器驗證 Access JWT、Audience、過期時間與 Email allowlist；角色由 `OWNER_EMAILS`、`DEVELOPER_EMAILS` Secret 決定。
- 公開同意書：完整必填、Turnstile、大小限制、最多 8 次嘗試、原子鎖定與送出即失效。
- 個資：手機正規化唯一性、封存／恢復／永久刪除確認、5 年後列入待確認刪除（不會自動刪除）。
- 同意書：不可修改的加密快照與合約版本；PNG 簽名存放私有 R2，D1 僅保存物件鍵與 SHA-256。
- 稽核與營運：客戶、預約、服務紀錄操作稽核；一般 CSV 匯出不含健康揭露與簽名；每週加密備份寫入私有 R2；LINE 僅建立通知同意與待發送資料結構，**不會發送訊息**。
- 安全標頭：CSP、HSTS、Referrer-Policy、Permissions-Policy、`no-store`；程式不記錄姓名、電話、健康資料或簽名。

## 正式上線前，使用者必須完成

1. 建立新的 Cloudflare 免費帳號與新的 `workers.dev` 子網域。
2. 在 Zero Trust 建立團隊名稱，確認可收 Email 驗證碼的登入信箱。
3. 提供最終核准的工作室名稱、個資聯絡窗口、隱私告知與同意書文字。
4. 完成一次 `wrangler login`。之後由 Codex 建立 staging／production 資源與部署。

Cloudflare 目前支援以 Access 保護單一 Worker 的 `workers.dev` 正式網址與預覽網址；此專案會保護 Worker，而非保護公開的 `/form/*` 路徑。正式商用日後建議改用自訂網域。

## 第一次正式帳號設定（PowerShell）

> 以下都在 `D:\AgentProject\BladySystem` 執行。Node 已安裝於 `D:\Tools\nodejs`。

```powershell
$env:Path = 'D:\Tools\nodejs;' + $env:Path
& 'D:\Tools\nodejs\npx.cmd' wrangler login
Copy-Item wrangler.production.jsonc.example wrangler.production.jsonc
```

由 Codex 在已登入的新帳號內依序執行：

```powershell
& 'D:\Tools\nodejs\npx.cmd' wrangler d1 create lulu-studio-production-db
& 'D:\Tools\nodejs\npx.cmd' wrangler r2 bucket create lulu-studio-private-signatures
```

將這兩個新資源的 ID／名稱填入**不提交 Git**的 `wrangler.production.jsonc`：

- `name`：例如 `lulu-studio-production`
- `database_name`、`database_id`
- `bucket_name`
- `APP_ORIGIN`：新 Worker 完成第一次部署後的 `https://<worker>.<subdomain>.workers.dev`
- `ACCESS_TEAM_DOMAIN`、`ACCESS_AUD`：由 Zero Trust 的 Access 應用程式提供

再套用空白正式資料庫 schema：

```powershell
& 'D:\Tools\nodejs\npx.cmd' wrangler d1 migrations apply lulu-studio-production-db --config wrangler.production.jsonc --remote
```

## Secrets（只能在新正式帳號輸入，絕不寫入檔案）

```powershell
& 'D:\Tools\nodejs\npx.cmd' wrangler secret put OWNER_EMAILS --config wrangler.production.jsonc
& 'D:\Tools\nodejs\npx.cmd' wrangler secret put DEVELOPER_EMAILS --config wrangler.production.jsonc
& 'D:\Tools\nodejs\npx.cmd' wrangler secret put TURNSTILE_SECRET_KEY --config wrangler.production.jsonc
& 'D:\Tools\nodejs\npx.cmd' wrangler secret put DATA_ENCRYPTION_KEY --config wrangler.production.jsonc
& 'D:\Tools\nodejs\npx.cmd' wrangler secret put BACKUP_ENCRYPTION_KEY --config wrangler.production.jsonc
```

`DATA_ENCRYPTION_KEY` 和 `BACKUP_ENCRYPTION_KEY` 必須各自為 **32 bytes 的 Base64 值**。可在 PowerShell 產生：

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

`TURNSTILE_SITE_KEY` 是公開值，請寫入 `wrangler.production.jsonc` 的 `vars`；`TURNSTILE_SECRET_KEY` 僅用 `wrangler secret put` 保存。

## Cloudflare Access 設定

1. Workers & Pages → 選擇新 Worker → **Access** → Protect this Worker behind Access。
2. 選擇保護 production 與 preview；建立 Email one-time PIN 的 Allow policy，只允許經營者／開發者 Email。
3. 以兩個 Access 應用程式或 path policy 區分：`/admin*` 給經營者，`/developer*` 僅給開發者；`/form/*` 必須維持公開。
4. 將 Access application 的 Audience（AUD）與團隊網域填回 `wrangler.production.jsonc`。
5. 以無痕視窗確認 `/admin` 會要求 Email 驗證碼、`/form/<token>` 不會要求登入。

## Turnstile 設定

建立一個 Managed Turnstile Widget，允許新正式 `workers.dev` hostname。把 Site Key 放到 `vars.TURNSTILE_SITE_KEY`，Secret Key 透過 `wrangler secret put TURNSTILE_SECRET_KEY` 保存。未設定 Turnstile 的 production 表單會拒絕送出。

## Staging 與 Production 發布

1. 先建立 `lulu-studio-staging` Worker、獨立 staging D1/R2，使用虛構資料驗收。
2. 通過客戶、預約、服務、月曆、同意書、封存、R2 簽名與權限驗收後，建立**新的空白** production D1/R2。
3. 部署使用以下指令；它會暫時讀取本機的 `wrangler.production.jsonc` 產生發布檔，結束後自動還原 Demo 的 `wrangler.jsonc`：

```powershell
$env:Path = 'D:\Tools\nodejs;' + $env:Path
& 'D:\Tools\nodejs\npm.cmd' run deploy:production
```

4. 部署後立刻驗證 `/`、`/admin`、`/developer`、一次性 `/form/<token>`，以及 D1 中沒有 Demo 客戶。

## 備份與還原

- D1 免費方案提供 7 天 Time Travel；每週排程另將 AES-256-GCM 加密快照保存於私有 R2。
- 每月由開發者端建立一次備份後，透過 Cloudflare Dashboard／R2 下載保存到工作室 PC；下載後確認檔案 SHA-256 與 `backup_runs` 稽核紀錄一致。
- 還原先在新的隔離 staging D1 測試，不直接覆蓋 production。任何還原前先下載當前備份。

## 本機品質檢查

```powershell
$env:Path = 'D:\Tools\nodejs;' + $env:Path
& 'D:\Tools\nodejs\npm.cmd' run lint
& 'D:\Tools\nodejs\npm.cmd' test
```

## Git 規則

- `main` 保留既有 Demo 歷史；正式版在 `codex/production-hardening` 分支。
- `wrangler.production.jsonc`、`.dev.vars*`、金鑰、匯出資料庫、SQLite 檔均已忽略，禁止提交。
- 發布前建立中文提交紀錄與 release tag，例如 `v1.0.0-production`。