/**
 * Conduit frame loops — and the root's `mechanic-fired` moment.
 *
 * Progression rework Phase 3; authored input `docs/briefs/frame-loops-2026-10-01.md`
 * §1, design authority `design_docs/progression-rework-design.md` §10.
 *
 * THE FORMATION CYCLE IS THE MOMENT. `emitMechanicFired` used to be called from
 * `applySummonerCommand` — a CLICK. A card hung off a click never fires for an idle
 * player, and idle play is the game, so the brief moved the root's moment to the
 * formation cycle: every living summon has hit the same target since the last fire.
 * That state already existed and was already authoritative (`prepareCycle` /
 * `commitCycle` in `formationAttack.ts`, surfaced as `ctx.formation.cycleCompleted`),
 * so this file only listens to it. A full dodge and a cancelled swing both return
 * before `onHit`, which is exactly when `commitCycle` declines to commit, so one
 * completed cycle is one emission.
 *
 *   Splinter (light, 6)  a completed cycle on one target opens a FRENZY window:
 *                        the swarm swings faster and delivers more on-hit magnitude.
 *   Consort (balanced, 5) NO LOOP. Still open with the designer; the frame keeps its
 *                        stat skew and this file deliberately does nothing for it.
 *   Effigy (heavy, 2)    each body BANKS charge per hit; when both bodies have hit
 *                        the same target inside a window the pair spends the bank as
 *                        one linked slam with a stagger.
 *
 * Parked by the brief, deliberately absent: Splinter bodies exploding on death
 * (Iconoclast owns that at T3) and the native-behaviour axis (Effigy holds aggro /
 * Splinter steps back).
 */
import {
  applyStatusEffect,
  getResource,
  getStatusEffect,
  removeStatusEffect,
  setResource,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { isMechanicProxy } from '../../../combat/engine/empoweredAttacks';
import { emitMechanicFired } from '../../../combat/engine/mechanicFired';
import { defineBuff, type BuffDescriptor } from '../../../combat/buffs/descriptor';
import { applyPlayerProcDamage } from '../../../combat/damage/procDamage';
import { applyStun } from '../../../combat/status/stun';
import { monsterIgnoresControl } from '../../../combat/status/controlImmunity';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';

/** Splinter's frenzy window. `frame.<root>.window`, per the Phase 3 HUD contract. */
export const SUMMONER_FRAME_WINDOW_EFFECT = 'frame.summoner.window';
/** Effigy's bank, a resource on `TracksCombat` so the buff sync can read it. */
export const SUMMONER_FRAME_LINK_RESOURCE = 'frame.summoner.link-charge';
/**
 * Effigy's pairing record, held on the TARGET. The id BASE — the record itself is
 * per owner, see {@link summonerFrameLinkEffectId}.
 *
 * `data.slotMask` is a bitmask of the formation slots that have struck this target
 * inside the window — `data` is `Record<string, number>` only, so a mask is how a set
 * of slots is stored without inventing a second channel. The effect's own
 * `remainingMs` IS the window, so it expires with the monster's status tick and needs
 * no bookkeeping of its own.
 */
export const SUMMONER_FRAME_LINK_EFFECT = 'frame.summoner.link';

/**
 * One pairing record PER OWNER on a body two Conduits are working.
 *
 * The record lives on the monster and the slot mask is indexed by formation slot, so
 * a single shared id made two Conduits one formation: each read the other's slot bits
 * as its own (closing a "pair" one body assembled alone), the slam's
 * `removeStatusEffect` wiped the other's progress, and `applyStatusEffect` moves
 * `sourceId` to the latest applier, so the slam's kill credit went to whoever banked
 * last. Keyed by owner, none of that crosses. Same reason the `first-hit` card's
 * per-body latch is keyed by player, and it costs nothing to clean up: node
 * freeze/thaw takes the monster and its effects with it.
 */
export function summonerFrameLinkEffectId(ownerId: string): string {
  return `${SUMMONER_FRAME_LINK_EFFECT}.${ownerId}`;
}

// ── Splinter: the frenzy window ──────────────────────────────────────────────

function frenzyWindowLive(owner: PlayerEntity): boolean {
  const window = getStatusEffect(owner.tracksCombat, SUMMONER_FRAME_WINDOW_EFFECT);
  return window !== undefined && window.remainingMs > 0;
}

/**
 * Attack-speed fraction the swarm is currently enjoying.
 *
 * Read by `syncLiveMinionFrameStats`, which re-derives every minion's cooldown from
 * the owner's every tick — so the window applies and lapses there with no separate
 * writer and nothing to un-apply.
 */
export function summonerFrenzyApsPct(owner: PlayerEntity): number {
  if (!frenzyWindowLive(owner)) return 0;
  return Math.max(0, owner.usesSkills.passives['summoner.frame-frenzy-aps-pct'] ?? 0);
}

function openFrenzyWindow(owner: PlayerEntity): void {
  const totalMs = Math.round(owner.usesSkills.passives['summoner.frame-frenzy-window-ms'] ?? 0);
  if (totalMs <= 0) return;
  applyStatusEffect(owner.tracksCombat, {
    id:          SUMMONER_FRAME_WINDOW_EFFECT,
    maxStacks:   1,
    remainingMs: totalMs,
    refreshable: true,
    sourceId:    owner.isPlayer.id,
    data:        { totalMs },
  });
}

// ── Effigy: the banked pair ──────────────────────────────────────────────────

/** Bits for every slot whose body is alive right now. */
function livingSlotMask(world: World, owner: PlayerEntity): number {
  const summons = owner.summonsMinions;
  if (!summons) return 0;
  let mask = 0;
  for (let index = 0; index < summons.targetCount; index++) {
    const id = summons.minionIds[index];
    const minion = id ? world.getMinionEntity(id) : undefined;
    if (minion && minion.hasHealth.hp > 0) mask |= 1 << index;
  }
  return mask;
}

function bitCount(mask: number): number {
  let n = 0;
  for (let bits = mask; bits !== 0; bits >>= 1) n += bits & 1;
  return n;
}

function syncLinkBank(world: World, owner: PlayerEntity, stacks: number): void {
  const previous = getResource(owner.tracksCombat, SUMMONER_FRAME_LINK_RESOURCE);
  if (previous === stacks) return;
  setResource(owner.tracksCombat, SUMMONER_FRAME_LINK_RESOURCE, stacks);
  world.pushEvent(owner.hasPosition.nodeId, {
    kind:     'frame-charge',
    playerId: owner.isPlayer.id,
    stacks,
    max:      Math.round(owner.usesSkills.passives['summoner.frame-link-max-charge'] ?? 0),
  });
}

/**
 * Bank this body's charge and, if the pair is now complete inside the window, spend
 * the bank as one linked slam.
 *
 * The slam is its own proc payload rather than a multiplier on the triggering swing:
 * it is the PAIR's payoff, not that body's hit, and folding it into the hit would
 * both misattribute it and spend the hit's one allowed multiplier.
 */
function bankAndMaybeSlam(
  world: World,
  owner: PlayerEntity,
  target: MonsterEntity,
  slotIndex: number,
  staggerAllowed: boolean,
): void {
  const passives = owner.usesSkills.passives;
  const windowMs = Math.round(passives['summoner.frame-link-window-ms'] ?? 0);
  const maxCharge = Math.max(0, Math.round(passives['summoner.frame-link-max-charge'] ?? 0));
  if (windowMs <= 0 || maxCharge <= 0) return;

  const perHit = passives['summoner.frame-link-charge-per-hit'] ?? 0;
  const banked = Math.min(
    maxCharge,
    getResource(owner.tracksCombat, SUMMONER_FRAME_LINK_RESOURCE) + perHit,
  );
  syncLinkBank(world, owner, banked);

  const linkId = summonerFrameLinkEffectId(owner.isPlayer.id);
  const link = applyStatusEffect(target.tracksCombat, {
    id:          linkId,
    maxStacks:   1,
    remainingMs: windowMs,
    refreshable: true,
    sourceId:    owner.isPlayer.id,
    data:        { slotMask: 0, totalMs: windowMs },
  });
  link.data['slotMask'] = (link.data['slotMask'] ?? 0) | (1 << slotIndex);
  link.data['totalMs'] = windowMs;

  const living = livingSlotMask(world, owner);
  const struck = link.data['slotMask'] ?? 0;
  // A pair needs two bodies. One body alive is not a pair, and firing on every one
  // of its hits would turn the loop into a flat damage stat.
  if (bitCount(living) < 2) return;
  if ((living & struck) !== living) return;

  const slamMult = passives['summoner.frame-link-slam-mult'] ?? 0;
  const slam = Math.floor(owner.dealsDamage.attack * banked * slamMult);
  removeStatusEffect(target.tracksCombat, linkId);
  syncLinkBank(world, owner, 0);
  if (slam > 0) {
    applyPlayerProcDamage(world, owner, target, slam, {
      tags:           ['summoner-frame-link'],
      empowered:      true,
      physicalSource: 'summon',
    });
  }

  const staggerMs = Math.round(passives['summoner.frame-link-stagger-ms'] ?? 0);
  if (staggerMs > 0 && staggerAllowed && !monsterIgnoresControl(target)) {
    applyStun(target.tracksCombat, staggerMs, owner.isPlayer.id);
  }
}

// ── Registration ─────────────────────────────────────────────────────────────

export function registerSummonerFrameLoop(): void {
  registerCombatListener('onHit', (ctx, world) => {
    // A `mechanic-proxy` hit (design §24.2) COUNTS AS the mechanic for what reads
    // it downstream, but it never walks the root's own loop (rule 3).
    if (isMechanicProxy(ctx)) return;
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;
    const formation = ctx.formation;
    if (!formation || formation.side !== 'summon') return;
    const owner = ctx.attacker;
    const summons = owner.summonsMinions;
    if (!summons) return;

    // Splinter: while the frenzy is live every body delivers more on-hit magnitude.
    // Scaled on the formation contribution, which `playerOnHitDamage` reads straight
    // after this phase. NOT folded into `empoweredMultiplier`: on-hit damage is a
    // separate source added after `ctx.damage`, so the one-multiplier-per-hit rule
    // is about the attack multiplier and this is not one.
    const onHitMult = owner.usesSkills.passives['summoner.frame-frenzy-onhit-mult'] ?? 0;
    if (onHitMult > 1 && frenzyWindowLive(owner)) {
      formation.onHitMagnitudeWeight *= onHitMult;
    }

    // Effigy: bank, then slam when the pair closes.
    const slotIndex = summons.slotIds.indexOf(formation.slotId);
    if (slotIndex >= 0) {
      bankAndMaybeSlam(world, owner, ctx.defender, slotIndex, !evadeBlocksDebuffs(ctx));
    }

    // The root's moment. Last, so a card reading the hit sees the frenzy and the
    // slam already resolved on it.
    if (formation.cycleCompleted) {
      openFrenzyWindow(owner);
      emitMechanicFired(world, owner, ctx);
    }
  });
}

export const SUMMONER_FRAME_BUFFS = [
  defineBuff('summoner-frame-frenzy', ({ player }) => {
    if (!player.summonsMinions) return null;
    const window = getStatusEffect(player.tracksCombat, SUMMONER_FRAME_WINDOW_EFFECT);
    if (!window || window.remainingMs <= 0) return null;
    const totalMs = window.data['totalMs'] ?? window.remainingMs;
    const aps = player.usesSkills.passives['summoner.frame-frenzy-aps-pct'] ?? 0;
    const onHit = player.usesSkills.passives['summoner.frame-frenzy-onhit-mult'] ?? 1;
    return {
      id:          'summoner-frame-frenzy',
      label:       'Frenzy',
      stacks:      1,
      durationPct: totalMs > 0 ? Math.round((window.remainingMs / totalMs) * 100) : 0,
      remainingMs: window.remainingMs,
      color:       '#ff8844',
      logDetail:   `summons +${Math.round(aps * 100)}% attack speed, +${Math.round((onHit - 1) * 100)}% on-hit`,
      values:      [
        { label: 'Summon attack speed', value: `+${Math.round(aps * 100)}%`, good: true },
        { label: 'Summon on-hit', value: `+${Math.round((onHit - 1) * 100)}%`, good: true },
      ],
    };
  }, { category: 'summoner', shape: 'circle' }),

  defineBuff('summoner-frame-link', ({ player }) => {
    if (!player.summonsMinions) return null;
    const max = Math.round(player.usesSkills.passives['summoner.frame-link-max-charge'] ?? 0);
    if (max <= 0) return null;
    const stacks = getResource(player.tracksCombat, SUMMONER_FRAME_LINK_RESOURCE);
    if (stacks <= 0) return null;
    const slamMult = player.usesSkills.passives['summoner.frame-link-slam-mult'] ?? 0;
    const slam = Math.floor(player.dealsDamage.attack * stacks * slamMult);
    return {
      id:          'summoner-frame-link',
      label:       'Link',
      stacks,
      durationPct: -1,
      color:       '#cc99ff',
      logDetail:   `${slam} banked for the next linked slam`,
      values:      [
        { label: 'Linked slam damage', value: String(slam), good: true },
        { label: 'Bank', value: `${stacks} / ${max}` },
      ],
    };
  }, { category: 'summoner', shape: 'square' }),
] as const satisfies readonly BuffDescriptor[];
