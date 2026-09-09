import type { PrintDna as PrintDnaData } from '../lib/threeMfInspector';
import { useTranslation } from 'react-i18next';

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

export function PrintDna({ data }: { data: PrintDnaData }) {
  const { t } = useTranslation();
  const dataPoints = angles.map((angle, index) => point(angle, data[axes[index]])).join(' ');

  return (
    <div className="dna-radar-wrap">
      <svg className="dna-radar" viewBox="0 0 240 240" role="img" aria-label="Print DNA">
        {[25, 50, 75, 100].map((value) => <polygon key={value} points={ring(value)} className="dna-grid-ring" />)}
        {angles.map((angle, index) => {
          const edge = point(angle, 100).split(',').map(Number);
          return <line key={axes[index]} x1={center} y1={center} x2={edge[0]} y2={edge[1]} className="dna-axis" />;
        })}
        <polygon points={dataPoints} className="dna-data" />
        {angles.map((angle, index) => {
          const p = point(angle, data[axes[index]]).split(',').map(Number);
          return <circle key={axes[index]} cx={p[0]} cy={p[1]} r="3.4" className="dna-point" />;
        })}
      </svg>
      <div className="dna-label dna-quality">{t('dna.quality')}</div>
      <div className="dna-label dna-speed">{t('dna.speed')}</div>
      <div className="dna-label dna-flow">{t('dna.flow')}</div>
      <div className="dna-label dna-support">{t('dna.support')}</div>
      <div className="dna-label dna-strength">{t('dna.strength')}</div>
      <div className="dna-label dna-cooling">{t('dna.cooling')}</div>
    </div>
  );
}
