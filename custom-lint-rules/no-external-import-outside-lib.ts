import type { ArchRule, ImportNode, ProgramNode, RuleContext } from "./types.ts";

// react・react-dom は腐敗防止層の例外。react-router はフレームワークとして dir 制限側で扱う。
const ALLOWED_PACKAGES = new Set(["react", "react-dom", "react-router"]);

function segmentsAfterApp(filename: string): string[] | null {
  const parts = filename.split("/");
  const i = parts.indexOf("app");
  return i === -1 ? null : parts.slice(i + 1);
}

function isBareSpecifier(source: string): boolean {
  // 相対 `.`/`..`・絶対 `/`・エイリアス `~`・node 組み込み `node:` 以外を外部パッケージとみなす
  return (
    !source.startsWith(".") &&
    !source.startsWith("/") &&
    !source.startsWith("~") &&
    !source.startsWith("node:")
  );
}

function packageNameOf(source: string): string {
  const parts = source.split("/");
  return source.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/**
 * `app/lib` 外で許可リスト外の外部パッケージを直接 import しているか判定する（腐敗防止層の強制）。
 * @param filename - import 元ファイルのパス
 * @param source - import 文の指定子
 */
export function isExternalImportOutsideLib(filename: string, source: string): boolean {
  const seg = segmentsAfterApp(filename);
  // app/ 配下のみ対象
  if (seg === null) return false;
  // lib 内は外部 import を許可
  if (seg[0] === "lib") return false;
  if (!isBareSpecifier(source)) return false;
  const pkg = packageNameOf(source);
  if (ALLOWED_PACKAGES.has(pkg) || pkg.startsWith("@react-router/")) return false;
  return true;
}

/**
 * unplugin-icons の仮想指定子 `~icons/*` を `app/lib/iconify` 外で import しているか判定する。
 * `~icons` は `~` 始まりで bare 扱いされず {@link isExternalImportOutsideLib} に載らないため別途強制する。
 * @param filename - import 元ファイルのパス
 * @param source - import 文の指定子
 */
export function isIconifyImportOutsideLib(filename: string, source: string): boolean {
  if (source !== "~icons" && !source.startsWith("~icons/")) return false;
  const seg = segmentsAfterApp(filename);
  // app/ 配下のみ対象（config 等の app 外は対象外）
  if (seg === null) return false;
  // vendor 接触面は lib/iconify のみ許可
  return !(seg[0] === "lib" && seg[1] === "iconify");
}

/** `app/lib` 外での許可外な外部 import を禁止する oxlint ルール（腐敗防止層の強制）。 */
export const noExternalImportOutsideLibRule: ArchRule = {
  create(context: RuleContext) {
    return {
      Program(node: ProgramNode) {
        const filename = context.getFilename();
        for (const stmt of node.body) {
          if (stmt.type !== "ImportDeclaration") continue;
          const source = (stmt as ImportNode).source.value;
          if (isExternalImportOutsideLib(filename, source)) {
            context.report({
              message: `外部パッケージ「${source}」を app/lib 外で直接 import している。app/lib にラッパー（腐敗防止層）を作り経由する。`,
              node: stmt,
            });
          }
          if (isIconifyImportOutsideLib(filename, source)) {
            context.report({
              message: `アイコンの仮想指定子「${source}」を app/lib/iconify 外で import している。app/components/icon の Icon と IconName を経由する。`,
              node: stmt,
            });
          }
        }
      },
    };
  },
};
