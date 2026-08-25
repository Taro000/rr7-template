---
name: tdd-implement
description: docs/features にある実装計画を、テスト駆動(TDD)で実装に移したいときに使う。対応する ADR と計画が用意済みの機能を、計画に沿ってコードとして実装する段階向け。計画ができた後の実装ステップ（`issue-to-pr` の実装段階に相当）。
argument-hint: <docs/features の計画ファイル>
model: inherit
---

# tdd-implement

## 概要

`docs/features` の実装計画を、**TDD でコードに落とす**ワークフロー・スキル。
次をオーケストレーションする: 計画の取り込み → 依存解析（並列の波分け）
→ 実装（subagent-driven-development × test-driven-development、独立タスクは worktree で並列）
→ 完了前の品質確認（verification-before-completion → systematic-debugging）。
**スキルからは commit / push / PR を一切しない**（変更は `main` のワーキングツリーに未コミットで残す）。

## いつ使うか

- `docs/features/…` に合意済みの実装計画があり、これからコードを書くとき
- 計画ができた後（`docs/features` に計画はあるが未実装の状態）
- 使わない場面: 計画が未確定なとき（先に `issue-to-pr` の計画段階）／設計判断のない軽微な修正

## 前提・入力

- **対象計画**: 引数で渡された `docs/features/YYYY-MM-DD-<slug>.md` を全文読む。未指定なら候補を提示して確認する。
- **設計の根拠**: 計画がリンクする `docs/adr/…` があれば読み、判断の背景を把握する。
- **テスト戦略**: `.claude/rules/test.md` を読む。**無ければ `CLAUDE.md` の「Testing」方針にフォールバック**する。
- **作業場所**: `main` 上で作業する。ブランチは作らない。コミットもしない。
- **テストガード**: RED 確認後のテストは `.tdd-lock` でロックし、PreToolUse フック
  （`.claude/hooks/tdd-test-guard.sh`）が改変・削除を deny する（運用は Step 2、規約は
  `.claude/rules/test.md`「テストガード」）。

## ワークフロー

各ステップを TodoWrite でタスク化し、順番に実行する。

### Step 1 — 計画の取り込みとタスク分解

- 計画から**全タスクを全文抽出**し、各タスクが**編集するファイル**を見積もる。
- 依存関係を解析し、依存のないタスク群（**wave**）に分ける。
  同一 wave 内で**編集ファイルが重ならない**タスク同士が並列対象（重なるものは逐次）。

### Step 2 — 実装（subagent-driven-development × TDD）

- **REQUIRED SUB-SKILL: superpowers:subagent-driven-development** でオーケストレーションする。
- 各 implementer サブエージェントは **REQUIRED SUB-SKILL: superpowers:test-driven-development** に従う
  （テスト先行 → RED 確認 → 最小実装 → GREEN）。テストコマンドは `.claude/rules/test.md`（無ければ `CLAUDE.md`）の
  方針に従い、`npx vitest run <file>` などで都度実行する。
- **テストガード（.tdd-lock）**: 各タスクで **RED 確認後**、当該テストパス（worktree ルート相対、1 行 1 パス）を
  その worktree の `.tdd-lock` に追記してロックする（GREEN / REFACTOR 中も維持、実装完了でクリア）。以降ロック済
  テストへの Edit / Write / 破壊的 Bash は PreToolUse フックが deny する（→ `.claude/rules/test.md`「テストガード」）。
  - **一時例外**: ロック済テストの修正が必要になったら**実装を止め**、AskUserQuestion で修正理由を提示して許可を取る。
    許可時のみ `.tdd-lock` から当該行を一時除去 → 修正 → 再追記。勝手に書き換えない。
- タスクごとに**2段階レビュー**（spec compliance → code quality）を必ず通す。レビューはワークツリー差分で行う。
- 独立タスクは「## 並列実行（worktree）」の手順で**並列ディスパッチ**する。
- **サブスキル既定の上書き**（下表）に従う。

### Step 3 — 設計/計画の変更が必要になったとき（HARD GATE）

- 実装中に計画・設計のままでは進めないと判明したら、**実装を止める**。
- **AskUserQuestion でユーザーの許可を必ず取る**（何を・なぜ変えるかを提示）。
- 許可後に**のみ** `docs/features/…`（計画）や `docs/adr/…`（設計判断）を更新する。勝手に変えない。
- 更新後、変更点を反映して実装を再開する。

### Step 4 — 完了前の品質確認

- **REQUIRED SUB-SKILL: superpowers:verification-before-completion**: 完了を主張する前に、
  検証コマンドを**実際に実行して証拠を得る**。最低限:
  `npm test` / `npm run typecheck` / `npm run lint` / `npm run build`。
- 失敗・予期せぬ挙動があれば **REQUIRED SUB-SKILL: superpowers:systematic-debugging** で
  根本原因から対処する（症状潰し禁止、失敗するテストで再現してから直す）→ 直したら再検証。
- 計画の**受け入れ条件を1項目ずつチェックリスト**で確認し、満たさない項目は埋める。

### Step 5 — 完了報告（コミットしない）

- 検証コマンドの出力（証拠）とともに完了を報告する。
- **commit / push / PR はしない。** 確定が必要なら `/commit` を一言案内するに留める。

## 並列実行（worktree）

> 手順は [references/parallel-worktree.md](references/parallel-worktree.md) を参照。

## サブスキルの既定を上書きする

> 一覧は [references/subskill-overrides.md](references/subskill-overrides.md) を参照。

## 判断フロー（迷いやすい分岐）

> フロー図は [references/decision-flow.md](references/decision-flow.md) を参照。

## よくある間違い

> 一覧は [references/common-mistakes.md](references/common-mistakes.md) を参照。
