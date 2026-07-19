"""The ONE home for graphite's real, live-flippable capability kill
switches (T-0016, closing the LINT004 waivers on the `service`/`core`
strata nodes: exec and net are the two risky capability kinds an
operator can plausibly need to disable without a redeploy -- module
docstring of frob's own `strata/_lint.py::RISKY_CAPABILITY_KINDS`).

Each switch is a single env var, read fresh on every call (mirroring
`graphite.service.settings.settings_home`'s pattern) so tests can
monkeypatch it per-case with no module-reload gymnastics, and no
process-wide state to leak between tests.

`GRAPHITE_NO_EXEC` disables every `regolith` subprocess spawn (the
`exec` capability declared on the `service` strata node --
`graphite.service.runs.start_run` and `graphite.service.config_cli.
_run`, the two choke points). `GRAPHITE_OFFLINE` disables the uvicorn
localhost bind (the `net` capability declared on the `core` node --
`graphite.cli.serve`, its one call site).

Both flags accept any of `""`/unset/`"0"`/`"false"` (case-insensitive)
as OFF; anything else engages the switch. Neither flag is stackable
with the other -- they gate independent capability kinds and a caller
that wants both off sets both env vars."""

from __future__ import annotations

import os

# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
# frob:ticket T-0016
NO_EXEC_ENV = "GRAPHITE_NO_EXEC"
# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
# frob:ticket T-0016
OFFLINE_ENV = "GRAPHITE_OFFLINE"

_FALSY = ("", "0", "false")


# frob:ticket T-0016
def _engaged(env_var: str) -> bool:
    return os.environ.get(env_var, "").strip().lower() not in _FALSY


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
# frob:ticket T-0016
def no_exec_engaged() -> bool:
    """Whether `GRAPHITE_NO_EXEC` is set (module docstring): the `exec`
    kill-switch for every `regolith` subprocess graphite spawns."""
    return _engaged(NO_EXEC_ENV)


# frob:doc docs/spec/02-architecture.md#14-service-layer-modules
# frob:ticket T-0016
def offline_engaged() -> bool:
    """Whether `GRAPHITE_OFFLINE` is set (module docstring): the `net`
    kill-switch for `graphite serve`'s uvicorn bind."""
    return _engaged(OFFLINE_ENV)
