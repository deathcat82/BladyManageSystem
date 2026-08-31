import { MAX_PUBLIC_PAYLOAD_BYTES } from "./constants";

export type ProductionEnv = {
  DB: D1Database;
  SIGNATURES: R2Bucket;
  OWNER_EMAILS: string;
  DEVELOPER_EMAILS: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_SITE_KEY: string;
  DATA_ENCRYPTION_KEY: string;
  BACKUP_ENCRYPTION_KEY: string;
  APP_ORIGIN: string;
};

type AccessClaims = { email?: string; aud?: string | string[]; exp?: number; nbf?: number; iss?: string };
type AccessRole = "owner" | "developer";

function b64urlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function parseJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(value))) as T;
}

function safeEmails(value: string): Set<string> {
  return new Set(value.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

let certificateCache: { until: number; keys: JsonWebKey[] } | undefined;

async function accessCertificates(teamDomain: string): Promise<JsonWebKey[]> {
  if (certificateCache && certificateCache.until > Date.now()) return certificateCache.keys;
  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error("無法取得 Access 驗證憑證");
  const data = await response.json() as { keys?: JsonWebKey[] };
  if (!data.keys?.length) throw new Error("Access 驗證憑證格式錯誤");
  certificateCache = { keys: data.keys, until: Date.now() + 60 * 60 * 1000 };
  return data.keys;
}

export async function verifyAccess(request: Request, env: ProductionEnv, required: AccessRole): Promise<{ email: string; role: AccessRole }> {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) throw new Response("需要 Cloudflare Access 驗證", { status: 401 });
  const [encodedHeader, encodedPayload, encodedSignature, ...extra] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature || extra.length) throw new Response("Access Token 格式錯誤", { status: 401 });
  let header: { alg?: string; kid?: string };
  let claims: AccessClaims;
  try { header = parseJson(encodedHeader); claims = parseJson(encodedPayload); } catch { throw new Response("Access Token 無法解析", { status: 401 }); }
  if (header.alg !== "RS256" || !header.kid) throw new Response("Access Token 演算法不符", { status: 401 });
  const key = (await accessCertificates(env.ACCESS_TEAM_DOMAIN)).find((item) => item.kid === header.kid);
  if (!key) throw new Response("Access Token 金鑰已失效", { status: 401 });
  const cryptoKey = await crypto.subtle.importKey("jwk", key, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const signature = b64urlToBytes(encodedSignature);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, signature, new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`));
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  const now = Math.floor(Date.now() / 1000);
  if (!valid || !claims.email || !audience.includes(env.ACCESS_AUD) || !claims.exp || claims.exp <= now || (claims.nbf && claims.nbf > now) || claims.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) {
    throw new Response("Access Token 驗證失敗", { status: 401 });
  }
  const email = claims.email.toLowerCase();
  const developer = safeEmails(env.DEVELOPER_EMAILS).has(email);
  const owner = safeEmails(env.OWNER_EMAILS).has(email);
  if ((required === "developer" && !developer) || (required === "owner" && !(owner || developer))) throw new Response("沒有此頁面權限", { status: 403 });
  return { email, role: developer ? "developer" : "owner" };
}

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
  headers.set("Content-Security-Policy", "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; img-src 'self' data:; script-src 'self' 'nonce-" + nonce + "' https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline';");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set("Cache-Control", "no-store, private");
  headers.set("X-Content-Type-Options", "nosniff");
  const secured = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  if (!headers.get("content-type")?.includes("text/html")) return secured;
  return new HTMLRewriter().on("script", { element(element) { if (!element.getAttribute("src")) element.setAttribute("nonce", nonce); } }).transform(secured);
}
