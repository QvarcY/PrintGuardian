import { useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Archive, Box, ChevronRight, CircleGauge, FileCode2, Layers3, ScanSearch,
  Settings2, ShieldCheck, TriangleAlert, Zap,
} from 'lucide-react';
import { LanguageSwitch } from './components/LanguageSwitch';
import { DropZone } from './components/DropZone';
import { SettingTerm } from './components/SettingTerm';
import { PrintDna } from './components/PrintDna';
import { createDemoInspection, inspectThreeMf, type ThreeMfInspection } from './lib/threeMfInspector';

const navIcons = [CircleGauge, Box, ScanSearch, Layers3, Settings2, TriangleAlert, Zap];
const navKeys = ['overview', 'project', 'printer', 'filaments', 'settings', 'risks', 'compare'] as const;

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function App() {
  const { t } = useTranslation();
  const [inspection, setInspection] = useState<ThreeMfInspection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setInspection(null);
    setError(null);
    setBusy(false);
  };

  const openFile = async (file: File) => {
    setError(null);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.3mf')) {
      setError(t('app.unsupported'));
      return;
    }

    setBusy(true);
    try {
      setInspection(await inspectThreeMf(file));
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : String(reason);
      console.error(reason);
      setError(`${t('app.invalid3mf')} ${detail}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={reset} aria-label="PrintGuardian home">
          <span className="brand-mark"><ShieldCheck size={20} /></span>
          <span><strong>PrintGuardian</strong><small>{t('app.tagline')}</small></span>
        </button>
        <div className="top-actions">
          {inspection && <div className="project-chip"><span className="pulse-dot" />{inspection.fileName}</div>}
          <LanguageSwitch />
        </div>
      </header>

      {!inspection
        ? <DropZone onFile={openFile} onDemo={() => setInspection(createDemoInspection())} busy={busy} error={error} />
        : <Dashboard inspection={inspection} />}

      <footer className="footer">
        <span>{t('app.prototype')}</span>
        <span>© 2026 <b>CraftIN / QvarcY</b> · kas.id.lv · craftin.lv</span>
      </footer>
    </div>
  );
}

function Dashboard({ inspection }: { inspection: ThreeMfInspection }) {
  const { t } = useTranslation();
  const warnings = inspection.notices.filter((notice) => notice.severity === 'warning').length;
  const critical = inspection.notices.filter((notice) => notice.severity === 'critical').length;
  const headline = critical > 0 ? t('app.criticalReview') : warnings > 0 ? t('app.needsReview') : t('app.goodToPrint');
  const scoreTone = critical > 0 ? 'critical' : warnings > 0 ? 'warning' : 'good';

  const primaryFilament = inspection.filaments[0];
  const printerValue = inspection.printerProfile || inspection.printerModel || t('app.unknown');
  const nozzleSuffix = inspection.nozzleDiameter ? ` · ${inspection.nozzleDiameter} mm` : '';

  return (
    <main className="workspace">
      <aside className="sidebar">
        <nav>
          {navKeys.map((key, index) => {
            const Icon = navIcons[index];
            return <button key={key} className={index === 0 ? 'selected' : ''}><Icon size={17} /><span>{t(`app.${key}`)}</span></button>;
          })}
        </nav>
        <div className="author-card">
          <span className="mini-logo">PG</span>
          <div><b>{t('app.author')}</b><small>kas.id.lv · craftin.lv</small></div>
        </div>
      </aside>

      <section className="dashboard">
        <div className="health-panel glass-panel">
          <div className={`score-ring ${scoreTone}`} style={{ '--score': `${inspection.score * 3.6}deg` } as CSSProperties} aria-label={`Project check ${inspection.score} out of 100`}>
            <span>{inspection.score}</span><small>/100</small>
          </div>
          <div className="health-copy">
            <span className="eyebrow"><ShieldCheck size={15} /> {t('app.printHealth')} · {t('app.realData')}</span>
            <h1>{headline}</h1>
            <p>{t('app.warnings', { count: warnings, critical })} · {t('app.preliminary')}</p>
          </div>
          <button className="primary safe-button" title={t('app.safeCopySoon')} disabled>{t('app.safeCopy')} <ChevronRight size={17} /></button>
        </div>

        <div className="summary-grid">
          <StatusCard label={t('cards.printer')} value={`${printerValue}${nozzleSuffix}`} status={t('cards.compatible')} />
          <StatusCard label={t('cards.plate')} value={inspection.buildPlate || t('app.unknown')} status={t('cards.compatible')} />
          <StatusCard label={t('cards.filament')} value={primaryFilament ? `${primaryFilament.type}${inspection.filaments.length > 1 ? ` +${inspection.filaments.length - 1}` : ''}` : t('app.unknown')} status={inspection.filaments.length > 8 ? t('cards.check') : t('cards.compatible')} warning={inspection.filaments.length > 8} />
          <StatusCard label={t('cards.geometry')} value={`${inspection.objectCount} ${t('cards.objects').toLowerCase()}`} status={inspection.objectCount > 0 ? t('cards.compatible') : t('cards.check')} warning={inspection.objectCount === 0} />
        </div>

        <div className="content-grid">
          <section className="glass-panel settings-panel">
            <div className="panel-heading">
              <div><span className="eyebrow">{t('app.extracted')}</span><h2>{t('app.slicerSettings')}</h2><p className="panel-subtitle">{t('app.slicerSettingsHint')}</p></div>
              <span className="badge">{inspection.settings.length} VALUES</span>
            </div>
            {inspection.settings.length > 0
              ? inspection.settings.map((setting) => <SettingTerm key={setting.key} name={setting.label} translationKey={setting.tooltipKey} value={setting.value} />)
              : <EmptyLine text={t('app.unknown')} />}
          </section>

          <section className="glass-panel dna-panel">
            <div className="panel-heading"><div><span className="eyebrow">VISUAL SIGNATURE</span><h2>Print DNA</h2></div><span className="badge">LIVE</span></div>
            <div className="dna-live-layout">
              <PrintDna data={inspection.dna} />
              <div className="dna-legend">
                <p><b>{inspection.processProfile || t('app.projectFacts')}</b></p>
                <p>{t('app.scoreAbout')}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="lower-grid">
          <section className="glass-panel facts-panel">
            <div className="panel-heading"><div><span className="eyebrow">PROJECT MAP</span><h2>{t('app.projectFacts')}</h2></div><FileCode2 size={18} /></div>
            <FactRow label={t('app.process')} value={inspection.processProfile || t('app.unknown')} />
            <FactRow label={t('app.fileSize')} value={formatBytes(inspection.fileSize)} />
            <FactRow label={t('app.archive')} value={t('app.entries', { count: inspection.archiveEntryCount })} />
            <FactRow label="project_settings.config" value={t('app.settingsFound', { count: inspection.projectSettingsCount })} />
            <FactRow label="Geometry" value={`${inspection.objectCount} objects · ${t('app.parts', { count: inspection.partCount })}`} />
            <FactRow label="Plates" value={t('app.plates', { count: inspection.plateCount })} />
            <FactRow label={t('app.thumbnail')} value={inspection.hasThumbnail ? t('app.present') : t('app.missing')} />
          </section>

          <section className="glass-panel filament-panel">
            <div className="panel-heading"><div><span className="eyebrow">MATERIAL MAP</span><h2>{t('app.filamentPalette')}</h2></div><Layers3 size={18} /></div>
            {inspection.filaments.length === 0
              ? <EmptyLine text={t('app.noFilaments')} />
              : inspection.filaments.slice(0, 8).map((filament) => <FilamentRow key={filament.index} filament={filament} />)}
            {inspection.filaments.length > 8 && <div className="more-row">+{inspection.filaments.length - 8} more</div>}
          </section>
        </div>

        <section className="glass-panel notices-panel">
          <div className="panel-heading"><div><span className="eyebrow">PREFLIGHT</span><h2>{t('app.notices')}</h2></div><Archive size={18} /></div>
          {inspection.notices.length === 0
            ? <div className="notice-row info"><span className="notice-mark">✓</span><div><b>{t('app.noNotices')}</b><p>{t('app.preliminary')}</p></div></div>
            : inspection.notices.map((notice) => (
              <div key={notice.id} className={`notice-row ${notice.severity}`}>
                <span className="notice-mark">{notice.severity === 'critical' ? '×' : notice.severity === 'warning' ? '!' : 'i'}</span>
                <div><b>{t(notice.titleKey, notice.values)}</b><p>{t(notice.detailKey, notice.values)}</p></div>
              </div>
            ))}
        </section>
      </section>
    </main>
  );
}

function StatusCard({ label, value, status, warning = false }: { label: string; value: string; status: string; warning?: boolean }) {
  return <article className="status-card glass-panel"><div><span className="card-label">{label}</span><strong title={value}>{value}</strong></div><span className={`status-pill ${warning ? 'warning' : ''}`}>{warning ? '!' : '✓'} {status}</span></article>;
}

function FactRow({ label, value }: { label: string; value: string }) {
  return <div className="fact-row"><span>{label}</span><strong title={value}>{value}</strong></div>;
}

function FilamentRow({ filament }: { filament: ThreeMfInspection['filaments'][number] }) {
  const details = [filament.vendor, filament.profile].filter(Boolean).join(' · ');
  return (
    <div className="filament-row">
      <span className="filament-swatch" style={{ background: filament.color || 'rgba(255,255,255,.16)' }} />
      <div><b>F{filament.index} · {filament.type}</b><small>{details || '—'}</small></div>
      <span className="filament-stat">{filament.usedGrams ? `${filament.usedGrams} g` : filament.maxVolumetricSpeed ? `${filament.maxVolumetricSpeed} mm³/s` : '—'}</span>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <div className="empty-line">{text}</div>;
}

export default App;
