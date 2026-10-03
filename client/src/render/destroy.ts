import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { destroySprite } from './sprites';
import { destroyShadow } from './shadows';
import { destroyLabel } from './labels';
import { destroyHpBar } from './healthBars';
import { destroyCdBar } from './cooldownBars';
import { destroyCastBar } from './castBars';
import { destroySkillCallout } from './skillCallouts';
import { destroyEffectOverlays } from './effectOverlays';
import { destroyThoughtBubble } from './thoughtBubbles';
import { clearMovementEffectsForEntity } from './movementEffects';
import { endDetonateWindup } from '../fx/detonateWindup';
import { endAllyAoeFootprint } from '../fx/allyAoeFootprint';
import { clearBodyPose } from '../fx/bodyPose';
import { forgetCamouflage } from '../fx/camouflage';
import { forgetLasting } from '../fx/lineagePayloadStates';
import { shackleBreak } from '../fx/auraDefs';
import { shouldRunClientFx } from '../fx/guard';

export function destroyEntity(
  state: RenderState,
  id: string,
  scene: GameScene,
): void {
  const interp = state.interpolation.get(id);
  if (interp) {
    scene.tweens.killTweensOf(interp);
    scene.tweens.killTweensOf(interp.lungeOffset);
  }
  clearBodyPose(scene, id);
  // A lineage payload's lasting look on a body that left is forgotten; a shackle
  // still locked on a body that died breaks visibly where it was. A node change
  // pauses client FX, so it forgets quietly.
  for (const record of forgetLasting(id, performance.now())) {
    if (record.kind !== 'shackle' || record.lastX === undefined || record.lastY === undefined) continue;
    if (shouldRunClientFx()) shackleBreak(scene, record.lastX, record.lastY, record.lastW ?? 40, record.lastH ?? 40);
  }

  destroySprite(state, id);
  destroyShadow(state, id);
  destroyLabel(state, id);
  destroyHpBar(state, id);
  destroyCdBar(state, id);
  destroyCastBar(state, id);
  // Keyed by the CASTER, so a caster that leaves the node mid-cast takes its
  // wind-up with it. A destroyed TARGET needs no entry here: the draw pass
  // already stops drawing once the sprite is gone, and losing its target is
  // exactly what makes the server end the cast.
  endDetonateWindup(state, id);
  // Same rule for the friendly AoE footprint: keyed by the caster, so a caster
  // that dies or leaves the node mid-wind-up takes its circle with it.
  endAllyAoeFootprint(state, id);
  destroySkillCallout(state, id);
  destroyEffectOverlays(state, id);
  destroyThoughtBubble(state, id);

  state.ids.delete(id);
  state.kind.delete(id);
  state.entity.delete(id);
  state.view.delete(id);
  forgetCamouflage(id);
  state.transform.delete(id);
  state.interpolation.delete(id);
  state.remotePlayerPositions.delete(id);
  state.spriteMeta.delete(id);
  state.debugRanges.delete(id);
  state.ledgeHopNextAt.delete(id);
  state.techniqueArmed.delete(id);
  state.allyAoeFootprintPulse.delete(id);
  state.reloadTiming.delete(id);
  state.ambientStackFlash.delete(id);
  const frameCharge = state.frameChargeGlow.get(id);
  if (frameCharge?.graphics) frameCharge.graphics.destroy();
  state.frameChargeGlow.delete(id);
  clearMovementEffectsForEntity(state, id);
}
