import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 100,
  singleQuote: false,
  trailingComma: "all",
  arrowParens: "always",
  ignorePatterns: [
    "build",
    "dist",
    ".react-router",
    "storybook-static",
    "coverage",
    "node_modules",
    "package-lock.json",
  ],
});
