# コメント規約

> いつ読むか: コードにコメントを書く / 直すとき、コメントの要否・粒度・書く場所に迷ったとき。
> 人・AI 共通の拠り所であり、後続の Linter 設定タスクは本ファイルを機械強制対象の正として読む。

## 基本方針

- **「なぜ・何のため（意図・背景）」を第一に書く。** コードを読めば分かる「何を」の単純な反復は書かない。
  **例外**: 関数サマリの「呼び出し側目線で何をするか」は契約情報として書く（→ カテゴリ①）。
- **簡潔に。** 1 行・概ね 30 文字以内を目安とする（**厳密な上限ではない**。背景が必要なら複数行可）。
- **コメントは日本語で書く。**
- コメントは性質の異なる 2 カテゴリに分ける。**①構造化ドキュメント（JSDoc）のみ oxlint で機械強制する**。
  **②インライン why は lint で強制できない**（規約・レビューで担保）。この境界を意識して書く（→ `## 機械強制の境界`）。

## カテゴリ①: 構造化ドキュメントコメント（JSDoc）

関数・型に付く `/** */`。**oxlint（`jsdoc-js/require-jsdoc`）で機械強制している領域。**

- **必須化の対象 ＝ `export` する関数・型。** 内部（非公開）の関数・型は任意（複雑な場合は推奨）。
- **関数**: 呼び出し側の目線で「何をするものか」＋ なぜ / 何のため（意図・背景）。
- **型・オブジェクト**: 用途・制約などの意図。
- **`@throws`**: 送出する例外とその条件。

```ts
// NG: コードを読めば分かる「何を」の反復。意図が無い
/** ID を受け取りユーザーを返す */
export function getUser(id: string): Promise<User> {
  /* ... */
}

// OK: 呼び出し側目線の契約 ＋ なぜ ＋ @throws
/**
 * ID からユーザーを取得する。未ログインでも呼べるよう公開情報のみ返す。
 * @throws {NotFoundError} 該当 ID が存在しないとき
 */
export function getUser(id: string): Promise<User> {
  /* ... */
}

// OK（型）: 用途・制約の意図
/** 申請の審査状態。submitted 以降は申請者が編集不可（提出後ロック）。 */
export type ReviewStatus = "draft" | "submitted" | "approved" | "rejected";
```

## カテゴリ②: インライン why コメント

処理の途中に置く `//`。**lint では強制も検証もできない。** 規約・レビューで担保する。

- **複雑な条件分岐・式**: 簡潔な説明 ＋ なぜ / 何のため。
- **暫定対応**: `TODO` で「今後対応すべき内容」＋ なぜ暫定対応にしているか。

```ts
// NG: 何をしているかの反復（コードと同じことを書いている）
// status が submitted か approved なら
if (status === "submitted" || status === "approved") {
  /* ... */
}

// OK: なぜ
// 提出後はロックする（申請者の二重編集を防ぐため）
if (status === "submitted" || status === "approved") {
  /* ... */
}

// OK（暫定対応）: 今後やること ＋ なぜ暫定か
// TODO: ページネーション対応。暫定で全件取得（現状は数十件で許容、増えたら遅い）
```

## 機械強制の境界

**何が lint で落ちるか**を本表から判断する。

| カテゴリ        | 対象                     | 機械強制 | 担保手段                        |
| --------------- | ------------------------ | -------- | ------------------------------- |
| ①JSDoc          | `export` する関数・型    | 強制済み | oxlint `jsdoc-js/require-jsdoc` |
| ①JSDoc          | 内部（非公開）の関数・型 | 対象外   | 規約・レビュー（複雑なら推奨）  |
| ②インライン why | 条件分岐・式 / 暫定対応  | 不可     | 規約・レビュー                  |

### 実際の設定（`oxlint.config.ts`）

`eslint-plugin-jsdoc` を `jsPlugins` の alias（`jsdoc-js`）として読み込み、次の条件で必須化している。

```ts
"jsdoc-js/require-jsdoc": [
  "error",
  {
    publicOnly: true,                    // export されるものだけが対象
    require: { FunctionDeclaration: true },
    contexts: ["TSTypeAliasDeclaration", "TSInterfaceDeclaration"],  // 型・interface も対象
  },
],
```

**JSDoc 必須の対象外**（`overrides` で `off`）:

- `*.spec.{ts,tsx}` / `*.stories.tsx` — テスト・Story
- `app/routes/**` / `app/root.tsx` / `app/routes.ts` / `app/entry.*.tsx` — フレームワーク規約の export
- `*.config.ts` / `custom-lint-rules/**` — ツール設定

`@param` / `@returns` / 型の記述は **`off`**（TS のシグネチャに型があり冗長なため）。
`@throws` は lint では強制できないので、規約として書く。
