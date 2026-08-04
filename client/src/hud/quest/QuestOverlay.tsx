import { createPortal } from 'react-dom';
import { useAtom } from 'jotai';
import { questOpenAtom } from '../atoms';
import { QuestPanel } from '../../ui/QuestPanel';

export function QuestOverlay() {
  const [open, setOpen] = useAtom(questOpenAtom);

  if (!open) return null;

  return createPortal(
    <div
      className="inv-overlay"
      onClick={() => setOpen(false)}
    >
      <div
        className="inv-panel quest-overlay-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inv-header">
          <span className="inv-title">Quests</span>
          <button
            type="button"
            className="inv-close"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
        <QuestPanel />
      </div>
    </div>,
    document.body,
  );
}
