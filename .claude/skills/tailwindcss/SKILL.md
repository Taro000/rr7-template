---
name: tailwindcss
description: Tailwind CSS v4 / daisyUI でスタイルを書く・直すときに使う。本リポジトリの「daisyUI 優先 → Tailwind で補完 → raw CSS 禁止」の判断フローと v4（CSS-first 設定）の要点。クラスの当て方・テーマ・レスポンシブ/状態 variant で迷ったとき。
model: inherit
---

# tailwindcss

## いつ使うか

- コンポーネントにスタイルを当てる / 既存スタイルを直すとき。
- daisyUI で表現できるか、Tailwind で補うか、テーマトークンの使い方で迷うとき。
- 使わない場面: スタイルに無関係なロジック実装。

## スタイリングの判断フロー（最優先ルール）

1. **まず daisyUI**: コンポーネントクラス（`btn` `card` `modal` 等）とセマンティックトークン（`bg-base-100` `text-base-content` `bg-primary` `text-primary-content` 等）を最優先。テーマ切替に追従する。
2. **足りなければ Tailwind ユーティリティで補う**: レイアウト / 間隔 / タイポグラフィ等（`flex` `gap-4` `p-2` `text-sm` `md:grid-cols-2`）。
3. **raw CSS（`.foo{}` や `style` 属性）は書かない。** 全体テーマ/基盤がどうしても必要なら `app/app.css` の `@theme` / `@layer base` に寄せる。

## 本リポジトリの Tailwind v4 構成

- **CSS-first 設定**: `tailwind.config.js` は無い。設定は CSS で行う。
- エントリ `app/app.css`: `@import "tailwindcss";`（本体）/ `@plugin "daisyui";`（daisyUI をプラグイン読込）/ `html, body` のベース（`@apply bg-base-100 text-base-content` と font-family）。
- ビルドは `@tailwindcss/vite`。`STORYBOOK=true` 時は React Router プラグインが無効化される点に注意。
- トークンを増減するときは `app/app.css` に `@theme { ... }`（daisyUI のテーマ機構と併用）。

## レスポンシブ / 状態 variant

- レスポンシブはモバイルファースト: 素指定が全幅、`sm:` `md:` `lg:` `xl:` で上書き（例 `grid-cols-1 md:grid-cols-3`）。
- 状態は variant: `hover:` `focus:` `focus-visible:` `disabled:` `aria-*` `data-*` `dark:` 等。
- 繰り返す組合せはコンポーネント側で配列 / 関数にまとめる（文字列連結で散らかさない）。

## アンチパターン

| 避ける                             | 代わりに                                               |
| ---------------------------------- | ------------------------------------------------------ |
| 生 CSS / `style={{...}}`           | daisyUI → Tailwind ユーティリティの順で当てる          |
| `bg-white` `text-black` 等の素の色 | セマンティックトークン（`bg-base-100` 等）でテーマ追従 |
| `tailwind.config.js` 新設          | v4 は CSS-first。`app/app.css` の `@theme`             |
| 任意値乱用（`w-[437px]`）          | まずスケール（`w-96`）。任意値は最後の手段             |

## 詳細リファレンス

- 個別ユーティリティ・v4 最新仕様は context7（`resolve-library-id` で `tailwindcss` を解決）または公式 docs（https://tailwindcss.com/docs）。
- daisyUI のコンポーネント / テーマは `daisyui` スキル（または https://daisyui.com/）。
