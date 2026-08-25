import type { KnipConfig } from "knip";

// knip の設定（TS 形式が正 — oxlint/oxfmt と揃える）。
// 現状の baseline は zero-config で指摘ゼロ。react-router / storybook / vitest の各プラグインが
// root.tsx・routes・stories・tests を entry として自動解決し、isbot は react-router プラグインが
// フレームワーク既定の entry.server で使う依存として扱う（未使用扱いにならない）。
// 誤検出（例: 将来 CSS 経由参照のみになった依存など）が出たら、ここに最小限の ignore を追加する。
// （eslint-plugin-jsdoc は oxlint.config.ts の jsPlugins specifier を knip が使用として解決できるため ignore 不要。）
const config: KnipConfig = {
  // Hygen のテンプレ領域。prompt.cjs は Hygen が実行時にロードし app からは import しないため
  // knip には未使用に見える。テンプレ群ごと解析対象外にする（生成元であって app の依存グラフ外）。
  ignore: ["_templates/**"],
  // unplugin-icons 経由でビルド時に消費される依存。直接 import が無いため knip には未使用に見える。
  // @iconify-json/mingcute はアイコンデータ（~icons/* 仮想 import で抽出）、@svgr/plugin-jsx は
  // @svgr/core が jsx 変換時に動的ロードする（unplugin-icons の jsx コンパイラの実行時必須）。
  ignoreDependencies: ["@iconify-json/mingcute", "@svgr/plugin-jsx"],
  // ~icons/* は unplugin-icons の仮想モジュール。静的解析では解決できないため未解決扱いを抑止。
  ignoreUnresolved: [/^~icons\//],
};

export default config;
