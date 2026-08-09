import { createPortal } from 'react-dom';
import { useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  resolveZoneBestiary,
  describeMonsterMechanics,
  type BestiaryEntry,
  type BestiaryStats,
} from '@mmo-idle/shared';
import { playerNodeIdAtom, bestiaryOpenAtom, bestiaryDetailIdAtom } from '../atoms';
import { MonsterSprite } from './MonsterSprite';
import './bestiary.css';

const ROLE_LABEL: Record<BestiaryEntry['role'], string> = {
  trash: 'Common',
  guardian: 'Guardian',
  boss: 'Boss',
};

function fmtCooldown(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

/** A stat cell, showing the base value in parens when the zone modified it. */
function Stat({
  label,
  value,
  base,
}: {
  label: string;
  value: string | number;
  base?: string | number;
}) {
  return (
    <div className="bestiary-detail__stat">
      <span className="bestiary-detail__stat-label">{label}</span>
      <span className="bestiary-detail__stat-value">
        {value}
        {base !== undefined && base !== value && (
          <span className="bestiary-detail__stat-base"> (base {base})</span>
        )}
      </span>
    </div>
  );
}

function StatGrid({ entry }: { entry: BestiaryEntry }) {
  const s = entry.stats;
  const b: BestiaryStats | undefined = entry.baseStats;
  const r = entry.def.rewards;
  return (
    <>
      <div className="bestiary-detail__grid">
        <Stat label="Health" value={s.hp.toLocaleString()} base={b?.hp.toLocaleString()} />
        <Stat label="Attack" value={s.attack} base={b?.attack} />
        <Stat label="DPS" value={s.dps} base={b?.dps} />
        <Stat label="Attack speed" value={fmtCooldown(s.attackCooldown)} base={b ? fmtCooldown(b.attackCooldown) : undefined} />
        <Stat label="Plating" value={s.plating} base={b?.plating} />
        <Stat label="Damage reduction" value={`${Math.round(s.damageReduction * 100)}%`} base={b ? `${Math.round(b.damageReduction * 100)}%` : undefined} />
        <Stat label="Evasion" value={`${Math.round(s.evasion * 100)}%`} />
        <Stat label="Move speed" value={s.speed} base={b?.speed} />
        <Stat label="Attack range" value={`${s.attackRange}px`} />
        <Stat label="Pull range" value={`${s.pullRange}px`} />
        <Stat label="Leash range" value={`${s.leashRange}px`} />
        <Stat
          label="Combat"
          value={
            s.behavior === 'kiter'
              ? 'Kiter'
              : s.behavior === 'ranged'
                ? 'Ranged'
                : 'Melee'
          }
        />
      </div>
      <div className="bestiary-detail__rewards">
        Rewards: <b>{r.essence}</b> {r.essenceType} essence
        {r.biomeXp ? <> · <b>{r.biomeXp}</b> biome XP</> : null}
        {` · level ${r.level}`}
      </div>
    </>
  );
}

function MonsterDetail({ entry }: { entry: BestiaryEntry }) {
  const mechs = describeMonsterMechanics(entry.def, entry.modifiers);
  return (
    <div className="bestiary-detail__pane">
      <div className="bestiary-detail__hero">
        <MonsterSprite
          monsterTypeId={entry.id}
          size={112}
          fallbackColor={entry.color}
          className="bestiary-detail__hero-sprite"
        />
        <div className="bestiary-detail__hero-text">
          <div className="bestiary-detail__hero-name">{entry.name}</div>
          <div className="bestiary-detail__hero-role">
            {ROLE_LABEL[entry.role]}
            {entry.guardLabel ? ` · ${entry.guardLabel}` : ''}
            {entry.modified ? ' · scaled for this dungeon' : ''}
          </div>
          <div className="bestiary-detail__hero-profile">{entry.profile}</div>
        </div>
      </div>

      <StatGrid entry={entry} />

      {mechs.length > 0 && (
        <div className="bestiary-detail__mechs">
          <div className="bestiary-detail__section-title">Mechanics</div>
          {mechs.map((m) => (
            <div key={m.id} className="bestiary-detail__mech">
              <span className="bestiary-detail__mech-icon" style={m.color ? { color: m.color } : undefined}>
                {m.icon}
              </span>
              <span className="bestiary-detail__mech-text">
                <b style={m.color ? { color: m.color } : undefined}>{m.label}</b> — {m.detail}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BestiaryDetailOverlay() {
  const [open, setOpen] = useAtom(bestiaryOpenAtom);
  const [detailId, setDetailId] = useAtom(bestiaryDetailIdAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);

  const zone = useMemo(() => (nodeId ? resolveZoneBestiary(nodeId) : null), [nodeId]);

  if (!open || !zone || zone.entries.length === 0) return null;

  const selected =
    zone.entries.find((e) => e.id === detailId) ?? zone.entries[0];

  return createPortal(
    <div className="inv-overlay" onClick={() => setOpen(false)}>
      <div
        className="inv-panel bestiary-detail__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inv-header">
          <span className="inv-title">
            Bestiary — {zone.biomeName}
            {zone.biomeTier > 0 ? ` T${zone.biomeTier}` : ''}
          </span>
          <button type="button" className="inv-close" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>

        <div className="bestiary-detail__body">
          <div className="bestiary-detail__list">
            {zone.entries.map((e) => (
              <button
                key={`${e.role}-${e.id}`}
                className={`bestiary-detail__list-item${e.id === selected.id ? ' is-selected' : ''}`}
                onClick={() => setDetailId(e.id)}
              >
                <MonsterSprite monsterTypeId={e.id} size={32} fallbackColor={e.color} />
                <span className="bestiary-detail__list-name">{e.name}</span>
                {e.role !== 'trash' && (
                  <span className={`bestiary__tag bestiary__tag--${e.role}`}>
                    {e.role === 'boss' ? 'BOSS' : 'GUARD'}
                  </span>
                )}
              </button>
            ))}
          </div>

          <MonsterDetail entry={selected} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
