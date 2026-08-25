import { describe, expect, it } from "vitest";

import { exceedsNestingDepth } from "./max-nesting-depth";
import {
  isExternalImportOutsideLib,
  isIconifyImportOutsideLib,
} from "./no-external-import-outside-lib";
import { isLegacyTestFile } from "./no-test-file";
import { specHasNoColocatedImport } from "./spec-colocation";

describe("isLegacyTestFile（レガシーテストファイル判定）", () => {
  it("*.test.ts(x) を検出する", () => {
    expect(isLegacyTestFile("app/components/Counter.test.tsx")).toBe(true);
    expect(isLegacyTestFile("app/utils/calc.test.ts")).toBe(true);
  });

  it("*.spec.ts(x) と非テストファイルは許可する", () => {
    expect(isLegacyTestFile("app/components/Counter.spec.tsx")).toBe(false);
    expect(isLegacyTestFile("app/components/Counter.tsx")).toBe(false);
  });

  it("ファイル名がそのまま test.ts や .test.js のものは検出しない", () => {
    expect(isLegacyTestFile("app/test.ts")).toBe(false);
    expect(isLegacyTestFile("app/a.test.js")).toBe(false);
  });
});

describe("isExternalImportOutsideLib（lib 外での外部 import 判定）", () => {
  it("app/lib 外での bare 外部 import を検出する", () => {
    expect(isExternalImportOutsideLib("app/components/Foo.tsx", "lodash")).toBe(true);
    expect(isExternalImportOutsideLib("app/features/todo/api/get.ts", "axios")).toBe(true);
  });

  it("app/lib 内の import は許可する", () => {
    expect(isExternalImportOutsideLib("app/lib/date/index.ts", "date-fns")).toBe(false);
  });

  it("react / react-dom / react-router の例外を許可する（サブパス・スコープ含む）", () => {
    expect(isExternalImportOutsideLib("app/components/Foo.tsx", "react")).toBe(false);
    expect(isExternalImportOutsideLib("app/components/Foo.tsx", "react-dom/client")).toBe(false);
    expect(isExternalImportOutsideLib("app/routes/home.tsx", "react-router")).toBe(false);
    expect(isExternalImportOutsideLib("app/root.tsx", "@react-router/node")).toBe(false);
  });

  it("相対 / エイリアス / node 組み込みを許可する", () => {
    expect(isExternalImportOutsideLib("app/components/Foo.tsx", "./Bar")).toBe(false);
    expect(isExternalImportOutsideLib("app/components/Foo.tsx", "~/utils/x")).toBe(false);
    expect(isExternalImportOutsideLib("app/components/Foo.tsx", "node:path")).toBe(false);
  });

  it("app/ 外のファイルは無視する", () => {
    expect(isExternalImportOutsideLib("custom-lint-rules/index.ts", "oxlint/plugins-dev")).toBe(
      false,
    );
  });
});

describe("isIconifyImportOutsideLib（iconify 仮想指定子の lib/iconify 外 import 判定）", () => {
  it("app/lib/iconify 外での ~icons/* import を検出する", () => {
    expect(
      isIconifyImportOutsideLib("app/components/icon/icon.tsx", "~icons/mingcute/home-1-line"),
    ).toBe(true);
    expect(
      isIconifyImportOutsideLib(
        "app/features/todo/components/todo.tsx",
        "~icons/mingcute/menu-line",
      ),
    ).toBe(true);
  });

  it("app/lib 内でも iconify サブディレクトリ外なら検出する（vendor 接触面は lib/iconify のみ）", () => {
    expect(isIconifyImportOutsideLib("app/lib/date/index.ts", "~icons/mingcute/close-line")).toBe(
      true,
    );
  });

  it("app/lib/iconify 内の ~icons/* は許可する", () => {
    expect(
      isIconifyImportOutsideLib("app/lib/iconify/registry.ts", "~icons/mingcute/home-1-line"),
    ).toBe(false);
    expect(isIconifyImportOutsideLib("app/lib/iconify/registry.ts", "~icons")).toBe(false);
  });

  it("~icons 以外の指定子（エイリアス / 外部 / 相対）は無視する", () => {
    expect(
      isIconifyImportOutsideLib("app/components/icon/icon.tsx", "~/lib/iconify/registry"),
    ).toBe(false);
    expect(isIconifyImportOutsideLib("app/components/icon/icon.tsx", "react")).toBe(false);
    expect(isIconifyImportOutsideLib("app/components/icon/icon.tsx", "./registry")).toBe(false);
  });

  it("app/ 外のファイルは無視する", () => {
    expect(isIconifyImportOutsideLib("vite.config.ts", "~icons/mingcute/home-1-line")).toBe(false);
  });
});

describe("exceedsNestingDepth（ネスト深さ超過判定）", () => {
  it("サブ feature を検出する（feature 直下の許可外サブディレクトリ）", () => {
    expect(exceedsNestingDepth("app/features/todo/sub/Thing.tsx")).toBe(true);
  });

  it("標準サブディレクトリと feature 直下のファイルは許可する", () => {
    expect(exceedsNestingDepth("app/features/todo/components/TodoList.tsx")).toBe(false);
    expect(exceedsNestingDepth("app/features/todo/hooks/useTodo.ts")).toBe(false);
    expect(exceedsNestingDepth("app/features/todo/types.ts")).toBe(false);
  });

  it("feature components の深さ 2 以下を強制する", () => {
    expect(exceedsNestingDepth("app/features/todo/components/a/b/Item.tsx")).toBe(false);
    expect(exceedsNestingDepth("app/features/todo/components/a/b/c/Item.tsx")).toBe(true);
  });

  it("サブ route を検出する（_components 以外のサブディレクトリ）", () => {
    expect(exceedsNestingDepth("app/routes/dashboard/sub/route.tsx")).toBe(true);
    expect(exceedsNestingDepth("app/routes/dashboard/_components/Card.tsx")).toBe(false);
  });

  it("route _components の深さ 1 以下を強制する", () => {
    expect(exceedsNestingDepth("app/routes/dashboard/_components/a/Card.tsx")).toBe(false);
    expect(exceedsNestingDepth("app/routes/dashboard/_components/a/b/Card.tsx")).toBe(true);
  });

  it("共有 components の深さ 2 以下を強制する", () => {
    expect(exceedsNestingDepth("app/components/a/b/Btn.tsx")).toBe(false);
    expect(exceedsNestingDepth("app/components/a/b/c/Btn.tsx")).toBe(true);
  });

  it("app/ 外のファイルは無視する", () => {
    expect(exceedsNestingDepth("custom-lint-rules/no-test-file.ts")).toBe(false);
  });
});

describe("specHasNoColocatedImport（コロケーション違反判定）", () => {
  it("./（同ディレクトリ）import を持たない spec を検出する", () => {
    expect(
      specHasNoColocatedImport("app/components/Counter.spec.tsx", ["~/components/Counter"]),
    ).toBe(true);
    expect(specHasNoColocatedImport("app/features/todo/todo.spec.ts", ["../utils/x"])).toBe(true);
  });

  it("./ の兄弟を import する spec は許可する", () => {
    expect(
      specHasNoColocatedImport("app/components/Counter.spec.tsx", ["./Counter", "vitest"]),
    ).toBe(false);
  });

  it("非 spec と app/ 外のファイルは無視する", () => {
    expect(specHasNoColocatedImport("app/components/Counter.tsx", ["~/x"])).toBe(false);
    expect(specHasNoColocatedImport("custom-lint-rules/rules.spec.ts", ["~/x"])).toBe(false);
  });
});
