---
to: app/routes/<%= h.changeCase.kebab(route) %>/_components/<%= h.changeCase.kebab(name) %>.stories.tsx
unless_exists: true
---
<% const Name = h.changeCase.pascal(name) -%>
<% const file = h.changeCase.kebab(name) -%>
<% const routeName = h.changeCase.kebab(route) -%>
import type { Meta, StoryObj } from "@storybook/react-vite";

import { <%= Name %> } from "./<%= file %>";

const meta = {
  title: "Routes/<%= routeName %>/<%= Name %>",
  component: <%= Name %>,
  tags: ["autodocs"],
} satisfies Meta<typeof <%= Name %>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
