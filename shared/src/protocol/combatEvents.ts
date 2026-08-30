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
  // `absorbed`/`evadedPartial`/`capped` are per-hit mitigation hints the
  // client uses to style the damage number: shield-absorbed amount renders a
  // separate blue shielded number (even when no HP was lost), a partial evade /
  // damage-cap trip restyles the HP number. Omitted when the mechanic didn't fire.
  | { kind: 'player-hit';  playerId: string; targetId: string; targetName: string; damage: number; empowered: boolean; execution: boolean; effects?: string[]; playerPos?: Vec2; targetPos?: Vec2; pelletIndex?: number; pelletTotal?: number; absorbed?: number; evadedPartial?: boolean; capped?: boolean }
  | { kind: 'player-kill'; playerId: string; targetId: string; targetName: string; damage: number; biomeXpGained: number; essenceGained: number; essenceType: EssenceType; empowered?: boolean; execution?: boolean }
  // A monster→player hit. Drives the player's incoming damage-number styling:
  // `empowered` enlarges it (a future monster "crit"), and the mitigation hints
  // (`absorbed`/`evadedPartial`/`capped`) mirror `player-hit`. Marks the
  // player as having taken a direct hit this snapshot (DoT element yields to it).
  // `damage` is the HP damage dealt (the number's amount still tracks the HP delta).
  | { kind: 'monster-hit'; targetId: string; empowered?: boolean; execution?: boolean; damage?: number; absorbed?: number; evadedPartial?: boolean; capped?: boolean }
  // A monster attack the player fully evaded (mitigation ≥ 1, zero damage). Renders
  // a "DODGE" floater over the player, mirroring `monster-dodge` for the reverse
  // direction. Partial evades stay on the damage number via `monster-hit.evadedPartial`.
  | { kind: 'player-evade'; playerId: string; targetPos?: Vec2 }
  // A damage-over-time tick on a monster. Used by the client only as a style hint
  // (color/glyph by element) for the HP-delta damage number — the amount shown is
  // still driven by the HP delta. `element` flavor only; non-elemental DoTs omit this event.
  // `fx` optionally requests a dedicated per-tick animation (beyond the element's
  // damage-number styling) — e.g. Cinder Lord's Conflagration burns. Omitted for
  // plain DoT ticks, which only style the number by element. `sourceId` attributes
  // owned ticks so a player's mechanic HUD never reacts to another player's DoT.
  | { kind: 'dot-tick'; targetId: string; targetPos: Vec2; amount: number; element: DamageElement; sourceType: DotTickSourceType; sourceId?: string; fx?: DotTickFx }
  | { kind: 'monster-dodge'; monsterId: string; targetPos?: Vec2 }
  // Player attack whiffed (chaotic weapon family's every-Nth-hit miss). Direct
  // damage was zeroed but on-hit effects (DoT) still applied; renders a "MISS"
  // floater over the target. Not gated by own-player id — shown to the node.
  | { kind: 'player-miss'; playerId: string; targetId: string; targetPos?: Vec2 }
  // Biome-ecology telegraph: a one-shot ring pulse at a monster's position, shown to
  // the whole node (not player-scoped). `pack-call` = a pack member alerting allies
  // (call-allies); `sun-mark` = a Desert marker painting its target; `frost-shatter` =
  // a Tundra ice-armor shell breaking (freezing shockwave); `death-empower` = a fallen
  // ally's necrotic surge; `raise-dead` = a necromancer pulling a corpse back up.
  // Purely cosmetic — the
  // underlying aggro/debuff/freeze is server-authoritative.
  // Ecology telegraphs — one-shot pulses at a monster, so a mechanic that is
  // otherwise invisible (an alpha calling, a shell closing, a screech going out)
  // gets a readable client beat without a per-tick networked flag.
  | {
      kind: 'ecology-pulse';
      monsterId: string;
      pos: Vec2;
      pulse:
        | 'pack-call'
        | 'sun-mark'
        | 'frost-shatter'
        | 'death-empower'
        | 'raise-dead'
        // Snapper lineage: retracting into / emerging from the shell.
        | 'shell-up'
        | 'shell-open'
        // Wasteland Carrion Vulture: the screech that hastens nearby undead.
        | 'ally-haste'
        // Chameleon / ambusher lineages: breaking concealment to attack.
        | 'reveal';
    }
  // Monster charged (cast-time) attack telegraph, shown to the whole node. `start`
  // opens a `castMs` cast bar over the monster (label = ability name). `end` clears
  // it: `fired` true ⇒ the charged shot landed (play the flashy FX toward `targetId`),
  // false ⇒ the wind-up was interrupted/aborted (just clear the bar). Purely cosmetic —
  // the damage + interrupt are server-authoritative. `fx` selects the charged-shot art.
  | { kind: 'monster-cast-start'; monsterId: string; castMs: number; label: string; fx?: string }
  | { kind: 'monster-cast-end'; monsterId: string; fired: boolean; targetId?: string; fx?: string }
  // Server forced the player to a new position (e.g. blunderbuss recoil). The
  // client owns own-player prediction, so it must be told to accept the move
  // even mid-movement; `pos` is the authoritative destination to slide to.
  | { kind: 'player-knockback'; playerId: string; pos: Vec2 }
  // A boss scripted-action cue, shown to the whole node (purely cosmetic). `slam`
  // is a telegraphed AoE ground-slam (`radius` in world units, `element` from the
  // boss's attackStyle tints the shockwave); `summon` marks an add-spawn beat at
  // the spawned mob's position (so each arrival can materialize visibly);
  // `shield` a barrier coming up; `morph` a shape/range flip. The damage/spawn/
  // shield are all server-authoritative — this only drives the animation.
  | { kind: 'boss-fx'; monsterId: string; pos: Vec2; fx: 'slam' | 'summon' | 'shield' | 'morph' | 'roar' | 'frenzy'; radius?: number; element?: string }
  // A self-facing Guard ability fired (Brace / Cleanse / Second Wind). Drives the
  // in-world Guard FX on the player's sprite, shown to the whole node so allies see
  // each other react. `ability` is the ability id; the client picks the FX by id.
  // Purely cosmetic — the buff/heal/cleanse is server-authoritative.
  | { kind: 'player-guard'; playerId: string; ability: string }
  // A Technique armed the player's next attack (`hasArmedAbility` attached). Drives
  // the armed telegraph over the player: a skill-name callout plus the cooldown bar
  // tinted red until the charge is consumed (the consuming `player-hit` carries an
  // ability client-effect tag which clears it). Purely cosmetic — the rider itself
  // is server-authoritative. Shown to the whole node, mirroring `player-guard`.
  | { kind: 'player-technique-armed'; playerId: string; ability: string }
  // A reposition Technique moved the player (Charge / Disengage). Both endpoints
  // are carried because a dash reads as a TRAIL: the client cannot reconstruct
  // where the player came from once the authoritative position has already
  // changed. Purely cosmetic — the movement is server-authoritative.
  | { kind: 'player-reposition'; playerId: string; ability: string; from: Vec2; to: Vec2 }
  // A casted Technique began its wind-up. Mirrors `monster-cast-start`: the client
  // shows a cast bar over the player for `castMs` plus a skill-name callout.
  | { kind: 'player-cast-start'; playerId: string; ability: string; castMs: number }
  // The wind-up ended. `fired: false` means it was interrupted by hard CC or lost
  // its target, so the client clears the bar without playing the resolve FX.
  // `targetPos` is present only when it fired, and is where the payload landed —
  // a cast resolves on its own target rather than riding an attack, so there is
  // no `player-hit` to hang its FX on.
  | { kind: 'player-cast-end'; playerId: string; ability: string; fired: boolean; targetPos?: Vec2 }
  // A Rune changed the player's active posture. The authoritative progression
  // delta carries the state; this event exists for immediate visual feedback.
  | { kind: 'stance-switch'; playerId: string; stanceId: string | null };
