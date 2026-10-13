#!/usr/bin/env bash
# docs-check.sh — fail if a markdown doc references a repo path that doesn't exist,
# or if AGENTS.md is over its line budget.
# Catches link rot: a CHANGELOG pointing at a file that moved into docs/archive/
# misleads every future session, silently and forever.
# See TEMPLATE.md §9.
set -uo pipefail

cd "${1:-.}"
rc=0

# Append-only historical records are EXCLUDED by design. A CHANGELOG entry, an ADR, or an
# archived SPEC is supposed to name paths that no longer exist — that is what history is.
# Retiring a feature (§4 Phase 4) deletes its folder, and every past reference to it would
# otherwise be reported as rot forever. Only documents that claim to describe the present
# are checked.
# The manual itself (TEMPLATE.md, DELEGATION.md) is excluded for the same reason: it names
# paths (docs/PROJECT.md, features/<name>/SPEC.md) that exist in adopting projects, not here.
EXCLUDE='node_modules|/\.|/docs/archive/|/docs/adr/|/CHANGELOG\.md|\./(TEMPLATE|DELEGATION)\.md'

# Top-level directories whose paths are checked. A project whose code is not under src/ must
# override this, or references to its code are never checked — silently.
dirs="${DOCS_CHECK_DIRS:-docs|src|features|tools}"

while IFS=: read -r file _ ref; do
  ref="${ref%\`*}"
  [[ -e "$ref" ]] || { echo "BROKEN: $file → $ref"; rc=1; }
done < <(grep -rnoE "\`($dirs)/[A-Za-z0-9._/-]+\`" --include='*.md' . \
         | grep -vE "$EXCLUDE" | tr -d '`')

# AGENTS.md is the one file paid for on every turn (TEMPLATE.md §8). Over budget is a defect.
max="${AGENTS_MAX_LINES:-120}"
if [[ -f AGENTS.md ]] && (( $(wc -l < AGENTS.md) > max )); then
  echo "OVER BUDGET: AGENTS.md is $(wc -l < AGENTS.md | tr -d ' ') lines (max $max)"; rc=1
fi

[[ $rc -eq 0 ]] && echo "docs ok"
exit $rc
