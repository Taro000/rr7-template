# rr7-template

React Router v7（framework mode / SSR）のプロジェクトテンプレート。
型・lint・テスト・Storybook・雛形生成・Git フック・CI・Claude Code の規約とスキルまでを最初から揃えてある。

## セットアップ

### 1. テンプレートから新しいリポジトリを作る

**このリポジトリを直接 clone しない。** 。
GitHub 上で**Use this template → Create a new repository**、または以下を実行。

```sh
# 可視性は --private / --public のどちらか（Free プランのブランチ保護は public のみ → 後述）
gh repo create <owner>/<新プロジェクト名> --template Taro000/rr7-template --private --clone
```

生成されるのは**コミット 1 本の新しいリポジトリ**。
ファイル（`.github/` や `.claude/` を含む）はすべて入るが、テンプレート側の**コミット履歴・issue・PR・secrets・Projects・ブランチ保護は入らない**。
ラベルも既定のものだけなので `ready` / `ready for dev` は自分で作る（→「テンプレートから作った後にやること」）。
fork ではないため upstream 関係も残らず、**テンプレート側の更新は自動では降りてこない**。

### 2. 開発環境を用意する

Node 24 を [mise](https://mise.jdx.dev/) で管理している（`mise.toml`）。

```sh
mise trust        # clone 直後は mise.toml が未信頼なので最初に実行する
mise install      # mise.toml の Node（npm 同梱）をインストール
mise run setup    # npm install + Husky フック設定
```

`.npmrc` の `ignore-scripts=true`（サプライチェーン攻撃対策）により、`npm install` 単体では
Husky の pre-commit フックが設定されない。**初回セットアップは必ず `mise run setup` を使うこと。**
npm は 11.10 以上が必要（`engines` + `engine-strict` で強制。古い npm では install が失敗する）。

### 3. 日常的に使うコマンド

```sh
npm run dev       # 開発サーバ（HMR・SSR）→ http://localhost:5173
npm run storybook # Storybook → http://localhost:6006
npm run check     # format → lint:fix → typecheck
npm test          # vitest
```

## 技術スタック

| 領域           | 採用                                  | 備考                                                    |
| -------------- | ------------------------------------- | ------------------------------------------------------- |
| フレームワーク | React Router v7（framework mode）     |                                                         |
| UI             | React 19                              | 状態管理ライブラリなし                                  |
| スタイル       | Tailwind CSS v4 + daisyUI v5          | CSS-first 設定（`app/app.css`）。raw CSS 禁止           |
| アイコン       | unplugin-icons + Iconify（mingcute）  | `app/lib/iconify/registry.ts` が唯一の窓口              |
| テスト         | Vitest + Testing Library + user-event | jsdom。`*.spec.{ts,tsx}` でコロケーション               |
| カタログ       | Storybook 9（react-vite）             | addon-docs / addon-a11y                                 |
| Lint / Format  | oxlint + oxfmt                        | TS 形式の設定が正。カスタムプラグインでアーキ境界を強制 |
| 未使用検出     | knip                                  |                                                         |
| 雛形生成       | Hygen                                 | 抽象度3層のコンポーネント雛形                           |
| Git フック     | husky                                 | main への直コミット / 直 push を拒否                    |
| Node 管理      | mise                                  | Node 24 固定                                            |
| CI             | GitHub Actions                        | typecheck → lint → format:check → test → build          |

## アーキテクチャ

[bulletproof-react](https://github.com/alan2207/bulletproof-react) を React Router v7 に適応した構成。
**規約の正は `.claude/rules/architecture.md`**。

```
app/
│  # ── 上流（依存の起点）
├── routes/       # RR v7 Route モジュール（ページ・loader / action）
├── features/     # 機能モジュール（api / components / hooks / types / utils）
│
│  # ── 共有層（features / routes を import しない）
├── components/   # 汎用 UI
├── hooks/        # 汎用フック
├── lib/          # 外部ライブラリの腐敗防止層
├── utils/        # 汎用ユーティリティ
├── types/        # 共通型
├── config/       # グローバル設定
│
│  # ── RR v7 の仕組み（React Router を import してよい）
├── context/      # RR v7 Context
├── middleware/   # RR v7 Middleware
│
├── testing/      # テストユーティリティ
└── assets/       # 静的ファイル
```

**依存方向は単方向**（lint で強制）:

```
routes  →  features  →  共有層（components / hooks / lib / utils / types / config）
```

- features 間・routes 間の相互 import は禁止。共有したくなったら共有層へ引き上げる
- **React Router を import してよいのは** `routes/` `context/` `middleware/` と app 直下のみ
  （フレームワークの剥がしやすさを保つため）
- **外部ライブラリの直 import は `lib/` のみ**（腐敗防止層）。例外は `react` / `react-dom` / `react-router`

**UI コンポーネントの抽象度3層**:

| 配置                                 | 責務                         |
| ------------------------------------ | ---------------------------- |
| `app/components/`                    | アプリ全体で共有する汎用 UI  |
| `app/features/<feature>/components/` | 特定機能に固有の UI          |
| `app/routes/<route>/_components/`    | 特定 route でしか使わない UI |

## コンポーネント雛形生成（Hygen）

抽象度3層の雛形を [Hygen](https://www.hygen.io/) で生成する。1回の生成で
`<name>.tsx` ＋ `<name>.spec.tsx` ＋ `<name>.stories.tsx`（**ファイル名は kebab-case**）を
フラット配置（バレルなし）で出力する。シンボル・型・Storybook 表示名は PascalCase に正規化される。

```sh
# 共通コンポーネント → app/components/<name>.{tsx,spec.tsx,stories.tsx}
npm run gen -- common --name UserCard

# feature 固有 → app/features/<feature>/components/<name>.{...}
npm run gen -- feature --feature user-profile --name UserCard

# route 固有 → app/routes/<route>/_components/<name>.{...}
npm run gen -- route --route dashboard --name UserCard
```

- 引数を省略すると対話プロンプトで補う。既存ファイルは上書きしない（`unless_exists`）
- 生成直後の雛形は**無修正で** `npm run check` と `npm test` を通る
- **規約を変えたらテンプレ `_templates/component/` も同期する**（`.claude/rules/` をコードとして複製した二重管理）

## テスト戦略

**戦略の正は `.claude/rules/test.md`**。

要点:

- **TDD**: テスト先行 → RED → 最小実装 → GREEN → REFACTOR
- ファイル名は `*.spec.{ts,tsx}`（`*.test.*` は lint で禁止）、テスト対象と**同じディレクトリ**に置く
- **テストタイトル（`describe` / `it`）は日本語**（lint で機械強制）
- ロジックは C0/C1 100% 目標、UI はブラックボックス（role / label クエリ、内部 state に触れない）

## テンプレートから作った後にやること

1. **`package.json` の `name`** を自プロジェクト名に変更する
2. **`app/routes/home.tsx` と `app/root.tsx`** の文言・meta を差し替える
   （`app/components/counter.tsx` はサンプル。不要なら spec / stories ごと削除する）
3. **`README.md`（このファイル）と `CLAUDE.md` 冒頭**のテンプレート説明を、自プロジェクトの説明に書き換える
   （テンプレート自体の説明が残っていると、人も AI も「これはテンプレートだ」と読み違える）
4. **GitHub 運用を使う場合**: 次の 2 つのラベルを作る（テンプレートからは引き継がれない）。
   - `ready` — ローカルの `/issue-to-pr` 用
   - `ready for dev` — クラウド無人実行（`cloud-issue-to-pr`）用
     > **ラベルが 2 系統あるのは意図的**。同一にすると、ローカルで実装するつもりの issue でも
     > クラウドセッションが起動して二重実装になる。片方しか使わないなら、もう片方は作らなくてよい。
5. **GitHub Projects で優先度選定を使う場合**: 次の 2 ファイルのプレースホルダを置換する。
   - `.claude/skills/issue-to-pr/references/select-ready-issue.md` → `<GITHUB_OWNER>` / `<PROJECT_NUMBER>` / `<REPO_NAME>`
   - `.claude/skills/refine-issue/references/subtask-creation.md` → `<PROJECT_TITLE>` / `<GITHUB_OWNER>` / `<PROJECT_NUMBER>`
6. **クラウド無人実行を使う場合**: `docs/agents/claude-code-web-setup.md` に従って Routine を作り、
   secrets（`ROUTINE_IMPL_URL` / `ROUTINE_IMPL_TOKEN` / `ROUTINE_FIX_URL` / `ROUTINE_FIX_TOKEN`）を登録する。
   **使わないなら `.github/workflows/{dispatch-agent,auto-fix-agent}.yml` と
   `.claude/skills/cloud-issue-to-pr/` を削除してよい**（未設定のままラベルを付けると workflow が失敗する）。
7. **不要なものを削る**: `daisyui` を使わないなら `app/app.css` の `@plugin "daisyui"` と依存、
   アイコンが要らないなら `app/lib/iconify/` と `app/components/icon/` と unplugin-icons 系の依存
   （`vite.config.ts` / `vitest.config.ts` / `knip.config.ts` の `Icons` 設定も併せて外す）。

## Git ワークフロー保護

`main` への**直接 commit / push は husky フックで拒否**する。

- `.husky/pre-commit` — main での commit を拒否 → `format:check` `lint` `typecheck` `knip` `test` を実行
- `.husky/pre-push` — main への push を拒否
- 脱出口は `git commit --no-verify` / `git push --no-verify` のみ。GitHub 上の PR マージはフック対象外

> pre-commit は全チェックを回すためコミットに数十秒かかる。壊れたコミットを物理的に作れなくする
> ための意図的なトレードオフ。軽くしたい場合は `knip` と `test` を pre-push へ移す。

## Claude Code との連携

このテンプレートの中核は `.claude/` にある。**規約を人と AI で共有し、フックで機械的に守らせる**構成。

### 規約（`.claude/rules/`）

オンデマンド参照。各ファイルの冒頭に「いつ読むか」が書いてある。

| ファイル          | いつ読むか                                                                   |
| ----------------- | ---------------------------------------------------------------------------- |
| `architecture.md` | 機能・コンポーネントの追加/配置、import 方針、外部ライブラリ導入を決めるとき |
| `test.md`         | テストを書く前。種類・粒度・命名・配置・カバレッジ方針                       |
| `comment.md`      | コメントを書く/直すとき                                                      |

### フック（`.claude/hooks/`）

| フック                          | タイミング | 動作                                                                                                                              |
| ------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `stop-format-lint-typecheck.sh` | Stop       | そのターンで編集した JS/TS に oxfmt/oxlint を自動修正し、TS があれば typecheck。未解決なら差し戻して自己修復（セッション3回まで） |
| `tdd-test-guard.sh`             | PreToolUse | `.tdd-lock` に記載したテストへの編集・破壊的 Bash を deny（TDD の「テスト＝仕様」を守る）                                         |

`.tdd-lock` は RED 確認後にテストパスを追記するロック台帳（gitignore 済み・worktree ローカル）。
フック自体のテストは `bash .claude/hooks/tdd-test-guard.test.sh` で実行できる。

### スキル（`.claude/skills/`）

| スキル                        | いつ使うか                                      | 起動                 |
| ----------------------------- | ----------------------------------------------- | -------------------- |
| `tailwindcss`                 | Tailwind v4 / daisyUI でスタイルを書く・直す    | 自動                 |
| `daisyui`                     | daisyUI のコンポーネント / テーマを当てる       | 自動                 |
| `vercel-react-best-practices` | React コンポーネント / フックを書く・直す       | 自動                 |
| `react-router-framework-mode` | route / loader / action / 型生成など RR v7 実装 | 自動                 |
| `playwright-cli`              | ブラウザ操作・E2E を確認する                    | 自動                 |
| `tdd-implement`               | `docs/features` の計画を TDD で実装する         | `/tdd-implement`     |
| `refine-issue`                | 曖昧な issue 本文を深掘り・詳細化する           | `/refine-issue`      |
| `issue-to-pr`                 | `ready` issue から計画→実装→PR まで自走する     | `/issue-to-pr`       |
| `cloud-issue-to-pr`           | クラウド無人実行で issue から PR まで自走する   | 自動（クラウド専用） |
| `create-branch`               | issue から作業ブランチを切る                    | `/create-branch`     |
| `create-pr`                   | 作業ブランチを push し PR を作る                | `/create-pr`         |
| `commit`                      | ステージ済み変更をコミットする                  | `/commit`            |

`daisyui` / `react-router-framework-mode` / `vercel-react-best-practices` / `playwright-cli` の 4 つは外部由来。
実体をコミットしてあるのでテンプレートから作った直後に使えるが、**上流の更新は自動では入らない**。
更新するときは次を実行して差分をコミットする（バージョンは `skills-lock.json` で固定）。

```sh
npx skills add saadeghi/daisyui -s daisyui -a claude-code -y
npx skills add remix-run/agent-skills -s react-router-framework-mode -a claude-code -y
npx skills add vercel-labs/agent-skills -s vercel-react-best-practices -a claude-code -y
```

> `playwright-cli` だけは `skills-lock.json` の管理外（取り込み元が記録されていない）。
> 更新するときは `.claude/skills/playwright-cli/` を手で入れ替える。

### 権限（`.claude/settings.json`）

`defaultMode: auto`。`.env` / secrets / 鍵の読み書き、`rm -rf`、`git rebase`、`--no-verify` は deny。
`rm` / `curl` / `sudo` / `git reset` と `tsconfig.json` / `oxlint.config.ts` / `.editorconfig` の
編集は ask。個人的な追加許可は `.claude/settings.local.json`（gitignore 済み）に書く。

## ドキュメント

- 設計判断 → `docs/adr/`（雛形: `docs/adr/_template.md`）
- 実装計画 → `docs/features/`（雛形: `docs/features/_template.md`）
- 運用手順 → `docs/agents/`

詳しくは `docs/README.md`。
