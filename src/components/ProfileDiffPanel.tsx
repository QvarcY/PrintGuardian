import { useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, FileUp2, GitCompareArrows, RotateCcw, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { inspectThreeMf, type ThreeMfInspection } from '../lib/threeMfInspector';
import { compareInspections, type DiffStatus } from '../lib/profileDiff';

export function ProfileDiffPanel({ inspection }: { inspection: ThreeMfInspection }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [comparison, setComparison] = useState<ThreeMfInspection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const diff = useMemo(() => comparison ? compareInspections(inspection, comparison) : null, [inspection, comparison]);

  const load = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.3mf')) {
      setError(t('compare.only3mf'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setComparison(await inspectThreeMf(file));
    } catch (reason) {
      setError(`${t('compare.failed')} ${reason instanceof Error ? reason.message : String(reason)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="compare-view">
      <div className="compare-hero glass-panel">
        <div>
          <span className="eyebrow"><GitCompareArrows size={15} /> PROFILE DIFF · EXPERIMENTAL</span>
          <h1>{t('compare.title')}</h1>
          <p>{t('compare.subtitle')}</p>
        </div>
        {comparison && <button className="ghost compare-reset" onClick={() => { setComparison(null); setError(null); }}><RotateCcw size={15} /> {t('compare.reset')}</button>}
      </div>

      <div className="compare-files">
        <FileCard role={t('compare.current')} name={inspection.fileName} meta={inspection.processProfile || inspection.printerProfile || t('app.unknown')} active />
        <div className="compare-arrow"><ArrowRight size={18} /></div>
        {comparison
          ? <FileCard role={t('compare.comparison')} name={comparison.fileName} meta={comparison.processProfile || comparison.printerProfile || t('app.unknown')} active />
          : <button className={`compare-drop glass-panel${busy ? ' busy' : ''}`} onClick={() => inputRef.current?.click()} disabled={busy}>
              <FileUp2 size={24} />
              <strong>{busy ? t('compare.reading') : t('compare.choose')}</strong>
              <small>{t('compare.chooseHint')}</small>
            </button>}
        <input ref={inputRef} hidden type="file" accept=".3mf" onChange={(event) => load(event.target.files?.[0])} />
      </div>

      {error && <div className="load-error compare-error">{error}</div>}

      {!diff
        ? <div className="compare-empty glass-panel"><GitCompareArrows size={31} /><h2>{t('compare.emptyTitle')}</h2><p>{t('compare.emptyText')}</p></div>
        : <>
          <div className="diff-summary">
            <SummaryStat tone="changed" value={diff.changed} label={t('compare.changed')} />
            <SummaryStat tone="same" value={diff.same} label={t('compare.same')} />
            <SummaryStat tone="missing" value={diff.missing} label={t('compare.missing')} />
          </div>

          <section className="diff-table glass-panel">
            <div className="diff-table-head">
              <span>{t('compare.parameter')}</span>
              <span>{inspection.fileName}</span>
              <span>{comparison?.fileName}</span>
              <span>{t('compare.result')}</span>
            </div>
            {diff.rows.map((row) => <DiffRow key={row.key} label={row.label} left={row.baseValue} right={row.compareValue} status={row.status} />)}
          </section>
          <p className="compare-disclaimer">{t('compare.disclaimer')}</p>
        </>}
    </section>
  );
}

function FileCard({ role, name, meta, active }: { role: string; name: string; meta: string; active?: boolean }) {
  return <article className={`compare-file glass-panel${active ? ' active' : ''}`}><span>{role}</span><strong title={name}>{name}</strong><small title={meta}>{meta}</small></article>;
}

function SummaryStat({ tone, value, label }: { tone: string; value: number; label: string }) {
  return <article className={`diff-stat glass-panel ${tone}`}><strong>{value}</strong><span>{label}</span></article>;
}

function DiffRow({ label, left, right, status }: { label: string; left?: string; right?: string; status: DiffStatus }) {
  const { t } = useTranslation();
  const statusLabel = status === 'same' ? t('compare.same') : status === 'changed' ? t('compare.changed') : t('compare.missing');
  return (
    <div className={`diff-row ${status}`}>
      <div className="diff-name">{label}</div>
      <code>{left || '—'}</code>
      <code>{right || '—'}</code>
      <span className={`diff-result ${status}`}>
        {status === 'same' ? <Check size={13} /> : status === 'changed' ? <GitCompareArrows size={13} /> : <TriangleAlert size={13} />}
        {statusLabel}
      </span>
    </div>
  );
}
