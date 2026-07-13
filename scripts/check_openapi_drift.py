"""`make check` leg: the committed `openapi.json` must equal what
`scripts/gen_openapi.py` would generate right now -- a route added
without regenerating the schema fails this, loudly, in CI."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from gen_openapi import render  # noqa: E402


def main() -> int:
    committed_path = Path(__file__).resolve().parents[1] / "openapi.json"
    if not committed_path.is_file():
        print("check_openapi_drift: no committed openapi.json -- run `make openapi`")
        return 1
    committed = committed_path.read_text()
    current = render()
    if committed != current:
        print(
            "check_openapi_drift: openapi.json is stale -- run `make openapi` "
            "and commit the result"
        )
        return 1
    print("check_openapi_drift: openapi.json is up to date")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
