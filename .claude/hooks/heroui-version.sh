#!/usr/bin/env bash
# SessionStart: keep @heroui/react + @heroui/styles current.
# Patch/minor upgrades within the installed major are applied automatically;
# a major bump is reported only, since v-major changes are breaking.
set -uo pipefail

root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$root" 2>/dev/null || exit 0
[ -f package.json ] || exit 0
grep -q '"@heroui/react"' package.json || exit 0

if ! command -v npm >/dev/null 2>&1; then
  for d in "$HOME"/.nvm/versions/node/*/bin; do [ -d "$d" ] && PATH="$d:$PATH"; done
  export PATH
fi
command -v npm >/dev/null 2>&1 || exit 0

# Check at most once per day.
stamp=".claude/.heroui-version-check"
today=$(date +%Y-%m-%d)
[ -f "$stamp" ] && [ "$(cat "$stamp" 2>/dev/null)" = "$today" ] && exit 0
printf '%s' "$today" > "$stamp" 2>/dev/null || true

installed=$(node -p "require('./node_modules/@heroui/react/package.json').version" 2>/dev/null) || exit 0
[ -n "$installed" ] || exit 0
latest=$(npm view @heroui/react version 2>/dev/null) || exit 0
[ -n "$latest" ] || exit 0
[ "$installed" = "$latest" ] && exit 0

if [ "${installed%%.*}" = "${latest%%.*}" ]; then
  if npm install --no-audit --no-fund "@heroui/react@^${latest%%.*}" "@heroui/styles@^${latest%%.*}" >/tmp/heroui-upgrade.log 2>&1; then
    now=$(node -p "require('./node_modules/@heroui/react/package.json').version" 2>/dev/null)
    jq -n --arg from "$installed" --arg to "${now:-$latest}" '{
      systemMessage: ("HeroUI auto-updated: " + $from + " -> " + $to + " (package.json / package-lock.json changed)"),
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: ("HeroUI was auto-updated from " + $from + " to " + $to + " at session start; package.json and package-lock.json are modified in the working tree. Mention this to the user if they are about to commit.")
      }
    }'
  else
    # Auto-install refused by npm (usually a peer-dependency conflict). Do NOT retry with
    # --legacy-peer-deps: that resolves to a tree npm itself calls potentially broken.
    conflict=$(grep -E 'Conflicting peer dependency|Could not resolve dependency|peer .* from' /tmp/heroui-upgrade.log 2>/dev/null | head -6)
    jq -n --arg from "$installed" --arg to "$latest" --arg conflict "$conflict" '{
      systemMessage: ("HeroUI " + $to + " available (installed " + $from + ") - auto-update blocked by a dependency conflict"),
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: ("HeroUI " + $to + " is available but could not be installed automatically (installed: " + $from + "). npm refused the resolution:\n" + $conflict + "\n\nNothing was changed. Do not retry with --legacy-peer-deps or --force without asking the user - that produces a tree npm considers broken. If the user wants the upgrade, the peer conflict has to be resolved first. Full log: /tmp/heroui-upgrade.log")
      }
    }'
  fi
else
  jq -n --arg from "$installed" --arg to "$latest" '{
    systemMessage: ("HeroUI major release " + $to + " available (installed " + $from + ") - not auto-installed"),
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: ("A new MAJOR version of HeroUI is available: installed " + $from + ", latest " + $to + ". It was NOT installed automatically because major versions are breaking. If the user wants to upgrade, run `npm i @heroui/react@latest @heroui/styles@latest`, refresh the skill with `curl -fsSL https://heroui.com/install | bash -s heroui-react`, and check the migration guide before changing components.")
    }
  }'
fi
exit 0
