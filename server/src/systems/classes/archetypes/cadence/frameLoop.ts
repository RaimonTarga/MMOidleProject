/**
 * Striker frame loops — Flurry, Skirmisher, Breaker (progression rework Phase 3;
 * `docs/briefs/frame-loops-2026-10-01.md` §1, "Striker (cadence) — locked").
 *
 *   Flurry (light)       the finisher opens a damage window, shorter than one
 *                        4-hit cycle. Uptime = window / cycle, so attack speed
 *                        pays twice — a shorter cycle AND more hits inside it.
 *   Skirmisher (balanced) both containers at half strength.
 *   Breaker (heavy)      a charge per regular hit, capped at threshold−1, spent
 *                        by the finisher; plus the rider, a stagger.
 *
 * WHY THE CAP IS threshold−1 AND NOT AUTHORED. A cycle is (N−1) regular hits and
 * one finisher, so threshold−1 is exactly "everything you landed this cycle". An
 * authored cap would be a second opinion about the cycle length that a relic's
 * threshold change, Rampage, or a frame re-author could silently contradict.
 *
 * Registered LAST in `initCadenceArchetype`, after the empowered multiplier and
 * after the counting handler, so the finisher branch here sees a resolved
 * `empoweredMultiplier` to fold the bank into and a resolved threshold to cap it.
 */

import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { isMechanicProxy } from '../../../combat/engine/empoweredAttacks';
import { attackCadenceMult } from '../../../combat/engine/attackCadence';
import { applyStun } from '../../../combat/status/stun';
import { monsterIgnoresControl } from '../../../combat/status/controlImmunity';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { defineBuff } from '../../../combat/buffs/descriptor';
import {
  applyFrameBankBonus,
  applyFrameHitMultiplier,
  bankFrameCharge,
  getFrameCharge,
  isFrameWindowLive,
  frameWindowEffect,
  openFrameWindow,
  resolveFrameWindowMs,
  setFrameCharge,
} from '../../shared/frameLoop';
import type { PlayerEntity } from '../../../../ecs/entity';

const ROOT = 'cadence' as const;

/** Fallback only — the frames all author a threshold. */
const CADENCE_THRESHOLD_FALLBACK = 5;

/** The resolved cycle length: (N−1) regular hits plus the finisher, in ms. */
function cadenceCycleMs(player: PlayerEntity): number {
  const interval = Math.max(
    1,
    player.performsAttack.attackCooldown * attackCadenceMult(player.tracksCombat),
  );
  return Math.max(1, Math.round(cadenceThreshold(player) * interval));
}

/**
 * The live cycle length in hits.
 *
 * `usesCadence.threshold` is the relic-resolved truth, but it is initialised
 * lazily on the first regular hit — so an empowered hit arriving before any
 * regular one (a T4 spec arming the opener) would read 0. Fall back to the
 * authored frame value in that case rather than capping the bank at −1.
 */
function cadenceThreshold(player: PlayerEntity): number {
  const live = Math.round(player.usesCadence?.threshold ?? 0);
  if (live > 1) return live;
  const authored = Math.round(
    player.usesSkills.passives['cadence.empowered-threshold'] ?? CADENCE_THRESHOLD_FALLBACK,
  );
  return Math.max(2, authored);
}

/** The bank's cap: everything a full cycle of regular hits can put in it. */
function cadenceBankCap(player: PlayerEntity): number {
  return Math.max(0, cadenceThreshold(player) - 1);
}

export function initCadenceFrameLoop(): void {
  registerCombatListener('onHit', (ctx, world) => {
    // A `mechanic-proxy` hit (design §24.2) COUNTS AS the mechanic for what reads
    // it downstream, but it never walks the root's own loop (rule 3).
    if (isMechanicProxy(ctx)) return;
    if (ctx.attackerType !== 'player') return;
    const player = ctx.attacker;
    if (!player.usesCadence) return;

    const passives = player.usesSkills.passives;
    const perStack = passives['cadence.frame-charge-per-stack'] ?? 0;
    const cap = cadenceBankCap(player);

    // ── The finisher: spend, stagger, open ───────────────────────────────────
    if (ctx.metadata['empoweredAttack']) {
      if (perStack > 0) {
        const bank = getFrameCharge(player.tracksCombat, ROOT);
        if (bank > 0) {
          // ONE multiplier: the bank makes the finisher's own multiplier bigger
          // rather than stacking a second factor on the hit.
          applyFrameBankBonus(ctx, bank * perStack);
          setFrameCharge(world, player, ROOT, 0, cap);
        }
      }

      // Breaker's rider. The shortest rung of the existing stun ladder, through
      // the one function that owns control resistance and the post-stun immunity
      // window — a frame rider must never be a new kind of stun.
      const staggerMs = Math.round(passives['cadence.frame-stagger-ms'] ?? 0);
      if (
        staggerMs > 0 &&
        ctx.defenderType === 'monster' &&
        !evadeBlocksDebuffs(ctx) &&
        !monsterIgnoresControl(ctx.defender)
      ) {
        applyStun(ctx.defender.tracksCombat, staggerMs, player.isPlayer.id);
      }

      openFrameWindow(
        player,
        ROOT,
        resolveFrameWindowMs(passives['cadence.frame-window-ms'] ?? 0, cadenceCycleMs(player)),
      );
      return;
    }

    // ── A regular hit: bank, and ride the window ─────────────────────────────
    if (perStack > 0) bankFrameCharge(world, player, ROOT, cap);

    // A chaotic-family whiff deals no damage, so there is nothing to multiply —
    // and multiplying zero would still record a multiplier on the exchange.
    if (ctx.metadata['chaoticMiss']) return;

    const windowMult = passives['cadence.frame-window-mult'] ?? 0;
    if (windowMult > 1 && isFrameWindowLive(player, ROOT)) {
      applyFrameHitMultiplier(ctx, windowMult);
    }
  });
}

export const CADENCE_FRAME_BUFFS = [
  defineBuff(
    'frame-window',
    ({ player }) => {
      if (!player.usesCadence) return null;
      const effect = frameWindowEffect(player, ROOT);
      if (!effect || effect.remainingMs <= 0) return null;
      const totalMs = effect.data['totalMs'] ?? effect.remainingMs;
      const mult = player.usesSkills.passives['cadence.frame-window-mult'] ?? 1;
      return {
        id: 'frame-window',
        label: 'Flurry',
        stacks: 1,
        durationPct: totalMs > 0 ? (effect.remainingMs / totalMs) * 100 : -1,
        remainingMs: effect.remainingMs,
        color: '#ffdd66',
        logSourceName: 'Cadence',
        logDetail: `×${Math.round(mult * 100) / 100} damage`,
        values: [{ label: 'Damage', value: `×${Math.round(mult * 100) / 100}`, good: true }],
      };
    },
    { label: 'Flurry', color: '#ffdd66', category: 'cadence', shape: 'circle' },
  ),
  defineBuff(
    'frame-charge',
    ({ player }) => {
      if (!player.usesCadence) return null;
      const perStack = player.usesSkills.passives['cadence.frame-charge-per-stack'] ?? 0;
      if (perStack <= 0) return null;
      const stacks = getFrameCharge(player.tracksCombat, ROOT);
      if (stacks <= 0) return null;
      const cap = cadenceBankCap(player);
      const bonus = Math.round(stacks * perStack * 100) / 100;
      return {
        id: 'frame-charge',
        label: 'Charge',
        stacks,
        showSingleStack: true,
        durationPct: cap > 0 ? (stacks / cap) * 100 : -1,
        color: '#ff9944',
        logSourceName: 'Cadence',
        logDetail: `finisher +${bonus}× from ${stacks}/${cap} charge`,
        values: [
          { label: 'Charge', value: `${stacks}/${cap}` },
          { label: 'Finisher multiplier', value: `+${bonus}×`, good: true },
        ],
      };
    },
    { label: 'Charge', color: '#ff9944', category: 'cadence', shape: 'square' },
  ),
] as const;
