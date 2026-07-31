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
  // Equinox — opposed green (Charge) vs magenta (Discharge); vivid complementary
  // pair, distinct from the yellow/light-blue used by other auras.
  'equinox-charge':    { color: 0x44dd66, tint: 0xa8f0bb, intensity: 1.1 },
  'equinox-discharge': { color: 0xdd44cc, tint: 0xf0a8e6, intensity: 1.1 },
  // Stormbringer — electric indigo crackle while the empowered strikes last.
  'storm': { color: 0x8a5cff, tint: 0xc2aaff, intensity: 1.3 },
  // Berserker — Rampage, 3 stages by stack count (same staging as Channeler).
  // Deepening blood-red into hot orange as the stacks climb, so the ramp reads
  // as heat building rather than as a different state.
  'rampage-1': { color: 0xd23b3b, tint: 0xf0a8a8, intensity: 0.7 },
  'rampage-2': { color: 0xe8502a, tint: 0xf7b48f, intensity: 1.1 },
  'rampage-3': { color: 0xff7a1a, tint: 0xffcf9a, intensity: 1.6 },
};

interface AuraColors { color: number; tint: number; intensity: number }

function lerpColor(a: number, b: number, t: number): number {
  const k = Math.max(0, Math.min(1, t));
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * k);
  const g = Math.round(ag + (bg - ag) * k);
  const bl = Math.round(ab + (bb - ab) * k);
  return (r << 16) | (g << 8) | bl;
}

/**
 * Resolve a player's current aura colors. Most auras are static registry entries;
 * Aetherist ('aether') is DYNAMIC — a sun that shifts red→yellow and brightens as
 * energy (and thus attack power) climbs.
 */
export function resolveAuraColors(player: PlayerView): AuraColors | null {
  const id = player.aura;
  if (!id) return null;
  if (id === 'aether') {
    // Energy resets to 0 the tick it fills (the discharge arms), so treat
    // empowered-ready as full — otherwise the aura snaps to red at peak charge.
    const t = player.empoweredReady ? 1 : Math.max(0, Math.min(1, (player.energyCount ?? 0) / 100));
    return {
      color: lerpColor(0xff2a1a, 0xffd633, t),  // deep red → bright sun-yellow
      tint:  lerpColor(0xff7a5a, 0xffe699, t),
      intensity: 0.7 + 0.8 * t,                 // brighter/bigger at high energy
    };
  }
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
