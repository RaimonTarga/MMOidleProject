import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { fxBite } from './bite';
import { DEPTH } from '../render/depth';

/**
 * SWAMP ability cues.
 *
 * Two hexers (Bog Witch's Wither, Mire Hexer's Plague Hex) were drawing the Ridge
 * Ambusher's arrow tracer, and — the worse case — all three Swamp bosses' pool-spawn
 * signature was landing as `strong-kick`, whose own source comment describes pale
 * STONE dust and flying chips. The lineage's entire identity is turning ground into
 * hazard, and it looked like a rock impact.
 *
 * Shared grammar: sickly green, and everything SETTLES rather than detonating. The
 * swamp accumulates; it does not spike.
 *
 * THE ONE EXCEPTION is the Bog Lurker's Deathroll (2026-09-12), whose cues converge
 * and commit instead — a coil that pulls inward, a leap, a furrow. That contrast is
 * deliberate: it is the single Swamp ability that happens to you all at once, and
 * drawing it in the biome's settling grammar would bury the only beat in the whole
 * roster a player has to react to rather than plan around.
 */

const ROT = 0x6f9e3c;
const ROT_DARK = 0x3d5a24;
const BILE = 0xb8d44a;

/** A slow curdling bolt that arcs to the target, for the hex casters. */
function hexBolt(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  core: number,
  glow: number,
): void {
  const bolt = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  bolt.fillStyle(glow, 0.45);
  bolt.fillCircle(0, 0, 11);
  bolt.fillStyle(core, 0.9);
  bolt.fillCircle(0, 0, 6);

  // Lobbed, not fired: rises then falls onto the target, which is why it uses a
  // two-stage tween rather than a straight line.
  const midX = (fromX + toX) / 2;
  const midY = Math.min(fromY, toY) - 42;
  scene.tweens.add({
    targets: bolt,
    x: midX,
    y: midY,
    duration: 150,
    ease: 'Quad.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: bolt,
        x: toX,
        y: toY,
        duration: 150,
        ease: 'Quad.easeIn',
        onComplete: () => {
          bolt.destroy();
          const splat = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
          splat.fillStyle(core, 0.5);
          splat.fillCircle(0, 0, 14);
          scene.tweens.add({
            targets: splat,
            alpha: 0,
            scaleX: 2.3,
            scaleY: 1.7,
            duration: 420,
            ease: 'Sine.easeOut',
            onComplete: () => splat.destroy(),
          });
          burstFx(scene, 'ptx-dot', toX, toY, 11, 560, {
            tint: core,
            speed: { min: 30, max: 110 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.7, end: 0 },
            alpha: { start: 0.9, end: 0 },
            gravityY: 90,
          });
        },
      });
    },
  });
}

/**
 * WITHER — the Bog Witch's anti-recovery hex. Grey-green and draining: motes are
 * pulled INWARD off the victim, because this cue's job is to say "your healing is
 * being taken away", not "you took a hit".
 */
export function fxWither(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  hexBolt(scene, fromX, fromY, toX, toY, 0x8a9a72, ROT_DARK);

  // Draining rings: contract onto the target after the bolt lands.
  scene.time.delayedCall(300, () => {
    for (let i = 0; i < 2; i++) {
      const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      ring.lineStyle(2.5, 0x8a9a72, 0.8);
      ring.strokeCircle(0, 0, 38);
      scene.tweens.add({
        targets: ring,
        scaleX: 0.2,
        scaleY: 0.2,
        alpha: 0,
        delay: i * 130,
        duration: 420,
        ease: 'Cubic.easeIn',
        onComplete: () => ring.destroy(),
      });
    }
  });
}

/** PLAGUE HEX — the Mire Hexer's poison-extending curse. Brighter and more toxic. */
export function fxPlagueHex(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  hexBolt(scene, fromX, fromY, toX, toY, BILE, ROT);

  // Bubbles rising off the landing — the swamp answering.
  scene.time.delayedCall(300, () => {
    burstFx(scene, 'ptx-dot', toX, toY, 9, 700, {
      tint: BILE,
      speed: { min: 15, max: 50 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.85, end: 0 },
      gravityY: -60,
    });
  });
}

/**
 * POOL SPAWN — the impact cue for the Swamp bosses' hazard-creating charged attacks
 * (Grave Toadeater's Bile Pool, Mire-Gorged Behemoth's Corrosive Pool, Rot-Spore
 * Croc-Behemoth's Spore Pool).
 *
 * Anchored on the PLANTED point, so it must read as "this ground is now bad" rather
 * than "something was struck here". The pool itself is a separate server-authoritative
 * ground zone; this is only the moment of its creation. So: no impact flash and no
 * shockwave — the surface swells, breaks, and settles into the footprint.
 */
export function fxPoolSpawn(scene: GameScene, x: number, y: number, radius: number): void {
  // The swell: one dome rising and flattening into the pool's real footprint, so the
  // cue's size teaches the hazard's size.
  const dome = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  dome.fillStyle(ROT, 0.55);
  dome.fillCircle(0, 0, radius * 0.45);
  dome.setScale(0.3, 0.2);
  scene.tweens.add({
    targets: dome,
    scaleX: 2.2,
    scaleY: 1.1,
    alpha: 0,
    duration: 620,
    ease: 'Sine.easeOut',
    onComplete: () => dome.destroy(),
  });

  // Rim creeping outward to the true radius — slow, so it reads as spreading liquid.
  const rim = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  rim.lineStyle(4, BILE, 0.8);
  rim.strokeEllipse(0, 0, radius * 1.4, radius * 0.7);
  rim.setScale(0.25);
  scene.tweens.add({
    targets: rim,
    scaleX: 1,
    scaleY: 1,
    alpha: 0,
    duration: 700,
    ease: 'Cubic.easeOut',
    onComplete: () => rim.destroy(),
  });

  // Gas breaking the surface: rises and lingers, unlike a spark spray.
  burstFx(scene, 'ptx-dot', x, y, 22, 900, {
    tint: BILE,
    speed: { min: 20, max: 90 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.1, end: 0 },
    alpha: { start: 0.8, end: 0 },
    gravityY: -70,
  });
  burstFx(scene, 'ptx-dot', x, y, 14, 700, {
    tint: ROT_DARK,
    speed: { min: 40, max: 140 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 40,
  });
}

/**
 * DEATHROLL, part one — the COIL. Played on the Bog Lurker's cast-start, anchored on
 * the lurker itself.
 *
 * This is the only beat the player gets to act on, so it has to read as "something in
 * the water is about to come out of it" from across the gap: the surface draws inward
 * (a body gathering, not an impact spreading), bubbles break where the jaws are, and
 * one taut ring marks the reach. Everything converges — the opposite grammar to the
 * settling, spreading cues the rest of the biome uses, because this is the one swamp
 * ability that spikes.
 */
export function fxDeathrollCoil(scene: GameScene, x: number, y: number): void {
  // Water pulled INWARD onto the lurker: the tell is a gathering, not a splash.
  for (let i = 0; i < 3; i++) {
    const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    ring.lineStyle(3, i === 0 ? BILE : ROT, 0.75);
    ring.strokeEllipse(0, 0, 150, 74);
    scene.tweens.add({
      targets: ring,
      scaleX: 0.28,
      scaleY: 0.28,
      alpha: 0,
      delay: i * 220,
      duration: 620,
      ease: 'Cubic.easeIn',
      onComplete: () => ring.destroy(),
    });
  }

  // Breath breaking the surface where the head is.
  burstFx(scene, 'ptx-dot', x, y, 16, 900, {
    tint: ROT_DARK,
    speed: { min: 10, max: 46 },
    angle: { min: 245, max: 295 },
    scale: { start: 0.85, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: -80,
  });
}

/**
 * DEATHROLL, part two — the LEAP. Played on cast-end, from the lurker to its victim.
 *
 * One committed line, not a projectile arc: the lunge is a body crossing a gap, so the
 * streak is thick, short-lived and travels at the speed the server moved the monster.
 * It ends on a bite rather than an impact flash, because what lands is jaws.
 */
export function fxDeathrollLunge(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const length = Math.hypot(toX - fromX, toY - fromY);

  // The wake of the launch: a wedge of displaced water torn open behind the leap.
  const wake = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  wake.fillStyle(ROT, 0.6);
  wake.fillTriangle(0, -17, 0, 17, length, 0);
  wake.setRotation(angle);
  scene.tweens.add({
    targets: wake,
    alpha: 0,
    duration: 300,
    ease: 'Quad.easeOut',
    onComplete: () => wake.destroy(),
  });

  // Muck thrown off the launch point — it came OUT of somewhere.
  burstFx(scene, 'ptx-dot', fromX, fromY, 18, 620, {
    tint: ROT_DARK,
    speed: { min: 70, max: 210 },
    angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0 },
    alpha: { start: 0.95, end: 0 },
    gravityY: 200,
  });

  // The jaws arriving. Heavy and swamp-coloured rather than the canine baseline.
  fxBite(scene, toX, toY, true, {
    weight: 1.9,
    fang: 0xe8e2c6,
    gore: ROT,
    gravityY: 150,
  });
}

/**
 * DEATHROLL, part three — the WAKE. Repeated at the victim's feet for as long as the
 * haul runs, so being dragged looks like being dragged rather than like sliding.
 *
 * Deliberately at the VICTIM and not between the two bodies: a tether line would imply
 * a leash the player could break, and the grip is not breakable — the crocodile is.
 * A furrow says "you are being moved through this" and nothing more.
 */
export function fxDragWake(scene: GameScene, x: number, y: number): void {
  const furrow = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  furrow.fillStyle(ROT_DARK, 0.55);
  furrow.fillEllipse(0, 6, 66, 22);
  scene.tweens.add({
    targets: furrow,
    scaleX: 1.5,
    alpha: 0,
    duration: 520,
    ease: 'Sine.easeOut',
    onComplete: () => furrow.destroy(),
  });

  burstFx(scene, 'ptx-dot', x, y, 7, 520, {
    tint: ROT,
    speed: { min: 25, max: 85 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 0.85, end: 0 },
    gravityY: 140,
  });
}

/**
 * DEATHROLL — where you are being TAKEN. One marker at the destination pool, drawn
 * the moment the jaws close.
 *
 * The haul itself is legible (you are moving and you did not ask to), but not its
 * endpoint, and the endpoint is the entire cost of the ability: a player who cannot
 * see which water they are bound for cannot judge whether to spend an interrupt on it.
 * Sized to the pool so the cue teaches the hazard's real footprint.
 */
export function fxDragDestination(
  scene: GameScene,
  x: number,
  y: number,
  durationMs: number,
): void {
  const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ring.lineStyle(4, BILE, 0.85);
  ring.strokeEllipse(0, 0, 210, 105);
  ring.setScale(1.35);
  scene.tweens.add({
    targets: ring,
    scaleX: 0.85,
    scaleY: 0.85,
    alpha: 0,
    // Contracts over the whole haul, so the cue expires as the victim arrives.
    duration: Math.max(400, durationMs),
    ease: 'Sine.easeInOut',
    onComplete: () => ring.destroy(),
  });
}
