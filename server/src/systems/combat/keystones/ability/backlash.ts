/**
 * BREAK FREE — **Backlash**. "Breaking free staggers every adjacent body."
 * (design §22.4; delivery: the owner)
 *
 * THE SEAM. The Guard's own activation (`onGuardKeystoneCast`): Break Free fires
 * only when something holds the player (`guardEffectCanFire`), so every
 * activation is a break. Then the control ladder's shortest rung — `applyStun`
 * for `ladderStunMs`, exactly as Breakthrough staggers (design §22.11: "stagger
 * is the control ladder's shortest stun rung, with post-stun immunity") — on
 * every body within `contagionRadius` of the player: "adjacent" is the one lever
 * Dragnet and Outbreak already reach with.
 *
 * THE RULES IT KEEPS. Each body once (the set). A plated or control-immune boss
 * refuses it outright (`monsterIgnoresControl`), and a body still in its post-stun
 * immunity refuses it at `applyStun` — nothing landed, nothing drawn. A Guard
 * never deals damage: this staggers and nothing else.
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  getStatusEffect,
  lineageUnit,
} from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../../ecs/entity';
import { playerAoeTargets } from '../../damage/aoeDamage';
import { monsterIgnoresControl } from '../../status/controlImmunity';
import { STUN_EFFECT, applyStun } from '../../status/stun';
import { onGuardKeystoneCast } from './guardCast';
import { defineAbilityKeystone, pushAbilityKeystoneFx } from './registry';

const ID = 'backlash';

export const BACKLASH_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'Break Free\'s activation applies the control ladder\'s shortest rung (applyStun, ladderStunMs) to every body within contagionRadius of the player, each once',
  register: () => {
    onGuardKeystoneCast(ID, (world, player, ability) => {
      const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
      if (!definition || ability.id !== definition.abilityId) return;
      const origin = player.hasPosition.current;
      const adjacent = new Set<MonsterEntity>(
        playerAoeTargets(world, player, origin, lineageUnit('contagionRadius')),
      );
      for (const body of adjacent) {
        if (body.hasHealth.hp <= 0 || monsterIgnoresControl(body)) continue;
        if (!applyStun(body.tracksCombat, lineageUnit('ladderStunMs'), player.isPlayer.id)) continue;
        // One card-fx per body it staggered, drawn from the player outward.
        pushAbilityKeystoneFx(world, player, definition, {
          target: body,
          durationMs: getStatusEffect(body.tracksCombat, STUN_EFFECT)?.remainingMs ?? lineageUnit('ladderStunMs'),
        });
      }
    });
  },
});
