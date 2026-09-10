import type { SavedProfileBaseline } from './baselineProfile';
import type { ThreeMfInspection } from './threeMfInspector';

const STORAGE_KEY = 'printguardian.projectWorkspacePlan.v1';
const SCHEMA_VERSION = 1;

export type WorkspaceChoice = 'project' | 'profile' | 'manual';

export type WorkspacePlan = {
  schemaVersion: 1;
  contextId: string;
  updatedAt: string;
  choices: Record<string, WorkspaceChoice>;
  manualValues: Record<string, unknown>;
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

export function workspacePlanContext(inspection: ThreeMfInspection, profile: SavedProfileBaseline | null): string {
  const signature = JSON.stringify({
    fileName: inspection.fileName,
    fileSize: inspection.fileSize,
    builderValues: inspection.builderValues ?? {},
    objectCount: inspection.objectCount,
    profileSavedAt: profile?.savedAt ?? null,
    profileValues: profile?.profile.builderValues ?? {},
  });
  return `v1:${hash(signature)}`;
}

function isChoice(value: unknown): value is WorkspaceChoice {
  return value === 'project' || value === 'profile' || value === 'manual';
}

function isPlan(value: unknown): value is WorkspacePlan {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<WorkspacePlan>;
  if (candidate.schemaVersion !== SCHEMA_VERSION || typeof candidate.contextId !== 'string' || typeof candidate.updatedAt !== 'string') return false;
  if (!candidate.choices || typeof candidate.choices !== 'object' || !candidate.manualValues || typeof candidate.manualValues !== 'object') return false;
  return Object.values(candidate.choices).every(isChoice);
}

export function loadWorkspacePlan(inspection: ThreeMfInspection, profile: SavedProfileBaseline | null): WorkspacePlan | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isPlan(parsed)) {
      store.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.contextId === workspacePlanContext(inspection, profile) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveWorkspacePlan(
  inspection: ThreeMfInspection,
  profile: SavedProfileBaseline | null,
  choices: Record<string, WorkspaceChoice>,
  manualValues: Record<string, unknown>,
): WorkspacePlan | null {
  const store = storage();
  if (!store) return null;
  const plan: WorkspacePlan = {
    schemaVersion: SCHEMA_VERSION,
    contextId: workspacePlanContext(inspection, profile),
    updatedAt: new Date().toISOString(),
    choices: { ...choices },
    manualValues: JSON.parse(JSON.stringify(manualValues)) as Record<string, unknown>,
  };
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(plan));
    return plan;
  } catch {
    return null;
  }
}

export function clearWorkspacePlan(): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
