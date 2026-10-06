import { applyStatusEffect } from '@mmo-idle/shared';
import { registerCombatListener, type CombatContext } from '../../../../../combat/engine/combatPipeline';
import { proxyEmpoweredMultiplier } from '../../../../../combat/engine/empoweredAttacks';
import type { PlayerEntity } from '../../../../../../ecs/entity';
import { hasPassive } from '../core/helpers';
import { reverbEchoStrength } from '../core/selectors';
import { REVERB_ECHO_FX } from '../core/constants';

/**
 * REVERB (cooldown-balanced-t3-a, design §22.5) — the execution echoes.
 *
 * It lands now, and lands again at `cooldown.reverb-echo-strength` (the design's
 * "half strength") when its recharge reaches the halfway mark, on whatever the
 * player is hitting then. No bank, no window: a second beat on the clock.
 *
 * Three pieces, one per seam:
 *   - {@link openReverbEcho}: the execution marks an echo due (`postEmpoweredHit`).
 *   - `updateReverbEcho` (ticks/balanced/reverbEcho.ts): at the halfway mark, the
 *     echo is fired as a real attack through `runPlayerAttack`, or lost when
 *     nothing is in reach.
 *   - {@link registerReverbEcho}: on that attack, the echo's ONE multiplier.
 *
 * WHAT THE ECHO IS. An empowered hit through the normal pipeline, so on-hit gear,
 * empowered gear (`shared.empowered-mult-add`, `weapon.empowered-mult-bonus`, the
 * relic profile — all inside {@link proxyEmpoweredMultiplier}, the same function
 * the real execution resolves through) and every downstream reader apply. It
 * records `mechanicConsumed` like every mechanic hit, and the cooldown's one
 * emitter announces `mechanic-fired` for it exactly once (the exchange latch), so
 * the Empowered moment and its 4 s cap see it once. What it is NOT: the root
 * spending its charge. It never restarts the recharge, never walks the frame loop
 * (the bank and the window belong to the execution), and never spends an
 * execution that is already waiting — the attack carries `holdEmpoweredAttack`.
 */

/** `ctx.metadata` key on the echo's own attack. */
export const REVERB_ECHO_HIT = 'reverbEcho';

/** Whether this exchange is Reverb's echo rather than the execution itself. */
export function isReverbEcho(ctx: CombatContext): boolean {
  return ctx.metadata[REVERB_ECHO_HIT] === true;
}

/**
 * The execution just landed: an echo is due at the halfway mark. A permanent
 * marker rather than a countdown — the recharge timer is the clock (see
 * `getReverbEchoClock`), so there is exactly one number for the HUD and the echo
 * to agree on. A second execution before the first echo landed cannot happen
 * (the halfway mark comes first), and would simply keep one echo due.
 */
export function openReverbEcho(player: PlayerEntity): void {
  applyStatusEffect(player.tracksCombat, {
    id:          REVERB_ECHO_FX,
    instanced:   false,
    maxStacks:   1,
    refreshable: true,
    remainingMs: -1, // spent by the echo (or lost) at the halfway mark
    sourceId:    player.isPlayer.id,
    data:        {},
  });
}

/**
 * The echo's multiplier, on the echo's own attack. Registered FIRST among the
 * cooldown T3 hit listeners, right after the root's empowered multiplier (which
 * the echo holds), so every later reader sees an empowered hit.
 *
 * ONE MULTIPLIER PER HIT: the factor is the execution's own multiplier times the
 * echo strength, folded into the hit's single `empoweredMultiplier` record — a
 * Technique rider or a share-of-the-hit payoff dividing by it sees one honest
 * number. The bank is not in it: the execution spent the bank.
 */
export function registerReverbEcho(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (!isReverbEcho(ctx)) return;
    // A dead swing whiffs the echo, like it whiffs an execution: nothing lands.
    if (ctx.metadata['chaoticMiss']) return;
    const player = ctx.attacker;
    if (!player.usesCooldown || !hasPassive(player, 'cooldown.reverb')) return;

    const own = proxyEmpoweredMultiplier(world, player);
    const factor = (own ?? 0) * reverbEchoStrength(player);
    if (!(factor > 0)) return;

    const base = ctx.damage;
    ctx.damage = Math.floor(base * factor);
    ctx.metadata['empoweredAttack'] = true;
    ctx.metadata['mechanicConsumed'] = true;
    ctx.metadata['empoweredMultiplier'] = Number(ctx.metadata['empoweredMultiplier'] ?? 1) * factor;
    ctx.metadata['empoweredBonus'] = Number(ctx.metadata['empoweredBonus'] ?? 0) + (ctx.damage - base);
  });
}
