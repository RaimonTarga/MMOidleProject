import { useEffect, useRef, useState } from 'react';
import {
  withOrders,
  withRoster,
  type ClassConfig,
  type ClassScreenView,
  type FormationOrderChoice,
  type FormationOrders,
  type FormationPieceView,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { GameIcon } from '../GameIcon';
import { classPieceIconSource, trophyIconSource } from '../conceptIcons';
import { useFormationView } from './useFormationView';
import './formationEditor.css';

const ROWS = ['front', 'middle', 'back'] as const;

const ROW_LABEL: Record<(typeof ROWS)[number], string> = {
  front: 'Front',
  middle: 'Middle',
  back: 'Back',
};

function words(id: string): string {
  return id.split('-').join(' ');
}

/** Command as the player reads it: whole numbers plain, Swarm's half as .5. */
function commandText(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function sameConfig(a: ClassConfig | null, b: ClassConfig | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

function recallIsNever(orders: FormationOrders): boolean {
  return orders.recallWhen.length === 0;
}

function recallIsHpLow(orders: FormationOrders): boolean {
  const [only] = orders.recallWhen;
  return orders.recallWhen.length === 1
    && only?.id === 'hp-low'
    && !only.not
    && only.param === undefined;
}

function ChoiceRow<T extends string>({
  label,
  choice,
  onPick,
}: {
  label: string;
  choice: FormationOrderChoice<T>;
  onPick: (value: T) => void;
}) {
  return (
    <>
      <h4 className="class-panel__subheading">{label}</h4>
      <div className="formation-editor__choices" role="group" aria-label={label}>
        {choice.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="formation-editor__choice"
            aria-pressed={choice.value === option.id}
            onClick={() => onPick(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}

function BodyCard({
  piece,
  action,
}: {
  piece: FormationPieceView;
  action: { label: string; aria: string; onClick: () => void };
}) {
  return (
    <article className={`class-panel__card formation-editor__${action.label === 'remove' ? 'body' : 'available'}`}>
      <GameIcon
        source={classPieceIconSource(piece.pieceId)}
        size={36}
        fallback={piece.name.charAt(0)}
        decorative
      />
      <div>
        <div className="class-panel__card-title">
          <span className="class-panel__name">{piece.name}</span>
          <span className="class-panel__family">{words(piece.family)}</span>
          <span className="class-panel__family">{words(piece.mode)}</span>
        </div>
        <p className="class-panel__line">{piece.text}</p>
        <p className="formation-editor__cost">
          {`${commandText(piece.command)} Command`}
          {piece.command !== piece.baseCommand && (
            <span className="formation-editor__base-cost">{` (${commandText(piece.baseCommand)} before your discipline)`}</span>
          )}
        </p>
      </div>
      <button
        type="button"
        className={action.label === 'remove' ? 'formation-editor__remove' : 'formation-editor__add'}
        aria-label={action.aria}
        onClick={action.onClick}
      >
        {action.label}
      </button>
    </article>
  );
}

/**
 * The Conduit's Formation (bible §7.3). The shell renders this when
 * `view.systemKind === 'formation'`. Edits go out as `class:setConfig`.
 * Adding past Command is sent; the validator's reasons stay as `problems`.
 */
export function FormationEditor({ view }: { view: ClassScreenView }) {
  const stored = view.config;
  const [pending, setPending] = useState<ClassConfig | null>(null);
  const sentFrom = useRef<string>('');
  const source = pending ?? stored;
  const formation = useFormationView(source);
  const storedKey = stored ? JSON.stringify(stored) : '';
  const pendingKey = pending ? JSON.stringify(pending) : '';

  useEffect(() => {
    if (!pendingKey) return;
    if (storedKey === pendingKey || storedKey !== sentFrom.current) setPending(null);
  }, [pendingKey, storedKey]);

  function send(next: ClassConfig) {
    if (sameConfig(next, source)) return;
    sentFrom.current = storedKey;
    setPending(next);
    hudBus.requestSetClassConfig(next);
  }

  if (!formation || !source || source.system.kind !== 'formation') {
    return (
      <p className="class-panel__editor">
        The Formation appears once this character&apos;s setup arrives.
      </p>
    );
  }

  const system = source.system;
  const { used, total } = formation.command;
  const pipCount = Math.max(0, Math.ceil(total));
  const over = used > total;

  const placed: { index: number; piece: FormationPieceView }[] = [];
  let cursor = 0;
  for (let index = 0; index < system.roster.length; index += 1) {
    const piece = formation.roster[cursor];
    if (!piece || piece.pieceId !== system.roster[index]) continue;
    placed.push({ index, piece });
    cursor += 1;
  }

  const onRemove = (index: number) => {
    send(withRoster(source, system.roster.filter((_, rosterIndex) => rosterIndex !== index)));
  };

  const onAdd = (pieceId: string) => {
    send(withRoster(source, [...system.roster, pieceId]));
  };

  const onAttack = (value: FormationOrders['attackFirst']) => {
    if (system.orders.attackFirst === value) return;
    send(withOrders(source, { attackFirst: value }));
  };

  const onGuard = (value: FormationOrders['tanksGuard']) => {
    if (system.orders.tanksGuard === value) return;
    send(withOrders(source, { tanksGuard: value }));
  };

  const onRebuild = (value: FormationOrders['rebuildFirst']) => {
    if (system.orders.rebuildFirst === value) return;
    send(withOrders(source, { rebuildFirst: value }));
  };

  const onRecallNever = () => {
    if (recallIsNever(system.orders)) return;
    send(withOrders(source, { recallWhen: [] }));
  };

  const onRecallHpLow = () => {
    if (recallIsHpLow(system.orders)) return;
    send(withOrders(source, { recallWhen: [{ id: 'hp-low' }] }));
  };

  return (
    <div className="formation-editor">
      <p className={`formation-editor__command${over ? ' formation-editor__command--over' : ''}`}>
        {`Command: ${commandText(used)} of ${total}`}
      </p>
      {formation.discipline && (
        <p className="formation-editor__discipline">
          <span className="class-panel__name">{formation.discipline.name}</span>
          {` ${formation.discipline.text}`}
        </p>
      )}
      {formation.specialization && (
        <p className="formation-editor__discipline">
          <span className="class-panel__name">{formation.specialization.name}</span>
          {` ${formation.specialization.text}`}
        </p>
      )}
      {formation.leaf && (
        <p className="formation-editor__discipline">
          <span className="class-panel__name">{formation.leaf.name}</span>
          {` ${formation.leaf.text}`}
        </p>
      )}
      <div
        className="formation-editor__pips"
        role="img"
        aria-label={`Command ${commandText(used)} of ${total}`}
      >
        {Array.from({ length: pipCount }, (_, index) => {
          // Swarm spends half a pip: the pip shows half filled.
          const state = index + 1 <= used ? ' formation-editor__pip--spent' : index < used ? ' formation-editor__pip--half' : '';
          return <span key={index} className={`formation-editor__pip${state}`} aria-hidden="true" />;
        })}
      </div>

      {ROWS.map((row) => {
        const bodies = placed.filter((entry) => entry.piece.row === row);
        if (bodies.length === 0) return null;
        return (
          <section key={row} aria-label={ROW_LABEL[row]}>
            <h4 className="class-panel__subheading">{ROW_LABEL[row]}</h4>
            <div className="class-panel__cards">
              {bodies.map((entry) => (
                <BodyCard
                  key={`${entry.piece.pieceId}-${entry.index}`}
                  piece={entry.piece}
                  action={{
                    label: 'remove',
                    aria: `remove ${entry.piece.name}`,
                    onClick: () => onRemove(entry.index),
                  }}
                />
              ))}
            </div>
          </section>
        );
      })}

      <h4 className="class-panel__subheading">Bound summons</h4>
      <div className="class-panel__cards">
        {formation.available.map((piece) => (
          <BodyCard
            key={piece.pieceId}
            piece={piece}
            action={{
              label: 'add',
              aria: `add ${piece.name}`,
              onClick: () => onAdd(piece.pieceId),
            }}
          />
        ))}
      </div>

      <ChoiceRow label="Attack first" choice={formation.orders.attackFirst} onPick={onAttack} />
      <ChoiceRow label="Tanks guard" choice={formation.orders.tanksGuard} onPick={onGuard} />
      <ChoiceRow label="Rebuild first" choice={formation.orders.rebuildFirst} onPick={onRebuild} />

      <h4 className="class-panel__subheading">Recall</h4>
      {formation.orders.recallWhen.length === 0 ? (
        <p className="class-panel__editor">Never</p>
      ) : (
        <ul className="formation-editor__hold">
          {formation.orders.recallWhen.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      )}
      <div className="formation-editor__choices" role="group" aria-label="Recall">
        <button
          type="button"
          className="formation-editor__choice"
          aria-pressed={recallIsNever(system.orders)}
          onClick={onRecallNever}
        >
          never
        </button>
        <button
          type="button"
          className="formation-editor__choice"
          aria-pressed={recallIsHpLow(system.orders)}
          onClick={onRecallHpLow}
        >
          when my HP is low
        </button>
      </div>

      <h4 className="class-panel__subheading">{formation.souls.length > 1 ? 'Souls' : 'Soul'}</h4>
      {formation.souls.map((soul, slot) => (
        <article key={slot} className={`class-panel__card${soul.trophyId ? '' : ' formation-editor__soul--empty'}`}>
          {soul.trophyId && (
            <GameIcon
              source={trophyIconSource(soul.trophyId)}
              size={36}
              fallback={soul.name.charAt(0)}
              decorative
            />
          )}
          <div>
            <div className="class-panel__card-title">
              <span className="class-panel__name">{soul.name}</span>
              {soul.maxRank > 1 && (
                <span className="class-panel__family">{`Rank ${soul.rank} of ${soul.maxRank}`}</span>
              )}
            </div>
            <p className="class-panel__line">{soul.text}</p>
          </div>
        </article>
      ))}

      {formation.problems.length > 0 && (
        <ul className="formation-editor__problems" role="alert">
          {formation.problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
