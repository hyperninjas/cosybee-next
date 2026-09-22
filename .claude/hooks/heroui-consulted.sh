#!/usr/bin/env bash
# PreToolUse: record that this session has consulted HeroUI (MCP server or skill),
# which unlocks the UI-file gate in heroui-guard.sh for the rest of the session.
set -uo pipefail

payload=$(cat)
tool=$(printf '%s' "$payload" | jq -r '.tool_name // empty')
skill=$(printf '%s' "$payload" | jq -r '.tool_input.skill // empty')
session=$(printf '%s' "$payload" | jq -r '.session_id // "nosession"')
session=$(printf '%s' "$session" | tr -c 'A-Za-z0-9_.-' '_')

case "$tool" in
  mcp__heroui-react__*) ;;
  Skill)
    case "$skill" in
      *heroui*) ;;
      *) exit 0 ;;
    esac
    ;;
  *) exit 0 ;;
esac

: > "${TMPDIR:-/tmp}/claude-heroui-consulted-${session}" 2>/dev/null || true
exit 0
