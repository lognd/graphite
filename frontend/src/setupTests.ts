import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// globals:false (see vite.config.ts) means testing-library's automatic
// per-test cleanup detection doesn't fire; register it explicitly so DOM
// state never leaks between tests.
afterEach(() => {
  cleanup();
});

// jsdom's Clipboard API implementation rejects writes outside a real user
// gesture/permission context; replace it with a plain configurable stub so
// component tests can spy on navigator.clipboard.writeText.
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: async () => {} },
  writable: true,
  configurable: true,
});
