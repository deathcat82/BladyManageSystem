import { env } from "cloudflare:workers";
import type { ProductionEnv } from "./security";

export function productionEnv(): ProductionEnv {
  const binding = env as unknown as Partial<ProductionEnv>;
  if (!binding.DB || !binding.SIGNATURES) throw new Error("正式版尚未完成 D1 或 R2 綁定");
  return binding as ProductionEnv;
}