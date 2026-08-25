---
to: app/routes/<%= h.changeCase.kebab(route) %>/_components/<%= h.changeCase.kebab(name) %>.spec.tsx
unless_exists: true
---
<% const Name = h.changeCase.pascal(name) -%>
<% const file = h.changeCase.kebab(name) -%>
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { <%= Name %> } from "./<%= file %>";

describe("<%= Name %>（コンポーネント）", () => {
  it("子要素を表示する", () => {
    render(<<%= Name %>>テスト</<%= Name %>>);
    expect(screen.getByText("テスト")).toBeInTheDocument();
  });
});
