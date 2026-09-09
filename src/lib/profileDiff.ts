import type { ThreeMfInspection } from './threeMfInspector';

export type DiffStatus = 'same' | 'changed' | 'only-base' | 'only-compare';

export type ProfileDiffRow = {
  key: string;
  label: string;
  baseValue?: string;
  compareValue?: string;
  status: DiffStatus;
  settingKey?: string;
};

export type ProfileDiff = {
  rows: ProfileDiffRow[];
  changed: number;
  same: number;
  missing: number;
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

export function compareInspections(base: ThreeMfInspection, compare: ThreeMfInspection): ProfileDiff {
  const rows: ProfileDiffRow[] = [
    ['printer_profile', 'Printer profile', base.printerProfile || base.printerModel, compare.printerProfile || compare.printerModel],
    ['nozzle_diameter', 'Nozzle diameter', base.nozzleDiameter ? `${base.nozzleDiameter} mm` : undefined, compare.nozzleDiameter ? `${compare.nozzleDiameter} mm` : undefined],
    ['build_plate', 'Build plate', base.buildPlate, compare.buildPlate],
    ['process_profile', 'Process profile', base.processProfile, compare.processProfile],
  ].map(([key, label, baseValue, compareValue]) => ({
    key: String(key),
    label: String(label),
    baseValue: clean(baseValue as string | undefined),
    compareValue: clean(compareValue as string | undefined),
    status: status(baseValue as string | undefined, compareValue as string | undefined),
  }));

  const baseSettings = new Map(base.settings.map((item) => [item.key, item]));
  const compareSettings = new Map(compare.settings.map((item) => [item.key, item]));
  const orderedKeys = Array.from(new Set([...baseSettings.keys(), ...compareSettings.keys()]));

  for (const key of orderedKeys) {
    const left = baseSettings.get(key);
    const right = compareSettings.get(key);
    const baseValue = clean(left?.value);
    const compareValue = clean(right?.value);
    rows.push({
      key: `setting:${key}`,
      settingKey: key,
      label: left?.label || right?.label || key,
      baseValue,
      compareValue,
      status: status(baseValue, compareValue),
    });
  }

  return {
    rows,
    changed: rows.filter((row) => row.status === 'changed').length,
    same: rows.filter((row) => row.status === 'same').length,
    missing: rows.filter((row) => row.status === 'only-base' || row.status === 'only-compare').length,
  };
}
