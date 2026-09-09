import type { ThreeMfInspection } from './threeMfInspector';
import type { ComparableInspection } from './profileDiff';

const STORAGE_KEY = 'printguardian.profileBaseline.v1';
const SCHEMA_VERSION = 1;

export type SavedProfileBaseline = {
  schemaVersion: 1;
  savedAt: string;
  sourceFileName: string;
  profile: ComparableInspection;
};

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function isComparableProfile(value: unknown): value is ComparableInspection {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ComparableInspection>;
  return typeof candidate.fileName === 'string'
    && Array.isArray(candidate.settings)
    && !!candidate.dna
    && typeof candidate.dna === 'object';
}

function isSavedProfileBaseline(value: unknown): value is SavedProfileBaseline {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SavedProfileBaseline>;
  return candidate.schemaVersion === SCHEMA_VERSION
    && typeof candidate.savedAt === 'string'
    && typeof candidate.sourceFileName === 'string'
    && isComparableProfile(candidate.profile);
}

export function createProfileBaseline(inspection: ThreeMfInspection): SavedProfileBaseline {
  return {
    schemaVersion: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    sourceFileName: inspection.fileName,
    profile: {
      fileName: inspection.fileName,
      printerProfile: inspection.printerProfile,
      printerModel: inspection.printerModel,
      nozzleDiameter: inspection.nozzleDiameter,
      buildPlate: inspection.buildPlate,
      processProfile: inspection.processProfile,
      settings: inspection.settings.map((setting) => ({ ...setting })),
      dna: { ...inspection.dna },
      builderValues: inspection.builderValues ? JSON.parse(JSON.stringify(inspection.builderValues)) : undefined,
    },
  };
}

export function loadProfileBaseline(): SavedProfileBaseline | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isSavedProfileBaseline(parsed)) {
      store.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfileBaseline(inspection: ThreeMfInspection): SavedProfileBaseline | null {
  const store = storage();
  if (!store) return null;
  const baseline = createProfileBaseline(inspection);
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(baseline));
    return baseline;
  } catch {
    return null;
  }
}

export function removeProfileBaseline(): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
