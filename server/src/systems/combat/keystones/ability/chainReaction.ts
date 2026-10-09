/**
 * DETONATE — **Chain Reaction**. "A Detonate kill detonates every afflicted body
 * in reach." (design §22.4; delivery: the delivering body)
 *
 * THE SEAM. Detonate's own resolution, run again: when a Detonate cast KILLS its
 * target (the cast loop resolves the payload, then `onTechniqueResolved`, so a
 * target lying dead at the resolution is the kill it made), `resolveDetonate` —
 * the same function the cast used, nothing restated — runs once on every other
 * body in reach that carries the player's detonatable afflictions. Each burst is
 * Detonate's own: it consumes that body's records, pays them out through
 * `applyPlayerAoe` and draws its own `dot-detonate`.
 *
 * "IN REACH" is Detonate's own reach from the delivery body (`reach.ts`): the
 * owner's engagement range, or on a Conduit the reach of the physical summon
 * that cast it — a body the cast could not have been aimed at is not set off.
 *
 * THE RULES IT KEEPS.
 *  - Each body once: the set is taken BEFORE the first burst, and a burst only
 *    runs on a body still standing when its turn comes.
 *  - No chain on the chain: a body this verb detonated does not set anything off
 *    when it dies — only the cast's own kill does. (Distinct from Harvest, which
 *    spends health: Chain Reaction spends afflictions, and selects by nothing
 *    else.)
 *  - A cast has no exchange to dodge; should Detonate ever ride one, a dodged one
 *    sets nothing off (`evadeBlocksDebuffs`).
 *  - Not an attack: every burst is an area payload, so no attack-equivalent and
 *    no weapon-verb hit counter.
 *  - One `card-fx` per body set off, drawn from the body that died — the chain
 *    radiates from the kill — to the body it reached.
 */
import { ABILITY_KEYSTONE_DEFINITIONS } from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../../ecs/entity';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { afflictionEntriesFor, resolveDetonate } from '../../../player/abilities/abilityAffliction';
import { totalRemainingDamage } from '../../damage/dotInventory';
import { defineAbilityKeystone, deliveringBody, pushAbilityKeystoneFx } from './registry';
import { bodiesInAbilityReach } from './reach';

const ID = 'chain-reaction';

export const CHAIN_REACTION_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'a Detonate kill runs resolveDetonate once on every body in the cast\'s reach (from the delivering body) carrying the player\'s detonatable afflictions; no re-chain',
  onResolved: (world, player, ability, site) => {
    const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
    if (!definition || ability.id !== definition.abilityId) return;
    if (site.ctx && evadeBlocksDebuffs(site.ctx)) return;
    const killed = site.target;
    if (!killed || killed.hasHealth.hp > 0) return; // no kill, no chain
    const origin = { ...killed.hasPosition.current };

    const body = deliveringBody(world, player, definition.delivery, site);
    // The set, taken once, before anything bursts: each body once, and a body a
    // burst kills cannot pull a new one in.
    const afflicted: MonsterEntity[] = bodiesInAbilityReach(
      world, player, body, ability, new Set([killed.isMonster.id]),
    ).filter((monster) => totalRemainingDamage(afflictionEntriesFor(world, player, ability, monster)) > 0);

    for (const monster of afflicted) {
      if (monster.hasHealth.hp <= 0 || !world.getMonsterEntity(monster.isMonster.id)) continue;
      // Drawn before the burst: a burst that kills removes the body.
      pushAbilityKeystoneFx(world, player, definition, { pos: origin, target: monster });
      resolveDetonate(world, player, ability, monster);
    }
  },
});
