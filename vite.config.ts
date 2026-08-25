import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const isStorybook = process.env.STORYBOOK === "true";

export default defineConfig({
  // Icons は STORYBOOK 条件の外。stories もアイコンを描画するため RR のように無効化しない。
  plugins: [
    tailwindcss(),
    Icons({ compiler: "jsx", jsx: "react" }),
    ...(isStorybook ? [] : [reactRouter()]),
    tsconfigPaths(),
  ],
});
