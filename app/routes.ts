import { type RouteConfig, index } from "@react-router/dev/routes";

// route は自動検出されない。app/routes/ にファイルを作ったらここへ明示登録する。
// layout() / route() でネストを組む例は `react-router-framework-mode` スキルを参照。
export default [index("routes/home.tsx")] satisfies RouteConfig;
