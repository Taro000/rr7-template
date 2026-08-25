import { describe, expect, it } from "vitest";

import { iconRegistry, type IconName } from "./registry";

describe("iconRegistry（アイコン登録テーブル）", () => {
  it("各 IconName を描画可能なコンポーネントに対応付ける", () => {
    const names = Object.keys(iconRegistry) as IconName[];
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      // unplugin-icons の生成物は関数コンポーネント（forwardRef なら object）。どちらも描画可能。
      expect(["function", "object"]).toContain(typeof iconRegistry[name]);
    }
  });

  it("共通 UI アイコンセットでシードされている", () => {
    expect(Object.keys(iconRegistry).toSorted()).toEqual(
      [
        "add",
        "close",
        "copy",
        "edit",
        "home",
        "menu",
        "more",
        "notification",
        "pin",
        "search",
        "send",
        "settings",
        "trash",
        "user",
      ].toSorted(),
    );
  });
});
