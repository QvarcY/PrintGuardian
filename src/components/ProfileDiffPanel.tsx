import { useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, FileUp2, Filter, GitCompareArrows, Info, RotateCcw, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { inspectThreeMf, type ThreeMfInspection } from '../lib/threeMfInspector';
import { compareInspections, type DiffImpact, type DiffStatus, type ProfileDiffRow } from '../lib/profileDiff';
import { PrintDnaComparison } from './PrintDnaComparison';

type DiffFilter = 'differences' | 'high' | 'all';

export function ProfileDiffPanel({ inspection }: { inspection: ThreeMfInspection }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [comparison, setComparison] = useState<ThreeMfInspection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DiffFilter>('differences');

  const diff = useMemo(() => comparison ? compareInspections(inspection, comparison) : null, [inspection, comparison]);
  const visibleRows = useMemo(() => {
    if (!diff) return [];
    if (filter === 'high') return diff.rows.filter((row) => row.impact === 'high');
    if (filter === 'differences') return diff.rows.filter((row) => row.status !== 'same');
    return diff.rows;
  }, [diff, filter]);

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
        {comparison && <button className="ghost compare-reset" onClick={() => { setComparison(null); setError(null); setFilter('differences'); }}><RotateCcw size={15} /> {t('compare.reset')}</button>}
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

      {!diff || !comparison
        ? <div className="compare-empty glass-panel"><GitCompareArrows size={31} /><h2>{t('compare.emptyTitle')}</h2><p>{t('compare.emptyText')}</p></div>
        : <>
          <PrintDnaComparison base={inspection.dna} compare={comparison.dna} baseName={inspection.fileName} compareName={comparison.fileName} />

          <div className="diff-summary">
            <SummaryStat tone="changed" value={diff.changed} label={t('compare.changed')} />
            <SummaryStat tone="high" value={diff.highImpact} label={t('compare.highImpact')} />
            <SummaryStat tone="same" value={diff.same} label={t('compare.same')} />
            <SummaryStat tone="missing" value={diff.missing} label={t('compare.missing')} />
          </div>

          <div className="diff-toolbar glass-panel">
            <div>
              <Filter size={14} />
              <span>{t('compare.focus')}</span>
            </div>
            <button className={filter === 'differences' ? 'selected' : ''} onClick={() => setFilter('differences')}>{t('compare.differencesOnly')}</button>
            <button className={filter === 'high' ? 'selected' : ''} onClick={() => setFilter('high')}>{t('compare.highOnly')}</button>
            <button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>{t('compare.showAll')}</button>
            <span className="diff-visible-count">{t('compare.showing', { count: visibleRows.length, total: diff.rows.length })}</span>
          </div>

          <section className="diff-table glass-panel">
            <div className="diff-table-head">
              <span>{t('compare.parameter')}</span>
              <span>{inspection.fileName}</span>
              <span>{comparison.fileName}</span>
              <span>{t('compare.result')}</span>
            </div>
            {visibleRows.length > 0
              ? visibleRows.map((row) => <DiffRow key={row.key} row={row} />)
              : <div className="diff-filter-empty">{t('compare.noRows')}</div>}
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

const tooltipKeys: Record<string, string> = {
  layer_height: 'layerHeight',
  wall_loops: 'wallLoops',
  sparse_infill_density: 'sparseInfillDensity',
  enable_support: 'support',
  brim_width: 'brimWidth',
  max_volumetric_speed: 'maxVolumetricSpeed',
};

function directionalEffect(row: ProfileDiffRow, t: ReturnType<typeof useTranslation>['t']): string | undefined {
  const settingTooltip = row.settingKey ? tooltipKeys[row.settingKey] : undefined;
  if (!settingTooltip) return undefined;
  if (row.direction === 'higher' || row.direction === 'enabled') return t(`settings.${settingTooltip}.higher`);
  if (row.direction === 'lower' || row.direction === 'disabled') return t(`settings.${settingTooltip}.lower`);
  return undefined;
}

function DiffRow({ row }: { row: ProfileDiffRow }) {
  const { t } = useTranslation();
  const statusLabel = row.status === 'same' ? t('compare.same') : row.status === 'changed' ? t('compare.changed') : t('compare.missing');
  const settingTooltip = row.settingKey ? tooltipKeys[row.settingKey] : undefined;
  const explanationKey = settingTooltip
    ? `settings.${settingTooltip}.description`
    : row.key === 'nozzle_diameter' ? 'compare.explanations.nozzle'
    : row.key === 'printer_profile' ? 'compare.explanations.printer'
    : row.key === 'build_plate' ? 'compare.explanations.plate'
    : row.key === 'process_profile' ? 'compare.explanations.process'
    : undefined;
  const explanation = explanationKey ? t(explanationKey) : undefined;
  const effect = directionalEffect(row, t);

  return (
    <div className={`diff-row ${row.status}`}>
      <div className="diff-name-wrap">
        <div className="diff-name">{row.label}</div>
        {explanation && <span className="diff-info" tabIndex={0} aria-label={t('compare.whyItMatters')}><Info size={12} /><span className="diff-tooltip"><b>{t('compare.whyItMatters')}</b>{explanation}{effect && <><b className="diff-tooltip-effect-title">{t('compare.expectedEffect')}</b><span className="diff-tooltip-effect">{effect}</span></>}</span></span>}
        {row.impact !== 'none' && <ImpactBadge impact={row.impact} />}
        <CategoryBadge category={row.category} />
      </div>
      <code title={row.baseValue}>{row.baseValue || '—'}</code>
      <code title={row.compareValue}>{row.compareValue || '—'}{row.delta && <small className="diff-delta">{row.delta}</small>}</code>
      <span className={`diff-result ${row.status}`}>
        {row.status === 'same' ? <Check size={13} /> : row.status === 'changed' ? <GitCompareArrows size={13} /> : <TriangleAlert size={13} />}
        {statusLabel}
      </span>
    </div>
  );
}

function ImpactBadge({ impact }: { impact: Exclude<DiffImpact, 'none'> }) {
  const { t } = useTranslation();
  return <span className={`impact-badge ${impact}`}>{t(`compare.impact.${impact}`)}</span>;
}

function CategoryBadge({ category }: { category: ProfileDiffRow['category'] }) {
  const { t } = useTranslation();
  return <span className="category-badge">{t(`compare.category.${category}`)}</span>;
}
