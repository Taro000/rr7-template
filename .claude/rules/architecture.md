# アーキテクチャ規約

> いつ読むか: 機能・コンポーネントの追加/配置、ディレクトリ構成、import 方針、データ取得の置き場所、
> 外部ライブラリの導入を決めるとき。実装前に本ファイルを読む。

## 基本方針

- **ベース**: [bulletproof-react](https://github.com/alan2207/bulletproof-react) を React Router v7（framework mode / SSR）に適応する。
- **状態管理ライブラリは使わない。** 状態は React 標準（`useState` / `useReducer` / Context）と loader データ（URL）で扱う。
- **データ取得は route の loader / action で行う**（コンポーネント内で `fetch` を直接呼ばない）。SSR を前提とする。
- **依存のコントロール**: フレームワーク（React Router）は**ディレクトリ構造**で、外部ライブラリは**腐敗防止層（`lib/`）**で閉じ込める。

## ディレクトリ構造

### 全体像

```
app
|
+-- assets      # アプリ共通の静的ファイル（画像・フォント etc.）
|
+-- components  # アプリ共通の汎用 UI コンポーネント
|
+-- config      # アプリ全体のグローバルな設定（環境変数 etc.）
|
+-- context     # React Router v7 の Context（アプリ全体のグローバルストア）
|
+-- features    # 機能モジュール群
|
+-- hooks       # アプリ共通のカスタムフックロジック
|
+-- lib         # 外部ライブラリの腐敗防止層
|
+-- middleware  # React Router v7 の Middleware
|
+-- routes      # React Router v7 の Route モジュール群
|
+-- testing     # テストユーティリティやモック etc.
|
+-- types       # アプリ共通の型定義
|
+-- utils       # アプリ共通のユーティリティ関数・純粋ロジック
```

- サーバ専用は `*.server.ts` / `.server/`、クライアント専用は `*.client.ts` / `.client/`。`~/*` は `app/*` のエイリアス。

### feature 配下

```
app/features/xxxx-xxxx
|
+-- api         # 機能固有の API 呼び出し
|
+-- assets      # 機能固有の静的ファイル
|
+-- components  # 機能固有のコンポーネント
|
+-- hooks       # 機能固有のカスタムフックロジック
|
+-- types       # 機能固有の型定義
|
+-- utils       # 機能固有のユーティリティ関数・純粋ロジック
```

- `api/` は機能固有の API 呼び出し**関数**の置き場。**呼び出し元は route の loader / action のみ**
  （コンポーネントから直接呼ばない）。「データ取得は loader / action で行う」原則は変わらない。

### route 配下

```
app/routes/yyyy-yyyy
|
+-- _components              # route 固有のコンポーネント
|
+-- action(.server).ts       # Action 定義
|
+-- loader(.server).ts       # Loader 定義
|
+-- route.tsx
|
+-- yyyy-yyyy.spec.ts        # route のテストを集約（loader・action）
```

- route は `app/routes.ts` に明示登録する（`app/routes/` 配下は**自動検出されない**）。

### UI コンポーネントの抽象度3層

| 配置                                 | 責務                          | 例                                  |
| ------------------------------------ | ----------------------------- | ----------------------------------- |
| `app/components/`                    | アプリ全体で共有する汎用 UI   | Button, Modal, Card                 |
| `app/features/<feature>/components/` | 特定機能に固有の UI・ロジック | `features/todo/components/TodoList` |
| `app/routes/<route>/_components/`    | 特定 route でしか使わない UI  | ページ固有セクション                |

機能をまたいで共有したくなったら、共有先を `app/components/`（または共有層）へ引き上げる。

## ディレクトリの深さ

コンポーネントやロジックが適切にディレクトリ分けされるよう、ネストの深さに制限を掛ける。

| 対象                                  | 深さ  | OK                        | NG                             |
| ------------------------------------- | ----- | ------------------------- | ------------------------------ |
| `app/features/`（feature モジュール） | 1階層 | `features/aaaa/`          | `features/aaaa/bbbb/`          |
| `app/routes/`（route モジュール）     | 1階層 | `routes/aaaa/`            | `routes/aaaa/bbbb/`            |
| `app/components/`                     | 2階層 | `components/aaaa/bbbb/`   | `components/aaaa/bbbb/cccc/`   |
| `app/features/<feature>/components/`  | 2階層 | `…/components/aaaa/bbbb/` | `…/components/aaaa/bbbb/cccc/` |
| `app/routes/<route>/_components/`     | 1階層 | `…/_components/aaaa/`     | `…/_components/aaaa/bbbb/`     |

> feature / route モジュールの「1階層」は**モジュール自体の入れ子禁止**（サブ feature / サブ route を
> 作らない）の意。モジュール直下の規定サブディレクトリ（`api/` `components/` 等、上記ツリー）は対象外。

## 命名規約

**ファイル名・ディレクトリ名はケバブケース**（小文字＋ハイフン。例: `todo-list.tsx`・`todo-list/`）。
コンポーネント名・型名などコード上の識別子は対象外（`export function TodoList` は PascalCase のまま）。

| 対象           | 強制                                 | 備考                                                            |
| -------------- | ------------------------------------ | --------------------------------------------------------------- |
| ファイル名     | `unicorn/filename-case`（機械強制）  | `case: kebabCase`。`*.spec`/`*.server` 等の接尾辞は語幹だけ検査 |
| ディレクトリ名 | 規約・レビューで担保（機械強制なし） | oxlint にディレクトリ命名の組み込みルールが無いため             |

> ディレクトリ名の例外: route 私有 `_components`、`.server`/`.client` ディレクトリ、RR 生成 `+types`。

## 依存方向（単方向）

```
routes  →  features  →  共有層（components / hooks / lib / utils / types / config）
```

- ✅ `routes/*` → `features/*`・共有層・`context/`・`middleware/`
- ✅ `features/*` → 共有層
- ✅ 共有層 → 他の共有層のみ（外部ライブラリは `lib/` 経由）
- ❌ **features 間の相互 import 禁止**（`features/a` ↔ `features/b`）
- ❌ **routes 間の相互 import 禁止**
- ❌ 共有層が `features/*`・`routes/*` を import するの禁止

### React Router 依存

フレームワークの剥がしやすさを保つため、React Router v7 の機能を import できるのは以下のみ。

- `app/context/`・`app/middleware/`・`app/routes/`
- app 直下のフレームワークファイル（`root.tsx`・`routes.ts`・entry ファイル）

これら以外のディレクトリ（`features/`・`components/`・`hooks/`・`lib/`・`utils/` 等）が
React Router を import するのは**禁止**。フロントエンドとしてのコア部分はフレームワークに依存しない状態を保つ。

### 外部ライブラリ依存（`lib/` ＝ 腐敗防止層）

- `lib/` を腐敗防止層として使い、外部ライブラリへの**直接依存を避ける**。
- 外部ライブラリを使うには、`lib/` 配下に各ライブラリ用のディレクトリを作成し、
  ライブラリの機能にアクセスする**薄いラッパー**を実装する。アプリ側はラッパーのみ import する。
- **例外**（腐敗防止層 不要）: `react`・`react-dom`。リポジトリの基盤技術で使用箇所が広範なため、
  「実装時の不便さ > 腐敗防止層の維持コスト」となるのを防ぐ。

## 強制方法（機械強制済み）

本ファイルの規約は、次の 2 系統で lint により機械強制する。**規約を変えたら強制側も同時に更新する。**

| 規約                                                                          | 強制する仕組み                                              | 実体                                                         |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| 依存方向（共有層 → features/routes 禁止、features/routes の相互 import 禁止） | `oxlint.config.ts` の `overrides` + `no-restricted-imports` | ディレクトリごとに禁止パターンを宣言                         |
| React Router を import してよいディレクトリの制限                             | 同上                                                        | `react-router` / `@react-router/*` を共有層・features で禁止 |
| 腐敗防止層（`lib/` 外での外部パッケージ直 import 禁止）                       | カスタムプラグイン `arch/no-external-import-outside-lib`    | `custom-lint-rules/no-external-import-outside-lib.ts`        |
| ネストの深さ表                                                                | `arch/max-nesting-depth`                                    | `custom-lint-rules/max-nesting-depth.ts`                     |
| テストのコロケーション                                                        | `arch/spec-colocation`                                      | `custom-lint-rules/spec-colocation.ts`                       |
| `*.test.{ts,tsx}` の禁止（`.spec` 統一）                                      | `arch/no-test-file`                                         | `custom-lint-rules/no-test-file.ts`                          |
| ファイル名のケバブケース                                                      | `unicorn/filename-case`                                     | `oxlint.config.ts`                                           |

> **ディレクトリ名**のケバブケースだけは oxlint に組み込みルールが無いため、規約・レビューで担保する。
