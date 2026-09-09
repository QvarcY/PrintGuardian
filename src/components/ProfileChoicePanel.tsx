import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProfileDiffRow } from '../lib/profileDiff';
import './ProfileChoicePanel.css';

type Decision = 'project' | 'baseline';

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
    disclaimer: 'Šis ir tikai lēmumu plāns. PrintGuardian šajā posmā vēl nepārraksta un neeksportē 3MF failu.',
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
    disclaimer: 'This is a decision plan only. PrintGuardian does not rewrite or export the 3MF file at this stage.',
    impact: { high: 'High impact', medium: 'Medium impact', low: 'Low impact', none: 'No impact' },
  },
};

export function ProfileChoicePanel({ rows }: { rows: ProfileDiffRow[] }) {
  const { i18n } = useTranslation();
  const text = copy[i18n.language.startsWith('lv') ? 'lv' : 'en'];
  const actionableRows = useMemo(() => rows.filter((row) => row.status !== 'same'), [rows]);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const rowsSignature = useMemo(() => actionableRows.map((row) => `${row.key}:${row.baseValue ?? ''}:${row.compareValue ?? ''}`).join('|'), [actionableRows]);

  useEffect(() => setDecisions({}), [rowsSignature]);

  const decisionFor = (row: ProfileDiffRow): Decision => decisions[row.key] ?? 'project';
  const selectedBaselineCount = actionableRows.filter((row) => decisionFor(row) === 'baseline').length;

  const choose = (row: ProfileDiffRow, decision: Decision) => {
    if (decision === 'baseline' && !row.compareValue) return;
    setDecisions((current) => ({ ...current, [row.key]: decision }));
  };

  const reset = () => setDecisions({});

  return (
    <section className="choice-panel glass-panel">
      <div className="choice-heading">
        <div>
          <span className="eyebrow"><ShieldCheck size={14} /> {text.eyebrow}</span>
          <h2>{text.title}</h2>
          <p>{text.subtitle}</p>
        </div>
        <div className="choice-heading-actions">
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
  );
}
