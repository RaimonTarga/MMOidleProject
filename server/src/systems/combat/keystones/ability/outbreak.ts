/**
 * CONTAGION — **Outbreak**. "A body Contagion infected passes its afflictions to
 * its nearest neighbour when it dies." (design §22.4; delivery: the delivering
 * body — here the body that dies, which is where the spread comes from)
 *
 * THE SEAMS. The affliction toolkit, both ends of it:
 *  - TAG where the spread WRITES: `resolveContagion`'s victim loop calls
 *    `onAbilityKeystoneInfected` for each body it copied onto, and this verb sets
 *    a per-player flag on that body. Written against the write, not the cast
 *    lifecycle, so it holds whatever shape delivers Contagion's spread.
 *  - SPREAD on the kill: an `onKill` listener reads the dead body's own spreadable
 *    afflictions from the DoT inventory (`playerDotsOnMonster`) and copies them
 *    onto its nearest living neighbour within `contagionRadius` through
 *    Contagion's own copier (`copyPlayerDotOnto`) — so what it passes is the ONE
 *    damage-over-time record per weapon (design §26.2: the weapon's reservoir or
 *    the one `lineage.bleed`), whole, max-wins against what the neighbour carries.
 *
 * THE RULES IT KEEPS.
 *  - Once per body: the tag is spent the moment it spreads.
 *  - No chain: a body infected BY an Outbreak is not tagged, so it does not pass
 *    anything on when it dies (unless Contagion itself infects it later).
 *  - Ownership: a body carries one tag per player who infected it, and spreads
 *    only that player's afflictions, whoever lands the killing blow.
 *  - Monster combat state is ephemeral (node freeze/thaw takes the flag with it),
 *    so the tag needs no cleanup and is never persisted.
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  getFlag,
  lineageUnit,
  setFlag,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { registerCombatListener } from '../../engine/combatPipeline';
import { playerDotsOnMonster } from '../../damage/dotInventory';
import { playerAoeTargets } from '../../damage/aoeDamage';
import { copyPlayerDotOnto } from '../../../player/abilities/abilityAffliction';
import { abilityKeystoneLive, defineAbilityKeystone, pushAbilityKeystoneFx } from './registry';

const ID = 'outbreak';

/** The per-player tag a Contagion-infected body carries. */
export const outbreakTag = (playerId: string): string => `keystone.outbreak.${playerId}`;

/** Whether `monster` carries `player`'s Outbreak tag (for the test and the reader). */
export function outbreakTagged(monster: MonsterEntity, player: PlayerEntity): boolean {
  return getFlag(monster.tracksCombat, outbreakTag(player.isPlayer.id));
}

/** The nearest living body to `dead` within the neighbour reach, or undefined. */
function nearestNeighbour(world: World, player: PlayerEntity, dead: MonsterEntity): MonsterEntity | undefined {
  const origin = dead.hasPosition.current;
  let best: MonsterEntity | undefined;
  let bestGap = Infinity;
  for (const monster of playerAoeTargets(world, player, origin, lineageUnit('contagionRadius'), dead.isMonster.id)) {
    if (monster.hasHealth.hp <= 0) continue;
    const dx = monster.hasPosition.current.x - origin.x;
    const dy = monster.hasPosition.current.y - origin.y;
    const gap = dx * dx + dy * dy;
    if (gap < bestGap) {
      bestGap = gap;
      best = monster;
    }
  }
  return best;
}

/** Pass `player`'s afflictions from the dead body to its nearest neighbour, once. */
function spreadFromCorpse(world: World, player: PlayerEntity, dead: MonsterEntity): void {
  const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
  if (!definition) return;
  const entries = playerDotsOnMonster(world, player, dead).filter((entry) => entry.spreadable);
  if (entries.length === 0) return;
  const neighbour = nearestNeighbour(world, player, dead);
  if (!neighbour) return;
  for (const entry of entries) copyPlayerDotOnto(world, player, neighbour, entry);
  // Deliberately NOT tagged: a body an Outbreak infected does not re-tag.

  // Contagion's own tendril, from the body that died to the one it infected.
  world.pushEvent(player.hasPosition.nodeId, {
    kind: 'dot-spread',
    playerId: player.isPlayer.id,
    from: { ...dead.hasPosition.current },
    links: [...new Set(entries.map((entry) => entry.element))]
      .map((element) => ({ to: { ...neighbour.hasPosition.current }, element })),
  });
  pushAbilityKeystoneFx(world, player, definition, {
    pos: dead.hasPosition.current,
    target: neighbour,
  });
}

export const OUTBREAK_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'tags the bodies resolveContagion copies onto; on a tagged body\'s onKill, copyPlayerDotOnto passes its afflictions to its nearest neighbour once',
  onInfected: (_world, player, _ability, victim) => {
    setFlag(victim.tracksCombat, outbreakTag(player.isPlayer.id), true);
  },
  register: () => {
    registerCombatListener('onKill', (ctx, world) => {
      if (ctx.defenderType !== 'monster') return;
      const dead = ctx.defender;
      // Whoever infected it — not only whoever landed the killing blow.
      for (const player of world.livePlayers) {
        if (player.hasPosition.nodeId !== dead.hasPosition.nodeId) continue;
        if (!outbreakTagged(dead, player)) continue;
        setFlag(dead.tracksCombat, outbreakTag(player.isPlayer.id), false);
        if (!abilityKeystoneLive(player, ID)) continue;
        spreadFromCorpse(world, player, dead);
      }
    });
  },
});
