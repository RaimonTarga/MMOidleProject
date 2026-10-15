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
export const AURA_REGISTRY: Record<string, { color: number; tint: number; intensity: number }> = {};

interface AuraColors { color: number; tint: number; intensity: number }

/**
 * Auras derived from a player's BUFF CHIPS rather than from a server-set aura id.
 *
 * An aura is a visual representation of a buff, so reading it straight off
 * `activeBuffs` makes that relationship structural: an aura cannot exist unless
 * its chip does, and the chip stays the authoritative readout. Nothing here ever
 * removes or replaces a chip.
 *
 * Two shapes, matching the two jobs an aura does:
 *
 *   'stacks'  PROGRESSION — the character visibly gains power as stacks climb.
 *             Staged in thirds.
 *   'timed'   STATE — a window is open or it is not. One look, no stages.
 *
 * Colours echo each chip's own colour so the glow and the chip agree on sight.
 * Cross-class collisions are fine (Assassin's orange vs Berserker's) because a
 * character only ever has one class.
 */
interface BuffAuraDef {
  kind: 'stacks' | 'timed';
  /** Stacks at which the ramp is considered full. Ignored for 'timed'. */
  fullAt?: number;
  color: number;
  tint: number;
  /** Intensity at the bottom of the ramp (or the flat value for 'timed'). */
  minIntensity: number;
  maxIntensity: number;
}

const BUFF_AURA_BY_ID: Record<string, BuffAuraDef> = {
};

/**
 * Highest-priority buff-derived aura for this player.
 *
 * Table order is the tiebreak when a build somehow carries two, which keeps the
 * glow stable instead of flickering between them frame to frame.
 */
function buffAura(player: PlayerView): AuraColors | null {
  for (const buff of player.activeBuffs ?? []) {
    const def = BUFF_AURA_BY_ID[buff.id];
    if (!def) continue;
    let t = 1;
    if (def.kind === 'stacks') {
      const full = Math.max(1, def.fullAt ?? 1);
      t = Math.max(0, Math.min(1, (buff.stacks ?? 0) / full));
    } else if (buff.durationPct >= 0) {
      // A ramp reports its FILL here, so a rising bar brightens the glow; a
      // countdown reports what is left, so it dims as the window closes. Both
      // read correctly from the same number.
      t = Math.max(0, Math.min(1, buff.durationPct / 100));
    }
    return {
      color: def.color,
      tint: def.tint,
      intensity: def.minIntensity + (def.maxIntensity - def.minIntensity) * t,
    };
  }
  return null;
}

/** Resolve a server-set aura, or derive one from the current buff chips. */
export function resolveAuraColors(player: PlayerView): AuraColors | null {
  const id = player.aura;
  // Server-set aura ids take priority over auras derived from buff chips.
  if (!id) return buffAura(player);
  const def = AURA_REGISTRY[id];
  return def ? { color: def.color, tint: def.tint, intensity: def.intensity } : null;
}

/** Sprite tint for a player's active aura, or null if none. */
export function auraTint(player: PlayerView): number | null {
  return resolveAuraColors(player)?.tint ?? null;
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
    const def = resolveAuraColors(player);
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
