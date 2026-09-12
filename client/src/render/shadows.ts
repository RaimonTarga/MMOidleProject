import type { Vec2 } from '@mmo-idle/shared';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from './depth';
import { nodeToSceneX, nodeToSceneY } from './sceneCoords';
import { getShadowDef } from './shadowDefs';

const SHADOW_WIDTH_PAD = 1.05;
const SHADOW_FLATTEN = 0.32;
const SHADOW_FALLBACK_W_RATIO = 0.8;
const SHADOW_FALLBACK_H_RATIO = 0.18;
const PLAYER_MIN_SHADOW_W = 52;
const PLAYER_MIN_SHADOW_H = 14;

// Player tier used to be shown as a bright colored ring on this ground shadow.
// That read as an obvious targeting/debug circle, so tier now shows as a quiet
// rim on the sprite itself instead — see TIER_OUTLINE_* in render/sprites.ts
// and its use in render/players.ts. The shadow stays a plain ground fill.
export function ensureShadow(
  state: RenderState,
  id: string,
  pos: Vec2,
  scene: GameScene,
  opts?: { fillColor?: number; fillAlpha?: number },
): void {
  if (state.shadow.has(id)) return;

  const shadow = scene.add
    .ellipse(nodeToSceneX(pos.x), nodeToSceneY(pos.y), 1, 1)
    .setDepth(DEPTH.SHADOW);

  shadow.setFillStyle(opts?.fillColor ?? 0x000000, opts?.fillAlpha ?? 0.45);

  state.shadow.set(id, shadow);
}

export function drawShadows(state: RenderState): void {
  for (const id of state.ids) {
    const sprite = state.sprite.get(id);
    const shadow = state.shadow.get(id);
    const interp = state.interpolation.get(id);
    const meta = state.spriteMeta.get(id);
    if (!sprite || !shadow || !interp || !meta) continue;

    const def = getShadowDef(meta.currentFrame);

    let shadowW: number;
    let shadowH: number;
    let footPx: number;

    if (def && def.sourceW > 0) {
      const scale = sprite.displayWidth / def.sourceW;
      shadowW = def.halfWAtFoot * 2 * scale * SHADOW_WIDTH_PAD;
      shadowH = shadowW * SHADOW_FLATTEN;
      footPx = def.footY * scale;
    } else {
      shadowW = sprite.displayWidth * SHADOW_FALLBACK_W_RATIO;
      shadowH = sprite.displayHeight * SHADOW_FALLBACK_H_RATIO;
      footPx = sprite.displayHeight * 0.5;
    }

    if (state.kind.get(id) === 'player') {
      shadowW = Math.max(shadowW, PLAYER_MIN_SHADOW_W);
      shadowH = Math.max(shadowH, PLAYER_MIN_SHADOW_H);
    }

    // Sprite position includes client visualOffsetY; place shadow at visual feet.
    const footY = sprite.y + footPx;
    shadow.setSize(shadowW, shadowH);
    shadow.setScale(1);
    shadow.setPosition(sprite.x, footY);
    shadow.setDepth(DEPTH.SHADOW + footY);
  }
}

export function destroyShadow(state: RenderState, id: string): void {
  state.shadow.get(id)?.destroy();
  state.shadow.delete(id);
}
