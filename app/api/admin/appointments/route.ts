import { productionEnv } from "@/lib/production/bindings";
import { errorResponse, json, requireString } from "@/lib/production/http";
import { saveAppointment } from "@/lib/production/repository";
import { jsonBody, requireAdminWrite, verifyAccess } from "@/lib/production/security";

type Payload = { id?: string; customerId?: string; serviceType?: string; startsAt?: string; durationMinutes?: number; status?: string; note?: string };
export async function POST(request: Request) {
  try {
    const env = productionEnv(); const actor = await verifyAccess(request, env, "owner"); requireAdminWrite(request, env);
    const body = await jsonBody<Payload>(request);
    const minutes = Number(body.durationMinutes || 120);
    if (!Number.isInteger(minutes) || minutes < 15 || minutes > 480) throw new Response("服務時長需介於 15 至 480 分鐘", { status: 422 });
    if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):(?:00|15|30|45)(?::\d{2})?(?:[+-]\d\d:\d\d|Z)?$/.test(requireString(body.startsAt, "預約時間"))) throw new Response("預約分鐘僅可使用 00、15、30、45", { status: 422 });
    await saveAppointment(env, { id: body.id, customerId: requireString(body.customerId, "客戶"), serviceType: requireString(body.serviceType, "服務項目"), startsAt: body.startsAt!, durationMinutes: minutes, status: body.status || "scheduled", note: body.note || "" }, actor.email);
    return json({ ok: true });
  } catch (error) { return errorResponse(error); }
}