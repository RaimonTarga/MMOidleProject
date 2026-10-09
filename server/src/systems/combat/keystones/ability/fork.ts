/**
 * IMBUE LIGHTNING — **Fork**. "Every imbued hit arcs to the nearest other body."
 * (design §22.4; delivery: the delivering body)
 *
 * THE SEAM. Imbue's own charge consumer (`abilityImbue.ts`): the moment a landed
 * hit spends a charge of the window it calls `onAbilityKeystoneChargeSpent`, and
 * the arc hangs off that — so it rides exactly the hits the window rides, one per
 * charge, whatever delivered them (the owner's swing, a Reload bullet, a Conduit
 * summon's blow: the body that landed the imbued hit is the delivering body, and
 * the arc leaves from the body it struck). The arc lands through the area seam's
 * resolution (`applyPlayerAoeTo`) on the nearest other living body within
 * `contagionRadius` of the struck one — "how far a payoff reaches to a
 * neighbour", the one lever Outbreak and Dragnet reuse too.
 *
 * THE NUMBER. The keystone's share (the magnitude table at `ROW_SCALAR.keystone`)
 * of the imbued hit as it was BEFORE any empowered multiplier
 * (`keystoneHitBasis`): one multiplier per hit holds.
 *
 * THE RULES IT KEEPS.
 *  - No extra charge: the arc is an area payload, not an attack, so it reaches
 *    neither the consumer nor `onHit` — it spends nothing, and it can never arc
 *    again off itself.
 *  - A dodged imbued hit arcs nowhere (`evadeBlocksDebuffs`).
 *  - Not an attack: no attack-equivalent, no weapon-verb hit counter.
 *  - Reload: a bullet spends a charge (the designer's call), so a bullet's arc is
 *    that charge's arc; the window's charges bound the arcs, not the clip.
 *  - One `card-fx` per arc, from the struck body to the body it reached.
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  lineageUnit,
  resolveAbilityEffect,
} from '@mmo-idle/shared';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { techniquePowerPctFor } from '../../../player/abilities/abilityKata';
import { applyPlayerAoeTo, playerAoeTargets } from '../../damage/aoeDamage';
import {
  abilityKeystoneShareOf, defineAbilityKeystone, keystoneHitBasis, pushAbilityKeystoneFx,
} from './registry';
import { nearestTo } from './reach';

const ID = 'fork';

export const FORK_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'Imbue\'s charge consumer: each charge spent arcs the keystone share of the imbued hit (applyPlayerAoeTo) to the nearest other body within contagionRadius of the struck one',
  onChargeSpent: (world, player, ability, ctx) => {
    const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
    if (!definition || ability.id !== definition.abilityId) return;
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    if (evadeBlocksDebuffs(ctx)) return;
    const share = abilityKeystoneShareOf(player, ID);
    if (share <= 0) return;
    const struck = ctx.defender;
    const from = { ...struck.hasPosition.current };
    const next = nearestTo(
      from,
      playerAoeTargets(world, player, from, lineageUnit('contagionRadius'), struck.isMonster.id)
        .filter((monster) => monster.hasHealth.hp > 0),
    );
    if (!next) return; // nothing beside it: nowhere to arc
    const effect = resolveAbilityEffect(ability, {
      playerTier: player.tracksProgression.playerTier,
      techniquePowerPct: techniquePowerPctFor(player),
    });
    const damage = Math.max(1, Math.round(keystoneHitBasis(player, ctx) * share));
    pushAbilityKeystoneFx(world, player, definition, { pos: from, target: next });
    applyPlayerAoeTo(
      world, player, [next], damage,
      ctx.formation?.side === 'summon' ? 'summon' : 'player',
      // The charge's own element tints the number, as the imbued hit's does.
      effect.kind === 'imbue' ? { element: effect.element } : {},
      { feedsWeaponReservoir: true },
    );
  },
});
