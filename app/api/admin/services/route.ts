import { productionEnv } from "@/lib/production/bindings";
import { errorResponse, json, requireString } from "@/lib/production/http";
import { saveService } from "@/lib/production/repository";
import { jsonBody, requireAdminWrite, verifyAccess } from "@/lib/production/security";

type Payload = { id?: string; customerId?: string; serviceAt?: string; serviceType?: string; operationColor?: string; skinType?: string; note?: string; careAt?: string | null };
const skinTypes = new Set(["", "油肌", "乾肌", "油肌乾肌", "敏乾肌", "混合肌", "其他"]);
export async function POST(request: Request) {
  try {
    const env = productionEnv(); const actor = await verifyAccess(request, env, "owner"); requireAdminWrite(request, env);
    const body = await jsonBody<Payload>(request);
    if (!skinTypes.has(body.skinType || "")) throw new Response("皮膚狀況選項不正確", { status: 422 });
    const serviceAt = requireString(body.serviceAt, "服務時間");
    if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):(?:00|15|30|45)(?::\d{2})?(?:[+-]\d\d:\d\d|Z)?$/.test(serviceAt)) throw new Response("服務時間分鐘僅可使用 00、15、30、45", { status: 422 });
    await saveService(env, { id: body.id, customerId: requireString(body.customerId, "客戶"), serviceAt, serviceType: requireString(body.serviceType, "服務項目"), operationColor: body.operationColor || "", skinType: body.skinType || "", note: body.note || "", careAt: body.careAt || null }, actor.email);
    return json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
