import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock3, FolderOpen, Settings2, ShieldCheck, UserRoundCog } from 'lucide-react';
import { LanguageSwitch } from './components/LanguageSwitch';
import { UiScaleControl } from './components/UiScaleControl';
import { DropZone } from './components/DropZone';
import { SupportProject } from './components/SupportProject';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { loadProfileBaseline, type SavedProfileBaseline } from './lib/baselineProfile';
import { createDemoInspection, inspectThreeMf, type ThreeMfInspection } from './lib/threeMfInspector';

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
          <UiScaleControl />
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

function Dashboard({ inspection }: { inspection: ThreeMfInspection }) {
  const { t, i18n } = useTranslation();
  const lv = i18n.language.startsWith('lv');
  const [profile, setProfile] = useState<SavedProfileBaseline | null>(() => loadProfileBaseline());

  return (
    <main className="workspace">
      <aside className="sidebar simplified-sidebar app-level-sidebar">
        <nav>
          <button className="selected"><FolderOpen size={17} /><span>{lv ? 'Pašreizējais projekts' : 'Current project'}</span></button>
          <button disabled title={lv ? 'Vairāku profilu pārvaldība sekos nākamajā posmā.' : 'Multi-profile management will follow in a later stage.'}><UserRoundCog size={17} /><span>{lv ? 'Mani drukas profili' : 'My print profiles'}</span><small>{lv ? 'drīzumā' : 'soon'}</small></button>
          <button disabled><Clock3 size={17} /><span>{lv ? 'Vēsture' : 'History'}</span><small>{lv ? 'drīzumā' : 'soon'}</small></button>
          <button disabled><Settings2 size={17} /><span>{lv ? 'Iestatījumi' : 'Settings'}</span><small>{lv ? 'drīzumā' : 'soon'}</small></button>
        </nav>
        <div className="sidebar-bottom">
          <SupportProject />
          <div className="author-card"><span className="mini-logo">PG</span><div><b>{t('app.author')}</b><small>kas.id.lv · craftin.lv</small></div></div>
        </div>
      </aside>
      <section className="dashboard workspace-dashboard">
        <ProjectWorkspace inspection={inspection} profile={profile} onProfileChange={setProfile} />
      </section>
    </main>
  );
}

export default App;
