import type { ArchRule, ProgramNode, RuleContext } from "./types.ts";

// architecture.md の深さ表に対応する、各層の規定サブディレクトリ。
const FEATURE_SUBDIRS = new Set(["api", "assets", "components", "hooks", "types", "utils"]);
const ROUTE_SUBDIRS = new Set(["_components"]);

function segmentsAfterApp(filename: string): string[] | null {
  const parts = filename.split("/");
  const i = parts.indexOf("app");
  return i === -1 ? null : parts.slice(i + 1);
}

function featureViolation(rest: string[]): boolean {
  // rest = [feature, ...(subdir/file)]。feature 直下のファイルまでは許容
  if (rest.length < 3) return false;
  // サブ feature / 規定外ディレクトリは禁止
  if (!FEATURE_SUBDIRS.has(rest[1])) return true;
  // components は 2 階層まで
  if (rest[1] === "components" && rest.length - 3 > 2) return true;
  return false;
}

function routeViolation(rest: string[]): boolean {
  // rest = [route, ...(subdir/file)]。route 直下のファイル（route.tsx 等）は許容
  if (rest.length < 3) return false;
  // サブ route / 規定外ディレクトリは禁止
  if (!ROUTE_SUBDIRS.has(rest[1])) return true;
  // _components は 1 階層まで
  if (rest.length - 3 > 1) return true;
  return false;
}

/**
 * `architecture.md` のネスト深さ表に違反するファイルパスか判定する
 * （features/routes の入れ子禁止、components/_components の深さ上限）。
 * @param filename - 判定対象のファイルパス
 */
export function exceedsNestingDepth(filename: string): boolean {
  const seg = segmentsAfterApp(filename);
  if (seg === null || seg.length === 0) return false;
  const [root, ...rest] = seg;
  if (root === "features") return featureViolation(rest);
  if (root === "routes") return routeViolation(rest);
  // 共有 components は 2 階層まで
  if (root === "components") return rest.length - 1 > 2;
  return false;
}

/** architecture.md のネスト深さ表を強制する oxlint ルール。 */
export const maxNestingDepthRule: ArchRule = {
  create(context: RuleContext) {
    return {
      Program(node: ProgramNode) {
        if (exceedsNestingDepth(context.getFilename())) {
          context.report({
            message:
              "ディレクトリのネストが architecture.md の深さ制限を超えている。サブ feature/route を作らず規定のサブディレクトリに収める。",
            node,
          });
        }
      },
    };
  },
};
