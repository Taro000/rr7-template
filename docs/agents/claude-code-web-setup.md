# Claude Code on the web 自動実装パイプライン セットアップ

Issue ラベル起点で Claude Code on the web のセッションを起動し、実装 PR 作成〜CI 失敗の自己修復までを回す構成の手順書。
リポジトリ側の成果物（コミット済み）と、Web UI での手動設定（本書の手順）に分かれる。

> **このパイプラインは任意機能**。使わないなら `.github/workflows/{dispatch-agent,auto-fix-agent}.yml` と
> `.claude/skills/cloud-issue-to-pr/` を削除してよい（ローカルの `/issue-to-pr` は独立して動く）。
> 使う場合は本書の 1〜5 をすべて実施する。secrets 未設定のままラベルを付けると workflow が失敗する。

## 構成

```
issue に「ready for dev」ラベル
  → .github/workflows/dispatch-agent.yml が実装 Routine を fire（並列: ラベル付けた数だけ独立セッション）
  → エージェントが claude/issue-<番号>-<slug> ブランチで実装し PR 作成
  → .github/workflows/ci.yml（pull_request）がテスト・lint・型チェック
  → 失敗時 .github/workflows/auto-fix-agent.yml が修正 Routine を fire（上限 2 回）
```

- Routine の API トリガー: `POST https://api.anthropic.com/v1/claude_code/routines/{id}/fire`。
  ペイロードは `{"text": "..."}`（**`input` ではない**。最大 65,536 文字）。
  ヘッダに `anthropic-beta: experimental-cc-routine-2026-04-01` が必須。
- トリガーラベルは既存の `ready`（ローカル issue-to-pr 用）とは別に `ready for dev` を使う。
  同一ラベルにすると、ローカルフローで実装するつもりの issue でもクラウドセッションが起動し二重実装になるため。

## 手動セットアップ手順（Web UI）

### 1. GitHub 連携（未接続 — 最初にやる）

ローカルの Claude Code で `/web-setup` を実行するか、GitHub App をインストールする:
https://claude.ai/code/onboarding?magic=github-app-setup

### 2. 環境設定（claude.ai/code の environment 設定）

UI の場所: セッション作成画面の **cloud icon** → 環境セレクター → **Add environment**（新規）、
または既存環境にホバー → **settings icon** → 「Update cloud environment」（編集）。
ダイアログの設定項目は Environment name / Network access level / Environment variables / Setup script。
environments の CRUD API は無く Web UI のみ。

**Setup script**（複数行 bash、root で実行）:

```bash
#!/bin/bash
set -eo pipefail
# .npmrc が engine-strict=true のため Node >=24 / npm >=11.10 でないと npm ci が落ちる。
# サンドボックスのプリインストールは Node 20/21/22（nvm）なので 24 を明示的に入れる
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 24
nvm alias default 24
npm install -g npm@latest
npm ci
```

- 実行タイミング: 新規環境の初回セッションで Claude Code 起動前に実行 → **ファイルシステムごとスナップショット化されキャッシュ**。
- キャッシュ再構築の条件: スクリプト内容の変更 / 許可ドメインの変更 / 約 7 日での自動失効。
  **package-lock.json の変更では再構築されない**ため、依存を変えた PR の後に古い node_modules を踏んだら、
  スクリプトに空行を足すなどで内容を変えて再構築させる。
- 目安 5 分以内。終了コードが non-zero だとセッション起動自体が失敗する（パイロット初回で要確認）。
- `nvm install 24` は nodejs.org への通信が要る。既定のネットワーク制限で落ちる場合は
  許可ドメインに `nodejs.org` を追加する（追加するとキャッシュも再構築される）。
- 補足: クラウドセッションは repo の `.claude/settings.json` フックを実行する（公式記載あり）。
  毎セッションの鮮度合わせが必要になったら `CLAUDE_CODE_REMOTE=true` ガード付き SessionStart フック＋
  `npm install` が公式パターン。当面は Setup script のみで開始し、キャッシュ staleness が実害になったら検討。

**Environment variables**（`.env` 形式・1 行 1 ペア・値を quote しない）:

```
CLAUDE_CODE_EFFORT_LEVEL=xhigh
```

- アプリに必須の環境変数があればここに追加する（テンプレートの初期状態では不要）。
- 専用のシークレットストアは未提供で、環境を編集できる人には値が見える。トークン等は置かないこと。
- `xhigh` という値の有効性・Web セッションでの適用はドキュメントに記載なし。
  計画どおり**まずデフォルト（未設定）で 2〜3 件計測**し、その後に入れて比較する。
- Network access level は既定の制限のままで問題ない。

### 3. Routine を 2 本作成（トリガー = API）

claude.ai/code の Routines から作成し、発行されるエンドポイント URL とトークンを控える。

**実装 Routine のプロンプト:**

```
cloud-issue-to-pr スキル（.claude/skills/cloud-issue-to-pr/SKILL.md）を必ず使って、
ペイロードで渡された Issue を実装し PR を作成してください。
ガード検証・失敗時の対応・制約はすべてスキルの記載に従うこと。
```

制約（受け入れ条件外の変更禁止・依存追加の制限・テスト 3 回上限・PR 要件）はすべて
`cloud-issue-to-pr` スキル側に書いてある。Routine のプロンプトへ重複して書かないこと。
スキル名・配置を変える場合は本プロンプトも同時に更新すること。
ブランチ命名 `claude/issue-<番号>-<slug>` は auto-fix-agent.yml の `claude/` 前置フィルタと
ローカルの create-branch 規約に一致させている。変える場合は両方同時に変えること。

**修正 Routine のプロンプト:**

```
渡された PR の CI 失敗を修正してください。

1. ペイロードの PR 番号・ブランチ・失敗 run URL を確認し、失敗ログを読む
2. 該当ブランチをチェックアウトして修正する
3. npm run typecheck / npm run lint / npm run format:check / npm test を通してから push する
4. push したら PR へ「auto-fix attempt N」（N は通算回数）とコメントする

制約: CI 失敗の解消以外の変更をしない。直せない場合は状況を PR コメントに記録して終了する。
```

「auto-fix attempt N」コメントは auto-fix-agent.yml の上限カウンタ（2 回）の判定材料。
文言を変えるとカウントされず無限ループになるため変えないこと。

### 4. GitHub Secrets 登録

```sh
gh secret set ROUTINE_IMPL_URL   # 実装 Routine の fire エンドポイント URL
gh secret set ROUTINE_IMPL_TOKEN # 実装 Routine のトークン（sk-ant-oat01-…）
gh secret set ROUTINE_FIX_URL    # 修正 Routine の fire エンドポイント URL
gh secret set ROUTINE_FIX_TOKEN  # 修正 Routine のトークン
```

### 5. 手動パイロット（自動化の前に必ず）

自動起動を有効にする前に、まず手で 1〜2 件試す。`/refine-issue` で受け入れ条件付きに整備した
issue を 2〜3 件用意し、Web UI から上記プロンプトと同じ文面で手動実行して以下を確認する:

- Setup script（npm ci）が自動で通るか
- テストが緑になるか / PR の品質
- 1 タスクあたりのレート消費と Max 5x での並列耐性（初期想定 1〜2 並列、実測で調整）

### 6. ブランチ保護（現状は不可 — 要判断）

private リポジトリ + Free プランでは branch protection / required checks を設定できない。
選択肢:

1. **public にする、または GitHub Pro 以上へ上げる** — protected branches と required checks が使える。
2. **ローカルガードのみで運用する** — `.husky/pre-push` が main への直 push を拒否し、エージェントは
   PR を作るだけでマージしない。マージ前に CI の緑を人が目視確認する運用でも品質ゲートは機能する。

Routines はリサーチプレビューのため、エンドポイント・ペイロード仕様は変わり得る。
作成画面に表示される仕様が本書と食い違う場合はそちらが正。
