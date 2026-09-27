/**
 * ATTACK ANTICIPATION — the draw-back before a mob's basic attack (premium pass
 * for mobs, 2026-09-27, step B2). A basic attack used to be a lunge that started
 * the instant the hit landed, so nothing said a swing was coming.
 *
 * Client-only: the next swing is due at `lastAttackAt + attackCooldown` on the
 * server clock, which the cooldown bars already read. In the last `WIND_MS` before
 * it, the body rears back from its target (a ranged mob sets itself instead); when
 * the attack lands, `releaseAnticipation` snaps it forward into the existing lunge.
 *
 * Skipped for bosses (their own grammar), casts in progress (their wind-up owns the
 * body), hard control, charges, and anything off the camera. At most one wind per
 * attack, keyed by `lastAttackAt`.
 */
import type { MonsterView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { posePath, releasePose, tweenPose } from './bodyPose';
import { shouldRunClientFx } from './guard';
import { hasWindup } from './windups';

const WIND_MS = 240;

/** Per scene: the `lastAttackAt` each monster last wound up for. */
const woundFor = new WeakMap<GameScene, Map<string, number>>();
/** Per scene: wound up, swing not seen yet (monster id -> the swing's due time). */
const pendingFor = new WeakMap<GameScene, Map<string, number>>();
/** How long past due a wound-up swing may be before the body lets go of it. */
const GIVE_UP_MS = 300;

function onCamera(scene: GameScene, x: number, y: number): boolean {
  const v = scene.cameras.main.worldView;
  return x > v.x - 80 && x < v.right + 80 && y > v.y - 80 && y < v.bottom + 80;
}

export function updateAttackAnticipation(scene: GameScene): void {
  if (!shouldRunClientFx()) return;
  const state = scene.state;
  const serverNow = state.serverClock.now();
  if (serverNow === undefined) return;
  let wound = woundFor.get(scene);
  let pending = pendingFor.get(scene);
  if (!wound || !pending) {
    wound = new Map();
    pending = new Map();
    woundFor.set(scene, wound);
    pendingFor.set(scene, pending);
  }
  // A swing that never came (the target stepped out, the mob was pulled away):
  // let go of the draw-back quietly.
  for (const [id, dueAt] of pending) {
    if (serverNow - dueAt < GIVE_UP_MS) continue;
    pending.delete(id);
    releasePose(scene, id, 200);
  }
  for (const [id, view] of state.view) {
    if (state.kind.get(id) !== 'monster') continue;
    const m = view as MonsterView;
    if (m.isBoss || m.hardControlled || m.charging || m.shelled || !m.attackTargetId || m.state !== 'attacking') continue;
    if (wound.get(id) === m.lastAttackAt) continue;
    const dueIn = m.lastAttackAt + m.attackCooldown - serverNow;
    const wind = Math.min(WIND_MS, m.attackCooldown * 0.35);
    if (dueIn <= 0 || dueIn > wind) continue;
    if (state.castState.has(id) || hasWindup(scene, id)) continue;
    const me = state.sprite.get(id);
    const target = state.sprite.get(m.attackTargetId);
    if (!me || !target || !onCamera(scene, me.x, me.y)) continue;
    wound.set(id, m.lastAttackAt);
    pending.set(id, m.lastAttackAt + m.attackCooldown);
    const away = Math.sign(me.x - target.x || 1);
    if (m.isRanged) tweenPose(scene, id, { sx: 1.06, sy: 0.94, rot: 0 }, dueIn, 'Quad.easeOut');
    else tweenPose(scene, id, { sx: 0.95, sy: 1.06, rot: away * 0.12 }, dueIn, 'Quad.easeOut');
  }
  // Forget monsters that left the scene.
  for (const id of wound.keys()) {
    if (state.view.has(id)) continue;
    wound.delete(id);
    pending.delete(id);
  }
}

/**
 * The swing landed: snap out of the draw-back into the strike, then settle. Only
 * for a swing this module wound up (`woundAt` is the attack's PREVIOUS
 * `lastAttackAt`), so it never stomps a cast's own payoff pose.
 */
export function releaseAnticipation(
  scene: GameScene,
  id: string,
  woundAt: number,
  target: { x: number },
  ranged: boolean,
): void {
  if (woundFor.get(scene)?.get(id) !== woundAt) return;
  pendingFor.get(scene)?.delete(id);
  const me = scene.state.sprite.get(id);
  if (!me) return;
  const toward = Math.sign(target.x - me.x || 1);
  posePath(scene, id, [
    ranged
      ? { sx: 0.96, sy: 1.04, rot: 0, ms: 60, ease: 'Quad.easeIn' }
      : { sx: 1.07, sy: 0.94, rot: toward * 0.1, ms: 70, ease: 'Quad.easeIn' },
    { sx: 1, sy: 1, rot: 0, ms: 200, ease: 'Back.easeOut' },
  ]);
}
