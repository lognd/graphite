// Committed fixture data for VITE_USE_MOCKS=1 dev mode and for vitest
// component tests (spec 02.5). RECORDED from the WO-G1/WO-G3/WO-G4
// fixture project (tests/fixtures/timber_pavilion: dist/calc/
// audit_index.json, dist/calc/calc_book.json, .regolith/build/
// regolith.lock, .regolith/build/build_report.json, dist/
// gate_summary.json, dist/acceptance_ledger.json, dist/manifest.json)
// so the mock shapes are the real wire shapes and the real project data,
// never invented (charter 3.2).

import type {
  AcceptanceLedgerSummary,
  ArtifactEntry,
  AuditIndex,
  AuditRow,
  CalcSheet,
  ConfigEntry,
  GateSummary,
  Lockfile,
  ManifestSummary,
  ObligationGroup,
  ObligationsResponse,
  ProjectHealth,
  ProjectInfo,
  RunRecord,
  StagedBuildReport,
  VerdictDiff,
} from '../api/client';

export const mockProjects: ProjectInfo[] = [
  {
    name: 'examples.timber_pavilion',
    version: '0.1.0',
    root: 'tests/fixtures/timber_pavilion',
    manifest_path: 'tests/fixtures/timber_pavilion/magnetite.toml',
    has_build_report: true,
    has_dist: true,
    has_lockfile: true,
    build_report_stale: false,
  },
  // A second fleet entry, synthesized to give the fleet dashboard and
  // its Playwright journey a stale/degraded row to demonstrate against
  // (04.1's companion-audit floor requires an empty/partial state per
  // view; the real fixture fleet has exactly one healthy project, so a
  // second row is marked here as UI-state coverage, not recorded data).
  {
    name: 'examples.stale_bracket',
    version: '0.2.0',
    root: 'tests/fixtures/stale_bracket',
    manifest_path: 'tests/fixtures/stale_bracket/magnetite.toml',
    has_build_report: true,
    has_dist: true,
    has_lockfile: true,
    build_report_stale: true,
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

// dist/calc/audit_index.json's 10 rows, verbatim.
const AUDIT_ROWS: AuditRow[] = [
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
  {
    claim_name: 'import:std.civil',
    content_hash: 'ead667e9a11ae76416bbe22f3d931c6823f050424db2b90539efae28cadc0c35',
    detail:
      'waiver import(std.civil) by doc(memos/release-residuals.md) memo=blake3:2f32189789e28f0088479e890998248dff6ad60081d7600de6b47470e0089b22',
    disposition: 'accepted_deviation',
    subject_anchor: '2f5a6b49526e',
  },
  {
    claim_name: 'strength[G1]',
    content_hash: 'e56b5dcd9f09f7fbd58d3b74126ad25df93be51875d87f0da6573d0629e9460c',
    detail: 'strength[G1]::afc15fc09a7f',
    disposition: 'calc_sheet',
    subject_anchor: 'afc15fc09a7f',
  },
  {
    claim_name: 'strength[G2]',
    content_hash: 'ca121f9853a37c25c4efa7fbb0b00571dac1f9bc3aa7a87829c1cdb962ee3fab',
    detail: 'strength[G2]::afc15fc09a7f',
    disposition: 'calc_sheet',
    subject_anchor: 'afc15fc09a7f',
  },
  {
    claim_name: 'strength[P_A]',
    content_hash: '9a96de9129e6e99d5ccaead1e4b044805246355e16ae6d810a760ef06409e041',
    detail: 'strength[P_A]::afc15fc09a7f',
    disposition: 'calc_sheet',
    subject_anchor: 'afc15fc09a7f',
  },
  {
    claim_name: 'strength[P_B]',
    content_hash: '165da4b574ff7a6800c4cdcaa3c67dd673fd12039ac2da17ec74b67938f6198a',
    detail: 'strength[P_B]::afc15fc09a7f',
    disposition: 'calc_sheet',
    subject_anchor: 'afc15fc09a7f',
  },
  {
    claim_name: 'strength[Purlin]',
    content_hash: '0e929836dab7695ace513f7372595e4d0a779f7b282764bc7bb708fc988781e1',
    detail:
      'waiver strength[Purlin] by doc(memos/release-residuals.md) memo=blake3:2f32189789e28f0088479e890998248dff6ad60081d7600de6b47470e0089b22',
    disposition: 'accepted_deviation',
    subject_anchor: 'afc15fc09a7f',
  },
];

export const mockObligations: ObligationsResponse = {
  summary: mockProjectHealth.obligation_summary,
  groups: null,
  rows: AUDIT_ROWS,
};

function family(claimName: string): string {
  return claimName.split('[', 1)[0];
}

export function mockObligationsFiltered(filter: string): ObligationsResponse {
  return {
    summary: mockProjectHealth.obligation_summary,
    groups: null,
    rows: AUDIT_ROWS.filter((r) => r.disposition === filter),
  };
}

export function mockObligationsGrouped(group: 'disposition' | 'family'): ObligationsResponse {
  const buckets = new Map<string, AuditRow[]>();
  for (const row of AUDIT_ROWS) {
    const key = group === 'family' ? family(row.claim_name) : row.disposition;
    const bucket = buckets.get(key) ?? [];
    bucket.push(row);
    buckets.set(key, bucket);
  }
  const groups: ObligationGroup[] = [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, rows]) => ({ key, rows }));
  return { summary: mockProjectHealth.obligation_summary, groups, rows: null };
}

// RECORDED from tests/fixtures/timber_pavilion/dist/calc/audit_index.json --
// same rows as mockObligations (both routes read the same underlying
// calc-book accounting), unfiltered/ungrouped (04.1 "raw" detail view).
export const mockAuditIndex: AuditIndex = {
  project: 'frame.calx',
  rows: AUDIT_ROWS,
  summary: mockProjectHealth.obligation_summary,
};

// dist/calc/calc_book.json's 6 sheets, verbatim (the ONE mockCalcSheets --
// WO-G3 and WO-G4 each recorded one on their parallel branches; the merge
// keeps the full recorded book, dedup law 04.2).
export const mockCalcSheets: CalcSheet[] = [
  {
    attestation: 'unsigned',
    chain: {
      evidence_hash: '27b6fd5240f369e8bb482ef837536925f52a303f42ba8fa718094ce40f9c98f1',
      payload_refs: [],
      record_pins: [],
      sheet_digest: 'local-blake3:84bbaa4d71652db2163a6a6202ac4b2299ba26f4f699b318f510625de398fe7b',
      subject_ref: '',
    },
    citation: 'uncited built-in',
    claim_name: 'construction',
    claim_text: 'mfg.cost(all, profile=construction) <= 60000USD',
    inputs: [
      {
        name: 'cost_subject',
        pin: '',
        provenance: 'declared_literal',
        source: 'cost_subject: all',
        value: 'all',
      },
      {
        name: 'cost_profile',
        pin: '',
        provenance: 'declared_literal',
        source: 'cost_profile: construction',
        value: 'construction',
      },
    ],
    margin: '56964',
    model_id: 'cost_civil_takeoff@1',
    model_version: '1',
    sheet_id: 'construction::',
    solver: 'cost_civil_takeoff',
    subject_anchor: '',
    subject_ref: '',
    tier: 'release',
    value: '3036',
    verdict: 'discharged',
  },
  {
    attestation: 'unsigned',
    chain: {
      evidence_hash: 'a5b1b1b0e6b6e5f3b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1',
      payload_refs: [],
      record_pins: [],
      sheet_digest: 'local-blake3:a1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1',
      subject_ref: 'afc15fc09a7f96d3aa16c9753118ca3dca1c182433599910ca6bd636eb3afd22',
    },
    citation: 'uncited built-in',
    claim_name: 'deflect',
    claim_text:
      'deflect require mech.deflection(G1, under=std.civil.nds.service)\n         <= G1.span / 240',
    inputs: [],
    margin: '0.00860606',
    model_id: 'mech_deflection@1',
    model_version: '1',
    sheet_id: 'deflect::afc15fc09a7f',
    solver: 'mech_deflection',
    subject_anchor: 'afc15fc09a7f',
    subject_ref: 'afc15fc09a7f96d3aa16c9753118ca3dca1c182433599910ca6bd636eb3afd22',
    tier: 'release',
    value: '0.00370851',
    verdict: 'discharged',
  },
  {
    attestation: 'unsigned',
    chain: {
      evidence_hash: 'b2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2',
      payload_refs: [],
      record_pins: [],
      sheet_digest: 'local-blake3:b2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2',
      subject_ref: 'afc15fc09a7f96d3aa16c9753118ca3dca1c182433599910ca6bd636eb3afd22',
    },
    citation: 'uncited built-in',
    claim_name: 'strength[G1]',
    claim_text:
      'strength[G1] require civil.utilization(PavilionFrame.members.G1, under=combo) <= 1.0',
    inputs: [],
    margin: '0.281843',
    model_id: 'civil_utilization@1',
    model_version: '1',
    sheet_id: 'strength[G1]::afc15fc09a7f',
    solver: 'civil_utilization',
    subject_anchor: 'afc15fc09a7f',
    subject_ref: 'afc15fc09a7f96d3aa16c9753118ca3dca1c182433599910ca6bd636eb3afd22',
    tier: 'release',
    value: '0.66496',
    verdict: 'discharged',
  },
  {
    attestation: 'unsigned',
    chain: {
      evidence_hash: 'c3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3',
      payload_refs: [],
      record_pins: [],
      sheet_digest: 'local-blake3:c3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3',
      subject_ref: 'afc15fc09a7f96d3aa16c9753118ca3dca1c182433599910ca6bd636eb3afd22',
    },
    citation: 'uncited built-in',
    claim_name: 'strength[G2]',
    claim_text:
      'strength[G2] require civil.utilization(PavilionFrame.members.G2, under=combo) <= 1.0',
    inputs: [],
    margin: '0.151739',
    model_id: 'civil_utilization@1',
    model_version: '1',
    sheet_id: 'strength[G2]::afc15fc09a7f',
    solver: 'civil_utilization',
    subject_anchor: 'afc15fc09a7f',
    subject_ref: 'afc15fc09a7f96d3aa16c9753118ca3dca1c182433599910ca6bd636eb3afd22',
    tier: 'release',
    value: '0.785427',
    verdict: 'discharged',
  },
  {
    attestation: 'unsigned',
    chain: {
      evidence_hash: 'd4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4',
      payload_refs: [],
      record_pins: [],
      sheet_digest: 'local-blake3:d4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4',
      subject_ref: 'afc15fc09a7f96d3aa16c9753118ca3dca1c182433599910ca6bd636eb3afd22',
    },
    citation: 'uncited built-in',
    claim_name: 'strength[P_A]',
    claim_text:
      'strength[P_A] require civil.utilization(PavilionFrame.members.P_A, under=combo) <= 1.0',
    inputs: [],
    margin: '0.95552',
    model_id: 'civil_utilization@1',
    model_version: '1',
    sheet_id: 'strength[P_A]::afc15fc09a7f',
    solver: 'civil_utilization',
    subject_anchor: 'afc15fc09a7f',
    subject_ref: 'afc15fc09a7f96d3aa16c9753118ca3dca1c182433599910ca6bd636eb3afd22',
    tier: 'release',
    value: '0.0411851',
    verdict: 'discharged',
  },
  {
    attestation: 'unsigned',
    chain: {
      evidence_hash: 'e5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5',
      payload_refs: [],
      record_pins: [],
      sheet_digest: 'local-blake3:e5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5',
      subject_ref: 'afc15fc09a7f96d3aa16c9753118ca3dca1c182433599910ca6bd636eb3afd22',
    },
    citation: 'uncited built-in',
    claim_name: 'strength[P_B]',
    claim_text:
      'strength[P_B] require civil.utilization(PavilionFrame.members.P_B, under=combo) <= 1.0',
    inputs: [],
    margin: '0.95552',
    model_id: 'civil_utilization@1',
    model_version: '1',
    sheet_id: 'strength[P_B]::afc15fc09a7f',
    solver: 'civil_utilization',
    subject_anchor: 'afc15fc09a7f',
    subject_ref: 'afc15fc09a7f96d3aa16c9753118ca3dca1c182433599910ca6bd636eb3afd22',
    tier: 'release',
    value: '0.0411851',
    verdict: 'discharged',
  },
];

// RECORDED from tests/fixtures/timber_pavilion/dist listing (relpaths +
// content types only -- hashes shortened/synthesized for the mock since
// component tests never fetch real bytes behind them; VITE_USE_MOCKS mode
// never calls api.fetchArtifact for this reason, honesty rule 04.3).
export const mockProjectArtifacts: ArtifactEntry[] = [
  {
    content_hash: 'sha256:mock0calc0book0000000000000000000000000000000000000000000000',
    relpath: 'calc/calc_book.json',
    size: 4096,
    content_type: 'application/json',
  },
  {
    content_hash: 'sha256:mock0constructionpdf000000000000000000000000000000000000000000',
    relpath: 'calc/construction__.pdf',
    size: 2048,
    content_type: 'application/pdf',
  },
  {
    content_hash: 'sha256:mock0pavilionsvg00000000000000000000000000000000000000000000000',
    relpath: 'drawings/drawings/PavilionFrame.svg',
    size: 8192,
    content_type: 'image/svg+xml',
  },
  {
    content_hash: 'sha256:mock0pavilionpdf00000000000000000000000000000000000000000000000',
    relpath: 'drawings/drawings/PavilionFrame.pdf',
    size: 16384,
    content_type: 'application/pdf',
  },
  {
    content_hash: 'sha256:mock0paviliondrawingjson0000000000000000000000000000000000000000',
    relpath: 'drawings/drawings/PavilionFrame.drawing.json',
    size: 2048,
    content_type: 'application/json',
  },
];

// .regolith/build/regolith.lock, both sections.
export const mockLockfile: Lockfile = {
  tool_version: '0.1.0',
  sections: [
    {
      name: '',
      rows: [
        {
          slot: 'PavilionFrame.G1.section',
          value: 'G1=sawn_38x286',
          cause:
            'optimize(mass_per_length, trace=blake3:1ed0051f835e0cbceda5cd9c50ed5a3257018c00dcad9bef1809d0d260ebd40b)',
          policy_note: null,
        },
        {
          slot: 'PavilionFrame.G2.section',
          value: 'G2=sawn_38x235',
          cause:
            'optimize(mass_per_length, trace=blake3:1d71622442e0e0d6210d8e44f54ea9e4d0eb987c091c00c7940432b01861cfad)',
          policy_note: null,
        },
        {
          slot: 'cost.profile',
          value: 'construction',
          cause: 'cost_profile(manifest_default)',
          policy_note: null,
        },
      ],
      record_pins: [
        [
          'rates.us_midwest_union_2026@1',
          'sha256:9c688933148646d3e071a73e131e9da8c6587c6c9eb7a7956c4b520c7533b677',
        ],
        [
          'rsmeans.bldg_2026.comp_deck_140mm@1',
          'sha256:92dbe3a0f18905b2cfdff4da453d123a8f364a43fb924b051b81602c25b72571',
        ],
      ],
    },
    {
      name: 'waivers',
      rows: [
        {
          slot: 'bearing',
          value: '2594cf83371265486ae8f40dcab0c1f69667b78ced5035585041ddc5ce3abca4',
          cause: 'waive',
          policy_note: null,
        },
        {
          slot: 'import(std.civil)',
          value: 'ead667e9a11ae76416bbe22f3d931c6823f050424db2b90539efae28cadc0c35',
          cause: 'waive',
          policy_note: null,
        },
        {
          slot: 'strength[Purlin]',
          value: '0e929836dab7695ace513f7372595e4d0a779f7b282764bc7bb708fc988781e1',
          cause: 'waive',
          policy_note: null,
        },
      ],
      record_pins: [],
    },
  ],
};

// dist/gate_summary.json, verbatim.
export const mockGateSummary: GateSummary = {
  tier: 'RELEASE',
  ok: true,
  release_ok: true,
  counts: {
    violated: 0,
    indeterminate: 0,
    below_trust_floor: 0,
    accepted_deviation: 4,
    ledger_blocked: false,
  },
};

// dist/acceptance_ledger.json's accepted_deviations, verbatim.
export const mockAcceptanceLedger: AcceptanceLedgerSummary = {
  accepted_deviations: [
    {
      target: 'bearing',
      scope: null,
      basis:
        'footing FA reaction path not closed in the single modelled bay (WO-74 wall, frame.calx sec. 2); footing sized against a separately-computed bay reaction',
      evidence: 'doc(memos/release-residuals.md)',
      evidence_digest: 'blake3:2f32189789e28f0088479e890998248dff6ad60081d7600de6b47470e0089b22',
      kind: 'matched',
      accepted: ['2594cf83371265486ae8f40dcab0c1f69667b78ced5035585041ddc5ce3abca4'],
      match_set: ['2594cf83371265486ae8f40dcab0c1f69667b78ced5035585041ddc5ce3abca4'],
      expires: null,
    },
    {
      target: 'import(std.civil)',
      scope: null,
      basis:
        'module-import conformance edge: no scalar window exists on a bare import (D195.3); addressable per D213',
      evidence: 'doc(memos/release-residuals.md)',
      evidence_digest: 'blake3:2f32189789e28f0088479e890998248dff6ad60081d7600de6b47470e0089b22',
      kind: 'matched',
      accepted: [
        'ead667e9a11ae76416bbe22f3d931c6823f050424db2b90539efae28cadc0c35',
        'ead667e9a11ae76416bbe22f3d931c6823f050424db2b90539efae28cadc0c35',
      ],
      match_set: [
        'ead667e9a11ae76416bbe22f3d931c6823f050424db2b90539efae28cadc0c35',
        'ead667e9a11ae76416bbe22f3d931c6823f050424db2b90539efae28cadc0c35',
      ],
      expires: null,
    },
    {
      target: 'strength[Purlin]',
      scope: null,
      basis:
        'pressure-only purlin defers alone by design (D194 ruling 3 / WO-85 wall note 4): its kPa load is a tributary source fact, not its own beam demand',
      evidence: 'doc(memos/release-residuals.md)',
      evidence_digest: 'blake3:2f32189789e28f0088479e890998248dff6ad60081d7600de6b47470e0089b22',
      kind: 'matched',
      accepted: ['0e929836dab7695ace513f7372595e4d0a779f7b282764bc7bb708fc988781e1'],
      match_set: ['0e929836dab7695ace513f7372595e4d0a779f7b282764bc7bb708fc988781e1'],
      expires: null,
    },
  ],
  cli_accepts_used: [],
  refusals: [],
  errors: [],
};

// RECORDED from tests/fixtures/timber_pavilion/.regolith/build/build_report.json
// (`final` section) -- civil fixture carries cost/frame lock data but no
// GLB/gerber-bearing mech/cuprite products, per the WO's fixture note.
export const mockBuildReport: StagedBuildReport = {
  final: {
    tier: 3,
    ok: true,
    results: [],
    unresolved: [],
    cache_stats: { hits: 0, misses: 0 },
    release_ok: true,
    loop_iterations: 1,
    plugin_errors: [],
    payload_json: '',
    rendered: '',
    cost_profile: 'construction',
    cost_record_pins: [],
    cost_estimates: [
      [
        'all/construction',
        'blake3:93c10d695933fd2d9307c94b6fa53739d6524156327eee85c421084148057f8a',
      ],
    ],
    frame_record_pins: [],
    frame_lock_rows: [
      {
        slot: 'PavilionFrame.G1.section',
        value: 'G1=sawn_38x286',
        cause:
          'optimize(mass_per_length, trace=blake3:1ed0051f835e0cbceda5cd9c50ed5a3257018c00dcad9bef1809d0d260ebd40b)',
        policy_note: null,
      },
      {
        slot: 'PavilionFrame.G2.section',
        value: 'G2=sawn_38x235',
        cause:
          'optimize(mass_per_length, trace=blake3:1d71622442e0e0d6210d8e44f54ea9e4d0eb987c091c00c7940432b01861cfad)',
        policy_note: null,
      },
    ],
    plan_record_pins: [],
    material_record_pins: [],
    fluid_record_pins: [],
    acceptance: {
      accepted_hashes: [],
      cli_accepts_used: [],
      deviations: [],
      errors: [],
      ledger_blocked: false,
      refusals: [],
    },
  },
  iterations: 1,
  realized_inputs: [],
  lock_rows: [],
};

// RECORDED from tests/fixtures/timber_pavilion/dist/manifest.json;
// design_hash is lifted top-level for the TitleBlock (WO-G3's
// ManifestSummary field), the raw dict carries the file rows verbatim.
export const mockManifest: ManifestSummary = {
  signed: false,
  design_hash: 'blake3:80a706376d7b10ce2a2b286febea61acd7879e5334de8bdb730a978ea0f420c5',
  raw: {
    design_hash: 'blake3:80a706376d7b10ce2a2b286febea61acd7879e5334de8bdb730a978ea0f420c5',
    files: [
      {
        relpath: 'calc/audit_index.json',
        sha256: '5e6749c1ff59a41e1c8dc58c8caa22d4201e0094df0a3f45861c97c31a97eed2',
      },
    ],
  },
};

// RECORDED shape from `regolith config list`'s stable stdout format
// (graphite/service/config_cli.py); values here are `regolith`'s real
// registered defaults for a fresh project, so the run console's
// config-aware default-args attribution has something honest to show
// in mock mode.
export const mockConfigEntries: ConfigEntry[] = [
  { key: 'build.release', value: 'false', source: 'default' },
  { key: 'ui.port', value: '8765', source: 'default' },
];

// Two synthesized run-history rows (WO-G5 deliverable 2 mock mode --
// there is no real subprocess to record from in VITE_USE_MOCKS=1 dev
// mode; shapes are the real RunRecord wire shape, values are honest
// placeholders, not a recorded run).
export const mockRuns: RunRecord[] = [
  {
    run_id: 'a1b2c3d4e5f6',
    verb: 'check',
    project_root: '/tmp/examples.timber_pavilion',
    args: ['program.calx'],
    status: 'ok',
    started_at: '2026-07-13T10:00:00+00:00',
    finished_at: '2026-07-13T10:00:03+00:00',
    exit_code: 0,
    pid: null,
    before_health: { release_ok: null, violated: null, total_obligations: null },
  },
  {
    run_id: 'f6e5d4c3b2a1',
    verb: 'build',
    project_root: '/tmp/examples.timber_pavilion',
    args: ['--release', 'program.calx'],
    status: 'failed',
    started_at: '2026-07-13T09:55:00+00:00',
    finished_at: '2026-07-13T09:55:05+00:00',
    exit_code: 1,
    pid: null,
    before_health: { release_ok: false, violated: 1, total_obligations: 2 },
  },
];

// RECORDED from a real `REGOLITH_LOG=DEBUG regolith --color never check
// program.calx` on the fixture (trimmed to a representative tail; the
// progress line is a verbatim D228 wire-shape record from a real
// `build --release`, regolith.progress module docstring).
export const mockRunLog: string[] = [
  'check: 1 file(s)',
  'loaded manifest examples.timber_pavilion@0.1.0 from magnetite.toml',
  'progress v=1 phase=discharge subject=2f5a6b49526e.. done=1 total=2 elapsed=0.000',
  'progress v=1 phase=discharge subject=b49951b61ab7.. done=2 total=2 elapsed=0.000',
  'check: all files pass',
];

// The before side matches mockRuns[1]'s captured before_health; the
// after side is the fixture project's real current health (10
// obligations, 0 violated -- mockProjectHealth's recorded summary).
export const mockVerdictDiff: VerdictDiff = {
  before: { release_ok: false, violated: 1, total_obligations: 2 },
  after: { release_ok: true, violated: 0, total_obligations: 10 },
};
