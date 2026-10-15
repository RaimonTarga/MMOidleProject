import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import {
  classKitFor,
  composeResponsesView,
  withGroundTelegraphs,
  withRule,
  type ClassConfig,
  type ClassScreenView,
  type ResponsesConfig,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import {
  biomeLevelAtom,
  bossesClearedAtom,
  combatArchetypeAtom,
  disciplineIdAtom,
  playerTierAtom,
} from '../../hud/atoms';
import { GameIcon } from '../GameIcon';
import { classPieceIconSource, trophyIconSource } from '../conceptIcons';
import { rankMark } from './format';
import './responsesEditor.css';

const DISCIPLINES = classKitFor('cooldown').disciplines;
/** The piece each discipline's pick unlocks (Parry, Intercept, Unbowed). */
const DISCIPLINE_PIECE_IDS = new Set(DISCIPLINES.flatMap((d) => (d.pieceId ? [d.pieceId] : [])));

function words(id: string): string {
  return id.split('-').join(' ');
}

/** Costs and refunds are halves of a pip. Show a whole number without a decimal. */
function formatPips(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * The Squire's Response rules (bible §8.3). The shell renders this when
 * `view.systemKind === 'responses'`. Edits go out as `class:setConfig`.
 */
export function ResponsesEditor({ view }: { view: ClassScreenView }) {
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);
  const disciplineId = useAtomValue(disciplineIdAtom);
  const playerTier = useAtomValue(playerTierAtom);

  const responses = useMemo(() => composeResponsesView({
    combatArchetype,
    classConfig: view.config,
    biomeLevel,
    bossesCleared,
    disciplineId,
    playerTier,
  }), [
    biomeLevel,
    bossesCleared,
    combatArchetype,
    disciplineId,
    playerTier,
    view.config,
  ]);

  const config = view.config;
  if (!responses || !config || config.system.kind !== 'responses') {
    return (
      <p className="class-panel__editor">
        Response rules appear once this character&apos;s setup arrives.
      </p>
    );
  }

  const system: ResponsesConfig = config.system;

  function send(next: ClassConfig) {
    hudBus.requestSetClassConfig(next);
  }

  function onToggle(pieceId: string, enabled: boolean) {
    send(withRule(config as ClassConfig, pieceId, { enabled }));
  }

  function onRemove(pieceId: string, index: number) {
    const rule = system.rules.find((entry) => entry.pieceId === pieceId);
    if (!rule) return;
    send(withRule(config as ClassConfig, pieceId, {
      conditions: rule.conditions.filter((_, conditionIndex) => conditionIndex !== index),
    }));
  }

  function onGround(choice: ResponsesConfig['groundTelegraphs']) {
    if (system.groundTelegraphs === choice) return;
    send(withGroundTelegraphs(config as ClassConfig, choice));
  }

  const picked = DISCIPLINES.find((d) => d.id === disciplineId);

  return (
    <div className="responses-editor">
      {picked ? (
        <section className="responses-editor__discipline" aria-label="Discipline">
          <h4 className="class-panel__subheading">{`Discipline: ${picked.name}`}</h4>
          <p className="class-panel__line">{picked.text}</p>
        </section>
      ) : playerTier >= 2 && (
        <section className="responses-editor__discipline" aria-label="Discipline">
          <h4 className="class-panel__subheading">Pick a discipline</h4>
          <p className="class-panel__line">
            Tier 2 lets you choose how your Resolve works. Choose one in the Passive Tree.
          </p>
          <ul className="responses-editor__hold">
            {DISCIPLINES.map((d) => (
              <li key={d.id}>{`${d.name}: ${d.fantasy}`}</li>
            ))}
          </ul>
        </section>
      )}
      <div className="class-panel__cards">
        {responses.rules.map((rule) => (
          <article
            key={rule.pieceId}
            className={`class-panel__card responses-editor__rule${rule.enabled ? '' : ' responses-editor__rule--off'}`}
          >
            <GameIcon
              source={classPieceIconSource(rule.pieceId)}
              size={36}
              fallback={rule.name.charAt(0)}
              decorative
            />
            <div>
              <div className="class-panel__card-title">
                <span className="class-panel__name">{rule.name}</span>
                <span className="class-panel__rank">{rankMark(rule.rank)}</span>
                <span className="class-panel__family">{words(rule.family)}</span>
                {DISCIPLINE_PIECE_IDS.has(rule.pieceId) && (
                  <span className="class-panel__family">discipline</span>
                )}
              </div>
              {rule.answers.length > 0 && (
                <p className="class-panel__line">{`when ${rule.answers}`}</p>
              )}
              {rule.lines.map((line, index) => (
                <p key={index} className="class-panel__line">{line}</p>
              ))}
              <p className="responses-editor__cost">
                {rule.family === 'emergency'
                  ? 'Spends the whole bar'
                  : `${formatPips(rule.cost)} → ${formatPips(rule.refund)} pips`}
              </p>
              {rule.conditions.length > 0 && (
                <ul className="responses-editor__conditions">
                  {rule.conditions.map((text, index) => (
                    <li key={`${rule.pieceId}-${index}`}>
                      <span>{text}</span>
                      <button
                        type="button"
                        className="responses-editor__remove"
                        aria-label={`remove ${text}`}
                        onClick={() => onRemove(rule.pieceId, index)}
                      >
                        remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              className="responses-editor__toggle"
              aria-pressed={rule.enabled}
              aria-label={`${rule.enabled ? 'Turn off' : 'Turn on'} ${rule.name}`}
              onClick={() => onToggle(rule.pieceId, !rule.enabled)}
            >
              {rule.enabled ? 'On' : 'Off'}
            </button>
          </article>
        ))}
      </div>

      <h4 className="class-panel__subheading">Ground telegraphs</h4>
      <div className="responses-editor__choices">
        <button
          type="button"
          className="responses-editor__choice"
          aria-pressed={system.groundTelegraphs === 'hold'}
          onClick={() => onGround('hold')}
        >
          Hold (guard and keep swinging)
        </button>
        <button
          type="button"
          className="responses-editor__choice"
          aria-pressed={system.groundTelegraphs === 'step-out'}
          onClick={() => onGround('step-out')}
        >
          Step out
        </button>
      </div>

      <h4 className="class-panel__subheading">Slam rule</h4>
      {responses.holdSlam.length === 0 ? (
        <p className="class-panel__editor">No slam rule</p>
      ) : (
        <ul className="responses-editor__hold">
          {responses.holdSlam.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      )}

      <h4 className="class-panel__subheading">Slam</h4>
      <article className="class-panel__card">
        <GameIcon
          source={responses.slam.trophyId
            ? trophyIconSource(responses.slam.trophyId)
            : classPieceIconSource('squire-slam')}
          size={36}
          fallback={responses.slam.name.charAt(0)}
          decorative
        />
        <div>
          <div className="class-panel__card-title">
            <span className="class-panel__name">{responses.slam.name}</span>
            <span className="class-panel__family">{words(responses.slam.kind)}</span>
          </div>
          {responses.slam.lines.map((line, index) => (
            <p key={index} className="class-panel__line">{line}</p>
          ))}
        </div>
      </article>

      {responses.problems.length > 0 && (
        <ul className="responses-editor__problems" role="alert">
          {responses.problems.map((problem, index) => (
            <li key={`${index}-${problem}`}>{problem}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
