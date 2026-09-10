import { Bell, Check, CircleAlert, CloudDownload, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { getDesktopRuntimeInfo, openExternalUrl, type DesktopRuntimeInfo } from '../lib/desktopRuntime';
import {
  checkPublishedUpdates,
  createSimulatedUpdate,
  loadUpdatePreferences,
  saveUpdatePreferences,
  shouldRunAutomaticCheck,
  type UpdateCandidate,
  type UpdatePreferences,
} from '../lib/updateCenter';

export function UpdateCentreButton() {
  const { i18n } = useTranslation();
  const lv = i18n.language.startsWith('lv');
  const [runtime, setRuntime] = useState<DesktopRuntimeInfo | null>(null);
  const [preferences, setPreferences] = useState<UpdatePreferences>(() => loadUpdatePreferences());
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const candidate = useMemo(() => {
    if (!runtime || !preferences.cachedCandidate) return null;
    if (preferences.dismissedVersion === preferences.cachedCandidate.version) return null;
    return preferences.cachedCandidate;
  }, [preferences, runtime]);

  const persist = (next: UpdatePreferences) => {
    setPreferences(saveUpdatePreferences(next));
  };

  const runCheck = async (info = runtime) => {
    if (!info?.desktop || checking) return;
    setChecking(true);
    setMessage(null);
    try {
      const checked = await checkPublishedUpdates(info.version, preferences.channel);
      const next = {
        ...preferences,
        lastCheckedAt: new Date().toISOString(),
        lastResult: checked.result,
        cachedCandidate: checked.candidate,
        dismissedVersion: checked.candidate?.version === preferences.dismissedVersion ? preferences.dismissedVersion : null,
      } satisfies UpdatePreferences;
      persist(next);
      setMessage(checked.result === 'available'
        ? (lv ? 'Atrasts jaunāks PrintGuardian laidiens.' : 'A newer PrintGuardian release was found.')
        : checked.result === 'no-releases'
          ? (lv ? 'GitHub vēl nav publicētu PrintGuardian laidienu.' : 'There are no published PrintGuardian releases on GitHub yet.')
          : (lv ? 'Tev ir jaunākais šī kanāla laidiens.' : 'You are on the newest release for this channel.'));
    } catch (error) {
      console.warn('PrintGuardian update check failed.', error);
      persist({ ...preferences, lastCheckedAt: new Date().toISOString(), lastResult: 'error' });
      setMessage(lv ? 'Atjauninājumu pārbaude neizdevās. Drukas faili netika sūtīti internetā.' : 'The update check failed. No print files were sent online.');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    let active = true;
    void getDesktopRuntimeInfo().then((info) => {
      if (!active || !info.desktop) return;
      setRuntime(info);
      const loaded = loadUpdatePreferences(info.version);
      setPreferences(loaded);
      if (shouldRunAutomaticCheck(loaded)) {
        void checkPublishedUpdates(info.version, loaded.channel).then((checked) => {
          if (!active) return;
          setPreferences(saveUpdatePreferences({
            ...loaded,
            lastCheckedAt: new Date().toISOString(),
            lastResult: checked.result,
            cachedCandidate: checked.candidate,
            dismissedVersion: checked.candidate?.version === loaded.dismissedVersion ? loaded.dismissedVersion : null,
          }));
        }).catch((error) => {
          console.warn('PrintGuardian automatic update check failed.', error);
          if (active) setPreferences(saveUpdatePreferences({ ...loaded, lastCheckedAt: new Date().toISOString(), lastResult: 'error' }));
        });
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!runtime?.desktop) return null;

  const portable = runtime.distribution === 'portable';
  const storageText = runtime.storageScope === 'portable'
    ? (lv ? 'Portable dati paliek kopā ar izpakoto mapi.' : 'Portable data stays with the extracted folder.')
    : runtime.storageScope === 'portable-fallback'
      ? (lv ? 'Portable mape nebija rakstāma; dati īslaicīgi glabājas Windows Local AppData.' : 'The portable folder was not writable; data is temporarily using Windows Local AppData.')
      : (lv ? 'Dati glabājas Windows Local AppData lietotnes mapē.' : 'Data is stored in the app’s Windows Local AppData folder.');

  const simulate = () => {
    const simulated = createSimulatedUpdate(runtime.version);
    persist({ ...preferences, lastResult: 'available', cachedCandidate: simulated, dismissedVersion: null });
    setMessage(lv ? 'Testa atjauninājuma paziņojums ir ieslēgts.' : 'The test update notification is now active.');
    setOpen(false);
  };

  const dismiss = () => {
    if (!candidate) return;
    persist({ ...preferences, dismissedVersion: candidate.version });
  };

  const openCandidate = async (item: UpdateCandidate) => {
    await openExternalUrl(item.downloadUrl || item.releaseUrl);
  };

  return (
    <div className="update-centre-wrap">
      <button
        className={`update-centre-trigger ${candidate ? 'has-update' : ''}`}
        onClick={() => setOpen((value) => !value)}
        title={lv ? 'Atjauninājumu centrs' : 'Update Centre'}
      >
        <Bell size={15} />
        <span>{candidate ? (lv ? 'Atjauninājums' : 'Update') : (lv ? 'Atjauninājumi' : 'Updates')}</span>
        {candidate && <small>1</small>}
      </button>

      {candidate && !open && (
        <div className="update-toast" role="status">
          <CloudDownload size={17} />
          <div>
            <strong>{lv ? `Pieejams v${candidate.version}` : `v${candidate.version} available`}</strong>
            <span>{candidate.simulated ? (lv ? 'Testa paziņojums' : 'Test notification') : (lv ? 'Atver, lai apskatītu jaunumu.' : 'Open to review the release.')}</span>
          </div>
          <button onClick={() => setOpen(true)}>{lv ? 'Skatīt' : 'View'}</button>
          <button className="icon-only" onClick={dismiss} aria-label={lv ? 'Paslēpt paziņojumu' : 'Dismiss notification'}><X size={14} /></button>
        </div>
      )}

      {open && createPortal(
        <div className="update-centre-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="update-centre-popover" role="dialog" aria-modal="true" aria-label={lv ? 'Atjauninājumu centrs' : 'Update Centre'}>
          <div className="update-centre-head">
            <div>
              <span className="eyebrow"><ShieldCheck size={13} /> {lv ? 'ATJAUNINĀJUMU CENTRS' : 'UPDATE CENTRE'}</span>
              <h3>{candidate ? (lv ? 'Ir pieejams jaunāks laidiens' : 'A newer release is available') : (lv ? 'PrintGuardian atjauninājumi' : 'PrintGuardian updates')}</h3>
            </div>
            <button className="icon-only" onClick={() => setOpen(false)} aria-label={lv ? 'Aizvērt' : 'Close'}><X size={16} /></button>
          </div>

          <div className="update-runtime-grid">
            <div><span>{lv ? 'Pašreizējā versija' : 'Current version'}</span><strong>v{runtime.version}</strong></div>
            <div><span>{lv ? 'Izplatīšana' : 'Distribution'}</span><strong>{portable ? 'Portable' : (lv ? 'Instalētā' : 'Installed')}</strong></div>
            <div><span>{lv ? 'Kanāls' : 'Channel'}</span><strong>{preferences.channel === 'preview' ? 'Preview' : 'Stable'}</strong></div>
            <div><span>{lv ? 'Pēdējā pārbaude' : 'Last check'}</span><strong>{preferences.lastCheckedAt ? new Date(preferences.lastCheckedAt).toLocaleString(lv ? 'lv-LV' : 'en-GB') : '—'}</strong></div>
          </div>

          <div className="update-preferences-row">
            <label>
              <input
                type="checkbox"
                checked={preferences.automaticChecks}
                onChange={(event) => persist({ ...preferences, automaticChecks: event.target.checked })}
              />
              <span>{lv ? 'Automātiski pārbaudīt ne biežāk kā reizi 12 stundās' : 'Automatically check at most once every 12 hours'}</span>
            </label>
            <div className="update-channel-switch" aria-label={lv ? 'Atjauninājumu kanāls' : 'Update channel'}>
              <button className={preferences.channel === 'preview' ? 'active' : ''} onClick={() => persist({ ...preferences, channel: 'preview', cachedCandidate: null, dismissedVersion: null, lastResult: 'never' })}>Preview</button>
              <button className={preferences.channel === 'stable' ? 'active' : ''} onClick={() => persist({ ...preferences, channel: 'stable', cachedCandidate: null, dismissedVersion: null, lastResult: 'never' })}>Stable</button>
            </div>
          </div>

          {candidate ? (
            <div className="update-candidate">
              <div className="update-candidate-title"><CloudDownload size={18} /><div><strong>v{candidate.version}</strong><span>{candidate.name}</span></div></div>
              {candidate.notes && <p>{candidate.notes}</p>}
              {candidate.highlights?.length ? <ul>{candidate.highlights.map((item) => <li key={item}>{item}</li>)}</ul> : null}
              <div className="update-actions">
                <button className="primary" onClick={() => void openCandidate(candidate)}>{candidate.simulated ? (lv ? 'Atvērt laidienu lapu' : 'Open releases page') : portable ? (lv ? 'Atvērt lejupielādi' : 'Open download') : (lv ? 'Atvērt laidiena lapu' : 'Open release page')}</button>
                <button className="ghost" onClick={dismiss}>{lv ? 'Paslēpt šo paziņojumu' : 'Dismiss this notification'}</button>
              </div>
              {!candidate.simulated && !portable && <small>{lv ? 'Automātiska instalēšana vēl nav ieslēgta: publiskajam updateram nepieciešami parakstīti Tauri artefakti.' : 'Automatic installation is not enabled yet: the public updater requires signed Tauri artifacts.'}</small>}
            </div>
          ) : (
            <div className="update-empty-state">
              {preferences.lastResult === 'current' ? <Check size={20} /> : <CircleAlert size={20} />}
              <div><strong>{message || (lv ? 'Pārbaudi GitHub laidienus, kad vēlies.' : 'Check GitHub releases whenever you want.')}</strong><span>{lv ? 'Atjauninājumu pārbaude nosūta tikai versijas/kanāla pieprasījumu. 3MF saturs, profili un iestatījumi netiek augšupielādēti.' : 'The update check only requests release metadata. 3MF content, profiles and settings are not uploaded.'}</span></div>
            </div>
          )}

          <div className="update-storage-card">
            <div><strong>{lv ? 'Lokālā datu krātuve' : 'Local data storage'}</strong><span>{storageText}</span></div>
            <code>{runtime.portableDataDirectory || runtime.dataDirectory || '—'}</code>
          </div>

          <div className="update-centre-footer">
            <button className="ghost" onClick={() => void runCheck()} disabled={checking}><RefreshCw size={14} className={checking ? 'spin' : ''} /> {checking ? (lv ? 'Pārbauda…' : 'Checking…') : (lv ? 'Pārbaudīt tagad' : 'Check now')}</button>
            {runtime.version.includes('-dev.') && <button className="ghost dev-update-test" onClick={simulate}>{lv ? 'Izmēģināt testa paziņojumu' : 'Test update notification'}</button>}
          </div>
          {message && candidate && <p className="update-inline-message">{message}</p>}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
