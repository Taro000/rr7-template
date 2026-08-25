---
name: create-branch
description: GitHub issue から作業ブランチ（base=main、`claude/issue-<番号>-<slug>` 命名）をローカルに切りたいときに使う。push はしない。`issue-to-pr` から合成される。
argument-hint: "<issue番号> [slug]"
model: inherit
---

# create-branch

## 概要

issue を起点に、base=main から規約名のブランチ `claude/issue-<番号>-<slug>` を作るだけの小さなスキル。
**push はしない**（push と PR は `create-pr`）。`issue-to-pr` の Step 5 として合成される。

## いつ使うか

- issue に対応する作業ブランチを規約名で切りたいとき
- 使わない場面: push / PR まで要る → `create-pr`／一連を自走 → `issue-to-pr`

## 前提・入力

- **引数**: `<issue番号>`（必須）と `[slug]`（省略時はタイトルから生成）。
- **作業前提**: `main` 上、または main から分岐できる状態。
  未コミットの変更があれば**そのまま新ブランチへ持ち越す**（`issue-to-pr` では ADR・計画がこれに当たる）。

## ワークフロー

1. **slug 決定**: 引数 slug があれば採用。無ければ `gh issue view <番号> --json title` のタイトルから
   英語 kebab-case の短い slug を作る（記号除去・小文字・ハイフン区切り）。
2. **ブランチ名**: `claude/issue-<番号>-<slug>`。
   既に同名が存在すれば（`git rev-parse --verify` で確認）**停止して報告**（上書きしない）。
3. **作成**: main を基点に作る。未コミットの変更は新ブランチへ引き継がれる。
   ```bash
   git switch main          # 既に main ならスキップ可
   git switch -c claude/issue-<番号>-<slug>
   ```
4. **報告**: 作成したブランチ名を伝える。

## よくある間違い

| 間違い                     | 対処                                              |
| -------------------------- | ------------------------------------------------- |
| main 以外を基点に切る      | base は main                                      |
| push する                  | push / PR は `create-pr` の責務。ここでは作らない |
| 既存ブランチ名を上書きする | 同名があれば停止・報告                            |
| 未コミット変更を捨てる     | `switch -c` は変更を持ち越す。stash / 破棄しない  |
| slug が長い / 日本語       | 英語 kebab-case で短く                            |
