import type { ThreeMfInspection } from './threeMfInspector';

export type ProjectHistoryEntry = {
  id: string;
  fileName: string;
  fileSize: number;
  lastModified: number;
  openedAt: string;
  slicer?: string;
  printerProfile?: string;
  nozzleDiameter?: string;
  buildPlate?: string;
  processProfile?: string;
  filaments: string[];
  objectCount: number;
  plateCount: number;
  noticeCount: number;
};

const STORAGE_KEY = 'printguardian.projectHistory.v1';
const MAX_ENTRIES = 20;

function loadRaw(): ProjectHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ProjectHistoryEntry => {
      if (!item || typeof item !== 'object') return false;
      const entry = item as Partial<ProjectHistoryEntry>;
      return typeof entry.id === 'string'
        && typeof entry.fileName === 'string'
        && typeof entry.fileSize === 'number'
        && typeof entry.openedAt === 'string'
        && Array.isArray(entry.filaments);
    }).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function save(entries: ProjectHistoryEntry[]): ProjectHistoryEntry[] {
  const normalized = entries.slice(0, MAX_ENTRIES);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      console.warn('PrintGuardian could not persist project history.', error);
    }
  }
  return normalized;
}

function makeId(inspection: ThreeMfInspection): string {
  const lastModified = inspection.sourceFile?.lastModified ?? 0;
  return `${inspection.fileName}\u0000${inspection.fileSize}\u0000${lastModified}`;
}

export function loadProjectHistory(): ProjectHistoryEntry[] {
  return loadRaw().sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt));
}

export function recordProjectInspection(inspection: ThreeMfInspection): ProjectHistoryEntry[] {
  if (!inspection.sourceFile) return loadProjectHistory();

  const lastModified = inspection.sourceFile?.lastModified ?? 0;
  const entry: ProjectHistoryEntry = {
    id: makeId(inspection),
    fileName: inspection.fileName,
    fileSize: inspection.fileSize,
    lastModified,
    openedAt: new Date().toISOString(),
    slicer: inspection.slicer,
    printerProfile: inspection.printerProfile,
    nozzleDiameter: inspection.nozzleDiameter,
    buildPlate: inspection.buildPlate,
    processProfile: inspection.processProfile,
    filaments: inspection.filaments.map((item) => item.type).filter(Boolean),
    objectCount: inspection.objectCount,
    plateCount: inspection.plateCount,
    noticeCount: inspection.notices.length,
  };

  const previous = loadRaw().filter((item) => item.id !== entry.id);
  return save([entry, ...previous]);
}

export function removeProjectHistoryEntry(id: string): ProjectHistoryEntry[] {
  return save(loadRaw().filter((item) => item.id !== id));
}

export function clearProjectHistory(): ProjectHistoryEntry[] {
  if (typeof window !== 'undefined') {
    try { window.localStorage.removeItem(STORAGE_KEY); }
    catch (error) { console.warn('PrintGuardian could not clear project history.', error); }
  }
  return [];
}
