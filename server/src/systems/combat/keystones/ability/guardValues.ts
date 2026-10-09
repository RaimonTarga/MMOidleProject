/**
 * The few numbers a Guard verb needs, off the magnitude table — never a literal
 * (design §18.4, §22.4: "durations and shares come from the magnitude table at
 * `ROW_SCALAR.keystone`").
 *
 * A Technique verb that pays a share of a hit is `paysShare` and has its share
 * cached at recalc. A Guard verb may NOT be `paysShare` (defence never scales with
 * offence: the row test refuses a Guard verb that pays a share of a hit), yet two
 * of them carry a magnitude that is no hit at all: Entangle's slow (a fraction of
 * move speed) and Overflow's ward cap (a fraction of max HP). Both are the
 * verb's own payoff kind resolved exactly as a share is — `abilityKeystoneShare`,
 * i.e. `payoffValue` at the keystone row, the tier band and the active packet's
 * lane — read here when the rule fires rather than cached, because the recalc
 * cache (`refreshAbilityNodeRuntime`) only carries `paysShare` verbs.
 *
 * A window is the payoff unit's own duration: durations never scale with tier
 * (`payoffValue`: "a longer window is an amplifier's job"), so the unit's is the
 * keystone row's.
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  ABILITY_NODE_DATABASE,
  PAYOFF_UNIT,
  abilityKeystoneShare,
  type PayoffKind,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../ecs/entity';

/** `keystoneId`'s payoff magnitude for this player, off the table at the keystone row; 0 if unknown. */
export function guardKeystoneMagnitude(player: PlayerEntity, keystoneId: string): number {
  const definition = ABILITY_KEYSTONE_DEFINITIONS.get(keystoneId);
  if (!definition) return 0;
  const option = ABILITY_NODE_DATABASE.get(definition.abilityId)?.options
    .find((candidate) => candidate.row === 'keystone' && candidate.keystone === keystoneId);
  if (!option) return 0;
  return abilityKeystoneShare(option, player.tracksProgression.abilityNodes?.[definition.abilityId]);
}

/** A payoff unit's window, ms (the same at every tier and row); 0 for a payoff with none. */
export function payoffWindowMs(payoff: PayoffKind): number {
  return PAYOFF_UNIT.get(payoff)?.durationMs ?? 0;
}
