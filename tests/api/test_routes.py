"""One pytest per REST v1 route (spec 02 sec. 6: "every route: a
pytest against the service layer with a fixture project"), against the
committed `timber_pavilion` fixture through a real `TestClient`."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from graphite.server.app import create_app
from tests.api.conftest import PROJECT_NAME


def test_ping(api_client: TestClient) -> None:
    assert api_client.get("/api/ping").json() == {"status": "ok"}


def test_list_projects(api_client: TestClient) -> None:
    body = api_client.get("/api/projects").json()
    assert len(body) == 1
    assert body[0]["name"] == PROJECT_NAME


def test_get_project(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}")
    assert resp.status_code == 200
    assert resp.json()["name"] == PROJECT_NAME


def test_get_project_unknown_404(api_client: TestClient) -> None:
    resp = api_client.get("/api/projects/does-not-exist")
    assert resp.status_code == 404
    assert resp.json()["detail"]["kind"] == "not_found"


def test_obligations_flat(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}/obligations")
    assert resp.status_code == 200
    body = resp.json()
    assert body["summary"]["obligations"] == 10
    assert body["rows"] is not None
    assert body["groups"] is None


def test_obligations_filtered(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}/obligations?filter=discharged")
    assert resp.status_code == 200
    body = resp.json()
    assert all(r["disposition"] == "discharged" for r in body["rows"])


def test_obligations_grouped_by_family(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}/obligations?group=family")
    assert resp.status_code == 200
    body = resp.json()
    assert body["rows"] is None
    assert body["groups"] is not None
    keys = {g["key"] for g in body["groups"]}
    assert "strength" in keys


def test_calc_sheets(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}/calc/sheets")
    assert resp.status_code == 200
    assert len(resp.json()) == 6


def test_calc_audit(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}/calc/audit")
    assert resp.status_code == 200
    assert resp.json()["summary"]["obligations"] == 10


def test_build_report(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}/build-report")
    assert resp.status_code == 200
    assert resp.json()["final"]["release_ok"] is True


def test_lockfile(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}/lockfile")
    assert resp.status_code == 200
    assert len(resp.json()["sections"]) == 2


def test_manifest(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}/manifest")
    assert resp.status_code == 200
    assert resp.json()["signed"] is False


def test_gate_summary(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}/gate-summary")
    assert resp.status_code == 200
    body = resp.json()
    assert body["release_ok"] is True
    assert body["counts"]["accepted_deviation"] == 4


def test_acceptance_ledger(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}/acceptance-ledger")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["accepted_deviations"]) == 3
    assert body["accepted_deviations"][0]["target"] == "bearing"


def test_artifacts_list_and_fetch(api_client: TestClient) -> None:
    listing = api_client.get(f"/api/projects/{PROJECT_NAME}/artifacts")
    assert listing.status_code == 200
    entries = listing.json()
    assert len(entries) > 0
    svg_entry = next(e for e in entries if e["relpath"].endswith(".svg"))
    fetched = api_client.get(
        f"/api/projects/{PROJECT_NAME}/artifacts/{svg_entry['content_hash']}"
    )
    assert fetched.status_code == 200
    assert b"<svg" in fetched.content or b"<?xml" in fetched.content


def test_artifacts_fetch_unknown_hash_404(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}/artifacts/sha256:deadbeef")
    assert resp.status_code == 404


def test_artifact_index_boards_and_harness(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """WO-G9: the typed index route the frontend hub now drives off of --
    checked against the fixtures dir directly (GET-only, read-only) since
    `mainboard_mx` (unlike `timber_pavilion`) ships `boards`/`harness`."""
    fixtures_dir = Path(__file__).parent.parent / "fixtures"
    monkeypatch.setenv("GRAPHITE_SCAN_ROOT", str(fixtures_dir))
    monkeypatch.setenv("GRAPHITE_RUNS_HOME", str(tmp_path / "runs-home"))
    monkeypatch.setenv("GRAPHITE_HOME", str(tmp_path / "graphite-home"))
    client = TestClient(create_app())

    resp = client.get("/api/projects/mainboard_mx/artifact-index")
    assert resp.status_code == 200
    rows = resp.json()
    families = {r["family"] for r in rows}
    assert families == {"boards", "harness"}
    assert all(r["content_hash"].startswith("sha256:") for r in rows)
    silk = [r for r in rows if "Silkscreen" in r["relpath"]]
    assert silk and all(r["viewer"] == "gerber" for r in silk)


def test_health(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["release_ok"] is True
    assert body["obligation_summary"]["obligations"] == 10


def test_config_list(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}/config")
    assert resp.status_code == 200
    keys = {e["key"] for e in resp.json()}
    assert "ui.port" in keys


def test_config_get_one_key(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}/config/ui.port")
    assert resp.status_code == 200
    assert resp.json()["source"] == "default"


def test_config_schema(api_client: TestClient) -> None:
    resp = api_client.get("/api/config/schema")
    assert resp.status_code == 200
    body = resp.json()
    entry = next(e for e in body if e["key"] == "ui.port")
    assert entry["default"] == 8765
    assert entry["kind"] == "int"


def test_config_set_and_reset_round_trip(api_client: TestClient) -> None:
    set_resp = api_client.put(
        f"/api/projects/{PROJECT_NAME}/config/ui.port",
        json={"value": "9999", "level": "local"},
    )
    assert set_resp.status_code == 200
    assert set_resp.json()["value"] == "9999"
    assert set_resp.json()["source"] == "project"

    default = next(
        e["default"]
        for e in api_client.get("/api/config/schema").json()
        if e["key"] == "ui.port"
    )
    reset_resp = api_client.put(
        f"/api/projects/{PROJECT_NAME}/config/ui.port",
        json={"value": str(default), "level": "local"},
    )
    assert reset_resp.status_code == 200
    assert reset_resp.json()["value"] == str(default)


def test_config_set_unknown_key_is_a_real_cli_error(api_client: TestClient) -> None:
    resp = api_client.put(
        f"/api/projects/{PROJECT_NAME}/config/does.not.exist",
        json={"value": "1", "level": "local"},
    )
    assert resp.status_code == 502
    assert "does.not.exist" in resp.json()["detail"]["detail"]


def test_doctor(api_client: TestClient) -> None:
    resp = api_client.get(f"/api/projects/{PROJECT_NAME}/doctor")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_settings_defaults_and_round_trip(
    api_client: TestClient, tmp_path, monkeypatch
) -> None:
    monkeypatch.setenv("GRAPHITE_HOME", str(tmp_path / "graphite-home"))

    initial = api_client.get("/api/settings")
    assert initial.status_code == 200
    assert initial.json() == {
        "default_project_root": "",
        "run_verbosity": "normal",
        "run_history_limit": 200,
    }

    put = api_client.put(
        "/api/settings",
        json={"default_project_root": "/tmp/some-project", "run_verbosity": "verbose"},
    )
    assert put.status_code == 200
    assert put.json()["run_verbosity"] == "verbose"

    after = api_client.get("/api/settings")
    assert after.json()["default_project_root"] == "/tmp/some-project"

    reset = api_client.post("/api/settings/reset")
    assert reset.status_code == 200
    assert reset.json()["run_verbosity"] == "normal"


def test_settings_invalid_verbosity_is_a_real_validation_error(
    api_client: TestClient,
) -> None:
    resp = api_client.put(
        "/api/settings",
        json={"default_project_root": "", "run_verbosity": "extremely-loud"},
    )
    assert resp.status_code == 422


def test_start_run_and_poll(api_client: TestClient) -> None:
    started = api_client.post(
        f"/api/projects/{PROJECT_NAME}/runs",
        json={"verb": "check", "args": ["program.calx"]},
    )
    assert started.status_code == 200
    run_id = started.json()["run_id"]

    detail = api_client.get(f"/api/runs/{run_id}")
    assert detail.status_code == 200
    assert detail.json()["run_id"] == run_id

    history = api_client.get(f"/api/projects/{PROJECT_NAME}/runs")
    assert history.status_code == 200
    assert any(r["run_id"] == run_id for r in history.json())


def test_run_events_streams_and_closes(api_client: TestClient) -> None:
    started = api_client.post(
        f"/api/projects/{PROJECT_NAME}/runs",
        json={"verb": "check", "args": ["program.calx"]},
    )
    run_id = started.json()["run_id"]
    saw_done = False
    with api_client.stream("GET", f"/api/runs/{run_id}/events") as resp:
        assert resp.status_code == 200
        for raw_line in resp.iter_lines():
            if raw_line.startswith("data: "):
                payload = json.loads(raw_line[len("data: ") :])
                if payload["kind"] == "done":
                    saw_done = True
                    break
    assert saw_done


def test_run_started_captures_before_health(api_client: TestClient) -> None:
    started = api_client.post(
        f"/api/projects/{PROJECT_NAME}/runs",
        json={"verb": "check", "args": ["program.calx"]},
    )
    assert started.status_code == 200
    assert "before_health" in started.json()


def test_run_full_log_replay(api_client: TestClient) -> None:
    started = api_client.post(
        f"/api/projects/{PROJECT_NAME}/runs",
        json={"verb": "check", "args": ["program.calx"]},
    )
    run_id = started.json()["run_id"]
    # Drain the SSE stream to completion so the log file is fully written.
    with api_client.stream("GET", f"/api/runs/{run_id}/events") as resp:
        for raw_line in resp.iter_lines():
            if (
                raw_line.startswith("data: ")
                and json.loads(raw_line[len("data: ") :]).get("kind") == "done"
            ):
                break
    log_resp = api_client.get(f"/api/runs/{run_id}/log")
    assert log_resp.status_code == 200
    assert isinstance(log_resp.json(), list)
    assert any("check" in line for line in log_resp.json())


def test_run_verdict_diff(api_client: TestClient) -> None:
    started = api_client.post(
        f"/api/projects/{PROJECT_NAME}/runs",
        json={"verb": "check", "args": ["program.calx"]},
    )
    run_id = started.json()["run_id"]
    resp = api_client.get(f"/api/runs/{run_id}/verdict-diff")
    assert resp.status_code == 200
    body = resp.json()
    assert "before" in body and "after" in body


def test_run_cancel_running_process(api_client: TestClient) -> None:
    started = api_client.post(
        f"/api/projects/{PROJECT_NAME}/runs",
        json={"verb": "check", "args": ["program.calx"]},
    )
    run_id = started.json()["run_id"]
    resp = api_client.post(f"/api/runs/{run_id}/cancel")
    assert resp.status_code == 200
    assert resp.json()["status"] in ("cancelled", "ok", "failed")


def test_run_cancel_unknown_run_404(api_client: TestClient) -> None:
    resp = api_client.post("/api/runs/no-such-run/cancel")
    assert resp.status_code == 404
