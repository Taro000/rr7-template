#!/usr/bin/env bash
# PreToolUse フック: RED 確認後にロックしたテスト（.tdd-lock 記載）への
#   Edit / Write / MultiEdit と、破壊的 Bash（rm / mv / sed -i / リダイレクト）を deny する。
# フェーズ判定は worktree ルート直下 .tdd-lock の記載有無（記載=ロック、無=RED）。
# format/lint（oxfmt / oxlint / npm run format|lint 系）は許可リストで早期 allow（例外2 自動許容）。
# jq 無・非git・.tdd-lock 無・解析不能は fail-open（exit 0=allow）でワークフローを壊さない。
set -uo pipefail

command -v jq >/dev/null 2>&1 || exit 0   # jq 無ければ素通り（fail-open）

INPUT="$(cat)"
TOOL="$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')"
CWD="$(printf '%s' "$INPUT" | jq -r '.cwd // empty')"

# deny を出力して終了（理由に一時例外フローを案内）
deny() {
  jq -n --arg r "$1" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse", permissionDecision:"deny", permissionDecisionReason:$r}}'
  exit 0
}

# .tdd-lock の各行（コメント・空行除去・前後空白トリム）を yield
read_lock() {
  local line
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%%#*}"
    line="${line#"${line%%[![:space:]]*}"}"   # ltrim
    line="${line%"${line##*[![:space:]]}"}"    # rtrim
    [ -n "$line" ] && printf '%s\n' "$line"
  done < "$1"
}

case "$TOOL" in
  Edit | Write | MultiEdit)
    FP="$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')"
    [ -n "$FP" ] || exit 0
    case "$FP" in /*) ABS="$FP" ;; *) ABS="$CWD/$FP" ;; esac
    DIR="$(cd "$(dirname "$ABS")" 2>/dev/null && pwd -P)" || exit 0
    ROOT="$(git -C "$DIR" rev-parse --show-toplevel 2>/dev/null)" || exit 0
    { [ -n "$ROOT" ] && [ -f "$ROOT/.tdd-lock" ]; } || exit 0
    if [ "$DIR" = "$ROOT" ]; then
      REL="$(basename "$ABS")"
    else
      REL="${DIR#"$ROOT"/}/$(basename "$ABS")"
    fi
    while IFS= read -r locked; do
      if [ "$REL" = "$locked" ]; then
        deny "テスト「${REL}」は RED 確認後にロック済み（.tdd-lock）。TDD では「テスト＝仕様」のため改変・削除を禁止。修正が必要なら理由を述べてユーザー許可を得て、.tdd-lock から当該行を一時除去してから修正すること。"
      fi
    done < <(read_lock "$ROOT/.tdd-lock")
    exit 0
    ;;
  Bash)
    CMD="$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')"
    [ -n "$CMD" ] || exit 0
    # 許可リスト: format/lint は早期 allow（整形でロック済テストが触れても通す）
    case "$CMD" in
      oxfmt* | *"node_modules/.bin/oxfmt"* | oxlint* | *"node_modules/.bin/oxlint"* | \
        "npm run format"* | "npm run lint"* | "npm run format:check"* | "npm run lint:fix"*)
        exit 0
        ;;
    esac
    # 破壊トークン（rm / mv / sed -i / リダイレクト）を含まなければ allow
    case "$CMD" in
      *"rm "* | *"mv "* | *"sed -i"* | *"sed --in-place"* | *">"*) ;;
      *) exit 0 ;;
    esac
    ROOT="$(git -C "$CWD" rev-parse --show-toplevel 2>/dev/null)" || exit 0
    { [ -n "$ROOT" ] && [ -f "$ROOT/.tdd-lock" ]; } || exit 0
    while IFS= read -r locked; do
      base="${locked##*/}"
      case "$CMD" in
        *"$locked"* | *"$base"*)
          deny "破壊的 Bash がロック済みテスト「${locked}」に及ぶ（.tdd-lock）。TDD では「テスト＝仕様」のため改変・削除を禁止。format/lint は許可。修正が必要なら理由を述べてユーザー許可を得て、.tdd-lock から当該行を一時除去すること。"
          ;;
      esac
    done < <(read_lock "$ROOT/.tdd-lock")
    exit 0
    ;;
  *)
    exit 0
    ;;
esac
