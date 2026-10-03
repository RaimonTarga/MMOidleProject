/**
 * Squire frame loops — Warrior, Knight, Bulwark (progression rework Phase 3;
 * `docs/briefs/frame-loops-2026-10-01.md` §1, "Squire (cooldown) — locked").
 *
 *   Warrior (light)    the execution opens a window; regular hits landed inside
 *                      it SHORTEN the next recharge. The payoff is tempo rather
 *                      than damage, which is what a light cooldown frame wants:
 *                      attack speed turns into executions per minute.
 *   Knight (balanced)  both containers at half strength.
 *   Bulwark (heavy)    a charge per regular hit into the next execution, spent by
 *                      it; plus the rider, a plating strip.
 *
 * WHY THE BANK CAP IS AUTHORED HERE AND DERIVED FOR THE STRIKER. Cadence counts
 * hits, so "one cycle of regular hits" is a number it already owns. A cooldown
 * cycle is TIME, and how many hits fit in it depends on attack speed — so a
 * derived cap would hand fast weapons a bigger bank for free. The cap is authored
 * on the frame instead, and the refund below is what attack speed buys.
 *
 * Registered LAST in `initCooldownArchetype`, after the empowered multiplier and
 * after the restart handler: the window must open on a recharge that has already
 * been reset to the full cycle, or the first refund would come off the old timer.
 */

import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { isMechanicProxy } from '../../../combat/engine/empoweredAttacks';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { defineBuff } from '../../../combat/buffs/descriptor';
import {
  applyFrameBankBonus,
  applyFramePlatingShred,
  bankFrameCharge,
  frameWindowEffect,
  getFrameCharge,
  isFrameWindowLive,
  openFrameWindow,
  resolveFrameWindowMs,
  setFrameCharge,
} from '../../shared/frameLoop';
import { resolveExecutionCooldownMs } from './cooldownPrototype';
import type { PlayerEntity } from '../../../../ecs/entity';

const ROOT = 'cooldown' as const;

/**
 * The last share of a recharge that no refund can touch.
 *
 * Without a floor, a fast enough weapon inside a long enough window refunds more
 * than the window costs and the execution becomes continuous — the mechanic stops
 * being a cycle at all. A quarter of the cycle is always paid in real time.
 */
const FRAME_REFUND_FLOOR_SHARE = 0.25;

function cooldownBankCap(player: PlayerEntity): number {
  return Math.max(0, Math.round(player.usesSkills.passives['cooldown.frame-charge-cap'] ?? 0));
}

export function initCooldownFrameLoop(): void {
  registerCombatListener('onHit', (ctx, world) => {
    // A `mechanic-proxy` hit (design §24.2) COUNTS AS the mechanic for what reads
    // it downstream, but it never walks the root's own loop (rule 3).
    if (isMechanicProxy(ctx)) return;
    if (ctx.attackerType !== 'player') return;
    const player = ctx.attacker;
    const cd = player.usesCooldown;
    if (!cd) return;

    const passives = player.usesSkills.passives;
    const perStack = passives['cooldown.frame-charge-per-stack'] ?? 0;
    const cap = cooldownBankCap(player);
    const cycleMs = resolveExecutionCooldownMs(player);

    // ── The execution: spend, strip, open ────────────────────────────────────
    if (ctx.metadata['empoweredAttack']) {
      if (perStack > 0 && cap > 0) {
        const bank = getFrameCharge(player.tracksCombat, ROOT);
        if (bank > 0) {
          applyFrameBankBonus(ctx, bank * perStack);
          setFrameCharge(world, player, ROOT, 0, cap);
        }
      }

      const shredPct = passives['cooldown.frame-shred-pct'] ?? 0;
      if (shredPct > 0 && ctx.defenderType === 'monster' && !evadeBlocksDebuffs(ctx)) {
        applyFramePlatingShred(
          player,
          ctx.defender,
          shredPct,
          Math.max(100, Math.round(passives['cooldown.frame-shred-duration-ms'] ?? 6_000)),
        );
      }

      openFrameWindow(
        player,
        ROOT,
        resolveFrameWindowMs(passives['cooldown.frame-window-ms'] ?? 0, cycleMs),
      );
      return;
    }

    // ── A regular hit: bank, and pay down the next recharge ──────────────────
    if (perStack > 0 && cap > 0) bankFrameCharge(world, player, ROOT, cap);

    const refundMs = passives['cooldown.frame-refund-ms'] ?? 0;
    if (refundMs > 0 && isFrameWindowLive(player, ROOT)) {
      const floor = cycleMs * FRAME_REFUND_FLOOR_SHARE;
      if (cd.executionCooldownMs > floor) {
        cd.executionCooldownMs = Math.max(floor, cd.executionCooldownMs - refundMs);
      }
    }
  });
}

export const COOLDOWN_FRAME_BUFFS = [
  defineBuff(
    'frame-window',
    ({ player }) => {
      if (!player.usesCooldown) return null;
      const effect = frameWindowEffect(player, ROOT);
      if (!effect || effect.remainingMs <= 0) return null;
      const totalMs = effect.data['totalMs'] ?? effect.remainingMs;
      const refundMs = Math.round(player.usesSkills.passives['cooldown.frame-refund-ms'] ?? 0);
      return {
        id: 'frame-window',
        label: 'Press',
        stacks: 1,
        durationPct: totalMs > 0 ? (effect.remainingMs / totalMs) * 100 : -1,
        remainingMs: effect.remainingMs,
        color: '#88ddff',
        logSourceName: 'Cooldown',
        logDetail: `hits cut ${refundMs}ms off the next execution`,
        values: [{ label: 'Recharge cut per hit', value: `${refundMs}ms`, good: true }],
      };
    },
    { label: 'Press', color: '#88ddff', category: 'cooldown', shape: 'circle' },
  ),
  defineBuff(
    'frame-charge',
    ({ player }) => {
      if (!player.usesCooldown) return null;
      const perStack = player.usesSkills.passives['cooldown.frame-charge-per-stack'] ?? 0;
      const cap = cooldownBankCap(player);
      if (perStack <= 0 || cap <= 0) return null;
      const stacks = getFrameCharge(player.tracksCombat, ROOT);
      if (stacks <= 0) return null;
      const bonus = Math.round(stacks * perStack * 100) / 100;
      return {
        id: 'frame-charge',
        label: 'Charge',
        stacks,
        showSingleStack: true,
        durationPct: (stacks / cap) * 100,
        color: '#ff9944',
        logSourceName: 'Cooldown',
        logDetail: `execution +${bonus}× from ${stacks}/${cap} charge`,
        values: [
          { label: 'Charge', value: `${stacks}/${cap}` },
          { label: 'Execution multiplier', value: `+${bonus}×`, good: true },
        ],
      };
    },
    { label: 'Charge', color: '#ff9944', category: 'cooldown', shape: 'square' },
  ),
] as const;
