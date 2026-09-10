import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Check, CheckCircle2, ChevronDown, Download, FileCheck2, FileUp,
  LoaderCircle, RotateCcw, Settings2, ShieldCheck, Trash2, Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SavedProfileBaseline } from '../lib/baselineProfile';
import { removeProfileBaseline, saveProfileBaseline } from '../lib/baselineProfile';
import { compareInspections, type ProfileDiffRow } from '../lib/profileDiff';
import {
  clearProfileDecisionPlan,
  decisionPlanContext,
  loadProfileDecisionPlan,
  saveProfileDecisionPlan,
  type ProfileDecision,
} from '../lib/profileDecisionPlan';
import { createSafeThreeMfBuildPreview } from '../lib/safeThreeMfBuildPreview';
import {
  buildVerifiedThreeMfExport,
  downloadThreeMf,
  exportEligibility,
  type SafeThreeMfExportVerification,
} from '../lib/safeThreeMfExporter';
import { inspectThreeMf, type ThreeMfInspection } from '../lib/threeMfInspector';

const copy = {
  lv: {
    eyebrow: 'KO PRINTGUARDIAN IESAKA DARĪT',
    title: 'Pārbaudi svarīgāko pirms drukāšanas',
    subtitle: 'PrintGuardian salīdzina šo projektu ar tavu uzticamo drukas profilu un parāda atšķirības cilvēku valodā. Tehniskais salīdzinājums notiek fonā.',
    setupTitle: 'Vispirms iestati savu drukas profilu',
    setupText: 'Izvēlies vienu uzticamu 3MF failu, kuru esi pats veiksmīgi sagatavojis savam printerim. PrintGuardian no tā saglabās tikai profila metadatus un atlasītās iestatījumu vērtības — pats 3MF netiks saglabāts.',
    setupAction: 'Izvēlēties uzticamu 3MF',
    setupReading: 'Nolasa profilu…',
    setupHint: 'Tas ir vienreizējs solis. Pēc tam katrs jaunais 3MF tiks salīdzināts automātiski.',
    setupError: 'Drukas profilu neizdevās saglabāt.',
    myProfile: 'Mans drukas profils',
    replace: 'Nomainīt profilu',
    remove: 'Dzēst profilu',
    removeConfirm: 'Dzēst saglabāto drukas profilu?',
    profileFrom: 'Izveidots no',
    noDifferences: 'Šajos pašlaik atbalstītajos profila laukos būtiskas atšķirības netika atrastas.',
    reviewCount: (count: number) => `${count} liet${count === 1 ? 'a' : 'as'}, ko vērts pārbaudīt`,
    highCount: (count: number) => `${count} ar augstu ietekmi`,
    current: 'Šajā projektā',
    mine: 'Manā profilā',
    keep: 'Paturēt projekta vērtību',
    useMine: 'Izmantot manu vērtību',
    cannotApply: 'Šo atšķirību PrintGuardian pagaidām tikai izskaidro. Automātiska pārrakstīšana nav atļauta, kamēr nav droši zināma visu saistīto profila lauku atbilstība.',
    selectedMine: (count: number) => `${count} izmaiņas sagatavotas`,
    reset: 'Atcelt izvēles',
    planTitle: 'Gatavs izveidot pielāgotu kopiju',
    planText: 'Oriģinālais fails paliks neskarts. PrintGuardian izveidos jaunu 3MF tikai ar tavām apstiprinātajām izmaiņām un pēc tam to vēlreiz pārbaudīs.',
    noPlanTitle: 'Vēl nekas netiks mainīts',
    noPlanText: 'Pie iestatījumiem, kurus vēlies pārņemt no sava profila, izvēlies “Izmantot manu vērtību”.',
    export: 'Izveidot pielāgotu 3MF kopiju',
    exporting: 'Pārbūvē un pārbauda…',
    exported: 'Jaunā 3MF kopija pārbaudīta',
    exportedText: 'Arhīva struktūra, nemainītie faili un pieprasītās izmaiņas tika pārbaudītas pirms lejupielādes.',
    exportLocked: 'Eksports nav pieejams, kamēr nav vismaz vienas droši kartētas izmaiņas.',
    exportFailed: 'Jauno 3MF neizdevās droši izveidot.',
    details: 'Tehniskā informācija',
    mapped: 'Droši kartētas',
    blocked: 'Bloķētas',
    unresolved: 'Neatrisinātas',
    preserved: 'Citi arhīva ieraksti saglabāti',
    notFullAudit: 'Svarīgi: šis vēl nav pilns ģeometrijas vai G-code drošības audits.',
    why: 'Ko tas nozīmē',
    effects: {
      printer_profile: 'Projekts ir sagatavots citam printera profilam. Tas var ietekmēt darba laukumu, ātrumus, paātrinājumus un starta/beigu G-code.',
      nozzle_diameter: 'Atšķirīgs nozzle diametrs ietekmē derīgu Layer height, line width, plūsmu un detaļu smalkumu.',
      build_plate: 'Atšķirīga Build plate izvēle var mainīt pirmā slāņa temperatūru, saķeri un starta procedūru.',
      process_profile: 'Process profile nosaukums atšķiras. Svarīgākās konkrētās vērtības PrintGuardian salīdzina atsevišķi zemāk.',
      layer_height: 'Layer height ietekmē detaļu smalkumu, virsmas kvalitāti un drukas laiku.',
      wall_loops: 'Wall loops galvenokārt ietekmē sienu biezumu, izturību, materiāla patēriņu un drukas laiku.',
      sparse_infill_density: 'Sparse infill density maina iekšējā pildījuma daudzumu, stingrību, svaru un drukas laiku.',
      enable_support: 'Enable support nosaka, vai sliceris ģenerēs balstus pārkarēm un sarežģītām vietām.',
      brim_width: 'Brim width palīdz pirmajam slānim turēties pie plates, īpaši šaurām, augstām vai deformācijai pakļautām detaļām.',
      max_volumetric_speed: 'Max volumetric speed ierobežo, cik daudz filamenta hotend drīkst izspiest sekundē. Pārāk liela vērtība var radīt under-extrusion.',
    },
  },
  en: {
    eyebrow: 'WHAT PRINTGUARDIAN SUGGESTS',
    title: 'Review the important things before printing',
    subtitle: 'PrintGuardian compares this project with your trusted print profile and explains the differences in plain language. The technical comparison happens in the background.',
    setupTitle: 'Set up your print profile first',
    setupText: 'Choose one trusted 3MF that you have successfully prepared for your printer. PrintGuardian stores only profile metadata and selected setting values — the 3MF itself is not stored.',
    setupAction: 'Choose a trusted 3MF',
    setupReading: 'Reading profile…',
    setupHint: 'This is a one-time step. Every new 3MF will then be compared automatically.',
    setupError: 'The printer profile could not be saved.',
    myProfile: 'My print profile',
    replace: 'Replace profile',
    remove: 'Remove profile',
    removeConfirm: 'Remove the saved printer profile?',
    profileFrom: 'Created from',
    noDifferences: 'No meaningful differences were found in the profile fields currently supported by PrintGuardian.',
    reviewCount: (count: number) => `${count} thing${count === 1 ? '' : 's'} worth reviewing`,
    highCount: (count: number) => `${count} high impact`,
    current: 'In this project',
    mine: 'In my profile',
    keep: 'Keep project value',
    useMine: 'Use my value',
    cannotApply: 'PrintGuardian can explain this difference, but automatic rewriting is not allowed yet because the related profile fields cannot be proven consistent.',
    selectedMine: (count: number) => `${count} changes prepared`,
    reset: 'Reset choices',
    planTitle: 'Ready to create an adjusted copy',
    planText: 'The source file stays untouched. PrintGuardian creates a new 3MF containing only the approved changes and then re-opens it for verification.',
    noPlanTitle: 'Nothing will be changed yet',
    noPlanText: 'For settings you want to take from your profile, choose “Use my value”.',
    export: 'Create adjusted 3MF copy',
    exporting: 'Rebuilding and verifying…',
    exported: 'New 3MF copy verified',
    exportedText: 'Archive structure, untouched entries and requested changes were checked before download.',
    exportLocked: 'Export is unavailable until at least one safely mapped change is selected.',
    exportFailed: 'The adjusted 3MF could not be created safely.',
    details: 'Technical details',
    mapped: 'Safely mapped',
    blocked: 'Blocked',
    unresolved: 'Unresolved',
    preserved: 'Other archive entries preserved',
    notFullAudit: 'Important: this is not yet a full geometry or G-code safety audit.',
    why: 'What this means',
    effects: {
      printer_profile: 'The project was prepared for a different printer profile. This can affect build volume, speeds, acceleration and start/end G-code.',
      nozzle_diameter: 'A different nozzle diameter affects valid Layer height, line width, flow and printable detail.',
      build_plate: 'A different Build plate can change first-layer temperature, adhesion behaviour and startup actions.',
      process_profile: 'The Process profile name differs. PrintGuardian compares the important concrete values separately below.',
      layer_height: 'Layer height affects detail, surface quality and print time.',
      wall_loops: 'Wall loops mainly affects wall thickness, strength, material use and print time.',
      sparse_infill_density: 'Sparse infill density changes internal structure, stiffness, weight and print time.',
      enable_support: 'Enable support controls whether the slicer creates support structures for overhangs and difficult geometry.',
      brim_width: 'Brim width helps the first layer stay attached, especially for narrow, tall or warp-prone parts.',
      max_volumetric_speed: 'Max volumetric speed limits how much filament the hotend may extrude per second. Too high can cause under-extrusion.',
    },
  },
} as const;


function rowCanApplyBaseline(inspection: ThreeMfInspection, baseline: SavedProfileBaseline, allRows: ProfileDiffRow[], row: ProfileDiffRow): boolean {
  if (!row.compareValue) return false;
  const test = createSafeThreeMfBuildPreview(inspection, baseline.profile, allRows, { [row.key]: 'baseline' });
  return test.mutations.find((mutation) => mutation.rowKey === row.key)?.status === 'ready';
}

function sanitizeDecisions(inspection: ThreeMfInspection, baseline: SavedProfileBaseline, rows: ProfileDiffRow[], decisions: Record<string, ProfileDecision>): Record<string, ProfileDecision> {
  return Object.fromEntries(Object.entries(decisions).map(([key, decision]) => {
    const row = rows.find((candidate) => candidate.key === key);
    if (!row || decision !== 'baseline') return [key, 'project' as ProfileDecision];
    return [key, rowCanApplyBaseline(inspection, baseline, rows, row) ? 'baseline' : 'project'];
  }));
}

type GuidedProjectReviewProps = {
  inspection: ThreeMfInspection;
  baseline: SavedProfileBaseline | null;
  onBaselineChange: (baseline: SavedProfileBaseline | null) => void;
};

export function GuidedProjectReview({ inspection, baseline, onBaselineChange }: GuidedProjectReviewProps) {
  const { i18n } = useTranslation();
  const text = copy[i18n.language.startsWith('lv') ? 'lv' : 'en'];
  const inputRef = useRef<HTMLInputElement>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const diff = useMemo(() => baseline ? compareInspections(inspection, baseline.profile) : null, [inspection, baseline]);
  const rows = useMemo(() => diff?.rows.filter((row) => row.status !== 'same') ?? [], [diff]);
  const contextId = useMemo(() => diff ? decisionPlanContext(diff.rows) : '', [diff]);
  const restored = useMemo(() => diff ? loadProfileDecisionPlan(diff.rows) : null, [contextId]);
  const [decisions, setDecisions] = useState<Record<string, ProfileDecision>>(() => baseline && diff && restored ? sanitizeDecisions(inspection, baseline, diff.rows, restored.decisions) : {});
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [verification, setVerification] = useState<SafeThreeMfExportVerification | null>(null);

  useEffect(() => {
    if (!diff) {
      setDecisions({});
      return;
    }
    const saved = loadProfileDecisionPlan(diff.rows)?.decisions ?? {};
    setDecisions(baseline ? sanitizeDecisions(inspection, baseline, diff.rows, saved) : {});
    setVerification(null);
    setExportError(null);
  }, [contextId]);

  const preview = useMemo(
    () => baseline && diff ? createSafeThreeMfBuildPreview(inspection, baseline.profile, diff.rows, decisions) : null,
    [inspection, baseline, diff, decisions],
  );
  const eligibility = useMemo(
    () => preview ? exportEligibility(inspection, preview) : { ok: false, reason: 'no-preview' },
    [inspection, preview],
  );
  const selectedCount = Object.values(decisions).filter((value) => value === 'baseline').length;
  const highCount = rows.filter((row) => row.impact === 'high').length;

  const loadTrustedProfile = async (file?: File) => {
    if (!file) return;
    setProfileError(null);
    setLoadingProfile(true);
    try {
      const trusted = await inspectThreeMf(file);
      const saved = saveProfileBaseline(trusted);
      if (!saved) throw new Error(text.setupError);
      clearProfileDecisionPlan();
      setDecisions({});
      onBaselineChange(saved);
    } catch (reason) {
      console.error(reason);
      setProfileError(reason instanceof Error ? reason.message : text.setupError);
    } finally {
      setLoadingProfile(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeProfile = () => {
    if (!baseline || !window.confirm(text.removeConfirm)) return;
    if (!removeProfileBaseline()) return;
    clearProfileDecisionPlan();
    setDecisions({});
    onBaselineChange(null);
  };

  const decisionFor = (row: ProfileDiffRow): ProfileDecision => decisions[row.key] ?? 'project';

  const canApplyBaseline = (row: ProfileDiffRow): boolean => baseline && diff ? rowCanApplyBaseline(inspection, baseline, diff.rows, row) : false;

  const choose = (row: ProfileDiffRow, decision: ProfileDecision) => {
    if (!diff) return;
    if (decision === 'baseline' && !canApplyBaseline(row)) return;
    const next = { ...decisions, [row.key]: decision };
    setDecisions(next);
    saveProfileDecisionPlan(diff.rows, next);
    setVerification(null);
    setExportError(null);
  };

  const reset = () => {
    setDecisions({});
    clearProfileDecisionPlan();
    setVerification(null);
    setExportError(null);
  };

  const runExport = async () => {
    if (!preview || !eligibility.ok || exporting) return;
    setExporting(true);
    setVerification(null);
    setExportError(null);
    try {
      const result = await buildVerifiedThreeMfExport(inspection, preview);
      setVerification(result.verification);
      downloadThreeMf(result.file);
    } catch (reason) {
      console.error(reason);
      setExportError(reason instanceof Error ? reason.message : text.exportFailed);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="guided-review" id="guided-review">
      <div className="guided-review-heading">
        <div>
          <span className="eyebrow"><ShieldCheck size={15} /> {text.eyebrow}</span>
          <h2>{text.title}</h2>
          <p>{text.subtitle}</p>
        </div>
        {baseline && rows.length > 0 && (
          <div className="guided-review-counts">
            <strong>{text.reviewCount(rows.length)}</strong>
            {highCount > 0 && <span><AlertTriangle size={13} /> {text.highCount(highCount)}</span>}
          </div>
        )}
      </div>

      {!baseline ? (
        <section className="profile-setup-card glass-panel">
          <div className="profile-setup-icon"><Settings2 size={24} /></div>
          <div className="profile-setup-copy">
            <h3>{text.setupTitle}</h3>
            <p>{text.setupText}</p>
            <small>{text.setupHint}</small>
            {profileError && <div className="guided-error">{profileError}</div>}
          </div>
          <button className="primary profile-setup-action" disabled={loadingProfile} onClick={() => inputRef.current?.click()}>
            {loadingProfile ? <LoaderCircle className="spin" size={15} /> : <FileUp size={15} />}
            {loadingProfile ? text.setupReading : text.setupAction}
          </button>
          <input ref={inputRef} hidden type="file" accept=".3mf" onChange={(event) => loadTrustedProfile(event.target.files?.[0])} />
        </section>
      ) : (
        <>
          <section className="my-profile-card glass-panel">
            <div className="my-profile-state"><CheckCircle2 size={19} /><span>{text.myProfile}</span></div>
            <div className="my-profile-main">
              <strong>{baseline.profile.printerProfile || baseline.profile.printerModel || baseline.sourceFileName}</strong>
              <span>{[baseline.profile.nozzleDiameter ? `${baseline.profile.nozzleDiameter} mm nozzle` : '', baseline.profile.processProfile].filter(Boolean).join(' · ')}</span>
              <small>{text.profileFrom}: {baseline.sourceFileName}</small>
            </div>
            <div className="my-profile-actions">
              <button className="ghost" onClick={() => inputRef.current?.click()}><FileUp size={14} /> {text.replace}</button>
              <button className="ghost danger" onClick={removeProfile}><Trash2 size={14} /> {text.remove}</button>
            </div>
            <input ref={inputRef} hidden type="file" accept=".3mf" onChange={(event) => loadTrustedProfile(event.target.files?.[0])} />
          </section>

          {rows.length === 0 ? (
            <section className="guided-all-good glass-panel"><CheckCircle2 size={22} /><div><strong>{text.noDifferences}</strong><span>{text.notFullAudit}</span></div></section>
          ) : (
            <div className="guided-difference-list">
              {rows.map((row) => {
                const decision = decisionFor(row);
                const canApply = canApplyBaseline(row);
                const effectKey = row.settingKey ?? row.key;
                const effect = text.effects[effectKey as keyof typeof text.effects];
                return (
                  <article className={`guided-difference glass-panel ${row.impact}`} key={row.key}>
                    <div className="guided-difference-top">
                      <div>
                        <div className="guided-setting-name"><strong>{row.label}</strong><span className={`impact-badge ${row.impact}`}>{row.impact.toUpperCase()}</span></div>
                        {effect && <p><b>{text.why}:</b> {effect}</p>}
                      </div>
                      {row.delta && <span className="guided-delta">{row.delta}</span>}
                    </div>
                    <div className="guided-values">
                      <button className={`guided-value ${decision === 'project' ? 'selected' : ''}`} onClick={() => choose(row, 'project')}>
                        <small>{text.current}</small><strong>{row.baseValue || '—'}</strong><span>{decision === 'project' && <Check size={12} />} {text.keep}</span>
                      </button>
                      <button className={`guided-value mine ${decision === 'baseline' ? 'selected' : ''}`} disabled={!canApply} onClick={() => choose(row, 'baseline')}>
                        <small>{text.mine}</small><strong>{row.compareValue || '—'}</strong><span>{decision === 'baseline' && <Check size={12} />} {canApply ? text.useMine : text.cannotApply}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <section className={`guided-export glass-panel ${selectedCount > 0 ? 'active' : ''}`}>
            <div className="guided-export-copy">
              <span className="eyebrow"><Wrench size={14} /> {selectedCount > 0 ? text.selectedMine(selectedCount) : text.noPlanTitle}</span>
              <h3>{selectedCount > 0 ? text.planTitle : text.noPlanTitle}</h3>
              <p>{selectedCount > 0 ? text.planText : text.noPlanText}</p>
              <span className="guided-audit-note"><AlertTriangle size={13} /> {text.notFullAudit}</span>
            </div>
            <div className="guided-export-actions">
              {selectedCount > 0 && <button className="ghost" onClick={reset}><RotateCcw size={14} /> {text.reset}</button>}
              <button className="primary guided-export-button" disabled={!eligibility.ok || exporting} title={!eligibility.ok ? text.exportLocked : undefined} onClick={runExport}>
                {exporting ? <LoaderCircle className="spin" size={15} /> : <Download size={15} />}
                {exporting ? text.exporting : text.export}
              </button>
            </div>
          </section>

          {verification && (
            <section className="guided-verified glass-panel">
              <FileCheck2 size={20} />
              <div><strong>{text.exported}</strong><span>{text.exportedText}</span><code>{verification.fileName} · {verification.fileSize.toLocaleString()} B</code></div>
            </section>
          )}
          {exportError && <div className="guided-error">{text.exportFailed} {exportError}</div>}

          {preview && (
            <details className="guided-technical glass-panel">
              <summary><ChevronDown size={14} /> {text.details}</summary>
              <div className="guided-technical-grid">
                <span><b>{preview.readyCount}</b>{text.mapped}</span>
                <span><b>{preview.blockedCount}</b>{text.blocked}</span>
                <span><b>{preview.unresolvedCount}</b>{text.unresolved}</span>
                {verification && <span><b>{verification.preservedEntryCount}</b>{text.preserved}</span>}
              </div>
            </details>
          )}
        </>
      )}
    </section>
  );
}
