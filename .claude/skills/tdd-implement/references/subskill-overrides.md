# サブスキルの既定を上書きする

| サブスキル                  | 既定の挙動                                               | このスキルでの上書き                                                                                 |
| --------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| test-driven-development     | 汎用のテストコマンド例                                   | `.claude/rules/test.md`（無ければ `CLAUDE.md`）に従い vitest を使う                                  |
| subagent-driven-development | 実装は逐次・並列ディスパッチ禁止                         | 独立タスクは **worktree で隔離して並列**                                                             |
| subagent-driven-development | 各タスクで commit、最後に finishing-a-development-branch | **commit/merge/PR しない**。レビューと統合は worktree の差分(patch)で行い、`main` に未コミットで反映 |
| 全体                        | フィーチャーブランチで作業                               | `main` 上で作業し、**ブランチも作らない**                                                            |
