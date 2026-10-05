/**
 * ONE DAMAGE-OVER-TIME RECORD PER WEAPON (design §26.2) — the one seam every
 * lineage DoT goes through.
 *
 * "A weapon that already afflicts is amplified, never joined." A lineage card's
 * damage over time — the Affliction lean's light bleed, the composed heavy bleed,
 * the re-dose, `poison-stack` — is an AMOUNT owed, and this decides which record
 * owes it:
 *
 *   a weapon with a reservoir (`weaponDot`: the Poison Dagger, the Mirebrand, the
 *   brands)  →  that reservoir's pool. No `lineage.*` record is ever created.
 *   any other weapon  →  the ONE lineage bleed, `lineage.bleed`.
 *
 * Both are reservoirs every source ADDS to: what the record still owes is kept and
 * the new amount joins it, so a stream of firings delivers exactly what each one
 * promised (a refresh would cut the previous one short), and nothing ratchets —
 * the total owed is the sum of the sources, and it runs out. This answers the
 * refresh-versus-reservoir reason the verbs-that-fire run split the bleed in two.
 *
 * The target therefore shows one badge per effect: what is owed, and how long.
 */
import { getStatusEffect, lineageUnit, type StatusEffect } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { attachMarker } from '../../../ecs/markerHelpers';
import { applyPlayerDebuff } from '../../classes/shared/applyPlayerDebuff';
import { LINEAGE_BLEED_ID } from './bleedIds';
import { addToWeaponReservoir, heldWeaponReservoir } from './weaponReservoir';

/** What a lineage DoT landed on, and how long it now holds (for the payload's fx). */
export interface LineageAfflictionResult {
  effect: StatusEffect;
  /** `reservoir` on a weapon that owns one, else `bleed`. */
  record: 'reservoir' | 'bleed';
  /** How long the record holds from now: the bleed's ticks, or the reservoir's drain. */
  durationMs: number;
}

/**
 * ADD `amount` to the one lineage bleed on `target`, spread over at least
 * `windowMs` of ticks.
 *
 * What the bleed still owes is kept and the new amount joins it, re-spread over
 * the longer of what it had left and this application's window — so a stream of
 * hits delivers exactly its shares, and the bleed drains one window after the
 * last one. The tick clock is left running: re-arming it on every hit would
 * postpone the tick forever under a fast weapon. The per-tick value is kept
 * fractional; the tick driver rounds what it deals.
 */
export function addLineageBleed(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  amount: number,
  windowMs: number,
): StatusEffect | undefined {
  if (!(amount > 0)) return undefined;
  const tickMs = lineageUnit('bleedTickMs');
  const windowTicks = Math.max(1, Math.round(windowMs / tickMs));
  const prior = getStatusEffect(target.tracksCombat, LINEAGE_BLEED_ID);
  const priorTicks = prior && prior.data.bleedMode !== 1 ? Math.max(0, prior.stacks) : 0;
  const priorOwed = priorTicks * Math.max(0, prior?.data.damagePerTick ?? 0);
  const ticks = Math.max(windowTicks, priorTicks);
  const perTick = (priorOwed + amount) / ticks;
  const bleed = applyPlayerDebuff(player, target.tracksCombat, {
    id: LINEAGE_BLEED_ID,
    instanced: false,
    remainingMs: -1,
    sourceId: player.isPlayer.id,
    data: { damagePerTick: perTick, nextTickIn: tickMs, tickIntervalMs: tickMs, bleedMode: 0 },
  });
  bleed.data.damagePerTick = perTick;
  bleed.data.tickIntervalMs = tickMs;
  bleed.data.bleedMode = 0;
  if (!(bleed.data.nextTickIn > 0)) bleed.data.nextTickIn = tickMs;
  bleed.stacks = ticks;
  attachMarker(world, target, 'hasHemorrhage');
  return bleed;
}

/**
 * ADD `amount` of lineage damage over time to `target`, on the one record this
 * player's weapon owns: its reservoir, or the lineage bleed. `windowMs` is the
 * bleed's minimum spread; a reservoir drains on its own authored clock.
 *
 * Returns null when nothing was owed (an amount of zero lands nothing, and draws
 * no effect claiming it did).
 */
export function addLineageAffliction(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  amount: number,
  windowMs: number,
): LineageAfflictionResult | null {
  if (!(amount > 0)) return null;
  const profile = heldWeaponReservoir(player);
  if (profile) {
    const effect = addToWeaponReservoir(world, player, target, amount);
    if (!effect) return null;
    return { effect, record: 'reservoir', durationMs: profile.drainDurationMs };
  }
  const bleed = addLineageBleed(world, player, target, amount, windowMs);
  if (!bleed) return null;
  return { effect: bleed, record: 'bleed', durationMs: bleed.stacks * lineageUnit('bleedTickMs') };
}
