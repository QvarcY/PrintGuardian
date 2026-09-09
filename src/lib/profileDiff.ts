import type { ThreeMfInspection } from './threeMfInspector';

export type DiffStatus = 'same' | 'changed' | 'only-base' | 'only-compare';
export type DiffImpact = 'high' | 'medium' | 'low' | 'none';

export type ProfileDiffRow = {
  key: string;
  label: string;
  baseValue?: string;
  compareValue?: string;
  status: DiffStatus;
  impact: DiffImpact;
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

function impactFor(key: string, rowStatus: DiffStatus): DiffImpact {
  if (rowStatus === 'same') return 'none';
  return IMPACT[key] ?? 'low';
}

function numericDelta(baseValue?: string, compareValue?: string): string | undefined {
  const base = clean(baseValue);
  const compare = clean(compareValue);
  if (!base || !compare) return undefined;

  const baseNumber = Number.parseFloat(base.replace(',', '.'));
  const compareNumber = Number.parseFloat(compare.replace(',', '.'));
  if (!Number.isFinite(baseNumber) || !Number.isFinite(compareNumber) || baseNumber === 0) return undefined;

  const normalizedBaseUnit = base.replace(/^[\s+-]*\d+(?:[.,]\d+)?\s*/, '').trim();
  const normalizedCompareUnit = compare.replace(/^[\s+-]*\d+(?:[.,]\d+)?\s*/, '').trim();
  if (normalizedBaseUnit !== normalizedCompareUnit) return undefined;

  const percent = ((compareNumber - baseNumber) / Math.abs(baseNumber)) * 100;
  if (Math.abs(percent) < 0.05) return undefined;
  const rounded = Math.abs(percent) >= 10 ? Math.round(percent) : Math.round(percent * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

export function compareInspections(base: ThreeMfInspection, compare: ThreeMfInspection): ProfileDiff {
  const rows: ProfileDiffRow[] = [
    ['printer_profile', 'Printer profile', base.printerProfile || base.printerModel, compare.printerProfile || compare.printerModel],
    ['nozzle_diameter', 'Nozzle diameter', base.nozzleDiameter ? `${base.nozzleDiameter} mm` : undefined, compare.nozzleDiameter ? `${compare.nozzleDiameter} mm` : undefined],
    ['build_plate', 'Build plate', base.buildPlate, compare.buildPlate],
    ['process_profile', 'Process profile', base.processProfile, compare.processProfile],
  ].map(([key, label, baseValue, compareValue]) => {
    const rowStatus = status(baseValue as string | undefined, compareValue as string | undefined);
    return {
      key: String(key),
      label: String(label),
      baseValue: clean(baseValue as string | undefined),
      compareValue: clean(compareValue as string | undefined),
      status: rowStatus,
      impact: impactFor(String(key), rowStatus),
      delta: numericDelta(baseValue as string | undefined, compareValue as string | undefined),
    };
  });

  const baseSettings = new Map(base.settings.map((item) => [item.key, item]));
  const compareSettings = new Map(compare.settings.map((item) => [item.key, item]));
  const orderedKeys = Array.from(new Set([...baseSettings.keys(), ...compareSettings.keys()]));

  for (const key of orderedKeys) {
    const left = baseSettings.get(key);
    const right = compareSettings.get(key);
    const baseValue = clean(left?.value);
    const compareValue = clean(right?.value);
    const rowStatus = status(baseValue, compareValue);
    rows.push({
      key: `setting:${key}`,
      settingKey: key,
      label: left?.label || right?.label || key,
      baseValue,
      compareValue,
      status: rowStatus,
      impact: impactFor(key, rowStatus),
      delta: numericDelta(baseValue, compareValue),
    });
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
