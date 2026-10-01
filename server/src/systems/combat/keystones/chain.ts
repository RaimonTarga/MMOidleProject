/**
 * TEMPO — **Chain**. "An echo hit keeps re-triggering until a hit misses (evade)
 * or no fresh target is in reach; each link is one echo-hit payoff at the lane's
 * magnitude." (design §4)
 *
 * THE SEAM. The `echo-hit` payoff case in `lineageCards.ts`, right after the
 * first echo has landed through `applyPlayerProcDamage`. That is the only place
 * an echo exists, and hanging the chain off the payoff rather than off a listener
 * is what makes the rule read the way it is written: the echo the player already
 * owns keeps going, instead of a second effect firing beside it.
 *
 * WHAT A LINK IS. One more proc at the keystone's share of the SAME basis the
 * echo used — so one multiplier per hit still holds, because the basis was
 * already taken pre-empowered by `hitBasis` before the chain ever saw it.
 *
 * THE TWO BOUNDS, both of them the rule's own:
 *
 *  - **A miss.** Each link spends the target's deterministic dodge clock
 *    (`rollMonsterDodge`, the same accumulator an ordinary swing spends). A dodge
 *    ends the chain and deals nothing: the echo "missed", so the chain is over.
 *  - **No fresh target.** A link looks for a live body within
 *    `contagionRadius` of the PREVIOUS link's target that the chain has not hit
 *    yet. Nothing in reach ends it. Deliberately the same authored reach
 *    `contagion` and the `targets` amplifier use: "how far a lineage payoff
 *    reaches to a neighbour" is one lever (design §18.4).
 *
 * `chainMaxLinks` is the authored ceiling on top of those. The bounds terminate
 * on their own — each link consumes a body — but a swarm node would otherwise
 * turn one echo into a clear, and that ceiling is the designer's to move.
 */
import {
  lineageUnit,
  type PacketId,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { applyPlayerProcDamage } from '../damage/procDamage';
import { playerAoeTargets } from '../damage/aoeDamage';
import { monsterDodgeChance, rollMonsterDodge } from '../../defense/mitigation/evasion';
import { defineKeystone, keystoneActive, keystoneShare, pushKeystoneFx } from './registry';

const LANE: PacketId = 'tempo';

export const CHAIN_KEYSTONE = defineKeystone({
  id: 'chain',
  lane: LANE,
  seam: "the echo-hit payoff case in lineageCards' applyOnTarget",
  // No listener: the rule changes what an echo DOES, and the echo is a payoff.
});

/**
 * Extend one landed echo into a chain. Returns how many extra links landed, so
 * the caller can report the chain's length on the card's own effect.
 *
 * `basis` is the figure the echo scaled off — `hitBasis(player, ctx)`, which is
 * the hit as it was BEFORE any empowered multiplier. Passing it in rather than
 * re-deriving it is what keeps one multiplier per hit true of a chained echo on a
 * finisher.
 */
export function runChain(
  world: World,
  player: PlayerEntity,
  origin: MonsterEntity,
  basis: number,
): number {
  if (!keystoneActive(player, LANE)) return 0;
  const share = keystoneShare(player, LANE);
  if (share <= 0) return 0;

  const maxLinks = Math.max(0, Math.round(lineageUnit('chainMaxLinks')));
  // The body the echo already hit is not fresh, and a chain never doubles back.
  const struck = new Set<string>([origin.isMonster.id]);
  let from = origin;
  let links = 0;

  for (let i = 0; i < maxLinks; i++) {
    const next = freshTarget(world, player, from, struck);
    if (!next) break; // no fresh target in reach — the chain is spent
    struck.add(next.isMonster.id);

    // A link is a hit, so it answers to the target's dodge. A dodge ends the
    // chain BEFORE any damage: "until a hit misses".
    if (rollMonsterDodge(next, monsterDodgeChance(next))) break;

    const damage = Math.max(1, Math.round(basis * share));
    const outcome = applyPlayerProcDamage(world, player, next, damage, {
      tags: ['lineage', 'keystone', 'chain'],
    });
    if (outcome === 'skipped') break; // invulnerable: nothing landed, nothing continues

    links++;
    // One visible thing per application (design §8): the link index rides as
    // `stacks`, so a long chain draws bigger with every jump.
    pushKeystoneFx(world, player, LANE, { target: next, stacks: links });
    // Whether it died or not, the next link measures its reach from here — a
    // corpse's last position is where the chain actually is.
    from = next;
  }
  return links;
}

/** The nearest live body in reach of `from` that this chain has not hit yet. */
function freshTarget(
  world: World,
  player: PlayerEntity,
  from: MonsterEntity,
  struck: ReadonlySet<string>,
): MonsterEntity | undefined {
  const reach = lineageUnit('contagionRadius');
  const candidates = playerAoeTargets(
    world, player, from.hasPosition.current, reach, from.isMonster.id,
  ).filter((monster) => monster.hasHealth.hp > 0 && !struck.has(monster.isMonster.id));
  if (candidates.length === 0) return undefined;
  // Nearest first, so a chain reads as jumping between neighbours rather than
  // picking an arbitrary body out of the pack.
  let best = candidates[0]!;
  let bestDist = distanceSq(from, best);
  for (const candidate of candidates.slice(1)) {
    const d = distanceSq(from, candidate);
    if (d < bestDist) { best = candidate; bestDist = d; }
  }
  return best;
}

function distanceSq(a: MonsterEntity, b: MonsterEntity): number {
  const dx = a.hasPosition.current.x - b.hasPosition.current.x;
  const dy = a.hasPosition.current.y - b.hasPosition.current.y;
  return dx * dx + dy * dy;
}
