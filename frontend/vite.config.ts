/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Spec 02.7 (WASM doctrine): no wasm modules exist yet in this WO, but the
// rig is wired so that any future wasm/ crate output is bundled locally
// (never CDN-fetched) and loaded lazily per-route via dynamic import --
// default Vite code-splitting already gives us that for free as long as
// heavy routes/components are imported with `import()`, which the route
// skeleton in src/app/routes.tsx does.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // dev-time proxy to the FastAPI server (make dev); unused when
      // VITE_USE_MOCKS=1.
      '/api': 'http://127.0.0.1:8000',
    },
  },
  preview: {
    proxy: {
      // Same proxy target, for `vite preview` -- the WO-G5 live-fixture
      // Playwright rig (playwright.live.config.ts) builds+previews the
      // real (non-mocked) frontend against a real `graphite serve`
      // backend on this same port, so a real `regolith build --release`
      // is watchable end-to-end (spec 04.1's honest-failure/cancel
      // floor needs a real subprocess, not VITE_USE_MOCKS fixtures).
      '/api': 'http://127.0.0.1:8000',
    },
  },
  build: {
    outDir: '../graphite/server/static',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/setupTests.ts'],
    css: true,
    exclude: ['node_modules', 'dist', 'tests/system/**', 'tests/system-live/**'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
