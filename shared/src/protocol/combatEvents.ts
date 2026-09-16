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
export interface CombatEventTiming {
  /** Server occurrence time, not packet arrival time. Optional for older clients/fixtures. */
  at?: number;
  /** World-session ordering; shared by every viewer of the same event. */
  seq?: number;
}

export type CombatEvent = CombatEventTiming & CombatEventPayload;

type CombatEventPayload =
  // Damage-only presentation for paths without an attack/tick animation event.
  // Amount is finalized HP damage (including overkill), never a health authority.
  // `empowered` is crit STYLING only (yellow, enlarged, '!'), never a damage
  // layer — the same cosmetic use `player-hit` already makes of it. It exists
  // here because payloads that resolve through the AoE seam (Detonate) have no
  // `player-hit` to carry the flag on.
  | { kind: 'damage'; targetId: string; targetKind: 'player' | 'monster' | 'minion'; targetPos: Vec2; amount: number; category: 'direct' | 'dot'; element?: DamageElement; sourceId?: string; empowered?: boolean }
  // `absorbed`/`evadedPartial`/`capped` are per-hit mitigation hints the
  // client uses to style the damage number: shield-absorbed amount renders a
  // separate blue shielded number (even when no HP was lost), a partial evade /
  // damage-cap trip restyles the HP number. Omitted when the mechanic didn't fire.
  | { kind: 'player-hit';  playerId: string; targetId: string; targetName: string; damage: number; empowered: boolean; execution: boolean; effects?: string[]; playerPos?: Vec2; targetPos?: Vec2; pelletIndex?: number; pelletTotal?: number; absorbed?: number; evadedPartial?: boolean; capped?: boolean }
  | { kind: 'player-kill'; playerId: string; targetId: string; targetName: string; damage: number; biomeXpGained: number; essenceGained: number; essenceType: EssenceType; empowered?: boolean; execution?: boolean }
  // A monster→player hit. Drives the player's incoming damage-number styling:
  // `empowered` enlarges it (a future monster "crit"), and the mitigation hints
  // (`absorbed`/`evadedPartial`/`capped`) mirror `player-hit`.
  // `damage` drives the individual HP-damage number; amounts are never inferred
  // from snapshot HP changes.
  | { kind: 'monster-hit'; targetId: string; targetPos?: Vec2; empowered?: boolean; execution?: boolean; damage: number; absorbed?: number; evadedPartial?: boolean; capped?: boolean }
  // A monster attack the player fully evaded (mitigation ≥ 1, zero damage). Renders
  // a "DODGE" floater over the player, mirroring `monster-dodge` for the reverse
  // direction. Partial evades stay on the damage number via `monster-hit.evadedPartial`.
  | { kind: 'player-evade'; playerId: string; targetPos?: Vec2 }
  // A damage-over-time tick on a monster or player. Amount and element drive
  // an individual number, independently of direct hits in the same snapshot.
  // Non-elemental DoTs use the damage-only event with category `dot`.
  // `fx` optionally requests a dedicated per-tick animation (beyond the element's
  // damage-number styling) — e.g. Cinder Lord's Conflagration burns. Omitted for
  // plain DoT ticks, which only style the number by element. `sourceId` attributes
  // owned ticks so a player's mechanic HUD never reacts to another player's DoT.
  | { kind: 'dot-tick'; targetId: string; targetPos: Vec2; amount: number; absorbed?: number; element: DamageElement; sourceType: DotTickSourceType; sourceId?: string; fx?: DotTickFx }
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
  | { kind: 'monster-cast-end'; monsterId: string; fired: boolean; targetId?: string; pos?: Vec2; radius?: number; fx?: string }
  // DEATHROLL DRAG telegraph, shown to the whole node. A monster has a player in its
  // jaws and is hauling them back to its lair. `start` fires once with `pos` at the
  // DESTINATION and `durationMs` the length of the haul, so the client can draw where
  // the victim is being taken; `wake` repeats on a fixed cadence with `pos` at the
  // VICTIM, drawing the furrow they are being pulled through; `end` clears the cue.
  // Purely cosmetic — the root, the haul and the release are server-authoritative,
  // and the victim's every step also arrives as a `player-knockback`.
  | {
      kind: 'monster-drag';
      monsterId: string;
      playerId: string;
      pos: Vec2;
      durationMs: number;
      phase: 'start' | 'wake' | 'end';
    }
  // Server forced the player to a new position (e.g. blunderbuss recoil). The
  // client owns own-player prediction, so it must be told to accept the move
  // even mid-movement; `pos` is the authoritative destination to slide to.
  // `reason` says WHY the player moved, so the client can distinguish being shoved
  // from being dragged — two very different things to be on the receiving end of.
  // Absent on legacy emitters, which are all knockback.
  | { kind: 'player-knockback'; playerId: string; pos: Vec2; reason?: 'knockback' | 'pull' }
  // A boss scripted-action cue, shown to the whole node (purely cosmetic). `slam`
  // is a telegraphed AoE ground-slam (`radius` in world units, `element` from the
  // boss's attackStyle tints the shockwave); `summon` marks an add-spawn beat at
  // the spawned mob's position (so each arrival can materialize visibly);
  // `shield` a barrier coming up; `morph` a shape/range flip. The damage/spawn/
  // shield are all server-authoritative — this only drives the animation.
  // `stagger` is the authored recovery cue: the boss is visibly out of it and open
  // to punishment. It is a distinct FX from the others because the player has to be
  // able to tell "it is winding up again" from "hit it NOW".
  | { kind: 'boss-fx'; monsterId: string; pos: Vec2; fx: 'slam' | 'summon' | 'shield' | 'morph' | 'roar' | 'frenzy' | 'stagger'; radius?: number; element?: string }
  // A self-facing Guard ability fired (Brace / Cleanse / Second Wind). Drives the
  // in-world Guard FX on the player's sprite, shown to the whole node so allies see
  // each other react. `ability` is the ability id; the client picks the FX by id.
  // Purely cosmetic — the buff/heal/cleanse is server-authoritative.
  | { kind: 'player-guard'; playerId: string; ability: string }
  // A Slinger entered the authoritative reload lifecycle. Drives the same
  // node-wide overhead callout used by player abilities; reload timing itself
  // remains authoritative state and is rendered separately on the overhead bar.
  | { kind: 'player-reload-start'; playerId: string; reloadMs: number }
  // A Technique armed the player's next attack (`hasArmedAbility` attached). Drives
  // the armed telegraph over the player: a skill-name callout plus the cooldown bar
  // tinted red until the charge is consumed (the consuming `player-hit` carries an
  // ability client-effect tag which clears it). Purely cosmetic — the rider itself
  // is server-authoritative. Shown to the whole node, mirroring `player-guard`.
  // `durationMs` is present only for a self-facing INSTANT Technique that opens a
  // timed window (Frenzy). The client uses it to run a sustained in-world cue for
  // exactly as long as the buff really lasts. Without it the only cue was a
  // ~300 ms burst standing in for a four-second window, which read as the
  // ability doing nothing at all.
  | {
      kind: 'player-technique-armed';
      playerId: string;
      ability: string;
      durationMs?: number;
    }
  // A reposition Technique moved the player (Charge / Disengage). Both endpoints
  // are carried because a dash reads as a TRAIL: the client cannot reconstruct
  // where the player came from once the authoritative position has already
  // changed. Purely cosmetic — the movement is server-authoritative.
  | { kind: 'player-reposition'; playerId: string; ability: string; from: Vec2; to: Vec2 }
  // A casted Technique began its wind-up. Mirrors `monster-cast-start`: the client
  // shows a cast bar over the player for `castMs` plus a skill-name callout.
  //
  // `targetId` names the monster the wind-up is aimed at, so a per-ability
  // wind-up FX can TRACK it for the whole cast rather than being pinned to a
  // stale point — a two-second wind-up outlives any position snapshot. Absent on
  // a self-cast, which has no target. `element` is the wind-up's cosmetic colour,
  // supplied only by abilities that have one to give (Detonate resolves it from
  // the afflictions it is about to consume). When either field is absent the
  // client draws no wind-up at all and keeps the bare cast bar, rather than
  // inventing a default colour that would be a lie about what is on the target.
  | { kind: 'player-cast-start'; playerId: string; ability: string; castMs: number; targetId?: string; element?: DamageElement }
  // The wind-up ended. `fired: false` means it was interrupted by hard CC or lost
  // its target, so the client clears the bar without playing the resolve FX.
  // `targetPos` is present only when it fired, and is where the payload landed —
  // a cast resolves on its own target rather than riding an attack, so there is
  // no `player-hit` to hang its FX on.
  | { kind: 'player-cast-end'; playerId: string; ability: string; fired: boolean; targetPos?: Vec2 }
  // Contagion copied afflictions outward. Carries the SOURCE point and one link
  // per (victim × distinct element), so a target carrying both a burn and a
  // poison draws two differently-coloured tendrils to each new host rather than
  // one averaged line. The client cannot reconstruct any of this: the copies are
  // status effects, which are server-only state and never networked.
  | {
      kind: 'dot-spread';
      playerId: string;
      from: Vec2;
      links: Array<{ to: Vec2; element: DamageElement }>;
    }
  // Detonate consumed afflictions for a burst. `element` is whichever element was
  // owed the most damage, so the explosion is tinted by what actually did the
  // work. The damage number comes from the AoE damage event — this only drives
  // the animation.
  | { kind: 'dot-detonate'; playerId: string; pos: Vec2; element: DamageElement }
  // A Rune changed the player's active posture. The authoritative progression
  // delta carries the state; this event exists for immediate visual feedback.
  | { kind: 'stance-switch'; playerId: string; stanceId: string | null };
