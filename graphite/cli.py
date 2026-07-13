"""The `graphite` console script: `graphite tui` and `graphite serve`
(WO-59 deliverables 3/4; `serve` now starts the WO-G1 FastAPI backend)."""

from __future__ import annotations

from pathlib import Path

import typer

from graphite.logging_setup import get_logger

_log = get_logger(__name__)

app = typer.Typer(
    name="graphite",
    help="graphite: the regolith interaction surface (config TUI + local-web GUI).",
    no_args_is_help=True,
)


@app.command()
def tui(project: str = typer.Argument(".", help="Project root to open.")) -> None:
    """Launch the textual TUI: fleet dashboard, obligation list, run
    console, and config/doctor/settings -- the second renderer over the
    SAME `graphite.service` layer the web app uses (WO-G7)."""
    from graphite.tui.app import GraphiteApp

    GraphiteApp(project_root=Path(project)).run()


_LOCALHOST_HOSTS = ("127.0.0.1", "localhost", "::1")


@app.command()
def serve(
    project: str = typer.Argument(".", help="Fleet scan root to serve."),
    host: str = typer.Option("127.0.0.1", "--host", help="Bind host (localhost only)."),
    port: int = typer.Option(8765, "--port", help="Bind port."),
) -> None:
    """Start the FastAPI backend (spec 02 sec. 1/3) over every project
    discovered under `project` (a directory containing one or more
    `magnetite.toml` fleet members, or a single project root)."""
    import os

    import uvicorn

    from graphite.server.app import create_app

    if host not in _LOCALHOST_HOSTS:
        _log.error("graphite serve: refused non-localhost host %r", host)
        raise typer.BadParameter(
            f"graphite serve binds localhost only, got host={host!r}"
        )

    scan_root = Path(project).resolve()
    os.environ["GRAPHITE_SCAN_ROOT"] = str(scan_root)
    typer.echo(f"graphite serve: http://{host}:{port}/api/ping")
    _log.info("graphite serve: binding %s:%d, scan_root=%s", host, port, scan_root)
    uvicorn.run(create_app(), host=host, port=port, log_config=None)


if __name__ == "__main__":
    app()
