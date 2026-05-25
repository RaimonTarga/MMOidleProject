import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { destroySprite } from './sprites';
import { destroyShadow } from './shadows';
import { destroyLabel } from './labels';
import { destroyHpBar } from './healthBars';
import { destroyCdBar } from './cooldownBars';
import { destroyEffectOverlays } from './effectOverlays';

export function destroyEntity(
  state: RenderState,
  id: string,
  scene: GameScene,
): void {
  const interp = state.interpolation.get(id);
  if (interp) scene.tweens.killTweensOf(interp);

  destroySprite(state, id);
  destroyShadow(state, id);
  destroyLabel(state, id);
  destroyHpBar(state, id);
  destroyCdBar(state, id);
  destroyEffectOverlays(state, id);

  state.ids.delete(id);
  state.kind.delete(id);
  state.snapshot.delete(id);
  state.transform.delete(id);
  state.interpolation.delete(id);
  state.spriteMeta.delete(id);
  state.debugRanges.delete(id);
}
