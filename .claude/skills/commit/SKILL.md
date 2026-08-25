---
name: commit
description: Commit staged changes with a structured Japanese commit message (title + bulleted details). Use when the user asks to commit staged changes (e.g. "commit", "コミットして", "/commit").
model: haiku
---

# commit

Commit currently staged changes using the format below.

## Steps

1. Run these in parallel to gather context:
   - `git status` (no `-uall` flag)
   - `git diff --cached` to inspect what is actually staged
   - `git log -n 5 --oneline` to match repo style
2. If nothing is staged, stop and tell the user — do NOT stage files yourself, do NOT create an empty commit.
3. Analyze the staged diff and draft a commit message in this exact format:

   ```
   {変更内容の要約（タイトル、概要）}

   - {変更内容の詳細をリストアップ}
   - ...
   ```

   - First line: a concise title summarizing the change (Japanese).
   - Blank line.
   - Bulleted list of concrete details (Japanese), one bullet per logical change. Reference file/function names when it adds clarity.
   - Focus on the "why" and the substance of the change, not a restatement of the diff.
   - Do NOT add `Co-Authored-By` lines, `Generated with Claude Code` footers, or any other trailers.

4. Create the commit using a HEREDOC so formatting is preserved:

   ```bash
   git commit -m "$(cat <<'EOF'
   {タイトル}

   - {詳細1}
   - {詳細2}
   EOF
   )"
   ```

5. Run `git status` after the commit to confirm success and report the result briefly.

## Rules

- Only commit what is already staged. Never run `git add` from this skill.
- Never use `--no-verify`, `--amend`, or any destructive flag.
- If a pre-commit hook fails, fix the underlying issue and create a NEW commit (do not amend).
- Warn the user before committing if staged files look like secrets (`.env`, credentials, keys).
