"""`graphite.service.kill_switch`: the real GRAPHITE_NO_EXEC/
GRAPHITE_OFFLINE env-var kill switches (T-0016, closing the LINT004
waivers on the `service`/`core` strata nodes)."""

from __future__ import annotations

import pytest

from graphite.service import kill_switch


# frob:tests graphite/service/kill_switch.py::no_exec_engaged
# frob:ticket T-0016
@pytest.mark.parametrize("value", ["1", "true", "TRUE", "yes", "on"])
def test_no_exec_engaged_for_truthy_values(
    monkeypatch: pytest.MonkeyPatch, value: str
) -> None:
    monkeypatch.setenv("GRAPHITE_NO_EXEC", value)
    assert kill_switch.no_exec_engaged() is True


# frob:tests graphite/service/kill_switch.py::no_exec_engaged
# frob:ticket T-0016
@pytest.mark.parametrize("value", ["0", "false", "FALSE", ""])
def test_no_exec_not_engaged_for_falsy_values(
    monkeypatch: pytest.MonkeyPatch, value: str
) -> None:
    monkeypatch.setenv("GRAPHITE_NO_EXEC", value)
    assert kill_switch.no_exec_engaged() is False


# frob:tests graphite/service/kill_switch.py::no_exec_engaged
# frob:ticket T-0016
def test_no_exec_not_engaged_when_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GRAPHITE_NO_EXEC", raising=False)
    assert kill_switch.no_exec_engaged() is False


# frob:tests graphite/service/kill_switch.py::offline_engaged
# frob:ticket T-0016
def test_offline_engaged_when_set(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GRAPHITE_OFFLINE", "1")
    assert kill_switch.offline_engaged() is True


# frob:tests graphite/service/kill_switch.py::offline_engaged
# frob:ticket T-0016
def test_offline_not_engaged_when_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GRAPHITE_OFFLINE", raising=False)
    assert kill_switch.offline_engaged() is False
