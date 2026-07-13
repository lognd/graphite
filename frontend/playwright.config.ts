// Playwright system rig (WO-G2 deliverable 6): runs against the real
// built/served app with VITE_USE_MOCKS=1 so no backend process is needed
// (spec 02.5/02.6). Includes the zero-external-request assertion that is
// the charter's runtime enforcement mechanism.

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/system',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  // The WO-G6 real-backend spec shells out to the actual `regolith` CLI
  // (subprocess startup cost, sometimes twice per assertion) -- a longer
  // default expect timeout covers it without every mocked-spec assertion
  // needing its own override.
  expect: { timeout: 20000 },
  webServer: [
    {
      // The production-shipped bundle (what a user's `graphite` process
      // actually serves): dev-only routes like /dev/gallery are absent by
      // design, so the zero-external-request and shell-navigation specs
      // run here. VITE_USE_MOCKS is inlined at build time, so it must be
      // set before `vite build`, not just before `vite preview`.
      command:
        'VITE_USE_MOCKS=1 vite build --outDir dist-e2e && vite preview --outDir dist-e2e --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
    },
    {
      // The dev server, which registers /dev/gallery (spec: dev-only
      // route) -- the gallery a11y/theme spec targets this one via its
      // own baseURL override.
      command: 'VITE_USE_MOCKS=1 vite --port 5174',
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: !process.env.CI,
    },
    {
      // WO-G6's real-backend project: config/doctor round-trip specs
      // need an actual `regolith` subprocess underneath (not the static
      // mocks), so this spins up a REAL `graphite serve` over a
      // throwaway COPY of the fixture project (never the committed
      // tests/fixtures/ tree -- config set/reset must not dirty the
      // working tree) on its own port.
      command:
        'rm -rf /tmp/graphite-pw-fixture && cp -r ../tests/fixtures /tmp/graphite-pw-fixture ' +
        '&& cd .. && uv run python -m graphite.cli serve /tmp/graphite-pw-fixture --port 8766',
      url: 'http://127.0.0.1:8766/api/ping',
      reuseExistingServer: !process.env.CI,
    },
    {
      // The un-mocked dev server for the same real-backend project,
      // proxying /api to the port above (vite.config.ts's
      // VITE_API_PROXY_TARGET override).
      command: 'VITE_API_PROXY_TARGET=http://127.0.0.1:8766 vite --port 5175',
      url: 'http://127.0.0.1:5175',
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
