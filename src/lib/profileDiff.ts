import type { ThreeMfInspection } from './threeMfInspector';

export type ComparableInspection = Pick<ThreeMfInspection,
  'fileName' | 'printerProfile' | 'printerModel' | 'nozzleDiameter' | 'buildPlate' | 'processProfile' | 'settings' | 'dna' | 'builderValues'
>;

export type DiffStatus = 'same' | 'changed' | 'only-base' | 'only-compare';
export type DiffImpact = 'high' | 'medium' | 'low' | 'none';
export type DiffCategory = 'compatibility' | 'adhesion' | 'quality' | 'strength' | 'flow' | 'process';
export type DiffDirection = 'higher' | 'lower' | 'enabled' | 'disabled' | 'different' | 'none';

export type ProfileDiffRow = {
  key: string;
  label: string;
  baseValue?: string;
  compareValue?: string;
  status: DiffStatus;
  impact: DiffImpact;
  category: DiffCategory;
  direction: DiffDirection;
  delta?: string;
  settingKey?: string;
};

export type ProfileDiff = {
  rows: ProfileDiffRow[];
  changed: number;
  same: number;
  missing: number;
  highImpact: number;
};

function clean(value?: string) {
  const text = value?.trim();
  return text || undefined;
}

function status(baseValue?: string, compareValue?: string): DiffStatus {
  const base = clean(baseValue);
  const compare = clean(compareValue);
  if (base == null && compare == null) return 'same';
  if (base == null) return 'only-compare';
  if (compare == null) return 'only-base';
  return base === compare ? 'same' : 'changed';
}

const IMPACT: Record<string, DiffImpact> = {
  printer_profile: 'high',
  nozzle_diameter: 'high',
  build_plate: 'high',
  process_profile: 'medium',
  layer_height: 'medium',
  wall_loops: 'medium',
  sparse_infill_density: 'low',
  enable_support: 'high',
  brim_width: 'medium',
  max_volumetric_speed: 'high',
};

const CATEGORY: Record<string, DiffCategory> = {
  printer_profile: 'compatibility',
  nozzle_diameter: 'compatibility',
  build_plate: 'adhesion',
  process_profile: 'process',
  layer_height: 'quality',
  wall_loops: 'strength',
  sparse_infill_density: 'strength',
  enable_support: 'quality',
  brim_width: 'adhesion',
  max_volumetric_speed: 'flow',
};

function impactFor(key: string, rowStatus: DiffStatus): DiffImpact {
  if (rowStatus === 'same') return 'none';
  return IMPACT[key] ?? 'low';
}

function categoryFor(key: string): DiffCategory {
  return CATEGORY[key] ?? 'process';
}

function parseNumber(value?: string): { value: number; unit: string } | undefined {
  const text = clean(value);
  if (!text) return undefined;
  const match = text.match(/^\s*([+-]?\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!match) return undefined;
  const number = Number.parseFloat(match[1].replace(',', '.'));
  if (!Number.isFinite(number)) return undefined;
  return { value: number, unit: match[2].trim() };
}

function numericDelta(baseValue?: string, compareValue?: string): string | undefined {
  const base = parseNumber(baseValue);
  const compare = parseNumber(compareValue);
  if (!base || !compare || base.value === 0 || base.unit !== compare.unit) return undefined;

  const percent = ((compare.value - base.value) / Math.abs(base.value)) * 100;
  if (Math.abs(percent) < 0.05) return undefined;
  const rounded = Math.abs(percent) >= 10 ? Math.round(percent) : Math.round(percent * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

function directionFor(key: string, baseValue?: string, compareValue?: string, rowStatus?: DiffStatus): DiffDirection {
  if (rowStatus === 'same' || rowStatus === 'only-base' || rowStatus === 'only-compare') return 'none';

  if (key === 'enable_support') {
    const right = clean(compareValue)?.toLowerCase();
    if (right === 'enabled') return 'enabled';
    if (right === 'disabled') return 'disabled';
  }

  const base = parseNumber(baseValue);
  const compare = parseNumber(compareValue);
  if (base && compare && base.unit === compare.unit) {
    if (compare.value > base.value) return 'higher';
    if (compare.value < base.value) return 'lower';
  }

  return rowStatus === 'changed' ? 'different' : 'none';
}

function makeRow(key: string, label: string, baseValue?: string, compareValue?: string, settingKey?: string): ProfileDiffRow {
  const rowStatus = status(baseValue, compareValue);
  const comparisonKey = settingKey ?? key;
  return {
    key,
    settingKey,
    label,
    baseValue: clean(baseValue),
    compareValue: clean(compareValue),
    status: rowStatus,
    impact: impactFor(comparisonKey, rowStatus),
    category: categoryFor(comparisonKey),
    direction: directionFor(comparisonKey, baseValue, compareValue, rowStatus),
    delta: numericDelta(baseValue, compareValue),
  };
}

export function compareInspections(base: ComparableInspection, compare: ComparableInspection): ProfileDiff {
  const rows: ProfileDiffRow[] = [
    makeRow('printer_profile', 'Printer profile', base.printerProfile || base.printerModel, compare.printerProfile || compare.printerModel),
    makeRow('nozzle_diameter', 'Nozzle diameter', base.nozzleDiameter ? `${base.nozzleDiameter} mm` : undefined, compare.nozzleDiameter ? `${compare.nozzleDiameter} mm` : undefined),
    makeRow('build_plate', 'Build plate', base.buildPlate, compare.buildPlate),
    makeRow('process_profile', 'Process profile', base.processProfile, compare.processProfile),
  ];

  const baseSettings = new Map(base.settings.map((item) => [item.key, item]));
  const compareSettings = new Map(compare.settings.map((item) => [item.key, item]));
  const orderedKeys = Array.from(new Set([...baseSettings.keys(), ...compareSettings.keys()]));

  for (const key of orderedKeys) {
    const left = baseSettings.get(key);
    const right = compareSettings.get(key);
    rows.push(makeRow(`setting:${key}`, left?.label || right?.label || key, left?.value, right?.value, key));
  }

  rows.sort((a, b) => {
    const statusRank = (row: ProfileDiffRow) => row.status === 'same' ? 2 : 0;
    const impactRank: Record<DiffImpact, number> = { high: 0, medium: 1, low: 2, none: 3 };
    return statusRank(a) - statusRank(b) || impactRank[a.impact] - impactRank[b.impact] || a.label.localeCompare(b.label);
  });

  return {
    rows,
    changed: rows.filter((row) => row.status === 'changed').length,
    same: rows.filter((row) => row.status === 'same').length,
    missing: rows.filter((row) => row.status === 'only-base' || row.status === 'only-compare').length,
    highImpact: rows.filter((row) => row.impact === 'high').length,
  };
}
