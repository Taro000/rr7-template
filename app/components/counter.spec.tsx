import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Counter } from "./counter";

describe("Counter（カウンタ）", () => {
  it("初期値を表示する", () => {
    render(<Counter initial={5} />);
    expect(screen.getByLabelText("count")).toHaveTextContent("5");
  });

  it("+ボタン押下で step だけ増える", async () => {
    const user = userEvent.setup();
    render(<Counter initial={0} step={2} />);

    await user.click(screen.getByRole("button", { name: "+2" }));
    await user.click(screen.getByRole("button", { name: "+2" }));

    expect(screen.getByLabelText("count")).toHaveTextContent("4");
  });

  it("-ボタン押下で step だけ減る", async () => {
    const user = userEvent.setup();
    render(<Counter initial={3} />);

    await user.click(screen.getByRole("button", { name: "-1" }));

    expect(screen.getByLabelText("count")).toHaveTextContent("2");
  });
});
