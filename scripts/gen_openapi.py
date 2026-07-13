"""Regenerate the committed `openapi.json` from the live FastAPI app
(spec 02 sec. 2, the one-schema-source chain's second link). Run via
`make openapi`; `make check` runs `check_openapi_drift.py` to assert
this file is up to date without writing to it.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from graphite.server.app import create_app  # noqa: E402


def render() -> str:
    """The app's `openapi.json` bytes, deterministically formatted
    (sorted keys, trailing newline) so the drift check is a plain
    string compare."""
    schema = create_app().openapi()
    return json.dumps(schema, indent=2, sort_keys=True) + "\n"


def main() -> None:
    out_path = Path(__file__).resolve().parents[1] / "openapi.json"
    out_path.write_text(render())
    print(f"gen_openapi: wrote {out_path}")


if __name__ == "__main__":
    main()
