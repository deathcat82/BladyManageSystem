import { MAX_PUBLIC_PAYLOAD_BYTES } from "./constants";
import { requireSession } from "./session";

export type ProductionEnv = {
  DB: D1Database;
  SIGNATURES: R2Bucket;
  SERVICE_PHOTOS: R2Bucket;
  OWNER_EMAILS: string;
  DEVELOPER_EMAILS: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_SITE_KEY: string;
  DATA_ENCRYPTION_KEY: string;
  BACKUP_ENCRYPTION_KEY: string;
  APP_ORIGIN: string;
  SMTP_USER: string;
  SMTP_APP_PASSWORD: string;
  AUTH_HMAC_SECRET: string;
};

/** All private production APIs use the same site session/role guard. */
export const verifyAccess = requireSession;

function cookieValue(request: Request, name: string): string | undefined {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1);
}

export function requireAdminWrite(request: Request, env: ProductionEnv): void {
  if (request.method === "GET" || request.method === "HEAD") return;
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") throw new Response("請使用 JSON 格式送出資料", { status: 415 });
  const origin = request.headers.get("origin");
  const csrf = request.headers.get("x-csrf-token");
  if (!origin || origin !== env.APP_ORIGIN || !csrf || csrf !== cookieValue(request, "lulu_csrf")) {
    throw new Response("請求來源驗證失敗", { status: 403 });
  }
}

export function csrfToken(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

export async function jsonBody<T>(request: Request): Promise<T> {
  const size = Number(request.headers.get("content-length") || "0");
  if (size > MAX_PUBLIC_PAYLOAD_BYTES) throw new Response("資料大小超過限制", { status: 413 });
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_PUBLIC_PAYLOAD_BYTES) throw new Response("資料大小超過限制", { status: 413 });
  try { return JSON.parse(body) as T; } catch { throw new Response("JSON 格式錯誤", { status: 400 }); }
}

export function securityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  const nonce = crypto.randomUUID().replaceAll("-", "");
  headers.set("Content-Security-Policy", "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; frame-src https://challenges.cloudflare.com; form-action 'self'; object-src 'none'; img-src 'self' data:; script-src 'self' 'nonce-" + nonce + "' https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline';");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set("Cache-Control", "no-store, private");
  headers.set("X-Content-Type-Options", "nosniff");
  const secured = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  if (!headers.get("content-type")?.includes("text/html")) return secured;
  return new HTMLRewriter().on("script", { element(element) { if (!element.getAttribute("src")) element.setAttribute("nonce", nonce); } }).transform(secured);
}
