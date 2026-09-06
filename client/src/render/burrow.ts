import type { MonsterView } from '@mmo-idle/shared';
import { getMonsterBurrowFrame } from '../sprites';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { atlasHasFrame } from './sprites';
import { burstFx } from '../fx/particles';
import { nodeToScene } from './sceneCoords';

/**
 * BURROW / STEALTH PRESENTATION.
 *
 * The server has always known a boss was underground — `IsConcealed` gates
 * targeting and damage — but that never reached the client, so the renderer drew
 * the body standing in the open and then teleported it across the arena. Nothing
 * about the sequence read as burrowing.
 *
 * What this module draws, in order: a cloud of dirt to break the silhouette, the
 * body dropping into the ground (a swap to the burrowed sprite where that art
 * exists, and a squashed, sunken, dimmed body where it does not), the mound
 * travelling — the ordinary interpolator does that for free now that the boss
 * WALKS to its emergence point rather than jumping there — and a second dirt cloud
 * as it comes back up.
 *
 * The transition is a STEP CHANGE hidden behind the cloud rather than a tween on
 * the sprite. Sprites here are destroyed and rebuilt whenever their frame changes,
 * so a tween holding a reference to one is a tween that strands its target
 * mid-flight; the dirt is what sells the cut, which is what dirt is for.
 */

/** How faded the body draws while it is under the ground. */
const SUBMERGED_ALPHA = 0.32;
/** Vertical squash on a body with no bespoke burrowed sprite. */
const SUBMERGED_SCALE_Y = 0.4;
/** How far into the ground the body sinks, in node px. */
const SUBMERGED_SINK_PX = 16;
/** Overhead bar / nameplate fade — present, but plainly out of reach. */
const SUBMERGED_BAR_ALPHA = 0.35;

const DIRT_TINTS = [0x6b5236, 0x8a6b46, 0x4a3a28, 0x9c8158];

/**
 * A burst of soil. Thrown outward and pulled back down, so it reads as earth
 * rather than as the generic radial puff every other effect in the game uses.
 *
 * Three layers, and the ORDER of their jobs matters. The body swap underneath is a
 * hard cut — sprites here are destroyed and rebuilt on a frame change, so nothing
 * can tween across it — which means the cloud is not decoration, it is the thing
 * that hides the cut. Sized up substantially on 2026-09-06: the old version threw
 * 28 small particles that had largely cleared before the swap happened, so the
 * player watched a 128px boss pop into a mound through a thin haze.
 *
 *   1. CORE — a dense, opaque, short-lived puff sitting right on the body. This is
 *      the one doing the obscuring; it is deliberately slow and big rather than
 *      fast and sparse, because a fast particle is somewhere else by the time the
 *      frame changes.
 *   2. THROWN SOIL — the readable earth, arced up and pulled back down.
 *   3. SKIRT — a low, wide, lingering wall of dust that covers the settle.
 *
 * Everything draws at `DEPTH.FX`, which sits above every y-sorted sprite band, so
 * the cloud is genuinely in front of the boss rather than around it.
 */
export function spawnDirtCloud(
  scene: GameScene,
  x: number,
  y: number,
  scale: number,
): void {
  // 1. CORE. Big, slow, opaque — the actual curtain over the sprite swap.
  burstFx(scene, 'ptx-dot', x, y, 16, 620, {
    speed: { min: 5 * scale, max: 40 * scale },
    angle: { min: 0, max: 360 },
    gravityY: 0,
    scale: { start: 2.6 * scale, end: 3.4 * scale },
    alpha: { start: 0.92, end: 0 },
    tint: DIRT_TINTS,
  });
  // 2. THROWN SOIL.
  burstFx(scene, 'ptx-dot', x, y, 34, 620, {
    speed: { min: 60 * scale, max: 230 * scale },
    angle: { min: 190, max: 350 },
    gravityY: 460,
    scale: { start: 0.85 * scale, end: 0.1 },
    alpha: { start: 0.95, end: 0 },
    tint: DIRT_TINTS,
    rotate: { min: 0, max: 360 },
  });
  // 3. SKIRT — spreads outward and lingers past the settle.
  burstFx(scene, 'ptx-dot', x, y, 24, 1_050, {
    speed: { min: 20 * scale, max: 95 * scale },
    angle: { min: 0, max: 360 },
    gravityY: 0,
    scale: { start: 1.4 * scale, end: 3.0 * scale },
    alpha: { start: 0.7, end: 0 },
    tint: 0x7a6244,
  });
}

/**
 * The body to draw while concealed, or null to keep the ordinary one.
 *
 * Resolved here and handed to the NORMAL frame pipeline in `upsertMonster` rather
 * than swapped behind its back: that pipeline rebuilds the sprite on every patch
 * whose frame differs, so a swap made outside it would be undone by the next
 * snapshot.
 */
export function concealedFrameOverride(
  monster: MonsterView,
  scene: GameScene,
): string | null {
  if (monster.concealed !== 'burrow') return null;
  const frame = getMonsterBurrowFrame(monster.monsterTypeId);
  if (!frame || !atlasHasFrame(scene, frame)) return null;
  return frame;
}

/**
 * Apply the submerged look. Idempotent on purpose — it runs on every patch, so a
 * sprite the frame pipeline rebuilt underneath us is corrected on the same
 * snapshot rather than left drawing as though it had surfaced.
 */
function applyConcealedLook(
  state: RenderState,
  id: string,
  size: number,
  usingBurrowArt: boolean,
): void {
  const sprite = state.sprite.get(id);
  if (sprite) {
    sprite.setAlpha(usingBurrowArt ? 1 : SUBMERGED_ALPHA);
    // A bespoke burrowed sprite is already drawn as a mound; squashing it too
    // would flatten art authored at the right proportions.
    //
    // Squash through DISPLAY SIZE rather than scale: the frame pipeline sizes
    // sprites the same way and re-applies it on every patch, so a scale factor
    // would be silently reset, and a non-square source frame does not have
    // scaleX === scaleY to restore from.
    if (!usingBurrowArt) sprite.setDisplaySize(size, size * SUBMERGED_SCALE_Y);
  }
  // The bar and nameplate stay, DIMMED. Removing them reads as a despawn, and the
  // player still needs to know the mound crossing the arena is the same boss with
  // the same health — it just cannot be reached. The faded state is the honest
  // rendering of "there, but out of reach".
  state.hpBar.get(id)?.setAlpha(SUBMERGED_BAR_ALPHA);
  state.label.get(id)?.setAlpha(SUBMERGED_BAR_ALPHA);
  state.shadow.get(id)?.setAlpha(0);
}

function clearConcealedLook(
  state: RenderState,
  id: string,
  size: number,
  monster: MonsterView,
): void {
  const sprite = state.sprite.get(id);
  if (sprite) {
    sprite.setAlpha(1);
    sprite.setDisplaySize(size, size);
  }
  state.hpBar.get(id)?.setAlpha(1);
  state.label.get(id)?.setAlpha(1);
  state.shadow.get(id)?.setAlpha(monster.isBoss ? 0.55 : 0.45);
}

/**
 * Reconcile a monster's concealment presentation against the broadcast state.
 *
 * Driven off the networked `concealed` marker rather than anything the client
 * derives, because concealment is a combat fact — it decides whether the boss can
 * be hit — and a renderer with its own opinion about it would eventually disagree
 * with the server about which of the two the player is looking at.
 *
 * MUST run after the frame pipeline for this patch, so the look lands on whichever
 * sprite object actually survived it.
 */
export function syncConcealment(
  state: RenderState,
  monster: MonsterView,
  scene: GameScene,
): void {
  const meta = state.spriteMeta.get(monster.id);
  if (!meta) return;

  const now = monster.concealed;
  const was = meta.concealed;
  const usingBurrowArt = concealedFrameOverride(monster, scene) !== null;
  const size = monster.isBoss ? 128 : 64;

  if (now === was) {
    if (now !== undefined) applyConcealedLook(state, monster.id, size, usingBurrowArt);
    return;
  }
  meta.concealed = now;

  // Thrown from where the body is DRAWN, not from the raw snapshot: the sprite
  // lags the server position by an interpolation step, and a cloud that misses
  // the thing it is supposed to obscure is worse than no cloud.
  const drawn = state.sprite.get(monster.id);
  const fallback = nodeToScene(monster.pos.x, monster.pos.y);
  const scenePos = drawn ? { x: drawn.x, y: drawn.y } : fallback;
  // A boss body is 128px against a monster's 64, so its curtain has to be wider
  // than proportional to actually cover the swap.
  const cloudScale = monster.isBoss ? 2 : 1;

  if (now !== undefined) {
    // GOING UNDER. Dirt first, so the body change happens behind it.
    if (now === 'burrow') spawnDirtCloud(scene, scenePos.x, scenePos.y, cloudScale);
    // Sink only the improvised form; bespoke burrow art sits at its own height.
    meta.visualOffsetY = usingBurrowArt ? undefined : SUBMERGED_SINK_PX;
    applyConcealedLook(state, monster.id, size, usingBurrowArt);
    return;
  }

  // SURFACING. The dirt is thrown from where it actually came up — which, now that
  // the boss travels rather than teleports, is somewhere the player has been
  // watching the mound approach.
  if (was === 'burrow') spawnDirtCloud(scene, scenePos.x, scenePos.y, cloudScale * 1.25);
  meta.visualOffsetY = undefined;
  clearConcealedLook(state, monster.id, size, monster);
}
