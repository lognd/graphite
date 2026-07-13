.PHONY: install test lint format typecheck check clean frontend-install frontend-check frontend-test frontend-system-test dev

UV ?= uv
NPM ?= npm --prefix frontend

install: ## uv sync (editable path dep on ../lithos regolith wheel)
	$(UV) sync

test: ## graphite's pytest suite
	$(UV) run pytest

lint: ## ruff check
	$(UV) run ruff check graphite tests

format: ## ruff format
	$(UV) run ruff format graphite tests

typecheck: ## ty over the package
	$(UV) run ty check graphite

frontend-install: ## npm ci for the frontend (Node is a dev-only dependency, spec 02.5)
	$(NPM) install

# Cheapest-first (spec 02.6/04.2's drift + lint checks before the heavier
# vitest/build legs), self-contained: this target alone is the full
# frontend gate WO-G2 promises.
frontend-check: ## lint, typecheck, vitest, token/type drift checks, build
	$(NPM) run lint
	$(NPM) run format
	$(NPM) run typecheck
	$(NPM) run check:tokens
	$(NPM) run test
	$(NPM) run build

frontend-test: ## frontend vitest unit/component suite only
	$(NPM) run test

frontend-system-test: ## Playwright system rig (zero-external-request, shell nav, gallery a11y)
	$(NPM) run test:system

check: lint typecheck test frontend-check frontend-system-test ## full gate, cheapest first

clean:
	rm -rf .pytest_cache .ruff_cache build dist *.egg-info
	rm -rf frontend/dist frontend/dist-e2e frontend/coverage frontend/playwright-report frontend/test-results
	rm -rf graphite/server/static
