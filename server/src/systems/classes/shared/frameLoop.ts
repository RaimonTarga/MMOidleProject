/**
 * Frame loops — the machinery every root's loop is built from (progression
 * rework Phase 3; `docs/briefs/frame-loops-2026-10-01.md` §1, design §10).
 *
 * A frame used to be "the same mechanic faster or slower" plus a stat skew. Each
 * frame now owns a feedback loop whose CONTAINER encodes that skew, and there are
 * only two containers:
 *
 *   WINDOW (Light)  a timed buff opened by the mechanic firing, deliberately
 *                   SHORTER than one cycle. Uptime = duration / cycle, so attack
 *                   speed pays twice: a shorter cycle and more hits inside the
 *                   window. A window as long as the cycle is not a loop at all —
 *                   it is a flat stat with extra steps — which is why
 *                   {@link resolveFrameWindowMs} clamps it structurally rather
 *                   than trusting the authored number.
 *
 *   BANK (Heavy)    charge per regular hit, capped, spent by the mechanic. The
 *                   cap is deterministic and small so the player can count it,
 *                   and the HUD shows it (a stack tile plus the `frame-charge`
 *                   combat event the weapon glow rides).
 *
 *   Balanced frames author BOTH at half strength.
 *
 * ONE MULTIPLIER PER HIT. Every damage change here routes through
 * `ctx.metadata.empoweredMultiplier` — the single number a Technique rider reads
 * to recover "the hit as it was before the empowered multiplier". Nothing in a frame loop writes a second multiplier key, and
 * nothing multiplies ctx.damage without folding the same factor into that record.
 */

import {
  PLATING_SHRED_EFFECT_ID,
  applyStatusEffect,
  getResource,
  getStatusEffect,
  setResource,
  type StatusEffect,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import type { CombatContext } from '../../combat/engine/combatPipeline';
import { applySharedDebuffMaxWins } from '../../combat/status/sharedDebuffRecord';

/** The six class roots. A frame belongs to exactly one of them. */
export type FrameRootId =
  | 'cadence'
  | 'cooldown'
  | 'dot'
  | 'reload'
  | 'energy'
  | 'summoner';

/**
 * The hard ceiling on a window, as a share of one cycle.
 *
 * Design §10 says the window must be shorter than the cycle; this is where that
 * becomes true no matter what a node authors or what a relic does to the cycle.
 * 0.6 leaves the loop visibly OFF for a stretch of every cycle, which is the
 * whole point: the player feels the window open and close.
 */
export const FRAME_WINDOW_MAX_SHARE = 0.6;

/** HUD/status id of a frame window. Carries `data.totalMs` for the buff clock. */
export function frameWindowEffectId(root: FrameRootId): string {
  return `frame.${root}.window`;
}

/** `TracksCombat.resources` key of a frame bank. */
export function frameChargeResourceKey(root: FrameRootId): string {
  return `frame.${root}.charge`;
}

/**
 * The window a frame actually gets: the authored duration, clamped to a share of
 * the live cycle. Returns 0 when the frame authors no window (Heavy frames).
 */
export function resolveFrameWindowMs(authoredMs: number, cycleMs: number): number {
  if (!(authoredMs > 0)) return 0;
  const ceiling = Math.max(1, Math.floor(Math.max(1, cycleMs) * FRAME_WINDOW_MAX_SHARE));
  return Math.max(1, Math.min(Math.round(authoredMs), ceiling));
}

/**
 * Open (or refresh) the frame's window on its owner.
 *
 * `totalMs` rides in `data` because that is how every clock-bearing effect in the
 * game reports its full duration to the buff bar — a remaining fraction alone
 * cannot be turned back into seconds.
 */
export function openFrameWindow(
  player: PlayerEntity,
  root: FrameRootId,
  durationMs: number,
): void {
  if (!(durationMs > 0)) return;
  applyStatusEffect(player.tracksCombat, {
    id:          frameWindowEffectId(root),
    maxStacks:   1,
    refreshable: true,
    remainingMs: durationMs,
    sourceId:    player.isPlayer.id,
    data:        { totalMs: durationMs },
  });
}

export function frameWindowEffect(
  player: PlayerEntity,
  root: FrameRootId,
): StatusEffect | undefined {
  return getStatusEffect(player.tracksCombat, frameWindowEffectId(root));
}

export function isFrameWindowLive(player: PlayerEntity, root: FrameRootId): boolean {
  const effect = frameWindowEffect(player, root);
  return effect !== undefined && effect.remainingMs > 0;
}

// ── The bank ─────────────────────────────────────────────────────────────────

export function getFrameCharge(state: TracksCombat, root: FrameRootId): number {
  return Math.max(0, Math.floor(getResource(state, frameChargeResourceKey(root))));
}

/**
 * Write the bank and tell the node about it.
 *
 * The event is pushed only when the number CHANGED: it drives a cosmetic weapon
 * glow, and a per-hit event that says nothing new is just bandwidth.
 */
export function setFrameCharge(
  world: World,
  player: PlayerEntity,
  root: FrameRootId,
  stacks: number,
  cap: number,
): void {
  const limit = Math.max(0, Math.floor(cap));
  const next = Math.max(0, Math.min(Math.floor(stacks), limit));
  if (next === getFrameCharge(player.tracksCombat, root)) return;
  setResource(player.tracksCombat, frameChargeResourceKey(root), next);
  world.pushEvent(player.hasPosition.nodeId, {
    kind:     'frame-charge',
    playerId: player.isPlayer.id,
    stacks:   next,
    max:      limit,
  });
}

/** One charge per regular hit, refused at the cap. Returns the bank after the hit. */
export function bankFrameCharge(
  world: World,
  player: PlayerEntity,
  root: FrameRootId,
  cap: number,
): number {
  const bank = getFrameCharge(player.tracksCombat, root);
  if (cap <= 0 || bank >= cap) return bank;
  setFrameCharge(world, player, root, bank + 1, cap);
  return getFrameCharge(player.tracksCombat, root);
}

// ── The one multiplier ───────────────────────────────────────────────────────

/**
 * Scale this hit by `factor` and fold the same factor into the hit's single
 * multiplier record, so a rider reading `empoweredMultiplier` still sees one
 * honest number (design §6; the same shape `damage-window` cards use).
 */
export function applyFrameHitMultiplier(ctx: CombatContext, factor: number): void {
  if (!(factor > 1)) return;
  ctx.damage = Math.floor(ctx.damage * factor);
  ctx.metadata['empoweredMultiplier'] =
    Number(ctx.metadata['empoweredMultiplier'] ?? 1) * factor;
}

/**
 * Spend a bank INTO the multiplier the mechanic is already applying.
 *
 * `added` is in multiplier points (a ×4 finisher that spends 5 stacks at 0.2 each
 * lands as ×5), so the bank reads as "my finisher got bigger" rather than as a
 * second layer stacked on top of it. Implemented as the ratio between the two
 * totals precisely so it stays ONE multiplier: nothing re-derives a pre-empowered
 * base, which other listeners may already have moved.
 */
export function applyFrameBankBonus(ctx: CombatContext, added: number): void {
  if (!(added > 0)) return;
  const mult = Math.max(1, Number(ctx.metadata['empoweredMultiplier'] ?? 1));
  applyFrameHitMultiplier(ctx, (mult + added) / mult);
}

// ── Heavy riders ─────────────────────────────────────────────────────────────

/**
 * The Heavy plating-shred rider (Squire's Bulwark).
 *
 * A FRACTION of the plating the target has right now, resolved to the flat
 * reduction `effectivePlatingAfterShred` subtracts, and written through the
 * SHARED `plating-shred` record under the §18.1 max-wins rule: a frame's strip
 * never weakens a finisher's or a card's, and never shortens its window.
 */
export function applyFramePlatingShred(
  player: PlayerEntity,
  target: MonsterEntity,
  fraction: number,
  durationMs: number,
): void {
  if (!(fraction > 0)) return;
  const reduction = Math.max(1, Math.round(target.mitigatesDamage.plating * fraction));
  applySharedDebuffMaxWins(player, target.tracksCombat, {
    id:          PLATING_SHRED_EFFECT_ID,
    maxStacks:   1,
    refreshable: true,
    remainingMs: durationMs,
    sourceId:    player.isPlayer.id,
    data:        { totalMs: durationMs, platingReduction: reduction },
  }, ['platingReduction', 'totalMs'], { origin: 'mechanic' });
}
