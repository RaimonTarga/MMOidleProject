/**
 * SLAM — **Aftershock**. "The ground erupts again at the same spot one second
 * later." (design §22.4; delivery: owner)
 *
 * THE SEAM. Slam's own resolution: when its cast resolves, the keystone schedules
 * ONE delayed `applyPlayerAoe` at the resolved cast position — the point the
 * payload landed on, not wherever the target has walked to since — with the
 * rank's own radius (`cast-strike`'s `radius`, the same number the wind-up's
 * footprint and the payload use), whatever rank that is.
 *
 * THE NUMBER. The keystone's share (the magnitude table at `ROW_SCALAR.keystone`)
 * of Slam's own payload — the player's Attack times the rank's `damageMult`, after
 * Technique Power, exactly what `resolveCastPayload` dealt. A cast carries no
 * empowered multiplier, so one multiplier per hit holds by construction.
 *
 * THE RULES IT KEEPS.
 *  - The eruption is a place, not a body: it hits whatever stands in the circle
 *    when it lands, and is not interrupted by anything that happens to the owner
 *    (the ground already cracked).
 *  - On a Conduit the cast is delivered through one physical summon; the payload
 *    is the owner's, and so is the aftershock — once per cast, at the same spot.
 *  - Not an attack: an area payload, so no attack-equivalent and no hit counter.
 *  - One `card-fx` per application, when it erupts (`fxOnLand`).
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  abilityKeystoneUnit,
  resolveAbilityEffect,
} from '@mmo-idle/shared';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { techniquePowerPctFor } from '../../../player/abilities/abilityKata';
import { abilityKeystoneShareOf, defineAbilityKeystone } from './registry';
import { scheduleKeystoneHit } from './scheduledHits';

const ID = 'aftershock';

export const AFTERSHOCK_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'Slam\'s resolution schedules one delayed applyPlayerAoe at the resolved cast position, at the rank\'s radius',
  onResolved: (world, player, ability, site) => {
    const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
    if (!definition || ability.id !== definition.abilityId) return;
    // A cast has no exchange to dodge; should Slam ever ride one, a dodged one
    // cracks no ground.
    if (site.ctx && evadeBlocksDebuffs(site.ctx)) return;
    const at = site.target?.hasPosition.current ?? site.ctx?.defender.hasPosition.current;
    if (!at) return;
    const share = abilityKeystoneShareOf(player, ID);
    if (share <= 0) return;
    const effect = resolveAbilityEffect(ability, {
      playerTier: player.tracksProgression.playerTier,
      techniquePowerPct: techniquePowerPctFor(player),
    });
    if (effect.kind !== 'cast-strike') return;

    const payload = Math.max(1, Math.round(player.dealsDamage.attack * effect.damageMult));
    scheduleKeystoneHit(world, player, {
      keystoneId: ID,
      abilityId: ability.id,
      dueInMs: abilityKeystoneUnit('aftershockDelayMs'),
      at: { ...at },
      nodeId: player.hasPosition.nodeId,
      // The single-target query reads a 1-unit circle, as `resolveCastPayload` does.
      radius: effect.radius && effect.radius > 0 ? effect.radius : 1,
      damage: Math.max(1, Math.round(payload * share)),
      interruptible: false,
      fxOnLand: definition.fx,
    });
  },
});
