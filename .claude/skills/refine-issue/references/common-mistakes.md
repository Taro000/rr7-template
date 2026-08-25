# よくある間違い

| 間違い                                                                    | 対処                                                                                         |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 種別ラベルが無いのに本文構造を当てずっぽうで決める                        | Step 1 で AskUserQuestion で種別を確認し、ラベルを付与する                                   |
| AskUserQuestion の同意前に `gh issue edit` / `gh issue create` する       | 必ず Step 5 / Step 6 の AskUserQuestion ゲートを通す                                         |
| CLI 起票でフォーム構造・親参照・`subtask` ラベルを付け忘れる              | Forms と同じ `###` 構造＋`--label subtask`＋親 `#N` を必ず付ける                             |
| サブタスクのタイトルに `[T<n>]` を付け忘れる                              | `[T<n>] <要約>`。PBI ごと採番、既存があれば最大値の続きから                                  |
| 依存の `#N` を起票前に書こうとして失敗する                                | 二パス。パス1で起票し番号回収、パス2で `[T<n>]`→`#N` に解決                                  |
| Blocked by だけ書いて相手の Blocks を書かない                             | 依存は両端に整合させる（T1 が Blocked by T2 なら T2 に Blocks T1）                           |
| サブタスクに親PBIのAC本文をコピーする                                     | 番号で参照する（本文コピー禁止。二重管理を避ける）                                           |
| PBI 以外でサブタスク分割しようとする                                      | Step 6 は **PBI のみ**。subtask/tech は本文更新で完了                                        |
| 既に詳細な issue で無理に詳細化する                                       | Step 2 の早期ゲートで確認し、スキップ可                                                      |
| brainstorming が `docs/superpowers/...` に保存・コミットする              | 保存しない。成果物は issue 本文とサブタスク issue                                            |
| 元の本文の有用な情報を捨てる                                              | ドラフトへ取り込む。全置換でも情報を失わない                                                 |
| 本文の `$`・バッククォートがシェル展開される                              | クォート付きヒアドキュメント（`<<'EOF'`）で渡す                                              |
| gh 未認証で失敗する                                                       | 事前に `gh auth status` を確認                                                               |
| writing-plans や実装まで踏み込む                                          | 終端は issue 更新。計画・実装は `issue-to-pr`、実装単位は `tdd-implement`                    |
| 日本語以外で本文を書く                                                    | 既定は日本語（`CLAUDE.md`）                                                                  |
| サブタスクを親PBIの Project に載せ忘れる                                  | 親の `projectItems` から継承、取れなければ既定 Project（`subtask-creation.md` の定数）に追加 |
| サブタスクを親PBIの sub-issue に関連付け忘れる                            | パス1.5 で `addSubIssue` を実行（gh ネイティブ無し→GraphQL）                                 |
| Project 追加・sub-issue 関連付けの失敗を握りつぶす                        | 握りつぶさず報告し、手動手順（`gh project item-add` / UI の Create sub-issue）を案内         |
| 本文全置換で画像・添付（`![]()`/`<img>`/user-attachments リンク）を捨てる | 全置換前に抽出し新 body へ保全。対象が無ければ追記しない                                     |
