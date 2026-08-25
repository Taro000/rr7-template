import type { ArchRule, ProgramNode, RuleContext } from "./types.ts";

/**
 * レガシーなテストファイル名か判定する。`.spec` 統一のため `*.test.{ts,tsx}` を検出する。
 * @param filename - 判定対象のファイルパス
 */
export function isLegacyTestFile(filename: string): boolean {
  return /\.test\.tsx?$/.test(filename);
}

/** `*.test.{ts,tsx}` を禁止し `.spec` へ統一させる oxlint ルール。 */
export const noTestFileRule: ArchRule = {
  create(context: RuleContext) {
    return {
      Program(node: ProgramNode) {
        if (isLegacyTestFile(context.getFilename())) {
          context.report({
            message:
              "*.test.{ts,tsx} はテストファイル名に使えない。*.spec.{ts,tsx} にリネームする。",
            node,
          });
        }
      },
    };
  },
};
