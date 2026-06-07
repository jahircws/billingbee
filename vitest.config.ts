import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["app/actions/**", "lib/**"],
      exclude: ["lib/db.ts", "lib/generated/**", "lib/email.ts", "lib/crypto.ts"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      // next-auth imports "next/server" without .js — remap to the real ESM file
      "next/server": resolve(__dirname, "node_modules/next/dist/server/web/exports/index.js"),
      "next/headers": resolve(__dirname, "node_modules/next/dist/server/web/exports/index.js"),
    },
  },
})
