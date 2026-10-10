/**
 * STUNNING STRIKE — **Relay**. "When the stun ends it jumps to the nearest body
 * not yet stunned this fight." (design §22.4; delivery: the delivering body)
 *
 * THE SEAMS. Three, each the one place its moment happens:
 *  - THE STUN LANDS: Stunning Strike's resolution. When its stun took (the target
 *    carries this player's `stunned`), the body joins the fight's set and becomes
 *    the relay's CARRIER — on a Conduit whichever summon cast it, since the stun
 *    is the cast's own.
 *  - THE STUN ENDS: `tick`, once per logic tick after `updateCombatState` has
 *    decayed every status. A carrier whose stun has run out hands it on: the
 *    nearest living body within `contagionRadius` of it ("how far a payoff
 *    reaches to a neighbour", the lever Outbreak and Dragnet reuse) that has not
 *    been stunned by this relay this fight, can take a stun (not control-immune,
 *    not inside its own post-stun immunity) — stunned through `applyStun`, the one
 *    place a stun enters the world, for Stunning Strike's own `stunMs`. That body
 *    is the new carrier, so the stun keeps jumping until no body is left to take
 *    it. A carrier that dies or leaves ends the relay: its stun did not END.
 *  - THE FIGHT ENDS: `onCombatEnded`, the player's out-of-combat reset
 *    (`updateCombatTransitions`), clears the set and any carrier.
 *
 * THE SET is server-only scratch on the player's `TracksCombat`, through its
 * string helpers (never the raw maps): the ids stunned this fight, and the ids
 * carrying a relaying stun. Monster ids carry no comma.
 *
 * THE RULES IT KEEPS.
 *  - The first body keeps its post-stun immunity: nothing here touches it, and
 *    it is in the set, so the stun never comes back to it this fight.
 *  - A stun is control, not damage: no multiplier, no attack, no hit counter.
 *  - A cast has no exchange to dodge; should Stunning Strike ever ride one, a
 *    dodged one relays nothing (`evadeBlocksDebuffs`).
 *  - One `card-fx` per jump, from the body the stun left to the body it reached,
 *    with the hold as applied.
 */
import {
  ABILITY_DATABASE,
  ABILITY_KEYSTONE_DEFINITIONS,
  getStatusEffect,
  getString,
  hasStatusEffect,
  lineageUnit,
  resolveAbilityEffect,
  setString,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { techniquePowerPctFor } from '../../../player/abilities/abilityKata';
import { playerAoeTargets } from '../../damage/aoeDamage';
import { monsterIgnoresControl } from '../../status/controlImmunity';
import { STUN_EFFECT, applyStun, isStunImmune } from '../../status/stun';
import { abilityKeystoneLive, defineAbilityKeystone, pushAbilityKeystoneFx } from './registry';
import { nearestTo } from './reach';

const ID = 'relay';
/** The bodies this player's relay has stunned this fight. */
const FIGHT_KEY = 'keystone.relay.fight';
/** The bodies carrying a relaying stun right now. */
const CARRIER_KEY = 'keystone.relay.carriers';

function readIds(player: PlayerEntity, key: string): Set<string> {
  const raw = getString(player.tracksCombat, key);
  return new Set(raw ? raw.split(',').filter((id) => id.length > 0) : []);
}

function writeIds(player: PlayerEntity, key: string, ids: Iterable<string>): void {
  setString(player.tracksCombat, key, [...ids].join(','));
}

/** The bodies this player's relay has stunned this fight (for the test and the reader). */
export function relayedThisFight(player: PlayerEntity): ReadonlySet<string> {
  return readIds(player, FIGHT_KEY);
}

/** The bodies carrying this player's relaying stun right now. */
export function relayCarriers(player: PlayerEntity): ReadonlySet<string> {
  return readIds(player, CARRIER_KEY);
}

/** Whether `monster` holds a stun of `player`'s right now. */
function stunnedBy(monster: MonsterEntity, player: PlayerEntity): boolean {
  const stun = getStatusEffect(monster.tracksCombat, STUN_EFFECT);
  return !!stun && stun.remainingMs !== 0 && stun.sourceId === player.isPlayer.id;
}

/** Hand the stun on from `from`, whose stun just ended. The body it reached, or undefined. */
function jump(world: World, player: PlayerEntity, from: MonsterEntity): MonsterEntity | undefined {
  const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
  const ability = definition ? ABILITY_DATABASE.get(definition.abilityId) : undefined;
  if (!definition || !ability) return undefined;
  const effect = resolveAbilityEffect(ability, {
    playerTier: player.tracksProgression.playerTier,
    techniquePowerPct: techniquePowerPctFor(player),
  });
  const stunMs = effect.kind === 'cast-strike' ? effect.stunMs : undefined;
  if (!stunMs || !(stunMs > 0)) return undefined;

  const fight = readIds(player, FIGHT_KEY);
  const origin = { ...from.hasPosition.current };
  const next = nearestTo(
    origin,
    playerAoeTargets(world, player, origin, lineageUnit('contagionRadius'), from.isMonster.id).filter(
      (monster) => monster.hasHealth.hp > 0
        && !fight.has(monster.isMonster.id)
        && !monsterIgnoresControl(monster)
        && !isStunImmune(monster.tracksCombat),
    ),
  );
  if (!next) return undefined; // nobody left to take it: the relay is over
  if (!applyStun(next.tracksCombat, stunMs, player.isPlayer.id)) return undefined;
  fight.add(next.isMonster.id);
  writeIds(player, FIGHT_KEY, fight);
  pushAbilityKeystoneFx(world, player, definition, {
    pos: origin,
    target: next,
    // As applied: control resistance shortens a stun at the one place it enters.
    durationMs: getStatusEffect(next.tracksCombat, STUN_EFFECT)?.remainingMs ?? stunMs,
  });
  return next;
}

export const RELAY_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'Stunning Strike\'s landed stun is watched; when it runs out (tick, after the status decay) applyStun lands Stunning Strike\'s stunMs on the nearest body within contagionRadius not yet stunned this fight (a TracksCombat string set, cleared at the out-of-combat reset)',
  onResolved: (_world, player, ability, site) => {
    const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
    if (!definition || ability.id !== definition.abilityId) return;
    if (site.ctx && evadeBlocksDebuffs(site.ctx)) return;
    const target = site.target;
    if (!target || target.hasHealth.hp <= 0) return;
    // The strike's stun did not take (immune, plated, a killing blow): nothing to relay.
    if (!stunnedBy(target, player)) return;
    const fight = readIds(player, FIGHT_KEY);
    fight.add(target.isMonster.id);
    writeIds(player, FIGHT_KEY, fight);
    const carriers = readIds(player, CARRIER_KEY);
    carriers.add(target.isMonster.id);
    writeIds(player, CARRIER_KEY, carriers);
  },
  tick: (world) => {
    for (const player of world.livePlayers) {
      const carriers = readIds(player, CARRIER_KEY);
      if (carriers.size === 0) continue;
      // The verb was swapped out: the stun it was watching ends where it is.
      if (!abilityKeystoneLive(player, ID)) {
        writeIds(player, CARRIER_KEY, []);
        continue;
      }
      const next = new Set<string>();
      for (const id of carriers) {
        const carrier = world.getMonsterEntity(id);
        // The body is gone or out of the fight: its stun did not end, it did.
        if (!carrier || carrier.hasHealth.hp <= 0 || carrier.hasPosition.nodeId !== player.hasPosition.nodeId) continue;
        if (hasStatusEffect(carrier.tracksCombat, STUN_EFFECT)) {
          next.add(id); // still held
          continue;
        }
        const reached = jump(world, player, carrier);
        if (reached) next.add(reached.isMonster.id);
      }
      writeIds(player, CARRIER_KEY, next);
    }
  },
  onCombatEnded: (_world, player) => {
    if (readIds(player, FIGHT_KEY).size > 0) writeIds(player, FIGHT_KEY, []);
    if (readIds(player, CARRIER_KEY).size > 0) writeIds(player, CARRIER_KEY, []);
  },
});
