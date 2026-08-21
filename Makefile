.PHONY: build validate check-bundles check hooks plugin

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

# Build the claude.ai plugin archive (dist/verstak.zip). CI attaches it to each GitHub Release.
plugin:
	@bash scripts/build-plugin.sh

# Enable the repo's pre-commit hook (auto-rebuilds .skill bundles before each commit).
hooks:
	@git config core.hooksPath .githooks
	@echo "core.hooksPath -> .githooks"
