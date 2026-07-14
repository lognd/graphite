"""WO-G8 deliverable 6: `graphite serve` serves the bundled frontend --
SPA fallback for client routes, real files for real assets, and JSON 404s
(never index.html) for unknown API paths. Uses a synthetic static dir so
the test never depends on an actual vite build having run."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def static_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    """An app whose static dir is a synthetic two-file bundle."""
    static = tmp_path / "static"
    (static / "assets").mkdir(parents=True)
    (static / "index.html").write_text("<!doctype html><title>graphite</title>")
    (static / "assets" / "main.js").write_text("// bundled js")

    import graphite.server.app as app_module

    monkeypatch.setattr(app_module, "_STATIC_DIR", static)
    return TestClient(app_module.create_app())


def test_index_served_at_root(static_client: TestClient) -> None:
    resp = static_client.get("/")
    assert resp.status_code == 200
    assert "graphite" in resp.text


def test_real_asset_served(static_client: TestClient) -> None:
    resp = static_client.get("/assets/main.js")
    assert resp.status_code == 200
    assert resp.text == "// bundled js"


def test_spa_fallback_for_client_route(static_client: TestClient) -> None:
    """A hard reload on a client-side route must serve index.html."""
    resp = static_client.get("/project/examples.timber_pavilion/obligations")
    assert resp.status_code == 200
    assert "graphite" in resp.text


def test_api_404_stays_json(static_client: TestClient) -> None:
    """Unknown API paths must never fall back to index.html."""
    resp = static_client.get("/api/definitely-not-a-route")
    assert resp.status_code == 404
    assert "text/html" not in resp.headers.get("content-type", "")


def test_api_still_works_with_static_mounted(static_client: TestClient) -> None:
    assert static_client.get("/api/ping").json() == {"status": "ok"}


def test_no_static_dir_is_api_only(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Without a build (dev checkout, no `make build`) the app stays
    API-only and still assembles."""
    import graphite.server.app as app_module

    monkeypatch.setattr(app_module, "_STATIC_DIR", tmp_path / "missing")
    client = TestClient(app_module.create_app())
    assert client.get("/api/ping").json() == {"status": "ok"}
    assert client.get("/").status_code == 404
