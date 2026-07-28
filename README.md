# 柔霧工作室｜預約與客戶資料管理 Demo

這是霧眉師使用的互動式 Web Demo，以 **TypeScript + React + Vinext** 製作，資料層預留 **Cloudflare D1 / R2 + Drizzle ORM**。

## 已完成的 Demo

- 客戶端術前同意書：必填同意勾選、姓名、電話、LINE ID、生日、得知管道、生日優惠與回訪提醒同意。
- 手寫簽名：可在手機、滑鼠或手寫筆上簽名，未簽名不得送出。
- 經營者端：可產生網址、複製／作廢網址、查看客戶、填寫備註與新增服務時間紀錄。
- 開發者端：同意書版本、一次性網址期限、LINE 整合預留畫面。
- 匯出示意備份：將目前 Demo 客戶資料下載為 JSON。
- 正式資料庫結構：使用者、同意書版本、一次性連結、客戶、同意提交、服務紀錄、設定與稽核軌跡。

## 本機啟動（Windows PowerShell）

Node.js 已安裝於 `D:\Tools\nodejs`，版本為 Node `24.18.0` / npm `11.16.0`，未修改系統 PATH。

```powershell
$env:Path = 'D:\Tools\nodejs;' + $env:Path
& 'D:\Tools\nodejs\npm.cmd' run dev
```

開啟命令列顯示的本機網址即可操作。測試與建置：

```powershell
$env:Path = 'D:\Tools\nodejs;' + $env:Path
& 'D:\Tools\nodejs\npm.cmd' test
& 'D:\Tools\nodejs\npx.cmd' eslint app db tests worker drizzle.config.ts vite.config.ts --ignore-pattern dist --ignore-pattern build
```

資料表變更後，重新產生 migration：

```powershell
& 'D:\Tools\nodejs\npm.cmd' run db:generate
```

目前 migration 位於 [`drizzle/0000_bored_mattie_franklin.sql`](drizzle/0000_bored_mattie_franklin.sql)。

## 目前 Demo 的界線

這個版本是可互動的流程 Demo，頁面狀態只存在目前瀏覽器工作階段。登入、一次性網址作廢、客戶資料、簽名檔、加密 ZIP 備份與 LINE 發送尚未連接真實雲端服務；請勿輸入真實客戶個資。

正式版會接上：

1. Firebase Authentication：經營者與開發者登入，並以角色權限控管。
2. Cloudflare D1：以 transaction 驗證一次性網址並在成功送出時原子化作廢。
3. Cloudflare R2：保存簽名 PNG，資料庫僅保存檔案 key。
4. 加密與匯出：敏感欄位 AES-GCM 加密、備份產出 AES 加密 ZIP。
5. LINE Messaging API：只對有行銷／提醒同意的客戶排程生日優惠與回訪提醒。

## 正式版安全基線

- 網址 token 使用 256-bit 隨機值；伺服器僅保存 SHA-256 雜湊，設定期限、單次使用、撤銷與速率限制。
- 所有管理 API 以 Firebase ID Token 驗證，再由伺服器做 owner/developer RBAC。
- 個資、備註與服務紀錄以每筆隨機 IV 的 AES-GCM 加密；簽名檔放私有 R2。
- 重要操作寫入稽核紀錄：登入、產生／撤銷連結、閱覽、匯出、異動與刪除。
- 使用 HTTPS、HSTS、CSP、CSRF／Origin 檢查、輸入驗證與下載限制。
- LINE 行銷與提醒必須有獨立 opt-in，並保留取消同意的機制。

## 主要檔案

- [`app/page.tsx`](app/page.tsx)：互動式前台、經營者端與開發者端 Demo。
- [`app/globals.css`](app/globals.css)：RWD 介面樣式。
- [`db/schema.ts`](db/schema.ts)：正式版 D1 資料表結構。
- [`.openai/hosting.json`](.openai/hosting.json)：D1/R2 binding 宣告。
- [`tests/rendered-html.test.mjs`](tests/rendered-html.test.mjs)：伺服器渲染與關鍵功能驗收。
