export const levels = [
  'Explain simply',
  'Beginner developer',
  'Experienced developer',
  'Expert in this stack',
] as const;
export type Level = (typeof levels)[number];
export type Fact = 'fact' | 'inference' | 'unknown';
export interface Evidence {
  id: string;
  file: string;
  hash: string;
  revision: string;
  start: number;
  end: number;
  excerpt: string;
  method: 'typescript-ast';
}
export interface SymbolFact {
  id: string;
  name: string;
  file: string;
  kind: string;
  evidenceId: string;
  component: boolean;
}
export interface Relationship {
  id: string;
  from: string;
  to: string;
  label: string;
  status: Fact;
  evidenceIds: string[];
}
export interface Analysis {
  id: string;
  name: string;
  root: string;
  sample: boolean;
  exclusions: string[];
  revision: string;
  createdAt: string;
  files: { path: string; hash: string }[];
  symbols: SymbolFact[];
  edges: Relationship[];
  evidence: Evidence[];
  warnings: string[];
}
export interface Step {
  id: string;
  nodeId: string;
  title: string;
  evidenceIds: string[];
  status: Fact;
  explanations: Record<Level, string>;
}
export interface Tour {
  id: string;
  analysisId: string;
  title: string;
  entryId: string;
  steps: Step[];
  position: number;
  level: Level;
  createdAt: string;
  origin: 'deterministic' | 'openai' | 'ollama';
}
export interface Freshness {
  stale: boolean;
  changed: string[];
  checkedAt: string;
}
export interface Workspace {
  analysis: Analysis;
  tour: Tour | null;
  freshness: Freshness;
  tours: { id: string; title: string }[];
}

export interface ReviewFinding {
  id: string;
  category: 'security' | 'quality' | 'maintainability';
  title: string;
  observation: string;
  recommendation: string;
  evidenceId: string;
  file: string;
  start: number;
  status: 'needs review';
}
export interface ProjectReview {
  analysisId: string;
  createdAt: string;
  reviewedDeclarations: number;
  findings: ReviewFinding[];
  additionalFindings: number;
  limitations: string[];
}

export interface PreviewTarget {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface PreviewCapture {
  url: string;
  image: string;
  capturedAt: string;
  width: number;
  height: number;
  targets: PreviewTarget[];
  suggestedId: string | null;
  blockedRequests: number;
}
