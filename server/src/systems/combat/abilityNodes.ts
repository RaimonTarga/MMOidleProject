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
 *                           `combat/techniqueResolved.ts`); Disengage's is the
 *                           body it broke from, and Charge's its target on
 *                           arrival (its rush has no contact seam)
 *   on every body hit       once per body the ability's own area struck, from the
 *                           seam that resolved the area (`onAbilityNodeBodiesHit`:
 *                           Sweep's cleave, Slam's circle, Contagion's spread) —
 *                           a body payoff only; a self payoff fires once (below)
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
 *   per tick while active   once per pulse while the Guard's window is up —
 *                           Endure's hold, Recuperate's mend — on the lineage
 *                           `pulse` cadence (`LINEAGE_UNITS.pulseMs`), counted
 *                           by a cooldown as a pulse card's is
 *                           (`updateAbilityNodePulses`, from `World.tick`)
 *   on strip                once per strip that removed anything (a body payoff
 *                           once per affliction kind removed; no Guard offers
 *                           one) — `onAbilityNodeStripped`, from the Guard
 *                           firing that stripped them
 *
 * The four Guard shapes above that answer the fight (per hit absorbed, per hit
 * dodged, per tick while active, on strip) fire under a rate cap (below).
 *
 * A Guard's payoff is a defensive face's and never deals damage; the shape only
 * moves the moment it is granted.
 *
 * SELF PAYOFFS FIRE ONCE PER RESOLUTION (design §22.12, "fire-shapes keep their
 * rate"). A payoff that lands on the player or on the ability itself — a cooldown
 * refund, a speed, damage or Technique window, a ward, a plating stack — fires
 * once per resolution however many bodies it hit; a payoff that lands on a body
 * (a bleed, a slow, a brand, a plating shred, poison) still fires on each. The
 * classification is the resolver's own: `applyPayoff` sends a payoff to the body
 * exactly when `payoffLandsOnTarget(kind)` (shared `ON_TARGET_PAYOFF_KINDS`),
 * and everything else resolves on the player (see {@link landsOnBody}).
 *
 * THE RATE CAP. A shape that fires more than once per cast must not escape a lane
 * cap (design §24.2: synergy buys reliability, never rate). Each of its firings
 * carries a `capMs`, and `fire()` applies it exactly as it does for a card: one
 * landed firing per cap per option — per (player, ability, route).
 *
 *  - Every Guard route on per hit absorbed, per hit dodged, per tick while
 *    active or on strip is capped (design §22.12): its packet moment's own
 *    `capMs` where it has one (`packetMoment(lane)`: Affliction and Control one
 *    per 5 s, Empowered one per 4 s), else Control's existing 5 s
 *    ({@link GUARD_FALLBACK_CAP_LANE}). Brace's ward fires at most once per 5 s
 *    however many hits it absorbs; a per-tick pulse the cap would refuse waits
 *    for the cap rather than being spent, so Endure and Recuperate pulse every
 *    5 s, not every 4.
 *  - A Technique's window (on each hit of a window: Imbue) carries its packet's
 *    own `capMs` only.
 *  - A shape that fires once per cast — on land, on every body hit (one moment
 *    that lands on several bodies, like a `targets` amplifier), on cast, on the
 *    break — carries none.
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
  ABILITY_FIRE_SHAPES,
  ABILITY_SIDESTEP_EFFECT_ID,
  abilityOfferFireShape,
  getAbilityNodeRuntime,
  getStatusEffect,
  guardEffectIdForAbility,
  isCooldownActive,
  lineageUnit,
  packetMoment,
  payoffLandsOnTarget,
  recoveryEffectIdForAbility,
  resolveActiveAbilityKeystones,
  resolveActiveAbilityNodes,
  setAbilityKeystoneRuntime,
  setAbilityNodeRuntime,
  setCooldown,
  abilityNodeFx,
  type AbilityDef,
  type AbilityFireShape,
  type AbilityKeystoneRuntime,
  type AbilityNodeFiringCache,
  type AbilityNodeOption,
  type AbilityNodeRuntime,
  type AmplifiedAxis,
  type LineagePayoff,
  type PacketId,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../ecs/entity';
import type { World } from '../../world/World';
import { registerCombatListener, type CombatContext } from './engine/combatPipeline';
import { fireLineagePayoffs, type ExternalLineagePayoff } from './lineageCards';
import { capCd } from './lineageKeys';
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

/** One node payoff, with the fire-shape that says when it pays. */
interface NodePayoff {
  lane: PacketId;
  shape: AbilityFireShape;
  payoff: ExternalLineagePayoff;
}

/**
 * The Guard fire-shapes that answer the fight rather than the cast — per hit
 * absorbed, per hit dodged, per tick while active, on strip — every route of
 * which carries a rate cap (design §22.12; see the module header).
 */
const GUARD_RATE_SHAPES: ReadonlySet<AbilityFireShape> = new Set<AbilityFireShape>([
  'per hit absorbed',
  'per hit dodged',
  'per tick while active',
  'on strip',
]);

/**
 * The lane whose EXISTING moment cap a Guard route borrows when its own packet has
 * none (design §22.12: "an existing lane cap otherwise"): Control's one per 5 s
 * (`PACKET_HALF_NUMBERS.control.moment.capMs`), the one capped lane a Guard
 * offers (Brace's and Break Free's Control route already ride it), so every route
 * of a Guard fires at the same rate and differs only in what it does. Read from
 * the table, never copied: move Control's cap and the Guard routes follow.
 */
const GUARD_FALLBACK_CAP_LANE: PacketId = 'control';

/**
 * The rate cap one route fires under, in ms (0 = uncapped):
 *  - a Guard rate shape: its packet's own `capMs`, else the fallback lane's;
 *  - a Technique's window (`on each hit of a window`): its packet's own `capMs`;
 *  - every other shape fires once per cast and carries none.
 */
export function abilityNodeRouteCapMs(lane: PacketId, shape: AbilityFireShape): number {
  const own = packetMoment(lane)?.capMs ?? 0;
  if (GUARD_RATE_SHAPES.has(shape)) {
    return own > 0 ? own : packetMoment(GUARD_FALLBACK_CAP_LANE)?.capMs ?? 0;
  }
  return shape === 'on each hit of a window' ? own : 0;
}

/**
 * One node payoff as the dispatcher wants it, or null when it has no declared fx.
 * A payoff on a capped route carries its cap ({@link abilityNodeRouteCapMs}).
 */
function external(
  option: AbilityNodeOption,
  payoff: LineagePayoff,
  shape: AbilityFireShape,
  axis?: AmplifiedAxis,
): ExternalLineagePayoff | null {
  const fx = abilityNodeFx(option.lane, payoff.kind);
  if (!fx) return null;
  const capMs = abilityNodeRouteCapMs(option.lane, shape);
  // The payoff is cloned because the dispatcher mutates what it is handed (a
  // bleed rewrites `damagePerTick`, plating-stack stamps `perStackFraction`),
  // and the cache must survive the fight unchanged. The amplifier's axis rides
  // every firing's card-fx — per body, per hit, per pulse alike — so the client
  // scales or extends the lane's fx by it (design §22.7). The owner is the
  // ability's node, packet and cross alike: a ward it fires refreshes the one
  // ward that node owns instead of stacking a new one (design §22.12).
  return {
    key: option.id, fx, payoff: { ...payoff },
    owner: abilityNodeOwner(option.abilityId),
    ...(capMs > 0 ? { capMs } : {}),
    ...(axis ? { axis } : {}),
  };
}

/**
 * The owner key of everything an ability's node leaves standing on the player —
 * today its ward (`applyWard`'s `owner`). Per ABILITY, not per option: the packet
 * and the cross row are one node, and an ability offers one ward route at most.
 */
export function abilityNodeOwner(abilityId: string): string {
  return `abilityNode.${abilityId}`;
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
  // The amplifier moves the PACKET's route, so only the packet's firings carry
  // its axis; the cross row is a second offer at the cross scalar, unamplified.
  const add = (option: AbilityNodeOption, payoff: LineagePayoff, axis?: AmplifiedAxis): void => {
    const shape = abilityOfferFireShape(abilityId, option.lane) ?? 'on land';
    const entry = external(option, payoff, shape, axis);
    if (!entry) return;
    out.push({ lane: option.lane, shape, payoff: entry });
  };
  add(firing.option, firing.payoff, firing.axis);
  if (firing.cross) add(firing.cross.option, firing.cross.payoff);
  return out;
}

/** The payoffs of `entries` that fire on `shape`. */
function withShape(entries: readonly NodePayoff[], shape: AbilityFireShape): ExternalLineagePayoff[] {
  return entries.filter((entry) => entry.shape === shape).map((entry) => entry.payoff);
}

/**
 * Whether a node payoff lands on a BODY rather than on the player or the ability
 * itself (design §22.12). Not a list of its own: it is the very test the payoff
 * resolver dispatches on — `applyPayoff` hands a payoff to `applyOnTarget` exactly
 * when `payoffLandsOnTarget(kind)` — so a payoff kind can never be fired per body
 * here and resolved on the player there. A self payoff fires once per resolution;
 * a body payoff once per body.
 */
function landsOnBody(entry: ExternalLineagePayoff): boolean {
  return payoffLandsOnTarget(entry.payoff.kind);
}

/** A fresh clone of each payoff: the dispatcher mutates what it is handed. */
function cloned(payoffs: readonly ExternalLineagePayoff[]): ExternalLineagePayoff[] {
  return payoffs.map((entry) => ({ ...entry, payoff: { ...entry.payoff } }));
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
 * "On land" is the resolution's own body: the exchange's, the cast's target, or —
 * for a backward reposition, which strikes nothing — `departedFrom`, the body it
 * broke from (Disengage: "on the body you broke from"). Charge's row also reads
 * "on the first body the rush touches": the rush has no contact seam (a player
 * moves through monster bodies, colliding only with terrain), so Charge fires on
 * its target on arrival alone — the landing blow's exchange.
 *
 * Called from `onTechniqueResolved`, never directly.
 */
export function onAbilityNodeTechniqueLanded(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  site: { ctx?: CombatContext; target?: MonsterEntity; departedFrom?: MonsterEntity } = {},
): void {
  if (ability.slot !== 'technique') return;
  const payoffs = payoffsFor(player, ability.id);
  if (payoffs.length === 0) return;

  const now = payoffs.filter((entry) => !NOT_AT_RESOLUTION.has(entry.shape)).map((entry) => entry.payoff);
  const onKill = withShape(payoffs, 'on the kill');

  if (now.length > 0) {
    const land = site.ctx || site.target || !site.departedFrom
      ? { ctx: site.ctx, target: site.target }
      : { target: site.departedFrom };
    fireLineagePayoffs(world, player, now, land);
  }
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
 * Only a BODY payoff fires per body. A self payoff (a cooldown refund, a window:
 * {@link landsOnBody}) fires ONCE for the whole area (design §22.12), on the
 * exchange's own body when the exchange is among the bodies, else on the first
 * — a Slam over four bodies refunds its cooldown once, never four times over.
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
  const perBody = payoffs.filter(landsOnBody);
  const seen = new Set<string>();
  const unique = bodies.filter((body) => {
    if (seen.has(body.isMonster.id)) return false;
    seen.add(body.isMonster.id);
    return true;
  });
  const isOwn = (body: MonsterEntity): boolean =>
    exchange?.defenderType === 'monster' && exchange.defender === body;
  // The one body the self payoffs ride: the exchange's own, else the first.
  const selfBody = unique.find(isOwn) ?? unique[0];
  for (const body of unique) {
    const now = body === selfBody ? payoffs : perBody;
    if (now.length === 0) continue;
    // Each body is its own application: a fresh clone per body.
    fireLineagePayoffs(world, player, cloned(now), isOwn(body) ? { ctx: exchange, target: body } : { target: body });
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
  'per tick while active',
  'on strip',
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
 * A Guard just STRIPPED afflictions off the player — Cleanse (design §22.10: "on
 * strip, sized by what it removed"). The size is a count of firings, never a new
 * number: a BODY payoff fires once per affliction KIND removed. A self payoff —
 * every Guard offer is one (a ward, a window, a plating stack) — fires once per
 * strip (design §22.12: once per resolution), so a Cleanse that removed three
 * kinds raises one ward, not three. A strip that removed nothing fires nothing —
 * Cleanse only casts with something harmful on the player, but a partial-only
 * effect can leave the strip empty.
 *
 * Called from the Guard firing that did the strip (`maybeFireGuard`), right after
 * `onGuardFired`.
 */
export function onAbilityNodeStripped(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  removed: readonly { effectId: string }[],
): void {
  if (ability.slot !== 'guard') return;
  const kinds = new Set(removed.map((entry) => entry.effectId)).size;
  if (kinds === 0) return;
  const payoffs = withShape(payoffsFor(player, ability.id), 'on strip');
  if (payoffs.length === 0) return;
  const perKind = payoffs.filter(landsOnBody);
  for (let i = 0; i < kinds; i++) {
    const now = i === 0 ? payoffs : perKind;
    if (now.length === 0) break;
    fireLineagePayoffs(world, player, cloned(now));
  }
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
 * Guard per call, each payoff under its route's cap. `target` is whatever the
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
    // The table and the window first: this runs on every incoming hit, so nothing
    // is resolved for a Guard whose row says otherwise or whose window is down. (A
    // Guard is never kill-tagged, so every route of it shares its row's shape.)
    if (ABILITY_FIRE_SHAPES.get(abilityId)?.fire !== shape) continue;
    const ability = ABILITY_DATABASE.get(abilityId);
    if (!ability || ability.slot !== 'guard' || !guardWindowUp(player, ability)) continue;
    const payoffs = withShape(payoffsFor(player, abilityId), shape);
    if (payoffs.length === 0) continue;
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

/** The cadence of a "per tick while active" Guard: the lineage `pulse` card's own. */
const PULSE_MS = lineageUnit('pulseMs');
/** The per-Guard pulse clock, a cooldown like a pulse card's `lineage.pulse.<card>`. */
const pulseCd = (abilityId: string): string => `abilityNode.pulse.${abilityId}`;

/**
 * "Per tick while active" (design §22.10: Endure "per tick while held",
 * Recuperate "per tick of the mend"): while the Guard's own window is up, its
 * node fires once per pulse — the first on the tick the window comes up, then
 * every `pulseMs` until it drops. No new clock: the lineage pulse's cadence,
 * counted by a cooldown exactly as `updateLineageCards` counts a pulse card's,
 * and each firing under its route's cap (design §22.12) — a cap longer than the
 * pulse sets the cadence.
 *
 * Run once per world tick from `World.tick`, beside `updateLineageCards`.
 */
export function updateAbilityNodePulses(world: World): void {
  for (const player of world.livePlayers) {
    const runtime = getAbilityNodeRuntime(player.tracksCombat);
    if (!runtime) continue;
    for (const abilityId of Object.keys(runtime)) {
      // The table first: most node holders own no pulse Guard, and this runs
      // every tick, so nothing is resolved for an ability whose row says otherwise.
      if (ABILITY_FIRE_SHAPES.get(abilityId)?.fire !== 'per tick while active') continue;
      const ability = ABILITY_DATABASE.get(abilityId);
      if (!ability || ability.slot !== 'guard' || !guardWindowUp(player, ability)) continue;
      const cs = player.tracksCombat;
      if (isCooldownActive(cs, pulseCd(abilityId))) continue;
      const payoffs = withShape(payoffsFor(player, abilityId), 'per tick while active');
      if (payoffs.length === 0) continue;
      // A pulse every route's cap would refuse WAITS for the cap rather than being
      // spent, so the cadence is the slower of the pulse and the cap — never a
      // pulse lost to a cap that opens a tick later (design §22.12).
      if (payoffs.every((entry) => (entry.capMs ?? 0) > 0 && isCooldownActive(cs, capCd(entry.key)))) continue;
      setCooldown(cs, pulseCd(abilityId), PULSE_MS);
      fireLineagePayoffs(world, player, payoffs);
    }
  }
}
