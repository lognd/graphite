import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import graphiteRules from './eslint-rules/no-raw-design-values.js';
import graphiteFetchRules from './eslint-rules/no-raw-fetch.js';

export default tseslint.config(
  {
    ignores: ['dist', 'dist-e2e', 'coverage', 'playwright-report', 'test-results', 'node_modules'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      graphite: { rules: { ...graphiteRules.rules, ...graphiteFetchRules.rules } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'graphite/no-raw-design-values': 'error',
      'graphite/no-raw-fetch': 'error',
    },
  },
  // The token source and generated files are exempt from the raw-value ban
  // by construction (they ARE the values / the generated mirror).
  {
    files: ['src/tokens/tokens.ts', 'scripts/**/*.ts'],
    rules: {
      'graphite/no-raw-design-values': 'off',
    },
  },
  // The api client itself is the one place allowed to call fetch.
  {
    files: ['src/api/client.ts', 'src/mocks/**/*.ts'],
    rules: {
      'graphite/no-raw-fetch': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/setupTests.ts', 'tests/**/*.ts'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  prettierConfig,
);
