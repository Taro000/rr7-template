import { importSources } from "./types.ts";
import type { ArchRule, ProgramNode, RuleContext } from "./types.ts";

/**
 * コロケーション違反の `*.spec.*` か判定する。テスト対象を同ディレクトリ（`./`）から import していない
 * `app/` 配下の spec を検出する（テストは対象と同居する規約の近似強制）。
 * @param filename - 判定対象のファイルパス
 * @param sources - その spec が import している指定子の一覧
 */
export function specHasNoColocatedImport(filename: string, sources: string[]): boolean {
  if (!/\.spec\.tsx?$/.test(filename)) return false;
  if (!filename.split("/").includes("app")) return false;
  return !sources.some((s) => s.startsWith("./"));
}

/** `*.spec` が対象を同ディレクトリから import しているか（コロケーション）を強制する oxlint ルール。 */
export const specColocationRule: ArchRule = {
  create(context: RuleContext) {
    return {
      Program(node: ProgramNode) {
        if (specHasNoColocatedImport(context.getFilename(), importSources(node))) {
          context.report({
            message:
              "spec がテスト対象を同ディレクトリ（./）から import していない。対象と同じ場所に置き ./ で import する（コロケーション）。",
            node,
          });
        }
      },
    };
  },
};
