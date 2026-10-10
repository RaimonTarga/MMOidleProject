import type { CombatEvent, Vec2 } from '@mmo-idle/shared';
import type { DamageNumberHint, RenderState } from './state';
import type { DamageNumberStyle } from '../fx/particles';
import {
  resolveMonsterDamageStyle, resolvePlayerDamageStyle, resolveShieldDamageStyle,
  type DamageNumberShare,
} from './damageNumberStyle';
import { NUMBER_TOKENS } from './readoutTokens';
import { DotCoalescer, LaneStack, type LaneFloater } from './readoutModel';

export interface CombatTextEntry {
  targetId: string;
  amount: number;
  targetPos?: Vec2;
  targetKind?: 'player' | 'monster' | 'minion';
  hint: DamageNumberHint;
  shield?: boolean;
  /**
   * The target's max HP when the entry was captured. A number's size is its share
   * of this pool, and a buffered hit or a coalesced DoT can draw after the target's
   * view is gone.
   */
  maxHp?: number;
}

export interface CombatTextBatch {
  entries: CombatTextEntry[];
}

/** Preserve instances; never reconstruct an untyped remainder from net HP loss. */
export function prepareCombatText(
  events: readonly CombatEvent[],
  options: { stateSync?: boolean } = {},
): CombatTextBatch {
  const batch: CombatTextBatch = { entries: [] };
  if (options.stateSync) return batch;
  for (const ev of events) {
    if (ev.kind === 'damage') {
      if (!Number.isFinite(ev.amount) || ev.amount < 0) continue;
      if (Math.round(ev.amount) > 0) batch.entries.push({
        targetId: ev.targetId, targetKind: ev.targetKind, targetPos: ev.targetPos,
        amount: Math.round(ev.amount),
        // `empowered` is crit styling only. Payloads that resolve through the
        // AoE seam (Detonate) have no `player-hit` of their own, so this event
        // is where they carry it.
        hint: { hasDirectHit: ev.category === 'direct', isDot: ev.category === 'dot',
          empowered: !!ev.empowered, execution: false, dotElement: ev.element },
      });
      continue;
    }
    if (ev.kind !== 'player-hit' && ev.kind !== 'monster-hit' && ev.kind !== 'dot-tick') continue;
    const amount = ev.kind === 'dot-tick' ? ev.amount : ev.damage;
    // Ignore malformed/missing amounts; combat text never reconstructs HP loss.
    if (amount === undefined || !Number.isFinite(amount) || amount < 0) continue;
    const hint: DamageNumberHint = ev.kind === 'dot-tick'
      ? { hasDirectHit: false, isDot: true, empowered: false, execution: false, dotElement: ev.element }
      : {
          hasDirectHit: true, empowered: !!ev.empowered, execution: !!ev.execution,
          evadedPartial: ev.evadedPartial, capped: ev.capped,
        };
    const targetPos = 'targetPos' in ev ? ev.targetPos : undefined;
    const targetKind = ev.kind === 'player-hit' ? 'monster' : ev.kind === 'monster-hit' ? 'player' : undefined;
    if (Math.round(amount) > 0) {
      batch.entries.push({ targetId: ev.targetId, targetKind, amount: Math.round(amount), targetPos, hint });
    }
    if (ev.absorbed && Number.isFinite(ev.absorbed) && Math.round(ev.absorbed) > 0) {
      batch.entries.push({ targetId: ev.targetId, targetKind, amount: Math.round(ev.absorbed), targetPos, hint, shield: true });
    }
  }
  return batch;
}

type TextState = Pick<RenderState, 'sprite' | 'spriteMeta' | 'kind' | 'ownId' | 'view'>;
type BodySprite = NonNullable<ReturnType<RenderState['sprite']['get']>>;
/** Draws one number; returns the floater so the lane can stack it (anything else is ignored). */
export type SpawnNumber = (
  pos: Vec2, offset: number, amount: number, color: string, style?: DamageNumberStyle,
) => unknown;

function isLaneFloater(value: unknown): value is LaneFloater {
  return typeof value === 'object' && value !== null && typeof (value as LaneFloater).setLift === 'function';
}

/** Per-scene cosmetic state: the open DoT windows and every target's lane. */
interface TextRuntime {
  dots: DotCoalescer<CombatTextEntry>;
  lanes: LaneStack<LaneFloater>;
  nodeId?: string;
}

const runtimes = new WeakMap<object, TextRuntime>();

function runtimeFor(state: object): TextRuntime {
  let rt = runtimes.get(state);
  if (!rt) {
    rt = { dots: new DotCoalescer(), lanes: new LaneStack() };
    runtimes.set(state, rt);
  }
  return rt;
}

/** One DoT window per target, element and absorbed-or-not: each keeps its own colour. */
function dotKey(entry: CombatTextEntry): string {
  return `${entry.targetId}|${entry.hint.dotElement ?? ''}|${entry.shield ? 's' : 'h'}`;
}

function maxHpOf(state: TextState, entry: CombatTextEntry): number | undefined {
  return entry.maxHp ?? state.view.get(entry.targetId)?.maxHp;
}

function takenColor(kind: 'player' | 'minion', own: boolean): string {
  if (kind === 'minion') return NUMBER_TOKENS.color.takenMinion;
  return own ? NUMBER_TOKENS.color.takenOwn : NUMBER_TOKENS.color.takenOther;
}

/**
 * Draw now: per target only the newest `lane.cap` can survive the lane, so the rest
 * of a burst is never spawned, and the whole draw is bounded by `batchCap`. Cosmetic
 * overload is dropped, never deferred into later fights.
 */
function drawEntries(entries: readonly CombatTextEntry[], state: TextState, spawn: SpawnNumber, rt: TextRuntime): void {
  const perTarget = new Map<string, number>();
  const kept: CombatTextEntry[] = [];
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    const n = perTarget.get(entry.targetId) ?? 0;
    if (n >= NUMBER_TOKENS.lane.cap) continue;
    perTarget.set(entry.targetId, n + 1);
    kept.push(entry);
  }
  kept.reverse();
  let started = 0;
  for (const entry of kept) {
    if (started >= NUMBER_TOKENS.batchCap) break;
    const sprite = state.sprite.get(entry.targetId);
    const pos = sprite ? { x: sprite.x, y: sprite.y } : entry.targetPos;
    if (!pos) continue;
    started++;
    const kind = state.kind.get(entry.targetId) ?? entry.targetKind;
    const share: DamageNumberShare = { amount: entry.amount, maxHp: maxHpOf(state, entry) };
    const resolved = entry.shield
      ? resolveShieldDamageStyle(share, entry.hint.isDot)
      : kind === 'player' || kind === 'minion'
        ? resolvePlayerDamageStyle(entry.hint, takenColor(kind, entry.targetId === state.ownId), share)
        : resolveMonsterDamageStyle(entry.hint, share);
    const floater = spawn(
      pos,
      state.spriteMeta.get(entry.targetId)?.barOffsetY ?? 40,
      entry.amount, resolved.color, resolved.style,
    );
    if (isLaneFloater(floater)) rt.lanes.push(entry.targetId, floater);
    // The crit look's body flash: the player's own empowered hit on a monster.
    if (sprite && resolved.style?.motion === 'crit' && kind === 'monster' && !entry.shield) flashBody(sprite);
  }
}

const flashing = new WeakSet<object>();

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/**
 * A short white flash over the struck body: a tint-filled copy that fades in
 * `bodyFlashMs`, so the sprite's own tint (elite outline, colour) is never touched.
 * One at a time per body; skipped under reduced motion and for untextured bodies.
 */
function flashBody(sprite: BodySprite): void {
  if (prefersReducedMotion() || flashing.has(sprite) || !sprite.scene || !('texture' in sprite)) return;
  const body = sprite as Phaser.GameObjects.Image;
  const scene = body.scene;
  const crit = NUMBER_TOKENS.crit;
  const ghost = scene.add
    .image(body.x, body.y, body.texture.key, body.frame.name)
    .setOrigin(body.originX, body.originY)
    .setScale(body.scaleX, body.scaleY)
    .setFlip(body.flipX, body.flipY)
    .setRotation(body.rotation)
    .setDepth(body.depth + 0.5)
    .setTintFill(0xffffff)
    .setAlpha(crit.bodyFlashAlpha);
  flashing.add(sprite);
  scene.tweens.add({
    targets: ghost,
    alpha: 0,
    duration: crit.bodyFlashMs,
    ease: 'Quad.easeIn',
    onComplete: () => { ghost.destroy(); flashing.delete(sprite); },
  });
}

/**
 * Called before removals. Direct hits draw now; DoT ticks join their target's open
 * window and draw as one number when it closes (`flushCombatText`).
 */
export function renderCombatText(
  batch: CombatTextBatch,
  state: TextState,
  spawn: SpawnNumber,
  now = performance.now(),
): void {
  const rt = runtimeFor(state);
  const direct: CombatTextEntry[] = [];
  for (const entry of batch.entries) {
    if (!entry.hint.isDot) { direct.push(entry); continue; }
    // Capture the pool now: the window can close after the target is gone.
    const sprite = state.sprite.get(entry.targetId);
    rt.dots.add(dotKey(entry), {
      ...entry,
      maxHp: maxHpOf(state, entry),
      targetPos: sprite ? { x: sprite.x, y: sprite.y } : entry.targetPos,
      targetKind: state.kind.get(entry.targetId) ?? entry.targetKind,
    }, now);
  }
  if (direct.length > 0) drawEntries(direct, state, spawn, rt);
}

/** Every frame: draw the DoT windows that have closed, forget expired lanes. */
export function flushCombatText(state: TextState, spawn: SpawnNumber, now = performance.now()): void {
  const rt = runtimes.get(state);
  if (!rt) return;
  rt.lanes.prune();
  if (rt.dots.size === 0) return;
  const ready = rt.dots.flush(now);
  if (ready.length > 0) drawEntries(ready, state, spawn, rt);
}

/** Drop every pending window and live floater (hidden tab, resync). */
export function resetCombatText(state: object): void {
  const rt = runtimes.get(state);
  if (!rt) return;
  rt.dots.reset();
  rt.lanes.clear();
}

/** A node change takes nothing with it: windows from the old node never draw here. */
export function noteCombatTextNode(state: object, nodeId: string): void {
  const rt = runtimeFor(state);
  if (rt.nodeId !== undefined && rt.nodeId !== nodeId) resetCombatText(state);
  rt.nodeId = nodeId;
}
