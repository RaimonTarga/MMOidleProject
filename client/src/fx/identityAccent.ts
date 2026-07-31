import Phaser from 'phaser';
import type { PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import type { RenderState } from '../render/state';
import { headAnchorFor } from '@mmo-idle/shared';
import { ATLAS_KEY, getPlayerAccent, getPlayerFrame } from '../sprites';

/**
 * Identity accents — small props seated on a player's HEAD that express their
 * range/path/tier identity without swapping the body sprite.
 *
 * Sibling of fx/aura.ts, and deliberately kept out of its way: auras are
 * transient combat-state glows ON the body (surge, channel stages, equinox,
 * storm) driven by the networked `aura` id. Accents are permanent and derived
 * from unlocked skills, so they must not use the same visual channel — a
 * permanent body glow would compete with the vocabulary that signals "something
 * is happening right now". Two earlier designs were rejected for that reason
 * (body glow) and for being too easy to miss (ground stance ring).
 *
 * Props are generated separately on transparent backgrounds
 * (art/manifests/accents.json) and seated on the crown using baked per-body
 * anchors, so they never cover the hood/great helm/mask that gives each class
 * its identity. This is not the part-compositing the design docs rejected:
 * that failed because EXTRACTING parts out of whole-canvas img2img output
 * yields noise, whereas measuring where a head is and placing a prop there is
 * tractable — the anchor spread across all 24 bodies is only ~3px.
 *
 * Registry is authored in shared/src/sprites/frameMaps.ts — an entry there is
 * all it takes for the prop to render.
 */

/** Body sprites are authored 64px and displayed at 64px, so body-frame pixels
 *  map 1:1 to display pixels and the baked anchors need no scaling. */
const BODY_FRAME_SIZE = 64;
/** Accent props are authored 32px (art/manifests/accents.json). */
const ACCENT_DISPLAY_SIZE = 32;
/** Sink the prop slightly into the crown so it reads as worn, not hovering. */
const ACCENT_SEAT_PX = 2;

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
        .setDisplaySize(ACCENT_DISPLAY_SIZE, ACCENT_DISPLAY_SIZE);
      state.identityAccents.set(id, img);
    }
    if (accent.color !== undefined) img.setTint(accent.color);
    else img.clearTint();

    // Seat the prop on the head: its bottom-centre goes to the body's baked head
    // anchor (shared/src/sprites/headAnchors.ts, produced by
    // art/workbench/accents/anchors.mjs). Anchors are in 64px body-frame pixels
    // measured from the top-left; the sprite is drawn centred, so convert to an
    // offset from the body's centre. Flipped bodies mirror the horizontal offset.
    const anchor = headAnchorFor(getPlayerFrame(player));
    // Bodies render as Image|Sprite; a Rectangle placeholder has no flip state.
    const flipX = 'flipX' in sprite ? sprite.flipX : false;
    const dir = flipX ? -1 : 1;
    const dx = (anchor.x - BODY_FRAME_SIZE / 2) * dir;
    const dy = anchor.y - BODY_FRAME_SIZE / 2;
    img.setPosition(
      sprite.x + dx,
      sprite.y + dy - ACCENT_DISPLAY_SIZE / 2 + ACCENT_SEAT_PX,
    );
    img.setFlipX(flipX);
    // Just above the body so the crest sits over the crown, but still under the
    // HUD bars/labels that draw further up the depth range.
    img.setDepth(sprite.depth + 0.5);
  }

  for (const [id, img] of state.identityAccents) {
    if (!state.view.has(id)) {
      img.destroy();
      state.identityAccents.delete(id);
    }
  }
}
