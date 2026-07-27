import { useMemo, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  resolveZoneBestiary,
  describeMonsterMechanics,
  type BestiaryEntry,
} from '@mmo-idle/shared';
import { playerNodeIdAtom, bestiaryOpenAtom, bestiaryDetailIdAtom } from '../atoms';
import { MonsterSprite } from './MonsterSprite';
import './bestiary.css';

const ROLE_TAG: Record<BestiaryEntry['role'], string | null> = {
  trash: null,
  guardian: 'GUARD',
  boss: 'BOSS',
};

function BestiaryRow({ entry, onOpen }: { entry: BestiaryEntry; onOpen: () => void }) {
  // Only the compact, icon-bearing mechanics are worth showing inline.
  const mechs = describeMonsterMechanics(entry.def, entry.modifiers);
  const tag = ROLE_TAG[entry.role];

  return (
    <button
      className={`bestiary__row bestiary__row--${entry.role}`}
      onClick={onOpen}
      title={`${entry.name} — ${entry.profile}`}
    >
      <MonsterSprite
        monsterTypeId={entry.id}
        size={28}
        fallbackColor={entry.color}
        className="bestiary__sprite"
      />
      <div className="bestiary__row-body">
        <div className="bestiary__row-name-line">
          <span className="bestiary__name">{entry.name}</span>
          {tag && <span className={`bestiary__tag bestiary__tag--${entry.role}`}>{tag}</span>}
        </div>
        <div className="bestiary__row-stats">
          <span>HP <b>{entry.stats.hp.toLocaleString()}</b></span>
          <span>DPS <b>{entry.stats.dps}</b></span>
          {mechs.length > 0 && (
            <span className="bestiary__mech-icons">
              {mechs.slice(0, 6).map((m) => (
                <span key={m.id} title={m.label} style={m.color ? { color: m.color } : undefined}>
                  {m.icon}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function BestiaryPanel() {
  const [expanded, setExpanded] = useState(true);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const setOpen = useSetAtom(bestiaryOpenAtom);
  const setDetailId = useSetAtom(bestiaryDetailIdAtom);

  const zone = useMemo(() => (nodeId ? resolveZoneBestiary(nodeId) : null), [nodeId]);

  function open(id: string) {
    setDetailId(id);
    setOpen(true);
  }

  const hasEntries = zone && zone.entries.length > 0;

  return (
    <div className="bestiary combat-log">
      <button className="combat-log__header" onClick={() => setExpanded((e) => !e)}>
        <span className="combat-log__title">BESTIARY</span>
        {zone && (
          <span className="bestiary__zone">
            {zone.biomeName}{zone.biomeTier > 0 ? ` T${zone.biomeTier}` : ''}
            {zone.isDungeon ? ' ⚑' : ''}
          </span>
        )}
        <span className="combat-log__chevron">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="bestiary__body">
          {!hasEntries ? (
            <div className="combat-log__empty">No monsters in this area.</div>
          ) : (
            zone!.entries.map((e) => (
              <BestiaryRow key={`${e.role}-${e.id}`} entry={e} onOpen={() => open(e.id)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
