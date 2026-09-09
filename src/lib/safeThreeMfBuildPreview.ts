import type { ThreeMfInspection } from './threeMfInspector';
import type { ComparableInspection, ProfileDiffRow } from './profileDiff';
import type { ProfileDecision } from './profileDecisionPlan';
import {
  builderField,
  cloneProjectSettings,
  findExistingProjectSettingsKey,
  jsonValueKind,
  type BuilderFieldPolicy,
  type ProjectSettings,
} from './projectSettingsBridge';

export type BuildPreviewStatus = 'ready' | 'blocked' | 'unresolved' | 'kept-project';

export type BuildPreviewMutation = {
  rowKey: string;
  label: string;
  impact: ProfileDiffRow['impact'];
  status: BuildPreviewStatus;
  canonicalKey: string;
  targetKey?: string;
  before?: unknown;
  after?: unknown;
  reason?: 'compound-metadata' | 'material-index' | 'missing-mapping' | 'missing-project-key' | 'missing-baseline-raw-value' | 'type-mismatch';
};

export type SafeThreeMfBuildPreview = {
  sourceFileName: string;
  sourceSettingsCount: number;
  previewSettingsCount: number;
  selectedBaselineCount: number;
  readyCount: number;
  blockedCount: number;
  unresolvedCount: number;
  sourceUntouched: boolean;
  serializes: boolean;
  serializedBytes: number;
  beforeFingerprint: string;
  afterFingerprint: string;
  changed: boolean;
  baselineRawValuesAvailable: boolean;
  mutations: BuildPreviewMutation[];
  previewProjectSettings?: ProjectSettings;
};

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

function fingerprint(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function canonicalKey(row: ProfileDiffRow): string {
  return row.settingKey ?? row.key;
}

function policyReason(policy: BuilderFieldPolicy): BuildPreviewMutation['reason'] | undefined {
  if (policy === 'blocked-compound') return 'compound-metadata';
  if (policy === 'blocked-material-index') return 'material-index';
  return undefined;
}

function compatibleKinds(before: unknown, after: unknown): boolean {
  return jsonValueKind(before) === jsonValueKind(after);
}

export function createSafeThreeMfBuildPreview(
  inspection: ThreeMfInspection,
  baseline: ComparableInspection,
  rows: ProfileDiffRow[],
  decisions: Record<string, ProfileDecision>,
): SafeThreeMfBuildPreview {
  const source = inspection.projectSettings;
  const baselineValues = baseline.builderValues;
  const baselineRawValuesAvailable = Boolean(baselineValues && Object.keys(baselineValues).length > 0);

  if (!source) {
    return {
      sourceFileName: inspection.fileName,
      sourceSettingsCount: inspection.projectSettingsCount,
      previewSettingsCount: inspection.projectSettingsCount,
      selectedBaselineCount: Object.values(decisions).filter((decision) => decision === 'baseline').length,
      readyCount: 0,
      blockedCount: 0,
      unresolvedCount: Object.values(decisions).filter((decision) => decision === 'baseline').length,
      sourceUntouched: true,
      serializes: false,
      serializedBytes: 0,
      beforeFingerprint: '--------',
      afterFingerprint: '--------',
      changed: false,
      baselineRawValuesAvailable,
      mutations: [],
    };
  }

  const beforeJson = stableJson(source);
  const preview = cloneProjectSettings(source);
  const mutations: BuildPreviewMutation[] = [];

  for (const row of rows.filter((item) => item.status !== 'same')) {
    const requested = decisions[row.key] ?? 'project';
    const canonical = canonicalKey(row);

    if (requested !== 'baseline') {
      mutations.push({
        rowKey: row.key,
        label: row.label,
        impact: row.impact,
        status: 'kept-project',
        canonicalKey: canonical,
      });
      continue;
    }

    const field = builderField(canonical);
    if (!field) {
      mutations.push({ rowKey: row.key, label: row.label, impact: row.impact, status: 'blocked', canonicalKey: canonical, reason: 'missing-mapping' });
      continue;
    }

    const reason = policyReason(field.policy);
    if (reason) {
      mutations.push({ rowKey: row.key, label: row.label, impact: row.impact, status: 'blocked', canonicalKey: canonical, reason });
      continue;
    }

    const targetKey = findExistingProjectSettingsKey(source, canonical);
    if (!targetKey) {
      mutations.push({ rowKey: row.key, label: row.label, impact: row.impact, status: 'unresolved', canonicalKey: canonical, reason: 'missing-project-key' });
      continue;
    }

    const baselineRaw = baselineValues?.[canonical as keyof typeof baselineValues];
    if (baselineRaw === undefined) {
      mutations.push({ rowKey: row.key, label: row.label, impact: row.impact, status: 'unresolved', canonicalKey: canonical, targetKey, reason: 'missing-baseline-raw-value' });
      continue;
    }

    const before = source[targetKey];
    if (!compatibleKinds(before, baselineRaw)) {
      mutations.push({ rowKey: row.key, label: row.label, impact: row.impact, status: 'blocked', canonicalKey: canonical, targetKey, before, after: baselineRaw, reason: 'type-mismatch' });
      continue;
    }

    preview[targetKey] = cloneProjectSettings({ value: baselineRaw }).value;
    mutations.push({
      rowKey: row.key,
      label: row.label,
      impact: row.impact,
      status: 'ready',
      canonicalKey: canonical,
      targetKey,
      before,
      after: baselineRaw,
    });
  }

  let serialized = '';
  let serializes = false;
  try {
    serialized = JSON.stringify(preview, null, 2);
    JSON.parse(serialized);
    serializes = true;
  } catch {
    serializes = false;
  }

  const afterJson = stableJson(preview);
  const sourceUntouched = stableJson(source) === beforeJson;
  const selected = mutations.filter((mutation) => mutation.status !== 'kept-project');

  return {
    sourceFileName: inspection.fileName,
    sourceSettingsCount: Object.keys(source).length,
    previewSettingsCount: Object.keys(preview).length,
    selectedBaselineCount: selected.length,
    readyCount: mutations.filter((mutation) => mutation.status === 'ready').length,
    blockedCount: mutations.filter((mutation) => mutation.status === 'blocked').length,
    unresolvedCount: mutations.filter((mutation) => mutation.status === 'unresolved').length,
    sourceUntouched,
    serializes,
    serializedBytes: new TextEncoder().encode(serialized).byteLength,
    beforeFingerprint: fingerprint(beforeJson),
    afterFingerprint: fingerprint(afterJson),
    changed: beforeJson !== afterJson,
    baselineRawValuesAvailable,
    mutations,
    previewProjectSettings: preview,
  };
}
