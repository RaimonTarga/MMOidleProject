import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { ClassScreenView, OrderBeatView } from '@mmo-idle/shared';
import { STRIKER_KIT, withBeat } from '@mmo-idle/shared';
import { disciplineIdAtom, playerTierAtom, specializationIdAtom } from '../../hud/atoms';
import { hudBus } from '../../hudBus';
import { GameIcon } from '../GameIcon';
import { classPieceIconSource, trophyIconSource } from '../conceptIcons';
import { rankMark } from './format';
import { useOrderView } from './useOrderView';
import './orderEditor.css';

function words(id: string): string {
  return id.split('-').join(' ');
}

function positionLabel(beat: OrderBeatView): string | null {
  if (beat.position === 'opener') return 'Opener';
  if (beat.position === 'windup') return 'Wind-up';
  return null;
}

function beatLabel(beat: OrderBeatView): string {
  const place = beat.position === 'opener'
    ? 'Opener, cast position'
    : beat.position === 'windup'
      ? 'Wind-up, cast position'
      : `Beat ${beat.index + 1}`;
  const name = beat.pieceName ?? 'Plain swing';
  return beat.mastered ? `${place}: ${name}, mastered` : `${place}: ${name}`;
}

function tone(beat: OrderBeatView): 'plain' | 'technique' | 'mastered' {
  if (beat.mastered) return 'mastered';
  if (beat.pieceId) return 'technique';
  return 'plain';
}

/** The relic section is the one place a trophy is equipped. */
function scrollToRelic(): void {
  const heading = document.getElementById('class-panel-relic');
  const section = heading?.closest('section') ?? heading;
  if (!section) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  section.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

/**
 * The Striker's Order: a beat slot for each swing, then the finisher.
 * Edits go out as `withBeat`; the relic section equips the trophy.
 */
export function OrderEditor({ view }: { view: ClassScreenView }) {
  const order = useOrderView();
  const disciplineId = useAtomValue(disciplineIdAtom);
  const specializationId = useAtomValue(specializationIdAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [fullNotice, setFullNotice] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openIndex === null) return;
    function onPointer(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node) || !rootRef.current?.contains(target)) {
        setOpenIndex(null);
        setFullNotice(false);
      }
    }
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [openIndex]);

  if (!order) {
    return <p className="class-panel__editor">The Order is not set yet.</p>;
  }

  const discipline = STRIKER_KIT.disciplines.find((entry) => entry.id === disciplineId) ?? null;
  const specialization = STRIKER_KIT.specializations.find((entry) => entry.id === specializationId) ?? null;
  const config = view.config?.system.kind === 'order' ? view.config : null;
  const openBeat = openIndex === null ? null : order.beats.find((beat) => beat.index === openIndex) ?? null;
  const slots = order.slots;
  const techniques = order.techniques;
  const choices = openBeat
    ? techniques.filter((technique) => technique.allowedBeats.includes(openBeat.index))
    : [];

  function toggle(index: number) {
    setFullNotice(false);
    setOpenIndex((current) => (current === index ? null : index));
  }

  function onPick(beat: OrderBeatView, pieceId: string | null) {
    if (!config) return;
    // Adding a technique to a plain beat once every open beat is used would go
    // past the budget, so say so and do not send. A technique already placed
    // just moves, and clearing a beat still sends.
    const alreadyPlaced = pieceId !== null
      && techniques.some((technique) => technique.id === pieceId && technique.placedAt !== null);
    const addsSlot = pieceId !== null && beat.pieceId === null && !alreadyPlaced;
    if (addsSlot && slots.used >= slots.open) {
      setFullNotice(true);
      return;
    }
    if (pieceId === beat.pieceId) {
      setOpenIndex(null);
      setFullNotice(false);
      return;
    }
    hudBus.requestSetClassConfig(withBeat(config, beat.index, pieceId));
    setOpenIndex(null);
    setFullNotice(false);
  }

  return (
    <div className="order-editor" ref={rootRef}>
      <p className="order-editor__slots">
        {`Techniques: ${slots.used} of ${slots.open} beats`}
        {slots.mastered > 0 ? `, ${slots.mastered} mastered` : ''}
      </p>

      {discipline ? (
        <div className="order-editor__discipline">
          <h4 className="class-panel__subheading">{`${discipline.name}: ${order.beats.length + 1} beats`}</h4>
          <p className="class-panel__line">{discipline.text}</p>
          {specialization ? (
            <>
              <h4 className="class-panel__subheading">{`Specialization: ${specialization.name}`}</h4>
              <p className="class-panel__line">{specialization.text}</p>
            </>
          ) : playerTier >= 3 ? (
            <p className="order-editor__discipline-hint" role="status">
              Pick a specialization in the Passive Tree: three for {discipline.name}. It bends what your discipline
              builds.
            </p>
          ) : null}
        </div>
      ) : playerTier >= 2 ? (
        <p className="order-editor__discipline-hint" role="status">
          Pick a discipline in the Passive Tree: Light, Balanced or Heavy. It sets how long your combo is and
          what it builds.
        </p>
      ) : null}

      {order.problems.length > 0 && (
        <div className="order-editor__problems" role="alert">
          {order.problems.map((problem, index) => <p key={index}>{problem}</p>)}
        </div>
      )}

      <div className="order-editor__beats" role="group" aria-label="Order">
        {order.beats.map((beat) => {
          const label = positionLabel(beat);
          const name = beat.pieceName ?? 'Plain swing';
          return (
            <button
              key={beat.index}
              type="button"
              className={`order-editor__beat order-editor__beat--${tone(beat)}`}
              aria-label={beatLabel(beat)}
              aria-expanded={openIndex === beat.index}
              aria-controls={openIndex === beat.index ? 'order-editor-picker' : undefined}
              onClick={() => toggle(beat.index)}
            >
              {label && <span className="order-editor__pos">{`${label} · cast`}</span>}
              {beat.pieceId ? (
                <GameIcon
                  source={classPieceIconSource(beat.pieceId)}
                  size={28}
                  fallback={name.charAt(0)}
                  decorative
                />
              ) : (
                <span className="order-editor__mark-slot" aria-hidden="true">
                  <i className="order-editor__mark" />
                </span>
              )}
              <span className="order-editor__beat-name">{name}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={`order-editor__beat${order.finisher.trophyId ? ' order-editor__beat--technique' : ' order-editor__beat--plain'}`}
          aria-label={
            order.finisher.trophyId
              ? `Finisher: ${order.finisher.name}. Equip trophies in the relic section.`
              : 'Finisher. Equip trophies in the relic section.'
          }
          onClick={() => {
            setOpenIndex(null);
            setFullNotice(false);
            scrollToRelic();
          }}
        >
          <span className="order-editor__pos">Finisher</span>
          {order.finisher.trophyId ? (
            <GameIcon
              source={trophyIconSource(order.finisher.trophyId)}
              size={28}
              fallback={order.finisher.name.charAt(0)}
              decorative
            />
          ) : (
            <span className="order-editor__mark-slot" aria-hidden="true">
              <i className="order-editor__mark" />
            </span>
          )}
          <span className="order-editor__beat-name">
            {order.finisher.trophyId
              ? `${order.finisher.name}${order.finisher.rank > 1 ? ` ${rankMark(order.finisher.rank)}` : ''}`
              : 'Finisher'}
          </span>
        </button>
      </div>

      {openBeat && (
        <div
          id="order-editor-picker"
          className="order-editor__picker"
          role="group"
          aria-label={`Techniques for ${positionLabel(openBeat) ?? `beat ${openBeat.index + 1}`}`}
        >
          {fullNotice && (
            <p id="order-editor-full" className="order-editor__full" role="status">
              Every open beat is used.
            </p>
          )}
          <button
            type="button"
            className="class-panel__card class-panel__card--button"
            aria-pressed={openBeat.pieceId === null}
            disabled={!config || openBeat.pieceId === null}
            onClick={() => onPick(openBeat, null)}
          >
            <span className="order-editor__mark-slot" aria-hidden="true">
              <i className="order-editor__mark" />
            </span>
            <span className="class-panel__name">Plain swing</span>
          </button>
          {choices.map((technique) => {
            const here = technique.placedAt === openBeat.index;
            return (
              <button
                key={technique.id}
                type="button"
                className="class-panel__card class-panel__card--button"
                aria-pressed={here}
                aria-describedby={fullNotice ? 'order-editor-full' : undefined}
                disabled={!config || here}
                onClick={() => onPick(openBeat, technique.id)}
              >
                <GameIcon
                  source={classPieceIconSource(technique.id)}
                  size={36}
                  fallback={technique.name.charAt(0)}
                  decorative
                />
                <span>
                  <span className="class-panel__card-title">
                    <span className="class-panel__name">{technique.name}</span>
                    <span className="class-panel__rank">{rankMark(technique.rank)}</span>
                    {technique.placedAt !== null && <span className="class-panel__mark">in use</span>}
                  </span>
                  <span className="class-panel__family">
                    {words(technique.family)}
                    {technique.cast === 'opener' ? ' · opener' : technique.cast === 'windup' ? ' · wind-up' : ''}
                  </span>
                  {technique.lines.map((line, index) => (
                    <span key={index} className="class-panel__line">{line}</span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="order-editor__hold">
        <h4 className="class-panel__subheading">Hold rule</h4>
        {order.holdFinisher.length === 0 ? (
          <p className="class-panel__editor">No hold rule</p>
        ) : (
          <div className="order-editor__hold-lines">
            {order.holdFinisher.map((line, index) => (
              <p key={index} className="class-panel__line">{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
