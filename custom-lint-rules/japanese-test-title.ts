// テストタイトル日本語強制ルール（arch/japanese-test-title）。
// 視察対象（callee）・修飾子（.skip/.each 等）・タイトル抽出（Literal/TemplateLiteral）を分離し、
// コア述語を純関数で export することで rules.spec.ts からユニットテスト可能にする。

import type { ArchRule, CallExpressionNode, RuleContext } from "./types.ts";

// 対象 callee。Vitest は `suite` を `describe` のエイリアスとして公開しているため含める。
const TARGET_CALLEE_NAMES = new Set(["describe", "it", "test", "suite"]);

// 日本語＝ひらがな・カタカナ・漢字。`oxlint` の式 AST 越しに 1 文字でも含めば OK と判定する。
const JAPANESE_SCRIPT_REGEX = /[\p{sc=Hiragana}\p{sc=Katakana}\p{sc=Han}]/u;

/**
 * 文字列が日本語（ひらがな・カタカナ・漢字）を 1 文字以上含むか判定する。
 * コード識別子（英数字）との混在は許容する（混在文字列も true）。
 * @param value - 判定対象の文字列
 */
export function containsJapanese(value: string): boolean {
  return JAPANESE_SCRIPT_REGEX.test(value);
}

/**
 * CallExpression の callee を辿り、root の Identifier 名（`describe` / `it` / `test` / `suite` 等）を解決する。
 * `it.skip` / `it.skip.each` 等の MemberExpression チェーン、`it.each(table)(title)` の外側 CallExpression
 * （callee=CallExpression）にも対応するため、object / callee を再帰的に辿る。解決できなければ null。
 * 引数省略時は null を返す（再帰呼び出し中に object/callee が欠落しても安全に止めるための防御）。
 * @param callee - CallExpression.callee（または再帰途中の node）
 */
export function resolveRootCalleeName(callee?: unknown): string | null {
  if (callee === null || callee === undefined || typeof callee !== "object") return null;
  const node = callee as { type: unknown; name?: unknown; object?: unknown; callee?: unknown };
  if (node.type === "Identifier" && typeof node.name === "string") return node.name;
  if (node.type === "MemberExpression") return resolveRootCalleeName(node.object);
  if (node.type === "CallExpression") return resolveRootCalleeName(node.callee);
  return null;
}

/**
 * タイトル位置の AST ノードから、静的に決まる文字列値を抽出する。
 * - string Literal: その値
 * - TemplateLiteral（補間なし＝`expressions` が空）: 静的部分（quasis）を cooked（無ければ raw）で連結
 * - TemplateLiteral（補間あり）: null（動的部分を解析できず、静的部分だけで判定すると偽陽性/陰性が出るため）
 * - その他（変数 Identifier、関数呼び出し、数値 Literal 等）: null（＝ルール側でスキップ）
 * @param node - タイトル位置の AST ノード（`arguments[0]`）
 */
export function extractStaticTitle(node: unknown): string | null {
  if (node === null || typeof node !== "object") return null;
  const n = node as {
    type: unknown;
    value?: unknown;
    quasis?: ReadonlyArray<{ value: { cooked?: unknown; raw?: unknown } }>;
    expressions?: ReadonlyArray<unknown>;
  };
  if (n.type === "Literal" && typeof n.value === "string") return n.value;
  if (n.type === "TemplateLiteral" && Array.isArray(n.quasis)) {
    // `${expr}` を含むテンプレートは動的扱いで skip（静的部分のみで判定すると誤検出が出る）。
    if (Array.isArray(n.expressions) && n.expressions.length > 0) return null;
    return n.quasis
      .map((q) => {
        const cooked = q.value.cooked;
        if (typeof cooked === "string") return cooked;
        const raw = q.value.raw;
        return typeof raw === "string" ? raw : "";
      })
      .join("");
  }
  return null;
}

/**
 * テストタイトル（`describe` / `it` / `test` / `suite` の第 1 引数）に日本語が 1 文字以上
 * 含まれていることを強制する oxlint ルール。`*.spec.{ts,tsx}` のみ有効化する想定
 * （アプリコードの同名 Identifier への誤検出を構造的に避けるため、スコープ判断は config 側に委ねる）。
 */
export const japaneseTestTitleRule: ArchRule = {
  create(context: RuleContext) {
    return {
      CallExpression(node: CallExpressionNode) {
        const root = resolveRootCalleeName(node.callee);
        if (root === null || !TARGET_CALLEE_NAMES.has(root)) return;
        const titleNode = node.arguments[0];
        const title = extractStaticTitle(titleNode);
        // 非リテラル（変数・関数呼び出し等）はスキップ。誤検出を避けるため。
        if (title === null) return;
        if (!containsJapanese(title)) {
          context.report({
            message: `テストタイトル「${title}」に日本語（ひらがな・カタカナ・漢字）を 1 文字以上含める。テストは仕様であり、母語の日本語で書くことで意図が伝わりやすくなる。`,
            node,
          });
        }
      },
    };
  },
};
