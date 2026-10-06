import { value, type Row } from "./studio-panels";

const labels: Record<string, string> = {
  fullName: "姓名", phone: "手機", lineId: "LINE ID", birthday: "生日", referralSource: "得知管道", referralOther: "其他管道",
  serviceItems: "服務項目", healthDisclosure: "健康揭露", healthOther: "健康補充說明", healthConditions: "健康狀況", conditionOther: "健康狀況補充",
  lipConfirmation: "霧唇確認", lipOther: "霧唇補充說明", photoAuthorization: "照片使用授權", birthdayOfferConsent: "生日優惠通知", reminderConsent: "保養關心通知",
};
export default function ConsentRecord({ document }: { document: Row }) {
  const snapshot = document.snapshot as Row;
  const content = snapshot.contractContent as Row | undefined;
  const display = (item: unknown) => typeof item === "boolean" ? item ? "同意" : "不同意" : Array.isArray(item) ? item.join("、") || "—" : String(item ?? "—");
  return <article><h3>同意書版本：{value(document, "contractVersion")}</h3><p>簽署時間：{value(document, "submittedAt")}</p><dl className="client-profile">{Object.entries(labels).filter(([key]) => key in snapshot).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{display(snapshot[key])}</dd></div>)}</dl>{content ? <><h4>當時簽署的服務同意事項</h4><ol>{(content.notices as string[]).map((text, index) => <li key={text}>{text}（{(snapshot.serviceNotices as boolean[])[index] ? "已同意" : "未同意"}）</li>)}</ol><h4>服務確認</h4><ol>{(content.confirmationItems as string[]).map((text, index) => <li key={text}>{text}（{(snapshot.serviceConfirmation as boolean[])[index] ? "已確認" : "未確認"}）</li>)}</ol></> : <><p className="muted">此紀錄沿用原始版本；以下呈現當時保存的確認結果。</p><p>服務同意：{display(snapshot.serviceNotices)}；服務確認：{display(snapshot.serviceConfirmation)}</p></>}<img src={value(document,"signatureDataUrl")} alt="客戶原始簽名" className="consent-signature"/></article>;
}
