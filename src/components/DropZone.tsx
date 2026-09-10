import { FileText, FileUp, ShieldCheck, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RecentProjectMetadata } from '../lib/recentProject';

type Props = {
  onFile: (file: File) => void;
  onDemo: () => void;
  busy?: boolean;
  error?: string | null;
  recentProject?: RecentProjectMetadata | null;
  onContinueRecent?: () => void;
  onForgetRecent?: () => void;
};

function formatBytes(value: number, locale: string): string {
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024)).toLocaleString(locale)} KB`;
  return `${(value / (1024 * 1024)).toLocaleString(locale, { maximumFractionDigits: 1 })} MB`;
}

export function DropZone({ onFile, onDemo, busy = false, error, recentProject, onContinueRecent, onForgetRecent }: Props) {
  const { t, i18n } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const locale = i18n.language.startsWith('lv') ? 'lv-LV' : 'en-GB';

  const acceptFile = (file?: File) => {
    if (!file || busy) return;
    onFile(file);
  };

  return (
    <main className="landing-shell">
      <section
        className={`drop-zone ${dragging ? 'dragging' : ''} ${busy ? 'busy' : ''}`}
        onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          acceptFile(e.dataTransfer.files[0]);
        }}
      >
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className={`drop-icon ${busy ? 'scanning' : ''}`}><FileUp size={29} /></div>
        <div className="eyebrow"><ShieldCheck size={15} /> PRINTGUARDIAN PREFLIGHT</div>
        <h1>{busy ? t('app.analyzing') : t('app.dropTitle')}</h1>
        <p>{busy ? t('app.analyzingHint') : t('app.dropHint')}</p>
        <div className="drop-actions">
          <button className="primary" disabled={busy} onClick={() => input.current?.click()}>{t('app.browse')}</button>
          <button className="ghost" disabled={busy} onClick={onDemo}>{t('app.demo')}</button>
        </div>

        {recentProject && !busy && (
          <div className="recent-project-card">
            <span className="recent-project-icon"><FileText size={18} /></span>
            <div className="recent-project-copy">
              <span>{t('app.recentProject')}</span>
              <strong title={recentProject.name}>{recentProject.name}</strong>
              <small>{formatBytes(recentProject.size, locale)} · {new Date(recentProject.savedAt).toLocaleString(locale)}</small>
            </div>
            <button className="recent-project-open" onClick={onContinueRecent}>{t('app.continueRecent')}</button>
            <button className="icon-only recent-project-forget" onClick={onForgetRecent} title={t('app.forgetRecent')} aria-label={t('app.forgetRecent')}><X size={14} /></button>
          </div>
        )}

        {error ? <div className="load-error">{error}</div> : <small>{t('app.localOnly')}</small>}
        <input
          ref={input}
          hidden
          type="file"
          accept=".3mf"
          onChange={(e) => acceptFile(e.target.files?.[0])}
        />
      </section>
    </main>
  );
}
