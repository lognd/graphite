.PHONY: install test lint format typecheck openapi openapi-check \
        frontend-install frontend-api-gen frontend-api-check \
        frontend-check frontend-test frontend-system-test \
        backend-check check clean build size-check screenshots

UV ?= uv
NPM ?= npm --prefix frontend

install: ## uv sync (editable path dep on ../lithos regolith wheel)
	$(UV) sync

test: ## graphite's pytest suite (fixture-only; add --run-integration for ../lithos)
	$(UV) run pytest

lint: ## ruff check
	$(UV) run ruff check graphite tests scripts

format: ## ruff format
	$(UV) run ruff format graphite tests scripts

typecheck: ## ty over the package
	$(UV) run ty check graphite

openapi: ## regenerate the committed openapi.json from the live FastAPI app
	$(UV) run python scripts/gen_openapi.py

openapi-check: ## drift check: committed openapi.json matches the live app
	$(UV) run python scripts/check_openapi_drift.py

frontend-install: ## npm install for the frontend (Node is a dev-only dependency, spec 02.5)
	$(NPM) install

frontend-api-gen: ## regenerate frontend/src/api/api.generated.ts from openapi.json (dev-only, needs Node)
	$(NPM) run gen:api

frontend-api-check: ## drift check: api.generated.ts matches openapi.json (dev-only, needs Node)
	$(NPM) run check:api-drift

# Cheapest-first (spec 02.6/04.2's drift + lint checks before the heavier
# vitest/build legs), self-contained: this target alone is the full
# frontend gate WO-G2 promises.
frontend-check: ## lint, format, typecheck, vitest, token drift check, build
	$(NPM) run lint
	$(NPM) run format
	$(NPM) run typecheck
	$(NPM) run check:tokens
	$(NPM) run test
	$(NPM) run build

frontend-test: ## frontend vitest unit/component suite only
	$(NPM) run test

frontend-system-test: ## Playwright system rig (mocked specs + the ONE real-backend rig: config/doctor round-trip, run-console live)
	$(NPM) run test:system

backend-check: lint typecheck test openapi-check ## the WO-G1 backend leg, self-contained (no Node needed)

build: ## full release build: vite bundle into graphite/server/static/, then the wheel (WO-G8)
	$(NPM) run build
	$(UV) build --wheel

# Checks the build output frontend-check just produced (its last leg is
# `npm run build`, which writes graphite/server/static/) -- no second
# build here (dedup); run `make frontend-check` or `make build` first
# when invoking this standalone.
size-check: ## bundle budget gate (WO-G8): main chunk must stay under its recorded budget
	$(UV) run python scripts/check_bundle_size.py

screenshots: ## regenerate docs/screenshots/*.png via Playwright (WO-G8; committed, not asserted)
	cd frontend && GRAPHITE_SCREENSHOTS=1 npx playwright test tests/system/capture-screenshots.spec.ts

check: backend-check frontend-check frontend-api-check size-check frontend-system-test ## full gate, cheapest first

clean:
	rm -rf .pytest_cache .ruff_cache build *.egg-info
	rm -rf frontend/node_modules frontend/dist frontend/dist-e2e
	rm -rf frontend/coverage frontend/playwright-report frontend/test-results
	rm -rf graphite/server/static
	# NOTE: top-level dist/ (wheel build output) is intentionally not
	# swept here -- tests/fixtures/**/dist is a committed fixture, and
	# a blanket `rm -rf dist` at repo root is one keystroke away from
	# it if a future edit moves this rule; remove wheel dist/ by hand
	# (`rm -rf dist`) when needed instead.
