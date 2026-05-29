.PHONY: build hooks

# Regenerate the committed <name>.skill bundles from skills/<name>/ (source of truth).
build:
	@bash scripts/build-skills.sh

# Enable the repo's pre-commit hook (auto-rebuilds .skill bundles before each commit).
hooks:
	@git config core.hooksPath .githooks
	@echo "core.hooksPath -> .githooks"
