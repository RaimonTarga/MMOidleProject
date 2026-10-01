/**
 * The lineage card runtime (progression rework Phase 1c).
 *
 * Plan: `docs/progression-rework-plan.md` §1.3 and the "Phase 1c contract"
 * section. Design authority: `design_docs/progression-rework-design.md` §6–§8.
 *
 * WHAT THIS IS. A lineage card is data over a closed vocabulary: ten trigger
 * kinds and fifteen payoff kinds (design §6). This file is the whole of that
 * vocabulary's implementation — ONE listener per trigger kind, ONE dispatch per
 * payoff kind, every payoff routed to a hook that already existed. Adding a card
 * adds no code here, and a card that would need code is a design bug the card
 * changes to answer.
 *
 * THE THREE RULES IT ENFORCES.
 *
 *  1. **Resolve once, at recalc.** `resolveActiveLineages` walks every tree the
 *     player has opened and re-reads the magnitude table for each active card.
 *     Nothing about that answer can change between recalcs, so it is cached on
 *     `TracksCombat` through {@link setLineageRuntime} and read per hit.
 *
 *  2. **One multiplier per hit.** `damage-window` folds itself into
 *     `ctx.metadata.empoweredMultiplier` — the same number a Technique rider
 *     reads — instead of adding a second multiplicative layer.
 *
 *  3. **Evade blocks the on-target ones.** Every payoff that lands on a monster
 *     early-returns on `evadeBlocksDebuffs(ctx)`, like every other on-hit
 *     applier in the codebase.
 *
 * AND ONE VISIBLE THING PER CARD. Design §8: "every card the player buys adds one
 * thing they can see in combat." So every successful application pushes EXACTLY
 * ONE `card-fx` — never per tick, never for a stat row (whose cosmetic is the
 * weapon trail, derived client-side from `PlayerView.lineages`).
 */
import {
  applyStatusEffect,
  type StatusEffect,
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
import { applyPlayerDebuff } from '../classes/shared/applyPlayerDebuff';
import { LINEAGE_BLEED_ID, LINEAGE_POISON_ID } from './damage/bleedIds';
import { applyPlayerProcDamage } from './damage/procDamage';
import { applyMonsterSlow } from './status/monsterControl';
import { applySharedDebuffMaxWins } from './status/sharedDebuffRecord';
import { applyStun } from './status/stun';
import { monsterIgnoresControl } from './status/controlImmunity';
import { evadeBlocksDebuffs } from '../defense/mitigation/evasion';
import { applyWardPercent } from '../defense/barrier/wards';
import { activateRecovery } from '../defense/regen/recovery';
import { isPlayerActivelyInCombat } from './ai/engagement';
import { playerDotsOnMonster } from './damage/dotInventory';
import { playerAoeTargets } from './damage/aoeDamage';
import { copyPlayerDotOnto } from '../player/abilities/abilityAffliction';
import { cleansePlayerAfflictions } from './status/cleanse';
import { defineBuff } from './buffs/descriptor';

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
      fx: resolved.card.fx,
      trigger: moment,
      payoff: resolved.payoff,
      perTarget: resolved.perTargetTrigger,
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

// ── The payoff dispatch ──────────────────────────────────────────────────────

interface PayoffSite {
  world: World;
  player: PlayerEntity;
  /** The exchange, when the trigger rode one. */
  ctx?: CombatContext;
  /** The monster, when the trigger had one. */
  target?: MonsterEntity;
}

/** Payoffs that land on a monster — the ones evade blocks and that carry a target. */
const ON_TARGET: ReadonlySet<PayoffKind> = new Set<PayoffKind>([
  'vulnerability', 'plating-shred', 'echo-hit', 'hemorrhage', 'poison-stack',
  'slow', 'stun', 'contagion',
]);

/**
 * Apply one payoff. Returns the `card-fx` this application earned, or null when
 * nothing happened — a refused payoff must not draw an effect that says it did.
 */
function applyPayoff(site: PayoffSite, firing: LineageFiring): CardFxDraft | null {
  const { world, player, ctx } = site;
  const { kind, magnitude, durationMs } = firing.payoff;
  const sourceId = player.isPlayer.id;

  if (ON_TARGET.has(kind)) {
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
      applySharedDebuffMaxWins(player, target.tracksCombat, {
        id: 'plating-shred',
        maxStacks: 1,
        refreshable: true,
        remainingMs: durationMs ?? 0,
        sourceId,
        data: { totalMs: durationMs ?? 0, platingReduction: reduction },
      }, ['platingReduction', 'totalMs']);
      return landed;
    }

    case 'echo-hit': {
      // A second, non-empowered hit through the proc seam, which owns
      // invulnerability, the world log, kill credit and rewards. Procs skip
      // plating and pay half DR by design (`mitigatePlayerTickOnMonster`).
      const damage = Math.max(1, Math.round(hitBasis(player, ctx) * magnitude));
      const outcome = applyPlayerProcDamage(world, player, target, damage, {
        tags: ['lineage', firing.key],
      });
      return outcome === 'skipped' ? null : landed;
    }

    case 'hemorrhage': {
      // Its OWN id (design §18.1), ticked by the same bleed driver as the cadence
      // root's. Sharing `cadence-hemorrhage` meant the first source owned the
      // per-tick damage, and the "take the better of both" guard against that was
      // a ratchet: one big hit's bleed maintained forever by chip hits. Ordinary
      // refresh — this application's numbers win, the window restarts.
      const tickMs = BLEED_TICK_MS;
      const ticks = Math.max(1, Math.round((durationMs ?? tickMs) / tickMs));
      const perTick = Math.max(1, Math.round(hitBasis(player, ctx) * magnitude / ticks));
      const bleed = applyPlayerDebuff(player, target.tracksCombat, {
        id: LINEAGE_BLEED_ID,
        instanced: false,
        remainingMs: -1,
        sourceId,
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
  for (const firing of firings) {
    const drawn = applyPayoff(site, firing);
    if (!drawn) continue;
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
 * Register the ten trigger listeners. Called from `initCombatSystems()`, so the
 * live server and the balance bench see an identical card runtime.
 */
export function registerLineageCards(): void {
  registerHitNth();
  registerMechanicFired();
  registerFirstHit();
  registerKill();
  registerEvade();
  registerWindowReaders();
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
 * all. (`evade` stays in the main pass: the engine sets `metadata.evaded` in
 * `combat.ts` before any listener runs.)
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

/** `kill` — the player put a monster down. */
function registerKill(): void {
  registerCombatListener('onKill', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const player = ctx.attacker;
    if (!hasLineageRuntime(player)) return;
    const firings = firingsFor(player, 'kill');
    if (firings.length === 0) return;
    // The corpse is still in the world at onKill, so a payoff that spreads OFF it
    // (contagion) still has something to read.
    fire({ world, player, ctx, target: ctx.defender }, firings);
  });
}

/** `evade` — the player avoided an incoming hit. */
function registerEvade(): void {
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.metadata['evaded'] !== true) return;
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
    const cs = player.tracksCombat;
    const inCombat = isPlayerActivelyInCombat(world, player);

    const standing = firingsFor(player, 'standing');
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

    if (!inCombat) continue;
    const pulse = firingsFor(player, 'pulse');
    if (pulse.length === 0) continue;
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
] as const;
