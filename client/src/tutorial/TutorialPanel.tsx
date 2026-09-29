import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  resolveBeatIndex,
  tutorialProgress,
  tutorialScriptFor,
  type PlayerView,
  type TutorialBeat,
  type TutorialScript,
} from '@mmo-idle/shared';
import { selectedCharacterIdAtom } from '../auth/lobbyState';
import { deathOverlayAtom, localPlayerViewAtom, playerIdAtom } from '../hud/atoms';
import { playSfx } from '../audio/audioEngine';
import { GradientConduit, HudPanel } from '../hud/primitives';
import { resetTutorialRun, respawnForTutorial, runBeat, tutorialRunAtom } from './director';
import { TutorialHighlight } from './TutorialHighlight';
import './tutorial.css';

/** `done` = the guide finished (Tier 2) and the farewell was dismissed. */
type Choice = 'on' | 'off' | 'done';

const STORAGE_PREFIX = 'mmo_idle.tutorial.';

function readChoice(characterId: string): Choice | null {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${characterId}`);
    return raw === 'on' || raw === 'off' || raw === 'done' ? raw : null;
  } catch {
    return null;
  }
}

function writeChoice(characterId: string, choice: Choice | null): void {
  try {
    const key = `${STORAGE_PREFIX}${characterId}`;
    if (choice) window.localStorage.setItem(key, choice);
    else window.localStorage.removeItem(key);
  } catch {
    // A blocked store only means the offer shows again next session.
  }
}

/**
 * Opt-in is per character and client-only: nothing about the guide is gameplay
 * state. Keyed by the selected character id — the in-world player id is the
 * socket id and changes on every connection.
 */
function useTutorialChoice(characterId: string | null): [Choice | null, (choice: Choice | null) => void] {
  const [choice, setChoice] = useState<Choice | null>(null);
  useEffect(() => {
    setChoice(characterId ? readChoice(characterId) : null);
  }, [characterId]);
  const update = useCallback((next: Choice | null) => {
    if (characterId) writeChoice(characterId, next);
    setChoice(next);
  }, [characterId]);
  return [choice, update];
}

/**
 * How far through Tier 1 the guide is: a thin fill plus one tick per chapter,
 * the current chapter's tick lit. Replaces the bare "24 / 83" counter.
 */
function RouteStrip({ script, index }: { script: TutorialScript; index: number }) {
  const chapters = useMemo(() => {
    const starts: Array<{ name: string; at: number }> = [];
    script.beats.forEach((beat, i) => {
      if (starts[starts.length - 1]?.name !== beat.chapter) starts.push({ name: beat.chapter, at: i });
    });
    return starts;
  }, [script]);
  const total = script.beats.length;
  const current = chapters.filter((c) => c.at <= index).pop()?.name;
  return (
    <div
      className="tutorial-route"
      role="progressbar"
      aria-label="Tier 1 route"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={index}
      title={`Step ${Math.min(index + 1, total)} of ${total}`}
    >
      <div className="tutorial-route__fill" style={{ width: `${(index / total) * 100}%` }} />
      {chapters.map((chapter) => (
        <span
          key={chapter.name}
          className={[
            'tutorial-route__tick',
            chapter.at <= index ? 'tutorial-route__tick--passed' : '',
            chapter.name === current ? 'tutorial-route__tick--current' : '',
          ].filter(Boolean).join(' ')}
          style={{ left: `${(chapter.at / total) * 100}%` }}
          title={chapter.name}
        />
      ))}
    </div>
  );
}

function ProgressLines({ beat, view }: { beat: TutorialBeat; view: PlayerView }) {
  const rows = (beat.progress ?? []).flatMap((ref) => tutorialProgress(ref, view));
  if (rows.length === 0) return null;
  return (
    <div className="tutorial-progress">
      {rows.map((row) => (
        <div key={row.label} className="tutorial-progress__row">
          <span className="tutorial-progress__label">{row.label}</span>
          <GradientConduit
            className="tutorial-progress__bar"
            fraction={row.target > 0 ? row.current / row.target : 1}
            ramp={row.current >= row.target ? 'gold' : 'arcane'}
            label={row.label}
            valueText={`${row.current} of ${row.target}`}
          />
          <span className="tutorial-progress__value">{row.current}/{row.target}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The guided Tier-1 tutorial (docs/guided-tutorial-plan.md): an opt-in card on
 * the right rail that plays the route one Next at a time. Desktop only — the
 * rail it lives in is not mounted on mobile.
 */
export function TutorialPanel() {
  const playerId = useAtomValue(playerIdAtom);
  const view = useAtomValue(localPlayerViewAtom);
  const run = useAtomValue(tutorialRunAtom);
  const deathOverlay = useAtomValue(deathOverlayAtom).active;
  const characterId = useAtomValue(selectedCharacterIdAtom);
  const [choice, setChoice] = useTutorialChoice(characterId);
  const controller = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    resetTutorialRun();
  }, []);

  const script = view ? tutorialScriptFor(view.selectedClass) : null;
  const index = script && view ? resolveBeatIndex(script, view) : -1;
  const currentBeatId = script?.beats[index]?.id ?? null;

  // "Your turn" moment: a waiting beat just finished and the next one is up.
  // Only that transition (not a Stop, not a death) glows and chimes, once.
  const [readyPulse, setReadyPulse] = useState(0);
  const lastRun = useRef(run);
  useEffect(() => {
    const previous = lastRun.current;
    lastRun.current = run;
    if (previous?.status === 'waiting' && run === null && previous.beatId !== currentBeatId && choice === 'on') {
      setReadyPulse((n) => n + 1);
      playSfx('tutorial-ready');
    }
  }, [run, currentBeatId, choice]);
  // Clear the glow class once its one-shot animation has played.
  useEffect(() => {
    if (readyPulse === 0) return;
    const timer = setTimeout(() => setReadyPulse(0), 1400);
    return () => clearTimeout(timer);
  }, [readyPulse]);

  // A character switch or unmount must never leave the guide pressing buttons.
  useEffect(() => stop, [stop, playerId]);
  useEffect(() => {
    if (choice !== 'on') stop();
  }, [choice, stop]);

  if (!playerId || !view) return null;

  if (view.playerTier >= 2) {
    if (choice !== 'on') return null;
    return (
      <HudPanel className="sidebar-panel tutorial-panel tutorial-panel--farewell">
        <div className="panel-title">Guide</div>
        <p className="tutorial-panel__line">
          Two seals, Tier 2. That is the guided part done.
        </p>
        <p className="tutorial-panel__line">
          Keep going forward: new zones are open, and your next skill point is waiting in the Passive Tree.
        </p>
        <div className="tutorial-panel__actions">
          <button type="button" className="tutorial-button tutorial-button--primary" onClick={() => setChoice('done')}>
            Thanks!
          </button>
        </div>
      </HudPanel>
    );
  }

  if (choice === 'off' || choice === 'done') {
    return (
      // Back to the offer, not straight into the guide: it repeats the takeover warning.
      <button type="button" className="tutorial-tab" onClick={() => setChoice(null)}>
        Guide
      </button>
    );
  }

  if (choice === null) {
    return (
      <HudPanel className="sidebar-panel tutorial-panel tutorial-panel--offer">
        <div className="panel-title">Guided Tier 1</div>
        <p className="tutorial-panel__line">
          Let the guide play Tier 1 with you. It makes every choice and says why; you just press Next.
        </p>
        {view.playerTier >= 1 && (
          <p className="tutorial-panel__note">It will swap your gear, abilities and Runes to its plan.</p>
        )}
        <div className="tutorial-panel__actions">
          <button type="button" className="tutorial-button tutorial-button--primary" onClick={() => setChoice('on')}>
            Start guide
          </button>
          <button type="button" className="tutorial-button" onClick={() => setChoice('off')}>
            No thanks
          </button>
        </div>
      </HudPanel>
    );
  }

  if (!script) return null;
  const beat = script.beats[index] ?? null;
  const busy = !!run && (run.status === 'working' || run.status === 'waiting' || run.status === 'player');
  const ownRun = run && beat && run.beatId === beat.id ? run : null;
  const dead = deathOverlay || view.isDead;

  const next = () => {
    if (dead) {
      stop();
      respawnForTutorial();
      return;
    }
    if (!beat || busy) return;
    stop();
    const current = new AbortController();
    controller.current = current;
    void runBeat(script, beat, current.signal);
  };

  let line = beat?.say ?? '';
  if (ownRun?.status === 'waiting' || ownRun?.status === 'player') line = beat?.waiting ?? line;
  if (ownRun?.message) line = ownRun.message;
  if (dead) line = 'You fell. That happens; press Next to get back up, and the guide carries on.';

  return (
    <HudPanel className="sidebar-panel tutorial-panel">
      <div className="panel-title tutorial-panel__title">
        <span>Guide</span>
        <button type="button" className="tutorial-panel__stop" onClick={() => setChoice('off')}>
          Stop
        </button>
      </div>
      {beat && <RouteStrip script={script} index={index} />}
      {beat && <div className="tutorial-panel__chapter">{beat.chapter}</div>}

      {beat ? (
        <>
          <p
            // Keyed by the text so each new line fades in instead of snapping.
            key={line}
            className={`tutorial-panel__line tutorial-panel__line--enter${ownRun?.status === 'error' ? ' tutorial-panel__line--error' : ''}`}
          >
            {line}
          </p>
          {ownRun?.status === 'waiting' && !dead && <ProgressLines beat={beat} view={view} />}
          {busy && !dead ? (
            <div className="tutorial-panel__status">
              {ownRun?.status === 'player' ? 'Your move' : ownRun?.status === 'waiting' ? 'In progress…' : 'Working…'}
            </div>
          ) : (
            <div className="tutorial-panel__actions">
              <button
                type="button"
                className={`tutorial-button tutorial-button--primary tutorial-button--next${readyPulse ? ' tutorial-button--ready' : ''}`}
                onClick={next}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="tutorial-panel__line">
          {view.selectedClass
            ? 'Everything is in place. The seals come next.'
            : 'Waiting for your class.'}
        </p>
      )}
      <TutorialHighlight />
    </HudPanel>
  );
}
