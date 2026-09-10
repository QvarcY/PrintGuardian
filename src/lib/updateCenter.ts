export type UpdateChannel = 'preview' | 'stable';

export type UpdateCandidate = {
  version: string;
  name: string;
  notes: string;
  releaseUrl: string;
  downloadUrl?: string | null;
  prerelease: boolean;
  publishedAt?: string | null;
  simulated?: boolean;
  highlights?: string[];
};

export type UpdatePreferences = {
  channel: UpdateChannel;
  automaticChecks: boolean;
  lastCheckedAt: string | null;
  lastResult: 'never' | 'current' | 'available' | 'error' | 'no-releases';
  cachedCandidate: UpdateCandidate | null;
  dismissedVersion: string | null;
};

const STORAGE_KEY = 'printguardian.updateCenter.v1';
const CHECK_INTERVAL_MS = 12 * 60 * 60 * 1000;
const RELEASES_API = 'https://api.github.com/repos/QvarcY/PrintGuardian/releases?per_page=20';

const defaults = (version = ''): UpdatePreferences => ({
  channel: version.includes('-') ? 'preview' : 'stable',
  automaticChecks: true,
  lastCheckedAt: null,
  lastResult: 'never',
  cachedCandidate: null,
  dismissedVersion: null,
});

export function loadUpdatePreferences(version = ''): UpdatePreferences {
  if (typeof window === 'undefined') return defaults(version);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults(version);
    const parsed = JSON.parse(raw) as Partial<UpdatePreferences>;
    return {
      ...defaults(version),
      ...parsed,
      channel: parsed.channel === 'stable' ? 'stable' : 'preview',
      automaticChecks: parsed.automaticChecks !== false,
      cachedCandidate: parsed.cachedCandidate ?? null,
    };
  } catch {
    return defaults(version);
  }
}

export function saveUpdatePreferences(value: UpdatePreferences): UpdatePreferences {
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); }
    catch (error) { console.warn('PrintGuardian could not persist update preferences.', error); }
  }
  return value;
}

export function shouldRunAutomaticCheck(preferences: UpdatePreferences, now = Date.now()): boolean {
  if (!preferences.automaticChecks) return false;
  if (!preferences.lastCheckedAt) return true;
  const then = Date.parse(preferences.lastCheckedAt);
  return !Number.isFinite(then) || now - then >= CHECK_INTERVAL_MS;
}

type ParsedVersion = { core: number[]; prerelease: Array<number | string> };

export function parseVersion(input: string): ParsedVersion | null {
  const normalized = input.trim().replace(/^v/i, '');
  const [coreRaw, prereleaseRaw = ''] = normalized.split('+')[0].split('-', 2);
  const core = coreRaw.split('.').map((part) => Number(part));
  if (core.length < 3 || core.some((part) => !Number.isInteger(part) || part < 0)) return null;
  const prerelease = prereleaseRaw
    ? prereleaseRaw.split('.').map((part) => /^\d+$/.test(part) ? Number(part) : part.toLowerCase())
    : [];
  return { core, prerelease };
}

export function compareVersions(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

  for (let index = 0; index < Math.max(left.core.length, right.core.length); index += 1) {
    const delta = (left.core[index] ?? 0) - (right.core[index] ?? 0);
    if (delta !== 0) return delta > 0 ? 1 : -1;
  }

  if (!left.prerelease.length && !right.prerelease.length) return 0;
  if (!left.prerelease.length) return 1;
  if (!right.prerelease.length) return -1;

  for (let index = 0; index < Math.max(left.prerelease.length, right.prerelease.length); index += 1) {
    const l = left.prerelease[index];
    const r = right.prerelease[index];
    if (l === undefined) return -1;
    if (r === undefined) return 1;
    if (l === r) continue;
    if (typeof l === 'number' && typeof r === 'number') return l > r ? 1 : -1;
    if (typeof l === 'number') return -1;
    if (typeof r === 'number') return 1;
    return l > r ? 1 : -1;
  }
  return 0;
}

type GitHubAsset = { name?: string; browser_download_url?: string };
type GitHubRelease = {
  tag_name?: string;
  name?: string | null;
  body?: string | null;
  html_url?: string;
  draft?: boolean;
  prerelease?: boolean;
  published_at?: string | null;
  assets?: GitHubAsset[];
};

function candidateFromRelease(release: GitHubRelease): UpdateCandidate | null {
  const version = release.tag_name?.trim();
  if (!version || !parseVersion(version) || release.draft) return null;
  const windowsAsset = release.assets?.find((asset) => {
    const name = asset.name?.toLowerCase() ?? '';
    return name.includes('windows') && name.includes('x64') && name.endsWith('.zip');
  });
  return {
    version: version.replace(/^v/i, ''),
    name: release.name?.trim() || version,
    notes: release.body?.trim() || '',
    releaseUrl: release.html_url || 'https://github.com/QvarcY/PrintGuardian/releases',
    downloadUrl: windowsAsset?.browser_download_url ?? null,
    prerelease: release.prerelease === true,
    publishedAt: release.published_at ?? null,
  };
}

export async function checkPublishedUpdates(currentVersion: string, channel: UpdateChannel): Promise<{
  result: UpdatePreferences['lastResult'];
  candidate: UpdateCandidate | null;
}> {
  const response = await fetch(RELEASES_API, {
    headers: { Accept: 'application/vnd.github+json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`GitHub Releases returned HTTP ${response.status}`);
  const releases = await response.json() as GitHubRelease[];
  const eligible = releases
    .map(candidateFromRelease)
    .filter((candidate): candidate is UpdateCandidate => Boolean(candidate))
    .filter((candidate) => channel === 'preview' || !candidate.prerelease)
    .sort((a, b) => compareVersions(b.version, a.version));

  if (!eligible.length) return { result: 'no-releases', candidate: null };
  const candidate = eligible.find((item) => compareVersions(item.version, currentVersion) > 0) ?? null;
  return { result: candidate ? 'available' : 'current', candidate };
}

export function createSimulatedUpdate(currentVersion: string): UpdateCandidate {
  const parsed = parseVersion(currentVersion);
  let version = '0.3.0-dev.15';
  if (parsed) {
    const devIndex = parsed.prerelease.findIndex((part) => part === 'dev');
    const next = devIndex >= 0 && typeof parsed.prerelease[devIndex + 1] === 'number'
      ? Number(parsed.prerelease[devIndex + 1]) + 1
      : 1;
    version = `${parsed.core.slice(0, 3).join('.')}-dev.${next}`;
  }
  return {
    version,
    name: `PrintGuardian v${version}`,
    notes: 'Development-only update-notification simulation.',
    releaseUrl: 'https://github.com/QvarcY/PrintGuardian/releases',
    downloadUrl: null,
    prerelease: true,
    simulated: true,
    highlights: ['History is now available', 'New project review coverage'],
  };
}
