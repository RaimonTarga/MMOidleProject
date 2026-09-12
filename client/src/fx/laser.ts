import type { PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import type { RenderState } from '../render/state';
import { DEPTH } from '../render/depth';
import { fxOverheatVent } from './overheatVent';

export function activateLaserBeam(state: RenderState, scene: GameScene, targetId: string): void {
  state.laserBeam.targetId = targetId;
  // Broadcasts arrive every ~200ms; keep the beam alive across snapshots.
  state.laserBeam.until = Date.now() + 320;

  if (!state.laserBeam.graphics) {
    state.laserBeam.graphics = scene.add.graphics().setDepth(DEPTH.FX);
  }
}

/**
 * Latch for the overheat EDGE. Only the local player ever has a laser beam
 * (`state.laserBeam` is singular), so one module-level flag is enough — and it
 * is reset below whenever the player stops being a Melter, so swapping character
 * or respeccing cannot leave it armed.
 */
let wasOverheated = false;

export function updateLaserBeam(state: RenderState, scene: GameScene): void {
  const beam = state.laserBeam;
  if (!beam.graphics) return;

  const now = Date.now();
  const ownSprite = state.ownId ? state.sprite.get(state.ownId) : undefined;
  const targetSprite = beam.targetId ? state.sprite.get(beam.targetId) : undefined;
  const player = state.ownId
    ? (state.view.get(state.ownId) as PlayerView | undefined)
    : undefined;

  const isMelter =
    !!player &&
    player.combatArchetype === 'reload' &&
    (player.passives['reload.laser'] ?? 0) > 0;

  // The beam just stopping was the only sign the weapon had locked itself out.
  // Fire the vent on the rising edge, wherever the player is standing — this
  // runs every frame, so it must not re-fire while heat stays pinned at 100%.
  if (isMelter && player.laserOverheated) {
    if (!wasOverheated && ownSprite) fxOverheatVent(scene, ownSprite.x, ownSprite.y);
    wasOverheated = true;
  } else if (!isMelter || !player.laserOverheated) {
    wasOverheated = false;
  }

  if (
    now > beam.until ||
    !ownSprite ||
    !targetSprite ||
    !isMelter ||
    player.laserOverheated
  ) {
    beam.graphics.clear();
    beam.targetId = null;
    return;
  }

  const fromX = ownSprite.x;
  const fromY = ownSprite.y;
  const toX = targetSprite.x;
  const toY = targetSprite.y;
  const pulse = 0.75 + Math.sin(now / 45) * 0.18;

  beam.graphics.clear();
  beam.graphics.lineStyle(10, 0xff5533, 0.16 * pulse);
  beam.graphics.lineBetween(fromX, fromY, toX, toY);
  beam.graphics.lineStyle(5, 0xffaa44, 0.34 * pulse);
  beam.graphics.lineBetween(fromX, fromY, toX, toY);
  beam.graphics.lineStyle(2, 0xffffdd, 0.92);
  beam.graphics.lineBetween(fromX, fromY, toX, toY);

  const impactRadius = 5 + Math.sin(now / 55) * 1.5;
  beam.graphics.fillStyle(0xffffcc, 0.7);
  beam.graphics.fillCircle(toX, toY, impactRadius);
  beam.graphics.fillStyle(0xff6633, 0.24);
  beam.graphics.fillCircle(toX, toY, impactRadius * 2.4);
}
