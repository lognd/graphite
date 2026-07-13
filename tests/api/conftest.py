"""API test fixtures: a `TestClient` bound to a scan root holding the
fixture project (or a copy of it, for tests that drive runs)."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from graphite.server.app import create_app


@pytest.fixture
def api_client(
    fixture_scan_root: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> TestClient:
    monkeypatch.setenv("GRAPHITE_SCAN_ROOT", str(fixture_scan_root))
    monkeypatch.setenv("GRAPHITE_RUNS_HOME", str(tmp_path / "runs-home"))
    # Settings isolation (WO-G6 merge): start_run reads run_verbosity,
    # so the dev machine's real ~/.graphite must never leak in.
    monkeypatch.setenv("GRAPHITE_HOME", str(tmp_path / "graphite-home"))
    return TestClient(create_app())


PROJECT_NAME = "examples.timber_pavilion"
