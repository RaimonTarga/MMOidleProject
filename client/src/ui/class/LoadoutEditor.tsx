import { useEffect, useState, type CSSProperties } from 'react';
import { useAtomValue } from 'jotai';
import {
  MOMENTS,
  SLINGER_KIT,
  withClipRule,
  withFreeRules,
  withRack,
  withoutClipRule,
  type ClassConfig,
  type ClassScreenView,
  type ClipView,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { disciplineIdAtom } from '../../hud/atoms';
import { GameIcon } from '../GameIcon';
import { classPieceIconSource, trophyIconSource } from '../conceptIcons';
import { rankMark } from './format';
import { useLoadoutEditor } from './useLoadoutView';
import './loadoutEditor.css';

const PLAIN = SLINGER_KIT.pieces.find((piece) => piece.plain === true);

/** The called shot's pick order when no rule is set (bible §10.13). */
const DEFAULT_CALLED_SHOT = ['enemy-winds-up', 'target-elite', 'target-low'];

function momentText(id: string): string {
  const moment = (MOMENTS as Record<string, { text: string } | undefined>)[id];
  return moment ? moment.text : id.split('-').join(' ');
}

function words(id: string): string {
  return id.split('-').join(' ');
}

/**
 * The Slinger's Loadout (bible §10.3). The shell renders this when
 * `view.systemKind === 'loadout'`. Edits go out as `class:setConfig`.
 * Adding past the rack is sent; the validator's reasons are shown as they are.
 */
export function LoadoutEditor({ view }: { view: ClassScreenView }) {
  const { loadout, problemsFor } = useLoadoutEditor();
  const disciplineId = useAtomValue(disciplineIdAtom);
  const [tried, setTried] = useState<string[] | null>(null);

  useEffect(() => {
    setTried(null);
  }, [view.config]);

  const config = view.config;
  if (!loadout || !config || config.system.kind !== 'loadout') {
    return <p className="class-panel__editor">The Loadout is not set yet.</p>;
  }

  const system = config.system;
  const rackedIds = new Set(loadout.racked.map((clip) => clip.pieceId));
  const owned = loadout.available.filter((clip) => !rackedIds.has(clip.pieceId));
  const problems = tried ?? loadout.problems;

  function send(next: ClassConfig) {
    const reasons = problemsFor(next);
    setTried(reasons.length > 0 ? reasons : null);
    hudBus.requestSetClassConfig(next);
  }

  function onAdd(pieceId: string) {
    send(withRack(config as ClassConfig, [...system.rack, pieceId]));
  }

  function onRemove(pieceId: string) {
    send(withRack(config as ClassConfig, system.rack.filter((id) => id !== pieceId)));
  }

  function onRemoveRule(pieceId: string) {
    send(withoutClipRule(config as ClassConfig, pieceId));
  }

  function onSwitch(pieceId: string, switchEarly: boolean) {
    send(withClipRule(config as ClassConfig, pieceId, { switchEarly }));
  }

  function onFree(patch: { reloadEarlyWhenSafe?: boolean; neverReloadInTelegraph?: boolean }) {
    send(withFreeRules(config as ClassConfig, patch));
  }

  return (
    <div className="loadout-editor">
      {problems.length > 0 && (
        <div className="loadout-editor__problems" role="alert">
          {problems.map((problem, index) => <p key={`${index}-${problem}`}>{problem}</p>)}
        </div>
      )}

      <DisciplineNote
        disciplineId={disciplineId}
        calledShot={system.calledShot?.filter((ref) => !ref.not).map((ref) => ref.id as string)}
        racked={loadout.racked.map((clip) => clip.name)}
      />

      <div className="loadout-editor__pips" aria-label={`Rack: ${loadout.rack.used} of ${loadout.rack.slots}`}>
        {Array.from({ length: loadout.rack.slots }, (_, index) => (
          <i
            key={index}
            className={index < loadout.rack.used ? 'loadout-editor__pip loadout-editor__pip--used' : 'loadout-editor__pip'}
            aria-hidden="true"
          />
        ))}
        <span>{`${loadout.rack.used} of ${loadout.rack.slots}`}</span>
        {loadout.rack.doubleLoads > 0 && (
          <span className="loadout-editor__doubles">{`${loadout.rack.doubleLoads} double ${loadout.rack.doubleLoads === 1 ? 'load' : 'loads'}`}</span>
        )}
      </div>

      {PLAIN && (
        <article
          className="class-panel__card loadout-editor__clip"
          style={{ '--clip-color': PLAIN.color } as CSSProperties}
        >
          <GameIcon source={classPieceIconSource(PLAIN.id)} size={36} fallback={PLAIN.name.charAt(0)} decorative />
          <div>
            <div className="class-panel__card-title">
              <span className="class-panel__name">{PLAIN.name}</span>
              <span className="class-panel__family">{words(PLAIN.family)}</span>
              <span className="class-panel__mark">always loaded</span>
            </div>
            <p className="class-panel__line">{PLAIN.text}</p>
          </div>
        </article>
      )}

      <div className="class-panel__cards">
        {loadout.racked.map((clip) => (
          <ClipCard key={clip.pieceId} clip={clip} onRemove={() => onRemove(clip.pieceId)} />
        ))}
      </div>

      <h4 className="class-panel__subheading">Clips you own</h4>
      {owned.length === 0 ? (
        <p className="class-panel__editor">Every clip you own is in the rack.</p>
      ) : (
        <div className="class-panel__cards">
          {owned.map((clip) => (
            <article
              key={clip.pieceId}
              className="class-panel__card loadout-editor__clip"
              style={{ '--clip-color': clip.color } as CSSProperties}
            >
              <GameIcon source={classPieceIconSource(clip.pieceId)} size={36} fallback={clip.name.charAt(0)} decorative />
              <div>
                <div className="class-panel__card-title">
                  <span className="class-panel__name">{clip.name}</span>
                  <span className="class-panel__rank">{rankMark(clip.rank)}</span>
                  <span className="class-panel__family">{words(clip.family)}</span>
                </div>
                <p className="class-panel__line">{clip.text}</p>
              </div>
              <button
                type="button"
                className="loadout-editor__button"
                aria-label={`add ${clip.name} to the rack`}
                onClick={() => onAdd(clip.pieceId)}
              >
                add
              </button>
            </article>
          ))}
        </div>
      )}

      <h4 className="class-panel__subheading">Clip rules</h4>
      <div className="loadout-editor__rules">
        {loadout.racked.map((clip) => {
          const rule = loadout.rules.find((entry) => entry.clip.pieceId === clip.pieceId);
          return (
            <div key={clip.pieceId} className="loadout-editor__rule">
              <span className="loadout-editor__swatch" style={{ background: clip.color }} aria-hidden="true" />
              <span className="loadout-editor__rule-name">{clip.name}</span>
              {rule && rule.conditions.length > 0 ? (
                <span className="loadout-editor__conditions">{rule.conditions.join('; ')}</span>
              ) : (
                <span className="loadout-editor__conditions">No rule</span>
              )}
              {rule && (
                <>
                  <button
                    type="button"
                    className="loadout-editor__button"
                    aria-pressed={rule.switchEarly}
                    aria-label={`${rule.switchEarly ? 'Stop switching' : 'Switch'} early to ${clip.name}`}
                    onClick={() => onSwitch(clip.pieceId, !rule.switchEarly)}
                  >
                    {rule.switchEarly ? 'Switch early: on' : 'Switch early'}
                  </button>
                  <button
                    type="button"
                    className="loadout-editor__button"
                    aria-label={`remove the rule for ${clip.name}`}
                    onClick={() => onRemoveRule(clip.pieceId)}
                  >
                    remove
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
      <p className="class-panel__editor">None matching loads the plain clip.</p>

      <h4 className="class-panel__subheading">Reload rules</h4>
      <div className="loadout-editor__choices">
        <button
          type="button"
          className="loadout-editor__button"
          aria-pressed={loadout.freeRules.reloadEarlyWhenSafe}
          onClick={() => onFree({ reloadEarlyWhenSafe: !loadout.freeRules.reloadEarlyWhenSafe })}
        >
          Reload early when nothing threatens you
        </button>
        <button
          type="button"
          className="loadout-editor__button"
          aria-pressed={loadout.freeRules.neverReloadInTelegraph}
          onClick={() => onFree({ neverReloadInTelegraph: !loadout.freeRules.neverReloadInTelegraph })}
        >
          Never start a reload inside a telegraph
        </button>
      </div>

      <h4 className="class-panel__subheading">Last round</h4>
      <article className="class-panel__card">
        {loadout.lastRound.trophyId ? (
          <GameIcon
            source={trophyIconSource(loadout.lastRound.trophyId)}
            size={36}
            fallback={loadout.lastRound.name.charAt(0)}
            decorative
          />
        ) : (
          <span className="loadout-editor__plain-mark" aria-hidden="true" />
        )}
        <div>
          <span className="class-panel__name">{loadout.lastRound.name}</span>
          <p className="class-panel__line">{loadout.lastRound.text}</p>
        </div>
      </article>
    </div>
  );
}

/** The T2 discipline's rule, as it changes the rack: twin guns, the shell, the called shot. */
function DisciplineNote({ disciplineId, calledShot, racked }: {
  disciplineId: string | null;
  calledShot: string[] | undefined;
  racked: string[];
}) {
  const discipline = SLINGER_KIT.disciplines.find((entry) => entry.id === disciplineId);
  if (!discipline) return null;
  const order = calledShot && calledShot.length > 0 ? calledShot : DEFAULT_CALLED_SHOT;
  return (
    <article className="class-panel__card loadout-editor__discipline">
      <div>
        <div className="class-panel__card-title">
          <span className="class-panel__name">{discipline.name}</span>
          <span className="class-panel__family">discipline</span>
        </div>
        <p className="class-panel__line">{discipline.text}</p>
        {discipline.id === 'slinger-gunslinger' && (
          <p className="class-panel__line">
            {racked.length > 1
              ? 'The second gun takes the next clip whose rule holds, else a racked clip of another family.'
              : 'Rack a second clip type and the second gun fires it.'}
          </p>
        )}
        {discipline.id === 'slinger-trickshot' && (
          <>
            <p className="class-panel__line">The called shot picks, in order:</p>
            <ol className="loadout-editor__called">
              {order.map((id) => <li key={id}>{momentText(id)}</li>)}
            </ol>
          </>
        )}
      </div>
    </article>
  );
}

function ClipCard({ clip, onRemove }: { clip: ClipView; onRemove: () => void }) {
  return (
    <article
      className="class-panel__card loadout-editor__clip"
      style={{ '--clip-color': clip.color } as CSSProperties}
    >
      <GameIcon source={classPieceIconSource(clip.pieceId)} size={36} fallback={clip.name.charAt(0)} decorative />
      <div>
        <div className="class-panel__card-title">
          <span className="class-panel__name">{clip.name}</span>
          <span className="class-panel__rank">{rankMark(clip.rank)}</span>
          <span className="class-panel__family">{words(clip.family)}</span>
        </div>
        <p className="class-panel__line">{clip.text}</p>
      </div>
      <button
        type="button"
        className="loadout-editor__button"
        aria-label={`remove ${clip.name} from the rack`}
        onClick={onRemove}
      >
        remove
      </button>
    </article>
  );
}
