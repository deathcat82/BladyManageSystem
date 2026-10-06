import { notices, confirmationItems, consentServiceItems, lipRelatedServiceItems, healthDisclosures, conditions, lips, photoOptions } from "../consent-content";
import { ageOn, normalizePhone } from "./validation";

export type FormPayload = {
  fullName?: string; phone?: string; lineId?: string; birthday?: string; referralSource?: string; referralOther?: string;
  serviceItems?: string[]; photoAuthorization?: string; signatureDataUrl?: string; turnstileToken?: string;
  healthDisclosure?: string[]; healthOther?: string; healthConditions?: string[]; conditionOther?: string; lipConfirmation?: string[]; lipOther?: string;
  serviceNotices?: boolean[]; serviceConfirmation?: boolean[]; birthdayOfferConsent?: boolean; reminderConsent?: boolean;
};
const required = (value:unknown, title:string) => { if(typeof value!=="string"||!value.trim())throw new Response(`請填寫${title}`,{status:422}); return value.trim(); };
function choices(value:unknown, allowed:string[], other:unknown, title:string, optional=false) {
  if(!Array.isArray(value)||(!optional&&!value.length)||value.some(item=>typeof item!=="string"||!allowed.includes(item))||new Set(value).size!==value.length)throw new Response(`請完整填寫${title}`,{status:422});
  if(value.includes("以上皆非")&&value.length>1)throw new Response(`${title}的「以上皆非」不可與其他項目並選`,{status:422});
  if(value.includes("其他"))required(other,`${title}其他說明`);
}
export function validateConsent(payload:FormPayload) {
  if(!payload||typeof payload!=="object"||Array.isArray(payload))throw new Response("表單資料格式不正確",{status:422});
  required(payload.fullName,"姓名"); required(payload.lineId,"LINE ID");
  if(normalizePhone(required(payload.phone,"手機號碼")).length<8)throw new Response("請填寫有效手機號碼",{status:422});
  if(ageOn(required(payload.birthday,"生日"))===null)throw new Response("生日格式不正確",{status:422});
  const source=required(payload.referralSource,"得知管道");if(source==="其他")required(payload.referralOther,"其他得知管道");
  choices(payload.serviceItems,consentServiceItems,undefined,"服務項目");
  if(!photoOptions.includes(required(payload.photoAuthorization,"照片使用授權")))throw new Response("照片授權選項不正確",{status:422});
  required(payload.signatureDataUrl,"手寫簽名");
  for(const [items,count] of [[payload.serviceNotices,notices.length],[payload.serviceConfirmation,confirmationItems.length]] as const)if(!Array.isArray(items)||items.length!==count||items.some(item=>item!==true))throw new Response("請勾選所有服務同意與確認事項",{status:422});
  choices(payload.healthDisclosure,healthDisclosures,payload.healthOther,"健康揭露");
  choices(payload.healthConditions,conditions,payload.conditionOther,"健康狀況");
  choices(payload.lipConfirmation,lips,payload.lipOther,"霧唇確認",!payload.serviceItems!.some(item=>lipRelatedServiceItems.includes(item)));
  if(typeof payload.birthdayOfferConsent!=="boolean"||typeof payload.reminderConsent!=="boolean")throw new Response("請選擇通知同意意願",{status:422});
}
export const contractContent = { notices, confirmationItems, consentServiceItems, healthDisclosures, conditions, lips, photoOptions };
