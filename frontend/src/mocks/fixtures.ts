// Committed fixture data for VITE_USE_MOCKS=1 dev mode and for vitest
// component tests (spec 02.5). RECORDED from the WO-G1 fixture project
// (tests/fixtures/timber_pavilion: its audit_index.json summary and first
// rows) so the mock shapes are the real wire shapes, never invented
// (charter 3.2).

import type {
  ArtifactEntry,
  AuditIndex,
  CalcSheet,
  ManifestSummary,
  ObligationsResponse,
  ProjectHealth,
  ProjectInfo,
  StagedBuildReport,
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

// RECORDED from tests/fixtures/timber_pavilion/dist/calc/audit_index.json --
// same rows as mockObligations (both routes read the same underlying
// calc-book accounting), unfiltered/ungrouped (04.1 "raw" detail view).
export const mockAuditIndex: AuditIndex = {
  project: 'frame.calx',
  rows: mockObligations.rows,
  summary: mockObligations.summary,
};

// RECORDED from tests/fixtures/timber_pavilion/dist/calc/calc_book.json's
// first sheet ("construction") plus one waived-adjacent discharge
// ("deflect") -- enough shape variety (empty vs. non-empty subject_anchor,
// a non-trivial evidence chain) for component tests without inventing a
// value the real book does not carry (charter 3.2).
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
      evidence_hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f9',
      payload_refs: [],
      record_pins: ['afc15fc09a7f96d3aa16c9753118ca3dca1c182433599910ca6bd636eb3afd22'],
      sheet_digest: 'local-blake3:9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c5b4a39281706f5e4d3c2b1a0',
      subject_ref: 'afc15fc09a7f96d3aa16c9753118ca3dca1c182433599910ca6bd636eb3afd22',
    },
    citation: 'IBC 2021 sec. 1604',
    claim_name: 'deflect',
    claim_text: 'frame.deflection(G1) <= span/240',
    inputs: [
      {
        name: 'span',
        pin: 'afc15fc09a7f96d3aa16c9753118ca3dca1c182433599910ca6bd636eb3afd22',
        provenance: 'record_ref',
        source: 'G1.span',
        value: '3.0m',
      },
    ],
    margin: '0.008',
    model_id: 'frame_deflection@1',
    model_version: '1',
    sheet_id: 'deflect::afc15fc09a7f',
    solver: 'frame_deflection',
    subject_anchor: 'afc15fc09a7f',
    subject_ref: 'afc15fc09a7f96d3aa16c9753118ca3dca1c182433599910ca6bd636eb3afd22',
    tier: 'release',
    value: '0.0042',
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

// RECORDED from tests/fixtures/timber_pavilion/dist/manifest.json.
export const mockManifest: ManifestSummary = {
  signed: false,
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
