import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import type { ClassConfig, ClassPieceCardView, ClassTrophyCardView } from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { playerIdAtom } from '../../hud/atoms';
import { DialogHeader, GameDialog } from '../../hud/primitives';
import { GameIcon } from '../GameIcon';
import {
  classEmblemIconSource,
  classPieceIconSource,
  disciplineIconSource,
  trophyIconSource,
} from '../conceptIcons';
import { ClassSystemEditor } from './ClassSystemEditor';
import { rankMark } from './format';
import { markClassScreenSeen } from './seen';
import { useClassScreen } from './useClassScreen';
import './classPanel.css';

interface Props {
  onClose: () => void;
}

function words(id: string): string {
  return id.split('-').join(' ');
}

/**
 * Equip sends the current config with this trophy alone and custom mode.
 * One id, as the shell's click is specified; a second slot stays empty until
 * that class's editor fills both.
 */
function configEquipping(config: ClassConfig, id: string): ClassConfig | null {
  const already =
    config.mode === 'custom'
    && config.relic.length === 1
    && config.relic[0] === id;
  if (already) return null;
  return { ...config, mode: 'custom', relic: [id] };
}

function PieceCard({ piece }: { piece: ClassPieceCardView }) {
  return (
    <article className="class-panel__card">
      <GameIcon
        source={classPieceIconSource(piece.id)}
        size={36}
        fallback={piece.name.charAt(0)}
        decorative
      />
      <div>
        <div className="class-panel__card-title">
          <span className="class-panel__name">{piece.name}</span>
          <span className="class-panel__rank">{rankMark(piece.rank)}</span>
          {piece.placed && <span className="class-panel__mark">in use</span>}
          {piece.isNew && <span className="class-panel__new">NEW</span>}
        </div>
        <div className="class-panel__family">{words(piece.family)}</div>
        {piece.lines.map((line, index) => (
          <p key={index} className="class-panel__line">{line}</p>
        ))}
      </div>
    </article>
  );
}

function TrophyCard({ trophy, markEquipped = false }: { trophy: ClassTrophyCardView; markEquipped?: boolean }) {
  return (
    <>
      <GameIcon
        source={trophyIconSource(trophy.id)}
        size={36}
        fallback={trophy.name.charAt(0)}
        decorative
      />
      <div>
        <div className="class-panel__card-title">
          <span className="class-panel__name">{trophy.name}</span>
          <span className="class-panel__rank">{rankMark(trophy.rank)}</span>
          {markEquipped && trophy.equipped && <span className="class-panel__mark">equipped</span>}
          {trophy.isNew && <span className="class-panel__new">NEW</span>}
        </div>
        <div className="class-panel__family">{words(trophy.kind)}</div>
        {trophy.lines.map((line, index) => (
          <p key={index} className="class-panel__line">{line}</p>
        ))}
      </div>
    </>
  );
}

export function ClassPanel({ onClose }: Props) {
  const playerId = useAtomValue(playerIdAtom);
  const { view } = useClassScreen();
  const shownRef = useRef(new Set<string>());
  // The character who opened this panel. A switch must not write their ids
  // onto the next character's seen list.
  const ownerId = useRef<string | null>(playerId);

  useEffect(() => {
    if (!view || !ownerId.current || ownerId.current !== playerId) return;
    for (const piece of view.pieces) shownRef.current.add(piece.id);
    for (const trophy of view.trophies) shownRef.current.add(trophy.id);
  }, [playerId, view]);

  useEffect(() => () => {
    const id = ownerId.current;
    if (!id || shownRef.current.size === 0) return;
    markClassScreenSeen(id, [...shownRef.current]);
  }, []);

  if (!view) return null;

  const screen = view;
  const config = screen.config;
  const equipped = view.relic.equipped
    .map((id) => view.trophies.find((trophy) => trophy.id === id))
    .filter((trophy): trophy is ClassTrophyCardView => trophy !== undefined);
  const emptySlots = Math.max(0, view.relic.slots - equipped.length);

  function onBackToAuto() {
    if (!config || screen.mode !== 'custom') return;
    hudBus.requestSetClassConfig({ ...config, mode: 'auto' });
  }

  function onEquip(id: string) {
    if (!config) return;
    const next = configEquipping(config, id);
    if (!next) return;
    hudBus.requestSetClassConfig(next);
  }

  return (
    <GameDialog
      size="wide"
      className="class-panel"
      onClose={onClose}
    >
      <DialogHeader
        title={view.className}
        closeLabel={`Close ${view.systemName}`}
        icon={(
          <GameIcon
            source={classEmblemIconSource(view.archetype)}
            size={22}
            fallback={view.className.charAt(0)}
            decorative
          />
        )}
      />
      <div className="class-panel__body">
        <div className="class-panel__header">
          {view.discipline && (
            <div className="class-panel__discipline">
              <GameIcon
                source={disciplineIconSource(view.discipline.id)}
                size={28}
                fallback={view.discipline.name.charAt(0)}
                decorative
              />
              <div>
                <div className="class-panel__discipline-name">{view.discipline.name}</div>
                <p className="class-panel__fantasy">{view.discipline.fantasy}</p>
              </div>
            </div>
          )}
          <div className="class-panel__mode">
            <span className="class-panel__mode-label">
              {view.mode === 'auto' ? 'Auto' : 'Custom'}
            </span>
            {view.mode === 'auto' && (
              <span className="class-panel__mode-note">(the class sets itself up)</span>
            )}
            <button
              type="button"
              className="class-panel__auto"
              disabled={view.mode === 'auto' || !config}
              onClick={onBackToAuto}
            >
              Back to auto
            </button>
          </div>
        </div>

        <section className="class-panel__section" aria-labelledby="class-panel-budget">
          <h3 id="class-panel-budget" className="class-panel__heading">Budget</h3>
          <p className="class-panel__budget">{view.budget.text}</p>
        </section>

        <section className="class-panel__section" aria-labelledby="class-panel-relic">
          <h3 id="class-panel-relic" className="class-panel__heading">Relic</h3>
          <div className={`class-panel__slots${view.relic.slots > 1 ? ' class-panel__slots--two' : ''}`}>
            {equipped.map((trophy) => (
              <article key={trophy.id} className="class-panel__card">
                <TrophyCard trophy={trophy} />
              </article>
            ))}
            {Array.from({ length: emptySlots }, (_, index) => (
              <div key={`empty-${index}`} className="class-panel__card class-panel__card--empty">
                Beat a boss to earn a trophy
              </div>
            ))}
          </div>
          {view.trophies.length > 0 && (
            <>
              <h4 className="class-panel__subheading">Owned trophies</h4>
              <div className="class-panel__cards">
                {view.trophies.map((trophy) => {
                  const held =
                    !!config
                    && config.mode === 'custom'
                    && config.relic.length === 1
                    && config.relic[0] === trophy.id;
                  return (
                    <button
                      key={trophy.id}
                      type="button"
                      className="class-panel__card class-panel__card--button"
                      aria-label={`Equip ${trophy.name}`}
                      aria-pressed={trophy.equipped}
                      disabled={!config || held}
                      onClick={() => onEquip(trophy.id)}
                    >
                      <TrophyCard trophy={trophy} markEquipped />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="class-panel__section" aria-label={view.systemName}>
          <h3 className="class-panel__heading">{view.systemName}</h3>
          <ClassSystemEditor view={view} />
        </section>

        <section className="class-panel__section" aria-labelledby="class-panel-pieces">
          <h3 id="class-panel-pieces" className="class-panel__heading">Pieces</h3>
          {view.pieces.length === 0 ? (
            <p className="class-panel__empty">No pieces yet.</p>
          ) : (
            <div className="class-panel__cards">
              {view.pieces.map((piece) => <PieceCard key={piece.id} piece={piece} />)}
            </div>
          )}
        </section>

        {view.upcoming.length > 0 && (
          <section className="class-panel__section" aria-labelledby="class-panel-upcoming">
            <h3 id="class-panel-upcoming" className="class-panel__heading">Coming this tier</h3>
            <div className="class-panel__cards">
              {view.upcoming.map((lesson) => (
                <article
                  key={`${lesson.pieceId}-${lesson.rank}-${lesson.where}`}
                  className="class-panel__card class-panel__card--upcoming"
                >
                  <GameIcon
                    source={classPieceIconSource(lesson.pieceId)}
                    size={36}
                    fallback={lesson.pieceName.charAt(0)}
                    decorative
                  />
                  <div>
                    <div className="class-panel__card-title">
                      <span className="class-panel__name">{lesson.pieceName}</span>
                      <span className="class-panel__where">{lesson.where}</span>
                    </div>
                    <p className="class-panel__line">{lesson.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </GameDialog>
  );
}
