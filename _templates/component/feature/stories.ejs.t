---
to: app/features/<%= h.changeCase.kebab(feature) %>/components/<%= h.changeCase.kebab(name) %>.stories.tsx
unless_exists: true
---
<% const Name = h.changeCase.pascal(name) -%>
<% const file = h.changeCase.kebab(name) -%>
<% const featureName = h.changeCase.kebab(feature) -%>
import type { Meta, StoryObj } from "@storybook/react-vite";

import { <%= Name %> } from "./<%= file %>";

const meta = {
  title: "Features/<%= featureName %>/<%= Name %>",
  component: <%= Name %>,
  tags: ["autodocs"],
} satisfies Meta<typeof <%= Name %>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
