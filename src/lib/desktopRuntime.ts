export type DistributionMode = 'browser' | 'portable' | 'installed';
export type StorageScope = 'browser' | 'portable' | 'portable-fallback' | 'installed';

export type DesktopRuntimeInfo = {
  desktop: boolean;
  distribution: DistributionMode;
  version: string;
  executableDirectory?: string | null;
  dataDirectory?: string | null;
  portableDataDirectory?: string | null;
  storageScope?: StorageScope;
};

const browserFallback: DesktopRuntimeInfo = {
  desktop: false,
  distribution: 'browser',
  version: 'browser-preview',
  executableDirectory: null,
  dataDirectory: null,
  portableDataDirectory: null,
  storageScope: 'browser',
};

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function getDesktopRuntimeInfo(): Promise<DesktopRuntimeInfo> {
  if (!isTauriRuntime()) return browserFallback;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<DesktopRuntimeInfo>('runtime_info');
  } catch (error) {
    console.warn('PrintGuardian could not read desktop runtime information.', error);
    return browserFallback;
  }
}

export async function openExternalUrl(url: string): Promise<void> {
  if (!isTauriRuntime()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const { openUrl } = await import('@tauri-apps/plugin-opener');
  await openUrl(url);
}
