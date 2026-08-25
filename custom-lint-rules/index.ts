import { japaneseTestTitleRule } from "./japanese-test-title.ts";
import { maxNestingDepthRule } from "./max-nesting-depth.ts";
import { noExternalImportOutsideLibRule } from "./no-external-import-outside-lib.ts";
import { noTestFileRule } from "./no-test-file.ts";
import { specColocationRule } from "./spec-colocation.ts";

// アーキテクチャ境界のうち、AST/ファイル名が必要なルールを束ねる oxlint プラグイン。
// import 境界（依存方向・RR 制限・features/routes 相互 import 禁止）は oxlint.config.ts の
// overrides + no-restricted-imports 側で強制する（alpha な jsPlugins への依存面を最小化するため）。
const plugin = {
  meta: { name: "arch" },
  rules: {
    "no-test-file": noTestFileRule,
    "no-external-import-outside-lib": noExternalImportOutsideLibRule,
    "max-nesting-depth": maxNestingDepthRule,
    "spec-colocation": specColocationRule,
    "japanese-test-title": japaneseTestTitleRule,
  },
};

export default plugin;
