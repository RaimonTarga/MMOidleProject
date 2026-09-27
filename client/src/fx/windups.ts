/**
 * WIND-UPS — the grammar the Trench fight established (premium pass, 2026-09-27):
 * a boss cast draws a CLOCK you can read (jaws closing over you, a sigil
 * contracting, ice forming), and the cast's end either RESOLVES it (the hit lands,
 * visibly) or CANCELS it (a stun broke it, visibly).
 *
 * A wind-up registers against its caster; `resolveWindup` is called for every
 * `monster-cast-end` (fired or not). Pattern `cast` steps emit no cast-end of their
 * own, so a wind-up can also carry a `ttlMs` after which it `expire`s quietly — the
 * payoff for those is a different event (a charge setting off, a plate raised).
 */
import type { MonsterView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';

export type Pt = { x: number; y: number };

export interface Windup {
  /**
   * The cast fired; `at` is the victim's drawn position when it resolved. Return
   * `'continue'` when the wind-up only ADDS to the cast's usual payoff cue (a
   * Swamp spew leading into the ordinary pool splash) rather than replacing it.
   */
  fire(at: Pt | undefined): void | 'continue';
  /** The cast was stopped (stun, root, reset). */
  cancel(): void;
  /** Quiet teardown when no cast-end ever comes (defaults to `cancel`). */
  expire?(): void;
}

interface Entry {
  windup: Windup;
  /** The cast's fx id: a cast-end for a DIFFERENT fired cast leaves it alone. */
  fx?: string;
  timer?: Phaser.Time.TimerEvent;
}

const registries = new WeakMap<GameScene, Map<string, Entry>>();

function registry(scene: GameScene): Map<string, Entry> {
  let map = registries.get(scene);
  if (!map) {
    map = new Map();
    registries.set(scene, map);
  }
  return map;
}

/** Register a caster's running wind-up, replacing (and expiring) any previous one. */
export function registerWindup(
  scene: GameScene,
  monsterId: string,
  windup: Windup,
  opts: { fx?: string; ttlMs?: number } = {},
): void {
  const { fx, ttlMs } = opts;
  const map = registry(scene);
  const previous = map.get(monsterId);
  if (previous) {
    previous.timer?.remove();
    (previous.windup.expire ?? previous.windup.cancel)();
  }
  const entry: Entry = { windup, fx };
  if (ttlMs !== undefined) {
    entry.timer = scene.time.delayedCall(ttlMs, () => {
      if (map.get(monsterId) !== entry) return;
      map.delete(monsterId);
      (windup.expire ?? windup.cancel)();
    });
  }
  map.set(monsterId, entry);
}

/**
 * Resolve the caster's wind-up on its cast-end: `'owned'` when the wind-up drew
 * the payoff, `'continue'` when the usual cue should still play, false when there
 * was nothing to resolve.
 */
export function resolveWindup(
  scene: GameScene,
  monsterId: string,
  fired: boolean,
  at?: Pt,
  fx?: string,
): 'owned' | 'continue' | false {
  const map = registries.get(scene);
  const entry = map?.get(monsterId);
  if (!entry) return false;
  // A fired cast only resolves its OWN wind-up; any stopped cast ends them all.
  if (fired && entry.fx && fx !== entry.fx) return false;
  map!.delete(monsterId);
  entry.timer?.remove();
  if (!fired) {
    entry.windup.cancel();
    return 'owned';
  }
  return entry.windup.fire(at) === 'continue' ? 'continue' : 'owned';
}

/** True while this caster has a wind-up running (its body belongs to the cast). */
export function hasWindup(scene: GameScene, monsterId: string): boolean {
  return registries.get(scene)?.has(monsterId) ?? false;
}

// ── Superseded one-shot cues ─────────────────────────────────────────────────

const suppressed = new WeakMap<GameScene, Map<string, number>>();

/**
 * Skip the next `boss-fx` of this id from this caster for `ms`: a scripted cast's
 * start-of-cast roar/frenzy puff, now that the wind-up draws the build and the
 * release draws the burst.
 */
export function suppressBossFx(scene: GameScene, monsterId: string, fx: string, ms = 250): void {
  let map = suppressed.get(scene);
  if (!map) {
    map = new Map();
    suppressed.set(scene, map);
  }
  map.set(`${monsterId}:${fx}`, performance.now() + ms);
}

export function isBossFxSuppressed(scene: GameScene, monsterId: string, fx: string): boolean {
  const until = suppressed.get(scene)?.get(`${monsterId}:${fx}`);
  return until !== undefined && performance.now() < until;
}

/** A drawn entity's position, or undefined when it is not on screen. */
export function spriteAt(scene: GameScene, id: string | undefined): Pt | undefined {
  const s = id ? scene.state.sprite.get(id) : undefined;
  return s ? { x: s.x, y: s.y } : undefined;
}

/** The caster's current victim, for wind-ups (cast-start carries no target). */
export function castTargetId(scene: GameScene, monsterId: string): string | undefined {
  const view = scene.state.view.get(monsterId) as MonsterView | undefined;
  return view?.attackTargetId ?? scene.state.ownId ?? undefined;
}

/** Run `step` every frame until it returns false or the returned stop is called. */
export function follow(scene: GameScene, step: () => boolean): () => void {
  let stopped = false;
  const tick = (): void => {
    if (stopped) return;
    if (document.hidden) return;
    if (!step()) stop();
  };
  const stop = (): void => {
    if (stopped) return;
    stopped = true;
    scene.events.off('update', tick);
  };
  scene.events.on('update', tick);
  return stop;
}
