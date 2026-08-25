// 引数省略時に対話で route / name を補う（type: module 下で require されるため .cjs にする）。
module.exports = [
  {
    type: "input",
    name: "route",
    message: "Route name (kebab, 例: dashboard):",
  },
  {
    type: "input",
    name: "name",
    message: "Component name (例: UserCard):",
  },
];
