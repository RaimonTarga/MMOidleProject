import { DialogHeader, GameDialog } from '../primitives';
import { useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  essenceLabel,
  resolveZoneBestiary,
  describeMonsterAbilities,
  describeMonsterMechanics,
  type BestiaryEntry,
  type BestiaryAbilityLine,
  type BestiaryStats,
  type EssenceType,
} from '@mmo-idle/shared';
import { bestiaryZoneNodeIdAtom, bestiaryOpenAtom, bestiaryDetailIdAtom } from '../atoms';
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

function fmtAbilityTime(ms: number): string {
  if (ms % 1000 === 0) return `${ms / 1000}s`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const ABILITY_KIND_LABEL: Record<BestiaryAbilityLine['kind'], string> = {
  cast: 'CAST',
  sequence: 'SEQUENCE',
  passive: 'PASSIVE',
  encounter: 'ENCOUNTER',
};

function AbilityCard({ ability }: { ability: BestiaryAbilityLine }) {
  const timing = [
    ability.castMs !== undefined ? `CAST ${fmtAbilityTime(ability.castMs)}` : null,
    ability.cooldownMs !== undefined ? `EVERY ${fmtAbilityTime(ability.cooldownMs)}` : null,
    ability.initialCooldownMs !== undefined ? `FIRST ${fmtAbilityTime(ability.initialCooldownMs)}` : null,
  ].filter((value): value is string => value !== null);

  return (
    <article className={`bestiary-detail__ability bestiary-detail__ability--${ability.kind}`}>
      <div className="bestiary-detail__ability-header">
        <span className="bestiary-detail__ability-name">{ability.name}</span>
        <span className={`bestiary-detail__ability-kind bestiary-detail__ability-kind--${ability.kind}`}>
          {ABILITY_KIND_LABEL[ability.kind]}
        </span>
      </div>
      {timing.length > 0 && (
        <div className="bestiary-detail__ability-timing">
          {timing.map((value) => <span key={value}>{value}</span>)}
        </div>
      )}
      {ability.trigger && <div className="bestiary-detail__ability-trigger">Trigger: {ability.trigger}</div>}
      <div className="bestiary-detail__ability-detail">{ability.detail}</div>
      {ability.steps && ability.steps.length > 0 && (
        <ol className="bestiary-detail__ability-steps">
          {ability.steps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}
        </ol>
      )}
    </article>
  );
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
        Base rewards (before tier and node bonuses): <b>{r.essence}</b> {essenceLabel(r.essenceType as EssenceType)} essence
        {r.biomeXp ? <> · <b>{r.biomeXp}</b> biome XP</> : null}
        {` · level ${r.level}`}
      </div>
    </>
  );
}

function MonsterDetail({ entry }: { entry: BestiaryEntry }) {
  const abilities = describeMonsterAbilities(entry.def, entry.modifiers);
  const mechs = describeMonsterMechanics(entry.def, entry.modifiers)
    .filter((mechanic) => mechanic.category !== 'ability');
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
          <div className="bestiary-detail__hero-description">{entry.description}</div>
        </div>
      </div>

      <StatGrid entry={entry} />

      <div className="bestiary-detail__abilities">
        <div className="bestiary-detail__section-title">Abilities &amp; encounter beats</div>
        <div className="bestiary-detail__section-help">
          Wind-ups, first-use delays, cooldowns, thresholds, and ordered steps are shown here.
        </div>
        {abilities.length > 0 ? (
          abilities.map((ability) => <AbilityCard key={ability.id} ability={ability} />)
        ) : (
          <div className="bestiary-detail__ability-empty">
            No authored cast ability. This creature relies on basic attacks and the passive traits listed below.
          </div>
        )}
      </div>

      {mechs.length > 0 && (
        <div className="bestiary-detail__mechs">
          <div className="bestiary-detail__section-title">Other mechanics</div>
          {mechs.map((m) => (
            <div key={m.id} className="bestiary-detail__mech">
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
  const nodeId = useAtomValue(bestiaryZoneNodeIdAtom);

  const zone = useMemo(() => (nodeId ? resolveZoneBestiary(nodeId) : null), [nodeId]);

  if (!open || !zone || zone.entries.length === 0) return null;

  const selected =
    zone.entries.find((e) => e.id === detailId) ?? zone.entries[0];

  return (
    <GameDialog size="wide" className="bestiary-detail__panel" onClose={() => setOpen(false)}>
      <DialogHeader title={`Bestiary — ${zone.biomeName}${zone.biomeTier > 0 ? ` T${zone.biomeTier}` : ''}`} closeLabel="Close bestiary" />
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
    </GameDialog>
  );
}
