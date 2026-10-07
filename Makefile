.PHONY: build validate check-bundles check-surface surface check test hooks

# Run the full CI gate locally: frontmatter contract + bundle sync + surface lint
# + the bridge's behavioural tests.
check: validate check-bundles check-surface test

# Validate every skill's frontmatter contract. Pure Node, no deps.
validate:
	@node scripts/validate-skills.mjs

# Verify the committed verstak.skill bundle matches skills/verstak/.
check-bundles:
	@bash scripts/check-bundles.sh

# Lint the corpus against the committed surface snapshot (offline, pure Node).
check-surface:
	@node scripts/check-surface.mjs

# Behavioural tests for the bundled bridge, against a local fake NKS + OAuth
# server (tests/fake-nks.mjs). Offline, no deps, touches no real token store.
test:
	@node --test tests/*.test.mjs

# Refresh fixtures/surface.json from the live server (network + authorized grant).
surface:
	@node scripts/export-surface.mjs

# Regenerate the committed verstak.skill bundle from skills/verstak/ (source of truth).
build:
	@bash scripts/build-skills.sh

# Enable the repo's pre-commit hook (auto-rebuilds .skill bundles before each commit).
hooks:
	@git config core.hooksPath .githooks
	@echo "core.hooksPath -> .githooks"
