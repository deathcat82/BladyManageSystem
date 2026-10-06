"use client";
import { createContext, useContext, FormEvent, ReactNode, useMemo, useState } from "react";
import ServicePhotoManager from "./service-photo-manager";
export type Row = Record<string, unknown>;
export type StudioData = { customers: Row[]; appointments: Row[]; services: Row[]; links: Row[]; settings: Record<string,string> };
type Data = StudioData;
export type StudioPost = (action:string, payload?:Row) => Promise<Row>;
export const StudioActionsContext = createContext<StudioPost>(async () => { throw new Error("尚未載入管理資料"); });
const serviceTypes = ["霧眉", "霧唇", "唇色淡化", "修眉", "霧眉補色", "霧唇補色"];
const appointmentMinutes = ["00", "15", "30", "45"];
const skinTypes = ["", "油肌", "乾肌", "油肌乾肌", "敏乾肌", "混合肌", "其他"];
export const value = (row: Row | undefined, key: string) => String(row?.[key] ?? "");
export const localDay = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
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
export const dateKey = (source: string) => taipeiDateTimeParts(source)?.date || "";
const showTime = (source: string) => {
  const parts = taipeiDateTimeParts(source);
  return parts ? `${parts.date} ${parts.hour}:${parts.minute}` : "—";
};
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
export const ageHint = (birthday: string) => {
  const age = ageForBirthday(birthday);
  return age === undefined ? "" : `（${age} 歲）`;
};

function ServiceTimeFields({ serviceAt = taipeiDateTime() }: { serviceAt?: string }) {
  const parts = appointmentParts(serviceAt, taipeiDateTime().slice(0, 10));
  return <div className="form-grid service-time-fields">
    <label>服務日期<input required name="serviceDate" type="date" defaultValue={parts.date} /></label>
    <label>時<select name="serviceHour" defaultValue={parts.hour}>{appointmentHours.map((hour) => <option key={hour} value={hour}>{hour}</option>)}</select></label>
    <label>分<select name="serviceMinute" defaultValue={parts.minute}>{appointmentMinutes.map((minute) => <option key={minute} value={minute}>{minute}</option>)}</select></label>
  </div>;
}

export function CustomerPanel({ data, refresh, say, renderCustomerActions }: { data: Data; refresh: () => Promise<void>; say: (message: string) => void; renderCustomerActions?: (customer:Row)=>ReactNode }) {
  const post = useContext(StudioActionsContext);
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
    const formElement = event.currentTarget; const form = new FormData(formElement);
    const saved = await run("saveService", { id, customerId, serviceType: form.get("serviceType"), serviceAt: serviceStartsAt(form), careAt: form.get("careAt"), operationColor: form.get("operationColor"), skinType: form.get("skinType"), note: form.get("note") });
    if (saved) { setExpanded(""); if (!id) { formElement.reset(); setServiceOpen(false); } }
  };
  return <div className="manager-grid">
    <section className="panel client-panel">
      <div className="section-title"><h2>客戶庫</h2><button className="button secondary small" onClick={() => setNewOpen(!newOpen)}>{newOpen ? "收合新增客戶" : "新增客戶"}</button></div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋姓名、電話、生日、LINE ID" />
      {newOpen && <form className="soft-form inset" onSubmit={async (event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); if (await run("createCustomer", { fullName: form.get("fullName"), phone: form.get("phone"), lineId: form.get("lineId"), birthday: form.get("birthday"), referralSource: form.get("referralSource"), note: form.get("note") })) { formElement.reset(); setNewBirthday(""); setNewOpen(false); } }}>
        <label>姓名<input required name="fullName" /></label><label>電話<input required name="phone" /></label><label>LINE ID<input name="lineId" /></label><label>生日<span className="age-hint">{ageHint(newBirthday)}</span><input required type="date" name="birthday" value={newBirthday} onChange={(event) => setNewBirthday(event.target.value)} /></label>
        <label>得知管道<select name="referralSource"><option>Facebook</option><option>Instagram</option><option>親友介紹</option><option>Google 搜尋</option><option>其他</option></select></label><label>備註<textarea name="note" /></label>
        <div className="new-customer-actions"><button className="button primary">保存新增客戶</button>{newCustomerError && <span className="new-customer-error" role="alert">{newCustomerError}</span>}</div>
      </form>}
      <div className="client-list">{clients.map((item) => <button className={value(item, "id") === customerId ? "selected" : ""} key={value(item, "id")} onClick={() => { setSelectedId(value(item, "id")); setEditOpen(false); setExpanded(""); }}><strong>{value(item, "full_name")}{Boolean(item.archived_at) && <small>（已封存）</small>}</strong><span>{value(item, "phone")} · {value(item, "line_id") || "未填 LINE ID"}</span></button>)}</div>
    </section>
    <div className="details-stack">{selected && renderCustomerActions?.(selected)}
      {selected && !editOpen && <section className="panel"><div className="section-title"><div><p className="eyebrow">CLIENT PROFILE</p><h2>客戶基本資料</h2></div><button className="button secondary small" onClick={() => { setEditBirthday(value(selected, "birthday")); setEditOpen(true); }}>編輯</button></div><dl className="profile-grid"><div><dt>姓名</dt><dd>{value(selected, "full_name")}</dd></div><div><dt>電話</dt><dd>{value(selected, "phone")}</dd></div><div><dt>LINE ID</dt><dd>{value(selected, "line_id") || "—"}</dd></div><div><dt>生日</dt><dd>{birthdayWithAge(value(selected, "birthday"))}</dd></div><div><dt>得知管道</dt><dd>{value(selected, "referral_source") || "—"}</dd></div><div><dt>備註</dt><dd>{value(selected, "note") || "—"}</dd></div></dl></section>}
      {selected && editOpen && <form className="panel customer-edit-inline" key={customerId} onSubmit={async (event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); if (await run("updateCustomer", { id: customerId, fullName: form.get("fullName"), phone: form.get("phone"), lineId: form.get("lineId"), birthday: form.get("birthday"), referralSource: form.get("referralSource"), note: form.get("note"), marketingConsent: Boolean(form.get("marketingConsent")), reminderConsent: Boolean(form.get("reminderConsent")) })) setEditOpen(false); }}><div className="section-title"><h2>編輯客戶資料</h2><button type="button" className="text-button" onClick={() => setEditOpen(false)}>關閉</button></div><div className="form-grid"><label>姓名<input required name="fullName" defaultValue={value(selected, "full_name")} /></label><label>電話<input required name="phone" defaultValue={value(selected, "phone")} /></label><label>LINE ID<input name="lineId" defaultValue={value(selected, "line_id")} /></label><label>生日<span className="age-hint">{ageHint(editBirthday)}</span><input required name="birthday" type="date" value={editBirthday} onChange={(event) => setEditBirthday(event.target.value)} /></label><label>得知管道<select name="referralSource" defaultValue={value(selected, "referral_source")}><option>Facebook</option><option>Instagram</option><option>親友介紹</option><option>Google 搜尋</option><option>其他</option></select></label></div><label>備註<textarea name="note" defaultValue={value(selected, "note")} /></label><label className="check"><input name="marketingConsent" type="checkbox" defaultChecked={Boolean(selected.marketing_consent)} />生日優惠資訊</label><label className="check"><input name="reminderConsent" type="checkbox" defaultChecked={Boolean(selected.reminder_consent)} />保養／下次服務提醒</label><button className="button primary">保存客戶資料</button></form>}
      {selected && <section className="panel"><div className="section-title"><h2>服務紀錄</h2><button className="button secondary small" onClick={() => setServiceOpen(!serviceOpen)}>{serviceOpen ? "收合新增服務紀錄" : "新增服務紀錄"}</button></div><div className="service-list">{customerServices.map((item) => <article className="service-item" key={value(item, "id")}><button className="service-summary" onClick={() => setExpanded(expanded === value(item, "id") ? "" : value(item, "id"))}><span>{showTime(value(item, "service_at"))} - {value(item, "service_type")}</span><span>{expanded === value(item, "id") ? "收合" : "展開"}</span></button>{expanded === value(item, "id") && <><form className="service-detail" onSubmit={(event) => void saveService(event, value(item, "id"))}><label>服務<select name="serviceType" defaultValue={value(item, "service_type")}>{serviceTypeOptions(value(item, "service_type")).map((type) => <option key={type}>{type}</option>)}</select></label><ServiceTimeFields serviceAt={value(item, "service_at")} /><label>保養關心日<input name="careAt" type="date" defaultValue={value(item, "care_at")} /></label><label>操作顏色（選填）<input name="operationColor" defaultValue={value(item, "operation_color")} /></label><label>皮膚狀況<select name="skinType" defaultValue={value(item, "skin_type")}>{skinTypes.map((type) => <option key={type} value={type}>{type || "未記錄"}</option>)}</select></label><label>備註<textarea name="note" required defaultValue={value(item, "note")} /></label><button className="button secondary small">保存修改</button></form><ServicePhotoManager serviceId={value(item, "id")} onNotice={say}/></>}</article>)}{!customerServices.length && <p className="muted">尚無服務紀錄。</p>}</div>
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

export function Calendar({ data, refresh, say }: { data: Data; refresh: () => Promise<void>; say: (message: string) => void }) {
  const post = useContext(StudioActionsContext);
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
    const formElement = event.currentTarget; const form = new FormData(formElement);
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

export function Links({ data, refresh, say }: { data: Data; refresh: () => Promise<void>; say: (message: string) => void }) {
  const post = useContext(StudioActionsContext);
  const [created, setCreated] = useState("");
  const create = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); try { const result = await post("createFormLink", { days: form.get("days") }); setCreated(value(result, "url") || location.origin + "/?form=" + value(result.link as Row, "token")); say("已建立一次性表單連結。"); await refresh(); } catch (reason) { say(reason instanceof Error ? reason.message : "建立失敗。"); } };
  const revoke = async (id: string) => { try { await post("revokeFormLink", { id }); say("連結已撤銷。"); await refresh(); } catch (reason) { say(reason instanceof Error ? reason.message : "撤銷失敗。"); } };
  return <div className="two-column"><section className="panel"><p className="eyebrow">ONE-TIME INTAKE</p><h2>產生一次性網址</h2><p className="muted">每份表單皆提供完整合約內容；送出後立即作廢。</p><form className="soft-form" onSubmit={create}><label>有效天數<input name="days" type="number" min="1" max="30" defaultValue={data.settings.default_link_days || "1"} /></label><button className="button primary">產生連結</button></form>{created && <div className="link-card"><code>{created}</code><button className="button secondary" onClick={() => void navigator.clipboard.writeText(created)}>複製網址</button></div>}</section><section className="panel"><p className="eyebrow">RECENT LINKS</p><h2>連結紀錄</h2>{data.links.map((item) => <div className="record" key={value(item, "id")}><strong>{value(item, "service_type") || "綜合表單"} · {value(item, "status") === "active" ? "有效" : value(item, "status") === "used" ? "已使用" : value(item, "status") === "submitting" ? "送出中" : value(item, "status") === "locked" ? "已鎖定" : value(item, "status") === "expired" ? "已到期" : "已撤銷"}</strong><span>到期：{showTime(value(item, "expires_at"))}</span>{value(item, "status") === "active" && <button className="text-button" onClick={() => void revoke(value(item, "id"))}>撤銷連結</button>}</div>)}</section></div>;
}

