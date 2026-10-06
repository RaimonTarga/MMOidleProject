/**
 * BINDING STRIKE — **Dragnet**. "The root takes every body adjacent to the
 * target." (design §22.4; delivery: the delivering body)
 *
 * THE SEAM. The root writer in `monsterControl` — `applyMonsterRoot`, the one
 * function that owns the middle rung of the control ladder — with Binding
 * Strike's OWN root (`ability-rooted`) for the rank's own `rootMs`: the same
 * duration the target gets, on every body adjacent to it, each body once. It
 * refuses a plated or control-immune body by itself, and a body it roots is held
 * for the Control verb like any root (`monsterIsHeld` reads every root id).
 *
 * "ADJACENT" is `contagionRadius` around the target — "how far a lineage payoff
 * reaches to a neighbour" is one lever with one home, and the same one the
 * amplifier's second body and Outbreak's neighbour use.
 *
 * WHEN. On Binding Strike's resolution: the armed rider landing on its hit. A
 * Reload clip spends the armed rider on its first shot, so the net is cast once.
 * A dodged hit casts no net (`evadeBlocksDebuffs`).
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  ABILITY_ROOT_EFFECT_ID,
  getStatusEffect,
  lineageUnit,
  resolveAbilityEffect,
} from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../../ecs/entity';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { techniquePowerPctFor } from '../../../player/abilities/abilityKata';
import { playerAoeTargets } from '../../damage/aoeDamage';
import { monsterIgnoresControl } from '../../status/controlImmunity';
import { applyMonsterRoot } from '../../status/monsterControl';
import { defineAbilityKeystone, deliveryBodyPos, pushAbilityKeystoneFx } from './registry';

const ID = 'dragnet';

export const DRAGNET_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'Binding Strike\'s resolution roots every body within contagionRadius of the target through applyMonsterRoot, the rank\'s rootMs, each once',
  onResolved: (world, player, ability, site) => {
    const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
    if (!definition || ability.id !== definition.abilityId) return;
    if (site.ctx && evadeBlocksDebuffs(site.ctx)) return;
    const target = site.target ?? (site.ctx?.defenderType === 'monster' ? site.ctx.defender : undefined);
    if (!target) return;
    const effect = resolveAbilityEffect(ability, {
      playerTier: player.tracksProgression.playerTier,
      techniquePowerPct: techniquePowerPctFor(player),
    });
    if (effect.kind !== 'root-strike' || !(effect.rootMs > 0)) return;

    const from = deliveryBodyPos(world, player, definition.delivery, site.ctx);
    // Each adjacent body once: the query returns each body once, and the set makes
    // it so whatever the query does.
    const adjacent = new Set<MonsterEntity>(
      playerAoeTargets(world, player, target.hasPosition.current, lineageUnit('contagionRadius'), target.isMonster.id),
    );
    for (const body of adjacent) {
      if (body.hasHealth.hp <= 0 || monsterIgnoresControl(body)) continue;
      applyMonsterRoot(world, body, effect.rootMs, player.isPlayer.id);
      const root = getStatusEffect(body.tracksCombat, ABILITY_ROOT_EFFECT_ID);
      if (!root || root.remainingMs === 0) continue;
      // One card-fx per body the net took, like an amplified payoff's second body.
      pushAbilityKeystoneFx(world, player, definition, { pos: from, target: body, durationMs: root.remainingMs });
    }
  },
});
