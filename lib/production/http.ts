import { securityHeaders } from "./security";

export function json(data: unknown, init?: ResponseInit): Response {
  return securityHeaders(new Response(JSON.stringify(data), { ...init, headers: { "content-type": "application/json; charset=utf-8", ...(init?.headers || {}) } }));
}

export async function errorResponse(error: unknown): Promise<Response> {
  if (error instanceof Response) return json({ error: await error.text() }, { status: error.status });
  return json({ error: "系統暫時無法處理，請稍後再試。" }, { status: 500 });
}

export function requireString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Response(`請填寫${name}`, { status: 422 });
  return value.trim();
}
