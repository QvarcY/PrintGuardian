import { useEffect, useMemo, useState } from 'react';
import { FileCheck2, RotateCcw, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ComparableInspection, ProfileDiffRow } from '../lib/profileDiff';
import type { ThreeMfInspection } from '../lib/threeMfInspector';
import {
  clearProfileDecisionPlan,
  createProfileDecisionReport,
  decisionPlanContext,
  loadProfileDecisionPlan,
  saveProfileDecisionPlan,
  type ProfileDecision,
} from '../lib/profileDecisionPlan';
import { SafeBuildPreviewPanel } from './SafeBuildPreviewPanel';
import './ProfileChoicePanel.css';

type Copy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  project: string;
  baseline: string;
  useProject: string;
  useBaseline: string;
  selectedBaseline: string;
  reset: string;
  summary: string;
  noChanges: string;
  unavailable: string;
  disclaimer: string;
  draftSaved: string;
  draftRestored: string;
  reportEyebrow: string;
  reportTitle: string;
  reportSubtitle: string;
  plannedChanges: string;
  keptProject: string;
  unresolved: string;
  highImpact: string;
  before: string;
  after: string;
  sourceProject: string;
  sourceBaseline: string;
  noPlannedChanges: string;
  reportDisclaimer: string;
  impact: Record<'high' | 'medium' | 'low' | 'none', string>;
};

const copy: Record<'lv' | 'en', Copy> = {
  lv: {
    eyebrow: 'SAFE 3MF BUILDER · LĒMUMU PRIEKŠSKATĪJUMS',
    title: 'Izvēlies, kuras vērtības paturēt',
    subtitle: 'Sagatavo profila lēmumu plānu, neko vēl nemainot pašā 3MF failā.',
    project: 'Pašreizējais projekts',
    baseline: 'Mans etalons',
    useProject: 'Paturēt projekta vērtību',
    useBaseline: 'Izmantot etalona vērtību',
    selectedBaseline: 'No etalona izvēlēts: {{count}}',
    reset: 'Atiestatīt izvēles',
    summary: '{{count}} atšķirības izvērtēšanai',
    noChanges: 'Nav atšķirību, kurām nepieciešama izvēle.',
    unavailable: 'Etalonā šīs vērtības nav',
    disclaimer: 'Šis lēmumu plāns ir nedestruktīvs. Jauns 3MF tiek izveidots tikai tad, kad zemāk apzināti palaid verificētu eksportu.',
    draftSaved: 'Melnraksts saglabāts lokāli',
    draftRestored: 'Atjaunots iepriekš saglabāts lēmumu melnraksts',
    reportEyebrow: 'BEFORE / AFTER REPORT',
    reportTitle: 'Plānoto izmaiņu pārskats',
    reportSubtitle: 'Precīzi redzi, kas paliks no projekta un ko plānots aizstāt ar etalona vērtību.',
    plannedChanges: 'Plānotas izmaiņas',
    keptProject: 'Paturētas projekta vērtības',
    unresolved: 'Neatrisinātas',
    highImpact: 'Augstas ietekmes izmaiņas',
    before: 'Pirms',
    after: 'Pēc',
    sourceProject: 'PROJECT',
    sourceBaseline: 'BASELINE',
    noPlannedChanges: 'Pašlaik nav izvēlēta neviena etalona vērtība, tāpēc projekts paliktu nemainīts.',
    reportDisclaimer: 'Pārskats apraksta plānoto profila vērtību rezultātu. Zemāk eksporta posms pārbūvē un pārbauda atsevišķu 3MF pirms lejupielādes.',
    impact: { high: 'Augsta ietekme', medium: 'Vidēja ietekme', low: 'Zema ietekme', none: 'Bez ietekmes' },
  },
  en: {
    eyebrow: 'SAFE 3MF BUILDER · DECISION PREVIEW',
    title: 'Choose which values to keep',
    subtitle: 'Prepare a profile decision plan without changing the 3MF file yet.',
    project: 'Current project',
    baseline: 'My Baseline',
    useProject: 'Keep project value',
    useBaseline: 'Use baseline value',
    selectedBaseline: 'Selected from baseline: {{count}}',
    reset: 'Reset decisions',
    summary: '{{count}} differences to review',
    noChanges: 'There are no differences that need a decision.',
    unavailable: 'No baseline value available',
    disclaimer: 'This decision plan is non-destructive. A new 3MF is created only when you explicitly run the verified export below.',
    draftSaved: 'Draft saved locally',
    draftRestored: 'Previously saved decision draft restored',
    reportEyebrow: 'BEFORE / AFTER REPORT',
    reportTitle: 'Planned changes report',
    reportSubtitle: 'See exactly what stays from the project and what is planned to come from the baseline.',
    plannedChanges: 'Planned changes',
    keptProject: 'Project values kept',
    unresolved: 'Unresolved',
    highImpact: 'High-impact changes',
    before: 'Before',
    after: 'After',
    sourceProject: 'PROJECT',
    sourceBaseline: 'BASELINE',
    noPlannedChanges: 'No baseline values are currently selected, so the project would remain unchanged.',
    reportDisclaimer: 'This report describes the planned profile-value result. The export stage below rebuilds and verifies a separate 3MF before download.',
    impact: { high: 'High impact', medium: 'Medium impact', low: 'Low impact', none: 'No impact' },
  },
};

export function ProfileChoicePanel({ rows, inspection, baseline }: { rows: ProfileDiffRow[]; inspection: ThreeMfInspection; baseline: ComparableInspection }) {
  const { i18n } = useTranslation();
  const text = copy[i18n.language.startsWith('lv') ? 'lv' : 'en'];
  const actionableRows = useMemo(() => rows.filter((row) => row.status !== 'same'), [rows]);
  const contextId = useMemo(() => decisionPlanContext(rows), [rows]);
  const restoredPlan = useMemo(() => loadProfileDecisionPlan(rows), [contextId]);
  const [decisions, setDecisions] = useState<Record<string, ProfileDecision>>(() => restoredPlan?.decisions ?? {});
  const [restored, setRestored] = useState(Boolean(restoredPlan && Object.keys(restoredPlan.decisions).length));

  useEffect(() => {
    const saved = loadProfileDecisionPlan(rows);
    setDecisions(saved?.decisions ?? {});
    setRestored(Boolean(saved && Object.keys(saved.decisions).length));
  }, [contextId, rows]);

  const decisionFor = (row: ProfileDiffRow): ProfileDecision => decisions[row.key] ?? 'project';
  const report = useMemo(() => createProfileDecisionReport(rows, decisions), [rows, decisions]);
  const selectedBaselineCount = report.baselineCount;

  const choose = (row: ProfileDiffRow, decision: ProfileDecision) => {
    if (decision === 'baseline' && !row.compareValue) return;
    const next = { ...decisions, [row.key]: decision };
    setDecisions(next);
    setRestored(false);
    saveProfileDecisionPlan(rows, next);
  };

  const reset = () => {
    setDecisions({});
    setRestored(false);
    clearProfileDecisionPlan();
  };

  return (
    <>
      <section className="choice-panel glass-panel">
        <div className="choice-heading">
          <div>
            <span className="eyebrow"><ShieldCheck size={14} /> {text.eyebrow}</span>
            <h2>{text.title}</h2>
            <p>{text.subtitle}</p>
          </div>
          <div className="choice-heading-actions">
            {Object.keys(decisions).length > 0 && <span className="choice-draft-state">{restored ? text.draftRestored : text.draftSaved}</span>}
            <span className="choice-summary">{text.summary.replace('{{count}}', String(actionableRows.length))}</span>
            <button className="ghost" onClick={reset} disabled={Object.keys(decisions).length === 0}><RotateCcw size={14} /> {text.reset}</button>
          </div>
        </div>

        {actionableRows.length === 0 ? <div className="choice-empty">{text.noChanges}</div> : <>
          <div className="choice-columns">
            <span>{text.project}</span>
            <span>{text.baseline}</span>
          </div>
          <div className="choice-list">
            {actionableRows.map((row) => {
              const decision = decisionFor(row);
              const baselineAvailable = !!row.compareValue;
              return (
                <article className={`choice-row ${decision}`} key={row.key}>
                  <div className="choice-name">
                    <strong>{row.label}</strong>
                    <span className={`impact-badge ${row.impact}`}>{text.impact[row.impact]}</span>
                  </div>
                  <button className={`choice-value ${decision === 'project' ? 'selected' : ''}`} onClick={() => choose(row, 'project')}>
                    <span>{row.baseValue || '—'}</span>
                    <small>{text.useProject}</small>
                  </button>
                  <button className={`choice-value ${decision === 'baseline' ? 'selected' : ''}`} onClick={() => choose(row, 'baseline')} disabled={!baselineAvailable} title={!baselineAvailable ? text.unavailable : undefined}>
                    <span>{row.compareValue || '—'}</span>
                    <small>{baselineAvailable ? text.useBaseline : text.unavailable}</small>
                  </button>
                </article>
              );
            })}
          </div>
        </>}

        <div className="choice-footer">
          <strong>{text.selectedBaseline.replace('{{count}}', String(selectedBaselineCount))}</strong>
          <span>{text.disclaimer}</span>
        </div>
      </section>

      <section className="decision-report glass-panel">
        <div className="decision-report-heading">
          <div>
            <span className="eyebrow"><FileCheck2 size={14} /> {text.reportEyebrow}</span>
            <h2>{text.reportTitle}</h2>
            <p>{text.reportSubtitle}</p>
          </div>
          <div className="decision-report-stats">
            <ReportStat value={report.baselineCount} label={text.plannedChanges} tone="accent" />
            <ReportStat value={report.projectCount} label={text.keptProject} />
            <ReportStat value={report.highImpactBaselineCount} label={text.highImpact} tone="warning" />
            <ReportStat value={report.unresolvedCount} label={text.unresolved} tone={report.unresolvedCount ? 'danger' : undefined} />
          </div>
        </div>

        {report.baselineCount === 0
          ? <div className="decision-report-empty">{text.noPlannedChanges}</div>
          : <div className="decision-report-list">
              <div className="decision-report-columns"><span>{text.before}</span><span>{text.after}</span></div>
              {report.entries.filter((entry) => entry.changedFromProject).map((entry) => (
                <article className="decision-report-row" key={entry.key}>
                  <div className="decision-report-name">
                    <strong>{entry.label}</strong>
                    <span className={`impact-badge ${entry.impact}`}>{text.impact[entry.impact]}</span>
                  </div>
                  <code>{entry.before || '—'}</code>
                  <code>{entry.after || '—'}</code>
                  <span className="decision-source baseline">{text.sourceBaseline}</span>
                </article>
              ))}
            </div>}
        <div className="decision-report-note">{text.reportDisclaimer}</div>
      </section>

      <SafeBuildPreviewPanel inspection={inspection} baseline={baseline} rows={rows} decisions={decisions} />
    </>
  );
}

function ReportStat({ value, label, tone }: { value: number; label: string; tone?: 'accent' | 'warning' | 'danger' }) {
  return <div className={`decision-report-stat${tone ? ` ${tone}` : ''}`}><strong>{value}</strong><span>{label}</span></div>;
}
