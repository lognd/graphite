// Drift check for the token law (spec 03.4 / 02.2): regenerates both
// mirrors in memory and fails if they differ from the committed files --
// catches a human hand-editing tokens.css or tui/tokens.py instead of
// tokens.ts.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, '..');

const committedCss = path.join(repoRoot, 'src/tokens/tokens.css');
const committedPy = path.join(repoRoot, '../graphite/tui/tokens.py');

const before = {
  css: readFileSync(committedCss, 'utf8'),
  py: readFileSync(committedPy, 'utf8'),
};

execFileSync(
  process.execPath,
  [path.join(repoRoot, 'node_modules/.bin/tsx'), path.join(here, 'build-tokens.ts')],
  {
    stdio: 'inherit',
  },
);

const after = {
  css: readFileSync(committedCss, 'utf8'),
  py: readFileSync(committedPy, 'utf8'),
};

let drifted = false;
if (before.css !== after.css) {
  console.error('DRIFT: src/tokens/tokens.css does not match the generator output for tokens.ts.');
  drifted = true;
}
if (before.py !== after.py) {
  console.error('DRIFT: graphite/tui/tokens.py does not match the generator output for tokens.ts.');
  drifted = true;
}

if (drifted) {
  console.error('Run `npm run build:tokens` and commit the result.');
  process.exit(1);
}
console.log('token mirrors are in sync with tokens.ts');
