"""Unit tests for `graphite.server.deps`: scan-root resolution and
`{project}` path-segment -> `ProjectInfo`/root-path resolution."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi import HTTPException

from graphite.server.deps import (
    list_all_projects,
    project_root_path,
    resolve_project,
    scan_root,
)
from tests.api.conftest import PROJECT_NAME

# frob:tests graphite/server/deps.py kind="integration"
# frob:tests graphite/server/deps.py::scan_root kind="unit"
def test_scan_root_reads_env_var(
    fixture_scan_root: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("GRAPHITE_SCAN_ROOT", str(fixture_scan_root))
    assert scan_root() == fixture_scan_root.resolve()


# frob:tests graphite/server/deps.py::list_all_projects kind="unit"
def test_list_all_projects(
    fixture_scan_root: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("GRAPHITE_SCAN_ROOT", str(fixture_scan_root))
    projects = list_all_projects()
    assert any(p.name == PROJECT_NAME for p in projects)


# frob:tests graphite/server/deps.py::resolve_project kind="unit"
# frob:tests graphite/server/deps.py::project_root_path kind="unit"
def test_resolve_project_and_root_path(
    fixture_scan_root: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("GRAPHITE_SCAN_ROOT", str(fixture_scan_root))
    info = resolve_project(PROJECT_NAME)
    assert info.name == PROJECT_NAME
    assert project_root_path(PROJECT_NAME) == Path(info.root)


def test_resolve_project_unknown_raises_404(
    fixture_scan_root: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("GRAPHITE_SCAN_ROOT", str(fixture_scan_root))
    with pytest.raises(HTTPException) as exc_info:
        resolve_project("does-not-exist")
    assert exc_info.value.status_code == 404
