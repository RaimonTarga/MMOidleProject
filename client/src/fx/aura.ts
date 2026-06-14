import type { PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import type { RenderState } from '../render/state';

/**
 * Auras — persistent transformation/state visuals for "state" classes. A player's
 * networked `aura` id (PlayerView.aura) maps here to a color used for both a soft
 * pulsing glow under the sprite (updatePlayerAuras) and a sprite tint (auraTint,
 * applied in render/players.ts). Add new state classes by adding an entry here and
 * setting the aura id server-side in views.ts.
 */
export const AURA_REGISTRY: Record<string, { color: number; tint: number; intensity: number }> = {
  // Surge / Overdrive — electric yellow.
  surge: { color: 0xffdd33, tint: 0xffe680, intensity: 1.0 },
  // Channeler — light blue, 3 ramping stages (size + brightness grow with stacks).
  'channel-1': { color: 0x88d8ff, tint: 0xcdeeff, intensity: 0.7 },
  'channel-2': { color: 0x55c2ff, tint: 0xa8e0ff, intensity: 1.1 },
  'channel-3': { color: 0x22aaff, tint: 0x88d4ff, intensity: 1.6 },
};

/** Sprite tint for an aura id, or null if unknown/none. */
export function auraTint(aura: string | null | undefined): number | null {
  if (!aura) return null;
  return AURA_REGISTRY[aura]?.tint ?? null;
}

/**
 * Draw/update a pulsing glow beneath every player that has an active aura, and tear
 * down the glow when the aura clears or the player leaves view.
 */
export function updatePlayerAuras(state: RenderState, scene: GameScene): void {
  const now = Date.now();

  for (const [id, view] of state.view) {
    if (state.kind.get(id) !== 'player') continue;
    const player = view as PlayerView;
    const auraId = player.aura ?? null;
    const def = auraId ? AURA_REGISTRY[auraId] : undefined;
    const sprite = state.sprite.get(id);

    let g = state.auras.get(id);
    if (!def || !sprite) {
      if (g) { g.destroy(); state.auras.delete(id); }
      continue;
    }
    if (!g) {
      g = scene.add.graphics();
      state.auras.set(id, g);
    }

    // Sit just behind the (y-sorted) sprite so it reads as a glow around the body.
    g.setDepth(sprite.depth - 1);
    const intensity = def.intensity;
    const pulse = 0.6 + Math.sin(now / 200) * 0.3;
    const r = (24 + Math.sin(now / 260) * 3) * (0.85 + 0.3 * intensity);
    g.clear();
    g.fillStyle(def.color, 0.10 * pulse * intensity);
    g.fillCircle(sprite.x, sprite.y, r * 1.5);
    g.fillStyle(def.color, 0.18 * pulse * intensity);
    g.fillCircle(sprite.x, sprite.y, r);
    g.lineStyle(2, def.color, Math.min(0.9, 0.5 * pulse * intensity));
    g.strokeCircle(sprite.x, sprite.y, r);
  }

  // Drop auras for players no longer in view.
  for (const [id, g] of state.auras) {
    if (!state.view.has(id)) { g.destroy(); state.auras.delete(id); }
  }
}
