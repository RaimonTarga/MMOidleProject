import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import type { EquipmentSlot } from '@mmo-idle/shared';
import {
  GAME_CONFIG,
  ITEM_DATABASE, RECIPE_DATABASE, upgradeStatBonusTotal,
  resolveEmpoweredMultiplier,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import {
  attackAtom,
  attackCooldownAtom,
  attackRangeAtom,
  combatArchetypeAtom,
  damageReductionAtom,
  equipmentAtom,
  dodgeRateAtom,
  evadeMitigationAtom,
  hpRegenAtom,
  itemUpgradesAtom,
  maxHpAtom,
  onHitDamageAtom,
  passivesAtom,
  platingAtom,
  speedAtom,
} from '../../hud/atoms';
import { SLOT_LABELS, biomeName, tierColor } from './constants';
import { STAT_META, formatMechanicEffects, formatWeaponEffects } from '../crafting/itemDisplay';
import type { FocusedItem } from './useFocus';

// Player-stat rows, in display order. Labels/formatters come from the shared
// STAT_META so crafting + inventory read identically. onHitDamage/attackRange
// are appended so weapons with those secondaries are fully represented.
const STAT_ROWS = (
  ['attack', 'maxHp', 'hpRegen', 'plating', 'damageReduction', 'speed', 'onHitDamage', 'attackRange'] as const
).map(key => ({ key, ...STAT_META[key] }));

function getItemContribs(defId: string | null | undefined, upgrades: Record<string, number>): Record<string, number> {
  if (!defId) return {};
  const def = ITEM_DATABASE.get(defId);
  if (!def) return {};
  const result: Record<string, number> = { ...def.statModifiers };
  const plus = upgrades[defId] ?? 0;
  if (plus > 0) {
    for (const [k, v] of Object.entries(upgradeStatBonusTotal(def, plus))) {
      result[k] = (result[k] ?? 0) + v;
    }
  }
  return result;
}

interface Props {
  focused:  FocusedItem | null;
  onFocus:  (item: FocusedItem | null) => void;
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
  const onHitDamage     = useAtomValue(onHitDamageAtom);
  const attackRange     = useAtomValue(attackRangeAtom);
  const attackCooldown  = useAtomValue(attackCooldownAtom);
  const dodgeRate       = useAtomValue(dodgeRateAtom);
  const evadeMitigation = useAtomValue(evadeMitigationAtom);
  const equipment       = useAtomValue(equipmentAtom);
  const itemUpgrades    = useAtomValue(itemUpgradesAtom);
  const passives        = useAtomValue(passivesAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);

  const empMult = resolveEmpoweredMultiplier(passives, combatArchetype);

  const playerStats: Record<string, number> = {
    attack, maxHp, hpRegen, plating, damageReduction, speed, onHitDamage, attackRange,
  };

  // Derived combat stats. On-hit damage is flat per hit (ignores enemy defenses),
  // so it factors into the planning DPS alongside attack.
  const currentAps = 1000 / attackCooldown;
  const currentHit = attack + onHitDamage;
  const currentDps = currentHit * currentAps;

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
  const proposedOnHit  = info ? onHitDamage + (info.delta.onHitDamage ?? 0) : null;
  const proposedHit    = proposedAttack != null && proposedOnHit != null ? proposedAttack + proposedOnHit : null;
  const proposedDps    = proposedAps  != null && proposedHit != null ? proposedHit * proposedAps
                       : proposedHit != null && proposedHit !== currentHit  ? proposedHit * currentAps
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
        {STAT_ROWS.map(cfg => {
          const current = playerStats[cfg.key] ?? 0;
          const d       = info?.delta[cfg.key];
          const changed = d !== undefined && d !== 0;
          const up      = (d ?? 0) > 0;

          // Secondary stats (no value, no change) stay hidden to avoid clutter.
          if ((cfg.key === 'onHitDamage' || cfg.key === 'attackRange') && current === 0 && !changed) {
            return null;
          }

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

        {/* Empowered attack multiplier — cadence/cooldown/energy only */}
        {empMult && (
          <div className="inv-stat-row">
            <span className="inv-stat-row__label">EMP</span>
            <span className="inv-stat-row__value">×{empMult.effective.toFixed(2)}</span>
          </div>
        )}

        {/* Evasion — deterministic dodge rate + damage avoided per dodge */}
        {dodgeRate > 0 && (
          <div className="inv-stat-row">
            <span className="inv-stat-row__label">EVS</span>
            <span className="inv-stat-row__value">
              {Math.round(dodgeRate * 100)}% · −{Math.round(evadeMitigation * 100)}%
            </span>
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
