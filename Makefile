.PHONY: help install lint test check report dashboard clean types guard phase0-check

PYTHON ?= python
PYTEST ?= pytest
RUFF ?= ruff

help:
	@echo "Lift Automation Commands:"
	@echo "  make install      - Install package and development dependencies in editable mode"
	@echo "  make lint         - Run linter (ruff) and format checks"
	@echo "  make types        - Run mypy static type checking"
	@echo "  make guard        - Check banned phrases and untagged figures"
	@echo "  make test         - Run all test suites (invariants, unit, integration)"
	@echo "  make phase0-check - Run strict 6-stage Phase 0 verification"
	@echo "  make check        - Run Phase 0 check"
	@echo "  make report       - Generate baseline evaluation report"
	@echo "  make dashboard    - Launch local Next.js results dashboard"
	@echo "  make clean        - Clean python caches and temporary build artifacts"

install:
	$(PYTHON) -m pip install -e ".[dev]"

lint:
	$(RUFF) check .
	$(RUFF) format --check .

types:
	$(PYTHON) scripts/dev.py types

guard:
	$(PYTHON) scripts/dev.py guard

phase0-check:
	$(PYTHON) scripts/dev.py phase0-check

test:
	$(PYTEST) tests/invariants/ -v
	$(PYTEST) tests/unit/ -v
	$(PYTEST) tests/integration/ -v

check: phase0-check

report:
	$(PYTHON) -m core.cli.main report --results results/latest.json

dashboard:
	cd dashboard && npm run dev

clean:
	rm -rf build/ dist/ *.egg-info .pytest_cache .ruff_cache
	find . -type d -name "__pycache__" -exec rm -rf {} +
