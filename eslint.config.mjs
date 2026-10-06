import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "outputs/**",
    ".wrangler/**",
    "worker-configuration.d.ts",
    "next-env.d.ts",
  ]),
  {
    files: ["app/service-photo-manager.tsx", "app/consent-record.tsx"],
    rules: {
      // Private R2 images require an authenticated same-origin API request and
      // cannot be passed to the public Next image optimization pipeline.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
