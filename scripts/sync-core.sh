#!/usr/bin/env bash
# Refresh the bridge core from the sibling delivery's repository and re-pin it.
#
#   scripts/sync-core.sh <sibling-repo-dir> <ref>
#
# The core (js/{bridge,shared,opencode,extension,watchdog,cli}) is copied byte for
# byte from <ref>, its component READMEs excluded (they are the sibling's docs);
# js/core.lock records the commit and a sha256 per file, and `make check-core`
# fails on any local edit. A core change is made upstream and synced here, never
# patched in place: what the delivery needs from it goes through js/delivery.
set -euo pipefail

repo="${1:?usage: scripts/sync-core.sh <sibling-repo-dir> <ref>}"
ref="${2:?usage: scripts/sync-core.sh <sibling-repo-dir> <ref>}"
root="$(cd "$(dirname "$0")/.." && pwd)"
dirs=(bridge shared opencode extension watchdog cli)

sha="$(git -C "$repo" rev-parse --verify "$ref^{commit}")"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
git -C "$repo" archive "$sha" "${dirs[@]/#/js/}" | tar -x -C "$tmp"
find "$tmp/js" -name README.md -delete

for d in "${dirs[@]}"; do
  rm -rf "${root:?}/js/$d"
  cp -R "$tmp/js/$d" "$root/js/$d"
done

node "$root/scripts/check-core-lock.mjs" --write "$sha"
echo "core synced to $sha"
