"""Route modules, one per resource family (spec 02 sec. 1). Each
module owns exactly one `APIRouter` and calls ONLY into
`graphite.service` -- no report parsing, no subprocess calls, no
filesystem globbing here."""
