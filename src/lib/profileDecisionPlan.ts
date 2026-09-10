import type { ProfileDiffRow } from './profileDiff';

const STORAGE_KEY = 'printguardian.profileDecisionPlan.v1';
const SCHEMA_VERSION = 1;

export type ProfileDecision = 'project' | 'baseline';

export type SavedProfileDecisionPlan = {
  schemaVersion: 1;
  contextId: string;
  updatedAt: string;
  decisions: Record<string, ProfileDecision>;
};

export type ProfileDecisionReportEntry = {
  key: string;
  label: string;
  impact: ProfileDiffRow['impact'];
  source: ProfileDecision;
  before?: string;
  after?: string;
  changedFromProject: boolean;
  unresolved: boolean;
};

export type ProfileDecisionReport = {
  entries: ProfileDecisionReportEntry[];
  projectCount: number;
  baselineCount: number;
  unresolvedCount: number;
  highImpactBaselineCount: number;
};

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function hash(text: string): string {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0).toString(16).padStart(8, '0');
}

export function decisionPlanContext(rows: ProfileDiffRow[]): string {
  const signature = rows
    .filter((row) => row.status !== 'same')
    .map((row) => [row.key, row.baseValue ?? '', row.compareValue ?? '', row.status].join('\u001f'))
    .join('\u001e');
  return `v1:${hash(signature)}:${rows.filter((row) => row.status !== 'same').length}`;
}

function isDecision(value: unknown): value is ProfileDecision {
  return value === 'project' || value === 'baseline';
}

function isSavedPlan(value: unknown): value is SavedProfileDecisionPlan {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SavedProfileDecisionPlan>;
  if (candidate.schemaVersion !== SCHEMA_VERSION || typeof candidate.contextId !== 'string' || typeof candidate.updatedAt !== 'string') return false;
  if (!candidate.decisions || typeof candidate.decisions !== 'object') return false;
  return Object.values(candidate.decisions).every(isDecision);
}

export function loadProfileDecisionPlan(rows: ProfileDiffRow[]): SavedProfileDecisionPlan | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isSavedPlan(parsed)) {
      store.removeItem(STORAGE_KEY);
      return null;
    }
    if (parsed.contextId !== decisionPlanContext(rows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfileDecisionPlan(rows: ProfileDiffRow[], decisions: Record<string, ProfileDecision>): SavedProfileDecisionPlan | null {
  const store = storage();
  if (!store) return null;
  const plan: SavedProfileDecisionPlan = {
    schemaVersion: SCHEMA_VERSION,
    contextId: decisionPlanContext(rows),
    updatedAt: new Date().toISOString(),
    decisions: { ...decisions },
  };
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(plan));
    return plan;
  } catch {
    return null;
  }
}

export function clearProfileDecisionPlan(): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function createProfileDecisionReport(rows: ProfileDiffRow[], decisions: Record<string, ProfileDecision>): ProfileDecisionReport {
  const actionable = rows.filter((row) => row.status !== 'same');
  const entries = actionable.map<ProfileDecisionReportEntry>((row) => {
    const requested = decisions[row.key] ?? 'project';
    const baselineAvailable = row.compareValue != null && row.compareValue.trim() !== '';
    const source: ProfileDecision = requested === 'baseline' && baselineAvailable ? 'baseline' : 'project';
    const after = source === 'baseline' ? row.compareValue : row.baseValue;
    return {
      key: row.key,
      label: row.label,
      impact: row.impact,
      source,
      before: row.baseValue,
      after,
      changedFromProject: source === 'baseline' && row.baseValue !== row.compareValue,
      unresolved: requested === 'baseline' && !baselineAvailable,
    };
  });

  return {
    entries,
    projectCount: entries.filter((entry) => entry.source === 'project').length,
    baselineCount: entries.filter((entry) => entry.source === 'baseline').length,
    unresolvedCount: entries.filter((entry) => entry.unresolved).length,
    highImpactBaselineCount: entries.filter((entry) => entry.source === 'baseline' && entry.impact === 'high').length,
  };
}
