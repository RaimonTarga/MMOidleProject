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
 *             Staged in thirds, the same shape as `rampage-1..3` / `channel-1..3`.
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
  // Assassin — a 2.5s attack-speed burst. Pure state: on or off.
  'cooldown-overdrive': {
    kind: 'timed', color: 0xff6622, tint: 0xffb08a,
    minIntensity: 1.2, maxIntensity: 1.2,
  },
  // Stalwart — the Patience ramp filling over ~7s. Progression, and the only one
  // of these whose chip this pass had to add.
  'cooldown-patience': {
    kind: 'timed', color: 0xc8d8f0, tint: 0xe4eefb,
    minIntensity: 0.6, maxIntensity: 1.4,
  },
  // Invoker — 3 consecutive-discharge stacks.
  'energy-critical-mass': {
    kind: 'stacks', fullAt: 3, color: 0xff5577, tint: 0xffaabb,
    minIntensity: 0.7, maxIntensity: 1.6,
  },
  // Warmonger — attack speed ramping with every shot in the clip.
  'reload-hair-trigger': {
    kind: 'stacks', fullAt: 10, color: 0xffaa44, tint: 0xffd8a8,
    minIntensity: 0.6, maxIntensity: 1.5,
  },
  // Desperado — 5 momentum stacks that persist through a fight.
  'reload-momentum': {
    kind: 'stacks', fullAt: 5, color: 0xffcc44, tint: 0xffe9a8,
    minIntensity: 0.7, maxIntensity: 1.6,
  },
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
  // Server-set aura ids stay authoritative — they cover the states that are not
  // expressible as a single chip (Equinox's two phases, Aetherist's continuous
  // wave). Only when there is none do we derive one from the buff chips.
  if (!id) return buffAura(player);
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
