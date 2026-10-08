.PHONY: build validate check-bundles check-surface surface check test hooks plugin deps check-core lint format format-check typecheck build-js build-release check-js check-frozen

# Run the full CI gate locally: frontmatter contract + bundle sync + surface lint
# + the JS ladder (core boundary → lint → format → types → shipped outputs are a
# release build → the behavioural suites). Needs `make deps` once per clone.
# check-frozen joins once the first release has shipped the frozen outputs.
check: validate check-bundles check-surface check-core lint format-check typecheck check-js test

# The dev toolchain for js/ — typescript, esbuild, eslint, prettier, and the pi and
# OpenCode types the core is checked against. Nothing here ships: the outputs under
# skills/ and extensions/ are dependency-free single files. It lives in js/, never
# at the root: Claude Code runs `npm ci` on any plugin whose root carries a lockfile.
deps:
	@cd js && npm ci --no-fund --no-audit

# Validate every skill's frontmatter contract. Pure Node, no deps.
validate:
	@node scripts/validate-skills.mjs

# Verify committed .skill bundles match their source skills/<name>/.
check-bundles:
	@bash scripts/check-bundles.sh

# Lint the corpus against the committed surface snapshot (offline, pure Node).
check-surface:
	@node scripts/check-surface.mjs

# The bridge core is the sibling delivery's, copied as is: it names no delivery
# (no Cyrillic, no product name, no L( — in text or path), and it matches the copy
# pinned in js/core.lock. Offline, pure Node.
check-core:
	@node scripts/check-core.mjs
	@node scripts/check-core-lock.mjs

# --- the JS ladder, over js/ (the single source of every shipped executable) ---
lint:
	@cd js && npm run -s lint

format:
	@cd js && npm run -s format

format-check:
	@cd js && npm run -s format:check

# Strict TypeScript over every source, the pi extension and the OpenCode plugin
# against their real types.
typecheck:
	@cd js && npm run -s typecheck

# The suites run against the dev build of js/ in dist/dev (js/tests/built.mjs),
# rebuilt first — the committed outputs are the release build. The shipped file
# claims Node 22 (it takes the global WebSocket); CI holds the run there.
# VERSTAK_BRIDGE_NO_UPDATE: under tests the bridge never aligns a real home and
# never asks for releases.
test: build-js
	@VERSTAK_BRIDGE_NO_UPDATE=1 node --test --test-timeout=300000 js/tests/*.test.mjs

# Build the shipped JS from js/ — the bridge (with daemon, watchdogs and doctor), the
# OpenCode plugin and the pi extension — as the dev build, into dist/dev (outside
# the index). Every install channel takes main, so the committed outputs are the
# release build, written by build-release (the release job, bundle-sync).
build-js:
	@node js/build.mjs

build-release:
	@VERSTAK_BUILD_CHANNEL=release node js/build.mjs
	@bash scripts/build-skills.sh

# The committed outputs are the release build: no dev mark, the bridge marked release.
check-js:
	@node js/build.mjs --check

# The lock on them: a branch other than the release job's leaves them as its base has them.
BASE ?= origin/main
check-frozen:
	@bash scripts/check-outputs-frozen.sh $(BASE)

# Refresh fixtures/surface.json from the live server (network + authorized grant).
surface:
	@node scripts/export-surface.mjs

# The dev build of the shipped JS, then the <name>.skill bundles from skills/
# (they carry the committed — release — outputs).
build: build-js
	@bash scripts/build-skills.sh

# Build the claude.ai plugin archive (dist/verstak.zip). CI attaches it to each GitHub Release.
plugin:
	@bash scripts/build-plugin.sh

# Enable the repo's pre-commit hook (lint-staged, dev build, .skill bundles).
hooks:
	@git config core.hooksPath .githooks
	@echo "core.hooksPath -> .githooks"
