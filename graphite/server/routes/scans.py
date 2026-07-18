"""`/api/projects/{project}/scans`: upload a scan image for the
scan-trace studio (WO-G11 deliverable 1). The ONE write this WO owns
(D253/D259): brand-new bytes under `traced/scans/`, never an edit of
an existing file. The `.rgp`/`.hema` write seam belongs to WO-G12."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Form, UploadFile

from graphite.server.deps import project_root_path
from graphite.server.errors import raise_for_error
from graphite.service.scan_upload import ScanEntry, save_scan

router = APIRouter(prefix="/api/projects", tags=["scans"])


@router.post("/{project}/scans", response_model=ScanEntry)
async def upload_scan(
    project: str, file: UploadFile, name: str = Form(...)
) -> ScanEntry:
    """Store an uploaded scan under `traced/scans/<name><ext>` and
    return its blake3 hash. `name` is the studio's display name for the
    scan (validated, never the raw client filename); the extension is
    taken from the uploaded filename."""
    root = project_root_path(project)
    ext = Path(file.filename or "").suffix
    data = await file.read()
    result = save_scan(root, name, ext, data)
    if result.is_err:
        raise_for_error(result.danger_err)
    return result.danger_ok
