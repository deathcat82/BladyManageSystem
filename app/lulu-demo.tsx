"use client";

import { FormEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";

type Row = Record<string, unknown>;
type Data = { customers: Row[]; appointments: Row[]; services: Row[]; links: Row[]; settings: Record<string, string> };

const serviceTypes = ["霧眉", "霧唇", "唇色淡化", "修眉", "霧眉補色", "霧唇補色"];
const consentServiceItems = ["霧眉", "霧唇", "修眉", "唇色淡化"];
const lipRelatedServiceItems = ["霧唇", "唇色淡化"];
const appointmentMinutes = ["00", "15", "30", "45"];
const skinTypes = ["", "油肌", "乾肌", "敏乾肌", "混合肌", "其他"];
const notices = [
  "本人了解臉部骨骼、肌肉、皮膚狀態及曾接受醫美療程（如填充物、雷射、肉毒等），可能影響紋繡設計、位置判斷及術後呈現效果。",
  "本人了解紋繡效果會因個人體質、皮膚狀況、生活習慣及術後照護方式而有所差異，無法保證每位顧客呈現完全相同之效果。",
  "我已充分認知，在紋繡過程中可能引起疼痛及造成發炎風險的現象，並同意進行紋繡服務。",
  "我接受的半永久化妝紋繡，並非永久性上色，會因時間的關係而逐漸退色淡化及每個人膚質不同，留色會有些許不同，且需適當修復調整才會有較佳之效果。",
  "若想清除已完成的紋繡項目，需透過外科醫療程序來移除，任何其他有效的移除動作皆可能造成傷口或疤痕，需自行負責。",
  "補色為依個人留色情況進行調整之服務，實際補色時間需依皮膚恢復狀況評估。因個人體質差異，無法保證每次皆達到相同留色效果。",
];
const healthDisclosures = ["我必須將我所有醫美及醫療紀錄告知美容師，例如：臉部整形手術、長期服用止痛藥、阿斯匹靈。", "我沒有濫用藥物、酗酒等習慣", "我沒有懷孕", "我對藥物、食物、化妝品或相關產品沒有嚴重過敏反應", "其他"];
const conditions = ["疤痕皮膚炎／溼疹", "紋身", "蟹足腫", "血友病", "心臟病", "癲癇", "糖尿病", "血液不易凝固", "肝炎／黃疸病", "帶狀皰疹／皮蛇", "近期身體不適或發燒", "其他", "以上皆非"];
const lips = ["唇皰疹／口角炎（包括 60 天內曾經罹患）", "口腔潰瘍", "以上皆非", "其他"];
const photoOptions = ["僅作為本人術前術後紀錄保存", "同意遮蔽部分臉部後公開作品展示", "同意完整作品公開展示", "不同意任何公開使用"];
const confirmationItems = ["我已閱讀並了解紋繡術後保養須知及相關注意事項，並同意依照服務人員提供之術後照護方式進行保養。", "本人確認以上資料皆由本人詳實填寫，若有任何健康狀況或特殊情形，應於施作前主動告知服務人員。"];

const value = (row: Row | undefined, key: string) => String(row?.[key] ?? "");
const localDay = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
const taipeiDateTimeParts = (source: string) => {
  if (!source) return undefined;
  const local = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(source);
  if (local && !/(?:Z|[+-]\d{2}:\d{2})$/i.test(source)) return { date: local[1], hour: local[2], minute: local[3] };
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return undefined;
  const [date = "", time = ""] = parsed.toLocaleString("sv-SE", { timeZone: "Asia/Taipei", hour12: false }).split(" ");
  const [hour = "", minute = ""] = time.split(":");
  return date && hour && minute ? { date, hour, minute } : undefined;
};
const dateKey = (source: string) => taipeiDateTimeParts(source)?.date || "";
const showTime = (source: string) => {
  const parts = taipeiDateTimeParts(source);
  return parts ? `${parts.date} ${parts.hour}:${parts.minute}` : "—";
};
const changeList = (list: string[], item: string) => list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
const customerName = (data: Data, id: string) => value(data.customers.find((item) => value(item, "id") === id), "full_name") || "未命名客戶";
const monthLabel = (month: string) => new Date(month + "-01T12:00:00").toLocaleDateString("zh-TW", { year: "numeric", month: "long" });
const taipeiDateTime = () => new Date(Math.ceil(Date.now() / 900000) * 900000).toLocaleString("sv-SE", { timeZone: "Asia/Taipei", hour12: false }).replace(" ", "T").slice(0, 16);
const plusDays = (day: string, days: number) => { const date = new Date(day + "T12:00:00+08:00"); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); };
const appointmentHours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const appointmentParts = (source: string, fallbackDate: string) => {
  const parts = taipeiDateTimeParts(source);
  return { date: parts?.date || fallbackDate, hour: appointmentHours.includes(parts?.hour || "") ? parts!.hour : "10", minute: appointmentMinutes.includes(parts?.minute || "") ? parts!.minute : "00" };
};
const appointmentStartsAt = (form: FormData) => `${String(form.get("appointmentDate") || "")}T${String(form.get("appointmentHour") || "")}:${String(form.get("appointmentMinute") || "")}`;
const serviceStartsAt = (form: FormData) => `${String(form.get("serviceDate") || "")}T${String(form.get("serviceHour") || "")}:${String(form.get("serviceMinute") || "")}`;
const serviceTypeOptions = (current: string) => current && !serviceTypes.includes(current) ? [...serviceTypes, current] : serviceTypes;
const ageForBirthday = (birthday: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return undefined;
  const today = localDay().split("-").map(Number), born = birthday.split("-").map(Number);
  const age = today[0] - born[0] - (today[1] < born[1] || (today[1] === born[1] && today[2] < born[2]) ? 1 : 0);
  return age >= 0 ? age : undefined;
};
const birthdayWithAge = (birthday: string) => {
  const age = ageForBirthday(birthday);
  return birthday ? age === undefined ? birthday : `${birthday}（${age} 歲）` : "—";
};
const ageHint = (birthday: string) => {
  const age = ageForBirthday(birthday);
  return age === undefined ? "" : `（${age} 歲）`;
};

async function post(action: string, payload: Row = {}) {
  const response = await fetch("/api/studio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...payload }) });
  const result = await response.json() as Row;
  if (!response.ok) throw new Error(value(result, "error") || "儲存失敗。");
  return result;
}

function SignaturePad({ onChange }: { onChange: (value: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  useEffect(() => {
    const element = canvas.current, context = element?.getContext("2d");
    if (!element || !context) return;
    const ratio = window.devicePixelRatio || 1;
    element.width = element.clientWidth * ratio; element.height = element.clientHeight * ratio;
    context.scale(ratio, ratio); context.lineWidth = 2.2; context.lineCap = "round"; context.lineJoin = "round";
  }, []);
  const point = (event: PointerEvent<HTMLCanvasElement>) => { const rect = event.currentTarget.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
  const clear = () => { const element = canvas.current, context = element?.getContext("2d"); if (element && context) context.clearRect(0, 0, element.width, element.height); setHasInk(false); onChange(""); };
  return <div className="signature"><canvas ref={canvas} aria-label="手寫簽名欄" onPointerDown={(event) => { const context = canvas.current?.getContext("2d"); if (!context) return; drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId); const p = point(event); context.beginPath(); context.moveTo(p.x, p.y); }} onPointerMove={(event) => { if (!drawing.current) return; const element = canvas.current, context = element?.getContext("2d"); if (!element || !context) return; const p = point(event); context.lineTo(p.x, p.y); context.stroke(); setHasInk(true); onChange(element.toDataURL("image/png")); }} onPointerUp={() => { drawing.current = false; }} /><div><span>{hasInk ? "已完成簽名" : "請在上方手寫簽名"}</span><button type="button" onClick={clear}>清除簽名</button></div></div>;
}

function CheckGroup({ title, items, selected, update, required = false }: { title: string; items: string[]; selected: string[]; update: (items: string[]) => void; required?: boolean }) {
  return <section className="contract-block"><h2>{title}{required && <em>＊</em>}</h2>{items.map((item) => <label className="big-check" key={item}><input type="checkbox" checked={selected.includes(item)} onChange={() => { const isNone = item === "以上皆非"; const next = isNone ? (selected.includes(item) ? [] : [item]) : changeList(selected.filter((entry) => entry !== "以上皆非"), item); update(next); }} /><span>{item}</span></label>)}</section>;
}

function Intake({ token, home }: { token: string; home: () => void }) {
  const [ready, setReady] = useState(false), [error, setError] = useState(""), [signature, setSignature] = useState(""), [message, setMessage] = useState(""), [birthday, setBirthday] = useState(""), [studioName, setStudioName] = useState("Lulu Studio紋繡美學");
  const [noticeChecks, setNoticeChecks] = useState<string[]>([]), [disclosureChecks, setDisclosureChecks] = useState<string[]>([]), [conditionChecks, setConditionChecks] = useState<string[]>([]), [lipChecks, setLipChecks] = useState<string[]>([]), [confirmationChecks, setConfirmationChecks] = useState<string[]>([]), [photo, setPhoto] = useState(""), [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [missing, setMissing] = useState<string[]>([]), [disclosureOther, setDisclosureOther] = useState(""), [conditionOther, setConditionOther] = useState(""), [lipOther, setLipOther] = useState(""), [referralOther, setReferralOther] = useState(""), [referralSource, setReferralSource] = useState("");
  useEffect(() => { void fetch("/api/intake/" + token).then(async (response) => { const result = await response.json() as Row; if (!response.ok || !result.active) setError(value(result, "reason") || "此表單無法使用。"); else { setStudioName(value(result, "studioName") || "Lulu Studio紋繡美學"); setReady(true); } }).catch(() => setError("無法讀取表單。")); }, [token]);
  if (error) return <div className="public-shell"><section className="public-card compact"><h1>此連結無法使用</h1><p className="muted">{error}</p><button className="button secondary" onClick={home}>回首頁</button></section></div>;
  if (!ready) return <div className="public-shell"><section className="public-card compact">正在讀取表單…</section></div>;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const requiresLipConfirmation = selectedServices.some((item) => lipRelatedServiceItems.includes(item));
    const required = [
      !String(form.get("fullName") || "").trim() && "姓名", !String(form.get("phone") || "").trim() && "電話", !String(form.get("lineId") || "").trim() && "LINE ID",
      !String(form.get("birthday") || "").trim() && "生日", (!referralSource || (referralSource === "其他" && !referralOther.trim())) && "得知管道", !selectedServices.length && "服務項目", noticeChecks.length !== notices.length && "服務須知全部同意項目",
      !disclosureChecks.length && "健康揭露", disclosureChecks.includes("其他") && !disclosureOther.trim() && "健康揭露的其他說明",
      (!conditionChecks.length || (conditionChecks.includes("以上皆非") && conditionChecks.length > 1) || (conditionChecks.includes("其他") && !conditionOther.trim())) && "健康狀況",
      (requiresLipConfirmation && (!lipChecks.length || (lipChecks.includes("以上皆非") && lipChecks.length > 1))) && "霧唇確認事項", lipChecks.includes("其他") && !lipOther.trim() && "霧唇確認的其他說明",
      !photo && "照片使用授權", confirmationChecks.length !== confirmationItems.length && "紋繡服務確認事項", !String(form.get("marketingChoice") || "") && "生日優惠資訊意願",
      !signature && "手寫簽名",
    ].filter(Boolean) as string[];
    if (required.length) { setMissing(required); setMessage(""); return; }
    setMissing([]);
    try {
      const response = await fetch("/api/intake/" + token, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName: form.get("fullName"), phone: form.get("phone"), lineId: form.get("lineId"), birthday: form.get("birthday"), referralSource: form.get("referralSource"), referralOther, marketingChoice: form.get("marketingChoice"), serviceItems: selectedServices, notices: noticeChecks, healthDisclosures: disclosureChecks, healthDisclosureOther: disclosureOther, healthConditions: conditionChecks, healthConditionOther: conditionOther, lipConditions: lipChecks, lipOther, photoAuthorization: photo, confirmations: confirmationChecks, signature }) });
      const result = await response.json() as Row; if (!response.ok) throw new Error(value(result, "error")); setMessage("已送出並保存，謝謝您。此連結現在已失效。");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "送出失敗，請稍後重試。"); }
  };
  const requiresLipConfirmation = selectedServices.some((item) => lipRelatedServiceItems.includes(item));
  return <div className="public-shell"><section className="public-card"><p className="eyebrow">{studioName}</p><h1>服務知情同意書</h1><p className="muted">請依自身服務項目與健康狀況完成所有合約內容。</p><form noValidate onSubmit={submit}>{missing.length > 0 && <div className="validation-summary" role="alert"><strong>尚有項目未完成：</strong><ul>{missing.map((item) => <li key={item}>{item}</li>)}</ul></div>}
    <section className="contract-block"><h2>本次施作項目 <em>＊</em></h2><p>可複選，請勾選本次要做的服務。</p>{consentServiceItems.map((item) => <label className="big-check" key={item}><input type="checkbox" checked={selectedServices.includes(item)} onChange={() => setSelectedServices(changeList(selectedServices, item))} /><span>{item}</span></label>)}</section>
    <section className="contract-block contract-notice"><div className="contract-heading">服務須知與注意事項</div><p>請仔細閱讀以下注意事項，確認內容無誤並了解後，請勾選「✓」表示同意 <em>＊</em></p>{notices.map((item) => <label className="big-check" key={item}><input type="checkbox" checked={noticeChecks.includes(item)} onChange={() => setNoticeChecks(changeList(noticeChecks, item))} /><span>{item}</span></label>)}</section>
    <CheckGroup title="為保障您的安全與服務品質，請確認是否有以下健康狀況或特殊情形。" items={healthDisclosures} selected={disclosureChecks} update={setDisclosureChecks} />{disclosureChecks.includes("其他") && <label className="other-field">健康揭露的其他說明<textarea value={disclosureOther} onChange={(event) => setDisclosureOther(event.target.value)} /></label>}
    <CheckGroup title="若有以下健康狀況，請於施作前主動告知服務人員。" items={conditions} selected={conditionChecks} update={setConditionChecks} />{conditionChecks.includes("其他") && <label className="other-field">健康狀況的其他說明<textarea value={conditionOther} onChange={(event) => setConditionOther(event.target.value)} /></label>}
    <CheckGroup title="霧唇施作者專屬確認事項" items={lips} selected={lipChecks} update={setLipChecks} required={requiresLipConfirmation} />{lipChecks.includes("其他") && <label className="other-field">霧唇確認的其他說明<textarea value={lipOther} onChange={(event) => setLipOther(event.target.value)} /></label>}
    <section className="contract-block"><h2>照片使用授權 <em>＊</em></h2>{photoOptions.map((item) => <label className="big-check radio" key={item}><input type="radio" name="photo" required checked={photo === item} onChange={() => setPhoto(item)} /><span>{item}</span></label>)}</section>
    <CheckGroup title="紋繡服務確認事項" items={confirmationItems} selected={confirmationChecks} update={setConfirmationChecks} required />
    <div className="form-grid">
      <label>姓名<input name="fullName" /></label><label>電話<input name="phone" inputMode="tel" /></label><label>LINE ID<input name="lineId" /></label><label>生日<span className="age-hint">{ageHint(birthday)}</span><input name="birthday" type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} /></label>
      <label>得知管道<select name="referralSource" value={referralSource} onChange={(event) => { setReferralSource(event.target.value); if (event.target.value !== "其他") setReferralOther(""); }}><option value="" disabled>請選擇</option><option>Facebook</option><option>Instagram</option><option>親友介紹</option><option>Google 搜尋</option><option>其他</option></select></label>
      {referralSource === "其他" && <label>其他得知管道<input value={referralOther} onChange={(event) => setReferralOther(event.target.value)} placeholder="請填寫" /></label>}
    </div>
    <fieldset className="consent-choice"><legend>生日優惠資訊 <em>＊</em></legend><label><input name="marketingChoice" type="radio" value="yes" />同意接收</label><label><input name="marketingChoice" type="radio" value="no" />不同意接收</label></fieldset><h2>手寫簽名 <em>＊</em></h2><SignaturePad onChange={setSignature} />{message && <p className={message.startsWith("已送出") ? "notice success" : "notice error"}>{message}</p>}{!message.startsWith("已送出") && <button className="button primary">確認並送出表單</button>}
  </form></section></div>;
}

function ServiceTimeFields({ serviceAt = taipeiDateTime() }: { serviceAt?: string }) {
  const parts = appointmentParts(serviceAt, taipeiDateTime().slice(0, 10));
  return <div className="form-grid service-time-fields">
    <label>服務日期<input required name="serviceDate" type="date" defaultValue={parts.date} /></label>
    <label>時<select name="serviceHour" defaultValue={parts.hour}>{appointmentHours.map((hour) => <option key={hour} value={hour}>{hour}</option>)}</select></label>
    <label>分<select name="serviceMinute" defaultValue={parts.minute}>{appointmentMinutes.map((minute) => <option key={minute} value={minute}>{minute}</option>)}</select></label>
  </div>;
}

function CustomerPanel({ data, refresh, say }: { data: Data; refresh: () => Promise<void>; say: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [expanded, setExpanded] = useState("");
  const [newCustomerError, setNewCustomerError] = useState(""), [newBirthday, setNewBirthday] = useState(""), [editBirthday, setEditBirthday] = useState("");
  const selected = data.customers.find((item) => value(item, "id") === (selectedId || value(data.customers[0], "id")));
  const customerId = value(selected, "id");
  const clients = useMemo(() => {
    const keyword = query.toLowerCase();
    return data.customers.filter((item) => !keyword || ["full_name", "phone", "birthday", "line_id"].some((field) => value(item, field).toLowerCase().includes(keyword)));
  }, [data.customers, query]);
  const customerServices = data.services.filter((item) => value(item, "customer_id") === customerId);
  const run = async (action: string, payload: Row) => {
    try { await post(action, payload); setNewCustomerError(""); say("已保存。"); await refresh(); return true; }
    catch (reason) { const message = reason instanceof Error ? reason.message : "儲存失敗。"; if (action === "createCustomer") setNewCustomerError(message); else say(message); return false; }
  };
  const saveService = async (event: FormEvent<HTMLFormElement>, id = "") => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const saved = await run("saveService", { id, customerId, serviceType: form.get("serviceType"), serviceAt: serviceStartsAt(form), careAt: form.get("careAt"), operationColor: form.get("operationColor"), skinType: form.get("skinType"), note: form.get("note") });
    if (saved) { setExpanded(""); if (!id) { event.currentTarget.reset(); setServiceOpen(false); } }
  };
  return <div className="manager-grid">
    <section className="panel client-panel">
      <div className="section-title"><h2>客戶庫</h2><button className="button secondary small" onClick={() => setNewOpen(!newOpen)}>{newOpen ? "收合新增客戶" : "新增客戶"}</button></div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋姓名、電話、生日、LINE ID" />
      {newOpen && <form className="soft-form inset" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); if (await run("createCustomer", { fullName: form.get("fullName"), phone: form.get("phone"), lineId: form.get("lineId"), birthday: form.get("birthday"), referralSource: form.get("referralSource"), note: form.get("note") })) { event.currentTarget.reset(); setNewBirthday(""); setNewOpen(false); } }}>
        <label>姓名<input required name="fullName" /></label><label>電話<input required name="phone" /></label><label>LINE ID<input name="lineId" /></label><label>生日<span className="age-hint">{ageHint(newBirthday)}</span><input required type="date" name="birthday" value={newBirthday} onChange={(event) => setNewBirthday(event.target.value)} /></label>
        <label>得知管道<select name="referralSource"><option>Facebook</option><option>Instagram</option><option>親友介紹</option><option>Google 搜尋</option><option>其他</option></select></label><label>備註<textarea name="note" /></label>
        <div className="new-customer-actions"><button className="button primary">保存新增客戶</button>{newCustomerError && <span className="new-customer-error" role="alert">{newCustomerError}</span>}</div>
      </form>}
      <div className="client-list">{clients.map((item) => <button className={value(item, "id") === customerId ? "selected" : ""} key={value(item, "id")} onClick={() => { setSelectedId(value(item, "id")); setEditOpen(false); setExpanded(""); }}><strong>{value(item, "full_name")}</strong><span>{value(item, "phone")} · {value(item, "line_id") || "未填 LINE ID"}</span></button>)}</div>
    </section>
    <div className="details-stack">
      {selected && !editOpen && <section className="panel"><div className="section-title"><div><p className="eyebrow">CLIENT PROFILE</p><h2>客戶基本資料</h2></div><button className="button secondary small" onClick={() => { setEditBirthday(value(selected, "birthday")); setEditOpen(true); }}>編輯</button></div><dl className="profile-grid"><div><dt>姓名</dt><dd>{value(selected, "full_name")}</dd></div><div><dt>電話</dt><dd>{value(selected, "phone")}</dd></div><div><dt>LINE ID</dt><dd>{value(selected, "line_id") || "—"}</dd></div><div><dt>生日</dt><dd>{birthdayWithAge(value(selected, "birthday"))}</dd></div><div><dt>得知管道</dt><dd>{value(selected, "referral_source") || "—"}</dd></div><div><dt>備註</dt><dd>{value(selected, "note") || "—"}</dd></div></dl></section>}
      {selected && editOpen && <form className="panel customer-edit-inline" key={customerId} onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); if (await run("updateCustomer", { id: customerId, fullName: form.get("fullName"), phone: form.get("phone"), lineId: form.get("lineId"), birthday: form.get("birthday"), referralSource: form.get("referralSource"), note: form.get("note"), marketingConsent: Boolean(form.get("marketingConsent")), reminderConsent: Boolean(form.get("reminderConsent")) })) setEditOpen(false); }}><div className="section-title"><h2>編輯客戶資料</h2><button type="button" className="text-button" onClick={() => setEditOpen(false)}>關閉</button></div><div className="form-grid"><label>姓名<input required name="fullName" defaultValue={value(selected, "full_name")} /></label><label>電話<input required name="phone" defaultValue={value(selected, "phone")} /></label><label>LINE ID<input name="lineId" defaultValue={value(selected, "line_id")} /></label><label>生日<span className="age-hint">{ageHint(editBirthday)}</span><input required name="birthday" type="date" value={editBirthday} onChange={(event) => setEditBirthday(event.target.value)} /></label><label>得知管道<select name="referralSource" defaultValue={value(selected, "referral_source")}><option>Facebook</option><option>Instagram</option><option>親友介紹</option><option>Google 搜尋</option><option>其他</option></select></label></div><label>備註<textarea name="note" defaultValue={value(selected, "note")} /></label><label className="check"><input name="marketingConsent" type="checkbox" defaultChecked={Boolean(selected.marketing_consent)} />生日優惠資訊</label><label className="check"><input name="reminderConsent" type="checkbox" defaultChecked={Boolean(selected.reminder_consent)} />保養／下次服務提醒</label><button className="button primary">保存客戶資料</button></form>}
      {selected && <section className="panel"><div className="section-title"><h2>服務紀錄</h2><button className="button secondary small" onClick={() => setServiceOpen(!serviceOpen)}>{serviceOpen ? "收合新增服務紀錄" : "新增服務紀錄"}</button></div><div className="service-list">{customerServices.map((item) => <article className="service-item" key={value(item, "id")}><button className="service-summary" onClick={() => setExpanded(expanded === value(item, "id") ? "" : value(item, "id"))}><span>{showTime(value(item, "service_at"))} - {value(item, "service_type")}</span><span>{expanded === value(item, "id") ? "收合" : "展開"}</span></button>{expanded === value(item, "id") && <form className="service-detail" onSubmit={(event) => void saveService(event, value(item, "id"))}><label>服務<select name="serviceType" defaultValue={value(item, "service_type")}>{serviceTypeOptions(value(item, "service_type")).map((type) => <option key={type}>{type}</option>)}</select></label><ServiceTimeFields serviceAt={value(item, "service_at")} /><label>保養關心日<input name="careAt" type="date" defaultValue={value(item, "care_at")} /></label><label>操作顏色（選填）<input name="operationColor" defaultValue={value(item, "operation_color")} /></label><label>皮膚狀況<select name="skinType" defaultValue={value(item, "skin_type")}>{skinTypes.map((type) => <option key={type} value={type}>{type || "未記錄"}</option>)}</select></label><label>備註<textarea name="note" required defaultValue={value(item, "note")} /></label><button className="button secondary small">保存修改</button></form>}</article>)}{!customerServices.length && <p className="muted">尚無服務紀錄。</p>}</div>
        {serviceOpen && <form className="soft-form inset" onSubmit={(event) => void saveService(event)}><label>服務<select name="serviceType">{serviceTypes.map((type) => <option key={type}>{type}</option>)}</select></label><ServiceTimeFields /><label>保養關心日<input name="careAt" type="date" defaultValue={plusDays(taipeiDateTime().slice(0, 10), 7)} /></label><label>操作顏色（選填）<input name="operationColor" /></label><label>皮膚狀況<select name="skinType" defaultValue="">{skinTypes.map((type) => <option key={type} value={type}>{type || "未記錄"}</option>)}</select></label><label>備註<textarea name="note" required /></label><button className="button primary">保存服務紀錄</button></form>}
      </section>}
    </div>
  </div>;
}
function CustomerSearch({ data, customerId, select }: { data: Data; customerId: string; select: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const selected = data.customers.find((item) => value(item, "id") === customerId);
  const results = useMemo(() => !query.trim() ? [] : data.customers.filter((item) => ["full_name", "phone", "line_id"].some((key) => value(item, key).toLowerCase().includes(query.toLowerCase()))).slice(0, 5), [data.customers, query]);
  return <div className="customer-picker"><label>客戶搜尋<div className="search-input"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="姓名、電話或 LINE ID" /></div></label><input type="hidden" name="customerId" value={customerId} />{selected && <p className="selected-client">已選擇：{value(selected, "full_name")} · {value(selected, "phone")} <button type="button" onClick={() => select("")}>清除</button></p>}{query && <div className="customer-options">{results.map((item) => <button type="button" key={value(item, "id")} onClick={() => { select(value(item, "id")); setQuery(""); }}><strong>{value(item, "full_name")}</strong><span>{value(item, "phone")} · {value(item, "line_id") || "未填 LINE ID"}</span></button>)}{!results.length && <p className="muted">找不到符合的客戶。</p>}</div>}</div>;
}

function AppointmentFields({ startsAt = "", fallbackDate, depositStatus = "unpaid", depositAmount = "" }: { startsAt?: string; fallbackDate: string; depositStatus?: string; depositAmount?: string }) {
  const parts = appointmentParts(startsAt, fallbackDate);
  const [currentDepositStatus, setCurrentDepositStatus] = useState(depositStatus === "paid" ? "paid" : "unpaid");
  return <div className="form-grid">
    <label>預約日期<input required name="appointmentDate" type="date" defaultValue={parts.date} /></label>
    <label>時<select name="appointmentHour" defaultValue={parts.hour}>{appointmentHours.map((hour) => <option key={hour} value={hour}>{hour}</option>)}</select></label>
    <label>分<select name="appointmentMinute" defaultValue={parts.minute}>{appointmentMinutes.map((minute) => <option key={minute} value={minute}>{minute}</option>)}</select></label>
    <label>訂金狀態<select name="depositStatus" value={currentDepositStatus} onChange={(event) => setCurrentDepositStatus(event.target.value)}><option value="unpaid">未付訂金</option><option value="paid">已付訂金</option></select></label>
    {currentDepositStatus === "paid" && <label>訂金金額（元）<input required name="depositAmount" type="number" min="100" max="5000" step="1" inputMode="numeric" defaultValue={depositAmount} /></label>}
  </div>;
}

function Calendar({ data, refresh, say }: { data: Data; refresh: () => Promise<void>; say: (message: string) => void }) {
  const today = localDay();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [date, setDate] = useState(today);
  const [open, setOpen] = useState(false);
  const [newClient, setNewClient] = useState("");
  const [editAppointment, setEditAppointment] = useState("");
  const [editCare, setEditCare] = useState("");
  const [editClient, setEditClient] = useState("");
  const [year, monthIndex] = month.split("-").map(Number);
  const first = new Date(year, monthIndex - 1, 1).getDay();
  const total = new Date(year, monthIndex, 0).getDate();
  const dates = Array.from({ length: first + total }, (_, index) => index < first ? "" : `${month}-${String(index - first + 1).padStart(2, "0")}`);
  const appointments = data.appointments.filter((item) => dateKey(value(item, "starts_at")) === date && value(item, "status") !== "cancelled");
  const care = data.services.filter((item) => value(item, "care_at") === date);

  const save = async (event: FormEvent<HTMLFormElement>, action: "saveAppointment" | "saveService", id = "", done?: () => void) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!String(form.get("customerId") || "")) return say("請先從搜尋結果選擇客戶。");
    const payload = action === "saveAppointment"
      ? { id, customerId: form.get("customerId"), serviceType: form.get("serviceType"), startsAt: appointmentStartsAt(form), durationMinutes: form.get("durationMinutes"), status: form.get("status") || "scheduled", depositStatus: form.get("depositStatus"), depositAmount: form.get("depositAmount"), note: form.get("note") }
      : { id, customerId: form.get("customerId"), serviceType: form.get("serviceType"), serviceAt: serviceStartsAt(form), careAt: form.get("careAt"), operationColor: form.get("operationColor"), skinType: form.get("skinType"), note: form.get("note") };
    try {
      await post(action, payload);
      await refresh();
      say("已保存。");
      done?.();
    } catch (reason) {
      say(reason instanceof Error ? reason.message : "儲存失敗。");
    }
  };

  const changeMonth = (delta: number) => {
    const next = new Date(`${month}-01T12:00:00`);
    next.setMonth(next.getMonth() + delta);
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    setMonth(nextMonth);
    setDate(`${nextMonth}-01`);
    setOpen(false);
  };

  return <div className="calendar-layout">
    <section className="panel">
      <div className="calendar-head">
        <button className="button secondary small" onClick={() => changeMonth(-1)}>上個月</button>
        <label>選擇年月<input type="month" value={month} onChange={(event) => { setMonth(event.target.value); setDate(`${event.target.value}-01`); }} /></label>
        <button className="button secondary small" onClick={() => changeMonth(1)}>下個月</button>
      </div>
      <h2>{monthLabel(month)}</h2>
      <div className="calendar-week">{["日", "一", "二", "三", "四", "五", "六"].map((item) => <span key={item}>{item}</span>)}</div>
      <div className="month-grid">{dates.map((item, index) => item ? <button key={item} className={item === date ? "day-cell selected-day" : "day-cell"} onClick={() => { setDate(item); setOpen(false); setEditAppointment(""); setEditCare(""); }}><b>{Number(item.slice(8))}</b><span className="event-marks">{data.appointments.some((row) => dateKey(value(row, "starts_at")) === item && value(row, "status") !== "cancelled") && <i className="appointment-mark" />}{data.services.some((row) => value(row, "care_at") === item) && <i className="care-mark" />}</span></button> : <span className="day-cell blank" key={index} />)}</div>
    </section>
    <section className="panel">
      <p className="eyebrow">DAILY TODO</p>
      <div className="section-title"><h2>{date} 待辦</h2><button className="button secondary small" onClick={() => { setOpen(!open); setNewClient(""); }}>{open ? "收合新增預約" : "新增預約"}</button></div>
      <h3>預約</h3>
      {appointments.map((item) => {
        const isPaid = value(item, "deposit_status") === "paid";
        return <article className="todo-card" key={value(item, "id")}><strong>{customerName(data, value(item, "customer_id"))} · {value(item, "service_type")}</strong><small>{showTime(value(item, "starts_at"))}</small><small>{isPaid ? `已付訂金 NT$${value(item, "deposit_amount")}` : "未付訂金"}</small><button type="button" className="text-button" onClick={() => { setEditAppointment(value(item, "id")); setEditCare(""); setEditClient(value(item, "customer_id")); }}>編輯</button>{editAppointment === value(item, "id") && <form className="todo-editor" onSubmit={(event) => void save(event, "saveAppointment", value(item, "id"), () => setEditAppointment(""))}><CustomerSearch data={data} customerId={editClient} select={setEditClient} /><label>服務<select name="serviceType" defaultValue={value(item, "service_type")}>{serviceTypeOptions(value(item, "service_type")).map((type) => <option key={type}>{type}</option>)}</select></label><AppointmentFields startsAt={value(item, "starts_at")} fallbackDate={date} depositStatus={value(item, "deposit_status")} depositAmount={value(item, "deposit_amount")} /><label>時長（分鐘）<input name="durationMinutes" type="number" min="30" step="30" defaultValue={value(item, "duration_minutes") || "120"} /></label><label>狀態<select name="status" defaultValue={value(item, "status")}><option value="scheduled">已排定</option><option value="cancelled">已取消</option></select></label><label>備註<textarea name="note" defaultValue={value(item, "note")} /></label><button className="button secondary small">保存預約</button></form>}</article>;
      })}
      {!appointments.length && <p className="muted">本日尚無預約。</p>}
      <h3>保養關心</h3>
      {care.map((item) => <article className="todo-card" key={value(item, "id")}><strong>{customerName(data, value(item, "customer_id"))} · {value(item, "service_type")}</strong><small>服務時間：{showTime(value(item, "service_at"))}</small><button type="button" className="text-button" onClick={() => { setEditCare(value(item, "id")); setEditAppointment(""); setEditClient(value(item, "customer_id")); }}>編輯</button>{editCare === value(item, "id") && <form className="todo-editor" onSubmit={(event) => void save(event, "saveService", value(item, "id"), () => setEditCare(""))}><CustomerSearch data={data} customerId={editClient} select={setEditClient} /><label>服務<select name="serviceType" defaultValue={value(item, "service_type")}>{serviceTypeOptions(value(item, "service_type")).map((type) => <option key={type}>{type}</option>)}</select></label><ServiceTimeFields serviceAt={value(item, "service_at")} /><label>保養關心日<input name="careAt" type="date" defaultValue={value(item, "care_at")} /></label><label>操作顏色（選填）<input name="operationColor" defaultValue={value(item, "operation_color")} /></label><label>皮膚狀況<select name="skinType" defaultValue={value(item, "skin_type")}>{skinTypes.map((type) => <option key={type} value={type}>{type || "未記錄"}</option>)}</select></label><label>備註<textarea required name="note" defaultValue={value(item, "note")} /></label><button className="button secondary small">保存服務紀錄</button></form>}</article>)}
      {!care.length && <p className="muted">本日尚無保養關心。</p>}
      {open && <form className="soft-form inset" onSubmit={(event) => void save(event, "saveAppointment", "", () => setOpen(false))}><CustomerSearch data={data} customerId={newClient} select={setNewClient} /><label>服務<select name="serviceType">{serviceTypes.map((type) => <option key={type}>{type}</option>)}</select></label><AppointmentFields fallbackDate={date} /><label>時長（分鐘）<input name="durationMinutes" type="number" min="30" step="30" defaultValue="120" /></label><label>備註<textarea name="note" /></label><button className="button primary">保存預約</button></form>}
    </section>
  </div>;
}

function Links({ data, refresh, say }: { data: Data; refresh: () => Promise<void>; say: (message: string) => void }) {
  const [created, setCreated] = useState("");
  const create = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { const result = await post("createFormLink", { days: form.get("days") }); setCreated(location.origin + "/?form=" + value(result.link as Row, "token")); say("已建立一次性表單連結。"); await refresh(); } catch (reason) { say(reason instanceof Error ? reason.message : "建立失敗。"); } };
  const revoke = async (id: string) => { try { await post("revokeFormLink", { id }); say("連結已撤銷。"); await refresh(); } catch (reason) { say(reason instanceof Error ? reason.message : "撤銷失敗。"); } };
  return <div className="two-column"><section className="panel"><p className="eyebrow">ONE-TIME INTAKE</p><h2>產生一次性網址</h2><p className="muted">每份表單皆提供完整合約內容；送出後立即作廢。</p><form className="soft-form" onSubmit={create}><label>有效天數<input name="days" type="number" min="1" max="30" defaultValue={data.settings.default_link_days || "1"} /></label><button className="button primary">產生連結</button></form>{created && <div className="link-card"><code>{created}</code><button className="button secondary" onClick={() => void navigator.clipboard.writeText(created)}>複製網址</button></div>}</section><section className="panel"><p className="eyebrow">RECENT LINKS</p><h2>連結紀錄</h2>{data.links.map((item) => <div className="record" key={value(item, "id")}><strong>{value(item, "service_type") || "綜合表單"} · {value(item, "status") === "active" ? "有效" : value(item, "status") === "used" ? "已使用" : "已撤銷"}</strong><span>到期：{showTime(value(item, "expires_at"))}</span>{value(item, "status") === "active" && <button className="text-button" onClick={() => void revoke(value(item, "id"))}>撤銷連結</button>}</div>)}</section></div>;
}

function Owner({ home, setStudioName }: { home: () => void; setStudioName: (name: string) => void }) {
  const [data, setData] = useState<Data>({ customers: [], appointments: [], services: [], links: [], settings: {} }), [tab, setTab] = useState("clients"), [message, setMessage] = useState("");
  const refresh = async () => { const response = await fetch("/api/studio", { cache: "no-store" }); const result = await response.json() as Data & Row; if (!response.ok) throw new Error(value(result, "error")); setData(result); setStudioName(result.settings.studio_name || "Lulu Studio紋繡美學"); };
  useEffect(() => { void refresh().catch((reason) => setMessage(reason instanceof Error ? reason.message : "無法讀取資料。")); }, []);
  const exportCsv = () => { const columns = ["姓名", "電話", "LINE ID", "生日", "年齡（匯出時）", "得知管道", "備註"]; const rows = data.customers.map((item) => [value(item, "full_name"), value(item, "phone"), value(item, "line_id"), value(item, "birthday"), String(ageForBirthday(value(item, "birthday")) ?? ""), value(item, "referral_source"), value(item, "note")].map((cell) => '"' + cell.replaceAll('"', '""') + '"').join(",")); const blob = new Blob([[columns.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "lulu-studio-clients.csv"; anchor.click(); URL.revokeObjectURL(url); };
  return <main className="workspace"><div className="heading"><div><p className="eyebrow">OWNER CONSOLE · DEMO MODE</p><h1>{data.settings.studio_name || "Lulu Studio紋繡美學"} 管理端</h1><p className="muted">客戶、預約、服務與保養關心皆會保存至資料庫。Demo 未設定登入保護，請勿輸入真實個資。</p></div><div className="heading-actions"><button className="button secondary" onClick={exportCsv}>匯出 CSV</button><button className="text-button" onClick={home}>登出</button></div></div><div className="stats"><div><span>客戶總數</span><strong>{data.customers.length}</strong></div><div><span>今日預約</span><strong>{data.appointments.filter((item) => dateKey(value(item, "starts_at")) === localDay()).length}</strong></div><div><span>待保養關心</span><strong>{data.services.filter((item) => value(item, "care_at") === localDay()).length}</strong></div></div><div className="tabs"><button className={tab === "clients" ? "active" : ""} onClick={() => setTab("clients")}>客戶庫與服務紀錄</button><button className={tab === "calendar" ? "active" : ""} onClick={() => setTab("calendar")}>行事曆與每日待辦</button><button className={tab === "links" ? "active" : ""} onClick={() => setTab("links")}>一次性同意書連結</button></div>{message && <p className={message.includes("失敗") || message.includes("無法") ? "notice error" : "notice success"}>{message}</p>}{tab === "clients" && <CustomerPanel data={data} refresh={refresh} say={setMessage} />}{tab === "calendar" && <Calendar data={data} refresh={refresh} say={setMessage} />}{tab === "links" && <Links data={data} refresh={refresh} say={setMessage} />}</main>;
}

function Developer({ home, setStudioName }: { home: () => void; setStudioName: (name: string) => void }) {
  const [settings, setSettings] = useState<Record<string, string>>({}), [message, setMessage] = useState("");
  useEffect(() => { void fetch("/api/studio").then((response) => response.json()).then((result: Data) => setSettings(result.settings)); }, []);
  return <main className="workspace"><div className="heading"><div><p className="eyebrow">DEVELOPER CONSOLE · DEMO MODE</p><h1>網站設定</h1><p className="muted">正式上線前必須加入帳號驗證與權限控管。</p></div><button className="text-button" onClick={home}>登出</button></div><form className="panel settings" key={settings.studio_name} onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await post("saveSettings", { studioName: form.get("studioName"), defaultLinkDays: form.get("defaultLinkDays") }); setStudioName(String(form.get("studioName") || "Lulu Studio紋繡美學").trim() || "Lulu Studio紋繡美學"); setMessage("設定已保存。"); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "保存失敗。"); } }}><label>工作室名稱<input name="studioName" defaultValue={settings.studio_name || "Lulu Studio紋繡美學"} /></label><label>預設連結有效天數<input name="defaultLinkDays" type="number" min="1" max="30" defaultValue={settings.default_link_days || "1"} /></label><label>LINE 訊息通道<input readOnly value="預留：生日優惠與下次服務提醒（尚未串接 LINE Messaging API）" /></label><div className="notice">Demo 安全提醒：管理端目前沒有真實登入保護，任何可開啟網址的人都能查看資料。請只使用測試資料。</div>{message && <p className="notice success">{message}</p>}<button className="button primary">保存設定</button></form></main>;
}

export default function LuluDemo() {
  const token = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("form") || "";
  const [screen, setScreen] = useState<"home" | "login" | "owner" | "developer" | "public">(token ? "public" : "home");
  const [studioName, setStudioName] = useState("Lulu Studio紋繡美學");
  const home = () => { history.replaceState({}, "", "/"); setScreen("home"); };
  if (screen === "public") return <Intake token={token} home={home} />;
  if (screen === "owner") return <div className="app-shell"><header><button className="brand" onClick={home}>{studioName}<small>CLIENT CARE · DEMO</small></button><nav>經營者端</nav></header><Owner home={home} setStudioName={setStudioName} /></div>;
  if (screen === "developer") return <div className="app-shell"><header><button className="brand" onClick={home}>{studioName}<small>CLIENT CARE · DEMO</small></button><nav>開發者端</nav></header><Developer home={home} setStudioName={setStudioName} /></div>;
  if (screen === "login") return <div className="login-shell"><form className="login-card" onSubmit={(event) => { event.preventDefault(); const email = String(new FormData(event.currentTarget).get("email")); setScreen(email.toLowerCase().includes("dev") ? "developer" : "owner"); }}><p className="eyebrow">LULU STUDIO · DEMO ACCESS</p><h1>進入管理端</h1><p className="muted">此版依需求未啟用安全驗證。信箱含 dev 時進入開發者端，其餘進入經營者端。</p><label>電子信箱<input name="email" required type="email" placeholder="owner@lulu.demo 或 dev@lulu.demo" /></label><label>密碼<input name="password" required type="password" minLength={8} placeholder="任意 8 碼以上（Demo）" /></label><button className="button primary">進入 Demo</button><button className="text-button" type="button" onClick={home}>回首頁</button></form></div>;
  return <main className="landing-shell"><section className="landing-card"><p className="eyebrow">{studioName}</p><h1>把每一份信任<br />好好保存下來。</h1><p className="landing-copy">整合一次性同意書、客戶資料、預約行事曆、服務紀錄與保養關心的紋繡工作流程 Demo。</p><button className="button primary" onClick={() => setScreen("login")}>進入管理端</button><div className="landing-trust"><span>一次性表單</span><span>手寫簽名</span><span>資料庫保存</span><span>LINE 提醒預留</span></div></section><section className="how-grid"><article><b>01</b><h2>建立連結</h2><p>產生可直接傳送給客戶的完整同意書網址。</p></article><article><b>02</b><h2>客戶填寫</h2><p>合約、健康狀況、照片授權與簽名皆會保存。</p></article><article><b>03</b><h2>服務追蹤</h2><p>管理端可編輯客戶、安排預約、記錄服務並管理保養關心日。</p></article></section></main>;
}
