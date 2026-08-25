import type { Meta, StoryObj } from "@storybook/react-vite";

import { Icon } from "./icon";

const meta = {
  title: "Components/Icon",
  component: Icon,
  tags: ["autodocs"],
  args: {
    name: "home",
  },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// aria-label を渡すと意味を持つアイコン（role="img" ＋ ラベル）になる。
export const Labeled: Story = {
  args: {
    name: "search",
    "aria-label": "検索",
  },
};

export const Large: Story = {
  args: {
    name: "settings",
    size: "3rem",
  },
};

// currentColor なので text 色クラスでテーマに追従する。
export const Themed: Story = {
  args: {
    name: "user",
    size: "2rem",
    className: "text-primary",
  },
};
