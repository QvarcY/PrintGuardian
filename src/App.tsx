import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, ChevronRight, CircleGauge, Layers3, ScanSearch, Settings2, ShieldCheck, TriangleAlert, Zap } from 'lucide-react';
import { LanguageSwitch } from './components/LanguageSwitch';
import { DropZone } from './components/DropZone';
import { SettingTerm } from './components/SettingTerm';

const navIcons = [CircleGauge, Box, ScanSearch, Layers3, Settings2, TriangleAlert, Zap];
const navKeys = ['overview', 'project', 'printer', 'filaments', 'settings', 'risks', 'compare'] as const;

function App() {
  const { t } = useTranslation();
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setFileName(null)} aria-label="PrintGuardian home">
          <span className="brand-mark"><ShieldCheck size={20} /></span>
          <span><strong>PrintGuardian</strong><small>{t('app.tagline')}</small></span>
        </button>
        <div className="top-actions">
          {fileName && <div className="project-chip"><span className="pulse-dot" />{fileName}</div>}
          <LanguageSwitch />
        </div>
      </header>

      {!fileName ? <DropZone onLoad={(name) => setFileName(name ?? 'project.3mf')} /> : <Dashboard />}

      <footer className="footer">
        <span>{t('app.prototype')}</span>
        <span>© 2026 <b>CraftIN / QvarcY</b> · kas.id.lv · craftin.lv</span>
      </footer>
    </div>
  );
}

function Dashboard() {
  const { t } = useTranslation();
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
          <div className="score-ring" aria-label="Print health 84 out of 100"><span>84</span><small>/100</small></div>
          <div className="health-copy">
            <span className="eyebrow"><ShieldCheck size={15} /> {t('app.printHealth')}</span>
            <h1>{t('app.goodToPrint')}</h1>
            <p>{t('app.warnings', { count: 3, critical: 0 })}</p>
          </div>
          <button className="primary safe-button">{t('app.safeCopy')} <ChevronRight size={17} /></button>
        </div>

        <div className="summary-grid">
          <StatusCard label={t('app.printer')} value={t('cards.printer')} status={t('cards.compatible')} />
          <StatusCard label="Build plate" value={t('cards.plate')} status={t('cards.compatible')} />
          <StatusCard label={t('app.filaments')} value={t('cards.filament')} status={t('cards.check')} warning />
          <StatusCard label="Geometry" value={t('cards.geometry')} status={t('cards.compatible')} />
        </div>

        <div className="content-grid">
          <section className="glass-panel settings-panel">
            <div className="panel-heading"><div><span className="eyebrow">PROFILE DIFF</span><h2>{t('app.settings')}</h2></div><span className="badge warning">3 CHANGES</span></div>
            <SettingTerm name="Max volumetric speed" translationKey="maxVolumetricSpeed" value="18 → 14 mm³/s" tone="warning" />
            <SettingTerm name="Wall loops" translationKey="wallLoops" value="2 → 4" />
            <SettingTerm name="Sparse infill density" translationKey="sparseInfillDensity" value="15% → 25%" />
          </section>

          <section className="glass-panel dna-panel">
            <div className="panel-heading"><div><span className="eyebrow">VISUAL SIGNATURE</span><h2>Print DNA</h2></div><span className="badge">LIVE</span></div>
            <div className="dna-wrap">
              <div className="dna-shape"><span>QUALITY</span><span>SPEED</span><span>FLOW</span><span>SUPPORT</span><span>STRENGTH</span><span>COOLING</span><i /></div>
              <div className="dna-legend"><p><b>Balanced profile</b></p><p>Higher strength and flow than your usual P1S baseline.</p></div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function StatusCard({ label, value, status, warning = false }: { label: string; value: string; status: string; warning?: boolean }) {
  return <article className="status-card glass-panel"><div><span className="card-label">{label}</span><strong>{value}</strong></div><span className={`status-pill ${warning ? 'warning' : ''}`}>{warning ? '!' : '✓'} {status}</span></article>;
}

export default App;
