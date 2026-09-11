import { DialogHeader, GameDialog } from './primitives';
import './characterSelectPrompt.css';

interface Props {
  onCancel: () => void;
}

/**
 * Leaving the world is a reload.
 *
 * The server refuses `character:select` while a socket already holds a
 * character (`session.characterId !== null`) and has no "leave world" event, so
 * the supported way back to the roster is to drop the socket and reconnect.
 * Progress is safe either way: the world is authoritative and persists on
 * disconnect. The confirmation exists because the reload is indistinguishable
 * from a misclick until it has already happened.
 */
export function CharacterSelectPrompt({ onCancel }: Props) {
  return (
    <GameDialog size="compact" className="charsel-prompt" onClose={onCancel}>
      <DialogHeader title="Return to Character Select" closeLabel="Stay in the world" />
      <div className="charsel-prompt__body">
        <p>
          Leave the world and go back to your character roster? Your progress is
          saved automatically.
        </p>
        <div className="charsel-prompt__actions">
          <button type="button" className="auto-btn" onClick={onCancel}>
            CANCEL
          </button>
          <button
            type="button"
            className="auto-btn active"
            onClick={() => window.location.reload()}
          >
            RETURN
          </button>
        </div>
      </div>
    </GameDialog>
  );
}
