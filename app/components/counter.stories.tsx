import type { Meta, StoryObj } from "@storybook/react-vite";

import { Counter } from "./counter";

const meta = {
  title: "Components/Counter",
  component: Counter,
  tags: ["autodocs"],
  args: {
    initial: 0,
    step: 1,
  },
} satisfies Meta<typeof Counter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StartFromTen: Story = {
  args: {
    initial: 10,
  },
};

export const BigStep: Story = {
  args: {
    step: 5,
  },
};
