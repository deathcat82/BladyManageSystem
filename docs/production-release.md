# Demo 體驗導入正式版

正式入口：https://lulu-studio-tw.jerry-master-claw.workers.dev/

Demo 獨立保留：https://blady-brow-demo.jerry-master-claw.workers.dev/

## 本次功能

正式管理端共用 Demo 的客戶詳情、服務歷程、月曆、每日待辦與時間選擇介面，透過正式 API、Access 角色與 CSRF 寫入。訂金已付須為整數 NT$100–5,000，未付保存空金額。服務照片支援 JPG、PNG、WebP，每張最多 4 MiB，保存於正式私有 R2 的 `service-photos/` 前綴。

公開同意書使用版本 `lulu-studio-consent-2026-10-v2`，包含服務複選、霧唇條件、缺漏提示、手機簽名與 Turnstile。快照保存當時合約全文，調閱經 Access 授權；舊紀錄保留原版本。已存在的手機仍要求工作室人工處理回訪同意書。

簽名先寫入 R2，客戶、通知偏好、同意書、連結使用狀態與稽核在同一 D1 batch 交易保存。交易失敗清除本次簽名並釋放連結；同時提交只能成功一份。

## 升級與發布

1. 還原忽略的 `wrangler.production.jsonc`，保留現有 Secret 與 Access 帳號。由 `.example` 建立設定時必須填妥所有資源。
2. 備份正式 D1，保存 R2 物件清單、Worker deployments 與原始設定至未提交的 `outputs/`。
3. 在隔離 staging 套用 `drizzle-production/0001_demo_parity.sql`。禁止使用 Demo migration 或匯入 Demo 資料。
4. 執行 `npm test`、`npm run typecheck`、`npm run lint`、`npm run build:production`，在 staging 驗證登入與完整操作。
5. PR 合併至 `main` 後，重新以正式設定建置，套用正式 migration，部署 `dist/server/wrangler.json`。建置驗證 Worker、D1、私有 R2、正式 migration、排程與必要非機密設定；發布前另確認遠端 Secret 名稱完整。
6. 驗證正式首頁、Access 登入、客戶／服務／訂金／照片／同意書，以及停用 Demo API。全部驗收完成後才建立 `v1.0.0-production`。

直接使用本機 Node 時，可執行 `node node_modules/wrangler/bin/wrangler.js ...` 與 `node scripts/build-production.mjs`。staging 建置需設定 `WRANGLER_TARGET_CONFIG=wrangler.staging.jsonc`；正式建置省略該環境變數。

## 回復

部署異常時使用保存的正式版本 ID 回復 Worker，例如：

```powershell
node node_modules/wrangler/bin/wrangler.js rollback e9b1d27a-a285-4417-9c05-c74d16db073c --config wrangler.production.jsonc
```

保留新增訂金欄位與照片表，不自動倒退資料庫或清除資料。若發布後新增資料，資料庫還原需另行評估並先在 staging 演練。

## 驗收證據（2026-10-06）

- 14 項自動測試通過，包含舊資料升級／外鍵、訂金、角色與 CSRF、照片權限／大小／格式、加密與原子保存、失敗重試、同時提交、撤銷／過期及備份。
- TypeScript 與 ESLint 通過；正式及 staging 建置成功。
- staging 實際登入成功，客戶新增／修改、生日搜尋、封存／恢復、服務與油肌選項、照片上傳／預覽、訂金 NT$1,000、跨月 11/01 00:15、重新整理後保存、一次性網址已驗證。
- 手機 390px 表單無水平溢出，霧唇條件欄位正確；真實 Turnstile 尚待人工完成。
- 正式 D1 升級前匯出已保存；R2 清單 4 筆及先前 Worker deployment 資訊已保存。正式 migration 與新版發布仍待完整 staging 驗收。

實際 Cloudflare 登入目前提供 Cloudflare 帳號登入，本輪開發者登入未要求 Email OTP；經營者帳號的實際登入仍須完成驗收，不能以角色單元測試代替。
