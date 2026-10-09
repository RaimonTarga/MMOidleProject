/**
 * The ability-node runtime (design §19, §22).
 *
 * WHAT THIS IS. A few lines of dispatch and no combat code at all. A node fires
 * the chosen packet's payoff through `fireLineagePayoffs` — the lineage card
 * dispatcher — so every rule that runtime already enforces holds here without
 * being restated: the evade early-return on on-target payoffs, the max-wins
 * shared debuff records, `hitBasis`'s one-multiplier-per-hit basis, the
 * amplified second body, and exactly ONE `card-fx` per application that
 * actually did something. The cross row (design §22.1) is a second packet-row
 * payoff at the cross scalar through the same call — "it needs no new runtime".
 *
 * THE TWO MOMENTS. A Technique node fires when the Technique LANDS, a Guard node
 * when the Guard CASTS. "Lands" is deliberately not "activates": an armed
 * Technique activates when it arms, which can be a swing before it touches
 * anything, and a node that paid out on arming would pay out on a charge the
 * fight never consumed.
 *
 * AND ONE EXCEPTION: KILL CHAIN FIRES ON THE KILL (design §22.10: "a Kill chain
 * offer on a Technique fires when the ability's hit kills, not when it lands").
 * Keyed on the LANE, so every Kill chain route on every Technique obeys it,
 * whatever its payoff: on an exchange the payoff waits on that exchange's own
 * `onKill`; on a cast (no exchange) it pays when the resolution left its target
 * dead. A landing that does not kill pays nothing.
 *
 * Neither hook is wired from here any more. Each sits behind the one seam its
 * side already has — `combat/techniqueResolved.ts` for a Technique (which knows
 * all five shapes' resolutions) and `onGuardFired` for a Guard — so "once per
 * landing" and "once per cast" are stated in one place each instead of in every
 * consumer. See `techniqueResolved.ts` for the shape table and for why the armed
 * family hooks `applyTechniqueRider` rather than the listener around it.
 */
import {
  getAbilityNodeRuntime,
  resolveActiveAbilityKeystones,
  resolveActiveAbilityNodes,
  setAbilityKeystoneRuntime,
  setAbilityNodeRuntime,
  abilityNodeFx,
  type AbilityDef,
  type AbilityKeystoneRuntime,
  type AbilityNodeFiringCache,
  type AbilityNodeOption,
  type AbilityNodeRuntime,
  type AmplifiedAxis,
  type LineagePayoff,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../ecs/entity';
import type { World } from '../../world/World';
import { registerCombatListener, type CombatContext } from './engine/combatPipeline';
import { fireLineagePayoffs, type ExternalLineagePayoff } from './lineageCards';

/**
 * Re-resolve the player's ability nodes and keystones. Called from
 * `recalculatePlayerEntityStats` alongside `refreshLineageRuntime`, which is the
 * one place the input (`tracksProgression.abilityNodes`) can change.
 */
export function refreshAbilityNodeRuntime(player: PlayerEntity): void {
  const nodes = player.tracksProgression.abilityNodes;
  const firings = resolveActiveAbilityNodes(nodes);
  const runtime: AbilityNodeRuntime = {};
  for (const [abilityId, firing] of firings) {
    const cache: AbilityNodeFiringCache = { option: firing.option, payoff: firing.payoff };
    if (firing.cross) cache.cross = firing.cross;
    if (firing.castSpeedPct !== undefined) cache.castSpeedPct = firing.castSpeedPct;
    if (firing.amplifier?.amplifies) cache.axis = firing.amplifier.amplifies;
    runtime[abilityId] = cache;
  }
  setAbilityNodeRuntime(player.tracksCombat, runtime);

  const keystones: AbilityKeystoneRuntime = {};
  for (const [abilityId, keystone] of resolveActiveAbilityKeystones(nodes)) {
    keystones[abilityId] = {
      keystoneId: keystone.keystoneId,
      ...(keystone.share !== undefined ? { share: keystone.share } : {}),
    };
  }
  setAbilityKeystoneRuntime(player.tracksCombat, keystones);
}

/**
 * The cast speed this ability's nodes add (the amplifier's `cast` axis, design
 * §22.9), or 0. Joins `technique.cast-speed-pct` in ONE capped sum in the cast
 * lifecycle — never a second, separately capped layer.
 */
export function abilityNodeCastSpeedPctFor(player: PlayerEntity, abilityId: string): number {
  return getAbilityNodeRuntime(player.tracksCombat)?.[abilityId]?.castSpeedPct ?? 0;
}

/** One node payoff as the dispatcher wants it, or null when it has no declared fx. */
function external(option: AbilityNodeOption, payoff: LineagePayoff, axis?: AmplifiedAxis): ExternalLineagePayoff | null {
  const fx = abilityNodeFx(option.lane, payoff.kind);
  if (!fx) return null;
  // The payoff is cloned because the dispatcher mutates what it is handed (a
  // bleed rewrites `damagePerTick`, plating-stack stamps `perStackFraction`),
  // and the cache must survive the fight unchanged. The amplifier's axis rides
  // the card-fx so the client scales or extends the lane's fx by it (§22.7).
  return { key: option.id, fx, payoff: { ...payoff }, ...(axis ? { axis } : {}) };
}

/**
 * The payoffs this ability's nodes pay — the packet's, then the cross row's — or
 * an empty list when the player has bought none.
 *
 * A node with no declared fx is refused rather than drawn with someone else's
 * grammar: design §8's "one thing you can see" is a contract, and a silent
 * payoff would be the worst of both.
 */
function payoffsFor(player: PlayerEntity, abilityId: string): Array<{ lane: string; payoff: ExternalLineagePayoff }> {
  const firing = getAbilityNodeRuntime(player.tracksCombat)?.[abilityId];
  if (!firing) return [];
  const out: Array<{ lane: string; payoff: ExternalLineagePayoff }> = [];
  const packet = external(firing.option, firing.payoff, firing.axis);
  if (packet) out.push({ lane: firing.option.lane, payoff: packet });
  if (firing.cross) {
    const cross = external(firing.cross.option, firing.cross.payoff);
    if (cross) out.push({ lane: firing.cross.option.lane, payoff: cross });
  }
  return out;
}

/** Where a Kill chain node payoff waits for the kill its exchange makes. */
const KILL_CHAIN_PENDING = 'abilityNodeKillChain';

/**
 * A Technique resolved. Fires its node payoffs, on the exchange when there was
 * one so a payoff's share is taken off the hit that carried it — except a Kill
 * chain route, which waits for the kill (design §22.10).
 *
 * Called from `onTechniqueResolved`, never directly.
 */
export function onAbilityNodeTechniqueLanded(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  site: { ctx?: CombatContext; target?: MonsterEntity } = {},
): void {
  if (ability.slot !== 'technique') return;
  const payoffs = payoffsFor(player, ability.id);
  if (payoffs.length === 0) return;

  const now: ExternalLineagePayoff[] = [];
  const onKill: ExternalLineagePayoff[] = [];
  for (const entry of payoffs) (entry.lane === 'kill-chain' ? onKill : now).push(entry.payoff);

  if (now.length > 0) fireLineagePayoffs(world, player, now, site);
  if (onKill.length === 0) return;

  if (site.ctx) {
    // The exchange's own kill, if it makes one: `combat.ts` emits `onKill` with
    // this very context, so the payoff waits on it rather than on any kill.
    const pending = site.ctx.metadata[KILL_CHAIN_PENDING];
    site.ctx.metadata[KILL_CHAIN_PENDING] = Array.isArray(pending) ? [...pending, ...onKill] : onKill;
    return;
  }
  // No exchange (a cast's payload, a reposition): the resolution has already
  // dealt its damage, so a target it left dead is the kill it made.
  if (site.target && site.target.hasHealth.hp <= 0) {
    fireLineagePayoffs(world, player, onKill, { target: site.target });
  }
}

/**
 * Pay the Kill chain node payoffs a Technique's exchange left waiting, on the kill
 * that exchange made. Registered from `initCombatSystems()` so the live server and
 * the bench see the same rule.
 */
export function registerAbilityNodeKillChain(): void {
  registerCombatListener('onKill', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const pending = ctx.metadata[KILL_CHAIN_PENDING];
    if (!Array.isArray(pending) || pending.length === 0) return;
    delete ctx.metadata[KILL_CHAIN_PENDING];
    // The corpse is still in the world at onKill, which is what a window that
    // opens on the player needs nothing of, and what a share of the hit reads.
    fireLineagePayoffs(world, ctx.attacker, pending as ExternalLineagePayoff[], {
      ctx,
      target: ctx.defender,
    });
  });
}

/**
 * A Guard cast. No exchange to ride, so the payoff's basis is the player's own
 * Attack — which is what the magnitude table's flat column is seeded against —
 * and the target, if a defensive payoff needed one, is the live attack target.
 */
export function onAbilityNodeGuardCast(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
): void {
  if (ability.slot !== 'guard') return;
  const payoffs = payoffsFor(player, ability.id).map((entry) => entry.payoff);
  if (payoffs.length === 0) return;
  fireLineagePayoffs(world, player, payoffs);
}
