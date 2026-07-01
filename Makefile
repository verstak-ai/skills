.PHONY: build validate check-bundles check hooks release version

# BUMP selects the semver segment for `make release` (override: make release BUMP=minor).
BUMP ?= patch

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

# Print the current plugin version.
version:
	@node scripts/bump-version.mjs --print

# Cut a release: bump the plugin version, keeping .claude-plugin/plugin.json and
# marketplace.json in lockstep (a version change is what makes installs update).
#   make release                # patch bump (default)
#   make release BUMP=minor     # or BUMP=major
#   make release VERSION=2.0.0  # set an explicit version
release:
	@node scripts/bump-version.mjs $(if $(VERSION),$(VERSION),$(BUMP))
