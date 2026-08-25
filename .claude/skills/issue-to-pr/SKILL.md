---
name: issue-to-pr
description: refine 済み（`ready` ラベル）の GitHub issue を、人の確認を「実装計画の承認」1 点に絞って、ADR・実装計画づくりから TDD 実装・PR 作成までローカル Claude Code で自走させたいときに使う。番号省略時は ready＋Projects Priority 最優先の 1 件を選ぶ。1 起動 = 1 issue = 1 PR。
argument-hint: "[issue番号]"
disable-model-invocation: true
model: inherit
---

# issue-to-pr

## 概要

refine 済み（`ready`）の issue を起点に、**実装計画の承認1点だけを人間ゲート**にして、plan 立案 →
TDD 実装 → PR までを自走させるオーケストレータ・スキル。新規 CI は作らない。**1 起動 = 1 issue = 1 PR。**

- **計画づくり（ADR 化＋実装計画）は本スキルが担う**。設計の壁打ちと計画化は
  `superpowers:brainstorming` / `superpowers:writing-plans` を合成し、保存先・ゲートを上書きする。
- **実装以降は既存スキルを再利用**: `tdd-implement`（TDD 実装）/ `commit`（コミット）を合成し、
  `create-branch` / `create-pr`（本リポジトリの新規スキル）でブランチと PR を作る。

パイプライン: issue 選定 →（plan mode で）plan 立案 → **plan 承認（`ExitPlanMode`＝唯一の人間ゲート）**
→ auto mode で ADR・計画を保存 → `create-branch` → `tdd-implement` → PR 前レビュー → `commit` → `create-pr`。

## いつ使うか

- `ready` ラベル付き（refine 済み）の**実装単位**の issue を、計画承認だけ確認して PR まで進めたいとき
- 使わない場面:
  - issue が未 refine（`ready` でない）/ 本文が曖昧 → 先に `refine-issue`
  - **PBI（アンブレラ）**: 1 issue = 1 PR には不向き。`refine-issue` で subtask に割り、各 subtask/技術タスクに回す
  - 計画から実装だけしたい（計画が既にある）→ `tdd-implement`
  - PR の自動マージ（**対象外**。マージは人）

## 前提・入力

- **引数**: issue 番号（省略可）。省略時は `ready`＋Projects Priority 最優先を 1 件自動選定。
- **gh 認証**: `read:project` スコープ必須（不足時 `gh auth refresh -s read:project`）。PR 作成に `repo` も必要。
- **GitHub Projects**: 対象 issue が Project に載り、`Priority`（P0 > P1 > P2）が付いていること（無いと最劣後）。
- **ラベル**: 対象 issue に `ready`。
- **作業前提**: クリーンな `main` 上で起動する（未コミットの変更が無いこと）。
- **ADR 形式**: `references/adr-template.md`。

## ワークフロー

各ステップを TodoWrite でタスク化し、順番に実行する。

### Step 1 — issue を 1 件選定し、種別を確かめる

- **番号指定あり**: `gh issue view <番号> --json number,title,body,labels,url,state --comments` で取得。
  `ready` ラベルが無ければ警告し、続行可否をユーザーに確認する（refine 未了の疑い）。
- **番号省略**: `ready`＋Priority 最優先（同位は番号昇順）の 1 件を選ぶ。選定コマンドは
  [references/select-ready-issue.md](references/select-ready-issue.md) を参照。
  該当 0 件（`null`）なら**停止**して報告する（ready な候補が無い）。
- **種別判定**（labels）:
  - **PBI**: 本ループは実装単位向け。停止して `refine-issue` での分割を案内する
    （続行を強く望まれた場合のみ技術タスク扱いで進める）。
  - **subtask / tech**: そのまま進む（subtask は本文に実装方針(How)を持つ。これを計画の入力にする）。
- 選定した issue を 1 件だけ提示する（**1 起動 = 1 issue**。複数は扱わない）。
- 英語 kebab-case の `<slug>` と本日日付 `YYYY-MM-DD` を決める（ADR・計画・ブランチで共用）。

### Step 2 — plan mode で実装計画を立案する

- **`EnterPlanMode` で plan mode に入る。** plan mode は編集を禁止するため、ここでは**ファイルを書かない**
  （内容のドラフトだけ作る）。
- **REQUIRED SUB-SKILL: superpowers:brainstorming** で要件・設計を壁打ちする。
  - 機能要件・非機能要件（性能・セキュリティ・アクセシビリティ・i18n・運用 など）・設計疑問を 1 問ずつ詰める。
  - **設計判断（トレードオフのある選択）の有無を見極める**: あれば 2〜3 案を比較し推奨案を出す（→ ADR）。
    無ければ ADR は作らず計画に集中する。subtask は本文の How を計画の入力にする。
- 設計判断があれば、`references/adr-template.md` の形式で **ADR 内容**をドラフトする。
- **REQUIRED SUB-SKILL: superpowers:writing-plans** で **実装計画**（変更ファイル・手順レベル）をドラフトする。
  入力は issue 本文（＋ ADR があればそれ）。AI がそのまま実装に移せる粒度にする。

### Step 3 — plan 承認（唯一の人間ゲート）

- **HARD GATE: `ExitPlanMode` で実装計画を提示し、ユーザー承認を得る。** これが本ループ唯一の人間ゲート。
- **非承認なら中断**（実装に入らない・ファイルも書かない）。
- 承認後は**逐次承認を求めず自走する**。**無人運用するなら、承認時に auto-accept（または事前に
  accept-edits / auto モード）を有効にしておく** — plan mode / auto mode は Claude Code の権限モードであり、
  スキルからは強制できない。

### Step 4 — auto mode で ADR・計画を保存する

- 承認後（plan mode を抜けた後）に、Step 2 で作った内容を保存する:
  - ADR: `docs/adr/YYYY-MM-DD-<slug>.md`（**設計判断があるときだけ**。`references/adr-template.md` の形式）
  - 計画: `docs/features/YYYY-MM-DD-<slug>.md`（**常に**。冒頭で対応 ADR と Issue #N にリンク）
- 日付・slug は ADR・計画で共通にし、対応を追えるようにする。

### Step 5 — 作業ブランチを作る

- **REQUIRED SUB-SKILL: create-branch** で、base=main から `claude/issue-<n>-<slug>` を作る。
  Step 4 の未コミット変更（ADR・計画）はブランチへ持ち越す。

### Step 6 — TDD 実装する

- **REQUIRED SUB-SKILL: tdd-implement** で、Step 4 の計画を TDD 実装する。
  - **上書き**: tdd-implement の「main で作業」→ **Step 5 のブランチ上で実装**（main では作業しない）。
    「commit しない」は維持（コミットは Step 8）。

### Step 7 — PR 前レビュー（ブランチ全差分）

- **REQUIRED SUB-SKILL: superpowers:requesting-code-review** で、`main` からの**ブランチ全差分**
  （`git diff main...HEAD`）をレビューする。
- **軽微な指摘** → 自動修正 → 再レビュー（合格までループ）。
  - **ロック済みテスト（`.tdd-lock`）は修正しない**（TDD テストガードが deny。必要なら停止して人へ）。
- **設計級・曖昧な指摘** → **停止して人へ報告**（無人で設計判断しない。必要なら draft PR ＋ メモ）。

### Step 8 — コミットする

- ADR・計画・実装を**ステージ**する: `git add -A`（`commit` スキルは自分で add しないため、ここで add する）。
- **REQUIRED SUB-SKILL: commit** で /commit 規約のメッセージでコミットする。

### Step 9 — PR を作る

- **REQUIRED SUB-SKILL: create-pr** で、ブランチを push し PR を作る
  （base=main、本文に `Closes #<n>`、ADR/計画へのリンク）。
- PR の URL を報告して完了（**マージはしない**）。

## サブスキルの既定を上書きする

> 一覧は [references/subskill-overrides.md](references/subskill-overrides.md) を参照。

## 失敗時

- **plan 非承認** → 中断（実装に入らない・ファイルも書かない）。
- **テストが通らない / 設計級の指摘 / ゲート相当の判断** → PR を出さず**停止して報告**
  （必要なら draft PR ＋ メモ。draft は `create-pr` の `--draft`）。
- **ready な候補が無い**（番号省略時）→ 停止して報告。
- **対象が PBI** → 停止して `refine-issue` での分割を案内。

## 判断フロー（迷いやすい分岐）

> フロー図は [references/decision-flow.md](references/decision-flow.md) を参照。

## よくある間違い

> 一覧は [references/common-mistakes.md](references/common-mistakes.md) を参照。
