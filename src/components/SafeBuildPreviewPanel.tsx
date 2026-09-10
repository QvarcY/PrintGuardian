import { Braces, CheckCircle2, Download, FileCheck2, FileWarning, LoaderCircle, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ThreeMfInspection } from '../lib/threeMfInspector';
import type { ComparableInspection, ProfileDiffRow } from '../lib/profileDiff';
import type { ProfileDecision } from '../lib/profileDecisionPlan';
import { createSafeThreeMfBuildPreview, type BuildPreviewMutation } from '../lib/safeThreeMfBuildPreview';
import {
  buildVerifiedThreeMfExport,
  downloadThreeMf,
  exportEligibility,
  type SafeThreeMfExportVerification,
} from '../lib/safeThreeMfExporter';

const copy = {
  lv: {
    eyebrow: 'SAFE 3MF BUILDER · VERIFIED EXPORT',
    title: 'project_settings.config pārbūve un 3MF eksports',
    subtitle: 'PrintGuardian vispirms izveido konfigurācijas kopiju atmiņā. Eksports tiek atļauts tikai tad, ja visas izvēlētās izmaiņas ir kartētas un jaunais 3MF iziet pēcpārbūves pārbaudes.',
    ready: 'Kartētas', blocked: 'Bloķētas', unresolved: 'Neatrisinātas', untouched: 'Oriģināls neskarts', serializes: 'JSON validējas',
    before: 'Pirms', after: 'Pēc', target: '3MF atslēga', status: 'Statuss',
    noSelection: 'Izvēlies vismaz vienu mana drukas profila vērtību, lai redzētu pārbūves priekšskatījumu.',
    oldBaseline: 'Šis drukas profils tika saglabāts pirms raw-value atbalsta. Saglabā manu drukas profilu no jauna no pašreizējā projekta un saglabā to no jauna, lai Builder varētu veidot precīzu raw konfigurācijas priekšskatījumu.',
    readyLabel: 'READY', blockedLabel: 'BLOCKED', unresolvedLabel: 'UNRESOLVED',
    reasons: {
      'compound-metadata': 'Šī vērtība ir saistīta ar vairākiem printera/profila laukiem. Vienas atslēgas pārrakstīšana var radīt nekonsekventu profilu.',
      'material-index': 'Vērtība ir filamenta indeksēta. Pirms pārrakstīšanas jāsalīdzina filamenta/AMS slotu atbilstība.',
      'missing-mapping': 'Šim parametram vēl nav definēta konkrēta project_settings.config kartēšana.',
      'missing-project-key': 'Pašreizējā projektā nav atrasta atslēga, ko droši aizstāt.',
      'missing-baseline-raw-value': 'Manā drukas profilā nav saglabāta precīza raw vērtība. Profils jāsaglabā no jauna.',
      'missing-manual-value': 'Manuālajai izmaiņai nav saglabāta derīga raw vērtība.',
      'type-mismatch': 'Projekta un drukas profila raw datu tipi nesakrīt, tāpēc automātiska aizstāšana ir bloķēta.',
    },
    sourceHash: 'Avota fingerprint', previewHash: 'Preview fingerprint', bytes: 'Preview JSON',
    export: 'Eksportēt jaunu 3MF', exporting: 'Pārbūvē un pārbauda…',
    exportLocked: 'Eksports būs pieejams, kad būs vismaz viena kartēta izmaiņa un nebūs nevienas bloķētas vai neatrisinātas izvēles.',
    sourceMissing: 'Demo projektam nav oriģinālā 3MF faila, tāpēc eksportu var pārbaudīt tikai ar reāli ielādētu 3MF.',
    exportFailed: 'Jaunais 3MF neizturēja validāciju, tāpēc lejupielāde netika piedāvāta.',
    verifiedTitle: 'Eksports pārbaudīts',
    verifiedText: 'Jaunais 3MF tika atkārtoti atvērts un pārbaudīts pirms lejupielādes.',
    archive: 'Arhīva struktūra', preserved: 'Saglabāti citi ieraksti', mutations: 'Izmaiņas pārbaudītas', reinspection: 'Atkārtota inspekcija',
    disclaimer: 'Oriģinālais 3MF netiek pārrakstīts. PrintGuardian izveido jaunu failu ar sufiksu -printguardian. Tas nav drukas drošības sertifikāts.',
  },
  en: {
    eyebrow: 'SAFE 3MF BUILDER · VERIFIED EXPORT',
    title: 'project_settings.config rebuild and 3MF export',
    subtitle: 'PrintGuardian first builds a configuration copy in memory. Export is enabled only when every selected change is mapped and the rebuilt 3MF passes post-build verification.',
    ready: 'Mapped', blocked: 'Blocked', unresolved: 'Unresolved', untouched: 'Source untouched', serializes: 'JSON validates',
    before: 'Before', after: 'After', target: '3MF key', status: 'Status',
    noSelection: 'Select at least one print-profile value to generate a rebuild preview.',
    oldBaseline: 'This print profile was saved before raw-value support. Re-save My print profile from the current project so Builder can create an exact raw configuration preview.',
    readyLabel: 'READY', blockedLabel: 'BLOCKED', unresolvedLabel: 'UNRESOLVED',
    reasons: {
      'compound-metadata': 'This value is tied to multiple printer/profile fields. Rewriting a single key could produce an inconsistent profile.',
      'material-index': 'This value is filament-indexed. Filament/AMS slot alignment must be verified before rewriting it.',
      'missing-mapping': 'No concrete project_settings.config mapping has been defined for this parameter yet.',
      'missing-project-key': 'The current project does not contain a key that can be safely replaced.',
      'missing-baseline-raw-value': 'My print profile does not contain the exact raw value. Re-save the profile first.',
      'missing-manual-value': 'The manual change does not contain a valid stored raw value.',
      'type-mismatch': 'Project and print-profile raw value types differ, so automatic replacement is blocked.',
    },
    sourceHash: 'Source fingerprint', previewHash: 'Preview fingerprint', bytes: 'Preview JSON',
    export: 'Export new 3MF', exporting: 'Rebuilding and verifying…',
    exportLocked: 'Export becomes available when at least one change is mapped and no selected choice is blocked or unresolved.',
    sourceMissing: 'The demo project has no original 3MF file, so export can only be tested with a real loaded 3MF.',
    exportFailed: 'The rebuilt 3MF did not pass verification, so no download was offered.',
    verifiedTitle: 'Export verified',
    verifiedText: 'The rebuilt 3MF was reopened and checked before the download was offered.',
    archive: 'Archive structure', preserved: 'Other entries preserved', mutations: 'Changes verified', reinspection: 'Reinspection',
    disclaimer: 'The source 3MF is never overwritten. PrintGuardian creates a new file with the -printguardian suffix. This is not a print-safety certification.',
  },
} as const;

export function SafeBuildPreviewPanel({
  inspection,
  baseline,
  rows,
  decisions,
}: {
  inspection: ThreeMfInspection;
  baseline: ComparableInspection;
  rows: ProfileDiffRow[];
  decisions: Record<string, ProfileDecision>;
}) {
  const { i18n } = useTranslation();
  const text = copy[i18n.language.startsWith('lv') ? 'lv' : 'en'];
  const preview = useMemo(
    () => createSafeThreeMfBuildPreview(inspection, baseline, rows, decisions),
    [inspection, baseline, rows, decisions],
  );
  const selected = preview.mutations.filter((mutation) => mutation.status !== 'kept-project');
  const eligibility = useMemo(() => exportEligibility(inspection, preview), [inspection, preview]);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [verification, setVerification] = useState<SafeThreeMfExportVerification | null>(null);

  const runExport = async () => {
    if (!eligibility.ok || exporting) return;
    setExporting(true);
    setExportError(null);
    setVerification(null);
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

  const exportHint = !inspection.sourceFile ? text.sourceMissing : text.exportLocked;

  return (
    <section className="build-preview glass-panel">
      <div className="build-preview-heading">
        <div>
          <span className="eyebrow"><Braces size={14} /> {text.eyebrow}</span>
          <h2>{text.title}</h2>
          <p>{text.subtitle}</p>
        </div>
        <div className="build-preview-stats">
          <PreviewStat value={preview.readyCount} label={text.ready} tone="ready" />
          <PreviewStat value={preview.blockedCount} label={text.blocked} tone={preview.blockedCount ? 'blocked' : undefined} />
          <PreviewStat value={preview.unresolvedCount} label={text.unresolved} tone={preview.unresolvedCount ? 'unresolved' : undefined} />
        </div>
      </div>

      <div className="build-integrity-row">
        <Integrity ok={preview.sourceUntouched} label={text.untouched} />
        <Integrity ok={preview.serializes} label={text.serializes} />
        <span><b>{text.sourceHash}</b><code>{preview.beforeFingerprint}</code></span>
        <span><b>{text.previewHash}</b><code>{preview.afterFingerprint}</code></span>
        <span><b>{text.bytes}</b><code>{preview.serializedBytes.toLocaleString()} B</code></span>
      </div>

      {!preview.baselineRawValuesAvailable && selected.length > 0 && (
        <div className="build-preview-warning"><TriangleAlert size={15} /><span>{text.oldBaseline}</span></div>
      )}

      {selected.length === 0
        ? <div className="build-preview-empty">{text.noSelection}</div>
        : <div className="build-preview-list">
            <div className="build-preview-columns"><span>{text.target}</span><span>{text.before}</span><span>{text.after}</span><span>{text.status}</span></div>
            {selected.map((mutation) => <MutationRow key={mutation.rowKey} mutation={mutation} text={text} />)}
          </div>}

      {verification && (
        <div className="export-verification">
          <div className="export-verification-title"><FileCheck2 size={16} /><div><strong>{text.verifiedTitle}</strong><span>{text.verifiedText}</span></div></div>
          <div className="export-verification-grid">
            <Integrity ok={verification.archiveStructureMatches} label={text.archive} />
            <Integrity ok={verification.nonTargetEntriesPreserved} label={`${text.preserved}: ${verification.preservedEntryCount}`} />
            <Integrity ok={verification.mutationsVerified} label={text.mutations} />
            <Integrity ok={verification.reinspectionPassed} label={text.reinspection} />
          </div>
          <code className="export-file-name">{verification.fileName} · {verification.fileSize.toLocaleString()} B</code>
        </div>
      )}

      {exportError && <div className="build-preview-warning export-error"><FileWarning size={15} /><span>{text.exportFailed} {exportError}</span></div>}

      <div className="build-preview-footer">
        <div><ShieldCheck size={15} /><span>{text.disclaimer}</span></div>
        <button className="primary" disabled={!eligibility.ok || exporting} title={!eligibility.ok ? exportHint : undefined} onClick={runExport}>
          {exporting ? <LoaderCircle className="spin" size={14} /> : <Download size={14} />} {exporting ? text.exporting : text.export}
        </button>
      </div>
    </section>
  );
}

function PreviewStat({ value, label, tone }: { value: number; label: string; tone?: 'ready' | 'blocked' | 'unresolved' }) {
  return <div className={`build-preview-stat${tone ? ` ${tone}` : ''}`}><strong>{value}</strong><span>{label}</span></div>;
}

function Integrity({ ok, label }: { ok: boolean; label: string }) {
  return <span className={ok ? 'integrity-ok' : 'integrity-bad'}>{ok ? <CheckCircle2 size={13} /> : <FileWarning size={13} />}<b>{label}</b></span>;
}

function displayRaw(value: unknown): string {
  if (value === undefined) return '—';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function MutationRow({ mutation, text }: { mutation: BuildPreviewMutation; text: typeof copy.lv | typeof copy.en }) {
  const statusLabel = mutation.status === 'ready' ? text.readyLabel : mutation.status === 'blocked' ? text.blockedLabel : text.unresolvedLabel;
  return (
    <article className={`build-preview-row ${mutation.status}`}>
      <div className="build-preview-name"><strong>{mutation.label}</strong><small>{mutation.targetKey || mutation.canonicalKey}</small></div>
      <code>{displayRaw(mutation.before)}</code>
      <code>{displayRaw(mutation.after)}</code>
      <div className="build-preview-result">
        <span className={`build-preview-status ${mutation.status}`}>{statusLabel}</span>
        {mutation.reason && <small>{text.reasons[mutation.reason]}</small>}
      </div>
    </article>
  );
}
