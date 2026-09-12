import type { DamageElement } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';
import { elementColor } from './elementTint';

/**
 * Per-tick FX for a damage-over-time element.
 *
 * The `dot-tick` branch in combatFx only ever drew three of the six elements —
 * `conflagration`, `lightning` (Tempest's storm) and `doom` (Cultist). Every
 * other DoT tick produced a damage NUMBER and nothing else, which is why
 * Hemomancer's bleed (a finisher that deals no direct damage at all, converting
 * 150% into a wound) had no visual presence whatsoever.
 *
 * These are deliberately SMALL. A tick fires roughly once a second per affected
 * target and there can be many affected targets at once, so each one is a single
 * short-lived mote plus a couple of particles — presence, not spectacle. The
 * application FX (`fxFireFlame`, `fxFrostSnowflake`, `fxPoisonSmog`) stay the
 * loud ones.
 *
 * Colours come from the shared element palette, so ticks, damage numbers and
 * weapon tints all agree.
 */

interface TickShape {
  /** Vertical drift: negative rises, positive falls. */
  drift: number;
  /** Particle gravity — bleed falls, smoke and embers rise. */
  gravity: number;
  draw: (g: Phaser.GameObjects.Graphics, color: number, radius: number) => void;
}

function drawBlob(
  g: Phaser.GameObjects.Graphics,
  color: number,
  radius: number,
): void {
  g.fillStyle(color, 0.85);
  g.fillCircle(0, 0, radius);
}

/** Four-spoke crystal: reads as ice at a handful of pixels where a blob doesn't. */
function drawCrystal(
  g: Phaser.GameObjects.Graphics,
  color: number,
  radius: number,
): void {
  g.lineStyle(1.5, color, 0.95);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4;
    g.lineBetween(
      -Math.cos(a) * radius,
      -Math.sin(a) * radius,
      Math.cos(a) * radius,
      Math.sin(a) * radius,
    );
  }
}

/** Teardrop: a blob with a tail pointing back the way it came. */
function drawDroplet(
  g: Phaser.GameObjects.Graphics,
  color: number,
  radius: number,
): void {
  g.fillStyle(color, 0.9);
  g.fillCircle(0, 0, radius);
  g.fillStyle(color, 0.55);
  g.fillTriangle(-radius * 0.6, 0, radius * 0.6, 0, 0, -radius * 2.1);
}

const SHAPE_BY_ELEMENT: Record<DamageElement, TickShape> = {
  // Blood runs down and pools.
  bleed: { drift: 16, gravity: 220, draw: drawDroplet },
  // Fumes rise off the wound.
  poison: { drift: -18, gravity: -40, draw: drawBlob },
  // Embers lift and die.
  fire: { drift: -20, gravity: -60, draw: drawBlob },
  // Frost settles.
  frost: { drift: 8, gravity: 40, draw: drawCrystal },
  // Both of these have bespoke tick FX and never reach here; present so the
  // record stays exhaustive and a future caller cannot hit an undefined shape.
  lightning: { drift: -12, gravity: 0, draw: drawBlob },
  doom: { drift: -14, gravity: -20, draw: drawBlob },
};

export function fxDotTick(
  scene: GameScene,
  x: number,
  y: number,
  element: DamageElement,
): void {
  const shape = SHAPE_BY_ELEMENT[element];
  if (!shape) return;
  const color = elementColor(element);

  // Scatter each tick a little, so a long DoT reads as a wound that keeps
  // weeping rather than as the same stamp blinking on a timer.
  const jitterX = (Math.random() - 0.5) * 16;
  const jitterY = (Math.random() - 0.5) * 10;
  const radius = 2.6 + Math.random() * 1.4;

  const g = scene.add
    .graphics({ x: x + jitterX, y: y + jitterY })
    .setDepth(DEPTH.FX);
  shape.draw(g, color, radius);
  scene.tweens.add({
    targets: g,
    y: g.y + shape.drift,
    alpha: 0,
    duration: 460,
    ease: 'Quad.easeOut',
    onComplete: () => g.destroy(),
  });

  burstFx(scene, 'ptx-dot', x + jitterX, y + jitterY, 2, 380, {
    tint: color,
    speed: { min: 12, max: 42 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.4, end: 0 },
    alpha: { start: 0.7, end: 0 },
    gravityY: shape.gravity,
  });
}
