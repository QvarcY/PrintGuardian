import { Clock3, Database, FileText, Layers3, Trash2, TriangleAlert } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProjectHistoryEntry } from '../lib/projectHistory';
import './HistoryPanel.css';

type Props = {
  entries: ProjectHistoryEntry[];
  onClear: () => void;
  onRemove: (id: string) => void;
  onBack: () => void;
};

function formatBytes(value: number, locale: string): string {
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024)).toLocaleString(locale)} KB`;
  return `${(value / (1024 * 1024)).toLocaleString(locale, { maximumFractionDigits: 1 })} MB`;
}

export function HistoryPanel({ entries, onClear, onRemove, onBack }: Props) {
  const { i18n } = useTranslation();
  const lv = i18n.language.startsWith('lv');
  const locale = lv ? 'lv-LV' : 'en-GB';
  const totalProjects = entries.length;
  const totalWarnings = useMemo(() => entries.reduce((sum, item) => sum + item.noticeCount, 0), [entries]);

  return (
    <section className="history-view">
      <div className="history-hero glass-panel">
        <div>
          <span className="eyebrow"><Clock3 size={14} /> {lv ? 'LOKĀLĀ PROJEKTU VĒSTURE' : 'LOCAL PROJECT HISTORY'}</span>
          <h1>{lv ? 'Vēsture' : 'History'}</h1>
          <p>{lv
            ? 'PrintGuardian saglabā nelielu lokālu kopsavilkumu par atvērtajiem 3MF projektiem. Paši vecie 3MF faili šajā vēsturē netiek dublēti.'
            : 'PrintGuardian stores a small local summary of opened 3MF projects. Older 3MF files themselves are not duplicated into this history.'}</p>
        </div>
        <button className="ghost" onClick={onBack}>{lv ? '← Atpakaļ uz projektu' : '← Back to project'}</button>
      </div>

      <div className="history-stats">
        <div className="glass-panel"><span>{lv ? 'Saglabāti ieraksti' : 'Stored entries'}</span><strong>{totalProjects}</strong></div>
        <div className="glass-panel"><span>{lv ? 'Uzmanības punkti kopā' : 'Attention items total'}</span><strong>{totalWarnings}</strong></div>
        <div className="glass-panel"><span>{lv ? 'Glabāšanas princips' : 'Storage model'}</span><strong>{lv ? 'Tikai lokāli' : 'Local only'}</strong></div>
      </div>

      <div className="history-list glass-panel">
        <div className="history-list-head">
          <div>
            <span className="eyebrow"><Database size={13} /> {lv ? 'PĒDĒJIE PROJEKTI' : 'RECENT PROJECTS'}</span>
            <h2>{lv ? 'Ko PrintGuardian ir pārbaudījis' : 'What PrintGuardian has inspected'}</h2>
          </div>
          {entries.length > 0 && <button className="ghost danger-ghost" onClick={onClear}><Trash2 size={14} /> {lv ? 'Notīrīt vēsturi' : 'Clear history'}</button>}
        </div>

        {entries.length === 0 ? (
          <div className="history-empty">
            <FileText size={24} />
            <strong>{lv ? 'Vēsture vēl ir tukša' : 'History is empty'}</strong>
            <span>{lv ? 'Atver reālu 3MF projektu, un pēc pārbaudes šeit parādīsies tā kopsavilkums.' : 'Open a real 3MF project and its inspection summary will appear here.'}</span>
          </div>
        ) : entries.map((entry) => (
          <article className="history-entry" key={entry.id}>
            <div className="history-entry-main">
              <span className="history-file-icon"><FileText size={17} /></span>
              <div className="history-entry-copy">
                <strong title={entry.fileName}>{entry.fileName}</strong>
                <span>{new Date(entry.openedAt).toLocaleString(locale)} · {formatBytes(entry.fileSize, locale)}</span>
              </div>
            </div>
            <div className="history-entry-facts">
              <span><b>{lv ? 'Printeris' : 'Printer'}</b>{entry.printerProfile || '—'}{entry.nozzleDiameter ? ` · ${entry.nozzleDiameter}` : ''}</span>
              <span><b>{lv ? 'Materiāls' : 'Material'}</b>{entry.filaments.length ? entry.filaments.join(', ') : '—'}</span>
              <span><b>{lv ? 'Modelis' : 'Model'}</b><Layers3 size={12} /> {entry.objectCount} {lv ? 'obj.' : 'obj.'} · {entry.plateCount} {lv ? 'plates' : 'plates'}</span>
              <span className={entry.noticeCount > 0 ? 'has-attention' : ''}><b>{lv ? 'Pārbaude' : 'Review'}</b><TriangleAlert size={12} /> {entry.noticeCount}</span>
            </div>
            <button className="icon-only history-remove" onClick={() => onRemove(entry.id)} title={lv ? 'Dzēst šo ierakstu' : 'Remove this entry'} aria-label={lv ? 'Dzēst šo ierakstu' : 'Remove this entry'}><Trash2 size={14} /></button>
          </article>
        ))}
      </div>

      <div className="history-privacy-note">
        <Database size={15} />
        <span>{lv
          ? 'Vēsture glabā tikai pārbaudes kopsavilkuma metadatus. Atsevišķi PrintGuardian joprojām glabā tikai viena pēdējā 3MF lokālu kopiju ātrai darba turpināšanai.'
          : 'History stores inspection-summary metadata only. Separately, PrintGuardian still keeps only one local copy of the latest 3MF for quick resume.'}</span>
      </div>
    </section>
  );
}
