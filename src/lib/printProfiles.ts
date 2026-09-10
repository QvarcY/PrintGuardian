import type { SavedProfileBaseline } from './baselineProfile';
import { loadProfileBaseline, removeProfileBaseline, storeProfileBaseline } from './baselineProfile';

const STORAGE_KEY = 'printguardian.printProfiles.v1';
const ACTIVE_KEY = 'printguardian.printProfiles.active.v1';
const SCHEMA_VERSION = 1;

export type NamedPrintProfile = {
  schemaVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  snapshot: SavedProfileBaseline;
};

export type PrintProfileLibrary = {
  profiles: NamedPrintProfile[];
  activeId: string | null;
};

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch { /* fall through */ }
  return `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isNamedProfile(value: unknown): value is NamedPrintProfile {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<NamedPrintProfile>;
  return candidate.schemaVersion === SCHEMA_VERSION
    && typeof candidate.id === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.createdAt === 'string'
    && typeof candidate.updatedAt === 'string'
    && !!candidate.snapshot
    && typeof candidate.snapshot === 'object';
}

function suggestedName(snapshot: SavedProfileBaseline): string {
  const printer = snapshot.profile.printerModel || snapshot.profile.printerProfile || '3D printer';
  const nozzle = snapshot.profile.nozzleDiameter ? `${snapshot.profile.nozzleDiameter} mm` : '';
  const filament = snapshot.profile.settings.find((item) => item.key === 'filament_type')?.value || '';
  return [printer, nozzle, filament].filter(Boolean).join(' · ') || snapshot.sourceFileName.replace(/\.3mf$/i, '') || 'My print profile';
}

function readProfiles(store: Storage): NamedPrintProfile[] {
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isNamedProfile) : [];
  } catch {
    return [];
  }
}

function writeProfiles(store: Storage, profiles: NamedPrintProfile[]): boolean {
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(profiles));
    return true;
  } catch {
    return false;
  }
}

function syncActive(store: Storage, profiles: NamedPrintProfile[], activeId: string | null): string | null {
  const active = profiles.find((profile) => profile.id === activeId) ?? profiles[0] ?? null;
  const nextId = active?.id ?? null;
  try {
    if (nextId) store.setItem(ACTIVE_KEY, nextId);
    else store.removeItem(ACTIVE_KEY);
  } catch { /* ignore */ }
  if (active) storeProfileBaseline(active.snapshot);
  else removeProfileBaseline();
  return nextId;
}

function migrateLegacy(store: Storage, profiles: NamedPrintProfile[]): NamedPrintProfile[] {
  if (profiles.length) return profiles;
  const legacy = loadProfileBaseline();
  if (!legacy) return profiles;
  const now = legacy.savedAt || new Date().toISOString();
  const migrated: NamedPrintProfile = {
    schemaVersion: SCHEMA_VERSION,
    id: makeId(),
    name: suggestedName(legacy),
    createdAt: now,
    updatedAt: now,
    snapshot: legacy,
  };
  writeProfiles(store, [migrated]);
  return [migrated];
}

export function loadPrintProfileLibrary(): PrintProfileLibrary {
  const store = storage();
  if (!store) return { profiles: [], activeId: null };
  const profiles = migrateLegacy(store, readProfiles(store));
  let requested: string | null = null;
  try { requested = store.getItem(ACTIVE_KEY); } catch { requested = null; }
  const activeId = syncActive(store, profiles, requested);
  return { profiles, activeId };
}

export function addPrintProfile(snapshot: SavedProfileBaseline, name?: string): PrintProfileLibrary {
  const store = storage();
  if (!store) return { profiles: [], activeId: null };
  const state = loadPrintProfileLibrary();
  const now = new Date().toISOString();
  const profile: NamedPrintProfile = {
    schemaVersion: SCHEMA_VERSION,
    id: makeId(),
    name: name?.trim() || suggestedName(snapshot),
    createdAt: now,
    updatedAt: now,
    snapshot,
  };
  const profiles = [...state.profiles, profile];
  writeProfiles(store, profiles);
  const activeId = syncActive(store, profiles, profile.id);
  return { profiles, activeId };
}

export function replacePrintProfile(id: string, snapshot: SavedProfileBaseline): PrintProfileLibrary {
  const store = storage();
  if (!store) return { profiles: [], activeId: null };
  const state = loadPrintProfileLibrary();
  const profiles = state.profiles.map((profile) => profile.id === id ? {
    ...profile,
    updatedAt: new Date().toISOString(),
    snapshot,
  } : profile);
  writeProfiles(store, profiles);
  const activeId = syncActive(store, profiles, state.activeId);
  return { profiles, activeId };
}

export function renamePrintProfile(id: string, name: string): PrintProfileLibrary {
  const store = storage();
  if (!store) return { profiles: [], activeId: null };
  const state = loadPrintProfileLibrary();
  const clean = name.trim();
  if (!clean) return state;
  const profiles = state.profiles.map((profile) => profile.id === id ? { ...profile, name: clean, updatedAt: new Date().toISOString() } : profile);
  writeProfiles(store, profiles);
  const activeId = syncActive(store, profiles, state.activeId);
  return { profiles, activeId };
}

export function removePrintProfile(id: string): PrintProfileLibrary {
  const store = storage();
  if (!store) return { profiles: [], activeId: null };
  const state = loadPrintProfileLibrary();
  const profiles = state.profiles.filter((profile) => profile.id !== id);
  writeProfiles(store, profiles);
  const activeId = syncActive(store, profiles, state.activeId === id ? null : state.activeId);
  return { profiles, activeId };
}

export function selectPrintProfile(id: string): PrintProfileLibrary {
  const store = storage();
  if (!store) return { profiles: [], activeId: null };
  const state = loadPrintProfileLibrary();
  if (!state.profiles.some((profile) => profile.id === id)) return state;
  const activeId = syncActive(store, state.profiles, id);
  return { profiles: state.profiles, activeId };
}
