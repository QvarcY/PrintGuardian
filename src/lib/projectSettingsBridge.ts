export type ProjectSettings = Record<string, unknown>;

export type BuilderCanonicalKey =
  | 'printer_profile'
  | 'nozzle_diameter'
  | 'build_plate'
  | 'process_profile'
  | 'layer_height'
  | 'wall_loops'
  | 'sparse_infill_density'
  | 'enable_support'
  | 'brim_width'
  | 'max_volumetric_speed';

export type BuilderValueMap = Partial<Record<BuilderCanonicalKey, unknown>>;

export type BuilderFieldPolicy = 'supported' | 'blocked-compound' | 'blocked-material-index';

export type BuilderFieldDefinition = {
  key: BuilderCanonicalKey;
  aliases: readonly string[];
  policy: BuilderFieldPolicy;
};

export const BUILDER_FIELDS: readonly BuilderFieldDefinition[] = [
  { key: 'printer_profile', aliases: ['printer_settings_id', 'machine_settings_id'], policy: 'blocked-compound' },
  { key: 'nozzle_diameter', aliases: ['nozzle_diameter'], policy: 'blocked-compound' },
  { key: 'build_plate', aliases: ['curr_bed_type', 'bed_type'], policy: 'blocked-compound' },
  { key: 'process_profile', aliases: ['print_settings_id', 'process_settings_id'], policy: 'blocked-compound' },
  { key: 'layer_height', aliases: ['layer_height'], policy: 'supported' },
  { key: 'wall_loops', aliases: ['wall_loops', 'perimeters'], policy: 'supported' },
  { key: 'sparse_infill_density', aliases: ['sparse_infill_density', 'fill_density'], policy: 'supported' },
  { key: 'enable_support', aliases: ['enable_support', 'support_material'], policy: 'supported' },
  { key: 'brim_width', aliases: ['brim_width'], policy: 'supported' },
  { key: 'max_volumetric_speed', aliases: ['filament_max_volumetric_speed', 'max_volumetric_speed'], policy: 'blocked-material-index' },
] as const;

const byKey = new Map<BuilderCanonicalKey, BuilderFieldDefinition>(BUILDER_FIELDS.map((field) => [field.key, field]));

function cloneJsonValue<T>(value: T): T {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

export function builderField(key: string): BuilderFieldDefinition | undefined {
  return byKey.get(key as BuilderCanonicalKey);
}

export function findExistingProjectSettingsKey(project: ProjectSettings, canonicalKey: string): string | undefined {
  const field = builderField(canonicalKey);
  if (!field) return undefined;
  return field.aliases.find((alias) => Object.prototype.hasOwnProperty.call(project, alias));
}

export function captureBuilderValues(project: ProjectSettings): BuilderValueMap {
  const values: BuilderValueMap = {};
  for (const field of BUILDER_FIELDS) {
    const concreteKey = field.aliases.find((alias) => Object.prototype.hasOwnProperty.call(project, alias));
    if (!concreteKey) continue;
    values[field.key] = cloneJsonValue(project[concreteKey]);
  }
  return values;
}

export function cloneProjectSettings(project: ProjectSettings): ProjectSettings {
  return cloneJsonValue(project);
}

export function jsonValueKind(value: unknown): 'array' | 'null' | 'string' | 'number' | 'boolean' | 'object' | 'undefined' {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'object';
}


export type ManualEditorKind = 'number' | 'integer' | 'boolean';

export type ManualEditorDefinition = {
  key: BuilderCanonicalKey;
  kind: ManualEditorKind;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
};

const MANUAL_EDITORS: Partial<Record<BuilderCanonicalKey, ManualEditorDefinition>> = {
  layer_height: { key: 'layer_height', kind: 'number', unit: 'mm', min: 0.04, max: 1.2, step: 0.01 },
  wall_loops: { key: 'wall_loops', kind: 'integer', min: 1, max: 20, step: 1 },
  sparse_infill_density: { key: 'sparse_infill_density', kind: 'number', unit: '%', min: 0, max: 100, step: 1 },
  enable_support: { key: 'enable_support', kind: 'boolean' },
  brim_width: { key: 'brim_width', kind: 'number', unit: 'mm', min: 0, max: 50, step: 0.5 },
};

export function manualEditorFor(key: string): ManualEditorDefinition | undefined {
  return MANUAL_EDITORS[key as BuilderCanonicalKey];
}

function rawBooleanLike(source: unknown, enabled: boolean): unknown {
  if (typeof source === 'boolean') return enabled;
  if (typeof source === 'number') return enabled ? 1 : 0;
  if (typeof source === 'string') {
    const lower = source.toLowerCase();
    if (lower === 'true' || lower === 'false') return enabled ? 'true' : 'false';
    if (lower === 'yes' || lower === 'no') return enabled ? 'yes' : 'no';
    if (lower === 'on' || lower === 'off') return enabled ? 'on' : 'off';
    return enabled ? '1' : '0';
  }
  return enabled;
}

function parseNumberLike(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const match = value.trim().match(/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)/);
  if (!match) return undefined;
  const parsed = Number(match[0].replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function rawNumberLike(source: unknown, value: number): unknown {
  if (typeof source === 'number') return value;
  if (typeof source !== 'string') return value;

  const match = source.match(/^(\s*)([+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+))(\s*.*)$/);
  if (!match) return String(value);

  const sourceNumber = Number(match[2].replace(',', '.'));
  if (Number.isFinite(sourceNumber) && sourceNumber === value) return source;

  let rendered = String(value);
  if (match[2].includes(',')) rendered = rendered.replace('.', ',');
  return `${match[1]}${rendered}${match[3]}`;
}

export function coerceManualBuilderValue(
  project: ProjectSettings,
  canonicalKey: string,
  input: number | boolean,
): { ok: true; rawValue: unknown } | { ok: false; reason: string } {
  const editor = manualEditorFor(canonicalKey);
  if (!editor) return { ok: false, reason: 'manual-edit-not-supported' };
  const targetKey = findExistingProjectSettingsKey(project, canonicalKey);
  if (!targetKey) return { ok: false, reason: 'missing-project-key' };
  const source = project[targetKey];
  if (Array.isArray(source) || (source != null && typeof source === 'object')) return { ok: false, reason: 'compound-value' };

  if (editor.kind === 'boolean') {
    if (typeof input !== 'boolean') return { ok: false, reason: 'invalid-boolean' };
    return { ok: true, rawValue: rawBooleanLike(source, input) };
  }

  if (typeof input !== 'number' || !Number.isFinite(input)) return { ok: false, reason: 'invalid-number' };
  const normalized = editor.kind === 'integer' ? Math.round(input) : input;
  if (editor.min != null && normalized < editor.min) return { ok: false, reason: 'below-minimum' };
  if (editor.max != null && normalized > editor.max) return { ok: false, reason: 'above-maximum' };
  return { ok: true, rawValue: rawNumberLike(source, normalized) };
}

export function normalizeManualBuilderRawValue(
  project: ProjectSettings,
  canonicalKey: string,
  input: unknown,
): { ok: true; rawValue: unknown } | { ok: false; reason: string } {
  const editor = manualEditorFor(canonicalKey);
  if (!editor) return { ok: false, reason: 'manual-edit-not-supported' };

  if (editor.kind === 'boolean') {
    if (typeof input === 'boolean') return coerceManualBuilderValue(project, canonicalKey, input);
    if (typeof input === 'number') return coerceManualBuilderValue(project, canonicalKey, input !== 0);
    if (typeof input === 'string') {
      const lower = input.trim().toLowerCase();
      if (['1', 'true', 'yes', 'on', 'enabled'].includes(lower)) return coerceManualBuilderValue(project, canonicalKey, true);
      if (['0', 'false', 'no', 'off', 'disabled'].includes(lower)) return coerceManualBuilderValue(project, canonicalKey, false);
    }
    return { ok: false, reason: 'invalid-boolean' };
  }

  const numeric = parseNumberLike(input);
  if (numeric == null) return { ok: false, reason: 'invalid-number' };
  return coerceManualBuilderValue(project, canonicalKey, numeric);
}
