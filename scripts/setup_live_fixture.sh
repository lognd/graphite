#!/usr/bin/env bash
# WO-G5 live-fixture rig: a fresh scratch copy of the committed
# tests/fixtures/timber_pavilion project, for the Playwright live-run
# spec (frontend/tests/system-live) to drive with the REAL regolith CLI
# through a REAL `graphite serve` backend -- VITE_USE_MOCKS fixtures
# cannot exercise a real subprocess/SSE/cancel path, so this rig exists
# alongside (never instead of) the mocked system spec.
#
# Usage: scripts/setup_live_fixture.sh [scratch-dir]
# Prints the scratch dir's scan-root (its parent) on stdout.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRATCH="${1:-/tmp/graphite-e2e-live-fixture}"

rm -rf "$SCRATCH"
mkdir -p "$SCRATCH"
cp -r "$REPO_ROOT/tests/fixtures/timber_pavilion" "$SCRATCH/timber_pavilion"

echo "$SCRATCH"
