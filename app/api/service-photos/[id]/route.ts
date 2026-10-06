import { env } from "cloudflare:workers";
import { getD1 } from "../../../../db";
import { type ProductionEnv, verifyAccess } from "@/lib/production/security";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await verifyAccess(_request, env as unknown as ProductionEnv, "owner");
    const { id } = await context.params;
    const photo = await getD1().prepare("SELECT object_key, content_type, original_name FROM service_photos WHERE id=?").bind(id).first<{ object_key: string; content_type: string; original_name: string }>();
    if (!photo) return new Response("找不到服務照片。", { status: 404, headers: { "cache-control": "no-store, private" } });
    const bucket = (env as unknown as { SERVICE_PHOTOS?: R2Bucket }).SERVICE_PHOTOS;
    if (!bucket) return new Response("服務照片儲存尚未設定。", { status: 503, headers: { "cache-control": "no-store, private" } });
    const object = await bucket.get(photo.object_key);
    if (!object) return new Response("照片檔案不存在。", { status: 404, headers: { "cache-control": "no-store, private" } });
    const headers = new Headers({ "content-type": photo.content_type, "cache-control": "no-store, private", "content-disposition": "inline; filename=\"" + (photo.original_name || "service-photo") + "\"" });
    object.writeHttpMetadata(headers);
    return new Response(object.body, { headers });
  } catch (error) {
    return new Response(error instanceof Response ? await error.text() : "無法讀取服務照片。", { status: error instanceof Response ? error.status : 500, headers: { "cache-control": "no-store, private" } });
  }
}

