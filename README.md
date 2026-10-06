# Lulu Studio紋繡美學｜正式營運版

正式版與 Demo 完全分離，客戶資料只會保存於正式 Cloudflare D1／私有 R2。**不要將 Demo 資料匯入正式資料庫。**

## 現行環境

- 正式入口：[lulu-studio-tw.jerry-master-claw.workers.dev](https://lulu-studio-tw.jerry-master-claw.workers.dev/)
- 正式管理端：/admin
- 開發者設定：/developer
- 公開同意書：/form/一次性-token
- Demo：blady-brow-demo.jerry-master-claw.workers.dev，與正式資料完全隔離
- 正式資料庫：lulu-studio-tw-production-db
- 私有簽名與備份：lulu-studio-tw-production-private

## 登入與角色

管理端使用站內 Email＋密碼登入，再以寄至該信箱的驗證碼確認身分。密碼只保存獨立 salt 的 scrypt 雜湊；成功登入後，同一瀏覽器固定保持 72 小時。首次使用臨時密碼時，須通過驗證碼並更換新密碼才能進入管理端。

- 經營者：可使用 /admin 管理客戶、預約、服務與同意書。
- 開發者：可使用 /developer 管理工作室設定、備份與稽核。
- 帳號與角色由正式 D1 的 auth_accounts 管理，沒有公開註冊入口。
- 預設 jl89bb020@gmail.com 為經營者；jerry.master.claw@gmail.com 為開發者，包含經營者權限。

目前已授權的霧眉師帳號為 jl89bb020@gmail.com，僅能進入經營者端。

## 安全與資料保存

- /admin、/developer、管理 API 與服務照片 API 受站內工作階段、角色與 CSRF 保護。舊 Cloudflare Access 登入路徑已撤下，設定保留在備存路徑供回復。
- /demo、/api/studio、舊 /api/intake/* 在正式站一律回傳 404，不能繞過正式表單與登入。
- 公開同意書使用 Turnstile、一次性 Token、嘗試次數限制與原子鎖定。
- 簽名 PNG 存於私有 R2；D1 只保存物件鍵、雜湊與加密同意書快照。
- 一般客戶 CSV 不包含健康揭露或簽名。
- 客戶最後服務後 5 年會列為待確認刪除，不會自動刪除。
- 每週排程建立加密備份；D1 免費方案另有 7 天 Time Travel。

## 日常操作

1. 以預設帳號開啟正式 /admin，完成站內密碼與 Email 驗證碼登入。
2. 建立一次性同意書網址，傳送給客戶填寫。
3. 由客戶庫新增或維護客戶、服務與保養關心。
4. 每月由開發者端建立一次備份，並從私有 R2 下載保存至工作室 PC。
5. 任何還原都先在 staging 驗證，禁止直接覆蓋正式資料庫。

## 正式部署

本機 Node 位於 D:\Tools\nodejs。正式設定放在已忽略的 wrangler.production.jsonc，Secret 僅保存於 Cloudflare。

依序執行：

1. npm test
2. npm run typecheck
3. npm run lint
4. npm run build:production
5. 先保存正式備份、驗證 staging 並套用正式 migration；詳見 [站內登入發布流程](docs/site-login-rollout.md)。
6. npm run deploy:production（先檢查必要 Secret 及預設帳號，再建置發布）

部署後至少確認首頁回應 200、/admin 未登入時導向 /login、匿名私有 API 回應 401、/api/studio 與 /api/intake/test-token 回應 404。

## 正式營運前仍需由工作室核准

- 工作室正式名稱、個資聯絡窗口。
- 同意書與隱私告知最終文字及版本號。
- 每位帳號本人首次登入的收信、驗證碼及改密碼測試。
- 日後若採用自訂網域，需更新 APP_ORIGIN 與 Turnstile hostname。

## Git 規則

- wrangler.production.jsonc、wrangler.staging.jsonc、.dev.vars、金鑰、匯出資料與 SQLite 檔均不得提交。
- 正式發布以遞增的 vX.Y.Z-production release tag 管理；保留既有發布 tag。
