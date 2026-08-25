<!--
実装計画の雛形。コピーして docs/features/YYYY-MM-DD-<slug>.md として保存する。
この計画を `/tdd-implement docs/features/YYYY-MM-DD-<slug>.md` に渡すと TDD で実装される。
-->

# <機能名> 実装計画

- **Issue**: [#N タイトル](https://github.com/<owner>/<repo>/issues/N)
- **ADR**: [<ADR タイトル>](../adr/YYYY-MM-DD-<slug>.md) <!-- 設計判断がある場合のみ -->

> 実装は `tdd-implement` で本計画を TDD 実装する。**コミットは各タスクでは行わず、PR 前レビュー後に1回**。

## Goal

何を作るか。既存の何を再利用するか。スコープ外は何か。

## Architecture

どの層に何を置くか（`.claude/rules/architecture.md` の依存方向に沿っているかを明示する）。

- データの流れ: loader / action を使うか、ローカル state か
- state をどこに集約するか（features 層のフック / route / コンポーネント）
- route は薄い組み立てに留めるか

## Global Constraints

実装中に守る規約。逸脱するなら理由をここに書く。

- React Router を import してよいのは `routes/` `context/` `middleware/` と app 直下のみ
- 自 feature 内・自 route 内は相対 import、共有層は `~/` の絶対 import
- `export` する関数・型には JSDoc（`jsdoc-js/require-jsdoc`）
- ファイル名は kebab-case、テストは `*.spec.{ts,tsx}` でコロケーション
- テストタイトル（`describe` / `it`）は日本語
- スタイルは daisyUI 優先 → Tailwind で補完 → raw CSS 禁止

## ファイル構成（Create / Modify / 変更不要）

| 区分   | パス                            | 役割         |
| ------ | ------------------------------- | ------------ |
| Create | `app/features/<f>/types/<x>.ts` | 型定義       |
| Create | `app/features/<f>/utils/<x>.ts` | 純粋関数     |
| Modify | `app/routes.ts`                 | route の登録 |

## データ・ロジック設計

型定義・関数シグネチャ・ハンドラの要点を**実装前に**確定させる。

```ts
export type Xxx = { ... };
export function doSomething(input: Xxx): Yyy;
```

## TDD タスク

各タスクは「spec を先に書く → RED を確認 → 最小実装 → GREEN」。コミットはしない。

### Task 1: <純粋関数>

- spec: 正常系 / 境界値 / 異常系
- 実装: ...

### Task 2: <コンポーネント>

- spec: role ベースのクエリで振る舞いを検証（内部 state に触れない）
- 実装: ...

## Verification（最終確認）

```sh
npm test
npm run typecheck
npm run lint
npm run format:check
npm run knip
npm run build
```

## 受け入れ条件の対応

| issue の受け入れ条件 | 対応 Task |
| -------------------- | --------- |
| ...                  | Task 1    |
