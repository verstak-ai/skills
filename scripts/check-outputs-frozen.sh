#!/usr/bin/env bash
# The lock on the committed JS outputs: every install channel takes main, and the
# committed outputs are a release build written only by the release job (make
# build-release in bundle-sync, on a release-please--* branch). Any other branch
# that changes them against its base ships around a release: refused.
#
#   scripts/check-outputs-frozen.sh [base] [branch]
#     base   — the commit to compare against (default origin/main)
#     branch — the branch name (default the current one)
# In CI without arguments, by event (GITHUB_EVENT_NAME):
#   pull_request — base HEAD^1 (the PR's base in its merge commit), branch GITHUB_HEAD_REF;
#   push — the branch from GITHUB_REF; the whole push, commit by commit, from PUSH_BEFORE
#     (github.event.before) to HEAD. A commit changing the outputs is refused unless it is
#     the release PR's: author github-actions[bot], committer noreply@github.com (a merge
#     by GitHub's button) AND the subject `chore(main): release …`. With before empty,
#     zero (a new branch, a force-push) or absent from the clone, HEAD is compared with
#     the last release commit of its history.
set -euo pipefail
cd "$(dirname "$0")/.."

RELEASE_AUTHOR="41898282+github-actions[bot]@users.noreply.github.com"
RELEASE_COMMITTER="noreply@github.com"
outputs=(
  skills/verstak/scripts/verstak-bridge.mjs
  skills/verstak/scripts/opencode-plugin.js
  extensions/verstak.js
)
release_branch() { [[ "$1" == release-please--* ]]; }
release_commit() {
  [[ "$(git log -1 --format=%ae "$1")" == "$RELEASE_AUTHOR" &&
    "$(git log -1 --format=%ce "$1")" == "$RELEASE_COMMITTER" &&
    "$(git log -1 --format=%s "$1")" == "chore(main): release "* ]]
}
last_release() {
  git log --format='%H%x09%ae%x09%ce%x09%s' HEAD |
    awk -F'\t' -v a="$RELEASE_AUTHOR" -v c="$RELEASE_COMMITTER" \
      '!found && $2 == a && $3 == c && index($4, "chore(main): release ") == 1 { print $1; found = 1 }'
  # no exit in awk: an early exit would break git log's pipe (SIGPIPE under pipefail)
}

event="${GITHUB_EVENT_NAME:-}"
if [[ $# -eq 0 && "$event" == "push" ]]; then
  branch="${GITHUB_REF#refs/heads/}"
  if release_branch "$branch"; then
    echo "✓ release branch ($branch) — its job writes the committed outputs"
    exit 0
  fi
  before="${PUSH_BEFORE:-}"
  if [[ -z "$before" || "$before" =~ ^0+$ ]] || ! git rev-parse -q --verify "$before^{commit}" >/dev/null; then
    rel="$(last_release)"
    if [[ -z "$rel" ]]; then
      echo "✗ a push without before, and no release commit in the history — nothing to compare with" >&2
      exit 1
    fi
    changed="$(git diff --name-only "$rel" HEAD -- "${outputs[@]}")"
    if [[ -n "$changed" ]]; then
      echo "✗ a push without before: the JS outputs differ from the last release $(git log -1 --format='%h %s' "$rel"):" >&2
      echo "$changed" | sed 's/^/    /' >&2
      exit 1
    fi
    echo "✓ a push without before: the JS outputs equal the last release $(git log -1 --format='%h %s' "$rel")"
    exit 0
  fi
  bad=0
  for c in $(git rev-list --reverse "$before..HEAD"); do
    if release_commit "$c"; then
      echo "✓ $(git log -1 --format=%h "$c") — the release PR's commit, the release job wrote the outputs"
      continue
    fi
    changed="$(git diff --name-only "$c^1" "$c" -- "${outputs[@]}")"
    if [[ -n "$changed" ]]; then
      bad=1
      echo "✗ $(git log -1 --format='%h %s' "$c") changes the committed JS outputs — only the release job writes them:" >&2
      echo "$changed" | sed 's/^/    /' >&2
    fi
  done
  if ((bad)); then exit 1; fi
  echo "✓ push $(git rev-parse --short "$before")..$(git rev-parse --short HEAD): the JS outputs untouched outside a release"
  exit 0
fi

if [[ $# -eq 0 && "$event" == "pull_request" ]]; then set -- HEAD^1 "${GITHUB_HEAD_REF:-}"; fi
base="${1:-origin/main}"
branch="${2:-$(git rev-parse --abbrev-ref HEAD)}"
if release_branch "$branch"; then
  echo "✓ release branch ($branch) — its job writes the committed outputs"
  exit 0
fi
if ! git rev-parse -q --verify "$base^{commit}" >/dev/null; then
  echo "✗ no base $base — git fetch origin main and repeat" >&2
  exit 1
fi
from="$(git merge-base "$base" HEAD)"
# Against the working tree: both what the branch committed and what it has not yet.
changed="$(git diff --name-only "$from" -- "${outputs[@]}")"
if [[ -n "$changed" ]]; then
  echo "✗ the committed JS outputs changed against $base — only the release job writes them (make build-release):" >&2
  echo "$changed" | sed 's/^/    /' >&2
  echo "  restore: git checkout $from -- ${outputs[*]}; tests run the dev build in dist/dev (make build-js)" >&2
  exit 1
fi
echo "✓ the committed JS outputs untouched against $base"
