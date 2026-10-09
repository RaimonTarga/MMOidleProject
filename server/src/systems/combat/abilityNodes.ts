/**
 * The ability-node runtime (design §19, §22).
 *
 * WHAT THIS IS. A few lines of dispatch and no combat code at all. A node fires
 * the chosen packet's payoff through `fireLineagePayoffs` — the lineage card
 * dispatcher — so every rule that runtime already enforces holds here without
 * being restated: the evade early-return on on-target payoffs, the max-wins
 * shared debuff records, `hitBasis`'s one-multiplier-per-hit basis, the
 * amplified second body, the per-firing rate cap, and exactly ONE `card-fx` per
 * application that actually did something. The cross row (design §22.1) is a
 * second packet-row payoff at the cross scalar through the same call — "it needs
 * no new runtime".
 *
 * WHERE AND WHEN: THE FIRE-SHAPE (design §22.10, LOCKED). Every ability's row in
 * `ABILITY_FIRE_SHAPES` says where its packet and cross payoffs fire, from a
 * closed list, each riding a seam that already existed. Same payoffs, same
 * magnitudes — the shape only moves the moment:
 *
 *   on land                 the Technique's resolution, on its target
 *                           (`onAbilityNodeTechniqueLanded`, from
 *                           `combat/techniqueResolved.ts`)
 *   on every body hit       once per body the ability's own area struck, from the
 *                           seam that resolved the area (`onAbilityNodeBodiesHit`:
 *                           Sweep's cleave, Slam's circle, Contagion's spread)
 *   on each hit of a window once per charge a window spends, on that hit's target
 *                           (`onAbilityNodeWindowHit`, from Imbue's consumer)
 *   on the kill             a Kill chain route on a Technique, on the kill its hit
 *                           makes (below)
 *   on cast / on the break  the Guard's cast (`onAbilityNodeGuardCast`, from
 *                           `onGuardFired`): Second Wind, and Break Free, whose
 *                           cast IS the break (it only fires while held)
 *   per hit absorbed        each direct hit not dodged outright while the
 *                           Guard's own window is up — Brace's DR, Bramble's
 *                           thorns — on the hit-taken seam, after defense
 *   per hit dodged          each successful evade roll while Sidestep's window is
 *                           up, on the evade seam (a graze counts, as it does
 *                           for an `evade` card)
 *
 * A Guard's payoff is a defensive face's and never deals damage; the shape only
 * moves the moment it is granted.
 *
 * THE RATE CAP. A shape that fires more than once per cast — per hit of a
 * window, per hit absorbed, per hit dodged, per tick while active — must not
 * escape the lane's existing rate cap (design §24.2: synergy buys reliability,
 * never rate). So each of its firings carries its packet moment's `capMs`
 * (`packetMoment(lane)`: Affliction and Control one per 5 s, Empowered one per
 * 4 s, the rest uncapped), and `fire()` applies it exactly as it does for a card:
 * one landed firing per cap per option. A shape that fires once per cast — on
 * land, on every body hit (one moment that lands on several bodies, like a
 * `targets` amplifier), on cast, on strip, on the break — carries none, as before.
 *
 * "Lands" is deliberately not "activates": an armed Technique activates when it
 * arms, which can be a swing before it touches anything, and a node that paid out
 * on arming would pay out on a charge the fight never consumed.
 *
 * KILL CHAIN FIRES ON THE KILL (design §22.10: "a Kill chain offer on a Technique
 * fires when the ability's hit kills, not when it lands"). Keyed on the shape
 * table's override (`abilityOfferFireShape`), so every Kill chain route on every
 * Technique obeys it, whatever its payoff: on an exchange the payoff waits on
 * that exchange's own `onKill`; on a cast (no exchange) it pays when the
 * resolution left its target dead. A landing that does not kill pays nothing.
 *
 * WHICH HIT A PAYOFF'S SHARE IS OF. The exchange's own body fires on the exchange
 * — its share of that hit, its evade. Every other body fires without one: the
 * owner's Attack is the basis (what the magnitude table's flat column is seeded
 * against, and what a cast's area already used on every body), and a body the
 * area reached rolled no evade of its own to refuse it.
 */
import {
  ABILITY_DATABASE,
  ABILITY_SIDESTEP_EFFECT_ID,
  abilityOfferFireShape,
  getAbilityNodeRuntime,
  getStatusEffect,
  guardEffectIdForAbility,
  packetMoment,
  recoveryEffectIdForAbility,
  resolveActiveAbilityKeystones,
  resolveActiveAbilityNodes,
  setAbilityKeystoneRuntime,
  setAbilityNodeRuntime,
  abilityNodeFx,
  type AbilityDef,
  type AbilityFireShape,
  type AbilityKeystoneRuntime,
  type AbilityNodeFiringCache,
  type AbilityNodeOption,
  type AbilityNodeRuntime,
  type LineagePayoff,
  type PacketId,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../ecs/entity';
import type { World } from '../../world/World';
import { registerCombatListener, type CombatContext } from './engine/combatPipeline';
import { fireLineagePayoffs, type ExternalLineagePayoff } from './lineageCards';
import { evadeFullyAvoided, evadeMitigationOf } from '../defense/mitigation/evasion';
import { BRAMBLE_EFFECT_ID } from '../player/abilities/abilityBramble';

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

/** One node payoff, with the fire-shape that says when it pays. */
interface NodePayoff {
  lane: PacketId;
  shape: AbilityFireShape;
  payoff: ExternalLineagePayoff;
}

/**
 * The fire-shapes that fire more than once per cast, so each firing carries the
 * lane's rate cap (see the module header).
 */
const CAPPED_SHAPES: ReadonlySet<AbilityFireShape> = new Set<AbilityFireShape>([
  'on each hit of a window',
  'per hit absorbed',
  'per hit dodged',
  'per tick while active',
]);

/**
 * One node payoff as the dispatcher wants it, or null when it has no declared fx.
 * A payoff on a capped shape carries its packet moment's `capMs`.
 */
function external(
  option: AbilityNodeOption,
  payoff: LineagePayoff,
  shape: AbilityFireShape,
): ExternalLineagePayoff | null {
  const fx = abilityNodeFx(option.lane, payoff.kind);
  if (!fx) return null;
  const capMs = CAPPED_SHAPES.has(shape) ? packetMoment(option.lane)?.capMs ?? 0 : 0;
  // The payoff is cloned because the dispatcher mutates what it is handed (a
  // bleed rewrites `damagePerTick`, plating-stack stamps `perStackFraction`),
  // and the cache must survive the fight unchanged.
  return { key: option.id, fx, payoff: { ...payoff }, ...(capMs > 0 ? { capMs } : {}) };
}

/**
 * The payoffs this ability's nodes pay — the packet's, then the cross row's —
 * each with its fire-shape, or an empty list when the player has bought none.
 *
 * A node with no declared fx is refused rather than drawn with someone else's
 * grammar: design §8's "one thing you can see" is a contract, and a silent
 * payoff would be the worst of both. An ability with no fire-shape row (the
 * table test refuses that) fires on land, as every node did before the shapes.
 */
function payoffsFor(player: PlayerEntity, abilityId: string): NodePayoff[] {
  const firing = getAbilityNodeRuntime(player.tracksCombat)?.[abilityId];
  if (!firing) return [];
  const out: NodePayoff[] = [];
  const add = (option: AbilityNodeOption, payoff: LineagePayoff): void => {
    const shape = abilityOfferFireShape(abilityId, option.lane) ?? 'on land';
    const entry = external(option, payoff, shape);
    if (!entry) return;
    out.push({ lane: option.lane, shape, payoff: entry });
  };
  add(firing.option, firing.payoff);
  if (firing.cross) add(firing.cross.option, firing.cross.payoff);
  return out;
}

/** The payoffs of `entries` that fire on `shape`. */
function withShape(entries: readonly NodePayoff[], shape: AbilityFireShape): ExternalLineagePayoff[] {
  return entries.filter((entry) => entry.shape === shape).map((entry) => entry.payoff);
}

/**
 * The shapes a Technique's own resolution never pays: they have their own seam
 * and fire there instead (an area's bodies, a window's hits, the kill). Imbue
 * Lightning's resolution only opens its window — its node pays on the hits that
 * spend it.
 */
const NOT_AT_RESOLUTION: ReadonlySet<AbilityFireShape> = new Set<AbilityFireShape>([
  'on every body hit',
  'on each hit of a window',
  'on the kill',
]);

/** Where a Kill chain node payoff waits for the kill its exchange makes. */
const KILL_CHAIN_PENDING = 'abilityNodeKillChain';

/**
 * A Technique resolved. Fires its node payoffs that pay on land, on the exchange
 * when there was one so a payoff's share is taken off the hit that carried it —
 * and leaves a Kill chain route waiting for the kill (design §22.10). A route
 * that fires on every body hit is the area's to fire ({@link onAbilityNodeBodiesHit}).
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

  const now = payoffs.filter((entry) => !NOT_AT_RESOLUTION.has(entry.shape)).map((entry) => entry.payoff);
  const onKill = withShape(payoffs, 'on the kill');

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
 * A Technique's own AREA resolved on `bodies` — Sweep's cleave, Slam's circle,
 * Contagion's spread — so its "on every body hit" routes fire once on each
 * (design §22.10). One firing per body per resolution: a body listed twice
 * fires once. Every other route is the resolution's, so this fires nothing else.
 *
 * Called from the seam that resolved the area, after the Technique's own
 * resolution (`onTechniqueResolved`), so a cooldown refund has a running
 * cooldown to take its share off. `exchange` is the hit that carried the area,
 * when one did: its own body fires on it, every other body without one (see the
 * module header).
 *
 * A Conduit's cast resolves through its one physical summon, so its circle is
 * that cast's circle — once, never once per formation body (design §22.11). A
 * formation rider calls this from its first delivery only, with that delivery's
 * cleave.
 */
export function onAbilityNodeBodiesHit(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  bodies: readonly MonsterEntity[],
  exchange?: CombatContext,
): void {
  if (ability.slot !== 'technique' || bodies.length === 0) return;
  const payoffs = withShape(payoffsFor(player, ability.id), 'on every body hit');
  if (payoffs.length === 0) return;
  const seen = new Set<string>();
  for (const body of bodies) {
    if (seen.has(body.isMonster.id)) continue;
    seen.add(body.isMonster.id);
    const own = exchange?.defenderType === 'monster' && exchange.defender === body;
    // Each body is its own application: a fresh clone per body, since the
    // dispatcher mutates the payoff it is handed.
    fireLineagePayoffs(
      world, player,
      payoffs.map((payoff) => ({ ...payoff, payoff: { ...payoff.payoff } })),
      own ? { ctx: exchange, target: body } : { target: body },
    );
  }
}

/**
 * A Technique's WINDOW spent one charge on the landed hit `ctx` — Imbue
 * Lightning's, today — so its "on each hit of a window" routes fire once, on
 * that hit's target, on that hit's exchange (design §22.10: "on each imbued
 * hit"). Each spent charge is one firing; a capped lane pays at most once per its
 * cap, however fast the charges go.
 *
 * Called from the window's own consumer (`abilityImbue.ts`), once per charge.
 */
export function onAbilityNodeWindowHit(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  ctx: CombatContext,
): void {
  if (ability.slot !== 'technique' || ctx.defenderType !== 'monster') return;
  const payoffs = withShape(payoffsFor(player, ability.id), 'on each hit of a window');
  if (payoffs.length === 0) return;
  fireLineagePayoffs(world, player, payoffs, { ctx, target: ctx.defender });
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
 * The Guard shapes its cast never pays: each has its own seam and fires there
 * while the Guard's window is up.
 */
const GUARD_NOT_AT_CAST: ReadonlySet<AbilityFireShape> = new Set<AbilityFireShape>([
  'per hit absorbed',
  'per hit dodged',
]);

/**
 * A Guard cast. Fires the routes that pay on cast (Second Wind) or on the break
 * (Break Free, whose cast is the break) — every other Guard pays on its own seam
 * while its window is up. No exchange to ride, so the payoff's basis is the
 * player's own Attack — which is what the magnitude table's flat column is
 * seeded against — and the target, if a defensive payoff needed one, is the live
 * attack target.
 */
export function onAbilityNodeGuardCast(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
): void {
  if (ability.slot !== 'guard') return;
  const payoffs = payoffsFor(player, ability.id)
    .filter((entry) => !GUARD_NOT_AT_CAST.has(entry.shape))
    .map((entry) => entry.payoff);
  if (payoffs.length === 0) return;
  fireLineagePayoffs(world, player, payoffs);
}

/**
 * The status that IS a Guard's window — the one its effect applies and its buff
 * tile reads — keyed on the effect kind, exactly as `applyGuardEffect` dispatches.
 * Undefined for a Guard with no window (Cleanse, Break Free: an instant).
 */
function guardWindowEffectId(ability: AbilityDef): string | undefined {
  switch (ability.ranks[0].effect.kind) {
    case 'damage-reduction': return guardEffectIdForAbility(ability.id);
    case 'heal': return recoveryEffectIdForAbility(ability.id);
    case 'bramble': return BRAMBLE_EFFECT_ID;
    case 'dodge-window': return ABILITY_SIDESTEP_EFFECT_ID;
    default: return undefined;
  }
}

/** Whether `ability`'s own window is up on `player` right now. */
function guardWindowUp(player: PlayerEntity, ability: AbilityDef): boolean {
  const id = guardWindowEffectId(ability);
  if (!id) return false;
  const effect = getStatusEffect(player.tracksCombat, id);
  return effect !== undefined && effect.remainingMs > 0;
}

/**
 * Fire every Guard route on `shape` whose Guard's window is up — one firing per
 * Guard per call, each payoff under its lane's cap. `target` is whatever the
 * moment answers (the attacker), for a payoff that wanted one; a Guard's never do.
 */
function fireGuardShape(
  world: World,
  player: PlayerEntity,
  shape: AbilityFireShape,
  target?: MonsterEntity,
): number {
  const runtime = getAbilityNodeRuntime(player.tracksCombat);
  if (!runtime) return 0;
  let fired = 0;
  for (const abilityId of Object.keys(runtime)) {
    const ability = ABILITY_DATABASE.get(abilityId);
    if (!ability || ability.slot !== 'guard') continue;
    const payoffs = withShape(payoffsFor(player, abilityId), shape);
    if (payoffs.length === 0 || !guardWindowUp(player, ability)) continue;
    fired += fireLineagePayoffs(world, player, payoffs, target ? { target } : {});
  }
  return fired;
}

/**
 * The two Guard fire-shapes that answer an incoming hit (design §22.10), as
 * listeners of their own on the seams the lineage `hit-taken` and `evade`
 * triggers ride:
 *
 *  - per hit absorbed: a DIRECT hit (never a DoT tick) that was not dodged
 *    outright, while the Guard's window is up — Brace, Bramble Guard. One
 *    deliberate difference from a `hit-taken` card, which also wants
 *    `ctx.damage > 0` after defense: a hit the Guard's own ward (or the barrier)
 *    swallowed whole was ABSORBED, which is the whole of this shape — counting
 *    only what got through would make Brace's ward route stop its own next
 *    firing.
 *  - per hit dodged: the player's evade roll succeeded (a graze included, as for
 *    an `evade` card) while the Guard's window is up — Sidestep.
 *
 * Registered from `initCombatSystems()` AFTER the defense systems, as
 * `registerLineageIncomingCards` is, so the evade has been applied by then.
 */
export function registerAbilityNodeIncoming(): void {
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.defenderType !== 'player' || ctx.cancelled) return;
    if (ctx.metadata['isDot']) return; // a tick is no hit to absorb or dodge
    const attacker = ctx.attackerType === 'monster' ? ctx.attacker : undefined;
    if (ctx.metadata['evaded'] === true && evadeMitigationOf(ctx) > 0) {
      fireGuardShape(world, ctx.defender, 'per hit dodged', attacker);
    }
    if (evadeFullyAvoided(ctx)) return;
    fireGuardShape(world, ctx.defender, 'per hit absorbed', attacker);
  });
}
