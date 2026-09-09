import { FileUp, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Props = { onLoad: (name?: string) => void };

export function DropZone({ onLoad }: Props) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <main className="landing-shell">
      <section
        className={`drop-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) onLoad(file.name);
        }}
      >
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className="drop-icon"><FileUp size={29} /></div>
        <div className="eyebrow"><ShieldCheck size={15} /> PRINTGUARDIAN PREFLIGHT</div>
        <h1>{t('app.dropTitle')}</h1>
        <p>{t('app.dropHint')}</p>
        <div className="drop-actions">
          <button className="primary" onClick={() => input.current?.click()}>{t('app.browse')}</button>
          <button className="ghost" onClick={() => onLoad('gearbox-demo.3mf')}>{t('app.demo')}</button>
        </div>
        <small>{t('app.localOnly')}</small>
        <input
          ref={input}
          hidden
          type="file"
          accept=".3mf,.gcode,.bgcode"
          onChange={(e) => e.target.files?.[0] && onLoad(e.target.files[0].name)}
        />
      </section>
    </main>
  );
}
