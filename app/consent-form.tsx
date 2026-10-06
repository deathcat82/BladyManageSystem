"use client";
import {FormEvent,useEffect,useState} from "react";
import {value,ageHint,type Row} from "./studio-panels";
import {SignaturePad,CheckGroup} from "./consent-inputs";
import {useTurnstile} from "./use-turnstile";
import {consentServiceItems,lipRelatedServiceItems,notices,healthDisclosures,conditions,lips,photoOptions,confirmationItems} from "@/lib/consent-content";
const changeList=(list:string[],item:string)=>list.includes(item)?list.filter(value=>value!==item):[...list,item];
export default function ConsentForm({ token, home, formal = false }: { token: string; home: () => void; formal?:boolean }) {
  const [ready, setReady] = useState(false), [error, setError] = useState(""), [signature, setSignature] = useState(""), [message, setMessage] = useState(""), [birthday, setBirthday] = useState(""), [studioName, setStudioName] = useState("Lulu Studio紋繡美學");
  const [noticeChecks, setNoticeChecks] = useState<string[]>([]), [disclosureChecks, setDisclosureChecks] = useState<string[]>([]), [conditionChecks, setConditionChecks] = useState<string[]>([]), [lipChecks, setLipChecks] = useState<string[]>([]), [confirmationChecks, setConfirmationChecks] = useState<string[]>([]), [photo, setPhoto] = useState(""), [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [missing, setMissing] = useState<string[]>([]), [disclosureOther, setDisclosureOther] = useState(""), [conditionOther, setConditionOther] = useState(""), [lipOther, setLipOther] = useState(""), [referralOther, setReferralOther] = useState(""), [referralSource, setReferralSource] = useState("");
  const [siteKey,setSiteKey]=useState("");
  const [busy,setBusy]=useState(false);
  const {token:turnstileToken,host:turnstileHost,reset:resetTurnstile}=useTurnstile(siteKey);
  const endpoint=(formal?"/api/public/form/":"/api/intake/")+token;
  useEffect(() => { void fetch(endpoint).then(async (response) => { const result = await response.json() as Row; if (!response.ok || (!formal && !result.active)) setError(value(result, "reason") || value(result, "error") || "此表單無法使用。"); else { setStudioName(value(result, "studioName") || "Lulu Studio紋繡美學"); setSiteKey(value(result,"turnstileSiteKey")); setReady(true); } }).catch(() => setError("無法讀取表單。")); }, [endpoint,formal]);
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
      !signature && "手寫簽名", formal && !turnstileToken && "真人驗證", formal && !form.get("reminderChoice") && "保養提醒意願",
    ].filter(Boolean) as string[];
    if (required.length) { setMissing(required); setMessage(""); return; }
    setMissing([]);
    if(busy)return;
    setBusy(true);
    try {
      const demoPayload = { fullName: form.get("fullName"), phone: form.get("phone"), lineId: form.get("lineId"), birthday: form.get("birthday"), referralSource: form.get("referralSource"), referralOther, marketingChoice: form.get("marketingChoice"), serviceItems: selectedServices, notices: noticeChecks, healthDisclosures: disclosureChecks, healthDisclosureOther: disclosureOther, healthConditions: conditionChecks, healthConditionOther: conditionOther, lipConditions: lipChecks, lipOther, photoAuthorization: photo, confirmations: confirmationChecks, signature };
      const payload=formal?{fullName:demoPayload.fullName,phone:demoPayload.phone,lineId:demoPayload.lineId,birthday:demoPayload.birthday,referralSource:demoPayload.referralSource,referralOther,serviceItems:selectedServices,photoAuthorization:photo,healthDisclosure:disclosureChecks,healthOther:disclosureOther,healthConditions:conditionChecks,conditionOther,lipConfirmation:lipChecks,lipOther,serviceNotices:notices.map(item=>noticeChecks.includes(item)),serviceConfirmation:confirmationItems.map(item=>confirmationChecks.includes(item)),signatureDataUrl:signature,turnstileToken,birthdayOfferConsent:form.get("marketingChoice")==="yes",reminderConsent:form.get("reminderChoice")==="yes"}:demoPayload;
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as Row; if (!response.ok) throw new Error(value(result, "error")); setMessage("已送出並保存，謝謝您。此連結現在已失效。");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "送出失敗，請稍後重試。"); if(formal)resetTurnstile(); } finally { setBusy(false); }
  };
  const requiresLipConfirmation = selectedServices.some((item) => lipRelatedServiceItems.includes(item));
  return <div className="public-shell"><section className="public-card"><p className="eyebrow">{studioName}</p><h1>服務知情同意書</h1>{formal && <p><a href="/admin">工作室授權調閱歷史紀錄</a></p>}<p className="muted">請依自身服務項目與健康狀況完成所有合約內容。</p><form noValidate onSubmit={submit}>{missing.length > 0 && <div className="validation-summary" role="alert"><strong>尚有項目未完成：</strong><ul>{missing.map((item) => <li key={item}>{item}</li>)}</ul></div>}
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
    <fieldset className="consent-choice"><legend>生日優惠資訊 <em>＊</em></legend><label><input name="marketingChoice" type="radio" value="yes" />同意接收</label><label><input name="marketingChoice" type="radio" value="no" />不同意接收</label></fieldset>{formal && <fieldset className="consent-choice"><legend>保養提醒意願 <em>＊</em></legend><label><input name="reminderChoice" type="radio" value="yes"/>同意接收</label><label><input name="reminderChoice" type="radio" value="no"/>不同意接收</label></fieldset>}<h2>手寫簽名 <em>＊</em></h2><SignaturePad onChange={setSignature} />{formal && <><div ref={turnstileHost}/>{!siteKey && <p className="notice error">真人驗證尚未設定，請聯絡工作室。</p>}</>}{message && <p className={message.startsWith("已送出") ? "notice success" : "notice error"}>{message}</p>}{!message.startsWith("已送出") && <button className="button primary" disabled={busy}>{busy?"正在送出…":"確認並送出表單"}</button>}
  </form></section></div>;
}

