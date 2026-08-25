#!/usr/bin/env bash
# tdd-test-guard.sh の振る舞い（allow/deny）を検証する自包的テスト。
# 一時 git リポジトリを作り .tdd-lock を置き、モック PreToolUse JSON をフックに
# 流して permissionDecision を期待値とアサートする。
# 実行: bash .claude/hooks/tdd-test-guard.test.sh （CI/vitest 外・手動）
set -uo pipefail

HOOK="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/tdd-test-guard.sh"
if [ ! -f "$HOOK" ]; then echo "FATAL: hook not found: $HOOK"; exit 1; fi

PASS=0; FAIL=0

# --- フィクスチャ: 一時 git リポジトリ（physical path で揃える）---
FIX="$(cd "$(mktemp -d)" && pwd -P)"
trap 'rm -rf "$FIX"' EXIT
git -C "$FIX" init -q
mkdir -p "$FIX/app/components"
LOCKED="app/components/Counter.spec.tsx"
UNLOCKED="app/components/Other.spec.tsx"
LEGACY="app/components/Legacy.test.ts"
: > "$FIX/$LOCKED"; : > "$FIX/$UNLOCKED"; : > "$FIX/$LEGACY"
printf '%s\n%s\n' "$LOCKED" "$LEGACY" > "$FIX/.tdd-lock"

# stdin JSON を流し "deny" / "allow" を返す
run() {
  local out
  out="$(printf '%s' "$1" | bash "$HOOK" 2>/dev/null)"
  if printf '%s' "$out" | grep -q '"permissionDecision"[[:space:]]*:[[:space:]]*"deny"'; then
    echo deny
  else
    echo allow
  fi
}

assert() {
  local name="$1" expected="$2" got="$3"
  if [ "$got" = "$expected" ]; then
    PASS=$((PASS + 1)); echo "PASS: $name ($got)"
  else
    FAIL=$((FAIL + 1)); echo "FAIL: $name — expected $expected, got $got"
  fi
}

edit_json() {
  printf '{"hook_event_name":"PreToolUse","cwd":"%s","tool_name":"%s","tool_input":{"file_path":"%s"}}' \
    "$FIX" "$1" "$2"
}
bash_json() {
  printf '{"hook_event_name":"PreToolUse","cwd":"%s","tool_name":"Bash","tool_input":{"command":"%s"}}' \
    "$FIX" "$1"
}

# 1 ロック済 spec を Edit -> deny
assert "edit locked spec" deny "$(run "$(edit_json Edit "$FIX/$LOCKED")")"
# 2 未ロック spec を Edit -> allow（RED 中）
assert "edit unlocked spec" allow "$(run "$(edit_json Edit "$FIX/$UNLOCKED")")"
# 3 ロック済 test を Write -> deny
assert "write locked test" deny "$(run "$(edit_json Write "$FIX/$LOCKED")")"
# レガシー .test を Edit -> deny（対象は spec/test 両方）
assert "edit locked legacy .test" deny "$(run "$(edit_json Edit "$FIX/$LEGACY")")"
# 4 rm ロック済 -> deny
assert "bash rm locked" deny "$(run "$(bash_json "rm $LOCKED")")"
# 5 mv ロック済 -> deny
assert "bash mv locked" deny "$(run "$(bash_json "mv $LOCKED /tmp/x")")"
# 6 sed -i ロック済 -> deny
assert "bash sed -i locked" deny "$(run "$(bash_json "sed -i s/a/b/ $LOCKED")")"
# 7 リダイレクト ロック済 -> deny
assert "bash redirect locked" deny "$(run "$(bash_json "echo x > $LOCKED")")"
# 8 oxlint --fix ロック済 -> allow（許可リスト）
assert "bash oxlint --fix locked (allowlist)" allow "$(run "$(bash_json "oxlint --fix $LOCKED")")"
# 9 npm run format -> allow
assert "bash npm run format" allow "$(run "$(bash_json "npm run format")")"
# 10 .tdd-lock 自身を Edit -> allow（アンロック手段）
assert "edit .tdd-lock itself" allow "$(run "$(edit_json Edit "$FIX/.tdd-lock")")"
# 追加: 非破壊 Bash（cat）はロック済パスに触れても allow
assert "bash cat locked (non-destructive)" allow "$(run "$(bash_json "cat $LOCKED")")"
# 追加: 破壊トークンありでも未ロックパスなら allow
assert "bash rm unlocked" allow "$(run "$(bash_json "rm $UNLOCKED")")"

echo "----"
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ]
