---
to: app/components/<%= h.changeCase.kebab(name) %>.tsx
unless_exists: true
---
<% const Name = h.changeCase.pascal(name) -%>
import type { ReactNode } from "react";

/**
 * <%= Name %> の props。
 *
 * TODO: このコンポーネントに必要な props を定義する。
 */
export type <%= Name %>Props = {
  /** 中に表示する要素。 */
  children?: ReactNode;
};

/**
 * <%= Name %> を表示する。
 *
 * TODO: 呼び出し側目線の役割と「なぜ存在するか」を記述する。
 */
export function <%= Name %>({ children }: <%= Name %>Props) {
  return <div className="text-base-content">{children}</div>;
}
