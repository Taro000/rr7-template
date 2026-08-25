import { Counter } from "~/components/counter";
import { Icon } from "~/components/icon/icon";

import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "rr7-template" },
    { name: "description", content: "React Router v7 プロジェクトテンプレート" },
  ];
}

export default function Home() {
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="flex items-center gap-2 text-4xl font-bold">
        <Icon name="home" aria-label="ホーム" className="text-primary" />
        rr7-template
      </h1>
      <p className="text-base-content/70">React Router v7 + Tailwind CSS v4 + daisyUI</p>
      <Counter />
    </main>
  );
}
