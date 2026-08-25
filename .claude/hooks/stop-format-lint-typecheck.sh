#!/usr/bin/env bash
# Stop フック: そのターンで編集した JS/TS ソースに
#   1) oxfmt --write (整形自動修正)  2) oxlint --fix (lint 自動修正)
# を実行し、TS/TSX を含む場合は全体に 3) npm run typecheck を実行。
# 自動修正後も残る lint/型エラーは decision:block で差し戻し自己修復させる
# （セッション内 3 回までのループガード）。
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)" || exit 0
cd "$ROOT" || exit 0

INPUT="$(cat)"
TRANSCRIPT="$(printf '%s' "$INPUT" | jq -r '.transcript_path // empty')"
SESSION="$(printf '%s' "$INPUT" | jq -r '.session_id // "nosession"')"
if [ -z "$TRANSCRIPT" ] || [ ! -f "$TRANSCRIPT" ]; then exit 0; fi

# --- 1. 現ターンで編集されたファイルを収集（user プロンプトごとにリセット）---
EDITED=()
while IFS= read -r f; do [ -n "$f" ] && EDITED+=("$f"); done < <(jq -rn '
  reduce inputs as $e ([];
    if ($e.type == "user" and ($e.isMeta != true) and ($e.message.content != null)
        and (($e.message.content | type == "string")
             or ($e.message.content | (type == "array" and any(.[]?; .type == "text")))))
    then []
    elif ($e.type == "assistant" and ($e.message.content | type == "array"))
    then . + [ $e.message.content[]?
               | select(.type == "tool_use"
                        and (.name == "Edit" or .name == "Write" or .name == "MultiEdit"))
               | .input.file_path // empty ]
    else . end
  ) | unique[]
' "$TRANSCRIPT")

[ ${#EDITED[@]} -eq 0 ] && exit 0   # 編集 0 件 -> bash 3.2 の空配列展開を避けて即終了

# --- 2. リポジトリ内に実在する JS/TS ソースに絞り込む ---
FILES=(); HAS_TS=0
for f in "${EDITED[@]}"; do
  case "$f" in "$ROOT"/*) ;; *) continue ;; esac   # リポジトリ外は無視
  [ -f "$f" ] || continue                            # 削除/リネーム済みは無視
  case "$f" in
    *.ts|*.tsx|*.mts|*.cts) FILES+=("$f"); HAS_TS=1 ;;
    *.js|*.jsx|*.mjs|*.cjs) FILES+=("$f") ;;
  esac
done
[ ${#FILES[@]} -eq 0 ] && exit 0   # 対象なし -> 何もしない

BIN="$ROOT/node_modules/.bin"
if [ ! -x "$BIN/oxfmt" ] || [ ! -x "$BIN/oxlint" ]; then exit 0; fi  # 依存未導入なら無処理

# --- 3. format / lint を自動修正（lint は未修正エラーで非0）---
"$BIN/oxfmt" --write "${FILES[@]}" >/dev/null 2>&1
LINT_OUT="$("$BIN/oxlint" --fix "${FILES[@]}" 2>&1)"; LINT_RC=$?

# --- 4. TS/TSX を含む場合のみ型チェック（全体）---
TC_OUT=""; TC_RC=0
if [ "$HAS_TS" -eq 1 ]; then TC_OUT="$(npm run --silent typecheck 2>&1)"; TC_RC=$?; fi

# --- 5. 残存問題を集約 ---
PROBLEMS=""
[ "$LINT_RC" -ne 0 ] && PROBLEMS="$PROBLEMS"$'\n### lint (oxlint) 未解決\n'"$LINT_OUT"
[ "$TC_RC" -ne 0 ]   && PROBLEMS="$PROBLEMS"$'\n### typecheck (tsc) エラー\n'"$TC_OUT"

COUNTER="${TMPDIR:-/tmp}/claude-stop-check-${SESSION}.count"; MAX=3

if [ -z "$PROBLEMS" ]; then
  rm -f "$COUNTER"
  jq -n --arg n "${#FILES[@]}" \
    '{suppressOutput:true, systemMessage:("Stop hook: format/lint 修正済 + typecheck OK（編集 \($n) ファイル）")}'
  exit 0
fi

N=0; [ -f "$COUNTER" ] && N="$(cat "$COUNTER" 2>/dev/null || echo 0)"
case "$N" in ''|*[!0-9]*) N=0 ;; esac

if [ "$N" -lt "$MAX" ]; then
  echo $((N + 1)) > "$COUNTER"
  jq -n --arg p "$PROBLEMS" \
    '{decision:"block", reason:("Stop hook が編集ファイルに format/lint を自動修正したが、未解決の問題が残っている。以下を修正してから完了すること:\n" + $p)}'
else
  rm -f "$COUNTER"
  jq -n --arg p "$PROBLEMS" \
    '{systemMessage:("Stop hook: 自動修復を上限まで試みたが未解決の問題が残存。手動確認が必要:\n" + $p)}'
fi
exit 0
