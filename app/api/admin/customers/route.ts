import { productionEnv } from "@/lib/production/bindings";
import { errorResponse, json, requireString } from "@/lib/production/http";
import { archiveCustomer, createCustomer, updateCustomer } from "@/lib/production/repository";
import { jsonBody, requireAdminWrite, verifyAccess } from "@/lib/production/security";

type CustomerRequest = { action?: "create" | "update" | "archive" | "restore" | "delete"; id?: string; fullName?: string; phone?: string; lineId?: string; lineUserId?: string; birthday?: string; referralSource?: string; note?: string; marketingConsent?: boolean; reminderConsent?: boolean; confirmation?: string };

export async function GET(request: Request) {
  try {
    const env = productionEnv();
    await verifyAccess(request, env, "owner");
    const keyword = new URL(request.url).searchParams.get("q")?.trim() || "";
    const rows = await env.DB.prepare("SELECT id, full_name, phone, line_id, birthday, referral_source, note, marketing_consent, reminder_consent, archived_at, deletion_review_at, updated_at FROM customers WHERE full_name LIKE ? OR phone LIKE ? OR line_id LIKE ? OR birthday LIKE ? ORDER BY archived_at IS NOT NULL, updated_at DESC LIMIT 200")
      .bind(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`).all();
    return json({ customers: rows.results });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const env = productionEnv();
    const actor = await verifyAccess(request, env, "owner");
    requireAdminWrite(request, env);
    const body = await jsonBody<CustomerRequest>(request);
    if (body.action === "archive" || body.action === "restore") { await archiveCustomer(env, requireString(body.id, "客戶編號"), actor.email, body.action === "restore"); return json({ ok: true }); }
    if (body.action === "create" || body.action === "update") {
      const customer = { fullName: requireString(body.fullName, "姓名"), phone: requireString(body.phone, "電話"), lineId: body.lineId || "", lineUserId: body.lineUserId || "", birthday: requireString(body.birthday, "生日"), referralSource: body.referralSource || "", note: body.note || "", marketingConsent: body.marketingConsent === true, reminderConsent: body.reminderConsent === true };
      if (body.action === "create") return json({ ok: true, id: await createCustomer(env, customer, actor.email) });
      if (body.lineUserId === undefined) {
        const previous = await env.DB.prepare("SELECT line_user_id FROM customers WHERE id=?").bind(requireString(body.id, "客戶編號")).first<{line_user_id:string}>();
        customer.lineUserId = previous?.line_user_id || "";
      }
      await updateCustomer(env, requireString(body.id, "客戶編號"), customer, actor.email);
      return json({ ok: true });
    }
    if (body.action === "delete") {
      const customerId = requireString(body.id, "客戶編號");
      if (body.confirmation !== "永久刪除") throw new Response("請輸入「永久刪除」確認操作", { status: 422 });
      const signatures = await env.DB.prepare("SELECT signature_object_key FROM consent_submissions WHERE customer_id=?").bind(customerId).all<{ signature_object_key: string }>();
      const photos = await env.DB.prepare("SELECT object_key FROM service_photos WHERE customer_id=?").bind(customerId).all<{ object_key:string }>();
      await Promise.all((signatures.results || []).map((row) => env.SIGNATURES.delete(row.signature_object_key)));
      await Promise.all((photos.results || []).map((row) => env.SERVICE_PHOTOS.delete(row.object_key)));
      await env.DB.batch([
        env.DB.prepare("DELETE FROM service_photos WHERE customer_id=?").bind(customerId),
        env.DB.prepare("DELETE FROM notification_outbox WHERE customer_id=?").bind(customerId),
        env.DB.prepare("DELETE FROM notification_preferences WHERE customer_id=?").bind(customerId),
        env.DB.prepare("DELETE FROM consent_submissions WHERE customer_id=?").bind(customerId),
        env.DB.prepare("DELETE FROM service_records WHERE customer_id=?").bind(customerId),
        env.DB.prepare("DELETE FROM appointments WHERE customer_id=?").bind(customerId),
        env.DB.prepare("DELETE FROM customers WHERE id=?").bind(customerId),
      ]);
      await env.DB.prepare("INSERT INTO audit_logs (id, actor_email, action, entity_type, entity_id, changed_fields, created_at) VALUES (?, ?, 'delete', 'customer', ?, '[\"永久刪除\"]', CURRENT_TIMESTAMP)").bind(crypto.randomUUID(), actor.email, customerId).run();
      return json({ ok: true });
    }
    throw new Response("不支援的客戶操作", { status: 400 });
  } catch (error) { return errorResponse(error); }
}
