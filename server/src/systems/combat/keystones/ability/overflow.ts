/**
 * RECUPERATE — **Overflow**. "Healing past full becomes a ward." (design §22.4;
 * delivery: the owner)
 *
 * THE SEAMS.
 *  - The overheal-ward hook in `applyHealToPlayer` — the one funnel every player
 *    heal passes through — which hands its overheal sinks the HP a heal spills
 *    past full that the `defense.overheal-ward-pct` passive did not already
 *    convert (so no spill becomes a ward twice).
 *  - WHEN: while Recuperate's mend runs (its `ability-second-wind-2` window). The
 *    verb is Recuperate's, and its fire-shape is "per tick of the mend"; healing
 *    past full outside the mend (out-of-combat regen at full HP, every tick)
 *    would otherwise hand every player a standing shell before each pull.
 *  - THE WARD is the ward system's own (`applyWard`: absorbs before the barrier,
 *    expires on its clock, drained oldest-first). Overflow keeps ONE of them and
 *    tops it up — Recovery heals in sub-1-HP slices at 10 Hz, and a ward per
 *    slice would be a stack of crumbs — up to its cap: the `ward` payoff's
 *    magnitude (a fraction of max HP) off the magnitude table at the keystone row
 *    and the active packet's lane (`guardKeystoneMagnitude`), held for the ward
 *    unit's window, refreshed by each top-up. Spill past the cap is lost.
 *
 * The ward reference lives in a WeakMap keyed by the player entity: runtime
 * only, never persisted, and a ward that expired, broke or went with a death is
 * simply not found again, so the next spill mints a fresh one.
 *
 * A ward is defence; Overflow deals no damage.
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  addResource,
  getResource,
  getStatusEffect,
  recoveryEffectIdForAbility,
  setResource,
  type WardState,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { applyWard } from '../../../defense/barrier/wards';
import { registerOverhealSink } from '../../../defense/regen/healing';
import { guardKeystoneMagnitude, payoffWindowMs } from './guardValues';
import { abilityKeystoneLive, defineAbilityKeystone, pushAbilityKeystoneFx } from './registry';

const ID = 'overflow';

/** Fractional overheal not yet worth a whole HP of ward. */
const CARRY_KEY = 'keystone.overflow.carry';

const overflowWards = new WeakMap<PlayerEntity, WardState>();

/** The player's live Overflow ward, if it still stands. */
export function overflowWardOf(player: PlayerEntity): WardState | undefined {
  const ward = overflowWards.get(player);
  if (!ward || !player.holdsWards?.wards.includes(ward)) return undefined;
  return ward.amount > 0 && (ward.remainingMs === -1 || ward.remainingMs > 0) ? ward : undefined;
}

export const OVERFLOW_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'an overheal sink on applyHealToPlayer\'s overheal-ward hook: while Recuperate\'s mend runs, the spill tops up one ward, capped at the ward payoff\'s magnitude off the table at the keystone row, for the ward unit\'s window',
  register: () => {
    registerOverhealSink((world, player, overheal) => {
      if (!abilityKeystoneLive(player, ID)) return;
      const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
      const mendId = definition ? recoveryEffectIdForAbility(definition.abilityId) : undefined;
      if (!definition || !mendId) return;
      if ((getStatusEffect(player.tracksCombat, mendId)?.remainingMs ?? 0) <= 0) return;
      const cap = Math.round(player.hasHealth.maxHp * guardKeystoneMagnitude(player, ID));
      const windowMs = payoffWindowMs(definition.payoff);
      if (!(cap > 0) || !(windowMs > 0)) return;

      const cs = player.tracksCombat;
      addResource(cs, CARRY_KEY, overheal);
      const whole = Math.floor(getResource(cs, CARRY_KEY));
      if (whole < 1) return;
      setResource(cs, CARRY_KEY, getResource(cs, CARRY_KEY) - whole);

      const live = overflowWardOf(player);
      if (live) {
        const add = Math.min(whole, cap - live.amount);
        if (add <= 0) return; // full: the spill is lost
        live.amount += add;
        live.maxAmount = Math.max(live.maxAmount, live.amount);
        live.remainingMs = windowMs;
        markSliceDirty(world, player, 'holdsWards');
        return;
      }
      applyWard(world, player, Math.min(whole, cap), windowMs);
      const minted = player.holdsWards?.wards[player.holdsWards.wards.length - 1];
      if (minted) overflowWards.set(player, minted);
      // One card-fx per ward raised, never per top-up tick.
      pushAbilityKeystoneFx(world, player, definition, { durationMs: windowMs });
    });
  },
});
