/**
 * ENDURE — **Unyielding**. "You cannot be hard-controlled while Endure is up."
 * (design §22.4; delivery: the owner)
 *
 * THE SEAMS.
 *  - The Guard's activation (`onGuardKeystoneCast`): Endure's own effect has just
 *    written its damage-reduction status (`ability-guard-2`), and this verb lays
 *    `ability-unyielding` beside it on the SAME clock — one window, two tiles that
 *    run out together. A refreshed Endure refreshes it.
 *  - The player hard-control list's appliers refuse while it stands, through one
 *    predicate (`refusesHardControl`, beside `PLAYER_HARD_CONTROL_EFFECTS`):
 *    `applyStun` (every stun, whoever casts it), the player debuff writers'
 *    admission check `playerRefusesStatus` (roots: a zero-speed slow is hard
 *    control by `statusPolicyFor`), the Cave lockdown (`beginEngageLock`) and the
 *    lair drag's root (`beginLairDrag`).
 *
 * NOT A CLEANSE. A control already on the player when Endure went up is left
 * exactly where it is (design §22.4 via the brief: "an existing control is not
 * removed"); Break Free remains its answer.
 *
 * A Guard never deals damage: this is a refusal and nothing else.
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  ABILITY_UNYIELDING_EFFECT_ID,
  applyStatusEffect,
  getStatusEffect,
  guardEffectIdForAbility,
} from '@mmo-idle/shared';
import { onGuardKeystoneCast } from './guardCast';
import { defineAbilityKeystone, pushAbilityKeystoneFx } from './registry';

const ID = 'unyielding';

export const UNYIELDING_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'Endure\'s activation lays ability-unyielding on Endure\'s own clock; the hard-control appliers (applyStun, playerRefusesStatus, beginEngageLock, beginLairDrag) refuse while it stands, and remove nothing',
  register: () => {
    onGuardKeystoneCast(ID, (world, player, ability) => {
      const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
      if (!definition || ability.id !== definition.abilityId) return;
      const endureId = guardEffectIdForAbility(definition.abilityId);
      const endure = endureId ? getStatusEffect(player.tracksCombat, endureId) : undefined;
      if (!endure || endure.remainingMs <= 0) return;
      const totalMs = endure.data['totalMs'] ?? endure.remainingMs;
      const unyielding = applyStatusEffect(player.tracksCombat, {
        id: ABILITY_UNYIELDING_EFFECT_ID,
        maxStacks: 1,
        remainingMs: endure.remainingMs,
        refreshable: true,
        sourceId: player.isPlayer.id,
        data: { totalMs },
      });
      // A refresh keeps the old record's data: re-stamp the clock's total.
      unyielding.data['totalMs'] = totalMs;
      pushAbilityKeystoneFx(world, player, definition, { durationMs: endure.remainingMs });
    });
  },
});
