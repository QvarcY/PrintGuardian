import { Braces, CheckCircle2, FileWarning, LockKeyhole, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ThreeMfInspection } from '../lib/threeMfInspector';
import type { ComparableInspection, ProfileDiffRow } from '../lib/profileDiff';
import type { ProfileDecision } from '../lib/profileDecisionPlan';
import { createSafeThreeMfBuildPreview, type BuildPreviewMutation } from '../lib/safeThreeMfBuildPreview';

const copy = {
  lv: {
    eyebrow: 'SAFE 3MF BUILDER · BUILD PREVIEW',
    title: 'project_settings.config pārbūves priekšskatījums',
    subtitle: 'PrintGuardian izveido modificētu konfigurācijas kopiju tikai atmiņā un pārbauda, kuras izvēles var droši kartēt uz konkrētām 3MF atslēgām.',
    ready: 'Kartētas', blocked: 'Bloķētas', unresolved: 'Neatrisinātas', untouched: 'Oriģināls neskarts', serializes: 'JSON validējas',
    before: 'Pirms', after: 'Pēc', target: '3MF atslēga', status: 'Statuss',
    noSelection: 'Izvēlies vismaz vienu etalona vērtību, lai redzētu pārbūves priekšskatījumu.',
    oldBaseline: 'Šis etalons tika saglabāts pirms raw-value atbalsta. Aizstāj Mans etalons ar pašreizējo projektu un saglabā to no jauna, lai Builder varētu veidot precīzu raw konfigurācijas priekšskatījumu.',
    readyLabel: 'READY', blockedLabel: 'BLOCKED', unresolvedLabel: 'UNRESOLVED',
    reasons: {
      'compound-metadata': 'Šī vērtība ir saistīta ar vairākiem printera/profila laukiem. Vienas atslēgas pārrakstīšana var radīt nekonsekventu profilu.',
      'material-index': 'Vērtība ir filamenta indeksēta. Pirms pārrakstīšanas jāsalīdzina filamenta/AMS slotu atbilstība.',
      'missing-mapping': 'Šim parametram vēl nav definēta konkrēta project_settings.config kartēšana.',
      'missing-project-key': 'Pašreizējā projektā nav atrasta atslēga, ko droši aizstāt.',
      'missing-baseline-raw-value': 'Etalonā nav saglabāta precīza raw vērtība. Etalons jāsaglabā no jauna.',
      'type-mismatch': 'Projekta un etalona raw datu tipi nesakrīt, tāpēc automātiska aizstāšana ir bloķēta.',
    },
    sourceHash: 'Avota fingerprint', previewHash: 'Preview fingerprint', bytes: 'Preview JSON',
    export: 'Export new 3MF', exportSoon: 'Eksports vēl ir bloķēts. Nākamais posms būs jauna 3MF arhīva izveide un integritātes validācija.',
    disclaimer: 'Šis priekšskatījums maina tikai atmiņā esošu project_settings.config kopiju. Oriģinālais 3MF netiek modificēts.',
  },
  en: {
    eyebrow: 'SAFE 3MF BUILDER · BUILD PREVIEW',
    title: 'project_settings.config rebuild preview',
    subtitle: 'PrintGuardian creates a modified configuration copy in memory and verifies which decisions can be mapped to concrete 3MF keys.',
    ready: 'Mapped', blocked: 'Blocked', unresolved: 'Unresolved', untouched: 'Source untouched', serializes: 'JSON validates',
    before: 'Before', after: 'After', target: '3MF key', status: 'Status',
    noSelection: 'Select at least one baseline value to generate a rebuild preview.',
    oldBaseline: 'This baseline was saved before raw-value support. Replace My Baseline with the current project and save it again so Builder can create an exact raw configuration preview.',
    readyLabel: 'READY', blockedLabel: 'BLOCKED', unresolvedLabel: 'UNRESOLVED',
    reasons: {
      'compound-metadata': 'This value is tied to multiple printer/profile fields. Rewriting a single key could produce an inconsistent profile.',
      'material-index': 'This value is filament-indexed. Filament/AMS slot alignment must be verified before rewriting it.',
      'missing-mapping': 'No concrete project_settings.config mapping has been defined for this parameter yet.',
      'missing-project-key': 'The current project does not contain a key that can be safely replaced.',
      'missing-baseline-raw-value': 'The baseline does not contain the exact raw value. Re-save the baseline first.',
      'type-mismatch': 'Project and baseline raw value types differ, so automatic replacement is blocked.',
    },
    sourceHash: 'Source fingerprint', previewHash: 'Preview fingerprint', bytes: 'Preview JSON',
    export: 'Export new 3MF', exportSoon: 'Export remains locked. The next stage will rebuild a new 3MF archive and validate its integrity.',
    disclaimer: 'This preview only modifies an in-memory copy of project_settings.config. The source 3MF is not changed.',
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

      <div className="build-preview-footer">
        <div><ShieldCheck size={15} /><span>{text.disclaimer}</span></div>
        <button className="primary" disabled title={text.exportSoon}><LockKeyhole size={14} /> {text.export}</button>
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
