#!/usr/bin/env bash
# PreToolUse: block writes to React UI files until the HeroUI skill or MCP docs
# have been consulted in this session (AGENTS.md requires it).
set -uo pipefail

payload=$(cat)
file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')
session=$(printf '%s' "$payload" | jq -r '.session_id // "nosession"')
session=$(printf '%s' "$session" | tr -c 'A-Za-z0-9_.-' '_')

# Only gate React component files.
case "$file" in
  *.tsx|*.jsx) ;;
  *) exit 0 ;;
esac

# Never gate the hooks/config that implement this rule, or test files.
case "$file" in
  */.claude/*|*.test.tsx|*.test.jsx|*.spec.tsx|*.spec.jsx) exit 0 ;;
esac

marker="${TMPDIR:-/tmp}/claude-heroui-consulted-${session}"
[ -f "$marker" ] && exit 0

jq -n --arg file "$file" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: (
      "HeroUI gate: this project builds UI with HeroUI v3 (see AGENTS.md), and nothing in this session has consulted it yet.\n\n" +
      "Before writing " + $file + ", validate the component choice against HeroUI v3 by doing ONE of:\n" +
      "  - mcp__heroui-react__list_components  (see what v3 offers)\n" +
      "  - mcp__heroui-react__get_component_docs  (API + examples for the component you need)\n" +
      "  - Skill(heroui-react)  (the bundled v3 guide)\n\n" +
      "HeroUI v3 differs from v2: compound components (Card.Header), Tailwind v4, no provider, no framer-motion. Do not write it from memory.\n" +
      "This check runs once per session - after one HeroUI lookup, all UI edits proceed normally."
    )
  }
}'
exit 0
