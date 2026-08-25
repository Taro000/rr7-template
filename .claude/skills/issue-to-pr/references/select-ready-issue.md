# ready＋Priority 最優先の issue を選定するコマンド

`issue-to-pr` Step 1（番号省略時）で使う。`--jq` は gh 内蔵 jq（外部依存なし）。

> **セットアップ必須**: 下記の 3 箇所を自リポジトリの値へ置換してから使う（テンプレート由来の
> プレースホルダのままでは動かない）。
>
> | プレースホルダ     | 値                                                  | 確認方法                              |
> | ------------------ | --------------------------------------------------- | ------------------------------------- |
> | `<GITHUB_OWNER>`   | GitHub のユーザー名 or Organization 名              | `gh api user --jq .login`             |
> | `<PROJECT_NUMBER>` | GitHub Projects の番号（Project の URL 末尾の数字） | Project ページの URL                  |
> | `<REPO_NAME>`      | リポジトリ名                                        | `gh repo view --json name --jq .name` |
>
> owner が Organization の場合は `user(login: ...)` を `organization(login: ...)` に、
> `--jq` の `.data.user` を `.data.organization` に読み替える。

```bash
gh api graphql -f query='query{ user(login:"<GITHUB_OWNER>"){ projectV2(number:<PROJECT_NUMBER>){
  items(first:100){ nodes{
    content{ ... on Issue{ number title state repository{ nameWithOwner }
      labels(first:20){ nodes{ name } } } }
    fieldValueByName(name:"Priority"){ ... on ProjectV2ItemFieldSingleSelectValue{ name } } } } } } }' \
  --jq '.data.user.projectV2.items.nodes
    | map(select(.content.number!=null and .content.state=="OPEN"
        and (.content.repository.nameWithOwner=="<GITHUB_OWNER>/<REPO_NAME>")
        and ([.content.labels.nodes[].name]|index("ready"))))
    | map({number:.content.number, title:.content.title, priority:(.fieldValueByName.name // "ZZZ")})
    | sort_by(.priority,.number) | .[0]'
```
