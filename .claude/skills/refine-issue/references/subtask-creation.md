# サブタスク起票の手順とコマンド（多パス）

`refine-issue` Step 6 で使う。サブタスクを起票し、(a) 親PBIの **Project を継承**し、
(b) 親PBIの **sub-issue として関連付け**、(c) **依存を実リンクに解決**する。
依存の `#N` は起票前に番号が無いため、起票（番号回収）と依存解決を分割し、その間に Project 継承・sub-issue 関連付けを挟む。

## 既定 Project（定数・唯一の定義箇所）

親PBIの Project を取得できない / 親が未所属のときに使うフォールバック。
**変更時はここだけ直す**（SKILL.md など他所では番号・タイトルを直書きせず本セクションを参照する）。

- タイトル: `<PROJECT_TITLE>`
- owner: `<GITHUB_OWNER>`
- 番号: `<PROJECT_NUMBER>`

> **セットアップ必須**: 上記 3 値はテンプレート由来のプレースホルダ。GitHub Projects を使う場合は
> 自分の Project の値へ置換する（`gh api user --jq .login` と Project の URL 末尾の数字）。
> Projects を使わないなら、パス0 の Project 継承とパス1 の `--project` 指定ごと省いてよい。

## 段取り（パス0 → パス1 → パス1.5 → パス2）

### パス0 — 親PBIの Project と node ID を取得する

親PBIが属する Project（継承先）と、親の node ID（`addSubIssue` 用）を取得する。

```bash
gh api graphql -f query='
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) {
        id
        projectItems(first: 10) {
          nodes { project { id title number } }
        }
      }
    }
  }' -f owner=<owner> -f repo=<repo> -F number=<親番号>
```

- `issue.id` = 親の node ID。控えておく（パス1.5 で使う）。
- `projectItems.nodes[].project.title` があればそれを **継承先 Project** とする。
  空 / 取得失敗なら **既定 Project**（上記の `<PROJECT_TITLE>`）を使う。

### パス1 — 全サブタスクを起票して番号・node ID を回収する

継承先（無ければ既定）Project へ `--project "<title>"` で載せつつ起票する。
依存関係は一旦 `[T<n>]` エイリアスで書いておく。

```bash
gh issue create \
  --title "[T1] <サブタスク要約>" \
  --label subtask \
  --project "<継承 or 既定 Project のタイトル>" \
  --body-file - <<'EOF'
### 親PBI

#<親番号>

### 概要

…

### 実装方針（How）

…（基本〜詳細設計）…

### 満たす親PBIの受け入れ条件

#<親番号> のAC 1, 3

### 依存関係

**Blocked by**（このタスクが待つ先行タスク）

- [T2]

**Blocks**（このタスクを待つ後続タスク）

-
EOF
```

- 各起票で返る URL/番号を集め、`T<n> → #<番号>` の対応表を作る。
- 各サブタスクの **node ID** も回収する（パス1.5 用）:

  ```bash
  gh issue view <子番号> --json id -q .id
  ```

- `--project` が失敗しても起票自体は通る。起票後に
  `gh project item-add <番号> --owner <owner> --url <子URL>` で補い、
  それも失敗するなら **握りつぶさず報告**して手動追加を案内する。

### パス1.5 — 親PBIの sub-issue として関連付ける

回収した node ID で、各子を親に紐づける（gh ネイティブの sub-issue コマンドは無いため GraphQL）。

```bash
gh api graphql -f query='
  mutation($parent: ID!, $child: ID!) {
    addSubIssue(input: { issueId: $parent, subIssueId: $child }) {
      subIssue { number }
    }
  }' -f parent=<親node ID> -f child=<子node ID>
```

- 子の node ID を取らず **URL で指定**も可（`gh issue view` を1回省ける）:
  `addSubIssue(input: { issueId: $parent, subIssueUrl: "<子URL>" })`。
- 失敗したら **握りつぶさず報告**し、GitHub UI の "Create sub-issue" での手動関連付けを案内する。

### パス2 — 依存を実リンクに解決する

対応表で `[T<n>]` を `#<番号>` に置換し、各サブタスクの body を更新する
（Blocked by / Blocks の両方向を整合させる）。依存が無いサブタスクは依存関係を空のままにしてよい。

```bash
gh issue edit <子番号> --body-file - <<'EOF'
…（[T<n>] を #<番号> に解決した body 全文）…
EOF
```
