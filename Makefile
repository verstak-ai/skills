.PHONY: build validate check-bundles check hooks

# Run the full CI gate locally: frontmatter contract + bundle sync.
check: validate check-bundles

# Validate every skill's frontmatter contract. Pure Node, no deps.
validate:
	@node scripts/validate-skills.mjs

# Verify committed .skill bundles match their source skills/<name>/.
check-bundles:
	@bash scripts/check-bundles.sh

# Regenerate the committed <name>.skill bundles from skills/<name>/ (source of truth).
build:
	@bash scripts/build-skills.sh

# Enable the repo's pre-commit hook (auto-rebuilds .skill bundles before each commit).
hooks:
	@git config core.hooksPath .githooks
	@echo "core.hooksPath -> .githooks"
