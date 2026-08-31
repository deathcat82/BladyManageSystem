import { readFile, writeFile } from "node:fs/promises";

const source = JSON.parse(await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
const output = new URL("../dist/server/wrangler.json", import.meta.url);
const generated = JSON.parse(await readFile(output, "utf8"));

generated.r2_buckets = source.r2_buckets || [];
await writeFile(output, JSON.stringify(generated, null, 2) + "\n", "utf8");

