import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import type { EquipmentSlot } from '@mmo-idle/shared';
import {
  ASHBRAND_DURATION_MS, ASHBRAND_TICK_MS,
  BURN_FAMILY, CHAOTIC_FAMILY, GAME_CONFIG,
  ITEM_DATABASE, RECIPE_DATABASE, SACRED_APS_MULT, SACRED_DMG_MULT,
  SACRED_FAMILY, UPGRADE_STAT_BY_SLOT, upgradeStatBonusTotal,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import {
  attackAtom,
  attackCooldownAtom,
  damageReductionAtom,
  equipmentAtom,
  evasionAtom,
  hpRegenAtom,
  itemUpgradesAtom,
  maxHpAtom,
  platingAtom,
  speedAtom,
} from '../../hud/atoms';
import { SLOT_LABELS, biomeName, tierColor } from './constants';
import type { FocusedItem } from './useFocus';

interface StatConfig {
  key:      string;
  label:    string;
  fmt:      (v: number) => string;
  fmtDelta: (d: number) => string;
}

const STAT_CONFIG: StatConfig[] = [
  { key: 'attack',          label: 'ATK',   fmt: v => String(Math.round(v)),            fmtDelta: d => `${d >= 0 ? '+' : ''}${Math.round(d)}`            },
  { key: 'maxHp',           label: 'HP',    fmt: v => String(Math.round(v)),            fmtDelta: d => `${d >= 0 ? '+' : ''}${Math.round(d)}`            },
  { key: 'hpRegen',         label: 'REGEN', fmt: v => String(Math.round(v * 10) / 10), fmtDelta: d => `${d >= 0 ? '+' : ''}${Math.round(d * 10) / 10}` },
  { key: 'plating',         label: 'PLT',   fmt: v => String(Math.round(v)),            fmtDelta: d => `${d >= 0 ? '+' : ''}${Math.round(d)}`            },
  { key: 'damageReduction', label: 'DR',    fmt: v => `${Math.round(v * 100)}%`,        fmtDelta: d => `${d >= 0 ? '+' : ''}${Math.round(d * 100)}%`    },
  { key: 'speed',           label: 'SPD',   fmt: v => String(Math.round(v)),            fmtDelta: d => `${d >= 0 ? '+' : ''}${Math.round(d)}`            },
];

function getItemContribs(defId: string | null | undefined, upgrades: Record<string, number>): Record<string, number> {
  if (!defId) return {};
  const def = ITEM_DATABASE.get(defId);
  if (!def) return {};
  const result: Record<string, number> = { ...def.statModifiers };
  const plus = upgrades[defId] ?? 0;
  if (plus > 0) {
    const slot   = def.slot as EquipmentSlot;
    const upStat = UPGRADE_STAT_BY_SLOT[slot];
    result[upStat] = (result[upStat] ?? 0) + upgradeStatBonusTotal(slot, def.tier, plus);
  }
  return result;
}

interface Props {
  focused:  FocusedItem | null;
  onFocus:  (item: FocusedItem | null) => void;
}

// Converts mechanicEffects key/value pairs into human-readable lines.
// Companion keys (e.g. interval alongside pct) are consumed together.
function formatMechanicEffects(fx: Record<string, number> | undefined): string[] {
  if (!fx || Object.keys(fx).length === 0) return [];
  const lines: string[] = [];
  const seen  = new Set<string>();
  const has   = (k: string) => k in fx;
  const pct   = (k: string) => `${Math.round((fx[k] ?? 0) * 100)}%`;
  const sec   = (k: string) => `${Math.round((fx[k] ?? 0) / 1000)}s`;
  const mark  = (...keys: string[]) => keys.forEach(k => seen.add(k));

  if (has('defense.shield-pct')) {
    const interval = fx['defense.shield-interval-ms'];
    const every = interval ? ` every ${Math.round(interval / 1000)}s` : '';
    lines.push(`${pct('defense.shield-pct')} max HP shield in combat${every}`);
    mark('defense.shield-pct', 'defense.shield-interval-ms', 'defense.shield-duration-ms');
  }

  if (has('defense.in-combat-regen-pct')) {
    lines.push(`${pct('defense.in-combat-regen-pct')} of HP regen applies while in combat`);
    mark('defense.in-combat-regen-pct');
  }

  if (has('defense.regen-burst-pct')) {
    const every = has('defense.regen-burst-interval-ms') ? ` every ${sec('defense.regen-burst-interval-ms')}` : '';
    lines.push(`Restore ${pct('defense.regen-burst-pct')} max HP${every} in combat`);
    mark('defense.regen-burst-pct', 'defense.regen-burst-interval-ms');
  }

  if (has('defense.kill-burst-pct')) {
    lines.push(`Restore ${pct('defense.kill-burst-pct')} max HP over 4s on kill`);
    mark('defense.kill-burst-pct');
  }

  if (has('defense.absorb-pct')) {
    lines.push(`${pct('defense.absorb-pct')} of damage taken becomes healing over time`);
    mark('defense.absorb-pct');
  }

  if (has('defense.hit-to-dot-pct')) {
    lines.push(`${pct('defense.hit-to-dot-pct')} of incoming damage deferred as ticking damage`);
    mark('defense.hit-to-dot-pct');
  }

  if (has('defense.max-hit-pct')) {
    lines.push(`Single hits capped at ${pct('defense.max-hit-pct')} of your max HP`);
    mark('defense.max-hit-pct');
  }

  if (has('defense.dot-resistance') || has('defense.debuff-resistance')) {
    const parts: string[] = [];
    if (has('defense.dot-resistance'))   parts.push(`${pct('defense.dot-resistance')} DoT resistance`);
    if (has('defense.debuff-resistance')) parts.push(`${pct('defense.debuff-resistance')} debuff resistance`);
    lines.push(parts.join(', '));
    mark('defense.dot-resistance', 'defense.debuff-resistance');
  }

  if (has('defense.cleanse-stacks')) {
    const n = fx['defense.cleanse-stacks'] ?? 1;
    const every = has('defense.cleanse-interval-ms') ? ` every ${sec('defense.cleanse-interval-ms')}` : '';
    lines.push(`Remove ${n} debuff stack${n !== 1 ? 's' : ''}${every}`);
    mark('defense.cleanse-stacks', 'defense.cleanse-interval-ms');
  }

  // Fallback for any keys not yet handled
  for (const [k, v] of Object.entries(fx)) {
    if (!seen.has(k)) lines.push(`${k.replace(/^defense\./, '').replace(/-/g, ' ')}: ${v}`);
  }

  return lines;
}

// Generates human-readable effect lines for weapon families (Chaotic / Sacred / Burn).
// Returns an empty array for weapons with no special family mechanic.
function formatWeaponEffects(weaponId: string): string[] {
  const lines: string[] = [];

  // Chaotic family
  const missEvery = CHAOTIC_FAMILY[weaponId];
  if (missEvery !== undefined) {
    lines.push(`Every ${missEvery}${ordinal(missEvery)} hit deals no damage`);
    lines.push(`On-hit effects and procs still fire on missed swings`);
  }

  // Sacred family
  const sacred = SACRED_FAMILY[weaponId];
  if (sacred) {
    const cd  = sacred.cdMs  / 1000;
    const buf = sacred.buffMs / 1000;
    lines.push(`Every ${cd}s: next attack triggers a ${buf}s burst`);
    lines.push(`Burst: ${SACRED_DMG_MULT}× damage, ${SACRED_APS_MULT}× attack speed`);
  }

  // Burn family
  const burn = BURN_FAMILY.find(b => b.weaponId === weaponId);
  if (burn) {
    const convPct  = Math.round(burn.convPct  * 100);
    const keepPct  = 100 - convPct;
    const tickSec  = ASHBRAND_TICK_MS     / 1000;
    const durSec   = ASHBRAND_DURATION_MS / 1000;
    lines.push(`${convPct}% of hit damage → burn DoT, ${keepPct}% dealt directly`);
    lines.push(`Up to ${burn.maxStacks} stacks — ticks every ${tickSec}s, expires after ${durSec}s`);
  }

  return lines;
}

function ordinal(n: number): string {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}

// Returns the base cooldown (ms) a weapon dictates, before skill multipliers.
function weaponBaseMs(defId: string | null | undefined): number {
  const aps = defId ? (ITEM_DATABASE.get(defId)?.attacksPerSecond ?? null) : null;
  return aps != null ? Math.round(1000 / aps) : GAME_CONFIG.PLAYER_ATTACK_COOLDOWN;
}

export function StatSheet({ focused, onFocus }: Props) {
  const attack          = useAtomValue(attackAtom);
  const maxHp           = useAtomValue(maxHpAtom);
  const hpRegen         = useAtomValue(hpRegenAtom);
  const plating         = useAtomValue(platingAtom);
  const damageReduction = useAtomValue(damageReductionAtom);
  const speed           = useAtomValue(speedAtom);
  const attackCooldown  = useAtomValue(attackCooldownAtom);
  const evasion         = useAtomValue(evasionAtom);
  const equipment       = useAtomValue(equipmentAtom);
  const itemUpgrades    = useAtomValue(itemUpgradesAtom);

  const playerStats: Record<string, number> = { attack, maxHp, hpRegen, plating, damageReduction, speed };

  // Derived combat stats
  const currentAps = 1000 / attackCooldown;
  const currentDps = attack * currentAps;

  const info = useMemo(() => {
    if (!focused) return null;
    const itemDef = ITEM_DATABASE.get(focused.defId);
    if (!itemDef) return null;

    const plus       = itemUpgrades[focused.defId] ?? 0;
    const isEquipped = focused.source === 'equipped';
    const slot       = itemDef.slot as EquipmentSlot;
    const recipe     = RECIPE_DATABASE.get(focused.defId) ?? null;
    const color      = tierColor(itemDef.tier);
    const slotFilled = !!equipment[slot];

    // Unequip preview: you'd lose this item's stats
    // Equip preview:   you'd swap current-in-slot for this item
    const newContribs = isEquipped ? {} : getItemContribs(focused.defId, itemUpgrades);
    const oldContribs = isEquipped
      ? getItemContribs(focused.defId, itemUpgrades)
      : getItemContribs(equipment[slot], itemUpgrades);

    const delta: Record<string, number> = {};
    for (const key of new Set([...Object.keys(newContribs), ...Object.keys(oldContribs)])) {
      const d = (newContribs[key] ?? 0) - (oldContribs[key] ?? 0);
      if (d !== 0) delta[key] = d;
    }

    // APS comparison for weapon swaps: scale the live authoritative cooldown by the ratio
    // of the two weapons' base cooldowns (preserves skill speed multipliers exactly).
    let apsProposed: number | null = null;
    if (slot === 'weapon') {
      const currentBase  = weaponBaseMs(isEquipped ? focused.defId  : equipment.weapon);
      const proposedBase = weaponBaseMs(isEquipped ? null           : focused.defId);
      if (currentBase !== proposedBase) {
        // Capture attackCooldown from outer scope — it's a dep of this memo.
        apsProposed = null; // resolved below after memo (requires attackCooldown closure)
      }
      // Store bases so the outer scope can compute proposed APS
    }

    const actionLabel = isEquipped ? 'Unequip' : slotFilled ? 'Replace' : 'Equip';

    return { itemDef, plus, isEquipped, slot, recipe, color, delta, actionLabel,
             weaponSwap: slot === 'weapon' ? {
               currentBase:  weaponBaseMs(isEquipped ? focused.defId : equipment.weapon),
               proposedBase: weaponBaseMs(isEquipped ? null          : focused.defId),
             } : null };
  }, [focused, equipment, itemUpgrades]);

  // Proposed APS/DPS — computed outside the memo so attackCooldown is a live dep.
  const proposedAps = info?.weaponSwap && info.weaponSwap.currentBase !== info.weaponSwap.proposedBase
    ? currentAps * (info.weaponSwap.currentBase / info.weaponSwap.proposedBase)
    : null;
  const proposedAttack = info ? attack + (info.delta.attack ?? 0) : null;
  const proposedDps    = proposedAps  != null && proposedAttack != null ? proposedAttack * proposedAps
                       : proposedAttack != null && proposedAttack !== attack  ? proposedAttack * currentAps
                       : null;

  function handleAction() {
    if (!focused || !info) return;
    if (info.isEquipped && focused.equipSlot) {
      hudBus.requestUnequipItem(focused.equipSlot);
    } else {
      hudBus.requestEquipItem(focused.defId);
    }
  }

  return (
    <div
      className="inv-stat-sheet"
      onMouseEnter={() => focused && onFocus(focused)}
      onMouseLeave={() => onFocus(null)}
    >
      {/* ── Item context header ─────────────────────────── */}
      {info ? (
        <div className="inv-stat-sheet__item-header" style={{ borderColor: `${info.color}44` }}>
          <div className="inv-stat-sheet__item-row">
            <span className="inv-stat-sheet__item-name">{info.itemDef.name}</span>
            {info.plus > 0 && (
              <span className="inv-stat-sheet__plus">+{info.plus}</span>
            )}
            <span className="inv-stat-sheet__tier" style={{ color: info.color }}>T{info.itemDef.tier}</span>
            <span className="inv-stat-sheet__slot-label">{SLOT_LABELS[info.slot]}</span>
          </div>
          {info.recipe?.recipeGroup && (
            <div className="inv-stat-sheet__biome">{biomeName(info.recipe.recipeGroup)}</div>
          )}
        </div>
      ) : (
        <div className="inv-stat-sheet__heading">YOUR STATS</div>
      )}

      {/* ── Stat rows ───────────────────────────────────── */}
      <div className="inv-stat-sheet__rows">
        {STAT_CONFIG.map(cfg => {
          const current = playerStats[cfg.key] ?? 0;
          const d       = info?.delta[cfg.key];
          const changed = d !== undefined && d !== 0;
          const up      = (d ?? 0) > 0;

          const mainRow = (
            <div
              key={cfg.key}
              className={['inv-stat-row', changed ? (up ? 'inv-stat-row--up' : 'inv-stat-row--down') : ''].filter(Boolean).join(' ')}
            >
              <span className="inv-stat-row__label">{cfg.label}</span>
              <span className="inv-stat-row__value">{cfg.fmt(current)}</span>
              {changed && (
                <>
                  <span className="inv-stat-row__arrow">→</span>
                  <span className="inv-stat-row__proposed">{cfg.fmt(current + (d ?? 0))}</span>
                  <span className={`inv-stat-row__delta inv-stat-row__delta--${up ? 'up' : 'down'}`}>
                    {cfg.fmtDelta(d!)}
                  </span>
                </>
              )}
            </div>
          );

          if (cfg.key !== 'attack') return mainRow;

          // Inject APS + DPS immediately after ATK
          const fmtAps     = (v: number) => (Math.round(v * 100) / 100).toFixed(2);
          const fmtDps     = (v: number) => (Math.round(v * 10)  / 10).toFixed(1);
          const apsChanged = proposedAps !== null;
          const apsUp      = (proposedAps ?? currentAps) > currentAps;
          const dpsChanged = proposedDps !== null;
          const dpsUp      = (proposedDps ?? currentDps) > currentDps;

          return (
            <>
              {mainRow}
              <div key="aps" className={['inv-stat-row inv-stat-row--derived', apsChanged ? (apsUp ? 'inv-stat-row--up' : 'inv-stat-row--down') : ''].filter(Boolean).join(' ')}>
                <span className="inv-stat-row__label">APS</span>
                <span className="inv-stat-row__value">{fmtAps(currentAps)}</span>
                {apsChanged && proposedAps !== null && (
                  <>
                    <span className="inv-stat-row__arrow">→</span>
                    <span className="inv-stat-row__proposed">{fmtAps(proposedAps)}</span>
                    <span className={`inv-stat-row__delta inv-stat-row__delta--${apsUp ? 'up' : 'down'}`}>
                      {apsUp ? '+' : ''}{(Math.round((proposedAps - currentAps) * 100) / 100).toFixed(2)}
                    </span>
                  </>
                )}
              </div>
              <div key="dps" className={['inv-stat-row inv-stat-row--derived', dpsChanged ? (dpsUp ? 'inv-stat-row--up' : 'inv-stat-row--down') : ''].filter(Boolean).join(' ')}>
                <span className="inv-stat-row__label">DPS</span>
                <span className="inv-stat-row__value">{fmtDps(currentDps)}</span>
                {dpsChanged && proposedDps !== null && (
                  <>
                    <span className="inv-stat-row__arrow">→</span>
                    <span className="inv-stat-row__proposed">{fmtDps(proposedDps)}</span>
                    <span className={`inv-stat-row__delta inv-stat-row__delta--${dpsUp ? 'up' : 'down'}`}>
                      {dpsUp ? '+' : ''}{(Math.round((proposedDps - currentDps) * 10) / 10).toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            </>
          );
        })}

        {/* Evasion — shown only when active; no comparison (probabilistic stacking) */}
        {evasion > 0 && (
          <div className="inv-stat-row">
            <span className="inv-stat-row__label">EVS</span>
            <span className="inv-stat-row__value">1 in {evasion}</span>
          </div>
        )}
      </div>

      {/* ── Mechanic + weapon effects ────────────────────────────────── */}
      {(() => {
        if (!info) return null;
        const lines = [
          ...formatMechanicEffects(info.itemDef.mechanicEffects),
          ...(info.itemDef.slot === 'weapon' ? formatWeaponEffects(info.itemDef.id) : []),
        ];
        if (lines.length === 0) return null;
        return (
          <div className="inv-stat-sheet__effects">
            <div className="inv-stat-sheet__effects-label">EFFECTS</div>
            <ul className="inv-stat-sheet__effects-list">
              {lines.map((line, i) => (
                <li key={i} className="inv-stat-sheet__effects-line">{line}</li>
              ))}
            </ul>
          </div>
        );
      })()}

      {/* ── Flavor text (item description lore) ─────────── */}
      {info?.itemDef.description && (
        <p className="inv-stat-sheet__flavor">{info.itemDef.description}</p>
      )}

      {/* ── Footer ──────────────────────────────────────── */}
      <div className="inv-stat-sheet__footer">
        {!info && (
          <span className="inv-stat-sheet__hint">Hover an item to compare</span>
        )}
        {info && (
          <button
            className={`inv-stat-sheet__btn${info.isEquipped ? ' inv-stat-sheet__btn--unequip' : ''}`}
            onClick={handleAction}
          >
            {info.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
