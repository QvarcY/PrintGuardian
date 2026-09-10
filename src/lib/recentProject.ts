export type RecentProjectMetadata = {
  name: string;
  size: number;
  lastModified: number;
  savedAt: string;
};

type RecentProjectRecord = RecentProjectMetadata & {
  id: 'last';
  blob: Blob;
};

const DB_NAME = 'printguardian.recentProject.v1';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const LAST_PROJECT_ID = 'last';

function hasIndexedDb(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  if (!hasIndexedDb()) return Promise.reject(new Error('IndexedDB is not available.'));

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Could not open recent-project storage.'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Recent-project storage request failed.'));
  });
}

async function readRecord(): Promise<RecentProjectRecord | null> {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const result = await requestResult(transaction.objectStore(STORE_NAME).get(LAST_PROJECT_ID));
    return (result as RecentProjectRecord | undefined) ?? null;
  } finally {
    db.close();
  }
}

export async function loadRecentProjectMetadata(): Promise<RecentProjectMetadata | null> {
  try {
    const record = await readRecord();
    if (!record) return null;
    return {
      name: record.name,
      size: record.size,
      lastModified: record.lastModified,
      savedAt: record.savedAt,
    };
  } catch (error) {
    console.warn('PrintGuardian could not read recent-project metadata.', error);
    return null;
  }
}

export async function loadRecentProjectFile(): Promise<File | null> {
  const record = await readRecord();
  if (!record) return null;
  return new File([record.blob], record.name, {
    type: record.blob.type || 'model/3mf',
    lastModified: record.lastModified,
  });
}

export async function saveRecentProject(file: File): Promise<RecentProjectMetadata> {
  const db = await openDatabase();
  const metadata: RecentProjectMetadata = {
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    savedAt: new Date().toISOString(),
  };
  const record: RecentProjectRecord = {
    id: LAST_PROJECT_ID,
    ...metadata,
    blob: file.slice(0, file.size, file.type || 'model/3mf'),
  };

  try {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    await requestResult(transaction.objectStore(STORE_NAME).put(record));
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Recent-project transaction failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Recent-project transaction was aborted.'));
    });
    return metadata;
  } finally {
    db.close();
  }
}

export async function removeRecentProject(): Promise<void> {
  if (!hasIndexedDb()) return;
  const db = await openDatabase();
  try {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    await requestResult(transaction.objectStore(STORE_NAME).delete(LAST_PROJECT_ID));
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Recent-project transaction failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Recent-project transaction was aborted.'));
    });
  } finally {
    db.close();
  }
}
