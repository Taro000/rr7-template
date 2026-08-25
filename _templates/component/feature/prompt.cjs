// 引数省略時に対話で feature / name を補う（type: module 下で require されるため .cjs にする）。
module.exports = [
  {
    type: "input",
    name: "feature",
    message: "Feature name (kebab, 例: user-profile):",
  },
  {
    type: "input",
    name: "name",
    message: "Component name (例: UserCard):",
  },
];
