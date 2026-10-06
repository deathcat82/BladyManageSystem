import { scrypt, randomBytes, createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_SECONDS = 72 * 60 * 60;
export const CODE_SECONDS = 10 * 60;
export function randomToken(): string { return randomBytes(32).toString("hex"); }
export function tokenHash(value: string): string { return createHash("sha256").update(value).digest("hex"); }
export function mac(secret: string, value: string): string { return createHmac("sha256", secret).update(value).digest("hex"); }
export function equal(a: string, b: string): boolean {
  const left=Buffer.from(a), right=Buffer.from(b);
  return left.length===right.length && timingSafeEqual(left,right);
}
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve,reject)=>scrypt(password,salt,32,{N:32768,r:8,p:1,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key)));
}
export async function hashPassword(password: string): Promise<string> {
  const salt=randomBytes(16).toString("hex");
  return `scrypt$32768$8$1$${salt}$${(await derive(password,salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const parts=encoded.split("$");
  if(parts.length!==6 || parts.slice(0,4).join("$")!=="scrypt$32768$8$1" || !/^[a-f0-9]{32}$/.test(parts[4]) || !/^[a-f0-9]{64}$/.test(parts[5]))return false;
  return equal((await derive(password,parts[4])).toString("hex"),parts[5]);
}
export function validateNewPassword(password: unknown): asserts password is string {
  if(typeof password!=="string" || password.length<12 || password.length>128 || /^(.)\1+$/u.test(password) || password==="00000000")throw new Response("新密碼須為 12–128 字元，且不可全部相同。",{status:422});
}
