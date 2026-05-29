#!/usr/bin/env bash
# Verify every committed <name>.skill bundle is in sync with its source skills/<name>/.
#
# Checks bundle *contents*, not raw bytes: a bundle must contain a top-level
# <name>/ tree byte-identical to skills/<name>/. We avoid a rebuild-and-byte-diff
# because zip output is not reproducible across zip implementations/platforms
# (macOS Info-ZIP vs Linux), which would make the check flaky. Content equality
# is the actual contract: the installed ~/.claude/skills/<name>/ must match source.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

fail=0
for d in skills/*/; do
  name="$(basename "$d")"
  bundle="$name.skill"
  if [[ ! -f "$bundle" ]]; then
    echo "✗ $bundle: missing (run 'make build')"
    fail=1
    continue
  fi
  tmp="$(mktemp -d)"
  unzip -qq "$bundle" -d "$tmp"
  if [[ ! -d "$tmp/$name" ]]; then
    echo "✗ $bundle: must contain a top-level '$name/' directory (won't install otherwise)"
    fail=1
  elif ! diff -r "skills/$name" "$tmp/$name" >/dev/null 2>&1; then
    echo "✗ $bundle: contents differ from skills/$name/ — run 'make build' and commit:"
    diff -r "skills/$name" "$tmp/$name" | sed 's/^/    /'
    fail=1
  fi
  rm -rf "$tmp"
done

if [[ $fail -ne 0 ]]; then
  echo ""
  echo "Bundles are out of sync. Run 'make build' (or enable the hook with 'make hooks') and commit."
  exit 1
fi
echo "✓ all .skill bundles in sync with skills/"
