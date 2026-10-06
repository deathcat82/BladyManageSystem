# 站內登入與 Gmail 驗證碼

目前程式已實作，staging 已備份並套用 `0002_site_auth.sql`、初始化兩個預設帳號。2026-10-06 已設定 staging 與正式 Gmail Secret，發布 staging 版本 `5f8a59a6-7d38-433f-9dbf-820140f43097`，以開發者帳號的臨時密碼實測：Gmail SMTP 接受寄信，頁面進入驗證碼步驟。信箱實際收信與首次改密碼需由本人完成，尚未標示驗收通過。

正式 D1 備份、Worker 版本／設定、R2 清單及 Dashboard 的 Access 設定已保存於忽略的 outputs 目錄。正式站尚未套用 auth migration 或發布新登入程式；正式及 staging Access 保護仍保留，等本人驗證後再切換。

## 使用方式

正式站使用 `/login`。Email＋密碼通過後寄送 6 位驗證碼；10 分鐘內有效，最多嘗試 5 次，60 秒可重寄，每帳號每小時最多 5 封。重寄使舊碼失效。登入成功以 Secure / HttpOnly / SameSite=Strict Cookie 保持固定 72 小時。清除 Cookie、换瀏覽器、登出、過期及密碼重設都需要重新驗證。

預設帳號為 `jl89bb020@gmail.com`（owner）、`jerry.master.claw@gmail.com`（developer）。初始化工具由 stdin 接收指定臨時密碼，不回顯；首次收碼後必須改成 12–128 字元且非全相同字元的新密碼。工具使用 INSERT OR IGNORE，重跑不覆寫已設定的密碼或角色。沒有公開註冊入口。

站內帳號及角色以 D1 `auth_accounts` 為準；舊 OWNER_EMAILS / DEVELOPER_EMAILS / Access 設定暫留供回復，新的程式不使用它們來授權。所有私有 API 共用站內工作階段驗證。備份保存帳號雜湊與角色，不保存登入 session、挑戰或限流資料；密碼及驗證碼不寫入稽核。還原帳號備份後應清除現存 session／挑戰，避免版本號回退恢復舊權限。

## Gmail 設定

由使用者本人以 `jerry.master.claw@gmail.com` 啟用 Google 兩步驟驗證並建立「Lulu Studio 登入寄信」應用程式密碼：https://myaccount.google.com/apppasswords 。不要交付 Gmail 登入密碼，也不要把應用程式密碼貼進聊天或 Git。

在專案目錄的 PowerShell 7 執行（node 必須在 PATH）：

```powershell
.\scripts\auth-setup.ps1 -Target staging -Mode smtp
```

工具隱藏輸入，將應用程式密碼保存於 `SMTP_APP_PASSWORD`，若缺少 `AUTH_HMAC_SECRET` 才建立，保留已有 HMAC Secret。寄件地址設定為 `SMTP_USER=jerry.master.claw@gmail.com`；Gmail SMTP 使用 `smtp.gmail.com:465` 的 TLS socket。Google 帳號若不允許應用程式密碼，停止切換並回報；不以降低 Google 帳號保護來繞過。

## 驗收與發布

1. 執行測試、型別檢查、ESLint；`node scripts/build-production.mjs` 建置並核對正式資源。`WRANGLER_TARGET_CONFIG=wrangler.staging.jsonc` 可選 staging。
2. SMTP 設定完成後，使用 `node scripts/deploy-production.mjs` 發布 staging（設定上述 target 環境變數）；發布工具檢查 Secret 名稱與預設帳號／角色。此時仍保留 staging Access，使用既有授權帳號測試新登入。
3. 在 staging 確認實際收碼、首次改密碼、登入、忘記密碼、登出、手機及桌機頁面；驗證 owner 無法存取 developer API、私有照片仍需 session。使用 workerd 測試結果僅證明本機 Workers runtime 相容；須另核對線上 Worker 資源限制及耗時。
4. 保存正式 D1 備份、Worker 版本與正式 Access 應用完整設定；套用正式 migration，再以 `auth-setup.ps1 -Target production -Mode accounts` 安全輸入已指定臨時密碼，然後以 `-Mode smtp` 設定正式寄信 Secret。不要複製 staging 密碼雜湊或登入資料到正式。
5. 通過正式設定检查後發布，保留正式 Access，先由 developer 驗證站內登入。成功後移除正式應用的管理／開發者／私有 API 路徑保護；不要刪除與 staging 共用的 Email 政策，也不要公開 R2。
6. 驗證匿名 `/admin` 導向 `/login`、私有 API 回傳 401、登入後功能正常；保留公開同意書、既有 Demo 及正式資料。客戶本人完成 owner 首次收信及改密碼後，才可把該項標示通過。

若切換異常，先恢復正式 Access 保護，再回復舊 Worker。保留新增 auth 資料表，不倒退資料庫。SMTP 應用程式密碼若被 Google 撤銷，新登入暫停；已有效的站內 session 仍按原 72 小時到期，可在 Gmail 設定更新後恢復寄信。

## API

`GET /api/auth/session` 回傳登入狀態與 CSRF Token；`POST /api/auth/{login,verify,resend,forgot-password,change-password,logout}` 要求同源 JSON 與 CSRF。登入與忘記密碼接受 email，登入另接受 password；verify 接受 code；change-password 只允許通過 OTP 的短期 change session，接受新 password。所有 Token 均由 Cookie 傳遞，不寫入網址或 localStorage。一般 API 401 導向重新登入，角色不足為 403。
