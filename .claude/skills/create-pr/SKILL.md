---
name: create-pr
description: 現在の作業ブランチを push して GitHub PR（base=main、本文に `Closes #<番号>`、ADR/計画リンク）を作りたいときに使う。マージはしない。`issue-to-pr` / `cloud-issue-to-pr` から合成される。
argument-hint: "[issue番号]"
model: inherit
---

# create-pr

## 概要

現在の作業ブランチを `origin` に push し、`gh` で `main` 向けの PR を作るスキル。
PR 本文に `Closes #<番号>` と ADR/実装計画へのリンクを入れる。**マージはしない**（マージは人）。
`issue-to-pr` / `cloud-issue-to-pr` の Step 9 として合成される。

## いつ使うか

- 作業ブランチの実装が済み、PR を作りたいとき
- 使わない場面: まだ実装中／ブランチが無い → 先に実装・`create-branch`

## 前提・入力

- **引数**: `[issue番号]`（省略時はブランチ名 `claude/issue-<n>-...` から抽出）。
- **gh 認証**: `repo` スコープ（PR 作成に必要）。
- **作業前提**: `main` 以外の作業ブランチ上で、`main` との差分（コミット）があること。
- **PR 本文の構造**: `.github/PULL_REQUEST_TEMPLATE.md` に従う（節の追加・削除をしない）。

## ワークフロー

1. **コンテキスト収集**（並列）:
   - `git branch --show-current`（`main` なら**停止**：作業ブランチが必要）
   - `git log --oneline main..HEAD`（差分コミットの確認。0 件なら**停止**）
   - issue 番号（引数 or ブランチ名 `claude/issue-<n>-...` から抽出）
2. **HARD GATE: push + PR 作成の同意を取る**（AskUserQuestion）。
   - **上書き例外**: `issue-to-pr` / `cloud-issue-to-pr` から合成されたときはこの確認を**省く**
     （`issue-to-pr` は plan mode 承認で、`cloud-issue-to-pr` は無人ゲート通過で同意済み）。
3. **push**: `git push -u origin <ブランチ名>`。
4. **PR 本文ドラフト**: `.github/PULL_REQUEST_TEMPLATE.md` を読み、その節（概要 / `Closes #<番号>` /
   変更内容 / 関連ドキュメント / 確認）を埋める。ADR/計画は `docs/adr/...`・`docs/features/...` への
   リンクで入れる。
5. **PR 作成**: `--body` を渡すと GitHub のテンプレ自動適用は**上書きされる**ため、Step 4 で埋めた
   テンプレ本文を `--body-file -`（ヒアドキュメント）で渡す。

   ```bash
   gh pr create --base main --head <ブランチ名> --title "<タイトル>" --body-file - <<'EOF'
   ## 概要

   <変更概要>

   Closes #<番号>

   ## 変更内容

   - <変更点>

   ## 関連ドキュメント

   - 計画: docs/features/YYYY-MM-DD-<slug>.md
   - ADR: docs/adr/YYYY-MM-DD-<slug>.md   # ある場合

   ## 確認

   - [ ] npm test / typecheck / lint / build
   EOF
   ```

   - テスト未通過・設計級の停止など**未完で出すときは `--draft`** を付け、本文に理由メモを書く。

6. **報告**: PR の URL を伝える。

## ルール

- **マージはしない**（`gh pr merge` を呼ばない）。マージは人。
- `--force` push しない。`main` へ直接 push しない。
- 既に同じブランチの PR があれば新規作成せず、その URL を報告する。

## よくある間違い

| 間違い                               | 対処                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| main から PR を作る / main に push   | 作業ブランチ上で。base=main, head=作業ブランチ                                       |
| `Closes #<n>` を入れ忘れる           | 本文に必ず入れて issue を自動クローズ                                                |
| ADR/計画リンクを省く                 | `docs/adr`・`docs/features` へのリンクを入れる                                       |
| テンプレを無視して本文を自己流で組む | `.github/PULL_REQUEST_TEMPLATE.md` の節を読んで埋める                                |
| 確認せず push（標準実行時）          | AskUserQuestion で同意（`issue-to-pr` / `cloud-issue-to-pr` 合成時は各ゲートに集約） |
| PR を自動マージ                      | しない。マージは人                                                                   |
| 未完なのに通常 PR                    | 未完は `--draft` ＋ 理由メモ                                                         |
