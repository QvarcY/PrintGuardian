import { ZipArchive } from './zip';
import { captureBuilderValues, type BuilderValueMap, type ProjectSettings } from './projectSettingsBridge';

export type Severity = 'info' | 'warning' | 'critical';

export type InspectionNotice = {
  id: string;
  severity: Severity;
  titleKey: string;
  detailKey: string;
  values?: Record<string, string | number>;
};

export type FilamentInfo = {
  index: number;
  type: string;
  vendor?: string;
  color?: string;
  profile?: string;
  maxVolumetricSpeed?: string;
  usedGrams?: string;
};

export type SettingValue = {
  key: string;
  label: string;
  value: string;
  tooltipKey?: 'maxVolumetricSpeed' | 'wallLoops' | 'sparseInfillDensity' | 'layerHeight' | 'support' | 'brimWidth';
};

export type PrintDna = {
  quality: number;
  speed: number;
  flow: number;
  support: number;
  strength: number;
  cooling: number;
};

export type ThreeMfInspection = {
  kind: '3mf';
  fileName: string;
  fileSize: number;
  slicer?: string;
  printerProfile?: string;
  printerModel?: string;
  nozzleDiameter?: string;
  buildPlate?: string;
  processProfile?: string;
  objectCount: number;
  partCount: number;
  plateCount: number;
  archiveEntryCount: number;
  hasThumbnail: boolean;
  filaments: FilamentInfo[];
  settings: SettingValue[];
  notices: InspectionNotice[];
  dna: PrintDna;
  score: number;
  projectSettingsCount: number;
  archiveEntries: string[];
  builderValues?: BuilderValueMap;
  projectSettings?: ProjectSettings;
};

const PROJECT_SETTINGS = 'Metadata/project_settings.config';
const MODEL_SETTINGS = 'Metadata/model_settings.config';
const SLICE_INFO = 'Metadata/slice_info.config';
const MODEL_FILE = '3D/3dmodel.model';

const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : value == null ? [] : [value];

function display(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean).join(', ') || undefined;
  if (typeof value === 'object') return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function first(project: ProjectSettings, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = project[key];
    if (Array.isArray(value)) {
      const firstValue = value.find((item) => item != null && String(item).trim() !== '');
      if (firstValue != null) return String(firstValue);
    }
    const text = display(value);
    if (text) return text;
  }
  return undefined;
}

function numeric(value: unknown): number | undefined {
  if (Array.isArray(value)) return numeric(value[0]);
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function boolish(value: unknown): boolean | undefined {
  if (Array.isArray(value)) return boolish(value[0]);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    if (['1', 'true', 'yes', 'on'].includes(value.toLowerCase())) return true;
    if (['0', 'false', 'no', 'off'].includes(value.toLowerCase())) return false;
  }
  return undefined;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function parseXml(text: string): XMLDocument | undefined {
  const document = new DOMParser().parseFromString(text, 'application/xml');
  return document.getElementsByTagName('parsererror').length ? undefined : document;
}

function inferSlicer(project: ProjectSettings): string | undefined {
  const explicit = first(project, ['slicer_name', 'generated_by', 'slicer']);
  if (explicit) return explicit;
  const profile = first(project, ['printer_settings_id', 'print_settings_id']);
  if (!profile) return undefined;
  if (/bbl|bambu/i.test(profile)) return 'Bambu Studio / Bambu-compatible';
  return 'Bambu/Orca-compatible';
}

function readFilaments(project: ProjectSettings, sliceXml?: XMLDocument): FilamentInfo[] {
  const types = asArray(project.filament_type);
  const vendors = asArray(project.filament_vendor);
  const colors = asArray(project.filament_colour ?? project.filament_color);
  const profiles = asArray(project.filament_settings_id);
  const flow = asArray(project.filament_max_volumetric_speed ?? project.max_volumetric_speed);
  const count = Math.max(types.length, vendors.length, colors.length, profiles.length, flow.length);

  const sliceFilaments = sliceXml ? Array.from(sliceXml.getElementsByTagName('filament')) : [];
  const sliceById = new Map<number, Element>();
  sliceFilaments.forEach((node, index) => {
    const id = Number(node.getAttribute('id') ?? index + 1);
    sliceById.set(Number.isFinite(id) ? id : index + 1, node);
  });

  const effectiveCount = Math.max(count, sliceFilaments.length);
  return Array.from({ length: effectiveCount }, (_, index) => {
    const slice = sliceById.get(index + 1);
    return {
      index: index + 1,
      type: String(types[index] ?? slice?.getAttribute('type') ?? 'Unknown'),
      vendor: display(vendors[index]),
      color: display(colors[index] ?? slice?.getAttribute('color')),
      profile: display(profiles[index]),
      maxVolumetricSpeed: display(flow[index]),
      usedGrams: display(slice?.getAttribute('used_g')),
    };
  });
}

function readSettings(project: ProjectSettings): SettingValue[] {
  const candidates: Array<SettingValue & { keys: string[] }> = [
    { key: 'layer_height', keys: ['layer_height'], label: 'Layer height', value: '', tooltipKey: 'layerHeight' },
    { key: 'wall_loops', keys: ['wall_loops', 'perimeters'], label: 'Wall loops', value: '', tooltipKey: 'wallLoops' },
    { key: 'sparse_infill_density', keys: ['sparse_infill_density', 'fill_density'], label: 'Sparse infill density', value: '', tooltipKey: 'sparseInfillDensity' },
    { key: 'enable_support', keys: ['enable_support', 'support_material'], label: 'Enable support', value: '', tooltipKey: 'support' },
    { key: 'brim_width', keys: ['brim_width'], label: 'Brim width', value: '', tooltipKey: 'brimWidth' },
    { key: 'max_volumetric_speed', keys: ['filament_max_volumetric_speed', 'max_volumetric_speed'], label: 'Max volumetric speed', value: '', tooltipKey: 'maxVolumetricSpeed' },
  ];

  return candidates.flatMap((candidate) => {
    let raw: unknown;
    for (const key of candidate.keys) {
      if (project[key] != null) { raw = project[key]; break; }
    }
    if (raw == null) return [];

    let value: string;
    if (candidate.key === 'enable_support') {
      const enabled = boolish(raw);
      value = enabled == null ? String(raw) : enabled ? 'Enabled' : 'Disabled';
    } else if (candidate.key === 'layer_height' || candidate.key === 'brim_width') {
      value = `${display(raw) ?? '—'} mm`;
    } else if (candidate.key === 'sparse_infill_density') {
      value = `${display(raw) ?? '—'}%`;
    } else if (candidate.key === 'max_volumetric_speed') {
      value = `${display(raw) ?? '—'} mm³/s`;
    } else {
      value = display(raw) ?? '—';
    }

    return [{ key: candidate.key, label: candidate.label, value, tooltipKey: candidate.tooltipKey }];
  });
}

function buildDna(project: ProjectSettings): PrintDna {
  const nozzle = numeric(project.nozzle_diameter) ?? 0.4;
  const layer = numeric(project.layer_height) ?? 0.2;
  const walls = numeric(project.wall_loops ?? project.perimeters) ?? 2;
  const infill = numeric(project.sparse_infill_density ?? project.fill_density) ?? 15;
  const support = boolish(project.enable_support ?? project.support_material) ?? false;
  const flow = numeric(project.filament_max_volumetric_speed ?? project.max_volumetric_speed) ?? 12;
  const fan = numeric(project.fan_max_speed ?? project.fan_max_speed_percent ?? project.fan_always_on) ?? 70;
  const speed = numeric(project.outer_wall_speed ?? project.perimeter_speed ?? project.travel_speed) ?? 100;

  return {
    quality: clamp(100 - ((layer / Math.max(nozzle, 0.1)) - 0.2) * 100),
    speed: clamp((speed / 300) * 100),
    flow: clamp((flow / 30) * 100),
    support: support ? 78 : 20,
    strength: clamp(25 + walls * 12 + infill * 0.45),
    cooling: clamp(fan),
  };
}

function notices(project: ProjectSettings, objectCount: number, filaments: FilamentInfo[], hasProjectSettings: boolean): InspectionNotice[] {
  const result: InspectionNotice[] = [];
  if (!hasProjectSettings) {
    result.push({ id: 'missing-project-settings', severity: 'warning', titleKey: 'notices.missingSettings.title', detailKey: 'notices.missingSettings.detail' });
  }
  if (objectCount === 0) {
    result.push({ id: 'no-objects', severity: 'critical', titleKey: 'notices.noObjects.title', detailKey: 'notices.noObjects.detail' });
  }
  if (filaments.length > 8) {
    result.push({ id: 'many-filaments', severity: 'warning', titleKey: 'notices.manyFilaments.title', detailKey: 'notices.manyFilaments.detail', values: { count: filaments.length } });
  }

  const nozzle = numeric(project.nozzle_diameter);
  const layer = numeric(project.layer_height);
  if (nozzle && layer && layer > nozzle * 0.8) {
    result.push({ id: 'high-layer-height', severity: 'warning', titleKey: 'notices.highLayer.title', detailKey: 'notices.highLayer.detail', values: { layer, nozzle } });
  }

  const walls = numeric(project.wall_loops ?? project.perimeters);
  if (walls != null && walls <= 1) {
    result.push({ id: 'one-wall', severity: 'warning', titleKey: 'notices.oneWall.title', detailKey: 'notices.oneWall.detail', values: { walls } });
  }

  return result;
}

export async function inspectThreeMf(file: File): Promise<ThreeMfInspection> {
  const zip = await ZipArchive.fromFile(file);
  const names = zip.names();
  const hasProjectSettings = zip.has(PROJECT_SETTINGS);

  let project: ProjectSettings = {};
  if (hasProjectSettings) {
    try {
      project = JSON.parse(await zip.readText(PROJECT_SETTINGS)) as ProjectSettings;
    } catch {
      throw new Error('project_settings.config exists but could not be parsed as JSON.');
    }
  }

  const modelXml = zip.has(MODEL_FILE) ? parseXml(await zip.readText(MODEL_FILE)) : undefined;
  const modelSettingsXml = zip.has(MODEL_SETTINGS) ? parseXml(await zip.readText(MODEL_SETTINGS)) : undefined;
  const sliceXml = zip.has(SLICE_INFO) ? parseXml(await zip.readText(SLICE_INFO)) : undefined;

  const modelObjects = modelXml ? modelXml.getElementsByTagName('object').length : 0;
  const buildItems = modelXml ? modelXml.getElementsByTagName('item').length : 0;
  const configuredObjects = modelSettingsXml ? modelSettingsXml.getElementsByTagName('object').length : 0;
  const partCount = modelSettingsXml ? modelSettingsXml.getElementsByTagName('part').length : 0;
  const plateNodes = modelSettingsXml ? modelSettingsXml.getElementsByTagName('plate').length : 0;
  const plateFiles = names.filter((name) => /^Metadata\/plate_\d+\.json$/i.test(name)).length;
  const objectCount = configuredObjects || buildItems || modelObjects;
  const filaments = readFilaments(project, sliceXml);
  const inspectionNotices = notices(project, objectCount, filaments, hasProjectSettings);
  const critical = inspectionNotices.filter((notice) => notice.severity === 'critical').length;
  const warning = inspectionNotices.filter((notice) => notice.severity === 'warning').length;
  const score = clamp(100 - critical * 35 - warning * 8);

  return {
    kind: '3mf',
    fileName: file.name,
    fileSize: file.size,
    slicer: inferSlicer(project),
    printerProfile: first(project, ['printer_settings_id', 'machine_settings_id']),
    printerModel: first(project, ['printer_model', 'printer_structure']),
    nozzleDiameter: first(project, ['nozzle_diameter']),
    buildPlate: first(project, ['curr_bed_type', 'bed_type']),
    processProfile: first(project, ['print_settings_id', 'process_settings_id']),
    objectCount,
    partCount,
    plateCount: plateNodes || plateFiles || 1,
    archiveEntryCount: names.length,
    hasThumbnail: names.some((name) => /^Metadata\/plate_\d+\.png$/i.test(name) || /thumbnail.*\.png$/i.test(name)),
    filaments,
    settings: readSettings(project),
    notices: inspectionNotices,
    dna: buildDna(project),
    score,
    projectSettingsCount: Object.keys(project).length,
    archiveEntries: names,
    builderValues: captureBuilderValues(project),
    projectSettings: project,
  };
}

export function createDemoInspection(fileName = 'gearbox-demo.3mf'): ThreeMfInspection {
  return {
    kind: '3mf', fileName, fileSize: 18_420_000, slicer: 'Bambu Studio', printerProfile: 'Bambu Lab P1S 0.4 nozzle', printerModel: 'P1S', nozzleDiameter: '0.4', buildPlate: 'Textured PEI Plate', processProfile: '0.20mm Strength @BBL P1S',
    objectCount: 7, partCount: 9, plateCount: 1, archiveEntryCount: 24, hasThumbnail: true, projectSettingsCount: 542,
    filaments: [
      { index: 1, type: 'PCTG', vendor: 'Generic', color: '#202225', profile: 'Generic PCTG', maxVolumetricSpeed: '14', usedGrams: '82.4' },
      { index: 2, type: 'PLA', vendor: 'Bambu Lab', color: '#FFFFFF', profile: 'Bambu PLA Basic', maxVolumetricSpeed: '21', usedGrams: '0' },
    ],
    settings: [
      { key: 'layer_height', label: 'Layer height', value: '0.20 mm', tooltipKey: 'layerHeight' },
      { key: 'wall_loops', label: 'Wall loops', value: '4', tooltipKey: 'wallLoops' },
      { key: 'sparse_infill_density', label: 'Sparse infill density', value: '25%', tooltipKey: 'sparseInfillDensity' },
      { key: 'enable_support', label: 'Enable support', value: 'Enabled', tooltipKey: 'support' },
      { key: 'brim_width', label: 'Brim width', value: '5 mm', tooltipKey: 'brimWidth' },
      { key: 'max_volumetric_speed', label: 'Max volumetric speed', value: '14 mm³/s', tooltipKey: 'maxVolumetricSpeed' },
    ],
    notices: [{ id: 'demo-filament', severity: 'warning', titleKey: 'notices.unusedFilaments.title', detailKey: 'notices.unusedFilaments.detail', values: { count: 1 } }],
    dna: { quality: 72, speed: 48, flow: 47, support: 78, strength: 82, cooling: 68 }, score: 92, archiveEntries: [],
    builderValues: { layer_height: '0.2', wall_loops: '4', sparse_infill_density: '25', enable_support: '1', brim_width: '5', max_volumetric_speed: ['14', '21'], printer_profile: 'Bambu Lab P1S 0.4 nozzle', nozzle_diameter: ['0.4'], build_plate: 'Textured PEI Plate', process_profile: '0.20mm Strength @BBL P1S' },
    projectSettings: { printer_settings_id: 'Bambu Lab P1S 0.4 nozzle', printer_model: 'P1S', nozzle_diameter: ['0.4'], curr_bed_type: 'Textured PEI Plate', print_settings_id: '0.20mm Strength @BBL P1S', layer_height: '0.2', wall_loops: '4', sparse_infill_density: '25', enable_support: '1', brim_width: '5', filament_max_volumetric_speed: ['14', '21'] },
  };
}
