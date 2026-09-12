import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

/**
 * MOUNTAIN ability cues — the stone family.
 *
 * `strong-kick` was the Cliff Hopper's charged shove and is genuinely right for it.
 * The problem was everything else borrowing it: five Ground Slams, four boss charge
 * lanes spanning every tier, and Crag Mortar's artillery, all drawing one boot.
 *
 * Shared grammar: grey stone, dust that FALLS, and weight expressed as a wide flat
 * ground ring rather than a bright core — the mountain is heavy, not energetic.
 */

const STONE = 0x8d9199;
const STONE_LIT = 0xd2d8de;
const DUST = 0xa89d8c;

/**
 * GROUND SLAM — the planted-slam impact shared by Cave Brute, Cave Troll, Cavern
 * Troll, Granite Titan and Mountain Colossus.
 *
 * Used as `aoe.impactFx`, so it is anchored on the planted circle and its size must
 * match the real footprint — the ring is drawn from the authored radius so the cue
 * teaches the hazard. Radial fissures make the slam read as the floor failing rather
 * than as a hit landing on a body.
 */
export function fxGroundSlam(scene: GameScene, x: number, y: number, radius: number): void {
  // Fissures cracking out along the ground. Built along local +x and rotated.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const len = radius * (0.55 + Math.random() * 0.4);
    const crack = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    crack.fillStyle(0x3a3a3a, 0.85);
    crack.fillTriangle(0, -4, len, 0, 0, 4);
    crack.fillStyle(DUST, 0.4);
    crack.fillTriangle(0, -2, len * 0.7, 0, 0, 2);
    // Flatten vertically so the fissure lies on the ground plane, then rotate.
    crack.setScale(1, 0.5);
    crack.setRotation(a);
    crack.setAlpha(0);
    scene.tweens.add({
      targets: crack,
      alpha: 1,
      duration: 90,
      ease: 'Quad.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: crack,
          alpha: 0,
          duration: 420,
          delay: 130,
          ease: 'Quad.easeIn',
          onComplete: () => crack.destroy(),
        });
      },
    });
  }

  const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ring.lineStyle(6, STONE_LIT, 0.9);
  ring.strokeEllipse(0, 0, radius * 1.4, radius * 0.7);
  ring.setScale(0.2);
  scene.tweens.add({
    targets: ring,
    scaleX: 1,
    scaleY: 1,
    alpha: 0,
    duration: 420,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });

  burstFx(scene, 'ptx-dot', x, y, 24, 700, {
    tint: DUST,
    speed: { min: 70, max: 210 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.15, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 210,
  });
  burstFx(scene, 'ptx-spark', x, y, 14, 520, {
    tint: STONE_LIT,
    speed: { min: 110, max: 280 },
    angle: { min: 220, max: 320 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 260,
  });
}

/**
 * CHARGE LANE — the release cue for the Mountain bosses' committed runs (Crag
 * Behemoth, Stoneplate Juggernaut, Crag-Gorged Horn-Behemoth, Iron-Crest Titan).
 *
 * These paint a lane 620–820px long, lock the line, and run it. Drawn on the CASTER
 * at the moment the lane locks: a forward-thrown dust plume plus stone shedding
 * backward off the body, so the cue says "this thing is about to cross the arena"
 * rather than "something was struck". The lane footprint itself is separate
 * server-published state; this is only the launch.
 */
export function fxChargeLane(scene: GameScene, x: number, y: number): void {
  // Backward-shedding grit: the body loading up.
  burstFx(scene, 'ptx-dot', x, y + 8, 18, 560, {
    tint: DUST,
    speed: { min: 60, max: 190 },
    angle: { min: 150, max: 210 },
    scale: { start: 1, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 200,
  });

  // Three stacked pressure arcs snapping outward from the chest.
  for (let i = 0; i < 3; i++) {
    const arc = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    arc.lineStyle(5 - i, i === 0 ? STONE_LIT : STONE, 0.85 - i * 0.2);
    arc.strokeEllipse(0, 0, 30 + i * 10, 46 + i * 14);
    scene.tweens.add({
      targets: arc,
      scaleX: 2.4,
      scaleY: 1.6,
      alpha: 0,
      delay: i * 80,
      duration: 420,
      ease: 'Cubic.easeOut',
      onComplete: () => arc.destroy(),
    });
  }

  // Hard stone flash at the feet — the push-off.
  const push = scene.add.graphics({ x, y: y + 12 }).setDepth(DEPTH.FX);
  push.fillStyle(STONE_LIT, 0.65);
  push.fillEllipse(0, 0, 56, 20);
  scene.tweens.add({
    targets: push,
    alpha: 0,
    scaleX: 2.2,
    duration: 300,
    ease: 'Quad.easeOut',
    onComplete: () => push.destroy(),
  });
}

/**
 * BOMBARDMENT — Crag Mortar's fixed-position artillery. A lobbed rock that falls
 * onto its painted circle; the mortar never moves, so the cue has to sell the ARC.
 */
export function fxBombardment(scene: GameScene, x: number, y: number, radius: number): void {
  const rock = scene.add.graphics({ x, y: y - 190 }).setDepth(DEPTH.FX);
  rock.fillStyle(STONE, 1);
  rock.fillCircle(0, 0, 11);
  rock.fillStyle(STONE_LIT, 0.4);
  rock.fillCircle(-3, -3, 5);
  scene.tweens.add({
    targets: rock,
    y,
    rotation: Math.PI * 1.5,
    duration: 300,
    ease: 'Quad.easeIn',
    onComplete: () => {
      rock.destroy();
      fxGroundSlam(scene, x, y, radius);
    },
  });
}
