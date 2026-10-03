/**
 * The lineage card runtime (progression rework Phase 1c).
 *
 * Plan: `docs/progression-rework-plan.md` §1.3 and the "Phase 1c contract"
 * section. Design authority: `design_docs/progression-rework-design.md` §6–§8,
 * §24.2.
 *
 * WHAT THIS IS. A lineage card is data over a closed vocabulary: thirteen trigger
 * kinds and twenty-three payoff kinds (design §6, widened by §22's Technique
 * packet and §24.2's lean-and-verb halves). This file is the whole of that
 * vocabulary's implementation — ONE listener per trigger kind, ONE dispatch per
 * payoff kind, every payoff routed to a hook that already existed. Adding a card
 * adds no code here, and a card that would need code is a design bug the card
 * changes to answer.
 *
 * A T1 VERB (design §24.2) arrives here already composed: `resolveLineageCards`
 * gave it its lane's moment and its lean's payload at recalc, so the runtime
 * sees an ordinary trigger and payoff and knows nothing of halves.
 *
 * THE FOUR RULES IT ENFORCES.
 *
 *  1. **Resolve once, at recalc.** `resolveActiveLineages` walks every tree the
 *     player has opened and re-reads the magnitude table for each active card.
 *     Nothing about that answer can change between recalcs, so it is cached on
 *     `TracksCombat` through {@link setLineageRuntime} and read per hit.
 *
 *  2. **One multiplier per hit.** `damage-window`, `big-hit`, the load of
 *     `heal-and-load` and `mechanic-proxy` fold themselves into
 *     `ctx.metadata.empoweredMultiplier` — the same number a Technique rider
 *     reads — instead of adding a second multiplicative layer.
 *
 *  3. **Evade blocks the on-target ones.** Every payoff that lands on a monster
 *     early-returns on `evadeBlocksDebuffs(ctx)`, like every other on-hit
 *     applier in the codebase.
 *
 *  4. **Synergy buys reliability, never rate** (§24.2). A moment with a `capMs`
 *     pays at most once per cap per card, enforced once, in {@link fire}.
 *
 * AND ONE VISIBLE THING PER CARD. Design §8: "every card the player buys adds one
 * thing they can see in combat." So every successful application pushes EXACTLY
 * ONE `card-fx` — never per tick, never for a stat row (whose cosmetic is the
 * weapon trail, derived client-side from `PlayerView.lineages`).
 */
import {
  ABILITY_ROOT_EFFECT_ID,
  applyStatusEffect,
  payoffLandsOnTarget,
  type StatusEffect,
  type StatusEffectConfig,
  defensiveFaceForSubVariant,
  getCooldown,
  getCounter,
  getFlag,
  getLineageRuntime,
  getResource,
  getStatusEffect,
  isCooldownActive,
  lineageStatusEffectId,
  resolveActiveLineages,
  resolveDotClassProfile,
  lineageUnit,
  setCooldown,
  setCounter,
  setFlag,
  setLineageRuntime,
  setResource,
  PACKET_DEFINITIONS,
  type BuffId,
  type LineageFxKey,
  type LineagePayoff,
  type LineageTrigger,
  type PacketId,
  type PayoffKind,
  type TracksCombat,
  type TriggerKind,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../ecs/entity';
import type { World } from '../../world/World';
import { attachMarker } from '../../ecs/markerHelpers';
import { registerCombatListener, type CombatContext } from './engine/combatPipeline';
import { registerMechanicFiredListener } from './engine/mechanicFired';
import { applyPlayerDebuff, playerDebuffConfig } from '../classes/shared/applyPlayerDebuff';
import { LINEAGE_BLEED_ID, LINEAGE_POISON_ID } from './damage/bleedIds';
import { applyPlayerProcDamage } from './damage/procDamage';
import { applyMonsterRoot, applyMonsterSlow, monsterIsHeld } from './status/monsterControl';
import { applyMechanicProxy } from './engine/empoweredAttacks';
import { playerOnHitDamage } from './engine/onHitDamage';
import { applyHealToPlayer } from '../defense/regen/healing';
import { actorFromPlayer } from '../../world/worldLogActors';
import { applySharedDebuffMaxWins } from './status/sharedDebuffRecord';
import { applyStun } from './status/stun';
import { monsterIgnoresControl } from './status/controlImmunity';
import { evadeBlocksDebuffs, evadeMitigationOf } from '../defense/mitigation/evasion';
import { applyWardPercent } from '../defense/barrier/wards';
import { activateRecovery } from '../defense/regen/recovery';
import { isPlayerActivelyInCombat } from './ai/engagement';
import { playerDotsOnMonster } from './damage/dotInventory';
import { playerAoeTargets } from './damage/aoeDamage';
import { copyPlayerDotOnto } from '../player/abilities/abilityAffliction';
import { cleansePlayerAfflictions } from './status/cleanse';
import { defineBuff } from './buffs/descriptor';
import { registerKeystones, runChain } from './keystones';
import { abilityCooldownKey } from '../player/abilities/abilityCooldowns';

// ── Authored units ───────────────────────────────────────────────────────────
//
// Cadences, reaches and counts come from `LINEAGE_UNITS` in `magnitudes.ts`
// (design §18.4). They used to be named constants here, which put them out of
// the designer's reach; the runtime now reads the authored table and keeps no
// numbers of its own.

const STANDING_MS = lineageUnit('standingMs');
const PULSE_MS = lineageUnit('pulseMs');
const CONTAGION_RADIUS = lineageUnit('contagionRadius');
const CONTAGION_TARGETS = lineageUnit('contagionTargets');
const BLEED_TICK_MS = lineageUnit('bleedTickMs');
const CLEANSE_DEBUFFS = lineageUnit('cleanseDebuffs');
const CLEANSE_STACKS = lineageUnit('cleanseStacks');
const ENGAGEMENT_IDLE_MS = lineageUnit('engagementIdleMs');

// ── TracksCombat keys ────────────────────────────────────────────────────────

const ENGAGEMENT_CD = 'lineage.engagement';
const STANDING_MS_KEY = 'lineage.standingMs';
/**
 * Set once a standing payout has been spent, cleared the moment the player moves.
 * Phrased as SPENT rather than ARMED because a flag that has never been written
 * reads false, and "not yet spent" is the state a fresh player should be in.
 */
const STANDING_SPENT = 'lineage.standingSpent';
const nthCounter = (key: string): string => `lineage.nth.${key}`;
const firstHitFlag = (key: string): string => `lineage.first.${key}`;
const pulseCd = (key: string): string => `lineage.pulse.${key}`;
const standingCd = (key: string): string => `lineage.stand.${key}`;
/** A moment's rate cap (design §24.2), per card: one landed firing per `capMs`. */
const capCd = (key: string): string => `lineage.cap.${key}`;
/** `kill` with `carry`: armed by a kill, spent by the next landed hit. */
const carryFlag = (key: string): string => `lineage.carry.${key}`;
/**
 * `hit-afflicted` reads whether the target was afflicted BEFORE this hit — "a
 * target you have ALREADY afflicted" — so the class DoT this very hit lays down
 * does not count. Probed in `beforeAttack` and carried on the exchange.
 */
const AFFLICTED_BEFORE = 'lineageAfflictedBefore';
/** `hit-held`'s twin of {@link AFFLICTED_BEFORE}: was the target held before this hit? */
const HELD_BEFORE = 'lineageHeldBefore';

// ── The resolved-card cache ──────────────────────────────────────────────────

/**
 * Re-resolve the player's lineage cards. Called from
 * `recalculatePlayerEntityStats`, which is the one place the inputs
 * (`holdsInventory.lineages`, `equipment`, the frame's sub-variant) can change.
 */
export function refreshLineageRuntime(player: PlayerEntity): void {
  const resolved = resolveActiveLineages(
    player.holdsInventory,
    defensiveFaceForSubVariant(player.usesSkills.selectedSubVariant),
  );
  setLineageRuntime(player.tracksCombat, {
    cards: resolved.cards,
    capstones: resolved.capstones,
  });
}

/** One thing a card (or a worn form's capstone) does, when its trigger fires. */
interface LineageFiring {
  /** Card or capstone id — the per-card counter/flag key. */
  key: string;
  fx: LineageFxKey;
  trigger: LineageTrigger;
  payoff: LineagePayoff;
  /**
   * `first-hit` only: latch this per BODY instead of per engagement, from a
   * `trigger`-axis amplifier naming the trigger its payoff already fires on.
   */
  perTarget?: boolean;
  /**
   * A composed T1 verb (design §24.2). Its `technique-refund` payload refunds THE
   * Technique that landed at the technique moment, where a legacy card refunds
   * every attuned Technique.
   */
  composed?: boolean;
}

/**
 * Everything on this player that fires on `kind`, cards and worn capstone alike.
 *
 * A capstone is a card without a row (design §5), so it goes through exactly the
 * same dispatch and pushes the same event with its own `fx`.
 */
function firingsFor(player: PlayerEntity, kind: TriggerKind): LineageFiring[] {
  const runtime = getLineageRuntime(player.tracksCombat);
  if (!runtime) return [];
  const out: LineageFiring[] = [];
  for (const resolved of runtime.cards) {
    if (!resolved.trigger || !resolved.payoff) continue; // a stat row fires on nothing
    // A KEYSTONE ROW IS NOT A PAYOFF (design §4: it changes a rule). Its authored
    // trigger/payoff pair exists because `coverage.test.ts` requires every
    // non-stat row to do something the moment it is bought, and what a keystone
    // does is handed to `systems/combat/keystones/` instead — which reads the
    // card's resolved magnitude as the rule's share. Firing it here as well would
    // pay the lane twice for one card.
    if (resolved.card.row === 'keystone') continue;
    // An amplifier on the `trigger` axis adds further moments the SAME payoff
    // fires on (`composeAmplifiers`). Matching any one of them — never more than
    // one per dispatch, since a dispatch is a single trigger kind — is what makes
    // the player proc ONE effect from two moments rather than own two effects.
    const moment = resolved.trigger.kind === kind
      ? resolved.trigger
      : resolved.extraTriggers?.find((t) => t.kind === kind);
    if (!moment) continue;
    out.push({
      key: resolved.card.id,
      // A composed verb pushes its PAYLOAD's fx (design §24.2: a payload owns its
      // effect), not the verb card's own key.
      fx: resolved.payoffFx ?? resolved.card.fx,
      trigger: moment,
      payoff: resolved.payoff,
      perTarget: resolved.perTargetTrigger,
      composed: resolved.composition !== undefined,
    });
  }
  for (const worn of runtime.capstones) {
    if (worn.trigger.kind !== kind) continue;
    out.push({
      key: worn.capstone.id,
      fx: worn.capstone.fx,
      trigger: worn.trigger,
      payoff: worn.payoff,
    });
  }
  return out;
}

/** Cheap pre-check so a player with no tree pays nothing per hit. */
function hasLineageRuntime(player: PlayerEntity): boolean {
  return getLineageRuntime(player.tracksCombat) !== undefined;
}

// ── Where a payoff lands and what it scales off ──────────────────────────────

/** The monster a payoff should land on, from the exchange or the live target. */
function targetFor(
  world: World,
  player: PlayerEntity,
  ctx?: CombatContext,
): MonsterEntity | undefined {
  if (ctx && ctx.defenderType === 'monster') return ctx.defender;
  const targetId = player.hasAttackTarget?.targetId;
  const monster = targetId ? world.getMonsterEntity(targetId) : undefined;
  return monster && monster.hasHealth.hp > 0 ? monster : undefined;
}

/**
 * The damage a share-of-the-hit payoff takes its cut from.
 *
 * ONE MULTIPLIER PER HIT. A card riding an empowered hit scales the hit as it was
 * BEFORE the empowered multiplier, exactly like a Technique rider — otherwise the
 * card's share is multiplied twice and a finisher build gets a second, silent
 * scaling of everything hung off it. With no exchange at all (a reload, a summon
 * command) the basis is the player's Attack, which is what the magnitude table's
 * flat column is seeded against.
 */
function hitBasis(player: PlayerEntity, ctx?: CombatContext): number {
  if (!ctx) return Math.max(1, Math.round(player.dealsDamage.attack));
  const empowered = Number(ctx.metadata['empoweredMultiplier'] ?? 1);
  const base = empowered > 1 ? ctx.damage / empowered : ctx.damage;
  return Math.max(1, Math.round(base));
}

/**
 * The on-hit an echo carries: the exchange's own resolved on-hit when there is
 * one (imbues and formation weights included), else the weapon's flat on-hit. On
 * the echo it goes through the proc seam with the rest of the hit, so it skips
 * plating and pays half DR like the echo does.
 */
function echoOnHit(player: PlayerEntity, ctx?: CombatContext): number {
  const onHit = ctx ? playerOnHitDamage(ctx) : player.dealsDamage.onHitDamage;
  return Math.max(0, onHit);
}

/**
 * Write the lineage bleed (`LINEAGE_BLEED_ID`, its own id per design §18.1) as
 * `ticks` ticks of `perTick`. Ordinary refresh: this application's numbers win.
 * A caller that must ADD to what is already ticking (`redose`) folds the old
 * remainder into `perTick` itself.
 */
function writeLineageBleed(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  perTick: number,
  ticks: number,
): void {
  const tickMs = BLEED_TICK_MS;
  const bleed = applyPlayerDebuff(player, target.tracksCombat, {
    id: LINEAGE_BLEED_ID,
    instanced: false,
    remainingMs: -1,
    sourceId: player.isPlayer.id,
    data: {
      damagePerTick: perTick, nextTickIn: tickMs, tickIntervalMs: tickMs,
      bleedMode: 0,
    },
  });
  bleed.data.damagePerTick = perTick;
  bleed.data.tickIntervalMs = tickMs;
  bleed.data.bleedMode = 0;
  if (!(bleed.data.nextTickIn > 0)) bleed.data.nextTickIn = tickMs;
  bleed.stacks = ticks;
  attachMarker(world, target, 'hasHemorrhage');
}

// ── The payoff dispatch ──────────────────────────────────────────────────────

interface PayoffSite {
  world: World;
  player: PlayerEntity;
  /** The exchange, when the trigger rode one. */
  ctx?: CombatContext;
  /** The monster, when the trigger had one. */
  target?: MonsterEntity;
  /** `technique-cast` only: the Technique that resolved. */
  abilityId?: string;
}

/**
 * The exchange a hit-shaped payoff (`big-hit`, `mechanic-proxy`, the load of
 * `heal-and-load`) acts on: a player's hit on a monster that is still standing.
 *
 * A moment with no exchange (a reload completing, a cast Technique, a Guard) has
 * no hit to multiply, so those payoffs do nothing there rather than invent one.
 * A chaotic miss deals no direct damage, so multiplying it would draw an effect
 * for nothing.
 */
function liveExchange(world: World, ctx: CombatContext | undefined): ctx is CombatContext & {
  attackerType: 'player'; defenderType: 'monster'; attacker: PlayerEntity; defender: MonsterEntity;
} {
  if (!ctx || ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return false;
  if (ctx.metadata['chaoticMiss']) return false;
  return ctx.defender.hasHealth.hp > 0 && world.hasMonster(ctx.defender.isMonster.id);
}

/**
 * Multiply the hit in flight, folded into `ctx.metadata.empoweredMultiplier` —
 * exactly as `damage-window` does. ONE multiplier per hit (design §6): a lunge,
 * a loaded hit and a mechanic's own multiplier share one record, so a Technique
 * rider or a share-of-the-hit payoff dividing by it sees one honest number.
 */
function foldHitMultiplier(ctx: CombatContext, multiplier: number): void {
  ctx.damage = Math.floor(ctx.damage * multiplier);
  ctx.metadata['empoweredMultiplier'] = Number(ctx.metadata['empoweredMultiplier'] ?? 1) * multiplier;
}

/**
 * Apply one payoff. Returns the `card-fx` this application earned, or null when
 * nothing happened — a refused payoff must not draw an effect that says it did.
 */
function applyPayoff(site: PayoffSite, firing: LineageFiring): CardFxDraft | null {
  const { world, player, ctx } = site;
  const { kind, magnitude, durationMs } = firing.payoff;
  const sourceId = player.isPlayer.id;

  if (payoffLandsOnTarget(kind)) {
    // Every on-target applier early-returns on a blocking evade, like every other
    // on-hit applier in the codebase (CLAUDE.md, "Combat And Mechanics").
    if (ctx && evadeBlocksDebuffs(ctx)) return null;
    const target = site.target;
    if (!target) return null;
    // `contagion` reads the DoTs its target CARRIES and applies only to live
    // neighbours, which it filters itself — so a corpse is a valid source, and a
    // kill-triggered spread is the whole point of the payoff. Every other
    // on-target payoff needs something alive to land on.
    if (kind !== 'contagion' && target.hasHealth.hp <= 0) return null;
    const drawn = applyOnTarget(site, firing, target);
    // CHAIN (design §4, the Tempo keystone): the echo keeps re-triggering until a
    // hit misses or no fresh body is in reach. Once per APPLICATION and from the
    // primary body only — the amplified neighbours below are the same payoff
    // landing wider, not several echoes each entitled to their own chain. It
    // takes the same pre-empowered basis the echo did, so one multiplier per hit
    // still holds. Each link pushes its own `card-fx`.
    if (drawn && kind === 'echo-hit') runChain(world, player, target, hitBasis(player, ctx));
    // An amplifier on the `targets` axis lands the SAME payoff on nearby bodies
    // (`composeAmplifiers`). Only once the primary actually landed: a payoff the
    // target refused must not quietly succeed on its neighbour instead.
    //
    // `contagion` is excluded because it already chooses its own victims from what
    // the primary carries, so letting this spread it too would double-spread it.
    //
    // The reach is CONTAGION_RADIUS, deliberately the same authored unit rather
    // than a second one: "how far a lineage payoff reaches to a neighbour" is one
    // lever, and design §18.4 wants it to have exactly one home.
    const extra = Math.max(0, Math.round(firing.payoff.extraTargets ?? 0));
    if (drawn && extra > 0 && kind !== 'contagion') {
      const neighbours = playerAoeTargets(
        world, player, target.hasPosition.current, CONTAGION_RADIUS, target.isMonster.id,
      )
        .filter((monster) => monster.hasHealth.hp > 0)
        .slice(0, extra);
      for (const neighbour of neighbours) applyOnTarget(site, firing, neighbour);
    }
    return drawn;
  }

  switch (kind) {
    case 'damage-window':
    case 'engagement-dr':
      // Both are read back by a listener below rather than written into a stat:
      // the window IS the status effect, so the HUD clock and the mechanic can
      // never disagree about how long it has left.
      applyTimedSelf(player.tracksCombat, kind, magnitude, durationMs, sourceId);
      return { fx: firing.fx };

    case 'speed-window':
      // Read by `attackHasteBonus` — the one seam every temporary haste goes
      // through, so the stat sheet and the cadence gate see the same number.
      applyTimedSelf(player.tracksCombat, kind, magnitude, durationMs, sourceId);
      return { fx: firing.fx };

    case 'evasion-window':
      // Applied through the evasion stat the way `speed-window` touches attack
      // speed: read by `registerEvasion`'s onAttack listener in
      // `defense/mitigation/evasion.ts`, which rolls it as a SECOND, independent
      // deterministic dodge accumulator rather than folding it into
      // `evadesHits.charge` — so an avoid-faced card does something even for a
      // player who has not also stacked the `evasion` stat (design §6, added
      // 2026-10-01: "so the avoid face has a real effect").
      applyTimedSelf(player.tracksCombat, kind, magnitude, durationMs, sourceId);
      return { fx: firing.fx };

    case 'recovery-window':
      // Recovery is one rate with many switches: a card ACTIVATES a fraction of
      // it for a window, it never invents a heal of its own.
      if (durationMs === undefined || durationMs <= 0) return null;
      activateRecovery(player.tracksCombat, 'lineage', magnitude, durationMs);
      applyTimedSelf(player.tracksCombat, kind, magnitude, durationMs, sourceId);
      return { fx: firing.fx };

    case 'ward':
      applyWardPercent(world, player, magnitude, durationMs ?? 0);
      applyTimedSelf(player.tracksCombat, kind, magnitude, durationMs, sourceId);
      return { fx: firing.fx };

    case 'plating-stack': {
      // The card carries its FRACTION, not a resolved flat value.
      // `mitigatesDamage.plating` already includes whatever reactive plating has
      // added in place, so resolving here read this card's own output back and
      // compounded on every refresh — and `standing` refreshes on a 1500 ms
      // clock. `reactivePlating` owns that bookkeeping, so it owns the
      // multiplication too, against the plating with its own contribution
      // removed.
      const effect = applyTimedSelf(
        player.tracksCombat, kind, magnitude, durationMs, sourceId,
      );
      effect.data.perStackFraction = magnitude;
      return { fx: firing.fx, stacks: effect.stacks };
    }

    case 'cleanse': {
      const removed = cleansePlayerAfflictions(player, CLEANSE_STACKS, CLEANSE_DEBUFFS);
      if (removed.length === 0) return null;
      world.pushEvent(player.hasPosition.nodeId, {
        kind: 'player-cleansed',
        playerId: sourceId,
      });
      return { fx: firing.fx };
    }

    case 'technique-refund': {
      // The lane pays in READINESS, not in damage (design §22). A share off what
      // is LEFT of each Technique's cooldown rather than off its full length: it
      // is self-limiting (a nearly-ready Technique gains almost nothing, so the
      // payoff cannot bank value), it needs no ability lookup, and it is the one
      // reading under which an ability node's "landing this ability refunds part
      // of its own cooldown" is true — the cooldown that is running when the node
      // fires IS the ability's own.
      //
      // Nothing to refund means nothing happened, so no effect is drawn.
      //
      // A composed T1 verb at the Technique moment refunds THE Technique that
      // landed ("refunds a third of that Technique's cooldown", design §24.2); at
      // any other moment there is no "that" Technique, so it refunds every
      // attuned one, as a legacy card does.
      const only = firing.composed ? site.abilityId : undefined;
      const refunded = refundTechniqueCooldowns(player, magnitude, only);
      return refunded ? { fx: firing.fx } : null;
    }

    case 'big-hit': {
      // The triggering hit is multiplied — the Engagement lunge, Empowered's pure
      // "half again as hard". Folded into the one multiplier record.
      if (!liveExchange(world, ctx)) return null;
      if (!(magnitude > 0)) return null;
      foldHitMultiplier(ctx, magnitude);
      return { fx: firing.fx, targetId: ctx.defender.isMonster.id, targetPos: { ...ctx.defender.hasPosition.current } };
    }

    case 'mechanic-proxy': {
      // The hit COUNTS AS the class mechanic firing (design §24.2, rule 3): the
      // root's own empowered multiplier and `mechanicConsumed`, never
      // `mechanic-fired`, never a frame loop, never the root's pending charge.
      // `magnitude` is only the fallback for a root with no multiplier mechanic.
      if (!liveExchange(world, ctx)) return null;
      if (applyMechanicProxy(world, ctx, magnitude) <= 0) return null;
      return { fx: firing.fx, targetId: ctx.defender.isMonster.id, targetPos: { ...ctx.defender.hasPosition.current } };
    }

    case 'heal-and-load': {
      // A tenth of the pool back, through the one heal funnel (antiheal, the
      // overheal ward, the heal log), and the hit in flight lands loaded. With no
      // exchange to load (a Technique that resolved without one), only the heal.
      if (player.hasHealth.hp <= 0) return null;
      const heal = Math.round(player.hasHealth.maxHp * Math.max(0, magnitude));
      const loaded = (firing.payoff.loadMultiplier ?? 1) > 1 && liveExchange(world, ctx);
      if (heal <= 0 && !loaded) return null;
      if (heal > 0) applyHealToPlayer(player, player.tracksCombat, heal, world, actorFromPlayer(player));
      if (loaded && ctx) foldHitMultiplier(ctx, firing.payoff.loadMultiplier ?? 1);
      return { fx: firing.fx };
    }

    case 'technique-window':
      // The window itself is the status effect, exactly as `damage-window`'s is,
      // so the HUD clock and the mechanic can never disagree about how long it
      // has left. It is SPENT by the next Technique that resolves on an exchange
      // — see `consumeTechniqueWindow` — and folds into
      // `ctx.metadata.empoweredMultiplier` there, never as a second layer.
      applyTimedSelf(player.tracksCombat, kind, magnitude, durationMs, sourceId);
      return { fx: firing.fx };

    default:
      return null;
  }
}

function applyOnTarget(
  site: PayoffSite,
  firing: LineageFiring,
  target: MonsterEntity,
): CardFxDraft | null {
  const { world, player, ctx } = site;
  const { kind, magnitude, durationMs } = firing.payoff;
  const sourceId = player.isPlayer.id;
  const landed: CardFxDraft = {
    fx: firing.fx,
    targetId: target.isMonster.id,
    targetPos: { ...target.hasPosition.current },
  };

  switch (kind) {
    case 'vulnerability':
      // The cadence debuff seam, and the same effect id `applyMonsterDamageTakenDebuffs`
      // already multiplies incoming damage by. Shared record, max-wins (design
      // §18.1): a card never weakens a finisher's brand and never stacks on top
      // of it.
      applySharedDebuffMaxWins(player, target.tracksCombat, {
        id: 'vulnerability',
        maxStacks: 1,
        refreshable: true,
        remainingMs: durationMs ?? 0,
        sourceId,
        data: { totalMs: durationMs ?? 0, damageMultiplier: 1 + magnitude },
      }, ['damageMultiplier', 'totalMs']);
      return landed;

    case 'plating-shred': {
      // A FRACTION of the target's plating, resolved to the flat reduction
      // `effectivePlatingAfterShred` subtracts. Resolved against the plating it
      // has now, so shredding a heavily armoured monster is worth more — which is
      // the point of a percentage.
      const reduction = Math.max(1, Math.round(target.mitigatesDamage.plating * magnitude));
      // Shared record, max-wins (design §18.1). The cadence finisher's strip is
      // PERMANENT and multi-stack; a timed single-stack card must not shorten it
      // to its own window or drop its stack count.
      //
      // AND THE RECORD IS READ AS stacks × platingReduction (`effectivePlatingAfterShred`
      // subtracts that product, and the target-frame tile prints it), so the card's
      // fraction — which resolves to the WHOLE strip it promises — is divided across
      // the stacks the shared record carries. Written straight in, it was multiplied
      // by the finisher's three-stack brand and stripped three times what it
      // authored. Max-wins is therefore settled in TOTALS here: comparing a total
      // against a per-stack value is not a comparison.
      const config: StatusEffectConfig = {
        id: 'plating-shred',
        maxStacks: 1,
        refreshable: true,
        remainingMs: durationMs ?? 0,
        sourceId,
        data: { totalMs: durationMs ?? 0, platingReduction: reduction },
      };
      const prior = getStatusEffect(target.tracksCombat, 'plating-shred');
      const priorPerStack = prior?.data['platingReduction'] ?? 0;
      const priorTotal = (prior?.stacks ?? 0) * priorPerStack;
      // The core-scaled total the card promises. `playerDebuffConfig` is the same
      // scaling step the applier runs internally; read here because the comparison
      // needs the scaled figure and the applier only returns the merged one.
      const cardTotal = Number(
        playerDebuffConfig(player, config).data?.['platingReduction'] ?? reduction,
      );
      const effect = applySharedDebuffMaxWins(player, target.tracksCombat, config, ['totalMs']);
      effect.data['platingReduction'] = cardTotal > priorTotal
        ? cardTotal / Math.max(1, effect.stacks)
        : priorPerStack;
      return landed;
    }

    case 'echo-hit': {
      // A second, non-empowered hit through the proc seam, which owns
      // invulnerability, the world log, kill credit and rewards. Procs skip
      // plating and pay half DR by design (`mitigatePlayerTickOnMonster`).
      //
      // AND IT CARRIES ON-HIT (design §24.2: "the second hit is a proc — skips
      // plating, pays half DR, carries on-hit"). The proc seam adds no on-hit of
      // its own, and `ctx.damage` at `onHit` does not include it yet (on-hit is
      // added after the onHit listeners), so the echo's share is taken of the hit
      // PLUS the weapon's on-hit: a whole echo is a whole second swing.
      const basis = hitBasis(player, ctx) + echoOnHit(player, ctx);
      const damage = Math.max(1, Math.round(basis * magnitude));
      const outcome = applyPlayerProcDamage(world, player, target, damage, {
        tags: ['lineage', firing.key],
      });
      if (outcome === 'skipped') return null;
      // CHAIN is NOT started here. This function runs once per body an amplified
      // payoff touches, so chaining from it gave a `targets`-amplified echo one
      // full chain PER body — several times the authored ceiling, with each
      // chain's own `struck` set letting them re-hit each other's targets.
      // `applyPayoff` starts the one chain, on the primary body.
      return landed;
    }

    case 'hemorrhage': {
      // Its OWN id (design §18.1), ticked by the same bleed driver as the cadence
      // root's. Sharing `cadence-hemorrhage` meant the first source owned the
      // per-tick damage, and the "take the better of both" guard against that was
      // a ratchet: one big hit's bleed maintained forever by chip hits. Ordinary
      // refresh — this application's numbers win, the window restarts.
      const ticks = Math.max(1, Math.round((durationMs ?? BLEED_TICK_MS) / BLEED_TICK_MS));
      const perTick = Math.max(1, Math.round(hitBasis(player, ctx) * magnitude / ticks));
      writeLineageBleed(world, player, target, perTick, ticks);
      return landed;
    }

    case 'redose': {
      // Affliction's pure pair (design §24.2): "hitting an afflicted target
      // doubles its affliction". Contagion's copier cannot do it — copying a DoT
      // onto the body that already carries it merges to the same stacks — so this
      // ADDS `magnitude` × what every one of this player's DoTs on the target
      // still owes (the DoT inventory's own estimate, every family counted) to the
      // lineage bleed, on top of whatever that bleed still had to tick.
      const owed = playerDotsOnMonster(world, player, target)
        .reduce((sum, entry) => sum + Math.max(0, entry.remainingDamage), 0);
      const extra = owed * Math.max(0, magnitude);
      if (!(extra >= 1)) return null;
      const prior = getStatusEffect(target.tracksCombat, LINEAGE_BLEED_ID);
      const priorTicks = prior && prior.data.bleedMode === 0 ? Math.max(0, prior.stacks) : 0;
      const priorOwed = priorTicks * Math.max(0, prior?.data.damagePerTick ?? 0);
      const ticks = Math.max(1, priorTicks, Math.round((durationMs ?? BLEED_TICK_MS) / BLEED_TICK_MS));
      const perTick = Math.max(1, Math.round((priorOwed + extra) / ticks));
      writeLineageBleed(world, player, target, perTick, ticks);
      return landed;
    }

    case 'root': {
      // Control's payload: the control ladder's root rung, through the one
      // function that owns it — a control-immune boss refuses it, and a refused
      // root must not draw an effect that says it landed.
      if (monsterIgnoresControl(target)) return null;
      applyMonsterRoot(world, target, durationMs ?? 0, sourceId);
      const root = getStatusEffect(target.tracksCombat, ABILITY_ROOT_EFFECT_ID);
      if (!root || root.remainingMs === 0) return null;
      return landed;
    }

    case 'poison-stack': {
      // Its OWN id (design §18.1) rather than a stack on the player's class DoT,
      // whose `damagePerStack` the first writer owned. Stacks are INTENSITY here —
      // they multiply the tick and expire with the timer — so repeated hits make
      // the poison harder, not merely longer. The cap and tick interval still come
      // from the player's own DoT profile, so a class that ticks faster poisons
      // faster.
      const profile = resolveDotClassProfile(
        player.usesSkills.passives,
        player.usesSkills.selectedSubVariant,
      );
      const damagePerStack = Math.max(1, Math.round(hitBasis(player, ctx) * magnitude));
      const poison = applyPlayerDebuff(player, target.tracksCombat, {
        id: LINEAGE_POISON_ID,
        instanced: false,
        maxStacks: profile.maxStacks,
        refreshable: true,
        remainingMs: durationMs ?? profile.durationMs,
        sourceId,
        data: {
          damagePerTick: damagePerStack,
          nextTickIn: profile.tickIntervalMs,
          tickIntervalMs: profile.tickIntervalMs,
          bleedMode: 1,
        },
      });
      poison.data.damagePerTick = damagePerStack;
      poison.data.tickIntervalMs = profile.tickIntervalMs;
      poison.data.bleedMode = 1;
      if (!(poison.data.nextTickIn > 0)) poison.data.nextTickIn = profile.tickIntervalMs;
      attachMarker(world, target, 'hasHemorrhage');
      return { ...landed, stacks: poison.stacks };
    }

    case 'slow':
      // The control ladder's bottom rung. `applyMonsterSlow` stores `totalMs`,
      // which the buff UI's clock needs.
      applyMonsterSlow(world, target, magnitude, durationMs ?? 0, sourceId);
      return landed;

    case 'stun':
      // Top of the ladder. A plated or control-immune boss refuses it outright
      // rather than showing a stun its pattern then ignores.
      if (monsterIgnoresControl(target)) return null;
      if (!applyStun(target.tracksCombat, durationMs ?? 0, sourceId)) return null;
      return landed;

    case 'contagion': {
      // Copy a SHARE of what this target carries onto its nearest neighbour,
      // through Contagion's own copier so a reservoir pool, a Permafrost ramp and
      // a stack count all transplant correctly.
      const entries = playerDotsOnMonster(world, player, target).filter((e) => e.spreadable);
      if (entries.length === 0) return null;
      const victims = playerAoeTargets(
        world, player, target.hasPosition.current, CONTAGION_RADIUS, target.isMonster.id,
      )
        .filter((monster) => monster.hasHealth.hp > 0)
        .slice(0, CONTAGION_TARGETS);
      if (victims.length === 0) return null;
      for (const victim of victims) {
        for (const entry of entries) copyPlayerDotOnto(world, player, victim, entry, magnitude);
      }
      return { ...landed, targetId: victims[0].isMonster.id, targetPos: { ...victims[0].hasPosition.current } };
    }

    default:
      return null;
  }
}

/**
 * Apply the `lineage.<payoff>` status effect a timed payoff is read back from.
 *
 * `data: { totalMs, magnitude }` is the whole contract: `totalMs` drives the
 * existing buff-bar clock and `magnitude` is what the reader multiplies by, so a
 * window needs no networked flag and no channel of its own.
 */
function applyTimedSelf(
  cs: TracksCombat,
  kind: PayoffKind,
  magnitude: number,
  durationMs: number | undefined,
  sourceId: string,
) {
  const totalMs = durationMs ?? 0;
  const effect = applyStatusEffect(cs, {
    id: lineageStatusEffectId(kind),
    maxStacks: 1,
    refreshable: true,
    remainingMs: totalMs,
    sourceId,
    data: { totalMs, magnitude },
  });
  // A refresh keeps the existing entry's `data`, so the live values are written
  // back — the stronger of the two wins rather than the most recent.
  effect.data.totalMs = totalMs;
  effect.data.magnitude = Math.max(effect.data.magnitude ?? 0, magnitude);
  return effect;
}

// ── The Technique lane's two payoffs (design §22) ────────────────────────────

/**
 * Take `share` off what is LEFT of every attuned Technique's cooldown. Returns
 * true when at least one cooldown actually moved, so a payoff that found nothing
 * running draws no effect claiming it did.
 *
 * Attuned rather than "every Technique the player knows": a cooldown that no
 * loadout can fire is not readiness, and the attuned pair is what the Rune board
 * is actually firing. The Tempo floor key (`abilityTempoFloorKey`) is deliberately
 * untouched — it answers "how far down may Tempo push the cooldown", which is a
 * different question from "how long until ready", and refunding it would let the
 * lane drive an ability past its own minimum cycle.
 */
function refundTechniqueCooldowns(player: PlayerEntity, share: number, onlyAbilityId?: string): boolean {
  const fraction = Math.min(1, Math.max(0, share));
  if (fraction <= 0) return false;
  const cs = player.tracksCombat;
  let refunded = false;
  const techniques = onlyAbilityId !== undefined
    ? [onlyAbilityId]
    : player.tracksProgression.attunedAbilities.techniques;
  for (const abilityId of techniques) {
    const key = abilityCooldownKey(abilityId);
    const remaining = getCooldown(cs, key);
    if (remaining <= 0) continue;
    setCooldown(cs, key, remaining * (1 - fraction));
    refunded = true;
  }
  return refunded;
}

/**
 * Spend a live `technique-window` on the Technique that is landing, folding it
 * into `ctx.metadata.empoweredMultiplier`.
 *
 * ONE MULTIPLIER PER HIT (design §6). This is the same fold `damage-window`'s
 * reader does, and for the same reason: a Technique rider recovers its
 * pre-multiplier basis by DIVIDING by `empoweredMultiplier`
 * (`abilityEffects.addEmpoweredDamage`), so writing the window there is what
 * makes the window and the rider ADD instead of compounding. A second metadata
 * key, or a bare `ctx.damage` scale, would compound.
 *
 * Consumed rather than held: design §22 says the window empowers "the next
 * Technique", so it closes on the first one that uses it. A Technique with no
 * exchange to ride (a self-cast, a cast payload) leaves the window standing —
 * there is no hit for it to empower, and silently eating it would be the worst
 * of both.
 *
 * Called from the one Technique resolution seam, `techniqueResolved.ts`.
 */
export function consumeTechniqueWindow(player: PlayerEntity, ctx: CombatContext): number {
  const cs = player.tracksCombat;
  const bonus = windowMagnitude(cs, 'technique-window');
  if (bonus <= 0) return 0;
  const effect = getStatusEffect(cs, lineageStatusEffectId('technique-window'));
  if (effect) {
    effect.remainingMs = 0;
    effect.data.magnitude = 0;
  }
  ctx.damage = Math.floor(ctx.damage * (1 + bonus));
  ctx.metadata['empoweredMultiplier'] =
    Number(ctx.metadata['empoweredMultiplier'] ?? 1) * (1 + bonus);
  return bonus;
}

// ── One card-fx per application ──────────────────────────────────────────────

interface CardFxDraft {
  fx: LineageFxKey;
  targetId?: string;
  targetPos?: { x: number; y: number };
  stacks?: number;
}

/**
 * Run every firing of one trigger kind and push exactly one `card-fx` per
 * application that actually did something.
 */
function fire(site: PayoffSite, firings: readonly LineageFiring[]): number {
  let applied = 0;
  const cs = site.player.tracksCombat;
  for (const firing of firings) {
    // THE RATE CAP (design §24.2 rule 2: synergy buys reliability, never rate).
    // A capped moment pays at most once per `capMs` per card. The clock starts
    // only when the payoff LANDED: a dodge or an immune boss leaves the moment
    // armed for the next hit rather than eating five seconds for nothing.
    const capMs = firing.trigger.capMs ?? 0;
    if (capMs > 0 && isCooldownActive(cs, capCd(firing.key))) continue;
    const drawn = applyPayoff(site, firing);
    if (!drawn) continue;
    if (capMs > 0) setCooldown(cs, capCd(firing.key), capMs);
    applied++;
    site.world.pushEvent(site.player.hasPosition.nodeId, {
      kind: 'card-fx',
      playerId: site.player.isPlayer.id,
      fx: drawn.fx,
      pos: { ...site.player.hasPosition.current },
      ...(drawn.targetId !== undefined ? { targetId: drawn.targetId } : {}),
      ...(drawn.targetPos !== undefined ? { targetPos: drawn.targetPos } : {}),
      ...(drawn.stacks !== undefined ? { stacks: drawn.stacks } : {}),
    });
  }
  return applied;
}

// ── Registration: one listener per trigger kind ──────────────────────────────

/**
 * Register the event-driven trigger listeners. Called from `initCombatSystems()`,
 * so the live server and the balance bench see an identical card runtime.
 *
 * Three trigger kinds are NOT listeners and so are not here: `guard-cast` and
 * `technique-cast` are called from their abilities' own resolution seams, and
 * `standing`/`pulse` answer to the clock in `updateLineageCards`.
 */
export function registerLineageCards(): void {
  registerHitNth();
  registerMechanicFired();
  registerFirstHit();
  registerKill();
  registerKillCarry();
  registerConditionProbes();
  registerHitAfflicted();
  registerHitHeld();
  registerEvade();
  registerWindowReaders();
  // The keystones (design §4, nine of them since §22's Technique packet).
  // Registered from here, with the rows they belong to, so the live server and the
  // balance bench can never see a different set of rules — the same reason every
  // other combat listener lives behind one bootstrap call.
  registerKeystones();
}

/**
 * The triggers that read what the DEFENSE stack did to an incoming hit, so they
 * must register AFTER `initDefenseSystems()` — see the ordering list in
 * `combatBootstrap.ts`.
 *
 * `hit-taken` needs `ctx.damage` to be what actually landed: registered with the
 * rest, it read the pre-mitigation figure and fired on hits that were fully
 * dodged or fully absorbed. `barrier-break` needs the `barrierEmptied` /
 * `wardBrokenMax` metadata that `defense/barrier/barrier.ts` sets from its own
 * `onDamageTaken` listener, so registered first it could never see a break at
 * all. (`evade` stays in the main pass: the evade clock decides in `onAttack` and
 * records both `metadata.evaded` and `metadata.evadeMitigation` there, so a full
 * avoid is already readable before any `onDamageTaken` listener runs — which is why
 * it tests the mitigation and not `evadeFull`, written later in the same phase.)
 */
export function registerLineageIncomingCards(): void {
  registerHitTaken();
  registerBarrierBreak();
}

/** `hit-nth` — every nth landed hit, counted per card. */
function registerHitNth(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const player = ctx.attacker;
    if (!hasLineageRuntime(player)) return;
    const firings = firingsFor(player, 'hit-nth');
    if (firings.length === 0) return;

    // Counted per card rather than per player: two cards on different intervals
    // must not share a clock, or the shorter one silently drives the longer.
    const due: LineageFiring[] = [];
    for (const firing of firings) {
      const n = Math.max(1, Math.round(firing.trigger.n ?? 1));
      const next = getCounter(player.tracksCombat, nthCounter(firing.key)) + 1;
      if (next >= n) {
        setCounter(player.tracksCombat, nthCounter(firing.key), 0);
        due.push(firing);
      } else {
        setCounter(player.tracksCombat, nthCounter(firing.key), next);
      }
    }
    if (due.length === 0) return;
    fire({ world, player, ctx, target: ctx.defender }, due);
  });
}

/** `mechanic-fired` — the class-agnostic root moment (`engine/mechanicFired.ts`). */
function registerMechanicFired(): void {
  registerMechanicFiredListener((world, player, ctx) => {
    if (!hasLineageRuntime(player)) return;
    const firings = firingsFor(player, 'mechanic-fired');
    if (firings.length === 0) return;
    fire({ world, player, ctx, target: targetFor(world, player, ctx) }, firings);
  });
}

/**
 * `first-hit` — the opening hit of an engagement.
 *
 * "Resets on engagement end", and an engagement ends when hits stop landing:
 * the cooldown below is refreshed by every hit, so it lapses only during a lull
 * and the next pull opens with a fresh window. A cooldown rather than a tick
 * because cooldowns already decay for every player, every tick.
 */
function registerFirstHit(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const player = ctx.attacker;
    if (!hasLineageRuntime(player)) return;
    const cs = player.tracksCombat;
    const fresh = !isCooldownActive(cs, ENGAGEMENT_CD);
    setCooldown(cs, ENGAGEMENT_CD, ENGAGEMENT_IDLE_MS);

    const firings = firingsFor(player, 'first-hit');
    if (firings.length === 0) return;
    if (fresh) {
      for (const firing of firings) {
        if (!firing.perTarget) setFlag(cs, firstHitFlag(firing.key), false);
      }
    }

    // A per-BODY firing latches on the MONSTER, not the player: that is what makes
    // "every new body counts as a fresh opening" true without an engagement reset,
    // and it costs nothing to clean up — node freeze/thaw takes the monster and its
    // flag with it, and nothing about a monster's combat state is persisted. Keyed
    // by player too, so two players' openers on one body are independent.
    const openerLatch = (firing: LineageFiring): { cs: TracksCombat; flag: string } =>
      firing.perTarget
        ? {
          cs: ctx.defender.tracksCombat,
          flag: firstHitFlag(`${firing.key}.${player.isPlayer.id}`),
        }
        : { cs, flag: firstHitFlag(firing.key) };

    const due = firings.filter((firing) => {
      const latch = openerLatch(firing);
      return !getFlag(latch.cs, latch.flag);
    });
    if (due.length === 0) return;
    for (const firing of due) {
      const latch = openerLatch(firing);
      setFlag(latch.cs, latch.flag, true);
    }
    fire({ world, player, ctx, target: ctx.defender }, due);
  });
}

/**
 * `kill` — the player put a monster down.
 *
 * A `carry` firing (design §24.2's Kill-chain moment, "your next hit after a
 * kill") does not pay here: the kill ARMS it and {@link registerKillCarry} pays it
 * on the next landed hit. One arming per card, so a multi-kill still pays once.
 */
function registerKill(): void {
  registerCombatListener('onKill', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const player = ctx.attacker;
    if (!hasLineageRuntime(player)) return;
    const firings = firingsFor(player, 'kill');
    if (firings.length === 0) return;
    const now: LineageFiring[] = [];
    for (const firing of firings) {
      if (firing.trigger.carry) setFlag(player.tracksCombat, carryFlag(firing.key), true);
      else now.push(firing);
    }
    if (now.length === 0) return;
    // The corpse is still in the world at onKill, so a payoff that spreads OFF it
    // (contagion) still has something to read.
    fire({ world, player, ctx, target: ctx.defender }, now);
  });
}

/**
 * The carried half of the Kill-chain moment: the next LANDED hit on a live body
 * after a kill pays every armed `carry` firing, once, on that hit's exchange — so
 * a loaded hit multiplies the hit in flight (design §24.2).
 *
 * A hit whose target a proc already killed inside this `onHit` (an echo that was
 * lethal, review finding B3) is not "the next hit": the carry stays armed. So
 * does a chaotic-miss whiff, which lands nothing. Spent whatever the payoff then
 * does — the moment is the hit, not the payoff's success.
 */
function registerKillCarry(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const player = ctx.attacker;
    if (!hasLineageRuntime(player)) return;
    const cs = player.tracksCombat;
    const armed = firingsFor(player, 'kill').filter(
      (firing) => firing.trigger.carry && getFlag(cs, carryFlag(firing.key)),
    );
    if (armed.length === 0) return;
    if (ctx.metadata['chaoticMiss']) return;
    if (ctx.defender.hasHealth.hp <= 0 || !world.hasMonster(ctx.defender.isMonster.id)) return;
    for (const firing of armed) setFlag(cs, carryFlag(firing.key), false);
    fire({ world, player, ctx, target: ctx.defender }, armed);
  });
}

/** True while a capped firing's clock is still running — it cannot pay. */
function capped(cs: TracksCombat, firing: LineageFiring): boolean {
  return (firing.trigger.capMs ?? 0) > 0 && isCooldownActive(cs, capCd(firing.key));
}

/** Does the monster carry any damage-over-time effect this player owns? */
function afflictedBy(world: World, player: PlayerEntity, monster: MonsterEntity): boolean {
  return playerDotsOnMonster(world, player, monster).length > 0;
}

/**
 * The two §24.2 condition moments read the target as it was BEFORE this hit, so
 * the class DoT or slow this very hit lays down does not satisfy them ("a target
 * you have ALREADY afflicted"). Probed in `beforeAttack` — only for a player with
 * an uncapped firing waiting on it, since the DoT inventory walk is the one real
 * cost — and read back in `onHit`. An exchange that never passed `beforeAttack`
 * (a seam that emits `onHit` directly) reads the target live instead.
 */
function registerConditionProbes(): void {
  registerCombatListener('beforeAttack', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const player = ctx.attacker;
    if (!hasLineageRuntime(player)) return;
    const cs = player.tracksCombat;
    if (firingsFor(player, 'hit-afflicted').some((firing) => !capped(cs, firing))) {
      ctx.metadata[AFFLICTED_BEFORE] = afflictedBy(world, player, ctx.defender);
    }
    if (firingsFor(player, 'hit-held').some((firing) => !capped(cs, firing))) {
      ctx.metadata[HELD_BEFORE] = monsterIsHeld(ctx.defender);
    }
  });
}

/**
 * `hit-afflicted` — a landed hit on a target that already carries one of this
 * player's DoTs (design §24.2, the Affliction moment). Rate-capped by its
 * packet's `capMs`, so a DoT class that satisfies it on every hit fires it at
 * the cap, reliably, and never faster.
 */
function registerHitAfflicted(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const player = ctx.attacker;
    if (!hasLineageRuntime(player)) return;
    const cs = player.tracksCombat;
    const due = firingsFor(player, 'hit-afflicted').filter((firing) => !capped(cs, firing));
    if (due.length === 0) return;
    const before = ctx.metadata[AFFLICTED_BEFORE];
    const afflicted = typeof before === 'boolean' ? before : afflictedBy(world, player, ctx.defender);
    if (!afflicted) return;
    fire({ world, player, ctx, target: ctx.defender }, due);
  });
}

/**
 * `hit-held` — a landed hit on a slowed or rooted target (design §24.2, the
 * Control moment). Rate-capped like `hit-afflicted`, which is also what stops a
 * root or stun payload from chaining off its own hold.
 */
function registerHitHeld(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const player = ctx.attacker;
    if (!hasLineageRuntime(player)) return;
    const cs = player.tracksCombat;
    const due = firingsFor(player, 'hit-held').filter((firing) => !capped(cs, firing));
    if (due.length === 0) return;
    const before = ctx.metadata[HELD_BEFORE];
    const held = typeof before === 'boolean' ? before : monsterIsHeld(ctx.defender);
    if (!held) return;
    fire({ world, player, ctx, target: ctx.defender }, due);
  });
}

/**
 * `evade` — the player AVOIDED an incoming hit.
 *
 * The player's dodge roll SUCCEEDED — not necessarily a full avoid.
 *
 * This deliberately differs from `evadeBlocksDebuffs`, which stays full-dodge-only
 * per the defense rule. Gating the card on `evadeMitigation >= 1` as well made every
 * `evade` card in the game inert: `EVADE_MITIGATION_BASE` is 0.5 and the best
 * authored mitigation sources add +0.1 and +0.3, so full avoidance is unreachable in
 * authored content and the trigger could never fire. A graze IS the dodge this game
 * ships — it halves the hit — so the card pays on the successful roll, and firing
 * alongside `hit-taken` is correct for it: a grazed hit did land.
 *
 * What it must still refuse is a hit where no roll succeeded at all, which is what
 * `metadata.evaded` carries.
 */
function registerEvade(): void {
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.metadata['evaded'] !== true || evadeMitigationOf(ctx) <= 0) return;
    const player = ctx.defender;
    if (!hasLineageRuntime(player)) return;
    const firings = firingsFor(player, 'evade');
    if (firings.length === 0) return;
    // The attacker is the monster here, so an on-target payoff answers whatever
    // just missed — which is the whole read of a counter-attack card.
    const target = ctx.attackerType === 'monster' ? ctx.attacker : undefined;
    fire({ world, player, target }, firings);
  });
}

/** `hit-taken` — the player took a direct hit that landed. */
function registerHitTaken(): void {
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.metadata['isDot']) return; // direct hits only, like reactive plating
    if (ctx.damage <= 0) return;
    const player = ctx.defender;
    if (!hasLineageRuntime(player)) return;
    const firings = firingsFor(player, 'hit-taken');
    if (firings.length === 0) return;
    const target = ctx.attackerType === 'monster' ? ctx.attacker : undefined;
    fire({ world, player, target }, firings);
  });
}

/**
 * `barrier-break` — an absorb pool bottomed out.
 *
 * Reads the same `barrierEmptied` / `wardBrokenMax` metadata the barrier-break
 * heal does, so "broke" means exactly one thing across the defense stack.
 */
function registerBarrierBreak(): void {
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.defenderType !== 'player') return;
    const broke = ctx.metadata['barrierEmptied'] === true
      || ((ctx.metadata['wardBrokenMax'] as number) ?? 0) > 0;
    if (!broke) return;
    const player = ctx.defender;
    if (!hasLineageRuntime(player)) return;
    const firings = firingsFor(player, 'barrier-break');
    if (firings.length === 0) return;
    const target = ctx.attackerType === 'monster' ? ctx.attacker : undefined;
    fire({ world, player, target }, firings);
  });
}

/**
 * `guard-cast` — a self-facing Guard ability fired.
 *
 * Called from `onGuardFired`, the existing charm-hook seam every Guard already
 * passes through, rather than from a listener of its own: a Guard is not an
 * attack and has no combat context to ride.
 */
export function onLineageGuardCast(world: World, player: PlayerEntity): void {
  if (!hasLineageRuntime(player)) return;
  const firings = firingsFor(player, 'guard-cast');
  if (firings.length === 0) return;
  fire({ world, player, target: targetFor(world, player) }, firings);
}

/**
 * `technique-cast` — a Technique resolved (design §22).
 *
 * Called from `onTechniqueResolved` in `combat/techniqueResolved.ts`, the one
 * seam every Technique shape's resolution passes through, rather than from a
 * listener: an armed Technique rides an `onHit`, a cast resolves on a timer and a
 * reposition resolves the moment it fires, so there is no single combat event to
 * listen for. That seam is also what keeps this to ONE firing per cast and to
 * Techniques alone — a Guard has `guard-cast`, and an offensive lane must never
 * fire off a defensive one.
 */
export function onLineageTechniqueCast(
  world: World,
  player: PlayerEntity,
  /** `abilityId`: the Technique that resolved, for a composed verb's refund. */
  site: { ctx?: CombatContext; target?: MonsterEntity; abilityId?: string } = {},
): void {
  if (!hasLineageRuntime(player)) return;
  const firings = firingsFor(player, 'technique-cast');
  if (firings.length === 0) return;
  const target = site.target ?? targetFor(world, player, site.ctx);
  fire({ world, player, ctx: site.ctx, target, abilityId: site.abilityId }, firings);
}

// ── The dispatcher, for payoff sources that are not lineage cards ────────────

/**
 * One payoff fired by something that is not a card: an ability node (design
 * §19), which hangs a lane's payoff off an ability rather than off a trigger.
 *
 * Exported so there is exactly ONE implementation of "apply a payoff and draw
 * one card-fx for it". Everything the card runtime guarantees comes with it for
 * free — the evade early-return on every on-target payoff, the max-wins shared
 * debuff records, `hitBasis`'s one-multiplier-per-hit rule, the amplified
 * `extraTargets` spread, and no effect drawn for a payoff that refused.
 */
export interface ExternalLineagePayoff {
  /** Per-source counter/flag key and proc tag. An option id, for a node. */
  key: string;
  fx: LineageFxKey;
  payoff: LineagePayoff;
}

/** Apply external payoffs. Returns how many actually did something. */
export function fireLineagePayoffs(
  world: World,
  player: PlayerEntity,
  payoffs: readonly ExternalLineagePayoff[],
  site: { ctx?: CombatContext; target?: MonsterEntity } = {},
): number {
  if (payoffs.length === 0) return 0;
  const target = site.target ?? targetFor(world, player, site.ctx);
  return fire(
    { world, player, ctx: site.ctx, target },
    payoffs.map((p) => ({
      key: p.key,
      fx: p.fx,
      // A `fire` dispatch never reads the trigger — only `registerHitNth` does,
      // and it builds its own. The kind that is true of an ability node is the
      // one the magnitude table already prices it at (see `resolve.ts`).
      trigger: { kind: 'guard-cast' as const },
      payoff: p.payoff,
    })),
  );
}

// ── The two clock-driven triggers ────────────────────────────────────────────

/**
 * `standing` and `pulse` — the two triggers that answer to time rather than to an
 * event. Run once per world tick from `World.tick`.
 *
 * `standing` pays out after {@link STANDING_MS} held still in combat and re-arms
 * only once the player has moved, so it is a positional decision and not a second
 * pulse. `pulse` pays out on a fixed cadence while the fight lasts.
 */
export function updateLineageCards(world: World, dt: number): void {
  for (const player of world.livePlayers) {
    if (!hasLineageRuntime(player)) continue;
    const standing = firingsFor(player, 'standing');
    const pulse = firingsFor(player, 'pulse');
    // Nothing clock-driven, nothing to do. Checked BEFORE the engagement read
    // because `isPlayerActivelyInCombat` scans every aggroed monster in the world
    // for a player with no live attack target — the one genuinely non-constant cost
    // in this pass, and one most players (no `standing`, no `pulse`) were paying
    // every tick for a loop body that then did nothing.
    if (standing.length === 0 && pulse.length === 0) continue;
    const cs = player.tracksCombat;
    const inCombat = isPlayerActivelyInCombat(world, player);

    if (standing.length > 0) {
      const moving = player.isMoving !== undefined;
      if (moving || !inCombat) {
        setResource(cs, STANDING_MS_KEY, 0);
        setFlag(cs, STANDING_SPENT, false);
      } else {
        const held = getResource(cs, STANDING_MS_KEY) + dt;
        setResource(cs, STANDING_MS_KEY, held);
        if (held >= STANDING_MS && !getFlag(cs, STANDING_SPENT)) {
          setFlag(cs, STANDING_SPENT, true);
          const due = standing.filter((f) => getCooldown(cs, standingCd(f.key)) <= 0);
          for (const firing of due) {
            setCooldown(cs, standingCd(firing.key), firing.payoff.durationMs ?? STANDING_MS);
          }
          if (due.length > 0) fire({ world, player, target: targetFor(world, player) }, due);
        }
      }
    }

    if (!inCombat || pulse.length === 0) continue;
    const due = pulse.filter((f) => !isCooldownActive(cs, pulseCd(f.key)));
    if (due.length === 0) continue;
    for (const firing of due) setCooldown(cs, pulseCd(firing.key), PULSE_MS);
    fire({ world, player, target: targetFor(world, player) }, due);
  }
}

// ── Window readers ───────────────────────────────────────────────────────────

/** The live magnitude of a timed self payoff, or 0 when its window is closed. */
function windowMagnitude(cs: TracksCombat, kind: PayoffKind): number {
  const effect = getStatusEffect(cs, lineageStatusEffectId(kind));
  if (!effect || effect.remainingMs <= 0) return 0;
  return Math.max(0, effect.data.magnitude ?? 0);
}

/**
 * Attack-speed contribution of a live `speed-window`, for `attackHasteBonus`.
 * Summed with Frenzy and the stance windows, because they are all "+X% attack
 * speed" promises and those add.
 */
export function lineageSpeedWindowBonus(cs: TracksCombat): number {
  return windowMagnitude(cs, 'speed-window');
}

/**
 * The FRACTION of base plating one reactive-plating stack is worth from a live
 * `plating-stack` window, for `runReactivePlating` to resolve. A fraction rather
 * than a flat value because the plating stat already carries reactive plating's
 * own contribution, so resolving it here compounded on every refresh.
 */
export function lineagePlatingStackFraction(cs: TracksCombat): number {
  const effect = getStatusEffect(cs, lineageStatusEffectId('plating-stack'));
  if (!effect || effect.remainingMs <= 0) return 0;
  return Math.max(0, effect.data.perStackFraction ?? 0);
}

/**
 * The two windows that act on a damage exchange.
 *
 * `damage-window` folds itself into `ctx.metadata.empoweredMultiplier` — ONE
 * multiplier per hit (design §6). It never writes a second multiplier key, so a
 * Technique rider reading `empoweredMultiplier` sees one honest number.
 *
 * `engagement-dr` is the mirror on the way in: a plain damage-taken multiplier,
 * the standard shape for opening protection.
 */
function registerWindowReaders(): void {
  registerCombatListener('onHit', (ctx) => {
    if (ctx.attackerType !== 'player') return;
    const player = ctx.attacker;
    if (!hasLineageRuntime(player)) return;
    const bonus = windowMagnitude(player.tracksCombat, 'damage-window');
    if (bonus <= 0) return;
    ctx.damage = Math.floor(ctx.damage * (1 + bonus));
    ctx.metadata['empoweredMultiplier'] =
      Number(ctx.metadata['empoweredMultiplier'] ?? 1) * (1 + bonus);
  });

  registerCombatListener('onDamageTaken', (ctx) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.metadata['isDot']) return;
    const player = ctx.defender;
    if (!hasLineageRuntime(player)) return;
    const dr = windowMagnitude(player.tracksCombat, 'engagement-dr');
    if (dr <= 0) return;
    ctx.damage = Math.max(0, ctx.damage * (1 - Math.min(0.75, dr)));
  });
}

// ── HUD ──────────────────────────────────────────────────────────────────────

/** Lane colour for a window's tile, so the clock reads as the lane it came from. */
const WINDOW_LANE: Partial<Record<PayoffKind, PacketId>> = {
  'damage-window': 'empowered',
  'speed-window': 'tempo',
  'recovery-window': 'engagement',
  'engagement-dr': 'engagement',
  'ward': 'bulwark',
  'plating-stack': 'bulwark',
  'technique-window': 'technique',
  // Every authored `evasion-window` CARD is on an avoid-faced tempo lane (17 of
  // them, across bindings/fleet/robe/stone/wraps); only two ability-node offers
  // put it on engagement. This map is keyed by payoff kind, not by the firing
  // card's lane, so it can only name one owner per payoff — `speed-window` has
  // the same imprecision already, sitting on tempo while the Axe's kill-chain
  // rows pay with it. Named for where the cards are.
  'evasion-window': 'tempo',
};

function windowColor(kind: PayoffKind): string {
  const lane = WINDOW_LANE[kind];
  const packet = lane ? PACKET_DEFINITIONS.get(lane) : undefined;
  return packet?.color ?? '#9fb4c7';
}

function defineWindowBuff<const Id extends BuffId>(
  kind: PayoffKind,
  id: Id,
  label: string,
  detail: string,
) {
  const color = windowColor(kind);
  return defineBuff(
    id,
    ({ playerCs }) => {
      if (!playerCs) return null;
      const effect = getStatusEffect(playerCs, lineageStatusEffectId(kind));
      if (!effect || effect.remainingMs <= 0) return null;
      const magnitude = Math.max(0, effect.data.magnitude ?? 0);
      if (magnitude <= 0) return null;
      const totalMs = effect.data.totalMs ?? effect.remainingMs;
      const pct = Math.round(magnitude * 100);
      return {
        id,
        label,
        stacks: effect.stacks,
        durationPct: totalMs > 0 ? (effect.remainingMs / totalMs) * 100 : -1,
        remainingMs: effect.remainingMs,
        color,
        logDetail: `${detail} +${pct}%`,
        values: [{ label: detail, value: `+${pct}%`, good: true }],
      };
    },
    { label, color, category: 'neutral' },
  );
}

/**
 * One tile per timed payoff, fed by the `lineage.<payoff>` effects above — the
 * existing buff-sync path, with no new channel (Phase 1c contract).
 */
export const LINEAGE_BUFFS = [
  defineWindowBuff('damage-window', 'lineage-damage', 'Surge', 'Damage'),
  defineWindowBuff('speed-window', 'lineage-speed', 'Wake', 'Attack speed'),
  defineWindowBuff('recovery-window', 'lineage-recovery', 'Mend', 'Recovery'),
  defineWindowBuff('engagement-dr', 'lineage-guard', 'Brace', 'Damage reduction'),
  defineWindowBuff('ward', 'lineage-ward', 'Shell', 'Absorb'),
  defineWindowBuff('plating-stack', 'lineage-plate', 'Plate', 'Plating per stack'),
  defineWindowBuff('technique-window', 'lineage-technique', 'Form', 'Next Technique'),
  defineWindowBuff('evasion-window', 'lineage-evasion', 'Slip', 'Evade chance'),
] as const;
