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
for bundle in *.skill; do
  if [[ "$bundle" != "verstak.skill" ]]; then
    echo "✗ $bundle: unexpected bundle (only verstak.skill ships)"
    fail=1
  fi
done
for d in skills/verstak/; do
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
  elif [[ $(find "$tmp" -mindepth 1 -maxdepth 1 | wc -l | tr -d ' ') != 1 ]]; then
    echo "✗ $bundle: unexpected entries outside '$name/'"
    fail=1
  elif ! diff -r "skills/$name" "$tmp/$name" >/dev/null 2>&1; then
    echo "✗ $bundle: contents differ from skills/$name/ — run 'make build' and commit:"
    diff -r "skills/$name" "$tmp/$name" | sed 's/^/    /'
    fail=1
  fi
  rm -rf "$tmp"
done

# home/ — the conversation home's flat catalogue — is generated from
# skills/verstak/methods/ and must not drift from it.
if ! node scripts/build-home.mjs --check; then
  fail=1
fi

if [[ $fail -ne 0 ]]; then
  echo ""
  echo "Bundles or home/ are out of sync. Run 'make build' (or enable the hook with 'make hooks') and commit."
  exit 1
fi
echo "✓ all .skill bundles in sync with skills/"
