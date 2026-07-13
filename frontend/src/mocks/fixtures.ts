// Committed fixture data for VITE_USE_MOCKS=1 dev mode and for vitest
// component tests (spec 02.5). RECORDED from the WO-G1 fixture project
// (tests/fixtures/timber_pavilion: its audit_index.json summary and first
// rows) so the mock shapes are the real wire shapes, never invented
// (charter 3.2).

import type { ObligationsResponse, ProjectHealth, ProjectInfo } from '../api/client';

export const mockProjects: ProjectInfo[] = [
  {
    name: 'examples.timber_pavilion',
    version: '0.1.0',
    root: 'tests/fixtures/timber_pavilion',
    manifest_path: 'tests/fixtures/timber_pavilion/magnetite.toml',
    has_build_report: true,
    has_dist: true,
    has_lockfile: true,
  },
];

export const mockProjectHealth: ProjectHealth = {
  release_ok: true,
  obligation_summary: {
    accepted_deviation: 3,
    accepted_rows: 4,
    deferred: 0,
    discharged: 6,
    obligations: 10,
    violated: 0,
  },
};

export const mockObligations: ObligationsResponse = {
  summary: mockProjectHealth.obligation_summary,
  groups: null,
  rows: [
    {
      claim_name: 'bearing',
      content_hash: '2594cf83371265486ae8f40dcab0c1f69667b78ced5035585041ddc5ce3abca4',
      detail:
        'waiver bearing by doc(memos/release-residuals.md) memo=blake3:2f32189789e28f0088479e890998248dff6ad60081d7600de6b47470e0089b22',
      disposition: 'accepted_deviation',
      subject_anchor: 'afc15fc09a7f',
    },
    {
      claim_name: 'construction',
      content_hash: 'b49951b61ab79cf3debb8113884fb5653ce23fb1484e0610aa3ca0c898b51703',
      detail: 'construction::',
      disposition: 'calc_sheet',
      subject_anchor: '',
    },
    {
      claim_name: 'deflect',
      content_hash: 'c02c7276e99447cb34f28bec429399b39fefdbb43b72e8b061f5469fb54b8b2f',
      detail: 'deflect::afc15fc09a7f',
      disposition: 'calc_sheet',
      subject_anchor: 'afc15fc09a7f',
    },
    {
      claim_name: 'import:std.civil',
      content_hash: 'ead667e9a11ae76416bbe22f3d931c6823f050424db2b90539efae28cadc0c35',
      detail:
        'waiver import(std.civil) by doc(memos/release-residuals.md) memo=blake3:2f32189789e28f0088479e890998248dff6ad60081d7600de6b47470e0089b22',
      disposition: 'accepted_deviation',
      subject_anchor: '2f5a6b49526e',
    },
  ],
};
