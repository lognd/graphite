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
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
