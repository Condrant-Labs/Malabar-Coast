import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    ".agents/**",
    ".claude/**",
    ".codex/**",
    "node_modules/**",
    "next-env.d.ts",
    "studio/**",
  ]),
]);
