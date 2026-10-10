/**
 * CULL — **Harvest**. "A Cull kill lands the same strike on the nearest body
 * below the same health share, and keeps going while it keeps killing."
 * (design §22.8; delivery: the delivering body)
 *
 * THE SEAM. Cull's own resolution, and Cull's own strike: when a Cull cast KILLS
 * its target (a target lying dead at the resolution is the kill it made), the
 * delivery body — the owner, or on a Conduit the physical summon that cast it
 * ("Harvest chains from whichever body made the kill", design §22.10) — strikes
 * again: the nearest body in Cull's reach of it whose health share is below the
 * share the killed target was at when Cull found it (`targetHealthShare`, read
 * by the cast loop before the payload landed). "The same strike" is Cull's: the
 * multiplier the struck body's OWN share earns (`cullMultiplier`, the rank's
 * curve after Technique Power) times the player's Attack, through the area
 * seam's resolution (`applyPlayerAoeTo`). A strike that kills strikes again; one
 * that does not ends the harvest.
 *
 * THE RULES IT KEEPS.
 *  - Each body once per Cull: the struck set includes the first kill.
 *  - At most the lineage `chainMaxLinks` strikes per Cull (design §22.12), the
 *    Tempo Chain's own ceiling: the rule's bounds (a strike that does not kill,
 *    nothing low enough in reach) already end it, and the cap keeps a node of
 *    low bodies from being one Cull's clear.
 *  - The bar is the FIRST kill's share for the whole harvest, so every strike is
 *    at least as sharp on the curve as the one that started it.
 *  - Harvest spends health and nothing else: it never reads or consumes an
 *    affliction (Chain Reaction is the verb that spends afflictions; a body both
 *    could take is taken by the one whose kill it is, once).
 *  - A strike is an area payload, not an attack: no attack-equivalent, no weapon
 *    hit counter, no Cull resolution of its own — so it refunds nothing and fires
 *    no node payoff; Cull's own kill already refunded Cull.
 *  - A cast has no exchange to dodge; should Cull ever ride one, a dodged one
 *    harvests nothing (`evadeBlocksDebuffs`).
 *  - One `card-fx` per strike, from the delivery body to the struck body.
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  lineageUnit,
  resolveAbilityEffect,
} from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../../ecs/entity';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { techniquePowerPctFor } from '../../../player/abilities/abilityKata';
import { cullMultiplier } from '../../../player/abilities/abilityEffects';
import { applyPlayerAoeTo } from '../../damage/aoeDamage';
import { defineAbilityKeystone, deliveringBody, pushAbilityKeystoneFx } from './registry';
import { bodiesInAbilityReach, nearestTo } from './reach';

const ID = 'harvest';

const healthShare = (monster: MonsterEntity): number =>
  monster.hasHealth.maxHp > 0 ? monster.hasHealth.hp / monster.hasHealth.maxHp : 1;

export const HARVEST_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'a Cull kill: the delivering body strikes the nearest body in Cull\'s reach below the killed target\'s health share with Cull\'s own strike (applyPlayerAoeTo), again while it kills, each once, at most the lineage chainMaxLinks strikes',
  onResolved: (world, player, ability, site) => {
    const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
    if (!definition || ability.id !== definition.abilityId) return;
    if (site.ctx && evadeBlocksDebuffs(site.ctx)) return;
    const killed = site.target;
    if (!killed || killed.hasHealth.hp > 0) return; // no kill, no harvest
    const bar = site.targetHealthShare;
    if (bar === undefined || !(bar > 0)) return;
    const effect = resolveAbilityEffect(ability, {
      playerTier: player.tracksProgression.playerTier,
      techniquePowerPct: techniquePowerPctFor(player),
    });
    if (effect.kind !== 'execute-strike') return;

    const body = deliveringBody(world, player, definition.delivery, site);
    const struck = new Set<string>([killed.isMonster.id]);
    const maxLinks = Math.max(0, Math.round(lineageUnit('chainMaxLinks')));
    for (let link = 0; link < maxLinks; link++) {
      const next = nearestTo(
        body.hasPosition.current,
        bodiesInAbilityReach(world, player, body, ability, struck)
          .filter((monster) => healthShare(monster) < bar),
      );
      if (!next) return; // nothing low enough in reach: the harvest is over
      struck.add(next.isMonster.id);
      const damage = Math.max(1, Math.round(player.dealsDamage.attack * cullMultiplier(effect, healthShare(next))));
      // Drawn before the strike: a strike that kills removes the body.
      pushAbilityKeystoneFx(world, player, definition, { pos: body.hasPosition.current, target: next });
      applyPlayerAoeTo(world, player, [next], damage, 'player', {}, { feedsWeaponReservoir: true });
      if (next.hasHealth.hp > 0) return; // it stopped killing
    }
  },
});
