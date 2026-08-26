import { productionEnv } from "@/lib/production/bindings";
import { errorResponse, json } from "@/lib/production/http";
import { csrfToken, verifyAccess } from "@/lib/production/security";

export async function GET(request: Request) {
  try {
    const env = productionEnv();
    const actor = await verifyAccess(request, env, "owner");
    const [customers, appointments, services, settings, consentLinks] = await Promise.all([
      env.DB.prepare("SELECT id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, archived_at, deletion_review_at, updated_at FROM customers ORDER BY archived_at IS NOT NULL, updated_at DESC LIMIT 200").all(),
      env.DB.prepare("SELECT a.*, c.full_name AS customer_name FROM appointments a JOIN customers c ON c.id=a.customer_id ORDER BY a.starts_at ASC LIMIT 300").all(),
      env.DB.prepare("SELECT s.*, c.full_name AS customer_name FROM service_records s JOIN customers c ON c.id=s.customer_id ORDER BY s.service_at DESC LIMIT 300").all(),
      env.DB.prepare("SELECT key, value FROM app_settings").all<{ key: string; value: string }>(),
      env.DB.prepare("SELECT id, status, expires_at, used_at, created_at FROM form_links ORDER BY created_at DESC LIMIT 50").all(),
    ]);
    const csrf = csrfToken();
    const response = json({ actor, csrf, customers: customers.results, appointments: appointments.results, services: services.results, settings: Object.fromEntries((settings.results || []).map((row) => [row.key, row.value])), formLinks: consentLinks.results });
    response.headers.append("Set-Cookie", `lulu_csrf=${csrf}; Path=/; Secure; SameSite=Strict; Max-Age=28800`);
    return response;
  } catch (error) { return errorResponse(error); }
}