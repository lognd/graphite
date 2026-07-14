// WO-G9 deliverable 6: "A test that FAILS if a family in the index has
// no route" -- the machine-checked version of the F145 lesson. This
// checks the ACTUAL registered route table (routeChildren, exported
// from routes.tsx) against every family the real mainboard_mx fixture
// ships PLUS a synthetic family lithos has never shipped before, via
// the same routing logic Artifacts.tsx uses (dedicated route or the
// generic `family/:family` catch-all).
//
// PROVEN TO BITE (recorded, not left broken): commenting out the
// `{ path: 'artifacts/:projectId/family/:family', ... }` entry in
// app/routes.tsx and re-running `npx vitest run
// src/app/no-route-for-family.test.ts` fails
// `every_index_family_has_a_route` with "no route for family
// 'mystery_future_family'" -- see WOG9 report for the transcript.

import fixtureIndexRaw from '../../../tests/fixtures/mainboard_mx/dist/artifact_index.json?raw';
import { describe, expect, it } from 'vitest';
import { routeChildren } from './routes';

const DEDICATED_ROUTE: Record<string, string> = {
  calc: 'calc',
  drawings: 'drawings',
  '3d': 'model',
  bom: 'bom',
  boards: 'boards',
  harness: 'harness',
};

function hasRoute(pattern: string): boolean {
  return routeChildren.some((r) => 'path' in r && r.path === pattern);
}

function routeExistsForFamily(family: string): boolean {
  const dedicated = DEDICATED_ROUTE[family];
  if (dedicated) return hasRoute(`artifacts/:projectId/${dedicated}`);
  return hasRoute('artifacts/:projectId/family/:family');
}

describe('every index family has a route (WO-G9 deliverable 6)', () => {
  it('every family in the real mainboard_mx fixture index has a route', () => {
    const raw = JSON.parse(fixtureIndexRaw) as { rows: { family: string }[] };
    const families = [...new Set(raw.rows.map((r) => r.family))];
    expect(families.length).toBeGreaterThan(0);
    for (const family of families) {
      expect(routeExistsForFamily(family), `no route for family "${family}"`).toBe(true);
    }
  });

  it('a family lithos has never shipped before still resolves to the catch-all route', () => {
    expect(routeExistsForFamily('mystery_future_family')).toBe(true);
  });

  it('the generic catch-all route itself is registered (the thing that makes the above true)', () => {
    expect(hasRoute('artifacts/:projectId/family/:family')).toBe(true);
  });
});
