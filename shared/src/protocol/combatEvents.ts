import type { EssenceType } from '../items';
import type { Vec2 } from '../systems/spatial';
import type { DamageElement } from '../systems/dotElements';

/** Dedicated per-tick DoT animations (distinct from element damage-number styling). */
export type DotTickFx = 'conflagration';

export type DotTickSourceType = 'class' | 'weapon' | 'monster' | 'special';

/**
 * Discrete combat events accumulated between broadcast ticks.
 * Bundled with each DeltaSnapshot so the client can fire animations and log
 * entries reliably even when logic ticks outrun broadcast ticks.
 */
export type CombatEvent =
  // `shieldAbsorbed`/`evadedPartial`/`capped` are per-hit mitigation hints the
  // client uses to style the damage number: shield-absorbed amount renders a
  // separate blue shielded number (even when no HP was lost), a partial evade /
  // damage-cap trip restyles the HP number. Omitted when the mechanic didn't fire.
  | { kind: 'player-hit';  playerId: string; targetId: string; targetName: string; damage: number; empowered: boolean; execution: boolean; effects?: string[]; playerPos?: Vec2; targetPos?: Vec2; pelletIndex?: number; pelletTotal?: number; shieldAbsorbed?: number; evadedPartial?: boolean; capped?: boolean }
  | { kind: 'player-kill'; playerId: string; targetId: string; targetName: string; damage: number; biomeXpGained: number; essenceGained: number; essenceType: EssenceType; empowered?: boolean; execution?: boolean }
  // A monster→player hit. Drives the player's incoming damage-number styling:
  // `empowered` enlarges it (a future monster "crit"), and the mitigation hints
  // (`shieldAbsorbed`/`evadedPartial`/`capped`) mirror `player-hit`. Marks the
  // player as having taken a direct hit this snapshot (DoT element yields to it).
  // `damage` is the HP damage dealt (the number's amount still tracks the HP delta).
  | { kind: 'monster-hit'; targetId: string; empowered?: boolean; execution?: boolean; damage?: number; shieldAbsorbed?: number; evadedPartial?: boolean; capped?: boolean }
  // A monster attack the player fully evaded (mitigation ≥ 1, zero damage). Renders
  // a "DODGE" floater over the player, mirroring `monster-dodge` for the reverse
  // direction. Partial evades stay on the damage number via `monster-hit.evadedPartial`.
  | { kind: 'player-evade'; playerId: string; targetPos?: Vec2 }
  // A damage-over-time tick on a monster. Used by the client only as a style hint
  // (color/glyph by element) for the HP-delta damage number — the amount shown is
  // still driven by the HP delta. `element` flavor only; non-elemental DoTs omit this event.
  // `fx` optionally requests a dedicated per-tick animation (beyond the element's
  // damage-number styling) — e.g. Cinder Lord's Conflagration burns. Omitted for
  // plain DoT ticks, which only style the number by element.
  | { kind: 'dot-tick'; targetId: string; targetPos: Vec2; amount: number; element: DamageElement; sourceType: DotTickSourceType; fx?: DotTickFx }
  | { kind: 'monster-dodge'; monsterId: string; targetPos?: Vec2 }
  // Player attack whiffed (chaotic weapon family's every-Nth-hit miss). Direct
  // damage was zeroed but on-hit effects (DoT) still applied; renders a "MISS"
  // floater over the target. Not gated by own-player id — shown to the node.
  | { kind: 'player-miss'; playerId: string; targetId: string; targetPos?: Vec2 }
  // Server forced the player to a new position (e.g. blunderbuss recoil). The
  // client owns own-player prediction, so it must be told to accept the move
  // even mid-movement; `pos` is the authoritative destination to slide to.
  | { kind: 'player-knockback'; playerId: string; pos: Vec2 };
