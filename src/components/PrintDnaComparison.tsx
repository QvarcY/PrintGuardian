import { useTranslation } from 'react-i18next';
import type { PrintDna } from '../lib/threeMfInspector';

const axes = ['quality', 'speed', 'flow', 'support', 'strength', 'cooling'] as const;
const angles = [-90, -30, 30, 90, 150, 210];
const center = 120;
const radius = 78;

function point(angle: number, value: number) {
  const radians = angle * Math.PI / 180;
  const scaled = radius * Math.max(0, Math.min(100, value)) / 100;
  return `${center + Math.cos(radians) * scaled},${center + Math.sin(radians) * scaled}`;
}

function ring(value: number) {
  return angles.map((angle) => point(angle, value)).join(' ');
}

function polygon(data: PrintDna) {
  return angles.map((angle, index) => point(angle, data[axes[index]])).join(' ');
}

export function PrintDnaComparison({ base, compare, baseName, compareName }: { base: PrintDna; compare: PrintDna; baseName: string; compareName: string }) {
  const { t } = useTranslation();
  const largest = axes
    .map((axis) => ({ axis, delta: Math.round(compare[axis] - base[axis]) }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  return (
    <section className="dna-compare glass-panel">
      <div className="dna-compare-copy">
        <span className="eyebrow">VISUAL DIFF · EXPERIMENTAL</span>
        <h2>{t('compare.dna.title')}</h2>
        <p>{t('compare.dna.subtitle')}</p>
        <div className="dna-compare-legend">
          <span><i className="dna-key base" />{baseName}</span>
          <span><i className="dna-key compare" />{compareName}</span>
        </div>
        <div className="dna-delta-list">
          {largest.map(({ axis, delta }) => <div key={axis}><span>{t(`dna.${axis}`)}</span><strong className={delta === 0 ? 'neutral' : delta > 0 ? 'up' : 'down'}>{delta > 0 ? '+' : ''}{delta}</strong></div>)}
        </div>
        <small>{t('compare.dna.disclaimer')}</small>
      </div>
      <div className="dna-radar-wrap dna-radar-compare">
        <svg className="dna-radar" viewBox="0 0 240 240" role="img" aria-label={t('compare.dna.title')}>
          {[25, 50, 75, 100].map((value) => <polygon key={value} points={ring(value)} className="dna-grid-ring" />)}
          {angles.map((angle, index) => {
            const edge = point(angle, 100).split(',').map(Number);
            return <line key={axes[index]} x1={center} y1={center} x2={edge[0]} y2={edge[1]} className="dna-axis" />;
          })}
          <polygon points={polygon(base)} className="dna-data dna-base" />
          <polygon points={polygon(compare)} className="dna-data dna-compare-shape" />
        </svg>
        <div className="dna-label dna-quality">{t('dna.quality')}</div>
        <div className="dna-label dna-speed">{t('dna.speed')}</div>
        <div className="dna-label dna-flow">{t('dna.flow')}</div>
        <div className="dna-label dna-support">{t('dna.support')}</div>
        <div className="dna-label dna-strength">{t('dna.strength')}</div>
        <div className="dna-label dna-cooling">{t('dna.cooling')}</div>
      </div>
    </section>
  );
}
