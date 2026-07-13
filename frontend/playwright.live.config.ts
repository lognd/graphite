// WO-G5 deliverable 6 (live half): drives the REAL `regolith` CLI
// through a REAL `graphite serve` backend -- the mocked system rig
// (playwright.config.ts, VITE_USE_MOCKS=1) cannot exercise a real
// subprocess, a real SSE stream, a real cancel, or a real stderr-tail
// failure, so this is a SEPARATE config/webServer pair rather than a
// second project bolted onto the mocked one (`baseURL`s differ, and a
// backend process must be alive). `make check` does not run this by
// default (it needs uv + the real ../lithos regolith wheel available,
// same posture as pytest's `--run-integration`); invoke directly with
// `npx playwright test --config=playwright.live.config.ts`.

import { defineConfig, devices } from '@playwright/test';

const SCRATCH = process.env.GRAPHITE_E2E_LIVE_SCRATCH ?? '/tmp/graphite-e2e-live-fixture';

export default defineConfig({
  testDir: './tests/system-live',
  fullyParallel: false, // one shared backend process/runs-home -- avoid cross-test run interference
  retries: 0,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4175',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: `bash ../scripts/setup_live_fixture.sh ${SCRATCH} && GRAPHITE_SCAN_ROOT=${SCRATCH} GRAPHITE_RUNS_HOME=${SCRATCH}/.graphite-runs uv run --project .. uvicorn graphite.server.app:create_app --factory --host 127.0.0.1 --port 8000`,
      url: 'http://127.0.0.1:8000/api/ping',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command:
        'vite build --outDir dist-e2e-live && vite preview --outDir dist-e2e-live --port 4175',
      url: 'http://127.0.0.1:4175',
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
