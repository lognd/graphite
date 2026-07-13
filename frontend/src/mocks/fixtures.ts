// Committed fixture data for VITE_USE_MOCKS=1 dev mode and for vitest
// component tests (spec 02.5). Recorded shape mirrors WO-G1's fixture
// project; values are representative, not fabricated live data (charter
// 3.2 -- graphite never invents numbers in the real app, but a mock fixture
// standing in for the server during dev is the sanctioned exception).

import type { FleetHealthSummary, ObligationRow, ProjectSummary } from '../api/api.generated';

export const mockProjects: ProjectSummary[] = [
  {
    id: 'flagship-printer-a',
    name: 'flagship-printer-a',
    designHashShort: 'a3f9c21',
    schemaVersion: 26,
    lastReportAt: '2026-07-12T18:32:00Z',
    verdict: 'discharged',
  },
  {
    id: 'flagship-printer-b',
    name: 'flagship-printer-b',
    designHashShort: '7be0142',
    schemaVersion: 26,
    lastReportAt: '2026-07-12T18:40:00Z',
    verdict: 'deferred',
  },
  {
    id: 'bearing-rig',
    name: 'bearing-rig',
    designHashShort: '0c88ee1',
    schemaVersion: 26,
    lastReportAt: '2026-07-11T09:12:00Z',
    verdict: 'violated',
  },
];

export const mockFleetHealth: FleetHealthSummary = {
  totalProjects: 3,
  byVerdict: {
    discharged: 1,
    violated: 1,
    deferred: 1,
    'accepted-deviation': 0,
    excluded: 0,
  },
  generatedAt: '2026-07-12T18:40:00Z',
};

export const mockObligations: ObligationRow[] = [
  {
    id: 'OB-001',
    family: 'thermal',
    reason: null,
    fNumber: null,
    verdict: 'discharged',
    marginValue: 12.4,
    marginUnit: 'degC',
    marginLimit: 20,
  },
  {
    id: 'OB-002',
    family: 'structural',
    reason: 'load case exceeds rated envelope',
    fNumber: 'F118',
    verdict: 'violated',
    marginValue: -3.2,
    marginUnit: 'mm',
    marginLimit: 0,
  },
  {
    id: 'OB-003',
    family: 'electrical',
    reason: 'awaiting derating study',
    fNumber: 'F121',
    verdict: 'deferred',
    marginValue: null,
    marginUnit: null,
    marginLimit: null,
  },
];
