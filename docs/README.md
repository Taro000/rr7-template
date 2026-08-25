# docs

設計判断と実装計画の置き場。`issue-to-pr` / `tdd-implement` スキルがここを読み書きする。

## ディレクトリ

| ディレクトリ | 何を置くか                                                          | いつ書くか                   |
| ------------ | ------------------------------------------------------------------- | ---------------------------- |
| `adr/`       | **設計判断の記録**（ADR）。なぜその選択にしたか、他に何を検討したか | 設計上の判断があったときだけ |
| `features/`  | **実装計画**。何をどの層にどう作るか、TDD のタスク分解              | 実装に入る前に必ず           |
| `agents/`    | エージェント運用の手順書                                            | パイプラインを変えたとき     |

**ADR と実装計画は 1:1 でペアにする**（同じ日付・同じ slug）。設計判断がない機能追加では ADR を作らず、
実装計画だけを書く。逆に ADR だけを書いて実装計画を書かないことはない。

## ファイル命名

```
docs/adr/YYYY-MM-DD-<slug>.md
docs/features/YYYY-MM-DD-<slug>.md
```

- `slug`: 英語 kebab-case（例: `use-rag-engine`, `switch-to-firestore`）
- 日付: ADR は判断日、実装計画は計画作成日
- `_template.md` は雛形（アンダースコア始まりで実ファイルと区別する）

## 書き方

- ADR → `adr/_template.md` をコピー（仕様の正は `.claude/skills/issue-to-pr/references/adr-template.md`）
- 実装計画 → `features/_template.md` をコピー

## ADR のステータス

| ステータス | 意味                      |
| ---------- | ------------------------- |
| proposed   | 提案中（レビュー待ち）    |
| accepted   | 採用済み                  |
| superseded | 後続の ADR で置き換え済み |
| deprecated | 非推奨（廃止予定）        |
