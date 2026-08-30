# CLAUDE.md

このファイルは、本リポジトリのコードを扱う際の Claude Code（claude.ai/code）向けのガイダンスを提供する。

> このリポジトリは **React Router v7 のプロジェクトテンプレート**（`rr7-template`）で、GitHub の
> template repository として設定されている。**直接 clone するのではなく「Use this template」で
> 新しいリポジトリを生成して**使う土台であり、`app/routes/home.tsx` と `app/components/counter.tsx` は
> 「このパターンで書く」ことを示すサンプル。実プロジェクトでは差し替える（→ `README.md`）。

## ルールとスキル

詳細な規約は `.claude/rules/`、領域別の作法は `.claude/skills/` に置く。
**該当作業の前に対応ファイルを読む / スキルを使う**こと（各ルールは冒頭に「いつ読むか」を持つ）。

### ルール（`.claude/rules/`）

- `architecture.md` — 機能・コンポーネントの追加/配置、import 方針、データ取得の置き場所、外部ライブラリ導入を決めるとき。
- `test.md` — テストを書く前。種類・粒度・命名・配置・カバレッジ方針。
- `comment.md` — コメントを書く/直すとき。要否・粒度・書く場所。

### スキル（`.claude/skills/`）

| スキル                        | いつ使うか                                                    | 起動                 |
| ----------------------------- | ------------------------------------------------------------- | -------------------- |
| `tailwindcss`                 | Tailwind v4 / daisyUI でスタイルを書く・直す                  | 自動                 |
| `daisyui`                     | daisyUI のコンポーネント / テーマを当てる                     | 自動                 |
| `vercel-react-best-practices` | React コンポーネント / フックを書く・直す                     | 自動                 |
| `react-router-framework-mode` | route / loader / action / 型生成など RR v7 実装               | 自動                 |
| `tdd-implement`               | `docs/features` の計画を TDD で実装する                       | `/tdd-implement`     |
| `refine-issue`                | 曖昧な issue 本文を深掘り・詳細化する                         | `/refine-issue`      |
| `issue-to-pr`                 | `ready` issue から計画→実装→PR まで自走する                   | `/issue-to-pr`       |
| `cloud-issue-to-pr`           | クラウド無人実行（Routine 起動）で issue から PR まで自走する | 自動（クラウド専用） |
| `create-branch`               | issue から作業ブランチを切る                                  | `/create-branch`     |
| `create-pr`                   | 作業ブランチを push し PR を作る                              | `/create-pr`         |
| `commit`                      | ステージ済み変更をコミットする                                | `/commit`            |
| `playwright-cli`              | ブラウザ操作・E2E を確認する                                  | 自動                 |

> 外部スキル（`daisyui` / `react-router-framework-mode` / `vercel-react-best-practices` /
> `playwright-cli`）は実体をコミットしている。うち前 3 つは `npx skills` で取り込み `skills-lock.json`
> でバージョン固定、`playwright-cli` は lock 管理外（手動更新）。更新方法は `README.md`。

## コマンド

Node 24 が必須（`mise` で管理 — `mise.toml`）。パッケージ関連は `npm` を使う。

- `npm run dev` — 開発サーバ（HMR・SSR 有効）
- `npm run build` — 本番ビルド（`build/` に出力） / `npm start` — 本番ビルドを配信
- `npm run typecheck` — typegen → `tsc --noEmit`。**route の export か `app/routes.ts` を変更したら必ず実行**（`Route.*` 型が再生成される）。
- `npm run lint` / `lint:fix` — oxlint。`npm run format` / `format:check` — oxfmt
- `npm test` — vitest（1回）。watch は `npm run test:watch`。単一は `npx vitest run <path>`（`-t "名前"` でフィルタ可）
- `npm run storybook` / `build-storybook` — ポート 6006。**`STORYBOOK=true` が必須**（RR と Storybook の Vite プラグインは共存不可のため）。
- `npm run gen -- <layer> …` — Hygen で抽象度3層の雛形生成（`common` / `feature` / `route`）。使い方は README「コンポーネント雛形生成（Hygen）」。**規約を変えたらテンプレ `_templates/component/` も同期する**（テンプレは `.claude/rules/` をコードとして複製した二重管理）。

## Git ワークフロー保護

`main` への**直接 commit / push は husky フックで拒否**する（`create-branch` → `create-pr` を徹底）。

- `.husky/pre-commit`（main での commit 拒否）/ `.husky/pre-push`（main への push 拒否）。
- 脱出口は `git commit --no-verify` / `git push --no-verify` のみ。GitHub 上の PR マージはフック対象外で正常に通る。
- サーバ側 branch protection は**未設定**で、ガードはローカルフックのみ。Free プランで branch protection /
  ruleset を張れるのは public リポジトリだけ（private は Pro 以上）なので、生成先の可視性とプランで判断する
  （→ `docs/agents/claude-code-web-setup.md` の「6. ブランチ保護」）。

## ツール設定

- **oxlint** / **oxfmt** は TS 形式の設定が正（`oxlint.config.ts` / `oxfmt.config.ts`）。`.oxlintrc.json` / `.oxfmtrc.json` を復活させない。
- アーキ境界の一部はカスタム oxlint プラグイン（`custom-lint-rules/`）で、残りは `oxlint.config.ts` の `no-restricted-imports` で強制。対応表 → `.claude/rules/architecture.md` の「強制方法」。
- `~/*` は `app/*` のエイリアス（`tsconfig.json` の paths。Vitest 用に `vitest.config.ts` へもミラー）。
- アイコンは `~icons/*` を直 import せず、`~/components/icon/icon` の `Icon` を `IconName` で使う（`arch/no-external-import-outside-lib` で強制）。使えるアイコンの一覧は `app/lib/iconify/registry.ts`。

## アーキテクチャ

framework mode（ファイルベース routing + SSR）の **React Router v7** アプリ（SPA ではない）。
設計・配置・依存方向の規約は `.claude/rules/architecture.md`。運用上の要点:

- route は `app/routes/` にファイルを作り `app/routes.ts` に**明示登録**する（**自動検出されない**）。
- 各 route は生成型を `import type { Route } from "./+types/<name>"` で参照。古い・欠ける時は `npm run typecheck`（typegen 先行）。
- サーバ専用は `*.server.ts` / `.server/`、クライアント専用は `*.client.ts` / `.client/`。
- `app/root.tsx` が HTML シェル（`<Layout>` が全ページをラップ）＋グローバル `ErrorBoundary`（日本語）。
- **loader / action の実装例はテンプレートに含まれていない。** データ取得・更新を書くときは
  `react-router-framework-mode` スキル（`references/data-loading.md` / `actions.md`）を必ず読む。

## スタイリング

Tailwind v4（`@tailwindcss/vite`、設定は CSS。daisyUI は `app/app.css` の `@plugin "daisyui"`）。
方針: **daisyUI 優先 → Tailwind で補完 → raw CSS 禁止**。セマンティッククラス（`bg-base-100` 等）でテーマに追従。
**UI コンポーネントは daisyUI を可能な限り利用し、それだけで表現しきれない箇所のみカスタムする。**
判断フローは `tailwindcss` / `daisyui` スキル。

## テスト

戦略・粒度・命名・カバレッジは `.claude/rules/test.md`。
設定: Vitest（`jsdom` + `@testing-library/react`、globals 有効、各テスト後 `cleanup()`）。
テストは `app/**/*.{test,spec}.{ts,tsx}`、Stories は `app/**/*.stories.tsx`。
**TDDで実装するコロケーションなテストは実行可能な仕様書として`.spec` で書く**。

## 規約

- UI コピーのデフォルトは日本語（`app/root.tsx` の `<html lang="ja">`）。
- 設計判断は `docs/adr/`、実装計画は `docs/features/` に置く（→ `docs/README.md`）。
- `*.spec.ts(x)` / `*.stories.tsx` では `no-console` を緩和している。
- `.editorconfig` = インデント2スペース・LF・最大行長 100（`oxfmt` の `printWidth: 100` と一致）。
