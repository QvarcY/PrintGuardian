import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Box, Check, CheckCircle2, ChevronRight, CircleAlert, Download,
  FileCheck2, FileCode2, FileUp2, Gauge, Layers3, LoaderCircle, PackageOpen,
  RotateCcw, Settings2, ShieldCheck, SlidersHorizontal, Trash2, X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SavedProfileBaseline } from '../lib/baselineProfile';
import { removeProfileBaseline, saveProfileBaseline } from '../lib/baselineProfile';
import { compareInspections, type ProfileDiffRow } from '../lib/profileDiff';
import {
  coerceManualBuilderValue,
  findExistingProjectSettingsKey,
  manualEditorFor,
} from '../lib/projectSettingsBridge';
import {
  createSafeThreeMfBuildPreview,
  type SafeBuildDecision,
} from '../lib/safeThreeMfBuildPreview';
import {
  buildVerifiedThreeMfExport,
  downloadThreeMf,
  exportEligibility,
  type SafeThreeMfExportVerification,
} from '../lib/safeThreeMfExporter';
import { inspectThreeMf, type ThreeMfInspection } from '../lib/threeMfInspector';
import {
  clearWorkspacePlan,
  loadWorkspacePlan,
  saveWorkspacePlan,
  workspacePlanContext,
  type WorkspaceChoice,
} from '../lib/workspacePlan';
import { ProfileDiffPanel } from './ProfileDiffPanel';
import './ProjectWorkspace.css';

type WorkspaceTab = 'overview' | 'printer' | 'material' | 'settings' | 'model' | 'advanced';
type TabIssue = { id: string; tab: Exclude<WorkspaceTab, 'overview' | 'advanced'>; rowKey?: string; impact: 'high' | 'medium' | 'low'; label: string };

type Copy = ReturnType<typeof workspaceCopy>;

function workspaceCopy(lv: boolean) {
  return lv ? {
    tabs: { overview: 'Pārskats', printer: 'Printeris', material: 'Materiāls', settings: 'Drukas iestatījumi', model: 'Modelis & Supports', advanced: 'Papildu' },
    currentProject: 'Pašreizējais projekts', profile: 'Mans drukas profils', history: 'Vēsture', appSettings: 'Iestatījumi', soon: 'Drīzumā',
    projectCheck: 'PROJEKTA PĀRBAUDE',
    goodTitle: 'Pamata pārbaudes izskatās labi',
    reviewTitle: 'Pirms drukāšanas ir lietas, ko pārbaudīt',
    criticalTitle: 'Atrasta būtiska problēma pirms drukāšanas',
    noProfileTitle: 'Fails ir nolasīts. Savu drukas profilu vari pievienot salīdzināšanai.',
    goodText: 'PrintGuardian nav atradis acīmredzamu problēmu pašlaik atbalstītajās pārbaudēs. Tas vēl nav pilns geometry/G-code audits.',
    reviewText: (count: number) => `${count} neatrisināti uzmanības punkti ir sadalīti pa zemāk esošajiem tabiem. Iestatījuma badge pazūd tikai pēc reālas izmaiņas; strukturāls brīdinājums paliek, kamēr nemainās pats fails.`,
    identity: 'Projekta identitāte', attention: 'Kam pievērst uzmanību', noAttention: 'Pašlaik nav neatrisinātu uzmanības punktu atbalstītajās pārbaudēs.',
    openTab: 'Atvērt sadaļu',
    profileTitle: 'Ko nozīmē “Mans drukas profils”?',
    profileExplain: 'Tas ir lokāls atskaites profils, ko PrintGuardian izveido no tava uzticama 3MF. Tas palīdz salīdzināt svešu projektu ar tavu printeri un ierastajiem iestatījumiem. Tas nav “drošības sertifikāts” un nav obligāts faila analīzei.',
    profileSet: 'Iestatīt manu drukas profilu', profileReplace: 'Atjaunināt aktīvo profilu', profileRemove: 'Dzēst aktīvo profilu', profileManage: 'Pārvaldīt profilus', profileLoading: 'Nolasa profilu…',
    profileFrom: 'Izveidots no', profileNone: 'Nav iestatīts — PrintGuardian joprojām analizēs pašu projektu.', profileRemoveConfirm: 'Dzēst saglabāto drukas profilu?',
    profileError: 'Drukas profilu neizdevās saglabāt.',
    printerTitle: 'Printera saderība', printerSub: 'Svarīgākie printera, nozzle un build plate dati vienuviet.',
    materialTitle: 'Materiāls un plūsma', materialSub: 'Filamentu profili, izmantotie materiāli un ar plūsmu saistītie parametri.',
    settingsTitle: 'Drukas iestatījumi', settingsSub: 'Maini atbalstītos parametrus turpat, kur redzi to nozīmi un ietekmi.',
    modelTitle: 'Modelis, supports un saķere', modelSub: 'Modeļa struktūra un parametri, kas ietekmē supportus un pirmā slāņa stabilitāti.',
    advancedTitle: 'Papildu diagnostika', advancedSub: 'Tehniskie rīki un Profile Diff tiem, kas vēlas iedziļināties.',
    current: 'Šajā projektā', mine: 'Manā profilā', same: 'Sakrīt', differs: 'Atšķiras', attentionNeeded: 'Jāpārbauda', resolved: 'Mainīts',
    useMine: 'Izmantot mana profila vērtību', cannotUseMine: 'Šo vērtību pagaidām nevar droši pārrakstīt automātiski.',
    manual: 'Manuāli', apply: 'Pielietot', manualUnsupported: 'Manuāla maiņa šim laukam vēl nav droši atbalstīta.',
    why: 'Ko tas ietekmē', high: 'Augsta ietekme', medium: 'Vidēja ietekme', low: 'Zema ietekme',
    highRiskTitle: 'Šī ir augstas ietekmes manuāla izmaiņa',
    highRiskText: 'Nepareiza vērtība var būtiski ietekmēt drukas rezultātu vai saderību. PrintGuardian pārbaudīs formātu un diapazonu, bet nevar zināt tavu konkrēto mehānisko vai materiāla situāciju.',
    understand: 'Es saprotu, ka manuāli mainu augstas ietekmes parametru.', cancel: 'Atcelt', confirm: 'Pielietot izmaiņu',
    changePrepared: (n: number) => `${n} ${n === 1 ? 'izmaiņa sagatavota' : 'izmaiņas sagatavotas'}`,
    unresolved: (n: number) => `${n} ${n === 1 ? 'uzmanības punkts neatrisināts' : 'uzmanības punkti neatrisināti'}`,
    reviewChanges: 'Pārskatīt izmaiņas', export: 'Izveidot jaunu 3MF', exporting: 'Pārbūvē un pārbauda…', reset: 'Atcelt izmaiņas',
    exportNoChanges: 'Vispirms sagatavo vismaz vienu atbalstītu izmaiņu.', exportCritical: 'Vispirms jāatrisina augstas ietekmes saderības jautājumi.',
    exportTechnical: 'Šo izmaiņu kopu vēl nevar droši eksportēt.', changesTitle: 'Sagatavotās izmaiņas', changesEmpty: 'Pašlaik nav sagatavotu izmaiņu.', before: 'Pirms', after: 'Pēc', sourceProfile: 'MANS PROFILS', sourceManual: 'MANUĀLI',
    exportVerified: 'Jaunā 3MF kopija pārbaudīta', exportVerifiedText: 'Arhīva struktūra un pieprasītās izmaiņas tika pārbaudītas pirms faila saglabāšanas.', exportFailed: 'Jauno 3MF neizdevās droši izveidot.',
    objects: 'Objekti', parts: 'Detaļas', plates: 'Plates', thumbnail: 'Preview image', archive: '3MF arhīva ieraksti',
    noFilaments: 'Filamenta profila dati failā nav atrasti.', profileDiffHint: 'Profile Diff ir papildu tehniskais rīks. Ikdienas darbam izmanto augšējos tabus.',
    auditNote: 'Pilns geometry/G-code drošības audits vēl nav pieejams šajā versijā.',
    fileFinding: 'Faila pārbaudes atradne', validationError: 'Ievadītā vērtība nav derīga šim parametram vai atļautajam diapazonam.',
  } : {
    tabs: { overview: 'Overview', printer: 'Printer', material: 'Material', settings: 'Print settings', model: 'Model & Supports', advanced: 'Advanced' },
    currentProject: 'Current project', profile: 'My print profile', history: 'History', appSettings: 'Settings', soon: 'Soon',
    projectCheck: 'PROJECT CHECK', goodTitle: 'Basic checks look good', reviewTitle: 'Review a few things before printing', criticalTitle: 'A significant issue was found before printing',
    noProfileTitle: 'The file is readable. You can add your print profile for comparison.',
    goodText: 'PrintGuardian found no obvious issue in the checks currently supported. This is not yet a full geometry/G-code audit.',
    reviewText: (count: number) => `${count} unresolved attention points are grouped into the tabs below. A setting badge clears only after a real change; structural warnings remain until the file state changes.`,
    identity: 'Project identity', attention: 'Needs attention', noAttention: 'There are no unresolved attention points in the checks currently supported.', openTab: 'Open section',
    profileTitle: 'What is “My print profile”?', profileExplain: 'It is a local reference profile created from one of your trusted 3MF files. PrintGuardian uses it to compare another project with your printer and normal settings. It is not a safety certificate and is not required for file analysis.',
    profileSet: 'Set up my print profile', profileReplace: 'Update active profile', profileRemove: 'Remove active profile', profileManage: 'Manage profiles', profileLoading: 'Reading profile…', profileFrom: 'Created from', profileNone: 'Not set — PrintGuardian will still analyze the project itself.', profileRemoveConfirm: 'Remove the saved print profile?', profileError: 'The print profile could not be saved.',
    printerTitle: 'Printer compatibility', printerSub: 'Printer, nozzle and build-plate information in one place.', materialTitle: 'Material and flow', materialSub: 'Filament profiles, materials and flow-related parameters.', settingsTitle: 'Print settings', settingsSub: 'Edit supported values where you can also see what they do and why they matter.', modelTitle: 'Model, supports and adhesion', modelSub: 'Model structure and settings that affect supports and first-layer stability.', advancedTitle: 'Advanced diagnostics', advancedSub: 'Technical tools and Profile Diff for users who want to go deeper.',
    current: 'In this project', mine: 'In my profile', same: 'Matches', differs: 'Differs', attentionNeeded: 'Review', resolved: 'Changed', useMine: 'Use my profile value', cannotUseMine: 'This value cannot yet be rewritten automatically with enough confidence.', manual: 'Manual', apply: 'Apply', manualUnsupported: 'Manual editing is not safely supported for this field yet.', why: 'What it affects', high: 'High impact', medium: 'Medium impact', low: 'Low impact',
    highRiskTitle: 'This is a high-impact manual change', highRiskText: 'An incorrect value can materially affect print behaviour or compatibility. PrintGuardian validates format and range, but cannot know every mechanical or material constraint in your setup.', understand: 'I understand that I am manually changing a high-impact parameter.', cancel: 'Cancel', confirm: 'Apply change',
    changePrepared: (n: number) => `${n} change${n === 1 ? '' : 's'} prepared`, unresolved: (n: number) => `${n} attention point${n === 1 ? '' : 's'} unresolved`, reviewChanges: 'Review changes', export: 'Create new 3MF', exporting: 'Rebuilding and verifying…', reset: 'Reset changes', exportNoChanges: 'Prepare at least one supported change first.', exportCritical: 'Resolve high-impact compatibility issues first.', exportTechnical: 'This set of changes cannot yet be exported safely.', changesTitle: 'Prepared changes', changesEmpty: 'No changes are currently prepared.', before: 'Before', after: 'After', sourceProfile: 'MY PROFILE', sourceManual: 'MANUAL', exportVerified: 'New 3MF copy verified', exportVerifiedText: 'Archive structure and requested changes were verified before saving the file.', exportFailed: 'The new 3MF could not be created safely.',
    objects: 'Objects', parts: 'Parts', plates: 'Plates', thumbnail: 'Preview image', archive: '3MF archive entries', noFilaments: 'No filament-profile data was found in the file.', profileDiffHint: 'Profile Diff is an advanced technical tool. Use the tabs above for normal day-to-day work.', auditNote: 'Full geometry/G-code safety auditing is not available in this version yet.',
    fileFinding: 'File inspection finding', validationError: 'The entered value is not valid for this setting or its supported range.',
  };
}

const effectKeys: Record<string, { lv: string; en: string }> = {
  printer_profile: { lv: 'Printer profile var saturēt darba laukuma, ātrumu, paātrinājumu un start/end G-code konfigurāciju.', en: 'Printer profile can contain build-volume, speed, acceleration and start/end G-code configuration.' },
  nozzle_diameter: { lv: 'Nozzle diameter ietekmē derīgu Layer height, line width, plūsmu un detaļu smalkumu.', en: 'Nozzle diameter affects valid Layer height, line width, flow and printable detail.' },
  build_plate: { lv: 'Build plate izvēle var mainīt pirmā slāņa temperatūru, saķeri un starta procedūru.', en: 'Build plate selection can change first-layer temperature, adhesion and startup behaviour.' },
  process_profile: { lv: 'Process profile apvieno vairākus slicer iestatījumus; svarīgāk ir pārbaudīt konkrētās vērtības.', en: 'Process profile groups many slicer settings; the concrete values matter more than the profile name alone.' },
  layer_height: { lv: 'Layer height ietekmē detaļu smalkumu, virsmas kvalitāti un drukas laiku.', en: 'Layer height affects detail, surface quality and print time.' },
  wall_loops: { lv: 'Wall loops ietekmē sienu biezumu, izturību, materiāla patēriņu un drukas laiku.', en: 'Wall loops affects wall thickness, strength, material use and print time.' },
  sparse_infill_density: { lv: 'Sparse infill density maina iekšējā pildījuma daudzumu, stingrību, svaru un drukas laiku.', en: 'Sparse infill density changes internal structure, stiffness, weight and print time.' },
  enable_support: { lv: 'Enable support nosaka, vai sliceris ģenerēs support struktūras pārkarēm un sarežģītām vietām.', en: 'Enable support controls whether the slicer creates support structures for overhangs and difficult geometry.' },
  brim_width: { lv: 'Brim width palīdz pirmajam slānim turēties pie plates un stabilizē šauras vai augstas detaļas.', en: 'Brim width helps the first layer stay attached and stabilizes narrow or tall parts.' },
  max_volumetric_speed: { lv: 'Max volumetric speed ierobežo filamenta plūsmu caur hotend; pārāk liela vērtība var radīt under-extrusion.', en: 'Max volumetric speed limits filament flow through the hotend; too high can cause under-extrusion.' },
};

const rowTab: Record<string, Exclude<WorkspaceTab, 'overview' | 'advanced'>> = {
  printer_profile: 'printer', nozzle_diameter: 'printer', build_plate: 'printer',
  process_profile: 'settings', layer_height: 'settings', wall_loops: 'settings', sparse_infill_density: 'settings',
  max_volumetric_speed: 'material', enable_support: 'model', brim_width: 'model',
};

function canonicalKey(row: ProfileDiffRow): string { return row.settingKey ?? row.key; }

const intrinsicImpact: Record<string, 'high' | 'medium' | 'low'> = {
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

function impactForRow(row: ProfileDiffRow): 'high' | 'medium' | 'low' {
  return intrinsicImpact[canonicalKey(row)] ?? (row.impact === 'none' ? 'low' : row.impact);
}
function currentRaw(inspection: ThreeMfInspection, row: ProfileDiffRow): unknown {
  const key = findExistingProjectSettingsKey(inspection.projectSettings ?? {}, canonicalKey(row));
  return key ? inspection.projectSettings?.[key] : undefined;
}
function sameRaw(a: unknown, b: unknown): boolean { return JSON.stringify(a) === JSON.stringify(b); }
function displayRaw(value: unknown, row: ProfileDiffRow): string {
  const key = canonicalKey(row);
  if (key === 'enable_support') {
    const enabled = value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
    return enabled ? 'Enabled' : 'Disabled';
  }
  const scalar = Array.isArray(value) ? value.join(', ') : String(value ?? '—').trim();
  if (scalar === '—') return scalar;
  if (key === 'layer_height' || key === 'brim_width') return /\bmm\s*$/i.test(scalar) ? scalar : `${scalar} mm`;
  if (key === 'sparse_infill_density') return /%\s*$/.test(scalar) ? scalar : `${scalar}%`;
  if (key === 'max_volumetric_speed') return /mm(?:³|\^3)?\s*\/\s*s\s*$/i.test(scalar) ? scalar : `${scalar} mm³/s`;
  return scalar;
}

function tabForNotice(id: string): Exclude<WorkspaceTab, 'overview' | 'advanced'> {
  if (id === 'missing-project-settings') return 'settings';
  if (id === 'many-filaments' || id === 'demo-filament') return 'material';
  if (id === 'no-objects') return 'model';
  if (id === 'high-layer-height' || id === 'one-wall') return 'settings';
  return 'model';
}
function noticeRowKey(id: string): string | undefined {
  if (id === 'high-layer-height') return 'setting:layer_height';
  if (id === 'one-wall') return 'setting:wall_loops';
  return undefined;
}

function SettingCard({ row, inspection, profile, choice, manualValue, onChooseProfile, onApplyManual, text, lv }:{
  row: ProfileDiffRow; inspection: ThreeMfInspection; profile: SavedProfileBaseline | null; choice: WorkspaceChoice; manualValue?: unknown;
  onChooseProfile: () => void; onApplyManual: (raw: unknown, display: string) => void; text: Copy; lv: boolean;
}) {
  const editor = manualEditorFor(canonicalKey(row));
  const [manualError, setManualError] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => {
    const raw = manualValue ?? currentRaw(inspection, row);
    const numeric = Array.isArray(raw) ? raw[0] : raw;
    if (canonicalKey(row) === 'enable_support') return (raw === true || raw === 1 || raw === '1' || String(raw).toLowerCase() === 'true') ? 'true' : 'false';
    return String(numeric ?? '').replace(/[^0-9+-.]/g, '');
  });

  useEffect(() => {
    if (choice !== 'manual') return;
    const raw = manualValue;
    if (canonicalKey(row) === 'enable_support') setDraft((raw === true || raw === 1 || raw === '1' || String(raw).toLowerCase() === 'true') ? 'true' : 'false');
    else if (raw != null) setDraft(String(Array.isArray(raw) ? raw[0] : raw));
  }, [choice, manualValue, row.key]);

  const canUseProfile = useMemo(() => {
    if (!profile || row.status === 'same' || !row.compareValue) return false;
    const preview = createSafeThreeMfBuildPreview(inspection, profile.profile, [row], { [row.key]: 'baseline' });
    return preview.readyCount === 1 && preview.blockedCount === 0 && preview.unresolvedCount === 0;
  }, [inspection, profile, row]);

  const apply = () => {
    if (!inspection.projectSettings || !editor) return;
    const logical: number | boolean = editor.kind === 'boolean' ? draft === 'true' : Number(draft);
    const coerced = coerceManualBuilderValue(inspection.projectSettings, canonicalKey(row), logical);
    if (!coerced.ok) { setManualError(text.validationError); return; }
    setManualError(null);
    onApplyManual(coerced.rawValue, displayRaw(coerced.rawValue, row));
  };

  const changed = choice !== 'project';
  const impact = impactForRow(row);
  const effect = effectKeys[canonicalKey(row)];
  return (
    <article className={`workspace-setting-card glass-panel${changed ? ' changed' : ''}${impact === 'high' && row.status !== 'same' ? ' high-attention' : ''}`}>
      <div className="workspace-setting-head">
        <div>
          <div className="workspace-setting-title"><strong>{row.label}</strong>{row.status !== 'same' && <span className={`workspace-state ${changed ? 'resolved' : 'attention'}`}>{changed ? text.resolved : text.attentionNeeded}</span>}</div>
          {effect && <p><b>{text.why}:</b> {lv ? effect.lv : effect.en}</p>}
        </div>
        <span className={`impact-badge ${impact}`}>{impact === 'high' ? text.high : impact === 'medium' ? text.medium : text.low}</span>
      </div>

      <div className="workspace-value-grid">
        <div className={`workspace-value-card${choice === 'project' ? ' selected' : ''}`}>
          <span>{text.current}</span><strong>{row.baseValue || '—'}</strong>
        </div>
        {profile && <button className={`workspace-value-card profile${choice === 'profile' ? ' selected' : ''}`} disabled={!canUseProfile} onClick={onChooseProfile} title={!canUseProfile ? text.cannotUseMine : undefined}>
          <span>{text.mine}</span><strong>{row.compareValue || '—'}</strong><small>{row.status === 'same' ? text.same : canUseProfile ? text.useMine : text.cannotUseMine}</small>
        </button>}
      </div>

      <div className="manual-editor">
        <div className="manual-editor-label"><SlidersHorizontal size={14}/><span>{text.manual}</span></div>
        {!editor ? <span className="manual-unsupported">{text.manualUnsupported}</span> : editor.kind === 'boolean' ? (
          <div className="boolean-editor">
            <button className={draft === 'true' ? 'selected' : ''} onClick={() => setDraft('true')}>Enabled</button>
            <button className={draft === 'false' ? 'selected' : ''} onClick={() => setDraft('false')}>Disabled</button>
            <button className="primary" onClick={apply}>{text.apply}</button>
          </div>
        ) : (
          <div className="numeric-editor">
            <button onClick={() => setDraft(String(Math.max(editor.min ?? -Infinity, (Number(draft) || 0) - (editor.step ?? 1))))}>−</button>
            <div className="numeric-input-wrap"><input inputMode="decimal" value={draft} onChange={(event) => setDraft(event.target.value.replace(',', '.'))}/><span>{editor.unit || ''}</span></div>
            <button onClick={() => setDraft(String(Math.min(editor.max ?? Infinity, (Number(draft) || 0) + (editor.step ?? 1))))}>+</button>
            <button className="primary" onClick={apply}>{text.apply}</button>
          </div>
        )}
        {manualError && <div className="manual-validation-error"><AlertTriangle size={13}/><span>{manualError}</span></div>}
      </div>
    </article>
  );
}

export function ProjectWorkspace({ inspection, profile, profileName, onProfileChange, onManageProfiles }:{ inspection: ThreeMfInspection; profile: SavedProfileBaseline | null; profileName?: string; onProfileChange: (profile: SavedProfileBaseline | null) => void; onManageProfiles: () => void }) {
  const { i18n, t } = useTranslation();
  const lv = i18n.language.startsWith('lv');
  const text = workspaceCopy(lv);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<WorkspaceTab>('overview');
  const context = workspacePlanContext(inspection, profile);
  const restored = useMemo(() => loadWorkspacePlan(inspection, profile), [context]);
  const [choices, setChoices] = useState<Record<string, WorkspaceChoice>>(() => restored?.choices ?? {});
  const [manualValues, setManualValues] = useState<Record<string, unknown>>(() => restored?.manualValues ?? {});
  const [pendingRisk, setPendingRisk] = useState<{ row: ProfileDiffRow; raw: unknown; display: string } | null>(null);
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [verification, setVerification] = useState<SafeThreeMfExportVerification | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadWorkspacePlan(inspection, profile);
    setChoices(saved?.choices ?? {});
    setManualValues(saved?.manualValues ?? {});
    setVerification(null);
    setExportError(null);
  }, [context]);

  const comparison = useMemo(() => compareInspections(inspection, profile?.profile ?? inspection), [inspection, profile]);
  const rows = comparison.rows;
  const rowByKey = useMemo(() => new Map(rows.map((row) => [row.key, row])), [rows]);
  const buildDecisions = useMemo(() => Object.fromEntries(rows.map((row) => {
    const choice = choices[row.key] ?? 'project';
    const decision: SafeBuildDecision = choice === 'profile' ? 'baseline' : choice === 'manual' ? 'manual' : 'project';
    return [row.key, decision];
  })), [rows, choices]);
  const preview = useMemo(() => createSafeThreeMfBuildPreview(inspection, profile?.profile ?? inspection, rows, buildDecisions, manualValues), [inspection, profile, rows, buildDecisions, manualValues]);
  const eligibility = useMemo(() => exportEligibility(inspection, preview), [inspection, preview]);

  const isRowChanged = (rowKey?: string) => {
    if (!rowKey) return false;
    const mutation = preview.mutations.find((item) => item.rowKey === rowKey);
    return mutation?.status === 'ready' && !sameRaw(mutation.before, mutation.after);
  };

  const issues = useMemo<TabIssue[]>(() => {
    const result: TabIssue[] = [];
    if (profile) {
      for (const row of rows.filter((item) => item.status !== 'same' && impactForRow(item) === 'high')) {
        const target = rowTab[canonicalKey(row)];
        if (target) result.push({ id: `diff:${row.key}`, tab: target, rowKey: row.key, impact: 'high', label: row.label });
      }
    }
    for (const notice of inspection.notices) {
      const impact = notice.severity === 'critical' ? 'high' : 'medium';
      result.push({ id: `notice:${notice.id}`, tab: tabForNotice(notice.id), rowKey: noticeRowKey(notice.id), impact, label: notice.id });
    }
    const unique = new Map<string, TabIssue>();
    for (const issue of result) unique.set(issue.rowKey ? `row:${issue.rowKey}` : issue.id, issue);
    return [...unique.values()];
  }, [inspection.notices, profile, rows]);

  const unresolvedIssues = issues.filter((issue) => !isRowChanged(issue.rowKey));
  const issueCounts = (['printer','material','settings','model'] as const).reduce<Record<string, number>>((acc, key) => {
    acc[key] = unresolvedIssues.filter((issue) => issue.tab === key).length;
    return acc;
  }, {});
  const highUnresolved = unresolvedIssues.filter((issue) => issue.impact === 'high').length;
  const prepared = preview.mutations.filter((mutation) => mutation.status === 'ready' && !sameRaw(mutation.before, mutation.after));

  const persist = (nextChoices: Record<string, WorkspaceChoice>, nextManual = manualValues) => {
    setChoices(nextChoices);
    setManualValues(nextManual);
    saveWorkspacePlan(inspection, profile, nextChoices, nextManual);
    setVerification(null);
    setExportError(null);
  };

  const chooseProfile = (row: ProfileDiffRow) => persist({ ...choices, [row.key]: 'profile' });
  const commitManual = (row: ProfileDiffRow, raw: unknown, display: string) => {
    const source = currentRaw(inspection, row);
    if (sameRaw(source, raw)) {
      const nextChoices = { ...choices }; delete nextChoices[row.key];
      const nextManual = { ...manualValues }; delete nextManual[row.key];
      persist(nextChoices, nextManual); return;
    }
    if (impactForRow(row) === 'high') {
      setPendingRisk({ row, raw, display }); setRiskAccepted(false); return;
    }
    persist({ ...choices, [row.key]: 'manual' }, { ...manualValues, [row.key]: raw });
  };
  const confirmRisk = () => {
    if (!pendingRisk || !riskAccepted) return;
    persist({ ...choices, [pendingRisk.row.key]: 'manual' }, { ...manualValues, [pendingRisk.row.key]: pendingRisk.raw });
    setPendingRisk(null); setRiskAccepted(false);
  };

  const resetChanges = () => { clearWorkspacePlan(); setChoices({}); setManualValues({}); setVerification(null); setExportError(null); };

  const loadProfile = async (file?: File) => {
    if (!file) return;
    setLoadingProfile(true); setProfileError(null);
    try {
      const inspected = await inspectThreeMf(file);
      const saved = saveProfileBaseline(inspected);
      if (!saved) throw new Error(text.profileError);
      clearWorkspacePlan(); setChoices({}); setManualValues({}); onProfileChange(saved);
    } catch (reason) { console.error(reason); setProfileError(reason instanceof Error ? reason.message : text.profileError); }
    finally { setLoadingProfile(false); if (inputRef.current) inputRef.current.value = ''; }
  };
  const removeProfile = () => {
    if (!profile || !window.confirm(text.profileRemoveConfirm)) return;
    if (!removeProfileBaseline()) return;
    clearWorkspacePlan(); setChoices({}); setManualValues({}); onProfileChange(null);
  };

  const exportBlockedReason = prepared.length === 0 ? text.exportNoChanges : highUnresolved > 0 ? text.exportCritical : !eligibility.ok ? text.exportTechnical : undefined;
  const runExport = async () => {
    if (exportBlockedReason || exporting) return;
    setExporting(true); setVerification(null); setExportError(null);
    try {
      const result = await buildVerifiedThreeMfExport(inspection, preview);
      setVerification(result.verification); downloadThreeMf(result.file);
    } catch (reason) { console.error(reason); setExportError(reason instanceof Error ? reason.message : text.exportFailed); }
    finally { setExporting(false); }
  };

  const tabs: Array<{key:WorkspaceTab; icon:typeof ShieldCheck}> = [
    {key:'overview',icon:ShieldCheck},{key:'printer',icon:Gauge},{key:'material',icon:Layers3},{key:'settings',icon:SlidersHorizontal},{key:'model',icon:Box},{key:'advanced',icon:Settings2},
  ];
  const rowsFor = (keys: string[]) => rows.filter((row) => keys.includes(canonicalKey(row)));

  const noticesFor = (target: Exclude<WorkspaceTab, 'overview' | 'advanced'>) => inspection.notices.filter((notice) => tabForNotice(notice.id) === target && !noticeRowKey(notice.id));
  const noticeCards = (target: Exclude<WorkspaceTab, 'overview' | 'advanced'>) => {
    const notices = noticesFor(target);
    if (!notices.length) return null;
    return <div className="workspace-notice-list">{notices.map((notice) => <article className={`workspace-notice glass-panel ${notice.severity}`} key={notice.id}>
      <span className="workspace-notice-icon">{notice.severity === 'critical' ? <AlertTriangle size={18}/> : <CircleAlert size={18}/>}</span>
      <div><small>{text.fileFinding}</small><strong>{t(notice.titleKey, notice.values)}</strong><p>{t(notice.detailKey, notice.values)}</p></div>
    </article>)}</div>;
  };

  const settingCards = (selectedRows: ProfileDiffRow[]) => <div className="workspace-settings-grid">{selectedRows.map((row) => (
    <SettingCard key={row.key} row={row} inspection={inspection} profile={profile} choice={choices[row.key] ?? 'project'} manualValue={manualValues[row.key]}
      onChooseProfile={() => chooseProfile(row)} onApplyManual={(raw,display) => commitManual(row,raw,display)} text={text} lv={lv}/>
  ))}</div>;

  const titleForTab = (key: WorkspaceTab) => text.tabs[key];
  const verdictTone = inspection.notices.some((notice) => notice.severity === 'critical') ? 'critical' : unresolvedIssues.length ? 'review' : 'good';

  return <section className="project-workspace">
    <div className="workspace-tabs glass-panel" role="tablist">
      {tabs.map(({key,icon:Icon}) => {
        const count = key === 'overview' ? unresolvedIssues.length : issueCounts[key] ?? 0;
        return <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)} role="tab" aria-selected={tab === key}>
          <Icon size={16}/><span>{titleForTab(key)}</span>{count > 0 && <b className="attention-bubble">{count}</b>}
        </button>;
      })}
    </div>

    {tab === 'overview' && <div className="workspace-tab-page">
      <section className={`workspace-verdict glass-panel ${verdictTone}`}>
        <div className="workspace-verdict-icon">{verdictTone === 'good' ? <CheckCircle2 size={28}/> : <AlertTriangle size={28}/>}</div>
        <div><span className="eyebrow">{text.projectCheck}</span><h1>{verdictTone === 'critical' ? text.criticalTitle : unresolvedIssues.length ? text.reviewTitle : profile ? text.goodTitle : text.noProfileTitle}</h1><p>{unresolvedIssues.length ? text.reviewText(unresolvedIssues.length) : text.goodText}</p></div>
        {unresolvedIssues.length > 0 && <button className="primary" onClick={() => setTab(unresolvedIssues[0].tab)}>{text.openTab}<ChevronRight size={15}/></button>}
      </section>

      <div className="overview-two-column">
        <section className="overview-card glass-panel"><span className="eyebrow">{text.identity}</span><div className="identity-grid">
          <Identity label="Printer profile" value={inspection.printerProfile || inspection.printerModel || '—'}/><Identity label="Nozzle diameter" value={inspection.nozzleDiameter ? `${inspection.nozzleDiameter} mm` : '—'}/><Identity label="Build plate" value={inspection.buildPlate || '—'}/><Identity label="Process profile" value={inspection.processProfile || '—'}/><Identity label="Filament" value={inspection.filaments.map((f)=>f.type).filter(Boolean).join(', ') || '—'}/><Identity label="Geometry" value={`${inspection.objectCount} ${text.objects.toLowerCase()} · ${inspection.plateCount} ${text.plates.toLowerCase()}`}/>
        </div></section>
        <section className="overview-card profile-explainer glass-panel"><div className="profile-explainer-head"><div><span className="eyebrow">{text.profile}</span><h2>{text.profileTitle}</h2></div>{profile && <CheckCircle2 size={20}/>}</div><p>{text.profileExplain}</p>
          {profile ? <div className="profile-current"><div><strong>{profileName || profile.profile.printerProfile || profile.profile.printerModel || profile.sourceFileName}</strong><span>{[profile.profile.printerProfile || profile.profile.printerModel, profile.profile.nozzleDiameter ? `${profile.profile.nozzleDiameter} mm nozzle` : '', profile.profile.processProfile].filter(Boolean).join(' · ')}</span><small>{text.profileFrom}: {profile.sourceFileName}</small></div><div><button className="ghost profile-manage" onClick={onManageProfiles}><Settings2 size={14}/>{text.profileManage}</button><button className="ghost" onClick={()=>inputRef.current?.click()}><FileUp2 size={14}/>{text.profileReplace}</button><button className="ghost danger" onClick={removeProfile}><Trash2 size={14}/>{text.profileRemove}</button></div></div>
          : <div className="profile-empty"><span>{text.profileNone}</span><div className="profile-empty-actions"><button className="ghost" onClick={onManageProfiles}><Settings2 size={14}/>{text.profileManage}</button><button className="primary" disabled={loadingProfile} onClick={()=>inputRef.current?.click()}>{loadingProfile?<LoaderCircle className="spin" size={14}/>:<FileUp2 size={14}/>} {loadingProfile?text.profileLoading:text.profileSet}</button></div></div>}
          {profileError && <div className="workspace-error">{profileError}</div>}<input ref={inputRef} hidden type="file" accept=".3mf" onChange={(e)=>loadProfile(e.target.files?.[0])}/>
        </section>
      </div>

      <section className="attention-overview"><div className="section-heading"><div><span className="eyebrow"><CircleAlert size={14}/>{text.attention}</span><h2>{unresolvedIssues.length ? text.reviewTitle : text.noAttention}</h2></div></div>
        {unresolvedIssues.length > 0 && <div className="attention-cards">{(['printer','material','settings','model'] as const).filter(k=>issueCounts[k]>0).map((key)=><button key={key} onClick={()=>setTab(key)} className="attention-card glass-panel"><span>{text.tabs[key]}</span><strong>{issueCounts[key]}</strong><ChevronRight size={16}/></button>)}</div>}
      </section>
      <div className="audit-note"><ShieldCheck size={14}/>{text.auditNote}</div>
    </div>}

    {tab === 'printer' && <div className="workspace-tab-page"><PageHeading title={text.printerTitle} sub={text.printerSub} count={issueCounts.printer}/>{noticeCards('printer')}{settingCards(rowsFor(['printer_profile','nozzle_diameter','build_plate']))}</div>}

    {tab === 'material' && <div className="workspace-tab-page"><PageHeading title={text.materialTitle} sub={text.materialSub} count={issueCounts.material}/>
      {noticeCards('material')}
      <div className="filament-workspace-grid">{inspection.filaments.length ? inspection.filaments.map((f)=><article className="filament-workspace-card glass-panel" key={f.index}><span className="filament-swatch" style={{background:f.color||'rgba(255,255,255,.16)'}}/><div><strong>F{f.index} · {f.type}</strong><span>{[f.vendor,f.profile].filter(Boolean).join(' · ')||'—'}</span><small>{f.usedGrams ? `${f.usedGrams} g` : '—'} · {f.maxVolumetricSpeed ? `${f.maxVolumetricSpeed} mm³/s` : '—'}</small></div></article>) : <div className="workspace-empty glass-panel">{text.noFilaments}</div>}</div>
      {settingCards(rowsFor(['max_volumetric_speed']))}
    </div>}

    {tab === 'settings' && <div className="workspace-tab-page"><PageHeading title={text.settingsTitle} sub={text.settingsSub} count={issueCounts.settings}/>{noticeCards('settings')}{settingCards(rowsFor(['process_profile','layer_height','wall_loops','sparse_infill_density']))}</div>}

    {tab === 'model' && <div className="workspace-tab-page"><PageHeading title={text.modelTitle} sub={text.modelSub} count={issueCounts.model}/>
      {noticeCards('model')}
      <div className="model-facts-row"><Metric icon={Box} label={text.objects} value={inspection.objectCount}/><Metric icon={PackageOpen} label={text.parts} value={inspection.partCount}/><Metric icon={Layers3} label={text.plates} value={inspection.plateCount}/><Metric icon={FileCode2} label={text.archive} value={inspection.archiveEntryCount}/></div>
      {settingCards(rowsFor(['enable_support','brim_width']))}
    </div>}

    {tab === 'advanced' && <div className="workspace-tab-page"><PageHeading title={text.advancedTitle} sub={text.advancedSub}/><div className="advanced-hint glass-panel"><Settings2 size={18}/><span>{text.profileDiffHint}</span></div><ProfileDiffPanel inspection={inspection}/></div>}

    <div className="workspace-sticky-bar">
      <div className="sticky-status"><strong>{text.changePrepared(prepared.length)}</strong><span className={highUnresolved ? 'danger' : ''}>{text.unresolved(unresolvedIssues.length)}</span></div>
      <div className="sticky-actions">{prepared.length>0&&<button className="ghost" onClick={resetChanges}><RotateCcw size={14}/>{text.reset}</button>}<button className="ghost" onClick={()=>setShowChanges(true)} disabled={prepared.length===0}><FileCheck2 size={14}/>{text.reviewChanges}</button><button className="primary" onClick={runExport} disabled={Boolean(exportBlockedReason)||exporting} title={exportBlockedReason}>{exporting?<LoaderCircle className="spin" size={14}/>:<Download size={14}/>} {exporting?text.exporting:text.export}</button></div>
    </div>

    {verification && <div className="workspace-toast success"><FileCheck2 size={18}/><div><strong>{text.exportVerified}</strong><span>{text.exportVerifiedText}</span></div><button onClick={()=>setVerification(null)}><X size={14}/></button></div>}
    {exportError && <div className="workspace-toast error"><AlertTriangle size={18}/><div><strong>{text.exportFailed}</strong><span>{exportError}</span></div><button onClick={()=>setExportError(null)}><X size={14}/></button></div>}

    {showChanges && <div className="workspace-modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)setShowChanges(false)}}><section className="workspace-modal changes-modal"><div className="modal-head"><div><span className="eyebrow"><FileCheck2 size={14}/>{text.changesTitle}</span><h2>{text.changesTitle}</h2></div><button onClick={()=>setShowChanges(false)}><X size={18}/></button></div>{prepared.length===0?<p>{text.changesEmpty}</p>:<div className="changes-list">{prepared.map((m)=><article key={m.rowKey}><div><strong>{m.label}</strong><span>{choices[m.rowKey]==='manual'?text.sourceManual:text.sourceProfile}</span></div><code>{text.before}: {displayRaw(m.before,rowByKey.get(m.rowKey)!)} → {text.after}: {displayRaw(m.after,rowByKey.get(m.rowKey)!)}</code></article>)}</div>}</section></div>}

    {pendingRisk && <div className="workspace-modal-backdrop"><section className="workspace-modal risk-modal"><div className="risk-icon"><AlertTriangle size={24}/></div><h2>{text.highRiskTitle}</h2><p>{text.highRiskText}</p><div className="risk-change"><span>{pendingRisk.row.label}</span><strong>{pendingRisk.row.baseValue||'—'} <ChevronRight size={14}/> {pendingRisk.display}</strong></div><label className="risk-check"><input type="checkbox" checked={riskAccepted} onChange={(e)=>setRiskAccepted(e.target.checked)}/><span>{text.understand}</span></label><div className="modal-actions"><button className="ghost" onClick={()=>setPendingRisk(null)}>{text.cancel}</button><button className="primary" disabled={!riskAccepted} onClick={confirmRisk}>{text.confirm}</button></div></section></div>}
  </section>;
}

function PageHeading({title,sub,count}:{title:string;sub:string;count?:number}) { return <div className="workspace-page-heading"><div><h1>{title}</h1><p>{sub}</p></div>{count ? <span className="page-attention"><AlertTriangle size={14}/>{count}</span> : <span className="page-ok"><Check size={14}/>OK</span>}</div>; }
function Identity({label,value}:{label:string;value:string}) { return <div className="identity-item"><span>{label}</span><strong title={value}>{value}</strong></div>; }
function Metric({icon:Icon,label,value}:{icon:typeof Box;label:string;value:number}) { return <article className="model-metric glass-panel"><Icon size={18}/><div><strong>{value}</strong><span>{label}</span></div></article>; }
