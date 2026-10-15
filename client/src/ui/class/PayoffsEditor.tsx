import { useState } from 'react';
import {
  withPlacement,
  withoutPlacement,
  withPlacementConditions,
  type ClassConfig,
  type ClassScreenView,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { SigilRing } from '../../hud/SigilRing';
import { GameIcon } from '../GameIcon';
import { classPieceIconSource, trophyIconSource } from '../conceptIcons';
import { rankMark } from './format';
import { usePayoffsView } from './usePayoffsView';
import './payoffsEditor.css';

/** An enemy card, with the moments this Apprentice knows arranged around its sigil ring. */
export function PayoffsEditor({ view }: { view: ClassScreenView }) {
  const payoffs = usePayoffsView(view.config);
  const [chosenMoments, setChosenMoments] = useState<Record<string, string>>({});
  const config = view.config;
  if (!payoffs || !config || config.system.kind !== 'payoffs') {
    return <p className="class-panel__editor">Payoff rules appear once this character&apos;s setup arrives.</p>;
  }

  const system = config.system;
  function send(next: ClassConfig) {
    hudBus.requestSetClassConfig(next);
  }

  function toggleCompany(index: number) {
    const placement = system.placements[index];
    if (!placement) return;
    const hasPreset = placement.conditions.some((condition) => condition.id === 'enemies-near' && condition.param === 3 && !condition.not);
    const conditions = hasPreset
      ? placement.conditions.filter((condition) => !(condition.id === 'enemies-near' && condition.param === 3 && !condition.not))
      : [...placement.conditions.filter((condition) => condition.id !== 'enemies-near'), { id: 'enemies-near' as const, param: 3 }];
    send(withPlacementConditions(config as ClassConfig, index, conditions));
  }

  const school = payoffs.discipline?.school ?? null;
  return (
    <div className="payoffs-editor">
      {payoffs.discipline && (
        <article className={`class-panel__card payoffs-editor__discipline payoffs-editor__family--${payoffs.discipline.school}`}>
          <div>
            <div className="class-panel__card-title">
              <span className="class-panel__name">{payoffs.discipline.name}</span>
              <span className="payoffs-editor__family">{`adds ${payoffs.discipline.pieceName}`}</span>
            </div>
            <p className="class-panel__line">{payoffs.discipline.text}</p>
          </div>
        </article>
      )}
      {payoffs.specialization && (
        <article className={`class-panel__card payoffs-editor__discipline payoffs-editor__specialization payoffs-editor__family--${school ?? 'poison'}`}>
          <div>
            <div className="class-panel__card-title">
              <span className="class-panel__name">{payoffs.specialization.name}</span>
              <span className="payoffs-editor__family">specialization</span>
            </div>
            <p className="class-panel__line">{payoffs.specialization.text}</p>
          </div>
        </article>
      )}
      {payoffs.leaf && (
        <article className={`class-panel__card payoffs-editor__discipline payoffs-editor__specialization payoffs-editor__family--${school ?? 'poison'}`}>
          <div>
            <div className="class-panel__card-title">
              <span className="class-panel__name">{payoffs.leaf.name}</span>
              <span className="payoffs-editor__family">{`leaf: ${payoffs.leaf.column}`}</span>
            </div>
            <p className="class-panel__line">{payoffs.leaf.text}</p>
          </div>
        </article>
      )}
      <div className="payoffs-editor__board">
        <figure className="payoffs-editor__enemy">
          <SigilRing cap={payoffs.sigils.cap} stacks={payoffs.sigils.cap} enemy school={school} />
          <figcaption>{`Sigils ${payoffs.sigils.cap}`}</figcaption>
        </figure>
        {payoffs.moments.map((moment) => (
          <section key={moment.moment} className="payoffs-editor__moment" aria-label={`When ${moment.text}`}>
            <h4>{`When ${moment.text}`}</h4>
            {moment.placements.length === 0 ? (
              <p className="class-panel__line">No payoff placed.</p>
            ) : (
              <ol className="payoffs-editor__placements">
                {moment.placements.map((placement, priority) => {
                  const onlyWithCompany = system.placements[placement.index].conditions.some((condition) => condition.id === 'enemies-near' && condition.param === 3 && !condition.not);
                  return (
                    <li key={placement.index} className={`payoffs-editor__chip payoffs-editor__family--${placement.payoff.family}`}>
                      <div className="payoffs-editor__chip-title">
                        <GameIcon
                          source={classPieceIconSource(placement.payoff.pieceId)}
                          size={24}
                          fallback={placement.payoff.name.charAt(0)}
                          decorative
                        />
                        <span className="class-panel__name">{placement.payoff.name}</span>
                        <span className="payoffs-editor__family">{placement.payoff.family}</span>
                        <button
                          type="button"
                          className="payoffs-editor__button"
                          aria-label={`Remove ${placement.payoff.name} from ${moment.text}, priority ${priority + 1}`}
                          onClick={() => send(withoutPlacement(config, placement.index))}
                        >
                          remove
                        </button>
                      </div>
                      <p className="class-panel__line">{placement.conditions.length ? placement.conditions.join('; ') : 'No extra conditions'}</p>
                      <button
                        type="button"
                        className="payoffs-editor__button"
                        aria-pressed={onlyWithCompany}
                        onClick={() => toggleCompany(placement.index)}
                      >
                        Only with three or more enemies near
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        ))}
      </div>
      <p className="class-panel__line">At each moment, the first payoff whose conditions hold fires. New payoffs go last.</p>

      <h4 className="class-panel__subheading">The payoffs you know</h4>
      <div className="class-panel__cards">
        {payoffs.available.map((payoff) => {
          // A payoff bound to its own moment (Blast Back, Sear...) starts on it.
          const moment = payoffs.moments.find((entry) => entry.moment === (chosenMoments[payoff.pieceId] ?? payoff.moment)) ?? payoffs.moments[0];
          return (
            <article key={payoff.pieceId} className={`class-panel__card payoffs-editor__known payoffs-editor__family--${payoff.family}`}>
              <GameIcon source={classPieceIconSource(payoff.pieceId)} size={36} fallback={payoff.name.charAt(0)} decorative />
              <div>
                <div className="class-panel__card-title">
                  <span className="class-panel__name">{payoff.name}</span>
                  <span className="class-panel__rank">{rankMark(payoff.rank)}</span>
                  <span className="payoffs-editor__family">{payoff.family}</span>
                </div>
                <p className="class-panel__line">{payoff.text}</p>
                <div className="payoffs-editor__add">
                  <label>
                    Add to a moment
                    <select
                      value={moment?.moment ?? ''}
                      disabled={!moment}
                      onChange={(event) => setChosenMoments((previous) => ({ ...previous, [payoff.pieceId]: event.target.value }))}
                    >
                      {payoffs.moments.map((entry) => <option key={entry.moment} value={entry.moment}>{entry.text}</option>)}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="payoffs-editor__button"
                    disabled={!moment}
                    aria-label={`Add ${payoff.name} to ${moment?.text ?? 'a moment'}`}
                    onClick={() => { if (moment) send(withPlacement(config, moment.moment, payoff.pieceId)); }}
                  >
                    Add payoff
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <h4 className="class-panel__subheading">Relic</h4>
      <article className="class-panel__card">
        <GameIcon source={payoffs.relic.trophyId ? trophyIconSource(payoffs.relic.trophyId) : null} size={36} fallback={payoffs.relic.name.charAt(0)} decorative />
        <div>
          <div className="class-panel__card-title">
            <span className="class-panel__name">{payoffs.relic.name}</span>
            <span className="class-panel__family">{payoffs.relic.kind}</span>
          </div>
          <p className="class-panel__line">{payoffs.relic.text}</p>
        </div>
      </article>
      {payoffs.problems.length > 0 && (
        <ul className="payoffs-editor__problems" role="alert">
          {payoffs.problems.map((problem, index) => <li key={`${index}-${problem}`}>{problem}</li>)}
        </ul>
      )}
    </div>
  );
}
