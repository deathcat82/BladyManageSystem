import { defineConfig } from "drizzle-kit";
export default defineConfig({ out: "./drizzle-production", schema: "./db/production-schema.ts", dialect: "sqlite" });