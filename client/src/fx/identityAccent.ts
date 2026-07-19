import Phaser from 'phaser';
import type { PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import type { RenderState } from '../render/state';
import { ATLAS_KEY, getPlayerAccent } from '../sprites';

/**
 * Identity accents — persistent overlay sprites (halo, glyph, hand glow) that
 * express a player's range/path/tier identity without swapping the body sprite.
 * Sibling of fx/aura.ts: auras are transient combat-state glows driven by the
 * networked `aura` id; accents derive from unlocked skills via
 * PLAYER_ACCENTS/resolvePlayerAccent and persist as long as the choice does.
 * Registry is authored in shared/src/sprites/frameMaps.ts — an entry there is
 * all it takes for the overlay to render.
 */

const ACCENT_DISPLAY_SIZE = 64; // matches the player body display size

export function updateIdentityAccents(state: RenderState, scene: GameScene): void {
  for (const [id, view] of state.view) {
    if (state.kind.get(id) !== 'player') continue;
    const player = view as PlayerView;
    const sprite = state.sprite.get(id);
    const accent = player.isDead ? null : getPlayerAccent(player);

    let img = state.identityAccents.get(id);
    if (
      !accent ||
      !sprite ||
      !scene.textures.get(ATLAS_KEY).has(accent.frame)
    ) {
      if (img) {
        img.destroy();
        state.identityAccents.delete(id);
      }
      continue;
    }

    if (!img || img.frame.name !== accent.frame) {
      img?.destroy();
      img = scene.add
        .image(sprite.x, sprite.y, ATLAS_KEY, accent.frame)
        .setDisplaySize(ACCENT_DISPLAY_SIZE, ACCENT_DISPLAY_SIZE)
        .setBlendMode(Phaser.BlendModes.ADD);
      state.identityAccents.set(id, img);
    }
    if (accent.color !== undefined) img.setTint(accent.color);
    else img.clearTint();

    // Track the (y-sorted) body every frame; sit just above it so the overlay
    // reads as part of the character but under bars/labels.
    img.setPosition(sprite.x, sprite.y);
    img.setDepth(sprite.depth + 0.5);
  }

  for (const [id, img] of state.identityAccents) {
    if (!state.view.has(id)) {
      img.destroy();
      state.identityAccents.delete(id);
    }
  }
}
