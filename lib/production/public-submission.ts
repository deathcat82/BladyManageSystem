import { CONTRACT_VERSION, DEFAULT_RETENTION_YEARS } from "./constants";
import { contractContent, type FormPayload } from "./consent";
import type { ProductionEnv } from "./security";
import { encryptText, putSignature } from "./storage";
import { normalizePhone, taipeiNow } from "./validation";

export async function savePublicSubmission(env:ProductionEnv, linkId:string, payload:FormPayload):Promise<void> {
  const duplicate=await env.DB.prepare("SELECT id FROM customers WHERE normalized_phone=?").bind(normalizePhone(payload.phone!)).first();
  if(duplicate)throw new Response("此手機號碼已存在，請聯絡工作室協助處理。",{status:409});
  const customerId=crypto.randomUUID(), consentId=crypto.randomUUID(), now=taipeiNow();
  const years=Number((await env.DB.prepare("SELECT value FROM app_settings WHERE key='retention_years'").first<{value:string}>())?.value||DEFAULT_RETENTION_YEARS);
  const review=new Date(now);review.setUTCFullYear(review.getUTCFullYear()+years);
  const snapshot=await encryptText(env.DATA_ENCRYPTION_KEY,JSON.stringify({...payload,signatureDataUrl:undefined,turnstileToken:undefined,contractContent,submittedAt:now,contractVersion:CONTRACT_VERSION}));
  const signature=await putSignature(env,consentId,payload.signatureDataUrl!);
  try {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO customers(id,full_name,phone,normalized_phone,line_id,birthday,referral_source,marketing_consent,reminder_consent,deletion_review_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").bind(customerId,payload.fullName!.trim(),payload.phone!.trim(),normalizePhone(payload.phone!),payload.lineId!.trim(),payload.birthday!,payload.referralSource==="其他"?`其他：${payload.referralOther}`:payload.referralSource!,payload.birthdayOfferConsent?1:0,payload.reminderConsent?1:0,review.toISOString(),now,now),
      env.DB.prepare("INSERT INTO notification_preferences(customer_id,birthday_offer_opt_in,care_reminder_opt_in,updated_at) VALUES (?,?,?,?)").bind(customerId,payload.birthdayOfferConsent?1:0,payload.reminderConsent?1:0,now),
      env.DB.prepare("INSERT INTO consent_submissions(id,link_id,customer_id,contract_version,snapshot_ciphertext,snapshot_iv,signature_object_key,signature_sha256,submitted_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(consentId,linkId,customerId,CONTRACT_VERSION,snapshot.ciphertext,snapshot.iv,signature.objectKey,signature.sha256,now),
      env.DB.prepare("UPDATE form_links SET status='used',used_at=? WHERE id=? AND status='submitting'").bind(now,linkId),
      env.DB.prepare("INSERT INTO audit_logs(id,actor_email,action,entity_type,entity_id,changed_fields,created_at) VALUES (?,'public-form','create','consent',?,'[\"同意書\"]',?)").bind(crypto.randomUUID(),consentId,now),
    ]);
  } catch(error) {
    await env.SIGNATURES.delete(signature.objectKey);
    if(error instanceof Error&&/UNIQUE.*customers.normalized_phone/.test(error.message))throw new Response("此手機號碼已存在，請聯絡工作室協助處理。",{status:409});
    throw error;
  }
}
