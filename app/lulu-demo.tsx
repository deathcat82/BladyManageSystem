"use client";

import { useEffect, useState } from "react";
import { CustomerPanel, Calendar, Links, StudioActionsContext, value, localDay, dateKey } from "./studio-panels";
import ConsentForm from "./consent-form";
import { ageOn } from "@/lib/production/validation";

type Row = Record<string, unknown>;
type Data = { customers: Row[]; appointments: Row[]; services: Row[]; links: Row[]; settings: Record<string, string> };


async function post(action: string, payload: Row = {}) {
  const response = await fetch("/api/studio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...payload }) });
  const result = await response.json() as Row;
  if (!response.ok) throw new Error(value(result, "error") || "儲存失敗。");
  return result;
}

function Owner({ home, setStudioName }: { home: () => void; setStudioName: (name: string) => void }) {
  const [data, setData] = useState<Data>({ customers: [], appointments: [], services: [], links: [], settings: {} }), [tab, setTab] = useState("clients"), [message, setMessage] = useState("");
  const refresh = async () => { const response = await fetch("/api/studio", { cache: "no-store" }); const result = await response.json() as Data & Row; if (!response.ok) throw new Error(value(result, "error")); setData(result); setStudioName(result.settings.studio_name || "Lulu Studio紋繡美學"); };
  // Demo 首次載入僅執行一次；正式版已改採受保護 API。
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void refresh().catch((reason) => setMessage(reason instanceof Error ? reason.message : "無法讀取資料。")); }, []);
  const exportCsv = () => { const columns = ["姓名", "電話", "LINE ID", "生日", "年齡（匯出時）", "得知管道", "備註"]; const rows = data.customers.map((item) => [value(item, "full_name"), value(item, "phone"), value(item, "line_id"), value(item, "birthday"), String(ageOn(value(item, "birthday")) ?? ""), value(item, "referral_source"), value(item, "note")].map((cell) => '"' + cell.replaceAll('"', '""') + '"').join(",")); const blob = new Blob([[columns.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "lulu-studio-clients.csv"; anchor.click(); URL.revokeObjectURL(url); };
  return <StudioActionsContext.Provider value={post}><main className="workspace"><div className="heading"><div><p className="eyebrow">OWNER CONSOLE · DEMO MODE</p><h1>{data.settings.studio_name || "Lulu Studio紋繡美學"} 管理端</h1><p className="muted">客戶、預約、服務與保養關心皆會保存至資料庫。Demo 未設定登入保護，請勿輸入真實個資。</p></div><div className="heading-actions"><button className="button secondary" onClick={exportCsv}>匯出 CSV</button><button className="text-button" onClick={home}>登出</button></div></div><div className="stats"><div><span>客戶總數</span><strong>{data.customers.length}</strong></div><div><span>今日預約</span><strong>{data.appointments.filter((item) => dateKey(value(item, "starts_at")) === localDay()).length}</strong></div><div><span>待保養關心</span><strong>{data.services.filter((item) => value(item, "care_at") === localDay()).length}</strong></div></div><div className="tabs"><button className={tab === "clients" ? "active" : ""} onClick={() => setTab("clients")}>客戶庫與服務紀錄</button><button className={tab === "calendar" ? "active" : ""} onClick={() => setTab("calendar")}>行事曆與每日待辦</button><button className={tab === "links" ? "active" : ""} onClick={() => setTab("links")}>一次性同意書連結</button></div>{message && <p className={message.includes("失敗") || message.includes("無法") ? "notice error" : "notice success"}>{message}</p>}{tab === "clients" && <CustomerPanel data={data} refresh={refresh} say={setMessage} />}{tab === "calendar" && <Calendar data={data} refresh={refresh} say={setMessage} />}{tab === "links" && <Links data={data} refresh={refresh} say={setMessage} />}</main></StudioActionsContext.Provider>;
}

function Developer({ home, setStudioName }: { home: () => void; setStudioName: (name: string) => void }) {
  const [settings, setSettings] = useState<Record<string, string>>({}), [message, setMessage] = useState("");
  useEffect(() => { void fetch("/api/studio").then((response) => response.json() as Promise<Data>).then((result: Data) => setSettings(result.settings)); }, []);
  return <main className="workspace"><div className="heading"><div><p className="eyebrow">DEVELOPER CONSOLE · DEMO MODE</p><h1>網站設定</h1><p className="muted">正式上線前必須加入帳號驗證與權限控管。</p></div><button className="text-button" onClick={home}>登出</button></div><form className="panel settings" key={settings.studio_name} onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await post("saveSettings", { studioName: form.get("studioName"), defaultLinkDays: form.get("defaultLinkDays") }); setStudioName(String(form.get("studioName") || "Lulu Studio紋繡美學").trim() || "Lulu Studio紋繡美學"); setMessage("設定已保存。"); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "保存失敗。"); } }}><label>工作室名稱<input name="studioName" defaultValue={settings.studio_name || "Lulu Studio紋繡美學"} /></label><label>預設連結有效天數<input name="defaultLinkDays" type="number" min="1" max="30" defaultValue={settings.default_link_days || "1"} /></label><label>LINE 訊息通道<input readOnly value="預留：生日優惠與下次服務提醒（尚未串接 LINE Messaging API）" /></label><div className="notice">Demo 安全提醒：管理端目前沒有真實登入保護，任何可開啟網址的人都能查看資料。請只使用測試資料。</div>{message && <p className="notice success">{message}</p>}<button className="button primary">保存設定</button></form></main>;
}

export default function LuluDemo() {
  const token = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("form") || "";
  const [screen, setScreen] = useState<"home" | "login" | "owner" | "developer" | "public">(token ? "public" : "home");
  const [studioName, setStudioName] = useState("Lulu Studio紋繡美學");
  const home = () => { history.replaceState({}, "", "/"); setScreen("home"); };
  if (screen === "public") return <ConsentForm token={token} home={home} />;
  if (screen === "owner") return <div className="app-shell"><header><button className="brand" onClick={home}>{studioName}<small>CLIENT CARE · DEMO</small></button><nav>經營者端</nav></header><Owner home={home} setStudioName={setStudioName} /></div>;
  if (screen === "developer") return <div className="app-shell"><header><button className="brand" onClick={home}>{studioName}<small>CLIENT CARE · DEMO</small></button><nav>開發者端</nav></header><Developer home={home} setStudioName={setStudioName} /></div>;
  if (screen === "login") return <div className="login-shell"><form className="login-card" onSubmit={(event) => { event.preventDefault(); const email = String(new FormData(event.currentTarget).get("email")); setScreen(email.toLowerCase().includes("dev") ? "developer" : "owner"); }}><p className="eyebrow">LULU STUDIO · DEMO ACCESS</p><h1>進入管理端</h1><p className="muted">此版依需求未啟用安全驗證。信箱含 dev 時進入開發者端，其餘進入經營者端。</p><label>電子信箱<input name="email" required type="email" placeholder="owner@lulu.demo 或 dev@lulu.demo" /></label><label>密碼<input name="password" required type="password" minLength={8} placeholder="任意 8 碼以上（Demo）" /></label><button className="button primary">進入 Demo</button><button className="text-button" type="button" onClick={home}>回首頁</button></form></div>;
  return <main className="landing-shell"><section className="landing-card"><p className="eyebrow">{studioName}</p><h1>把每一份信任<br />好好保存下來。</h1><p className="landing-copy">整合一次性同意書、客戶資料、預約行事曆、服務紀錄與保養關心的紋繡工作流程 Demo。</p><button className="button primary" onClick={() => setScreen("login")}>進入管理端</button><div className="landing-trust"><span>一次性表單</span><span>手寫簽名</span><span>資料庫保存</span><span>LINE 提醒預留</span></div></section><section className="how-grid"><article><b>01</b><h2>建立連結</h2><p>產生可直接傳送給客戶的完整同意書網址。</p></article><article><b>02</b><h2>客戶填寫</h2><p>合約、健康狀況、照片授權與簽名皆會保存。</p></article><article><b>03</b><h2>服務追蹤</h2><p>管理端可編輯客戶、安排預約、記錄服務並管理保養關心日。</p></article></section></main>;
}