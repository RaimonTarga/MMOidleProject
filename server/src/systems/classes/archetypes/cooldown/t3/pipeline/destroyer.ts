import type { AbilityDef } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../../../ecs/entity';
import type { World } from '../../../../../../world/World';
import { registerCombatListener, type CombatContext } from '../../../../../combat/engine/combatPipeline';
import { runPlayerAttack } from '../../../../../combat/engine/combat';
import { HOLD_EMPOWERED_ATTACK, isEmpoweredAttack } from '../../../../../combat/engine/empoweredAttacks';
import { applyPlayerAoe, playerAoeTargets } from '../../../../../combat/damage/aoeDamage';
import { isInvulnerableMonster } from '../../../../../combat/invulnerability';
import { castStrikeArea } from '../../../../../player/abilities/abilityEffects';
import { hasPassive } from '../core/helpers';

/**
 * DESTROYER (cooldown-heavy-t3-b, design §22.5) — the execution is delivered by
 * the player's Techniques.
 *
 * When the recharge is done the execution waits, PRIMED: it is the root's own
 * pending empowered flag, so the HUD bar sits full and everything that asks "is
 * the execution ready?" (auto-combat's wait rune, target priority, Refund) reads
 * it as it always has. Regular hits deal their normal damage and never spend it.
 * The next Technique the player LANDS fires it, with that Technique's shape:
 *
 *   armed    the armed hit IS the execution. The decision is taken here, in
 *            {@link registerDestroyerHold}, on the hit itself and BEFORE the root's
 *            multiplier — the one place an armed hit can still become the
 *            execution with every reader of the execution seeing it (the frame's
 *            bank and plating strip, the recharge restart and `mechanic-fired`,
 *            the Shockwave keystone, the T3 listeners). The Technique resolution
 *            seam itself fires later in the same pass, from the rider, by which
 *            time all of those have run. Its gates mirror the rider's own.
 *   cast     {@link destroyerOnTechniqueResolved}, from the Technique resolution
 *            seam (`combat/techniqueResolved.ts`), after the cast's payload: the
 *            execution lands on the cast's target as a real attack, from wherever
 *            the player stands (Snipe's range), and an area strike carries it
 *            across its whole circle (Slam). Contagion and Detonate: their target.
 *
 * "LANDS": an evaded armed hit did not land, so the execution stays primed for
 * the next Technique (the Technique itself is spent by its own rules). A cast
 * is never dodged, so neither is the execution it delivers (`castDelivered`).
 * A Technique with no target — a self-cast, an instant, a bare reposition — has
 * no shape to carry it, and a cast that killed its only body has nothing left to
 * land on: the execution stays primed either way. A Guard never resolves at the
 * Technique seam, and never arms a hit, so a Guard never fires it.
 *
 * One multiplier per hit, and the root's own: the delivered execution is the
 * ordinary execution (frame multiplier plus the path's authored delta, its bank,
 * gear, relics), not a second layer on the Technique's payload.
 *
 * DISTINCT FROM SIGNATURE. Signature makes a landed Technique COUNT as the
 * mechanic; Destroyer makes the mechanic RIDE the Technique. With both, the one
 * execution fires once and counts once: on an armed hit the execution's own
 * `mechanic-fired` latches the exchange, so Signature finds the moment already
 * announced; on a cast the seam skips Signature when this delivered.
 */

/** `ctx.metadata` key on the attack a cast delivers the execution with. */
export const DESTROYER_DELIVERY = 'destroyerDelivery';

function isDestroyer(player: PlayerEntity): boolean {
  return player.usesCooldown !== undefined && hasPassive(player, 'cooldown.technique-execution');
}

/**
 * Whether this hit carries the primed execution: a cast's delivery, or a hit an
 * armed Technique LANDS on. The armed gates are the rider's own
 * (`initAbilitySystems`): an enemy-facing hit, no dead swing, not a bonded
 * summon's swing.
 */
function carriesExecution(ctx: CombatContext): boolean {
  if (ctx.metadata[DESTROYER_DELIVERY] === true) return true;
  if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return false;
  if (!ctx.attacker.hasArmedAbility) return false;
  if (ctx.metadata['chaoticMiss']) return false;
  if (ctx.formation?.side === 'summon') return false;
  // "The next Technique the player LANDS": an evaded hit did not land.
  if (ctx.metadata['evaded'] === true) return false;
  return true;
}

/**
 * Keep the primed execution off every hit that does not carry it. Registered in
 * `initCooldownArchetype` BEFORE the root's empowered multiplier, which honours
 * the hold the same way it honours a dead swing.
 */
export function registerDestroyerHold(): void {
  registerCombatListener('onHit', (ctx) => {
    if (ctx.attackerType !== 'player') return;
    const player = ctx.attacker;
    if (!isDestroyer(player) || !isEmpoweredAttack(player)) return;
    if (carriesExecution(ctx)) return;
    ctx.metadata[HOLD_EMPOWERED_ATTACK] = true;
  });
}

/** A body the delivery can still land on. */
function standing(world: World, player: PlayerEntity, monster: MonsterEntity): boolean {
  return monster.hasHealth.hp > 0
    && world.hasMonster(monster.isMonster.id)
    && monster.hasPosition.nodeId === player.hasPosition.nodeId
    && !isInvulnerableMonster(monster);
}

/**
 * A Technique resolved: if it was a cast and the execution is primed, the cast
 * delivers it. Returns true when the execution was delivered (spent), so the
 * seam can keep the Signature keystone from counting the same cast a second time.
 *
 * Called from `onTechniqueResolved` only. An armed shape (`site.ctx`) already
 * carried the execution on its own hit, so there is nothing to do here.
 */
export function destroyerOnTechniqueResolved(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  site: { ctx?: CombatContext; target?: MonsterEntity; now?: number },
): boolean {
  if (ability.slot !== 'technique') return false;
  if (site.ctx) return false;
  if (!isDestroyer(player) || !isEmpoweredAttack(player)) return false;
  const cast = site.target;
  if (!cast) return false;

  const radius = castStrikeArea(player, ability);
  const center = { ...cast.hasPosition.current };
  // The cast's own target, or — when an area strike already killed it — any body
  // still standing in that area. A single-target cast that killed its target
  // leaves nothing to land on.
  const primary = standing(world, player, cast)
    ? cast
    : radius !== undefined
      ? playerAoeTargets(world, player, center, radius).find((m) => standing(world, player, m))
      : undefined;
  if (!primary) return false;

  const result: Record<string, unknown> = {};
  // The cast loop passes its tick's `now`; the wall clock is only the fallback
  // for a caller outside the tick (the same default the boss patterns use).
  runPlayerAttack(world, player, primary, site.now ?? Date.now(), {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
    metadata: { [DESTROYER_DELIVERY]: true, castDelivered: true },
    resultMetadata: result,
  });
  // Still primed: the delivery never reached the multiplier (an invulnerable
  // body cancelled it, a dead swing whiffed it), so it is still waiting.
  if (isEmpoweredAttack(player)) return false;

  if (radius !== undefined) {
    // The rest of the strike's circle takes the execution at the strength it
    // landed with — the same gross a normal hit starts from, mitigated per body
    // through the authoritative splash path, exactly like the strike itself.
    const landed = Math.max(1, Number(result['empoweredMultiplier'] ?? 1));
    const amount = Math.max(1, Math.round(player.dealsDamage.attack * landed));
    applyPlayerAoe(
      world, player, center, radius, amount, primary.isMonster.id, 'player',
      { empowered: true },
      { feedsWeaponReservoir: true },
    );
  }
  return true;
}
