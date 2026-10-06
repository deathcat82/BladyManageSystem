import { MAX_SIGNATURE_BYTES } from "./constants";
import type { ProductionEnv } from "./security";

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function sha256(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function aesKey(secret: string): Promise<CryptoKey> {
  const material = base64ToBytes(secret);
  if (material.byteLength !== 32) throw new Error("加密金鑰必須是 32 bytes 的 Base64 值");
  return crypto.subtle.importKey("raw", material, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptText(secret: string, plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(secret), new TextEncoder().encode(plaintext));
  return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) };
}

export async function decryptText(secret: string, ciphertext: string, iv: string): Promise<string> {
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv) }, await aesKey(secret), base64ToBytes(ciphertext));
  return new TextDecoder().decode(plain);
}

export async function putSignature(env: ProductionEnv, consentId: string, dataUrl: string): Promise<{ objectKey: string; sha256: string }> {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Response("簽名必須為 PNG 格式", { status: 422 });
  const bytes = base64ToBytes(match[1]);
  if (!bytes.byteLength || bytes.byteLength > MAX_SIGNATURE_BYTES) throw new Response("簽名檔案大小不符合限制", { status: 413 });
  const objectKey = `consents/${consentId}/signature.png`;
  await env.SIGNATURES.put(objectKey, bytes, { httpMetadata: { contentType: "image/png", cacheControl: "private, no-store" } });
  return { objectKey, sha256: await sha256(bytes) };
}

export async function weeklyBackup(env: ProductionEnv): Promise<{ objectKey: string; sha256: string }> {
  const tables = ["customers", "appointments", "service_records", "service_photos", "form_links", "consent_submissions", "notification_preferences", "notification_outbox", "audit_logs", "app_settings", "auth_accounts"];
  const backup: Record<string, unknown> = { version: 1, createdAt: new Date().toISOString(), tables: {} };
  for (const table of tables) {
    const rows = await env.DB.prepare(`SELECT * FROM ${table}`).all();
    (backup.tables as Record<string, unknown>)[table] = rows.results;
  }
  const encrypted = await encryptText(env.BACKUP_ENCRYPTION_KEY, JSON.stringify(backup));
  const body = JSON.stringify({ algorithm: "AES-256-GCM", ...encrypted });
  const payload = new TextEncoder().encode(body);
  const objectKey = `backups/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.json.enc`;
  await env.SIGNATURES.put(objectKey, payload, { httpMetadata: { contentType: "application/json", cacheControl: "private, no-store" } });
  const checksum = await sha256(payload);
  await env.DB.prepare("INSERT INTO backup_runs (id, object_key, sha256, created_at, created_by) VALUES (?, ?, ?, ?, 'scheduled')")
    .bind(crypto.randomUUID(), objectKey, checksum, new Date().toISOString()).run();
  return { objectKey, sha256: checksum };
}
