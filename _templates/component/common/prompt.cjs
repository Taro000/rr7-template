// 引数省略時に対話で name を補う（type: module 下で require されるため .cjs にする）。
module.exports = [
  {
    type: "input",
    name: "name",
    message: "Component name (例: UserCard):",
  },
];
