// PROVISIONAL -- hand-written placeholder, NOT the real generated file.
//
// The real chain (spec 02.2) is: regolith pydantic models -> FastAPI
// response models -> committed openapi.json -> `openapi-typescript` ->
// this file, generated and drift-checked. WO-G1 (backend API + schema
// chain) produces that pipeline in parallel with this WO.
//
// This is a MINIMAL, clearly-marked-provisional stand-in covering only the
// two shapes the app shell needs (project list for the nav, a fleet health
// summary for the dashboard/status line) so WO-G2 is not blocked on WO-G1
// landing first. Escalation: WOG2-F1 -- replace this file wholesale with
// the openapi-typescript output at integration; delete this file, do not
// merge its types into hand-written code.
//
// NO OTHER hand-written wire shape is permitted anywhere else in the
// frontend (dedup law 04.2) -- every server shape funnels through here
// until the real generator lands.

export type Verdict = 'discharged' | 'violated' | 'deferred' | 'accepted-deviation' | 'excluded';

export interface ProjectSummary {
  id: string;
  name: string;
  designHashShort: string;
  schemaVersion: number;
  lastReportAt: string; // ISO 8601
  verdict: Verdict;
}

export interface FleetHealthSummary {
  totalProjects: number;
  byVerdict: Record<Verdict, number>;
  generatedAt: string; // ISO 8601
}

export interface ObligationRow {
  id: string;
  family: string;
  reason: string | null;
  fNumber: string | null;
  verdict: Verdict;
  marginValue: number | null;
  marginUnit: string | null;
  marginLimit: number | null;
}
