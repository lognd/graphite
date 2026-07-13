.PHONY: install test lint format typecheck check clean

UV ?= uv

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

check: lint typecheck test ## full gate, cheapest first

clean:
	rm -rf .pytest_cache .ruff_cache build dist *.egg-info
