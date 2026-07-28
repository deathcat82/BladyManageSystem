import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);
const previewRoot = new URL("../app/_sites-preview/", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", String(Date.now()));
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the brow studio management landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>柔霧工作室｜客戶預約與同意管理<\/title>/);
  assert.match(html, /霧眉客戶建檔、術前同意與服務紀錄管理 Demo/);
  assert.match(html, /一次性連結/);
  assert.match(html, /進入管理端/);
  assert.match(html, /查看客戶表單/);
  assert.doesNotMatch(html, /react-loading-skeleton/i);
});

test("keeps consent, D1 schema, and platform bindings in the project", async () => {
  const [page, layout, css, schema, hosting, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /function SignaturePad/);
  assert.match(page, /const consentText/);
  assert.match(page, /建立一次性網址/);
  assert.match(page, /服務時間/);
  assert.match(layout, /lang="zh-Hant-TW"/);
  assert.match(css, /\.signature canvas/);
  assert.match(css, /@media \(max-width:760px\)/);
  assert.match(schema, /export const formLinks/);
  assert.match(schema, /export const consentSubmissions/);
  assert.match(schema, /export const serviceRecords/);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(hosting, /"r2": "SIGNATURES"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(access(previewRoot));
  await assert.rejects(access(new URL("public/_sites-preview", templateRoot)));
});
