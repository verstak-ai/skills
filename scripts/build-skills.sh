#!/usr/bin/env bash
# Regenerate <name>.skill bundles from skills/<name>/ (the source of truth).
#
# Each bundle is a zip whose single top-level entry is <name>/ (so it installs as
# ~/.claude/skills/<name>/). The .skill files are
# committed derived artifacts — never hand-edit them; edit skills/<name>/SKILL.md and rebuild.
#
# Deterministic: files are copied and stamped with a fixed mtime before zipping, so a rebuild
# with unchanged content produces a byte-identical archive (no git churn).
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

for d in skills/verstak/; do
  name="$(basename "$d")"
  tmp="$(mktemp -d)"
  cp -R "skills/$name" "$tmp/$name"
  find "$tmp/$name" -exec touch -t 200001010000.00 {} +
  rm -f "$root/$name.skill"
  ( cd "$tmp" && zip -rqX "$root/$name.skill" "$name" )
  rm -rf "$tmp"
done

echo "Built: $(ls -1 *.skill | tr '\n' ' ')"

# The conversation home's flat catalogue, generated from the same methods.
node scripts/build-home.mjs
