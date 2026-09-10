import { Bug, ExternalLink, Lightbulb, MessageSquarePlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { getDesktopRuntimeInfo, openExternalUrl, type DesktopRuntimeInfo } from '../lib/desktopRuntime';

type FeedbackKind = 'bug' | 'idea';

const ISSUE_URL = 'https://github.com/QvarcY/PrintGuardian/issues/new';

function buildIssueUrl(kind: FeedbackKind, runtime: DesktopRuntimeInfo | null, lv: boolean): string {
  const version = runtime?.desktop ? `v${runtime.version}` : 'browser-preview';
  const distribution = runtime?.desktop
    ? runtime.distribution === 'portable' ? 'Portable' : 'Installed'
    : 'Browser preview';

  const isBug = kind === 'bug';
  const title = isBug ? `[Bug] ${version} — ` : `[Idea] ${version} — `;
  const body = isBug
    ? (lv
      ? `## Kas notika?\nApraksti problēmu.\n\n## Ko gaidīji?\nApraksti paredzēto rezultātu.\n\n## Kā atkārtot?\n1. \n2. \n3. \n\n## Vide\n- PrintGuardian: ${version}\n- Izplatīšana: ${distribution}\n- Windows versija: \n\n## Papildu informācija\nEkrānšāviņi vai nesensitīvs testa 3MF var palīdzēt, ja to drīksti publiski kopīgot. PrintGuardian pats failus šim ziņojumam nepievieno.`
      : `## What happened?\nDescribe the problem.\n\n## What did you expect?\nDescribe the expected result.\n\n## How can we reproduce it?\n1. \n2. \n3. \n\n## Environment\n- PrintGuardian: ${version}\n- Distribution: ${distribution}\n- Windows version: \n\n## Extra information\nScreenshots or a non-sensitive test 3MF can help if you are allowed to share it publicly. PrintGuardian does not attach files to this report automatically.`)
    : (lv
      ? `## Ideja\nApraksti, ko PrintGuardian vajadzētu darīt vai uzlabot.\n\n## Kāpēc tas būtu noderīgi?\nKādu reālu problēmu tas atrisinātu?\n\n## Kā tu to iedomājies?\nJa ir konkrēts darba scenārijs vai piemērs, apraksti to.\n\n## Vide\n- PrintGuardian: ${version}\n- Izplatīšana: ${distribution}`
      : `## Idea\nDescribe what PrintGuardian should add or improve.\n\n## Why would it help?\nWhat real problem would this solve?\n\n## How do you imagine it working?\nIf you have a concrete workflow or example, describe it.\n\n## Environment\n- PrintGuardian: ${version}\n- Distribution: ${distribution}`);

  const params = new URLSearchParams({ title, body });
  return `${ISSUE_URL}?${params.toString()}`;
}

export function FeedbackButton() {
  const { i18n } = useTranslation();
  const lv = i18n.language.startsWith('lv');
  const [open, setOpen] = useState(false);
  const [runtime, setRuntime] = useState<DesktopRuntimeInfo | null>(null);

  useEffect(() => {
    let active = true;
    void getDesktopRuntimeInfo().then((info) => { if (active) setRuntime(info); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const report = async (kind: FeedbackKind) => {
    try {
      await openExternalUrl(buildIssueUrl(kind, runtime, lv));
      setOpen(false);
    } catch (error) {
      console.warn('PrintGuardian could not open the GitHub feedback form.', error);
      window.alert(lv ? 'Neizdevās atvērt GitHub ziņojuma lapu.' : 'The GitHub feedback page could not be opened.');
    }
  };

  return (
    <>
      <button
        className="feedback-trigger"
        onClick={() => setOpen(true)}
        title={lv ? 'Ziņot par problēmu vai ieteikt uzlabojumu' : 'Report a problem or suggest an improvement'}
      >
        <MessageSquarePlus size={15} />
        <span>{lv ? 'Ziņot / ieteikt' : 'Report / suggest'}</span>
      </button>

      {open && createPortal(
        <div className="feedback-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="feedback-dialog" role="dialog" aria-modal="true" aria-label={lv ? 'Atsauksmes par PrintGuardian' : 'PrintGuardian feedback'}>
            <div className="feedback-head">
              <div>
                <span className="eyebrow"><MessageSquarePlus size={13} /> {lv ? 'ATSAUKSMES' : 'FEEDBACK'}</span>
                <h3>{lv ? 'Palīdzi uzlabot PrintGuardian' : 'Help improve PrintGuardian'}</h3>
                <p>{lv ? 'Izvēlies, ko vēlies nosūtīt. Tiks atvērts PrintGuardian GitHub issue ar sagatavotu struktūru.' : 'Choose what you want to send. A pre-filled PrintGuardian GitHub issue will open.'}</p>
              </div>
              <button className="icon-only" onClick={() => setOpen(false)} aria-label={lv ? 'Aizvērt' : 'Close'}><X size={16} /></button>
            </div>

            <div className="feedback-options">
              <button onClick={() => void report('bug')}>
                <span className="feedback-option-icon bug"><Bug size={20} /></span>
                <span><strong>{lv ? 'Ziņot par problēmu' : 'Report a problem'}</strong><small>{lv ? 'Kļūda, nepareizs rezultāts, fails neatveras vai kaut kas uzvedas dīvaini.' : 'A bug, wrong result, file that will not open, or something behaving unexpectedly.'}</small></span>
                <ExternalLink size={15} />
              </button>
              <button onClick={() => void report('idea')}>
                <span className="feedback-option-icon idea"><Lightbulb size={20} /></span>
                <span><strong>{lv ? 'Ieteikt uzlabojumu' : 'Suggest an improvement'}</strong><small>{lv ? 'Jauna funkcija, UX ideja vai darba scenārijs, ko PrintGuardian varētu atrisināt labāk.' : 'A new feature, UX idea, or workflow PrintGuardian could handle better.'}</small></span>
                <ExternalLink size={15} />
              </button>
            </div>

            <div className="feedback-privacy-note">
              <strong>{lv ? 'Privātums' : 'Privacy'}</strong>
              <span>{lv ? 'PrintGuardian nepievieno tavu 3MF, profilu vai projekta saturu ziņojumam automātiski. GitHub atvērsies ārējā pārlūkā; lai iesniegtu issue, būs nepieciešams GitHub konts. Drošības ievainojamības sūti privāti uz info@craftin.lv.' : 'PrintGuardian does not attach your 3MF, profile, or project contents automatically. GitHub opens in your external browser; submitting an issue requires a GitHub account. Send security-sensitive findings privately to info@craftin.lv.'}</span>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
