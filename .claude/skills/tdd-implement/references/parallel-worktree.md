# 並列実行（worktree）

独立タスクは個別の worktree で隔離して並列実行し、結果を `main` のワーキングツリーへ**コミットせず**反映する。

1. タスクごとに一時 worktree を作る: `git worktree add --detach <dir> HEAD`
   （または実装サブエージェントを worktree 隔離で起動する）。同時書き込みの衝突を避けられる。
2. サブエージェントは worktree 内で TDD 実装する。**コミットはしない。**
3. 差分を取り出す（新規ファイル込み・コミット不要）: worktree 内で `git add -A` → `git diff --cached --binary`。
   `.tdd-lock` は gitignore されるため stage されず `main` へは伝播しない（ロック台帳は各 worktree ローカル）。
4. 取り出した差分で2段階レビュー（spec → code quality）を行い、修正は同じサブエージェントに戻す。
5. 承認後、差分を `main` のワーキングツリーへ反映: `git apply`（編集ファイルが重ならない wave は衝突しない）。
   重なる場合は逐次適用し、衝突したら systematic-debugging で解消。
6. 一時 worktree を削除: `git worktree remove <dir>`。
7. 最終状態は `main` に未コミットの変更のみ。**どの worktree のコミットも残さない。**
