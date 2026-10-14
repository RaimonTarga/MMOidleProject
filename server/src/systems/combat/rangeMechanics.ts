/**
 * Range-node mechanics (progression rework Phase 3).
 *
 * Brief: `docs/briefs/frame-loops-2026-10-01.md` §2. Design authority:
 * `design_docs/progression-rework-design.md` §11 and §18.
 *
 * WHAT THIS IS. Players defaulted to Mid because Mid had no mechanic: it was
 * "even growth" against Close's defensive payoff and Far's kiting payoff. So
 * **Close keeps exactly what it had**, and every Mid and Far node (except the
 * Conduit's three, which already carry formation geometry) authors
 * `<root>.range-mid-*` / `<root>.range-far-*` keys on `rootsAndFrames.ts`, read
 * HERE and nowhere else.
 *
 * RANGE STAYS A LEAF (design §11). Nothing downstream — the T3 paths — reads a
 * range node, and the `isRangedCombatant` seam in
 * `rootsAndFrames.ts` is untouched. One module is the whole of it.
 *
 * THE AT-BAY LAYER (locked: slow only, no shove, no knockback). A target is
 * **at bay** when it is inside the player's reach and outside its own attack
 * range — the geometry of holding something off. The three roots that convert Mid
 * into control (Lancer, Phalanx, Enforcer) apply a short MOVEMENT slow on every
 * such hit: deterministic, no displacement, pathing untouched. Phalanx's
 * execution and Shade's discharge additionally stagger a target at bay, using the
 * existing stun ladder at its shortest rung. Nothing here moves an entity.
 *
 * THE RULES IT OBEYS.
 *
 *  1. **Evade blocks everything.** The listener early-returns on
 *     `evadeBlocksDebuffs(ctx)` before any mechanic resolves, so a dodged hit
 *     neither debuffs, spreads, nor spends Phantom-Blade's opener.
 *  2. **One multiplier per hit.** The two damage payoffs (Phantom-Blade's opener,
 *     Deadeye's long shot) scale `ctx.damage` and fold the same factor into
 *     `ctx.metadata.empoweredMultiplier`, exactly as `damage-window` does — never
 *     a second multiplicative layer for a Technique rider to miss.
 *  3. **Shared records, max-wins.** Sentinel's vulnerability goes through
 *     `applySharedDebuffMaxWins` (design §18.1): never a lower multiplier, never
 *     a shorter window than the cadence/card record already standing.
 *  4. **No constants.** Every magnitude, duration, radius and band fraction is
 *     authored on the node (design §18.4).
 *
 * NOT HERE: Wisp (`energy-range-far`). It authors `energy.range-far-single-target`
 * and the ENERGY FRAME LOOP owns the consumer — its chain-count resolution reads
 * the key and, when it is 1, chains to zero targets and folds the chained share
 * onto the primary. Procession and Harrier (`summoner-range-mid|far`) are
 * unchanged by design: the Conduit's range nodes already are their mechanic.
 */
import {
  getFlag,
  getStatusEffect,
  hitboxGap,
  posHitboxFromEntity,
  resolveDotClassProfile,
  setFlag,
  type PassiveMap,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../ecs/entity';
import type { World } from '../../world/World';
import {
  pushClientEffect,
  registerCombatListener,
  type CombatContext,
} from './engine/combatPipeline';
import { applyMonsterSlow } from './status/monsterControl';
import { applySharedDebuffMaxWins } from './status/sharedDebuffRecord';
import { applyStun } from './status/stun';
import { monsterIgnoresControl } from './status/controlImmunity';
import { evadeBlocksDebuffs } from '../defense/mitigation/evasion';
import { playerAoeTargets } from './damage/aoeDamage';
import { applyClassDotStack } from '../classes/archetypes/dot/dotPrototype';
import { DOT_EFFECT_ID } from '../classes/archetypes/dot/t3/core/constants';

/**
 * `tracksCombat` flag on the MONSTER: Phantom-Blade's opener has been spent on
 * this body. On the monster rather than the player because "a fresh target" is a
 * property of the body, and monster combat state is ephemeral by construction
 * (node freeze destroys it), so a respawn is a fresh target with no bookkeeping —
 * the same shape `weapon.first-strike-mult` already uses for its own opener.
 */
const OPENER_SPENT_FLAG = 'rangeFarOpenerSpent';

/**
 * `data` marker on the class DoT record: Harbinger's stack-cap bonus is already
 * folded into this effect's `maxStacks`. `applyStatusEffect` never rewrites
 * `maxStacks` on a refresh and never clears `data`, so one bump per record is
 * exactly one bump per fill — and the marker disappears with the effect, which is
 * when a fresh record should get its own bump.
 */
const STACK_CAP_BUMPED = 'rangeFarCapBumped';

/** Reused crimson opener burst — the opening strike is visibly an opening strike. */
const OPENER_CLIENT_EFFECT = 'first-strike';

// ── The band ─────────────────────────────────────────────────────────────────

/** Edge-to-edge gap, the same measure `collision.canReach` gates an attack on. */
function gapBetween(player: PlayerEntity, target: MonsterEntity): number {
  return hitboxGap(posHitboxFromEntity(player), posHitboxFromEntity(target));
}

/**
 * Is `target` held AT BAY by `player`?
 *
 * `gap <= player reach && gap > target reach`, edge-to-edge, where `gap` is
 * `hitboxGap` — deliberately the same measure `inAttackRange` (and therefore
 * `collision.canReach`, and therefore the attack gate in `combat.ts`) uses, so
 * "inside your reach" here means exactly what it means when the engine decides
 * the swing lands.
 *
 * The strict `>` on the target's side is what makes the band a band: a monster
 * that has closed to its own standoff (`attackRange - MELEE_CONTACT_MARGIN` at
 * worst) is NOT at bay, because it can hit back. A monster still walking in, one
 * being kited, or anything a long-reach build simply outranges, IS.
 *
 * Degenerate reaches: a player with no reach (`<= 0`, or non-finite) holds
 * nothing off and the band is empty. A target whose own `attackRange` is absent,
 * zero or non-finite is treated as reach 0, so it is at bay at any gap above
 * contact and never while the hitboxes touch — a body with no reach at all still
 * threatens what it is standing on.
 */
export function isAtBay(player: PlayerEntity, target: MonsterEntity): boolean {
  const reach = player.performsAttack.attackRange;
  if (!Number.isFinite(reach) || reach <= 0) return false;
  const gap = gapBetween(player, target);
  if (gap > reach) return false;
  const theirs = target.performsAttack.attackRange;
  return gap > (Number.isFinite(theirs) ? Math.max(0, theirs) : 0);
}

/**
 * Did this hit land from the OUTER `frac` of the player's reach?
 *
 * `reach * frac <= gap <= reach`. Inclusive at both ends: a hit at exactly the
 * limit of reach is the archetypal long shot, and a build whose whole reach is
 * short should still be able to reach its own outer band.
 */
function isFromMaxReach(player: PlayerEntity, target: MonsterEntity, frac: number): boolean {
  const reach = player.performsAttack.attackRange;
  if (!Number.isFinite(reach) || reach <= 0) return false;
  if (!Number.isFinite(frac) || frac <= 0) return false;
  const gap = gapBetween(player, target);
  return gap <= reach && gap >= reach * frac;
}

// ── Payoffs ──────────────────────────────────────────────────────────────────

/**
 * Scale this hit and record the factor on `empoweredMultiplier`.
 *
 * ONE MULTIPLIER PER HIT: a Technique rider and every share-of-the-hit payoff
 * read `empoweredMultiplier` to recover the pre-multiplier basis, so a mechanic
 * that multiplies the hit without recording itself there is silently scaled twice
 * downstream.
 */
function amplify(ctx: CombatContext, bonus: number): void {
  if (bonus <= 0) return;
  ctx.damage = Math.floor(ctx.damage * (1 + bonus));
  ctx.metadata['empoweredMultiplier'] =
    Number(ctx.metadata['empoweredMultiplier'] ?? 1) * (1 + bonus);
}

/** The at-bay movement slow — Lancer, Phalanx and Enforcer, and nothing else. */
function applyAtBaySlow(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  passives: PassiveMap,
): void {
  // Three keys, one layer: exactly one root's range node can ever be unlocked, so
  // these are read as "whichever root authored it" rather than summed. A sum would
  // silently stack if a future source ever granted two.
  const pct = Math.max(
    passives['cadence.range-mid-at-bay-slow-pct'] ?? 0,
    passives['cooldown.range-mid-at-bay-slow-pct'] ?? 0,
    passives['reload.range-mid-at-bay-slow-pct'] ?? 0,
  );
  if (pct <= 0) return;
  const ms = Math.max(
    passives['cadence.range-mid-at-bay-slow-ms'] ?? 0,
    passives['cooldown.range-mid-at-bay-slow-ms'] ?? 0,
    passives['reload.range-mid-at-bay-slow-ms'] ?? 0,
  );
  if (ms <= 0) return;
  // `applyMonsterSlow` owns the record (and stores `totalMs` for the buff clock).
  // Refreshed by every hit on purpose: the slow is maintained for as long as the
  // player keeps the target out there, and lapses on its own once they stop.
  applyMonsterSlow(world, target, pct, ms, player.isPlayer.id);
}

/**
 * Phalanx's execution and Shade's discharge stagger a target at bay.
 *
 * Both ride `empoweredAttack`, which the archetype's own empowered-multiplier
 * handler sets when it consumed the charge — the same gate `mechanic-fired` uses,
 * so "the execution landed" and "the discharge landed" mean here exactly what
 * they mean to the rest of the runtime. The duration is the stun ladder's
 * shortest rung, authored on the node.
 */
function applyAtBayStagger(
  ctx: CombatContext,
  player: PlayerEntity,
  target: MonsterEntity,
  passives: PassiveMap,
): void {
  if (!ctx.metadata['mechanicConsumed']) return; // the mechanic spent its charge (review P1)
  const ms = Math.max(
    player.usesCooldown ? passives['cooldown.range-mid-execution-stagger-ms'] ?? 0 : 0,
    player.usesEnergy ? passives['energy.range-mid-discharge-stagger-ms'] ?? 0 : 0,
  );
  if (ms <= 0) return;
  // A control-immune or plated boss refuses it outright rather than showing a
  // stun its pattern then ignores.
  if (monsterIgnoresControl(target)) return;
  applyStun(target.tracksCombat, ms, player.isPlayer.id);
}

/**
 * Warlock: a class stack landed on a target at bay also lands on its nearest
 * neighbour.
 *
 * Gated on the target actually CARRYING this player's class DoT, so the spread
 * follows a stack rather than merely a hit — whether the root handler or a T3
 * path applied it, they all write the one `dot` record. Routed through
 * `applyClassDotStack`, the same seam Sweep's secondary targets use, so the
 * spread can never drift into a parallel DoT of its own.
 *
 * Suppressed outright by Harbinger (brief §2: "+1 max stack on a single target,
 * stacks last longer, **no spread**"). The two are mutually exclusive range picks,
 * so this only matters if something ever grants both — and then Far wins, because
 * single-target is the whole of what Far bought.
 */
function spreadClassDot(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  passives: PassiveMap,
): void {
  if ((passives['dot.range-far-stack-cap-bonus'] ?? 0) > 0) return;
  const stacks = Math.round(passives['dot.range-mid-spread-stacks'] ?? 0);
  const radius = passives['dot.range-mid-spread-radius'] ?? 0;
  if (stacks <= 0 || radius <= 0) return;

  const carried = getStatusEffect(target.tracksCombat, DOT_EFFECT_ID);
  if (!carried || carried.sourceId !== player.isPlayer.id) return;

  const origin = target.hasPosition.current;
  let nearest: MonsterEntity | undefined;
  let nearestSq = Infinity;
  for (const monster of playerAoeTargets(world, player, origin, radius, target.isMonster.id)) {
    if (monster.hasHealth.hp <= 0) continue;
    const dx = monster.hasPosition.current.x - origin.x;
    const dy = monster.hasPosition.current.y - origin.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < nearestSq) {
      nearestSq = distSq;
      nearest = monster;
    }
  }
  if (!nearest) return;
  for (let i = 0; i < stacks; i++) applyClassDotStack(world, player, nearest);
}

/**
 * Harbinger: the class DoT holds one more stack and each application lasts longer
 * on the body it is on.
 *
 * The DELIVERY cap, not the damage reference: `computeDotClassDamagePerStack`
 * still divides by the frame's own max stacks (the same split
 * `resolveDotStackCap` documents), so the extra stack is extra damage rather than
 * a thinner one — which is what "a single target, harder" has to mean.
 *
 * Both writes are IDEMPOTENT. The cap is bumped once per record, latched in the
 * effect's own `data`. The duration is set to an absolute `base × (1 + pct)`
 * floor rather than multiplied in place, because a refresh resets `remainingMs`
 * to the base and a hit that did not refresh would otherwise ratchet the window
 * upward forever.
 */
function deepenClassDot(player: PlayerEntity, target: MonsterEntity, passives: PassiveMap): void {
  const capBonus = Math.round(passives['dot.range-far-stack-cap-bonus'] ?? 0);
  const durationPct = passives['dot.range-far-duration-pct'] ?? 0;
  if (capBonus <= 0 && durationPct <= 0) return;

  const effect = getStatusEffect(target.tracksCombat, DOT_EFFECT_ID);
  if (!effect || effect.sourceId !== player.isPlayer.id) return;

  if (capBonus > 0 && effect.maxStacks > 0 && effect.data[STACK_CAP_BUMPED] !== 1) {
    effect.maxStacks += capBonus;
    effect.data[STACK_CAP_BUMPED] = 1;
  }
  if (durationPct > 0 && effect.remainingMs > 0) {
    const profile = resolveDotClassProfile(passives, player.usesSkills.selectedSubVariant);
    const extended = Math.round(profile.durationMs * (1 + durationPct));
    effect.remainingMs = Math.max(effect.remainingMs, extended);
  }
}

/** Phantom-Blade: the first hit on a fresh body, from the outer band of reach. */
function applyOpeningStrike(
  ctx: CombatContext,
  player: PlayerEntity,
  target: MonsterEntity,
  passives: PassiveMap,
): void {
  const bonus = passives['cadence.range-far-opener-pct'] ?? 0;
  if (bonus <= 0) return;
  if (getFlag(target.tracksCombat, OPENER_SPENT_FLAG)) return;
  if (!isFromMaxReach(player, target, passives['cadence.range-far-max-reach-pct'] ?? 0)) return;
  setFlag(target.tracksCombat, OPENER_SPENT_FLAG, true);
  amplify(ctx, bonus);
  pushClientEffect(ctx, OPENER_CLIENT_EFFECT);
}

/** Sentinel: an execution from the outer band opens a vulnerability window. */
function applyReachVulnerability(
  ctx: CombatContext,
  player: PlayerEntity,
  target: MonsterEntity,
  passives: PassiveMap,
): void {
  if (!ctx.metadata['mechanicConsumed']) return; // the mechanic spent its charge (review P1)
  if (!player.usesCooldown) return;
  const pct = passives['cooldown.range-far-vuln-pct'] ?? 0;
  const ms = passives['cooldown.range-far-vuln-ms'] ?? 0;
  if (pct <= 0 || ms <= 0) return;
  if (!isFromMaxReach(player, target, passives['cooldown.range-far-max-reach-pct'] ?? 0)) return;
  // The same `vulnerability` record `applyMonsterDamageTakenDebuffs` multiplies
  // incoming damage by, under the §18.1 max-wins rule — never a weaker brand than
  // a finisher's or a card's, never a shorter window than the one already running.
  applySharedDebuffMaxWins(player, target.tracksCombat, {
    id: 'vulnerability',
    maxStacks: 1,
    refreshable: true,
    remainingMs: ms,
    sourceId: player.isPlayer.id,
    data: { totalMs: ms, damageMultiplier: 1 + pct },
  }, ['damageMultiplier', 'totalMs']);
}

/** Deadeye: shots landed from the outer band of range hit harder. */
function applyLongShot(
  ctx: CombatContext,
  player: PlayerEntity,
  target: MonsterEntity,
  passives: PassiveMap,
): void {
  const bonus = passives['reload.range-far-damage-pct'] ?? 0;
  if (bonus <= 0) return;
  if (!isFromMaxReach(player, target, passives['reload.range-far-max-reach-pct'] ?? 0)) return;
  amplify(ctx, bonus);
}

// ── Registration ─────────────────────────────────────────────────────────────

/**
 * ONE `onHit` listener for the whole feature, registered from
 * `initCombatSystems()` — the only place a combat listener may be registered, so
 * the live server and every bench see the same mechanics.
 *
 * Position in the chain is load-bearing in two directions:
 *  - AFTER `initAllMechanics()`, so `empoweredAttack` is already set by the
 *    archetype that consumed its charge (Phalanx, Shade, Sentinel all gate on it)
 *    and the class DoT stack this hit applied is already on the target (Warlock
 *    and Harbinger both read that record);
 *  - BEFORE `initDefenseSystems()`, so the two damage payoffs land ahead of
 *    evasion, the damage cap and shields, like every other outgoing multiplier.
 */
export function initRangeMechanics(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const player = ctx.attacker;
    const passives = player.usesSkills.passives;
    // A player with no range node pays one property read per hit.
    if (!hasRangeMechanic(passives)) return;
    // Every on-target effect early-returns on a blocking evade, like every other
    // on-hit applier in the codebase. The damage payoffs and the opener latch go
    // with them: a dodged hit must not spend Phantom-Blade's one opener.
    if (evadeBlocksDebuffs(ctx)) return;
    const target = ctx.defender;
    if (target.hasHealth.hp <= 0) return;

    if (isAtBay(player, target)) {
      applyAtBaySlow(world, player, target, passives);
      applyAtBayStagger(ctx, player, target, passives);
      spreadClassDot(world, player, target, passives);
    }

    deepenClassDot(player, target, passives);
    applyOpeningStrike(ctx, player, target, passives);
    applyReachVulnerability(ctx, player, target, passives);
    applyLongShot(ctx, player, target, passives);
  });
}

/**
 * Does this player carry ANY range-node mechanic? The hit seam runs for every
 * player on every hit, so the common case — no range node taken, or a Close node,
 * or the Conduit — exits before anything is computed.
 */
function hasRangeMechanic(passives: PassiveMap): boolean {
  return (
    (passives['cadence.range-mid-at-bay-slow-pct'] ?? 0) > 0 ||
    (passives['cooldown.range-mid-at-bay-slow-pct'] ?? 0) > 0 ||
    (passives['reload.range-mid-at-bay-slow-pct'] ?? 0) > 0 ||
    (passives['energy.range-mid-discharge-stagger-ms'] ?? 0) > 0 ||
    (passives['dot.range-mid-spread-stacks'] ?? 0) > 0 ||
    (passives['cadence.range-far-opener-pct'] ?? 0) > 0 ||
    (passives['cooldown.range-far-vuln-pct'] ?? 0) > 0 ||
    (passives['dot.range-far-stack-cap-bonus'] ?? 0) > 0 ||
    (passives['dot.range-far-duration-pct'] ?? 0) > 0 ||
    (passives['reload.range-far-damage-pct'] ?? 0) > 0
  );
}
