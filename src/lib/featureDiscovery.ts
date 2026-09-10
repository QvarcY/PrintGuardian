import { compareVersions } from './updateCenter.ts';

export type FeatureId = 'history';

type FeatureDefinition = {
  id: FeatureId;
  introducedIn: string;
};

type StoredFeatureDiscovery = {
  schemaVersion: 1;
  lastVersion: string | null;
  seen: FeatureId[];
  pending: FeatureId[];
};

export type FeatureDiscovery = {
  previousVersion: string | null;
  currentVersion: string;
  newFeatures: FeatureId[];
};

const STORAGE_KEY = 'printguardian.featureDiscovery.v1';
const LEGACY_BASELINE_VERSION = '0.3.0-dev.14';
const FEATURES: FeatureDefinition[] = [
  { id: 'history', introducedIn: '0.3.0-dev.15' },
];

const RETURNING_USER_SIGNALS = [
  'printguardian-language',
  'printguardian.printProfiles.v1',
  'printguardian.profileBaseline.v1',
];

function isFeatureId(value: unknown): value is FeatureId {
  return value === 'history';
}

function defaults(): StoredFeatureDiscovery {
  return { schemaVersion: 1, lastVersion: null, seen: [], pending: [] };
}

function loadStored(): StoredFeatureDiscovery {
  if (typeof window === 'undefined') return defaults();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<StoredFeatureDiscovery>;
    return {
      schemaVersion: 1,
      lastVersion: typeof parsed.lastVersion === 'string' ? parsed.lastVersion : null,
      seen: Array.isArray(parsed.seen) ? parsed.seen.filter(isFeatureId) : [],
      pending: Array.isArray(parsed.pending) ? parsed.pending.filter(isFeatureId) : [],
    };
  } catch {
    return defaults();
  }
}

function isReturningUser(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return RETURNING_USER_SIGNALS.some((key) => window.localStorage.getItem(key) !== null);
  } catch {
    return false;
  }
}

function saveStored(value: StoredFeatureDiscovery): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); }
  catch (error) { console.warn('PrintGuardian could not persist feature discovery state.', error); }
}

export function initializeFeatureDiscovery(currentVersion: string, returningHint = false): FeatureDiscovery {
  const stored = loadStored();
  const previousVersion = stored.lastVersion ?? ((returningHint || isReturningUser()) ? LEGACY_BASELINE_VERSION : currentVersion);
  const newlyIntroduced = FEATURES
    .filter((feature) => !stored.seen.includes(feature.id))
    .filter((feature) => compareVersions(currentVersion, feature.introducedIn) >= 0)
    .filter((feature) => compareVersions(previousVersion, feature.introducedIn) < 0)
    .map((feature) => feature.id);
  const pending = [...new Set([...stored.pending, ...newlyIntroduced])]
    .filter((id) => !stored.seen.includes(id));

  saveStored({ ...stored, lastVersion: currentVersion, pending });
  return { previousVersion, currentVersion, newFeatures: pending };
}

export function markFeatureSeen(featureId: FeatureId, currentVersion: string): void {
  const stored = loadStored();
  const seen = stored.seen.includes(featureId) ? stored.seen : [...stored.seen, featureId];
  saveStored({
    schemaVersion: 1,
    lastVersion: currentVersion,
    seen,
    pending: stored.pending.filter((id) => id !== featureId),
  });
}

export function featureIntroducedIn(featureId: FeatureId): string {
  return FEATURES.find((feature) => feature.id === featureId)?.introducedIn ?? '';
}
