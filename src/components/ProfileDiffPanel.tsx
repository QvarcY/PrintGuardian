import { useMemo, useRef, useState } from 'react';
import {
  ArrowRight, BookmarkCheck, Check, FileUp, Filter, GitCompareArrows, Info,
  RotateCcw, Save, Trash2, TriangleAlert,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { inspectThreeMf, type ThreeMfInspection } from '../lib/threeMfInspector';
import {
  compareInspections, type ComparableInspection, type DiffImpact, type DiffStatus, type ProfileDiffRow,
} from '../lib/profileDiff';
import {
  loadProfileBaseline, removeProfileBaseline, saveProfileBaseline, type SavedProfileBaseline,
} from '../lib/baselineProfile';
import { PrintDnaComparison } from './PrintDnaComparison';
import { ProfileChoicePanel } from './ProfileChoicePanel';

type DiffFilter = 'differences' | 'high' | 'all';
type ComparisonSource = 'file' | 'baseline' | null;

export function ProfileDiffPanel({ inspection }: { inspection: ThreeMfInspection }) {
  const { t, i18n } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [comparison, setComparison] = useState<ComparableInspection | null>(null);
  const [comparisonSource, setComparisonSource] = useState<ComparisonSource>(null);
  const [baseline, setBaseline] = useState<SavedProfileBaseline | null>(() => loadProfileBaseline());
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

  const baselineSavedLabel = useMemo(() => {
    if (!baseline) return '';
    const date = new Date(baseline.savedAt);
    if (Number.isNaN(date.getTime())) return '';
    try {
      return new Intl.DateTimeFormat(i18n.language.startsWith('lv') ? 'lv-LV' : 'en-GB', {
        dateStyle: 'medium', timeStyle: 'short',
      }).format(date);
    } catch {
      return date.toLocaleString();
    }
  }, [baseline, i18n.language]);

  const resetComparison = () => {
    setComparison(null);
    setComparisonSource(null);
    setError(null);
    setFilter('differences');
  };

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
      setComparisonSource('file');
      setFilter('differences');
    } catch (reason) {
      setError(`${t('compare.failed')} ${reason instanceof Error ? reason.message : String(reason)}`);
    } finally {
      setBusy(false);
    }
  };

  const saveCurrentBaseline = () => {
    const saved = saveProfileBaseline(inspection);
    if (!saved) {
      setError(t('baseline.saveFailed'));
      return;
    }
    setBaseline(saved);
    setError(null);
    if (comparisonSource === 'baseline') setComparison(saved.profile);
  };

  const useBaseline = () => {
    if (!baseline) return;
    setComparison(baseline.profile);
    setComparisonSource('baseline');
    setError(null);
    setFilter('differences');
  };

  const deleteBaseline = () => {
    if (!baseline) return;
    if (!window.confirm(t('baseline.removeConfirm'))) return;
    if (!removeProfileBaseline()) {
      setError(t('baseline.removeFailed'));
      return;
    }
    setBaseline(null);
    setError(null);
    if (comparisonSource === 'baseline') resetComparison();
  };

  const replaceBaseline = () => {
    if (!window.confirm(t('baseline.replaceConfirm'))) return;
    saveCurrentBaseline();
  };

  const comparisonRole = comparisonSource === 'baseline' ? t('baseline.myBaseline') : t('compare.comparison');

  return (
    <section className="compare-view">
      <div className="compare-hero glass-panel">
        <div>
          <span className="eyebrow"><GitCompareArrows size={15} /> PROFILE DIFF · EXPERIMENTAL</span>
          <h1>{t('compare.title')}</h1>
          <p>{t('compare.subtitle')}</p>
        </div>
        {comparison && <button className="ghost compare-reset" onClick={resetComparison}><RotateCcw size={15} /> {t('compare.reset')}</button>}
      </div>

      <BaselinePanel
        baseline={baseline}
        savedLabel={baselineSavedLabel}
        active={comparisonSource === 'baseline'}
        onSave={saveCurrentBaseline}
        onReplace={replaceBaseline}
        onUse={useBaseline}
        onRemove={deleteBaseline}
      />

      <div className="compare-files">
        <FileCard role={t('compare.current')} name={inspection.fileName} meta={inspection.processProfile || inspection.printerProfile || t('app.unknown')} active />
        <div className="compare-arrow"><ArrowRight size={18} /></div>
        {comparison
          ? <FileCard role={comparisonRole} name={comparison.fileName} meta={comparison.processProfile || comparison.printerProfile || t('app.unknown')} active />
          : <button className={`compare-drop glass-panel${busy ? ' busy' : ''}`} onClick={() => inputRef.current?.click()} disabled={busy}>
              <FileUp size={24} />
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
              <span>{comparisonSource === 'baseline' ? t('baseline.myBaseline') : comparison.fileName}</span>
              <span>{t('compare.result')}</span>
            </div>
            {visibleRows.length > 0
              ? visibleRows.map((row) => <DiffRow key={row.key} row={row} />)
              : <div className="diff-filter-empty">{t('compare.noRows')}</div>}
          </section>

          {comparisonSource === 'baseline' && <ProfileChoicePanel rows={diff.rows} inspection={inspection} baseline={comparison} />}

          <p className="compare-disclaimer">{comparisonSource === 'baseline' ? t('baseline.referenceDisclaimer') : t('compare.disclaimer')}</p>
        </>}
    </section>
  );
}

function BaselinePanel({
  baseline, savedLabel, active, onSave, onReplace, onUse, onRemove,
}: {
  baseline: SavedProfileBaseline | null;
  savedLabel: string;
  active: boolean;
  onSave: () => void;
  onReplace: () => void;
  onUse: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  return (
    <section className={`baseline-panel glass-panel${active ? ' active' : ''}`}>
      <div className="baseline-icon"><BookmarkCheck size={21} /></div>
      <div className="baseline-copy">
        <span className="eyebrow">LOCAL REFERENCE</span>
        <h2>{t('baseline.title')}</h2>
        {baseline
          ? <p><strong>{baseline.sourceFileName}</strong> · {t('baseline.saved', { date: savedLabel || '—' })}</p>
          : <p>{t('baseline.empty')}</p>}
        <small>{t('baseline.privacy')}</small>
      </div>
      <div className="baseline-actions">
        {baseline ? <>
          <button className="primary baseline-use" onClick={onUse} disabled={active}><GitCompareArrows size={14} /> {active ? t('baseline.inUse') : t('baseline.compare')}</button>
          <button className="ghost" onClick={onReplace}><Save size={14} /> {t('baseline.replace')}</button>
          <button className="ghost danger" onClick={onRemove}><Trash2 size={14} /> {t('baseline.remove')}</button>
        </> : <button className="primary baseline-use" onClick={onSave}><Save size={14} /> {t('baseline.save')}</button>}
      </div>
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
