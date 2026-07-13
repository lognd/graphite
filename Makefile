.PHONY: install test lint format typecheck openapi openapi-check \
        frontend-api-gen frontend-api-check backend-check check clean

UV ?= uv
NPM ?= npm

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

frontend-api-gen: ## regenerate frontend/src/api/api.generated.ts from openapi.json (dev-only, needs Node)
	cd frontend && $(NPM) install --silent && $(NPM) run gen:api

frontend-api-check: ## drift check: api.generated.ts matches openapi.json (dev-only, needs Node)
	cd frontend && $(NPM) install --silent && $(NPM) run check:api-drift

backend-check: lint typecheck test openapi-check ## the WO-G1 backend leg, self-contained (no Node needed)

check: backend-check frontend-api-check ## full gate, cheapest first

clean:
	rm -rf .pytest_cache .ruff_cache build *.egg-info
	rm -rf frontend/node_modules
	# NOTE: top-level dist/ (wheel build output) is intentionally not
	# swept here -- tests/fixtures/**/dist is a committed fixture, and
	# a blanket `rm -rf dist` at repo root is one keystroke away from
	# it if a future edit moves this rule; remove wheel dist/ by hand
	# (`rm -rf dist`) when needed instead.
