---
name: cloud-issue-to-pr
description: Claude Code on the web のクラウド無人セッション専用（Routine から起動される。ローカルの対話セッションでは使わない → issue-to-pr）。「Issue #<番号>: <タイトル>」形式のペイロードを受け取り、`ready for dev` ラベル付き issue を人間の確認なしで PR 作成まで進めるときに使う。1 起動 = 1 issue = 1 PR。
argument-hint: "[issue番号]"
model: inherit
---

# cloud-issue-to-pr

## 概要

`ready for dev` ラベル付き issue のペイロードを起点に、**人間ゲートなし**で plan 立案 →
TDD 実装 → PR までを完走させる無人オーケストレータ・スキル（`issue-to-pr` のクラウド無人実行版）。
新規 CI は作らない。**1 起動 = 1 issue = 1 PR。**

- 「停止して人へ」は全て**「issue / PR コメントに状況を記録して終了」**に置き換える（→ `## 失敗時`）。
  **設計判断（トレードオフのある選択）は無人で下さない。**
- **計画づくり（ADR 化＋実装計画）は本スキルが担う**。`superpowers:writing-plans` を合成し、
  保存先・ゲートを上書きする（`superpowers:brainstorming` は人へ質問する対話スキルのため合成しない）。
- **実装以降は既存スキルを再利用**: `tdd-implement`（TDD 実装）/ `commit`（コミット）を合成し、
  `create-branch` / `create-pr` でブランチと PR を作る。

パイプライン: ペイロード受領＋ガード検証 → plan 立案 → **無人ゲート（計画の自己検証）**
→ ADR・計画を保存 → `create-branch` → `tdd-implement` → PR 前レビュー → `commit` → `create-pr`。

## いつ使うか

- Claude Code on the web の無人クラウドセッション（Routine 起動）で、`ready for dev` ラベル付き
  issue を PR まで進めるとき（起動経路は `docs/agents/claude-code-web-setup.md`）
- 使わない場面:
  - **ローカルの対話セッション** → `issue-to-pr`（plan 承認の人間ゲートあり）
  - issue が未 refine / 本文が曖昧 → 先に `refine-issue`（ローカルで人が回す）
  - **PBI（アンブレラ）**: 1 issue = 1 PR には不向き → ガードで終了し、分割を促す
  - PR の自動マージ（**対象外**。マージは人）

## 前提・入力

- **入力**: Routine ペイロード「`Issue #<番号>: <タイトル>`（改行 2 つ）`<本文>`」。
  手動パイロット時は issue 番号の引数でも可。
- **gh 認証**: issue の取得・コメントと PR 作成ができること（クラウドセッションの GitHub トークン）。
- **ラベル**: 対象 issue に `ready for dev`。
- **作業前提**: クリーンな `main` 上で起動する（クラウドセッションは checkout 直後の `main` で満たされる）。
- **ADR 形式**: [../issue-to-pr/references/adr-template.md](../issue-to-pr/references/adr-template.md)。

## ワークフロー

各ステップを TodoWrite でタスク化し、順番に実行する。

### Step 1 — ペイロードを解析し、ガードを検証する

- ペイロード 1 行目「`Issue #<番号>: <タイトル>`」から issue 番号を抽出する
  （手動パイロット時は引数の issue 番号でも可）。
- ペイロード本文は起動時点のスナップショットで切り詰められている可能性があるため、
  `gh issue view <番号> --json number,title,body,labels,url,state --comments` の取得結果を正とする。
- **ガード検証** — 該当したら理由を issue コメントに残して**終了**する（人に確認せず、実装に入らない）:
  - state が OPEN でない → クローズ済みのため実装しない旨をコメント
  - `ready for dev` ラベルが無い → refine 未了・誤配の疑いをコメント
  - **PBI** ラベル → 実装単位でない。`refine-issue` での subtask 分割を促すコメント
- 英語 kebab-case の `<slug>` と本日日付 `YYYY-MM-DD` を決める（ADR・計画・ブランチで共用）。

### Step 2 — 実装計画を立案する

- **plan mode には入らない**（無人セッションに承認者はいない）。ただしファイルの保存は
  Step 3 の無人ゲート通過後（Step 4）まで行わず、内容のドラフトだけ作る。
- `superpowers:brainstorming` は使わない（1 問ずつ人へ質問する対話スキルのため）。代わりに
  issue 本文（subtask の How・受け入れ条件）・リンクされている `docs/adr/`・関連コードを読み、
  要件と設計疑問を自己解決する。
- **設計判断（トレードオフのある選択）の扱い**:
  - 答えが issue 本文・既存 `docs/adr/` に明示されている → それを根拠に ADR 内容をドラフトする
    （形式は前提・入力のテンプレ。**判断を新規発明しない**）
  - 答えがどこにも無い → **実装せず**、選択肢の比較と分析を issue コメントに残して終了（→ `## 失敗時`）
  - 設計判断を伴わない実装詳細の軽微な選択 → 保守的な既定を選び、選択理由を計画に明記する
- **REQUIRED SUB-SKILL: superpowers:writing-plans** で **実装計画**（変更ファイル・手順レベル）を
  ドラフトする。入力は issue 本文（＋ ADR ドラフトがあればそれ）。AI がそのまま実装に移せる粒度にする。
  不明点が出ても人へ質問しない（上記の分岐で処理する）。

### Step 3 — 無人ゲート（計画の自己検証）

- `ExitPlanMode` によるユーザー承認は行わない。代わりに計画を次のチェックリストで自己検証する:
  1. issue の受け入れ条件を計画のタスクが全てカバーしているか
  2. 未解決の設計判断（トレードオフのある選択）が計画に残っていないか
  3. 受け入れ条件外の変更・issue に明記の無い依存追加を含んでいないか
- 1 つでも NO → 実装に入らず、分析を issue コメントに記録して終了（→ `## 失敗時`）。
- 全て YES → 以降は Step 9 まで一切の確認なしで自走する
  （`AskUserQuestion` / `ExitPlanMode` を呼ばない）。

### Step 4 — ADR・計画を保存する

- 無人ゲート通過後に、Step 2 で作った内容を保存する:
  - ADR: `docs/adr/YYYY-MM-DD-<slug>.md`（**設計判断があるときだけ**。形式は前提・入力のテンプレ）
  - 計画: `docs/features/YYYY-MM-DD-<slug>.md`（**常に**。冒頭で対応 ADR と Issue #N にリンク）
- 日付・slug は ADR・計画で共通にし、対応を追えるようにする。

### Step 5 — 作業ブランチを作る

- **REQUIRED SUB-SKILL: create-branch** で、base=main から `claude/issue-<n>-<slug>` を作る。
  Step 4 の未コミット変更（ADR・計画）はブランチへ持ち越す。

### Step 6 — TDD 実装する

- **REQUIRED SUB-SKILL: tdd-implement** で、Step 4 の計画を TDD 実装する。
  - **上書き**: tdd-implement の「main で作業」→ **Step 5 のブランチ上で実装**（main では作業しない）。
    「commit しない」は維持（コミットは Step 8）。
  - **無人フォールバック**（tdd-implement の AskUserQuestion ゲート 2 箇所）:
    - ロック済みテスト（`.tdd-lock`）の修正が必要になったら: AskUserQuestion せず実装を止め、
      修正理由と状況を記録して終了（→ `## 失敗時`）。ロックを勝手に外さない。
    - 計画/設計の変更が必要になったら（tdd-implement Step 3 の HARD GATE 相当）:
      設計判断を**伴わない**手順レベルの微修正は `docs/features` の計画を更新して続行し、変更内容を
      PR 本文に明記する。設計判断を**伴う**変更は実装を止め、分析を記録して終了（→ `## 失敗時`）。
  - **テスト失敗の自走修正は同一の失敗につき 3 回まで**。3 回で green にならなければ終了（→ `## 失敗時`）。

### Step 7 — PR 前レビュー（ブランチ全差分）

- **REQUIRED SUB-SKILL: superpowers:requesting-code-review** で、`main` からの**ブランチ全差分**
  （`git diff main...HEAD`）をレビューする。
- **軽微な指摘** → 自動修正 → 再レビュー（合格までループ）。
  - **ロック済みテスト（`.tdd-lock`）は修正しない**（必要になったら → `## 失敗時`）。
- **設計級・曖昧な指摘** → 無人で設計判断しない。draft PR ＋ コメントで終了（→ `## 失敗時`）。

### Step 8 — コミットする

- ADR・計画・実装を**ステージ**する: `git add -A`（`commit` スキルは自分で add しないため、ここで add する）。
- **REQUIRED SUB-SKILL: commit** で /commit 規約のメッセージでコミットする。

### Step 9 — PR を作る

- **REQUIRED SUB-SKILL: create-pr** で、ブランチを push し PR を作る
  （base=main、本文に `Closes #<n>`、ADR/計画へのリンク）。
  push 前の同意確認は合成時例外により**省く**（同意は Step 3 の無人ゲート通過に集約）。
- PR の URL を報告して完了（**マージはしない**）。

## サブスキルの既定を上書きする

> 一覧は [references/subskill-overrides.md](references/subskill-overrides.md) を参照。

## 失敗時（無人失敗プロトコル）

人間ゲートは無い。停止が必要になったら、次の手順で**状況を記録して終了**する
（人は次の行動をコメントで判断する）:

1. 何を試み・何が失敗し・何が未完かを整理する。
2. **ブランチに残す価値のある変更がある**（実装途中など）→ `git add -A` → `commit` →
   `create-pr` を `--draft` で実行し、PR 本文と PR コメントに状況・原因分析・残タスクを記録する。
3. **残す価値が無い**（計画段階・ガード不成立）→ issue コメントに記録する（ファイルは書かない）。
4. 終了する。リトライや人への質問はしない。**黙って終了しない**（コメントは必須）。

ケース別の帰結:

- ガード不成立（ラベル無し / PBI / クローズ済み）→ issue コメント → 終了
- 設計判断が issue・既存 ADR で解決できない → 分析付き issue コメント → 終了
- 無人ゲート（Step 3）不通過 → issue コメント → 終了
- テスト失敗 3 回 / ロック済みテスト修正が必要 / レビューで設計級の指摘
  → draft PR ＋ PR コメント（PR 未作成なら issue コメント）→ 終了

## 判断フロー（迷いやすい分岐）

> フロー図は [references/decision-flow.md](references/decision-flow.md) を参照。

## よくある間違い

> 一覧は [references/common-mistakes.md](references/common-mistakes.md) を参照。
