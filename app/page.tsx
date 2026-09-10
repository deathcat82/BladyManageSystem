import { env } from "cloudflare:workers";
import LuluDemo from "./lulu-demo";
import ProductionHome from "./production-home";

export default function HomePage() {
  const formalEnvironment = env as unknown as { APP_ORIGIN?: string };
  return formalEnvironment.APP_ORIGIN ? <ProductionHome /> : <LuluDemo />;
}
