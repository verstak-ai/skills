#!/usr/bin/env bash
# Build the plugin archive for the claude.ai channel: dist/verstak.zip carrying
# a top-level verstak/ dir with the plugin manifest and the skills tree.
#
# Why it exists: claude.ai has no marketplace and no auto-delivery (org sync
# requires a private repo; this one is public by decision), so that channel is
# manual upload of exactly this archive. CI builds it on every release and
# attaches it as an asset (.github/workflows/release-please.yml); a consumer
# updates by re-uploading a newer release's asset — the same plugin name
# overwrites the installed copy.
set -euo pipefail
cd "$(dirname "$0")/.."

out="$PWD/dist/verstak.zip"
staging="$(mktemp -d)"
trap 'rm -rf "$staging"' EXIT

# Only plugin.json goes in — not the whole .claude-plugin/: marketplace.json
# describes the repo-as-marketplace, and the claude.ai loader (the one surface
# known to be stricter than our own gate) has never been tested against a
# marketplace manifest nested inside a plugin dir.
mkdir -p "$staging/verstak/.claude-plugin" dist
cp .claude-plugin/plugin.json "$staging/verstak/.claude-plugin/"
cp -R skills "$staging/verstak/"

rm -f "$out"
(cd "$staging" && zip -X -q -r "$out" verstak -x "*.DS_Store")
echo "built dist/verstak.zip"
