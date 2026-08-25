import react from "@vitejs/plugin-react";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // vitest は vite プラグインを継承しないため Icons をミラー（spec が ~icons/* を解決できるように）。
  plugins: [react(), Icons({ compiler: "jsx", jsx: "react" })],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    include: ["app/**/*.{test,spec}.{ts,tsx}", "custom-lint-rules/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "~": new URL("./app/", import.meta.url).pathname,
    },
  },
});
