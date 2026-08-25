import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Icon } from "./icon";

describe("Icon（アイコン）", () => {
  it("既定で装飾的な svg を描画する（aria-hidden 付き、img role なし）", () => {
    const { container } = render(<Icon name="home" />);
    const svg = container.querySelector("svg");

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("aria-label 指定時は role=img とアクセシブル名を露出する", () => {
    render(<Icon name="search" aria-label="検索" />);
    const svg = screen.getByRole("img", { name: "検索" });

    expect(svg).toBeInTheDocument();
    expect(svg).not.toHaveAttribute("aria-hidden");
  });

  it("size の既定は width / height とも 1em", () => {
    const { container } = render(<Icon name="menu" />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("width", "1em");
    expect(svg).toHaveAttribute("height", "1em");
  });

  it("size prop を width / height に反映する", () => {
    const { container } = render(<Icon name="menu" size="2rem" />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("width", "2rem");
    expect(svg).toHaveAttribute("height", "2rem");
  });

  it("className を svg に渡す（currentColor によるテーマ追従）", () => {
    const { container } = render(<Icon name="close" className="text-primary" />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveClass("text-primary");
  });
});
