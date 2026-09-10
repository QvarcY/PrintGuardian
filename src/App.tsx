import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock3, FolderOpen, Settings2, ShieldCheck, UserRoundCog } from 'lucide-react';
import { LanguageSwitch } from './components/LanguageSwitch';
import { UiScaleControl } from './components/UiScaleControl';
import { DesktopEditionBadge } from './components/DesktopEditionBadge';
import { UpdateCentreButton } from './components/UpdateCentreButton';
import { DropZone } from './components/DropZone';
import { SupportProject } from './components/SupportProject';
import { FeedbackButton } from './components/FeedbackButton';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { PrintProfilesPanel } from './components/PrintProfilesPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { createProfileBaseline, type SavedProfileBaseline } from './lib/baselineProfile';
import {
  addPrintProfile,
  loadPrintProfileLibrary,
  removePrintProfile,
  renamePrintProfile,
  replacePrintProfile,
  selectPrintProfile,
  type NamedPrintProfile,
  type PrintProfileLibrary,
} from './lib/printProfiles';
import { createDemoInspection, inspectThreeMf, type ThreeMfInspection } from './lib/threeMfInspector';
import { clearProjectHistory, loadProjectHistory, recordProjectInspection, removeProjectHistoryEntry, type ProjectHistoryEntry } from './lib/projectHistory';
import { initializeFeatureDiscovery, markFeatureSeen, type FeatureId } from './lib/featureDiscovery';
import { getDesktopRuntimeInfo } from './lib/desktopRuntime';
import {
  loadRecentProjectFile,
  loadRecentProjectMetadata,
  removeRecentProject,
  saveRecentProject,
  type RecentProjectMetadata,
} from './lib/recentProject';

function App() {
  const { t } = useTranslation();
  const [inspection, setInspection] = useState<ThreeMfInspection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentProject, setRecentProject] = useState<RecentProjectMetadata | null>(null);
  const [historyEntries, setHistoryEntries] = useState<ProjectHistoryEntry[]>(() => loadProjectHistory());
  const [newFeatures, setNewFeatures] = useState<FeatureId[]>([]);
  const [runtimeVersion, setRuntimeVersion] = useState('0.3.0-preview.1');
  const [showUpdatedNotice, setShowUpdatedNotice] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([loadRecentProjectMetadata(), getDesktopRuntimeInfo()]).then(([metadata, runtime]) => {
      if (!active) return;
      setRecentProject(metadata);
      const version = runtime.desktop ? runtime.version : '0.3.0-preview.1';
      setRuntimeVersion(version);
      const discovery = initializeFeatureDiscovery(version, Boolean(metadata));
      setNewFeatures(discovery.newFeatures);
      setShowUpdatedNotice(discovery.newFeatures.length > 0);
    });
    return () => { active = false; };
  }, []);

  const reset = () => {
    setInspection(null);
    setError(null);
    setBusy(false);
  };

  const openFile = async (file: File, remember = true) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.3mf')) {
      setError(t('app.unsupported'));
      return;
    }
    setBusy(true);
    try {
      const inspected = await inspectThreeMf(file);
      setInspection(inspected);
      setHistoryEntries(recordProjectInspection(inspected));
      if (remember) {
        try {
          setRecentProject(await saveRecentProject(file));
        } catch (storageError) {
          console.warn('PrintGuardian could not cache the recent project for one-click reopening.', storageError);
        }
      }
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : String(reason);
      console.error(reason);
      setError(`${t('app.invalid3mf')} ${detail}`);
    } finally {
      setBusy(false);
    }
  };

  const continueRecentProject = async () => {
    setError(null);
    setBusy(true);
    try {
      const file = await loadRecentProjectFile();
      if (!file) {
        setRecentProject(null);
        setError(t('app.recentMissing'));
        return;
      }
      await openFile(file, false);
    } catch (reason) {
      console.error(reason);
      setError(t('app.recentMissing'));
    } finally {
      setBusy(false);
    }
  };

  const forgetRecentProject = async () => {
    try { await removeRecentProject(); }
    catch (reason) { console.warn('PrintGuardian could not remove the recent-project cache.', reason); }
    setRecentProject(null);
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
          <DesktopEditionBadge />
          <UpdateCentreButton />
          <SupportProject prominent />
          <FeedbackButton />
          <UiScaleControl />
          <LanguageSwitch />
        </div>
      </header>

      {showUpdatedNotice && newFeatures.includes('history') && (
        <div className="feature-release-toast" role="status">
          <Clock3 size={18} />
          <div><strong>{t('app.updatedTitle')}</strong><span>{t('app.historyNowAvailable')}</span></div>
          <button className="icon-only" onClick={() => setShowUpdatedNotice(false)} aria-label={t('app.dismiss')}>×</button>
        </div>
      )}

      {!inspection
        ? <DropZone
            onFile={openFile}
            onDemo={() => setInspection(createDemoInspection())}
            busy={busy}
            error={error}
            recentProject={recentProject}
            onContinueRecent={() => void continueRecentProject()}
            onForgetRecent={() => void forgetRecentProject()}
          />
        : <Dashboard
            inspection={inspection}
            historyEntries={historyEntries}
            newFeatures={newFeatures}
            onFeatureSeen={(feature) => {
              markFeatureSeen(feature, runtimeVersion);
              setNewFeatures((items) => items.filter((item) => item !== feature));
              if (feature === 'history') setShowUpdatedNotice(false);
            }}
            onClearHistory={() => setHistoryEntries(clearProjectHistory())}
            onRemoveHistory={(id) => setHistoryEntries(removeProjectHistoryEntry(id))}
          />}

      <footer className="footer">
        <span>{t('app.prototype')}</span>
        <span className="footer-right">© 2026 <b>CraftIN / QvarcY</b> · kas.id.lv · craftin.lv <SupportProject compact /></span>
      </footer>
    </div>
  );
}

type DashboardView = 'project' | 'profiles' | 'history' | 'settings';

function Dashboard({ inspection, historyEntries, newFeatures, onFeatureSeen, onClearHistory, onRemoveHistory }: {
  inspection: ThreeMfInspection;
  historyEntries: ProjectHistoryEntry[];
  newFeatures: FeatureId[];
  onFeatureSeen: (feature: FeatureId) => void;
  onClearHistory: () => void;
  onRemoveHistory: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const lv = i18n.language.startsWith('lv');
  const [library, setLibrary] = useState<PrintProfileLibrary>(() => loadPrintProfileLibrary());
  const [view, setView] = useState<DashboardView>('project');
  const [profileBusy, setProfileBusy] = useState(false);

  const activeNamedProfile = useMemo<NamedPrintProfile | null>(
    () => library.profiles.find((profile) => profile.id === library.activeId) ?? null,
    [library],
  );
  const activeProfile = activeNamedProfile?.snapshot ?? null;

  const updateFromWorkspace = (snapshot: SavedProfileBaseline | null) => {
    if (!snapshot) {
      if (!library.activeId) return;
      setLibrary(removePrintProfile(library.activeId));
      return;
    }
    setLibrary(library.activeId ? replacePrintProfile(library.activeId, snapshot) : addPrintProfile(snapshot));
  };

  const addProfileFile = async (file: File) => {
    setProfileBusy(true);
    try {
      const inspected = await inspectThreeMf(file);
      setLibrary(addPrintProfile(createProfileBaseline(inspected)));
    } catch (reason) {
      console.error(reason);
      window.alert(lv ? 'Šo 3MF neizdevās pievienot kā drukas profilu.' : 'This 3MF could not be added as a print profile.');
    } finally {
      setProfileBusy(false);
    }
  };

  const selectProfile = (id: string) => setLibrary(selectPrintProfile(id));
  const renameProfile = (id: string, name: string) => setLibrary(renamePrintProfile(id, name));
  const openView = (next: DashboardView) => {
    setView(next);
    if (next === 'history' && newFeatures.includes('history')) onFeatureSeen('history');
  };

  const deleteProfile = (id: string) => {
    const item = library.profiles.find((profile) => profile.id === id);
    if (!item) return;
    if (!window.confirm(lv ? `Dzēst drukas profilu “${item.name}”?` : `Remove print profile “${item.name}”?`)) return;
    setLibrary(removePrintProfile(id));
  };

  return (
    <main className="workspace">
      <aside className="sidebar simplified-sidebar app-level-sidebar">
        <nav>
          <button className={view === 'project' ? 'selected' : ''} onClick={() => openView('project')}><FolderOpen size={17} /><span>{lv ? 'Pašreizējais projekts' : 'Current project'}</span></button>
          <button className={view === 'profiles' ? 'selected' : ''} onClick={() => openView('profiles')}><UserRoundCog size={17} /><span>{lv ? 'Mani drukas profili' : 'My print profiles'}</span>{library.profiles.length > 0 && <small>{library.profiles.length}</small>}</button>
          <button className={view === 'history' ? 'selected' : ''} onClick={() => openView('history')}><Clock3 size={17} /><span>{lv ? 'Vēsture' : 'History'}</span>{newFeatures.includes('history') && <small className="new-badge">NEW</small>}</button>
          <button className={view === 'settings' ? 'selected' : ''} onClick={() => openView('settings')}><Settings2 size={17} /><span>{lv ? 'Iestatījumi' : 'Settings'}</span><small className="soon-badge">{lv ? 'drīzumā' : 'soon'}</small></button>
        </nav>
        <div className="sidebar-bottom">
          <SupportProject />
          <div className="author-card"><span className="mini-logo">PG</span><div><b>{t('app.author')}</b><small>kas.id.lv · craftin.lv</small></div></div>
        </div>
      </aside>
      <section className="dashboard workspace-dashboard">
        {view === 'project' ? (
          <ProjectWorkspace
            inspection={inspection}
            profile={activeProfile}
            profileName={activeNamedProfile?.name}
            onProfileChange={updateFromWorkspace}
            onManageProfiles={() => openView('profiles')}
          />
        ) : view === 'profiles' ? (
          <PrintProfilesPanel
            profiles={library.profiles}
            activeId={library.activeId}
            busy={profileBusy}
            onAddFile={addProfileFile}
            onSelect={selectProfile}
            onRename={renameProfile}
            onRemove={deleteProfile}
            onBack={() => openView('project')}
          />
        ) : view === 'history' ? (
          <HistoryPanel
            entries={historyEntries}
            onClear={() => {
              if (window.confirm(lv ? 'Notīrīt visu lokālo projektu vēsturi?' : 'Clear all local project history?')) onClearHistory();
            }}
            onRemove={onRemoveHistory}
            onBack={() => openView('project')}
          />
        ) : (
          <ComingSoonPanel kind="settings" onBack={() => openView('project')} />
        )}
      </section>
    </main>
  );
}

function ComingSoonPanel({ kind, onBack }: { kind: 'settings'; onBack: () => void }) {
  const { i18n } = useTranslation();
  const lv = i18n.language.startsWith('lv');
  const title = lv ? 'Iestatījumi' : 'Settings';
  const description = lv ? 'Šeit būs PrintGuardian uzvedības, privātuma, atjauninājumu un citi aplikācijas iestatījumi.' : 'This area will contain PrintGuardian behaviour, privacy, update and other application settings.';
  return (
    <section className="coming-soon-view glass-panel">
      <span className="eyebrow">{lv ? 'PLĀNOTA FUNKCIJA' : 'PLANNED FEATURE'} · {lv ? 'DRĪZUMĀ' : 'COMING SOON'}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="coming-soon-update-note">
        <ShieldCheck size={18} />
        <div>
          <strong>{lv ? 'Atjauninājumu paziņojumi' : 'Update notifications'}</strong>
          <span>{lv ? 'Kad šī funkcija kļūs pieejama jaunā laidienā, PrintGuardian atjauninājumu centrs to varēs izcelt kā jaunumu. Šis marķējums paliek redzams apzināti, lai varētu testēt šo plūsmu.' : 'When this feature becomes available in a newer release, PrintGuardian can surface it through the update centre. This marker intentionally stays visible so the flow can be tested.'}</span>
        </div>
      </div>
      <button className="ghost" onClick={onBack}>{lv ? '← Atpakaļ uz projektu' : '← Back to project'}</button>
    </section>
  );
}

export default App;
