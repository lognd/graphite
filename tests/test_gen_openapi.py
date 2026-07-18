"""`scripts/gen_openapi.py`: regenerating the committed OpenAPI spec."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from scripts.gen_openapi import main, render


# frob:tests scripts/gen_openapi.py::render kind="unit"
def test_render_produces_sorted_deterministic_json() -> None:
    text = render()
    assert text.endswith("\n")
    schema = json.loads(text)
    assert schema["info"]["title"] == "graphite backend API"
    # sort_keys=True means re-dumping with sorted keys is a no-op.
    assert json.dumps(schema, indent=2, sort_keys=True) + "\n" == text


# frob:tests scripts/gen_openapi.py::main kind="unit"
def test_main_writes_openapi_json(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    fake_repo_root = tmp_path
    monkeypatch.setattr("scripts.gen_openapi.__file__", str(fake_repo_root / "scripts" / "gen_openapi.py"))
    main()
    out_path = fake_repo_root / "openapi.json"
    assert out_path.is_file()
    assert json.loads(out_path.read_text())["info"]["title"] == "graphite backend API"
