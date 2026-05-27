import { createPortal } from 'react-dom';
import { useAtom, useSetAtom } from 'jotai';
import {
  mapHighlightNodesAtom,
  mapOpenAtom,
  questOpenAtom,
} from '../atoms';
import { QuestPanel } from '../../ui/QuestPanel';

export function QuestOverlay() {
  const [open, setOpen] = useAtom(questOpenAtom);
  const setMapHighlight = useSetAtom(mapHighlightNodesAtom);
  const setMapOpen = useSetAtom(mapOpenAtom);

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
        <QuestPanel
          onFindDungeon={(nodeIds) => {
            setMapHighlight(nodeIds);
            setMapOpen(true);
            setOpen(false);
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
