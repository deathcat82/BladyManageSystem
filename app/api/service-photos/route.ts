import { env } from "cloudflare:workers";
import { getD1 } from "../../../db";
import { csrfToken, type ProductionEnv, verifyAccess } from "@/lib/production/security";

type Body = Record<string, unknown>;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const stages = new Set(["before", "after", "supplementary"]);
const dataUrl = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function photoEnv(): ProductionEnv { return env as unknown as ProductionEnv; }
function bucket(): R2Bucket {
  const value = (env as unknown as { SERVICE_PHOTOS?: R2Bucket }).SERVICE_PHOTOS;
  if (!value) throw new Response("服務照片儲存尚未設定，請先完成 R2 部署。", { status: 503 });
  return value;
}
function bytes(encoded: string): Uint8Array {
  const binary = atob(encoded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
function cookie(request: Request, name: string): string | undefined {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(name + "="))?.slice(name.length + 1);
}
function requireWrite(request: Request): void {
  const origin = request.headers.get("origin");
  const token = request.headers.get("x-photo-csrf");
  if (origin !== new URL(request.url).origin || !token || token !== cookie(request, "photo_csrf")) throw new Response("照片操作的來源驗證失敗。", { status: 403 });
}
function json(value: unknown, status = 200, csrf?: string): Response {
  const headers = new Headers({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store, private" });
  if (csrf) headers.append("Set-Cookie", "photo_csrf=" + csrf + "; Path=/; Secure; SameSite=Strict; Max-Age=1800");
  return new Response(JSON.stringify(value), { status, headers });
}

export async function GET(request: Request) {
  try {
    await verifyAccess(request, photoEnv(), "owner");
    const serviceId = new URL(request.url).searchParams.get("serviceId")?.trim();
    if (!serviceId) return json({ error: "缺少服務紀錄。" }, 400);
    const rows = await getD1().prepare("SELECT id, service_record_id, stage, content_type, original_name, byte_size, created_at FROM service_photos WHERE service_record_id=? ORDER BY created_at DESC").bind(serviceId).all();
    const csrf = csrfToken();
    return json({ photos: rows.results || [], csrf }, 200, csrf);
  } catch (error) {
    return json({ error: error instanceof Response ? await error.text() : "無法讀取服務照片。" }, error instanceof Response ? error.status : 500);
  }
}

export async function POST(request: Request) {
  try {
    await verifyAccess(request, photoEnv(), "owner");
    requireWrite(request);
    const body = await request.json<Body>();
    const action = text(body.action);
    const db = getD1();

    if (action === "upload") {
      const serviceId = text(body.serviceId);
      const stage = text(body.stage);
      const matched = dataUrl.exec(text(body.dataUrl));
      if (!serviceId || !stages.has(stage)) return json({ error: "請選擇服務紀錄與照片分類。" }, 400);
      if (!matched) return json({ error: "照片僅支援 JPG、PNG 或 WebP。" }, 400);
      const service = await db.prepare("SELECT id, customer_id FROM service_records WHERE id=?").bind(serviceId).first<{ id: string; customer_id: string }>();
      if (!service) return json({ error: "找不到服務紀錄。" }, 404);
      const payload = bytes(matched[2]);
      if (!payload.byteLength || payload.byteLength > MAX_PHOTO_BYTES) return json({ error: "照片壓縮後不可超過 4 MB。" }, 413);

      const photoId = crypto.randomUUID();
      const extension = matched[1] === "image/png" ? "png" : matched[1] === "image/webp" ? "webp" : "jpg";
      const objectKey = "service-photos/" + service.customer_id + "/" + serviceId + "/" + photoId + "." + extension;
      await bucket().put(objectKey, payload, { httpMetadata: { contentType: matched[1], cacheControl: "private, no-store" } });
      try {
        await db.prepare("INSERT INTO service_photos (id, service_record_id, customer_id, stage, object_key, content_type, original_name, byte_size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(photoId, serviceId, service.customer_id, stage, objectKey, matched[1], text(body.originalName).slice(0, 160), payload.byteLength, new Date().toISOString()).run();
      } catch (error) {
        await bucket().delete(objectKey);
        throw error;
      }
      return json({ ok: true, id: photoId });
    }

    if (action === "delete") {
      const photoId = text(body.photoId);
      const photo = await db.prepare("SELECT object_key FROM service_photos WHERE id=?").bind(photoId).first<{ object_key: string }>();
      if (!photo) return json({ error: "找不到服務照片。" }, 404);
      await bucket().delete(photo.object_key);
      await db.prepare("DELETE FROM service_photos WHERE id=?").bind(photoId).run();
      return json({ ok: true });
    }

    return json({ error: "未知照片操作。" }, 400);
  } catch (error) {
    return json({ error: error instanceof Response ? await error.text() : "無法處理服務照片。" }, error instanceof Response ? error.status : 500);
  }
}

