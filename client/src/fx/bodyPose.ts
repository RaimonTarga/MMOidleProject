/**
 * BODY POSE — procedural body motion on an entity's existing sprite: anticipation
 * crouches, mid-air stretch, landing squash, leans and trembles.
 *
 * The frame pipeline resizes (and on a frame change, REBUILDS) sprites on every
 * 5 Hz patch, so a tween on `sprite.scaleX` is undone within 200ms. A pose is
 * therefore a separate record that the render loop applies ON TOP of whatever
 * size the pipeline last set (`applyBodyPose`, called from `stepInterpolation`
 * after positioning). Tweens target the pose record, never the sprite.
 *
 * Sprites are centre-origin, so a squash is compensated downward to keep the feet
 * planted; `lift` raises the body (a leap) without moving its logical position.
 */
import type { GameScene } from '../scenes/GameScene';

export interface BodyPose {
  /** Width / height multipliers over the pipeline's size. 1 = at rest. */
  sx: number;
  sy: number;
  /** Radians. */
  rot: number;
  /** Scene px the body is raised above its feet (a leap). */
  lift: number;
  /** Random per-frame jitter amplitude in px (a frenzied tremble). */
  tremble: number;
  /** Scale the pose was last applied over, to detect a pipeline reset. */
  baseX: number;
  baseY: number;
  lastX: number;
  lastY: number;
}

const poses = new WeakMap<GameScene, Map<string, BodyPose>>();

function scenePoses(scene: GameScene): Map<string, BodyPose> {
  let map = poses.get(scene);
  if (!map) {
    map = new Map();
    poses.set(scene, map);
  }
  return map;
}

/** The entity's pose record, created at rest on first use. */
export function bodyPose(scene: GameScene, id: string): BodyPose {
  const map = scenePoses(scene);
  let pose = map.get(id);
  if (!pose) {
    pose = { sx: 1, sy: 1, rot: 0, lift: 0, tremble: 0, baseX: 0, baseY: 0, lastX: NaN, lastY: NaN };
    map.set(id, pose);
  }
  return pose;
}

function atRest(pose: BodyPose): boolean {
  return (
    Math.abs(pose.sx - 1) < 0.002 &&
    Math.abs(pose.sy - 1) < 0.002 &&
    Math.abs(pose.rot) < 0.002 &&
    Math.abs(pose.lift) < 0.2 &&
    pose.tremble <= 0
  );
}

type PoseTarget = Partial<Pick<BodyPose, 'sx' | 'sy' | 'rot' | 'lift'>>;

/** Tween the pose toward `to`. Kills any pose tween already running. */
export function tweenPose(
  scene: GameScene,
  id: string,
  to: PoseTarget,
  duration: number,
  ease = 'Quad.easeOut',
  delay = 0,
): Phaser.Tweens.Tween {
  const pose = bodyPose(scene, id);
  scene.tweens.killTweensOf(pose);
  return scene.tweens.add({ targets: pose, ...to, duration, ease, delay });
}

/** Spring back to rest with a little overshoot: the settle after any action. */
export function releasePose(scene: GameScene, id: string, duration = 320, delay = 0): void {
  tweenPose(scene, id, { sx: 1, sy: 1, rot: 0, lift: 0 }, duration, 'Back.easeOut', delay);
}

/**
 * A chain of pose keyframes, each tweened from the previous one. Used for the
 * multi-beat moves (crouch -> leap -> land -> settle) so the beats cannot overlap.
 */
export function posePath(
  scene: GameScene,
  id: string,
  keys: Array<PoseTarget & { ms: number; ease?: string }>,
): void {
  const pose = bodyPose(scene, id);
  scene.tweens.killTweensOf(pose);
  scene.tweens.chain({
    targets: pose,
    tweens: keys.map(({ ms, ease, ...to }) => ({ ...to, duration: ms, ease: ease ?? 'Quad.easeOut' })),
  });
}

/** Set (or clear, with 0) a continuous tremble. */
export function setTremble(scene: GameScene, id: string, amplitudePx: number): void {
  const pose = scenePoses(scene).get(id);
  if (!pose && amplitudePx <= 0) return;
  bodyPose(scene, id).tremble = amplitudePx;
}

/**
 * Per frame, after the sprite was positioned: layer the pose over the size the
 * frame pipeline set. Drops the record once it is back at rest.
 */
export function applyBodyPose(
  scene: GameScene,
  id: string,
  sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle,
): void {
  const map = poses.get(scene);
  const pose = map?.get(id);
  if (!pose) return;

  // The pipeline reset the scale (a patch or a rebuilt sprite): that is the new base.
  if (Number.isNaN(pose.lastX) || Math.abs(sprite.scaleX - pose.lastX) > 1e-4) pose.baseX = sprite.scaleX;
  if (Number.isNaN(pose.lastY) || Math.abs(sprite.scaleY - pose.lastY) > 1e-4) pose.baseY = sprite.scaleY;

  if (atRest(pose) && !scene.tweens.isTweening(pose)) {
    sprite.setScale(pose.baseX, pose.baseY);
    sprite.setRotation(0);
    map!.delete(id);
    return;
  }

  sprite.setScale(pose.baseX * pose.sx, pose.baseY * pose.sy);
  sprite.setRotation(pose.rot);
  pose.lastX = sprite.scaleX;
  pose.lastY = sprite.scaleY;
  // Keep the feet planted under a squash, then raise by the lift.
  const restHeight = sprite.height * pose.baseY;
  const feet = (restHeight - restHeight * pose.sy) / 2;
  const jitterX = pose.tremble > 0 ? (Math.random() * 2 - 1) * pose.tremble : 0;
  const jitterY = pose.tremble > 0 ? (Math.random() * 2 - 1) * pose.tremble * 0.5 : 0;
  sprite.setPosition(sprite.x + jitterX, sprite.y + feet - pose.lift + jitterY);
}

/** Forget an entity's pose (it left the scene). */
export function clearBodyPose(scene: GameScene, id: string): void {
  const pose = poses.get(scene)?.get(id);
  if (pose) scene.tweens.killTweensOf(pose);
  poses.get(scene)?.delete(id);
}

/**
 * AFTERIMAGES — fading copies of the body left along its path while it moves
 * fast (a pounce, a dash). Copies the live texture and frame each beat, so an
 * animated body leaves the pose it was in.
 */
export function afterimages(
  scene: GameScene,
  id: string,
  opts: { count: number; everyMs: number; tint: number; alpha?: number; fadeMs?: number },
): void {
  for (let i = 0; i < opts.count; i++) {
    scene.time.delayedCall(i * opts.everyMs, () => {
      if (document.hidden) return;
      const body = scene.state.sprite.get(id);
      if (!body || !('texture' in body) || !body.visible) return;
      const ghost = scene.add
        .image(body.x, body.y, body.texture.key, body.frame.name)
        .setScale(body.scaleX, body.scaleY)
        .setRotation(body.rotation)
        .setFlipX(body.flipX)
        .setDepth(body.depth - 0.01)
        .setTintFill(opts.tint)
        .setAlpha(opts.alpha ?? 0.45)
        .setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: ghost,
        alpha: 0,
        duration: opts.fadeMs ?? 260,
        ease: 'Quad.easeIn',
        onComplete: () => ghost.destroy(),
      });
    });
  }
}
