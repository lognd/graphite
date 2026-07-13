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
  build: {
    outDir: '../graphite/server/static',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/setupTests.ts'],
    css: true,
    exclude: ['node_modules', 'dist', 'tests/system/**'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
