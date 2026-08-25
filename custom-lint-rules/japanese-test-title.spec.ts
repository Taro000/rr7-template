import { describe, expect, it } from "vitest";

import {
  containsJapanese,
  extractStaticTitle,
  japaneseTestTitleRule,
  resolveRootCalleeName,
} from "./japanese-test-title";

// AST literal を組み立てる小ヘルパー（純関数テストの読みやすさを優先しつつ describe 行数を抑える）。
const id = (name: string) => ({ type: "Identifier", name });
const member = (object: unknown, prop: string) => ({
  type: "MemberExpression",
  object,
  property: id(prop),
});
const call = (callee: unknown) => ({ type: "CallExpression", callee });

describe("containsJapanese（日本語含有判定）", () => {
  it("ひらがな・カタカナ・漢字を 1 文字でも含めば true", () => {
    expect(containsJapanese("あ")).toBe(true);
    expect(containsJapanese("カナ")).toBe(true);
    expect(containsJapanese("漢字テスト")).toBe(true);
    expect(containsJapanese("renders 初期値")).toBe(true);
  });

  it("英語のみ・空文字・記号のみは false", () => {
    expect(containsJapanese("renders the initial value")).toBe(false);
    expect(containsJapanese("")).toBe(false);
    expect(containsJapanese("!@#$%")).toBe(false);
    expect(containsJapanese("123")).toBe(false);
  });
});

describe("resolveRootCalleeName（callee の root Identifier 名を解決）", () => {
  it("Identifier 直接 → name を返す", () => {
    expect(resolveRootCalleeName(id("describe"))).toBe("describe");
    expect(resolveRootCalleeName(id("it"))).toBe("it");
  });

  it("MemberExpression（it.skip）→ object を辿って root へ", () => {
    expect(resolveRootCalleeName(member(id("it"), "skip"))).toBe("it");
  });

  it("チェーン（it.skip.each）→ 再帰的に root へ", () => {
    expect(resolveRootCalleeName(member(member(id("it"), "skip"), "each"))).toBe("it");
  });

  it("it.each(table)(title) の外側 CallExpression → callee を辿って it へ", () => {
    // 外側 callee は CallExpression（内側 it.each(table)）。CallExpression 経由でも root まで辿れる。
    expect(resolveRootCalleeName(call(member(id("it"), "each")))).toBe("it");
  });
});

describe("resolveRootCalleeName（解決できないケース）", () => {
  it("非対応 type / null / 引数省略は null", () => {
    expect(resolveRootCalleeName({ type: "Literal", value: "x" })).toBeNull();
    expect(resolveRootCalleeName(null)).toBeNull();
    expect(resolveRootCalleeName()).toBeNull();
    expect(resolveRootCalleeName({ type: "ChainExpression" })).toBeNull();
  });
});

describe("extractStaticTitle（静的タイトル抽出）", () => {
  it("string Literal はその値を返す", () => {
    expect(extractStaticTitle({ type: "Literal", value: "初期値を表示する" })).toBe(
      "初期値を表示する",
    );
    expect(extractStaticTitle({ type: "Literal", value: "" })).toBe("");
  });

  it("補間なしの TemplateLiteral は静的部分を返す", () => {
    expect(
      extractStaticTitle({
        type: "TemplateLiteral",
        quasis: [{ value: { cooked: "日本語タイトル", raw: "日本語タイトル" } }],
        expressions: [],
      }),
    ).toBe("日本語タイトル");
  });

  it("補間あり（`${expr}` を含む）の TemplateLiteral は null（動的扱いで skip）", () => {
    expect(
      extractStaticTitle({
        type: "TemplateLiteral",
        quasis: [{ value: { cooked: "前", raw: "前" } }, { value: { cooked: "後", raw: "後" } }],
        expressions: [{ type: "Identifier", name: "x" }],
      }),
    ).toBeNull();
  });

  it("cooked が無ければ raw にフォールバックする", () => {
    expect(
      extractStaticTitle({
        type: "TemplateLiteral",
        quasis: [{ value: { raw: "あ" } }],
        expressions: [],
      }),
    ).toBe("あ");
  });

  it("非リテラル（Identifier / CallExpression / 数値 Literal）は null", () => {
    expect(extractStaticTitle({ type: "Identifier", name: "title" })).toBeNull();
    expect(extractStaticTitle({ type: "CallExpression", callee: {}, arguments: [] })).toBeNull();
    expect(extractStaticTitle({ type: "Literal", value: 42 })).toBeNull();
    expect(extractStaticTitle(null)).toBeNull();
  });
});

// visitor 統合: ルール本体（japaneseTestTitleRule.create().CallExpression）に
// 偽の RuleContext を渡し、report の発火条件を端から検証する。
const litTitle = (value: string) => ({ type: "Literal", value });
const tmplTitle = (statics: string[], hasExpr: boolean) => ({
  type: "TemplateLiteral",
  quasis: statics.map((s) => ({ value: { cooked: s, raw: s } })),
  expressions: hasExpr ? [{ type: "Identifier", name: "x" }] : [],
});

function runRule(callee: unknown, title: unknown) {
  const reports: Array<{ message: string; node?: unknown }> = [];
  const ctx = {
    getFilename: () => "foo.spec.ts",
    report: (d: { message: string; node?: unknown }) => reports.push(d),
  };
  const visitor = japaneseTestTitleRule.create(ctx).CallExpression;
  if (visitor === undefined) throw new Error("CallExpression visitor が未定義");
  visitor({ type: "CallExpression", callee, arguments: [title] });
  return reports;
}

describe("japaneseTestTitleRule（検出パターン）", () => {
  it("英語タイトルの describe を報告する（メッセージにタイトルと「日本語」を含む）", () => {
    const reports = runRule(id("describe"), litTitle("english title"));
    expect(reports).toHaveLength(1);
    expect(reports[0].message).toContain("english title");
    expect(reports[0].message).toContain("日本語");
  });

  it("修飾子チェーン it.skip も検出する", () => {
    expect(runRule(member(id("it"), "skip"), litTitle("english"))).toHaveLength(1);
  });

  it("it.each(table) の外側 CallExpression も検出する", () => {
    expect(runRule(call(member(id("it"), "each")), litTitle("english each"))).toHaveLength(1);
  });
});

describe("japaneseTestTitleRule（skip パターン）", () => {
  it("日本語タイトルは報告しない", () => {
    expect(runRule(id("it"), litTitle("日本語タイトル"))).toHaveLength(0);
  });

  it("対象外 callee（foo）は無視する", () => {
    expect(runRule(id("foo"), litTitle("english not a test"))).toHaveLength(0);
  });

  it("非リテラルタイトル（Identifier）は skip", () => {
    expect(runRule(id("describe"), { type: "Identifier", name: "title" })).toHaveLength(0);
  });

  it("補間あり TemplateLiteral は skip（動的扱い）", () => {
    expect(runRule(id("it"), tmplTitle(["hello ", ""], true))).toHaveLength(0);
  });
});
