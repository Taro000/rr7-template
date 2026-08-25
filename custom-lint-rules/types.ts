// oxlint/plugins-dev は型を公開しない（RuleTester のみ）。
// そのため、プラグイン作成に使う最小限の型をここで自前定義する。

/** import 宣言ノード（参照する範囲のみ）。 */
export interface ImportNode {
  type: string;
  source: { value: string };
}

/** Program（ファイルルート）ノード（参照する範囲のみ）。 */
export interface ProgramNode {
  type: string;
  body: ReadonlyArray<{ type: string }>;
}

/**
 * CallExpression ノード（参照する範囲のみ）。
 * `describe("…", fn)` / `it.skip("…")` / `it.each(t)("…")` 等のタイトル位置検査で使う。
 * callee は Identifier / MemberExpression / CallExpression のいずれかを取りうる（再帰解決）。
 */
export interface CallExpressionNode {
  type: string;
  callee: unknown;
  arguments: ReadonlyArray<unknown>;
}

/** ルールに渡される context（参照する範囲のみ）。 */
export interface RuleContext {
  getFilename(): string;
  report(diagnostic: { message: string; node?: unknown }): void;
}

/**
 * oxlint カスタムルール（visitor は Program / CallExpression を任意に併用可能）。
 * 既存ルール（Program のみ）も新ルール（CallExpression のみ）も同一インターフェースで宣言できる。
 */
export interface ArchRule {
  create(context: RuleContext): {
    Program?(node: ProgramNode): void;
    CallExpression?(node: CallExpressionNode): void;
  };
}

/**
 * Program の body から import 指定子（`from "..."` の文字列）の一覧を取り出す。
 * @param program - Program ノード
 */
export function importSources(program: ProgramNode): string[] {
  return program.body
    .filter((s): s is ImportNode => s.type === "ImportDeclaration")
    .map((s) => s.source.value);
}
