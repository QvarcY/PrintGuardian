import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle, Archive, CheckCircle2, FileCode2, Layers3, Settings2,
  ShieldCheck, SlidersHorizontal, Sparkles, Wrench,
} from 'lucide-react';
import { LanguageSwitch } from './components/LanguageSwitch';
import { DropZone } from './components/DropZone';
import { SettingTerm } from './components/SettingTerm';
import { PrintDna } from './components/PrintDna';
import { SupportProject } from './components/SupportProject';
import { ProfileDiffPanel } from './components/ProfileDiffPanel';
import { GuidedProjectReview } from './components/GuidedProjectReview';
import { loadProfileBaseline, type SavedProfileBaseline } from './lib/baselineProfile';
import { compareInspections } from './lib/profileDiff';
import { createDemoInspection, inspectThreeMf, type ThreeMfInspection } from './lib/threeMfInspector';

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
    if (!file.name.toLowerCase().endsWith('.3mf')) {
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
        <span className="footer-right">© 2026 <b>CraftIN / QvarcY</b> · kas.id.lv · craftin.lv <SupportProject compact /></span>
      </footer>
    </div>
  );
}

type View = 'overview' | 'settings' | 'advanced';

function Dashboard({ inspection }: { inspection: ThreeMfInspection }) {
  const { t, i18n } = useTranslation();
  const [activeView, setActiveView] = useState<View>('overview');
  const [baseline, setBaseline] = useState<SavedProfileBaseline | null>(() => loadProfileBaseline());
  const guidedRef = useRef<HTMLDivElement>(null);
  const lv = i18n.language.startsWith('lv');

  const warnings = inspection.notices.filter((notice) => notice.severity === 'warning').length;
  const critical = inspection.notices.filter((notice) => notice.severity === 'critical').length;
  const automaticDiff = useMemo(() => baseline ? compareInspections(inspection, baseline.profile) : null, [inspection, baseline]);
  const changedCount = automaticDiff?.rows.filter((row) => row.status !== 'same').length ?? 0;
  const highImpactCount = automaticDiff?.rows.filter((row) => row.impact === 'high').length ?? 0;

  const primaryFilament = inspection.filaments[0];
  const printerValue = inspection.printerProfile || inspection.printerModel || t('app.unknown');
  const nozzleSuffix = inspection.nozzleDiameter ? ` · ${inspection.nozzleDiameter} mm` : '';

  const verdict = critical > 0
    ? {
        tone: 'critical',
        title: lv ? 'PIRMS DRUKĀŠANAS JĀNOVĒRŠ PROBLĒMA' : 'FIX A PROBLEM BEFORE PRINTING',
        text: lv ? `Atrasta ${critical} kritiska problēma. PrintGuardian neiesaka turpināt, kamēr tā nav izvērtēta.` : `${critical} critical issue found. PrintGuardian recommends reviewing it before continuing.`,
      }
    : warnings > 0 || highImpactCount > 0
      ? {
          tone: 'review',
          title: lv ? 'PIRMS DRUKĀŠANAS PĀRBAUDI DAŽAS LIETAS' : 'REVIEW A FEW THINGS BEFORE PRINTING',
          text: lv ? `${warnings + highImpactCount} signāli prasa uzmanību. Zemāk redzēsi, ko tie nozīmē un ko vari darīt.` : `${warnings + highImpactCount} signals deserve attention. Below you can see what they mean and what you can do.`,
        }
      : baseline
        ? {
            tone: 'good',
            title: lv ? 'PAMATA PĀRBAUDES IZSKATĀS LABI' : 'BASIC CHECKS LOOK GOOD',
            text: lv ? 'Šajā pārbaudes līmenī nav atrasta acīmredzama profila problēma. Pilns geometry/G-code audits vēl nav pieejams.' : 'No obvious profile problem was found at the current inspection level. Full geometry/G-code auditing is not available yet.',
          }
        : {
            tone: 'partial',
            title: lv ? 'PAMATA PĀRBAUDES IZSKATĀS LABI — BET VĒL NEZINĀM TAVU PRINTERI' : 'BASIC CHECKS LOOK GOOD — BUT YOUR PRINTER IS NOT SET UP YET',
            text: lv ? 'Fails ir nolasīts, bet PrintGuardian vēl nevar salīdzināt to ar tavu uzticamo drukas profilu. To var iestatīt vienu reizi zemāk.' : 'The file is readable, but PrintGuardian cannot compare it with your trusted print profile yet. You can set that up once below.',
          };

  const openGuidedReview = () => {
    setActiveView('overview');
    window.setTimeout(() => guidedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const nav = [
    { key: 'overview' as const, label: lv ? 'Pārskats' : 'Overview', icon: ShieldCheck },
    { key: 'settings' as const, label: lv ? 'Izprast iestatījumus' : 'Understand settings', icon: SlidersHorizontal },
    { key: 'advanced' as const, label: lv ? 'Papildu rīki' : 'Advanced tools', icon: Settings2 },
  ];

  return (
    <main className="workspace">
      <aside className="sidebar simplified-sidebar">
        <nav>
          {nav.map(({ key, label, icon: Icon }) => (
            <button key={key} className={activeView === key ? 'selected' : ''} onClick={() => setActiveView(key)}>
              <Icon size={17} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <SupportProject />
          <div className="author-card">
            <span className="mini-logo">PG</span>
            <div><b>{t('app.author')}</b><small>kas.id.lv · craftin.lv</small></div>
          </div>
        </div>
      </aside>

      <section className="dashboard">
        {activeView === 'advanced' && <ProfileDiffPanel inspection={inspection} />}

        {activeView === 'settings' && (
          <SettingsView inspection={inspection} />
        )}

        {activeView === 'overview' && (
          <>
            <section className={`verdict-panel glass-panel ${verdict.tone}`}>
              <div className="verdict-mark">
                {verdict.tone === 'critical' ? <AlertTriangle size={31} /> : verdict.tone === 'review' ? <AlertTriangle size={31} /> : <ShieldCheck size={31} />}
              </div>
              <div className="verdict-copy">
                <span className="eyebrow">{lv ? 'PROJEKTA PĀRBAUDE' : 'PROJECT CHECK'}</span>
                <h1>{verdict.title}</h1>
                <p>{verdict.text}</p>
              </div>
              <button className="primary verdict-action" onClick={openGuidedReview}>
                <Wrench size={15} /> {baseline ? (lv ? 'PĀRBAUDĪT UN SAGATAVOT' : 'REVIEW & PREPARE') : (lv ? 'IESTATĪT MANU PROFILU' : 'SET UP MY PROFILE')}
              </button>
            </section>

            <section className="checklist-panel glass-panel">
              <CheckItem ok label={lv ? '3MF struktūra ir nolasāma' : '3MF structure is readable'} detail={`${inspection.archiveEntryCount} ${lv ? 'arhīva ieraksti' : 'archive entries'}`} />
              <CheckItem ok={inspection.objectCount > 0} label={lv ? 'Atrasta drukājama ģeometrija' : 'Printable geometry found'} detail={`${inspection.objectCount} ${lv ? 'objekti' : 'objects'}`} />
              <CheckItem ok={Boolean(inspection.printerProfile || inspection.printerModel)} label={lv ? 'Printera profils ir norādīts' : 'Printer profile is present'} detail={printerValue} />
              <CheckItem ok={Boolean(baseline)} pending={!baseline} label={lv ? 'Salīdzināts ar manu drukas profilu' : 'Compared with my print profile'} detail={baseline ? `${changedCount} ${lv ? 'atšķirības atrastas' : 'differences found'}` : (lv ? 'Iestati vienu reizi zemāk' : 'Set it up once below')} />
              <CheckItem pending label={lv ? 'Geometry / G-code drošības audits' : 'Geometry / G-code safety audit'} detail={lv ? 'Vēl nav pieejams šajā versijā' : 'Not available in this version yet'} />
            </section>

            <div ref={guidedRef}>
              <GuidedProjectReview inspection={inspection} baseline={baseline} onBaselineChange={setBaseline} />
            </div>

            <div className="summary-grid">
              <StatusCard label={t('cards.printer')} value={`${printerValue}${nozzleSuffix}`} status={t('cards.compatible')} />
              <StatusCard label={t('cards.plate')} value={inspection.buildPlate || t('app.unknown')} status={t('cards.compatible')} />
              <StatusCard label={t('cards.filament')} value={primaryFilament ? `${primaryFilament.type}${inspection.filaments.length > 1 ? ` +${inspection.filaments.length - 1}` : ''}` : t('app.unknown')} status={inspection.filaments.length > 8 ? t('cards.check') : t('cards.compatible')} warning={inspection.filaments.length > 8} />
              <StatusCard label={t('cards.geometry')} value={`${inspection.objectCount} ${t('cards.objects').toLowerCase()}`} status={inspection.objectCount > 0 ? t('cards.compatible') : t('cards.check')} warning={inspection.objectCount === 0} />
            </div>

            <div className="content-grid">
              <section className="glass-panel settings-panel quick-settings-panel">
                <div className="panel-heading">
                  <div><span className="eyebrow">{lv ? 'KO ŠIS PROJEKTS IZMANTO' : 'WHAT THIS PROJECT USES'}</span><h2>{t('app.slicerSettings')}</h2><p className="panel-subtitle">{t('app.slicerSettingsHint')}</p></div>
                  <button className="ghost" onClick={() => setActiveView('settings')}><Sparkles size={14} /> {lv ? 'Izskaidrot iestatījumus' : 'Explain settings'}</button>
                </div>
                {inspection.settings.length > 0
                  ? inspection.settings.slice(0, 6).map((setting) => <SettingTerm key={setting.key} name={setting.label} translationKey={setting.tooltipKey} value={setting.value} />)
                  : <EmptyLine text={t('app.unknown')} />}
              </section>

              <section className="glass-panel dna-panel">
                <div className="panel-heading"><div><span className="eyebrow">VISUAL SIGNATURE</span><h2>Print DNA</h2></div><span className="badge">EXPERIMENTAL</span></div>
                <div className="dna-live-layout">
                  <PrintDna data={inspection.dna} />
                  <div className="dna-legend">
                    <p><b>{inspection.processProfile || t('app.projectFacts')}</b></p>
                    <p>{lv ? 'Ātrs vizuāls projekta rakstura kopsavilkums. Tas nav kvalitātes vai drošības vērtējums.' : 'A quick visual summary of the project character. It is not a quality or safety score.'}</p>
                  </div>
                </div>
              </section>
            </div>

            <section className="glass-panel notices-panel">
              <div className="panel-heading"><div><span className="eyebrow">{lv ? 'KO ATRADĀM' : 'WHAT WE FOUND'}</span><h2>{t('app.notices')}</h2></div><Archive size={18} /></div>
              {inspection.notices.length === 0
                ? <div className="notice-row info"><span className="notice-mark">✓</span><div><b>{t('app.noNotices')}</b><p>{t('app.preliminary')}</p></div></div>
                : inspection.notices.map((notice) => (
                  <div key={notice.id} className={`notice-row ${notice.severity}`}>
                    <span className="notice-mark">{notice.severity === 'critical' ? '×' : notice.severity === 'warning' ? '!' : 'i'}</span>
                    <div><b>{t(notice.titleKey, notice.values)}</b><p>{t(notice.detailKey, notice.values)}</p></div>
                  </div>
                ))}
            </section>

            <div className="lower-grid compact-lower-grid">
              <section className="glass-panel facts-panel">
                <div className="panel-heading"><div><span className="eyebrow">PROJECT MAP</span><h2>{t('app.projectFacts')}</h2></div><FileCode2 size={18} /></div>
                <FactRow label={t('app.process')} value={inspection.processProfile || t('app.unknown')} />
                <FactRow label={t('app.fileSize')} value={formatBytes(inspection.fileSize)} />
                <FactRow label={t('app.archive')} value={t('app.entries', { count: inspection.archiveEntryCount })} />
                <FactRow label="project_settings.config" value={t('app.settingsFound', { count: inspection.projectSettingsCount })} />
                <FactRow label="Geometry" value={`${inspection.objectCount} objects · ${t('app.parts', { count: inspection.partCount })}`} />
                <FactRow label="Plates" value={t('app.plates', { count: inspection.plateCount })} />
              </section>

              <section className="glass-panel filament-panel">
                <div className="panel-heading"><div><span className="eyebrow">MATERIAL MAP</span><h2>{t('app.filamentPalette')}</h2></div><Layers3 size={18} /></div>
                {inspection.filaments.length === 0
                  ? <EmptyLine text={t('app.noFilaments')} />
                  : inspection.filaments.slice(0, 8).map((filament) => <FilamentRow key={filament.index} filament={filament} />)}
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function SettingsView({ inspection }: { inspection: ThreeMfInspection }) {
  const { t, i18n } = useTranslation();
  const lv = i18n.language.startsWith('lv');
  return (
    <section className="settings-explain-view">
      <div className="settings-explain-hero glass-panel">
        <span className="eyebrow"><SlidersHorizontal size={14} /> {lv ? 'IESTATĪJUMI BEZ MINĒŠANAS' : 'SETTINGS WITHOUT GUESSING'}</span>
        <h1>{lv ? 'Ko šie iestatījumi dara reālajā drukā?' : 'What do these settings do in a real print?'}</h1>
        <p>{lv ? 'Slicer iestatījumu nosaukumi paliek angliski, lai tos vari atrast tieši Bambu Studio / OrcaSlicer. Paskaidrojumi ir tavā izvēlētajā valodā.' : 'Slicer setting names stay in English so you can find them directly in Bambu Studio / OrcaSlicer. Explanations follow your selected language.'}</p>
      </div>
      <section className="glass-panel settings-panel expanded-settings-panel">
        <div className="panel-heading"><div><span className="eyebrow">{t('app.extracted')}</span><h2>{t('app.slicerSettings')}</h2></div><span className="badge">{inspection.settings.length} VALUES</span></div>
        {inspection.settings.length > 0
          ? inspection.settings.map((setting) => <SettingTerm key={setting.key} name={setting.label} translationKey={setting.tooltipKey} value={setting.value} />)
          : <EmptyLine text={t('app.unknown')} />}
      </section>
    </section>
  );
}

function CheckItem({ ok = false, pending = false, label, detail }: { ok?: boolean; pending?: boolean; label: string; detail: string }) {
  return (
    <article className={`check-item ${pending ? 'pending' : ok ? 'ok' : 'bad'}`}>
      <span className="check-item-mark">{pending ? '?' : ok ? '✓' : '!'}</span>
      <div><strong>{label}</strong><small>{detail}</small></div>
    </article>
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
