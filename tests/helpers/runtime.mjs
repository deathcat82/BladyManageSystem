import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";

export async function bundled(path) {
  const result=await build({entryPoints:[path],bundle:true,write:false,platform:"node",format:"esm",plugins:[{name:"cloudflare-test-binding",setup(builder){builder.onResolve({filter:/^cloudflare:workers$/},()=>({path:"binding",namespace:"test"}));builder.onLoad({filter:/.*/,namespace:"test"},()=>({contents:"export const env = globalThis.__cloudflareTestEnv;"}));}}]});
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}
export async function database(upgrade=true) {
  const sqlite=new DatabaseSync(":memory:");
  sqlite.exec(await readFile("drizzle-production/0000_production_schema.sql","utf8"));
  if(upgrade) { sqlite.exec("BEGIN");sqlite.exec(await readFile("drizzle-production/0001_demo_parity.sql","utf8"));sqlite.exec("COMMIT"); }
  const db={sqlite,prepare(sql){const statement={args:[],bind(...args){this.args=args;return this;},async run(){const result=sqlite.prepare(sql).run(...this.args);return {success:true,meta:{changes:Number(result.changes)}};},async first(column){const row=sqlite.prepare(sql).get(...this.args);return row?(column?row[column]:row):null;},async all(){return {success:true,results:sqlite.prepare(sql).all(...this.args)};}};return statement;},async batch(statements){sqlite.exec("BEGIN");try{const result=[];for(const statement of statements)result.push(await statement.run());sqlite.exec("COMMIT");return result;}catch(error){sqlite.exec("ROLLBACK");throw error;}}};
  return db;
}
export function bucket() {
  const objects=new Map();
  return {objects,async put(key,value,options){objects.set(key,{value:typeof value==="string"?new TextEncoder().encode(value):new Uint8Array(value),options});},async delete(key){objects.delete(key);},async get(key){const object=objects.get(key);if(!object)return null;return {body:object.value,async arrayBuffer(){return object.value.buffer;},writeHttpMetadata(headers){for(const [name,value] of Object.entries(object.options?.httpMetadata||{}))if(name==="contentType")headers.set("content-type",value);}};}};
}
