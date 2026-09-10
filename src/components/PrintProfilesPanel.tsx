import { useRef, useState } from 'react';
import { CheckCircle2, FileUp2, Pencil, Save, Trash2, UserRoundCog, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { NamedPrintProfile } from '../lib/printProfiles';
import './PrintProfilesPanel.css';

export function PrintProfilesPanel({
  profiles,
  activeId,
  busy,
  onAddFile,
  onSelect,
  onRename,
  onRemove,
  onBack,
}: {
  profiles: NamedPrintProfile[];
  activeId: string | null;
  busy: boolean;
  onAddFile: (file: File) => void;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onBack: () => void;
}) {
  const { i18n } = useTranslation();
  const lv = i18n.language.startsWith('lv');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const startRename = (profile: NamedPrintProfile) => {
    setEditingId(profile.id);
    setDraft(profile.name);
  };

  const commitRename = () => {
    if (!editingId || !draft.trim()) return;
    onRename(editingId, draft.trim());
    setEditingId(null);
    setDraft('');
  };

  return (
    <section className="print-profiles-page">
      <div className="profiles-hero glass-panel">
        <div>
          <span className="eyebrow"><UserRoundCog size={15} /> {lv ? 'MANI DRUKAS PROFILI' : 'MY PRINT PROFILES'}</span>
          <h1>{lv ? 'Tavi pārbaudītie atskaites profili' : 'Your trusted reference profiles'}</h1>
          <p>{lv
            ? 'Saglabā atsevišķus profilus dažādiem printeriem, nozzle izmēriem un materiāliem. PrintGuardian salīdzina atvērto 3MF ar aktīvo profilu, bet pats projekts tiek analizēts arī bez profila.'
            : 'Keep separate profiles for different printers, nozzle sizes and materials. PrintGuardian compares an opened 3MF with the active profile, while still analyzing the project even without one.'}</p>
        </div>
        <div className="profiles-hero-actions">
          <button className="ghost" onClick={onBack}>{lv ? 'Atpakaļ uz projektu' : 'Back to project'}</button>
          <button className="primary" onClick={() => inputRef.current?.click()} disabled={busy}><FileUp2 size={15} /> {busy ? (lv ? 'Nolasa…' : 'Reading…') : (lv ? 'Pievienot profilu no 3MF' : 'Add profile from 3MF')}</button>
          <input ref={inputRef} hidden type="file" accept=".3mf" onChange={(event) => { const file = event.target.files?.[0]; if (file) onAddFile(file); event.currentTarget.value = ''; }} />
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="profiles-empty glass-panel">
          <UserRoundCog size={30} />
          <h2>{lv ? 'Vēl nav neviena drukas profila' : 'No print profiles yet'}</h2>
          <p>{lv ? 'Pievieno vienu uzticamu 3MF, kuru esi veiksmīgi izmantojis savā printerī. To varēsi vēlāk pārdēvēt, nomainīt vai dzēst.' : 'Add a trusted 3MF that has worked well on your printer. You can rename, replace or remove it later.'}</p>
          <button className="primary" onClick={() => inputRef.current?.click()}><FileUp2 size={15} /> {lv ? 'Pievienot pirmo profilu' : 'Add first profile'}</button>
        </div>
      ) : (
        <div className="profiles-grid">
          {profiles.map((profile) => {
            const active = profile.id === activeId;
            const printer = profile.snapshot.profile.printerModel || profile.snapshot.profile.printerProfile || '—';
            const nozzle = profile.snapshot.profile.nozzleDiameter ? `${profile.snapshot.profile.nozzleDiameter} mm` : '—';
            const process = profile.snapshot.profile.processProfile || '—';
            return (
              <article key={profile.id} className={`profile-library-card glass-panel${active ? ' active' : ''}`}>
                <div className="profile-library-head">
                  <div className="profile-name-wrap">
                    {editingId === profile.id ? (
                      <div className="profile-name-editor">
                        <input value={draft} autoFocus onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') commitRename(); if (event.key === 'Escape') setEditingId(null); }} />
                        <button onClick={commitRename} title={lv ? 'Saglabāt' : 'Save'}><Save size={14} /></button>
                        <button onClick={() => setEditingId(null)} title={lv ? 'Atcelt' : 'Cancel'}><X size={14} /></button>
                      </div>
                    ) : <h2>{profile.name}</h2>}
                    {active && <span className="active-profile-badge"><CheckCircle2 size={13} /> {lv ? 'AKTĪVS' : 'ACTIVE'}</span>}
                  </div>
                  <div className="profile-card-actions">
                    <button className="ghost" onClick={() => startRename(profile)} title={lv ? 'Pārdēvēt' : 'Rename'}><Pencil size={14} /></button>
                    <button className="ghost danger" onClick={() => onRemove(profile.id)} title={lv ? 'Dzēst' : 'Remove'}><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="profile-facts">
                  <div><span>Printer</span><strong>{printer}</strong></div>
                  <div><span>Nozzle</span><strong>{nozzle}</strong></div>
                  <div><span>Process</span><strong>{process}</strong></div>
                  <div><span>{lv ? 'Avots' : 'Source'}</span><strong>{profile.snapshot.sourceFileName}</strong></div>
                </div>

                <div className="profile-library-footer">
                  <small>{lv ? 'Saglabāti tikai nolasītie profila dati — pats 3MF fails netiek glabāts.' : 'Only extracted profile data is stored — the 3MF file itself is not kept.'}</small>
                  <button className={active ? 'ghost selected' : 'primary'} disabled={active} onClick={() => onSelect(profile.id)}>{active ? (lv ? 'Šis profils tiek izmantots' : 'This profile is in use') : (lv ? 'Izmantot šo profilu' : 'Use this profile')}</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
