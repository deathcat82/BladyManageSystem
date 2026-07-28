"use client";

import { FormEvent, PointerEvent, useEffect, useRef, useState } from "react";

type Role = "owner" | "developer";
type LinkItem = { token: string; status: "active" | "used" | "revoked"; expires: string };
type Service = { at: string; title: string; note: string; reminder: string };
type Client = { id: string; name: string; phone: string; line: string; birthday: string; source: string; note: string; services: Service[] };

const sampleClients: Client[] = [
  { id: "c1", name: "林安晴", phone: "0912-345-678", line: "ann.l", birthday: "1995-08-18", source: "Instagram", note: "偏好自然柔霧感，首次服務後建議 6 週追蹤。", services: [{ at: "2026-07-20 14:00", title: "柔霧眉服務", note: "已完成，恢復狀況正常。", reminder: "2027-07-20" }] },
  { id: "c2", name: "陳品妍", phone: "0988-226-009", line: "", birthday: "1991-11-02", source: "親友介紹", note: "下次可提醒補色。", services: [{ at: "2026-06-08 11:30", title: "霧眉補色", note: "色澤穩定。", reminder: "2027-06-08" }] },
];

const consentText = "術前同意書（Demo 示意）\n\n本人已閱讀並理解霧眉服務的效果會因膚況、生活習慣與照護情形而有所差異；我會如實提供資料、遵守術後照護說明，並同意本工作室為預約、服務紀錄與必要聯繫而蒐集及使用本表資料。本人同意以電子文件與手寫簽名方式完成本同意書。";

function SignaturePad({ onSigned }: { onSigned: (value: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const context = canvas.getContext("2d");
    if (context) {
      context.scale(ratio, ratio);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2.1;
      context.strokeStyle = "#352c29";
    }
  }, []);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    drawingRef.current = true;
    canvasRef.current?.setPointerCapture(event.pointerId);
    const p = point(event);
    context.beginPath();
    context.moveTo(p.x, p.y);
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const p = point(event);
    context.lineTo(p.x, p.y);
    context.stroke();
    setHasInk(true);
    onSigned(canvasRef.current?.toDataURL("image/png") || "");
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onSigned("");
  };

  return (
    <div className="signature">
      <canvas ref={canvasRef} onPointerDown={start} onPointerMove={draw} onPointerUp={() => { drawingRef.current = false; }} aria-label="手寫簽名欄" />
      <div><span>{hasInk ? "已完成簽名" : "請以手指、滑鼠或手寫筆簽名"}</span><button type="button" onClick={clear}>清除重簽</button></div>
    </div>
  );
}

function IntakeForm({ onDone }: { onDone: (client: Client) => void }) {
  const [signature, setSignature] = useState("");
  const [notice, setNotice] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!signature) { setNotice("請先完成手寫簽名。"); return; }
    const checks = ["risk", "truth", "privacy", "electronic"];
    if (checks.some((item) => !form.get(item))) { setNotice("請勾選所有必要同意項。"); return; }
    onDone({
      id: "c" + Date.now(),
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      line: String(form.get("line") || ""),
      birthday: String(form.get("birthday") || ""),
      source: String(form.get("source") || ""),
      note: "",
      services: [],
    });
    setNotice("完成送出。此一次性網址已作廢。");
    event.currentTarget.reset();
  };

  return (
    <section className="public-card">
      <p className="eyebrow">PRE-APPOINTMENT FORM</p>
      <h1>術前資料與同意</h1>
      <p className="muted">請在預約前完成填寫。送出後，此連結將立即失效。</p>
      <form onSubmit={submit}>
        <div className="consent">{consentText}</div>
        <label className="check"><input required name="risk" type="checkbox" />我已理解服務可能產生的差異與風險。</label>
        <label className="check"><input required name="truth" type="checkbox" />我保證提供資訊正確，並願意配合術後照護。</label>
        <label className="check"><input required name="privacy" type="checkbox" />我同意工作室依隱私告知蒐集及處理我的資料。</label>
        <label className="check"><input required name="electronic" type="checkbox" />我同意以電子文件及手寫簽名完成本同意書。</label>
        <div className="form-grid">
          <label>姓名<input required name="name" placeholder="請輸入姓名" /></label>
          <label>電話<input required name="phone" inputMode="tel" placeholder="09xx-xxx-xxx" /></label>
          <label>LINE ID（選填）<input name="line" placeholder="方便未來綁定官方帳號" /></label>
          <label>生日<input required name="birthday" type="date" /></label>
          <label>得知管道<select required name="source" defaultValue=""><option value="" disabled>請選擇</option><option>Facebook</option><option>Instagram</option><option>親友介紹</option><option>Google 搜尋</option></select></label>
        </div>
        <label className="check optional"><input name="marketing" type="checkbox" />我願意日後收到生日優惠資訊。</label>
        <label className="check optional"><input name="reminder" type="checkbox" />我願意日後收到下次霧眉提醒。</label>
        <h2>手寫簽名</h2>
        <SignaturePad onSigned={setSignature} />
        {notice && <p className={notice.startsWith("完成") ? "notice success" : "notice error"}>{notice}</p>}
        <button className="button primary" type="submit">確認並送出</button>
      </form>
    </section>
  );
}

function OwnerView({ clients, setClients }: { clients: Client[]; setClients: (value: Client[]) => void }) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [selected, setSelected] = useState<Client | null>(clients[0] || null);
  const [copied, setCopied] = useState("");
  const makeLink = () => {
    const token = Math.random().toString(36).slice(2, 12);
    const link = { token, status: "active" as const, expires: "7 天後到期" };
    setLinks([link, ...links]);
  };
  const copy = async (token: string) => {
    const url = window.location.origin + "/?form=" + token;
    await navigator.clipboard?.writeText(url);
    setCopied(url);
  };
  const addService = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const record = { at: String(form.get("at")), title: String(form.get("title")), note: String(form.get("note")), reminder: String(form.get("reminder")) };
    const updated = clients.map((client) => client.id === selected.id ? { ...client, services: [record, ...client.services] } : client);
    setClients(updated);
    setSelected(updated.find((client) => client.id === selected.id) || null);
    event.currentTarget.reset();
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), clients }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "brow-demo-backup.json"; anchor.click();
    URL.revokeObjectURL(url);
  };

  return <main className="workspace">
    <div className="heading"><div><p className="eyebrow">OWNER CONSOLE</p><h1>今日的客戶照護</h1><p className="muted">建立一次性表單、調閱客戶資料與記錄服務。</p></div><button className="button secondary" onClick={exportJson}>匯出示意備份</button></div>
    <div className="stats"><div><span>客戶資料</span><strong>{clients.length}</strong></div><div><span>有效連結</span><strong>{links.filter((link) => link.status === "active").length}</strong></div><div><span>待設定提醒</span><strong>{clients.filter((client) => !client.services[0]?.reminder).length}</strong></div></div>
    <div className="two-column">
      <section className="panel"><h2>建立一次性網址</h2><p className="muted">網址預設 7 天到期，客戶成功送出後立即作廢。</p><button className="button primary" onClick={makeLink}>產生客戶表單網址</button>
      {links.map((link) => <div className="link-card" key={link.token}><span className="status">有效</span><code>{window.location.origin}/?form={link.token}</code><div><button className="text-button" onClick={() => copy(link.token)}>複製網址</button><button className="text-button" onClick={() => setLinks(links.map((item) => item.token === link.token ? { ...item, status: "revoked" } : item))}>作廢</button></div></div>)}
      {copied && <p className="notice success">已複製：{copied}</p>}</section>
      <section className="panel"><h2>客戶庫</h2><div className="client-list">{clients.map((client) => <button key={client.id} onClick={() => setSelected(client)}><strong>{client.name}</strong><span>{client.phone} · {client.source}</span></button>)}</div></section>
    </div>
    {selected && <section className="panel detail"><p className="eyebrow">CLIENT RECORD</p><h2>{selected.name}</h2><p className="muted">{selected.phone} · {selected.line || "未提供 LINE ID"} · 生日 {selected.birthday}</p><label>一般備註<textarea value={selected.note} onChange={(event) => { const updated = clients.map((client) => client.id === selected.id ? { ...client, note: event.target.value } : client); setClients(updated); setSelected(updated.find((client) => client.id === selected.id) || null); }} /></label>
    <div className="two-column"><div><h3>服務紀錄</h3>{selected.services.length ? selected.services.map((service, index) => <div className="record" key={index}><strong>{service.title}</strong><span>{service.at}</span><p>{service.note}</p><small>下次提醒：{service.reminder || "未設定"}</small></div>) : <p className="muted">尚無服務紀錄</p>}</div>
    <form className="soft-form" onSubmit={addService}><h3>新增服務紀錄</h3><label>服務時間<input required name="at" type="datetime-local" /></label><label>服務項目<input required name="title" defaultValue="柔霧眉服務" /></label><label>服務備註<textarea name="note" /></label><label>下次提醒<input name="reminder" type="date" /></label><button className="button primary">儲存紀錄</button></form></div></section>}
  </main>;
}

function DeveloperView() {
  const [saved, setSaved] = useState(false);
  return <main className="workspace"><div className="heading"><div><p className="eyebrow">DEVELOPER CONSOLE</p><h1>網站設定</h1><p className="muted">此帳號可檢視客戶資料，設定操作會留下稽核紀錄。</p></div></div>
  <form className="panel settings" onSubmit={(event) => { event.preventDefault(); setSaved(true); }}>
    <label>工作室名稱<input defaultValue="柔霧工作室 Demo" /></label>
    <label>預設一次性網址期限<select defaultValue="7"><option value="1">1 天</option><option value="3">3 天</option><option value="7">7 天</option><option value="14">14 天</option></select></label>
    <label>術前同意書版本<textarea defaultValue={consentText} /></label>
    <label>LINE 串接狀態<input readOnly value="尚未串接：未來需使用 LINE 官方帳號 userId 綁定" /></label>
    {saved && <p className="notice success">設定已儲存（Demo 示意）。</p>}<button className="button primary">儲存設定</button>
  </form></main>;
}

export default function Home() {
  const [screen, setScreen] = useState<"home" | "login" | "owner" | "developer" | "public">(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("form") ? "public" : "home",
  );
  const [clients, setClients] = useState<Client[]>(sampleClients);
  const [role, setRole] = useState<Role>("owner");


  const login = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") || "");
    const nextRole: Role = email.toLowerCase().includes("dev") ? "developer" : "owner";
    setRole(nextRole); setScreen(nextRole);
  };
  const publicDone = (client: Client) => { setClients([client, ...clients]); };

  if (screen === "public") return <div className="public-shell"><IntakeForm onDone={publicDone} /><button className="back" onClick={() => setScreen("home")}>回首頁</button></div>;
  if (screen === "login") return <div className="login-shell"><form className="login-card" onSubmit={login}><p className="eyebrow">SECURE ACCESS</p><h1>登入管理端</h1><p className="muted">Demo 依登入信箱切換經營者／開發者畫面；正式版會交由 Firebase Authentication 驗證。</p><label>電子郵件<input required name="email" type="email" placeholder="owner@studio.tw 或 dev@studio.tw" /></label><label>密碼<input required name="password" type="password" minLength={8} placeholder="至少 8 碼" /></label><button className="button primary" type="submit">登入</button><button className="text-button" type="button" onClick={() => setScreen("home")}>返回首頁</button></form></div>;
  if (screen === "owner" || screen === "developer") return <div className="app-shell"><header><button className="brand" onClick={() => setScreen("home")}>柔霧工作室 <small>CLIENT CARE</small></button><nav><span>{role === "owner" ? "經營者" : "開發者"}帳號</span><button className="text-button" onClick={() => setScreen("login")}>登出</button></nav></header>{screen === "owner" ? <OwnerView clients={clients} setClients={setClients} /> : <DeveloperView />}</div>;
  return <main className="landing-shell"><section className="landing-card"><p className="eyebrow">BROW STUDIO · CLIENT CARE</p><h1>每一份安心，<br />都值得被好好記錄。</h1><p className="landing-copy">霧眉客戶建檔、術前同意與服務紀錄管理 Demo。先由經營者建立一次性表單網址，再讓客戶安心完成簽名。</p><div className="landing-actions"><button className="button primary" onClick={() => setScreen("login")}>進入管理端</button><button className="button secondary" onClick={() => setScreen("public")}>查看客戶表單</button></div><div className="landing-trust"><span>一次性連結</span><span>手寫簽名</span><span>加密設計</span></div></section><section className="how-grid"><article><b>01</b><h2>建立表單</h2><p>產生可撤銷、會過期的一次性網址。</p></article><article><b>02</b><h2>客戶填寫</h2><p>手機完成同意、基本資料與簽名。</p></article><article><b>03</b><h2>服務照護</h2><p>累積服務紀錄與下次提醒。</p></article></section></main>;
}