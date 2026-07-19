"""Route modules, one per resource family (spec 02 sec. 1). Each
module owns exactly one `APIRouter` and calls ONLY into
`graphite.service` -- no report parsing, no subprocess calls, no
filesystem globbing here."""

from __future__ import annotations

from graphite.server.routes.artifacts import (
    fetch_project_artifact,
    get_project_artifact_index,
    list_project_artifacts,
)
from graphite.server.routes.build import (
    get_build_report,
    get_gate_summary,
    get_lockfile,
    get_manifest,
)
from graphite.server.routes.calc import (
    get_acceptance_ledger,
    get_audit_index,
    list_calc_sheets,
)
from graphite.server.routes.config import (
    get_config_schema,
    get_project_config,
    list_project_config,
    set_project_config,
)
from graphite.server.routes.doctor import get_doctor
from graphite.server.routes.health import ProjectHealth, get_project_health
from graphite.server.routes.obligations import (
    ObligationGroup,
    ObligationsResponse,
    get_obligations,
)
from graphite.server.routes.projects import get_project, list_projects
from graphite.server.routes.runs import (
    cancel_project_run,
    get_run_detail,
    get_run_log,
    get_run_verdict_diff,
    list_project_runs,
    run_events,
    start_project_run,
)
from graphite.server.routes.scans import upload_scan
from graphite.server.routes.settings import (
    read_settings,
    reset_settings_route,
    write_settings,
)

__all__ = [
    "ObligationGroup",
    "ObligationsResponse",
    "ProjectHealth",
    "cancel_project_run",
    "fetch_project_artifact",
    "get_acceptance_ledger",
    "get_audit_index",
    "get_build_report",
    "get_config_schema",
    "get_doctor",
    "get_gate_summary",
    "get_lockfile",
    "get_manifest",
    "get_obligations",
    "get_project",
    "get_project_artifact_index",
    "get_project_config",
    "get_project_health",
    "get_run_detail",
    "get_run_log",
    "get_run_verdict_diff",
    "list_calc_sheets",
    "list_project_artifacts",
    "list_project_config",
    "list_project_runs",
    "list_projects",
    "read_settings",
    "reset_settings_route",
    "run_events",
    "set_project_config",
    "start_project_run",
    "upload_scan",
    "write_settings",
]
