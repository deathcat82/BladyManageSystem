/** Cloudflare Worker entry point. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { securityHeaders, type ProductionEnv } from "../lib/production/security";
import { weeklyBackup } from "../lib/production/storage";
import { getSession } from "../lib/production/session";

interface Env extends ProductionEnv {
  ASSETS: Fetcher;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext { waitUntil(promise: Promise<unknown>): void; passThroughOnException(): void; }
interface ScheduledController { cron: string; scheduledTime: number; noRetry(): void; }

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const formalEnvironment = Boolean(env.APP_ORIGIN);
    if(formalEnvironment && (url.pathname === "/admin" || url.pathname.startsWith("/admin/") || url.pathname === "/developer" || url.pathname.startsWith("/developer/"))){
      const session=await getSession(request,env);
      if(!session || session.kind!=="full"){
        const login=new URL(session?"/login/change-password":"/login",url.origin);
        login.searchParams.set("next",url.pathname.startsWith("/developer")?"/developer":"/admin");
        return securityHeaders(Response.redirect(login.toString(),302));
      }
    }
    const legacyDemoRoute = url.pathname === "/demo"
      || url.pathname.startsWith("/demo/")
      || url.pathname === "/api/studio"
      || url.pathname.startsWith("/api/studio/")
      || url.pathname === "/api/intake"
      || url.pathname.startsWith("/api/intake/");
    if (formalEnvironment && legacyDemoRoute) {
      return securityHeaders(Response.json({ error: "找不到此頁面" }, { status: 404 }));
    }
    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return securityHeaders(await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths));
    }
    return securityHeaders(await handler.fetch(request, env, ctx));
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(env.DB.batch([
      env.DB.prepare("DELETE FROM auth_sessions WHERE expires_at<?").bind(Math.floor(Date.now()/1000)),
      env.DB.prepare("DELETE FROM auth_challenges WHERE expires_at<?").bind(Math.floor(Date.now()/1000)-86400),
      env.DB.prepare("DELETE FROM auth_rate_limits WHERE expires_at<?").bind(Math.floor(Date.now()/1000)),
    ]).catch(()=>undefined));
    ctx.waitUntil(weeklyBackup(env).catch(() => undefined));
  },
};
export default worker;
