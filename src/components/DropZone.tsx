import { FileUp, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  onFile: (file: File) => void;
  onDemo: () => void;
  busy?: boolean;
  error?: string | null;
};

export function DropZone({ onFile, onDemo, busy = false, error }: Props) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

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
