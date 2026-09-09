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
