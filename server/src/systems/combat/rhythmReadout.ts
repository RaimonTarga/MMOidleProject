/**
 * The rhythm readout's server half (design §24.6; course-correction W2-B).
 *
 * WHY A SLICE AND NOT THE BUFF PATH. The HUD status path (`syncPlayerBuffs`)
 * re-projects every buff every tick and logs a world-log transition whenever a
 * buff's stack count moves. A `hit-nth` counter moves on every hit, so carried as
 * a buff it would write a "buff-update" line per hit into the world log, and a
 * rate cap's clock would be re-sent at broadcast rate for its whole five seconds.
 * The counters already live on `TracksCombat`; this module copies them, ON
 * CHANGE, into one small networked slice (`ShowsRhythm`) and does nothing else:
 *
 *   - a counter that moved writes the new count;
 *   - a cap writes the server time it clears, ONCE, when it starts (the client
 *     draws the clock against its server clock, it never counts it down);
 *   - a latch that is spent, a carry that is armed or spent, writes once;
 *   - nothing is ever written per tick, and a call that changes nothing writes
 *     nothing (`markSliceDirty` is only reached on a real difference).
 *
 * PRESENCE IS THE SIGNAL. The slice is attached while the player's resolved card
 * cache holds at least one triggered firing (`rhythmFirings`) and detached when
 * it holds none, so "has a rhythm to show" is a component, never a flag. The
 * client derives which ring to draw from the same shared function.
 */
import {
  RHYTHM_SPENT_ON_MAX,
  getCooldown,
  getCounter,
  getFlag,
  getLineageRuntime,
  rhythmFirings,
  type RhythmFiring,
  type RhythmMoment,
  type ShowsRhythm,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../ecs/entity';
import type { World } from '../../world/World';
import { attachComponent, detachComponent } from '../../ecs/markerHelpers';
import { markSliceDirty } from '../../ecs/dirtyHelpers';
import { ENGAGEMENT_CD, capCd, carryFlag, firstHitFlag, nthCounter } from './lineageKeys';

/** A per-body opener that was just spent, and on which body. */
export interface OpenerSpent {
  key: string;
  bodyId: string;
}

/**
 * How far a recomputed clock may sit from the one already written before it
 * counts as a new clock. A cap's remaining time and the wall clock advance
 * together tick by tick, so a running cap recomputes to the same instant within a
 * tick or two of drift — and must not be rewritten for that. A cap that really
 * restarted lands a whole cap away.
 */
const CLOCK_SLACK_MS = 250;

/** The firings a ring could show, off the player's resolved-card cache. */
export function playerRhythmFirings(player: PlayerEntity): RhythmFiring[] {
  const runtime = getLineageRuntime(player.tracksCombat);
  return runtime ? rhythmFirings(runtime) : [];
}

function sameClock(prev: number | undefined, next: number): number {
  return prev !== undefined && Math.abs(prev - next) < CLOCK_SLACK_MS ? prev : next;
}

function momentFor(
  player: PlayerEntity,
  firing: RhythmFiring,
  prev: RhythmMoment | undefined,
  now: number,
  spent: readonly OpenerSpent[],
): RhythmMoment {
  const cs = player.tracksCombat;
  switch (firing.shape) {
    case 'count': {
      const count = getCounter(cs, nthCounter(firing.key));
      return count > 0 ? { count } : {};
    }
    case 'cap': {
      const left = getCooldown(cs, capCd(firing.key));
      return left > 0 ? { capUntil: sameClock(prev?.capUntil, now + left) } : {};
    }
    case 'carry':
      return getFlag(cs, carryFlag(firing.key)) ? { armed: true } : {};
    case 'latch-engagement': {
      // Spent until the engagement lapses; the runtime re-arms it lazily on the
      // next hit after the lull, so the honest "ready again at" is the lapse.
      const left = getCooldown(cs, ENGAGEMENT_CD);
      if (!getFlag(cs, firstHitFlag(firing.key)) || left <= 0) return {};
      return { spentUntil: sameClock(prev?.spentUntil, now + left) };
    }
    case 'latch-body': {
      // The latch itself lives on each monster; the readout keeps the bodies it
      // was spent on. Dead bodies are left to age out of the bound rather than
      // pruned — pruning would write a change for nothing the ring shows.
      const spentOn = [...(prev?.spentOn ?? [])];
      for (const entry of spent) {
        if (entry.key !== firing.key || spentOn.includes(entry.bodyId)) continue;
        spentOn.push(entry.bodyId);
      }
      const bounded = spentOn.slice(-RHYTHM_SPENT_ON_MAX);
      return bounded.length > 0 ? { spentOn: bounded } : {};
    }
    case 'pulse':
    default:
      return {};
  }
}

function sameMoment(a: RhythmMoment | undefined, b: RhythmMoment): boolean {
  if (!a) return false;
  if (a.count !== b.count || a.capUntil !== b.capUntil || a.armed !== b.armed) return false;
  if (a.spentUntil !== b.spentUntil) return false;
  const x = a.spentOn ?? [];
  const y = b.spentOn ?? [];
  return x.length === y.length && x.every((id, i) => id === y[i]);
}

function sameMoments(
  a: Record<string, RhythmMoment>,
  b: Record<string, RhythmMoment>,
): boolean {
  const keys = Object.keys(b);
  if (Object.keys(a).length !== keys.length) return false;
  return keys.every((key) => sameMoment(a[key], b[key]));
}

/**
 * Bring the player's `ShowsRhythm` in line with the counters the card runtime
 * keeps. Attaches, detaches or rewrites the slice only when what it would say
 * changed. `spent` names per-body openers this very call spent.
 *
 * Called from recalc (the firing set can change there) and from each moment's
 * own listener in `lineageCards.ts`, right after it moved the counter.
 */
export function syncRhythmReadout(
  world: World,
  player: PlayerEntity,
  spent: readonly OpenerSpent[] = [],
): void {
  const firings = playerRhythmFirings(player);
  if (firings.length === 0) {
    detachComponent(world, player, 'showsRhythm');
    return;
  }
  const prev = player.showsRhythm?.moments ?? {};
  const now = Date.now();
  const moments: Record<string, RhythmMoment> = {};
  for (const firing of firings) {
    moments[firing.key] = momentFor(player, firing, prev[firing.key], now, spent);
  }
  if (!player.showsRhythm) {
    const slice: ShowsRhythm = { moments };
    attachComponent(world, player, 'showsRhythm', slice);
    return;
  }
  if (sameMoments(prev, moments)) return;
  player.showsRhythm.moments = moments;
  markSliceDirty(world, player, 'showsRhythm');
}
