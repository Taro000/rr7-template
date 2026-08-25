import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: [
    "import",
    "typescript",
    "react",
    "jsx-a11y",
    "unicorn",
    "oxc",
    "jsdoc",
    "promise",
    "vitest",
    "node",
  ],
  jsPlugins: [
    "./custom-lint-rules/index.ts",
    { name: "jsdoc-js", specifier: "eslint-plugin-jsdoc" },
  ],
  categories: {
    correctness: "error",
    suspicious: "error",
    perf: "error",
    pedantic: "warn",
  },
  env: {
    browser: true,
    es2024: true,
    node: true,
  },
  settings: {
    react: {
      version: "19.0.0",
    },
  },
  ignorePatterns: [
    "build",
    "dist",
    ".react-router",
    "storybook-static",
    "coverage",
    "node_modules",
  ],
  rules: {
    // console 直書きを禁止。本番に残るデバッグログを防ぐ（必要なら lib/ のロガー経由）。spec/stories は override で緩和。
    "no-console": "error",
    // React 19 は自動 JSX ランタイムのため React import 不要。on にすると全 JSX が誤検知になる。
    "react/react-in-jsx-scope": "off",
    // CSS・テスト setup 等の副作用 import（例: import "./app.css"）は正当で、性質上アサインできない。
    "import/no-unassigned-import": "off",
    // TS では型がシグネチャにあるため JSDoc の型/@param/@returns 強制は冗長（comment.md も非要求）。pedantic opt-out。
    "jsdoc/require-param": "off",
    "jsdoc/require-param-type": "off",
    "jsdoc/require-returns": "off",
    "jsdoc/require-returns-type": "off",
    // ファイル名は kebab-case を強制。ディレクトリ名は組み込みルール無しのため規約・レビューで担保。
    "unicorn/filename-case": ["error", { case: "kebabCase" }],
    // カスタムプラグイン（custom-lint-rules）のアーキ境界ルール
    "arch/no-test-file": "error",
    "arch/no-external-import-outside-lib": "error",
    "arch/max-nesting-depth": "error",
    "arch/spec-colocation": "error",
    // export する関数・型に JSDoc ブロックを必須化（eslint-plugin-jsdoc を jsPlugins alias で読み込み）
    "jsdoc-js/require-jsdoc": [
      "error",
      {
        publicOnly: true,
        require: { FunctionDeclaration: true },
        contexts: ["TSTypeAliasDeclaration", "TSInterfaceDeclaration"],
      },
    ],
  },
  overrides: [
    {
      // アイコン registry はアイコン1件につき静的 import 1行を列挙する設計（unplugin-icons が
      // 動的 id を抽出できないため。→ docs/adr/2026-06-18-icon-foundation.md）。import 数は意図的に
      // 増えるので、max-dependencies（pedantic 既定 10）はこのファイルに不適合。除外する。
      files: ["app/lib/iconify/registry.ts"],
      rules: {
        "import/max-dependencies": "off",
      },
    },
    {
      // テスト・stories は console・テスト/story ライブラリの直接 import・JSDoc 必須の対象外
      files: ["**/*.spec.ts", "**/*.spec.tsx", "**/*.stories.tsx"],
      rules: {
        "no-console": "off",
        "max-lines-per-function": "off",
        "arch/no-external-import-outside-lib": "off",
        "jsdoc-js/require-jsdoc": "off",
      },
    },
    {
      // spec のみ: テストタイトル（describe / it / test / suite）に日本語必須。
      // stories の story 名は対象外のため上の override とは分けて閉じる
      // （アプリコードの同名 Identifier への誤検出を防ぐ構造）
      files: ["**/*.spec.ts", "**/*.spec.tsx"],
      rules: {
        "arch/japanese-test-title": "error",
      },
    },
    {
      // フレームワーク規約 export（route/root/entry）・ツール設定は JSDoc 必須の対象外
      files: [
        "app/routes/**",
        "app/root.tsx",
        "app/routes.ts",
        "app/entry.client.tsx",
        "app/entry.server.tsx",
        "*.config.ts",
        "custom-lint-rules/**",
      ],
      rules: {
        "jsdoc-js/require-jsdoc": "off",
      },
    },
    {
      // 共有層: React Router と features/routes への依存を禁止（依存方向・フレームワーク剥離）
      files: [
        "app/components/**",
        "app/hooks/**",
        "app/lib/**",
        "app/utils/**",
        "app/types/**",
        "app/config/**",
      ],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["react-router", "react-router/*", "@react-router/*"],
                message:
                  "共有層が React Router を import している。React Router は routes/middleware/context でのみ使う。",
              },
              {
                group: ["~/features/*", "~/features/**", "~/routes/*", "~/routes/**"],
                message:
                  "依存方向違反: 共有層が features/routes を import している。共有したいものは共有層（components/utils 等）へ引き上げる。",
              },
            ],
          },
        ],
      },
    },
    {
      // features: RR・routes・他/自 feature の絶対 import を禁止（feature 内は相対 import）
      files: ["app/features/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["react-router", "react-router/*", "@react-router/*"],
                message:
                  "features が React Router を import している。React Router は routes/middleware/context でのみ使う。",
              },
              {
                group: ["~/routes/*", "~/routes/**"],
                message:
                  "依存方向違反: features が routes を import している。共有したいものは共有層へ引き上げる。",
              },
              {
                group: ["~/features/*", "~/features/**"],
                message:
                  "features の絶対 import は禁止。自 feature 内は相対 import、他 feature と共有するものは共有層へ引き上げる。",
              },
            ],
          },
        ],
      },
    },
    {
      // routes: 他/自 route の絶対 import を禁止（route 内は相対 import）。RR は許可
      files: ["app/routes/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["~/routes/*", "~/routes/**"],
                message:
                  "routes の絶対 import は禁止。自 route 内は相対 import、共有するものは features か共有層へ引き上げる。",
              },
            ],
          },
        ],
      },
    },
  ],
});
