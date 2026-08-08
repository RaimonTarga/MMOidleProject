import type { EssenceType } from '../../items';
import type { Vec2 } from '../../systems/spatial';
import type { DamageElement } from '../../systems/dotElements';
import type { MonsterBehavior } from './behavior';

// ── Boss script types ─────────────────────────────────────────────────────────

/**
 * All actions a boss can take, as a discriminated union.
 *
 *   enrage    — multiply attack and accelerate attack cooldown for durationMs (or rest-of-fight).
 *   regen     — restore hpPctPerSec × maxHp HP per second for durationMs (or rest-of-fight).
 *   shield    — add drAdd to damageReduction for durationMs (cyclic, always timed).
 *   summon    — spawn `count` minions of monsterTypeId near the boss.
 *   stat-buff — multiply a single stat for durationMs (or rest-of-fight).
 *   morph     — SET (not multiply) non-numeric combat fields: isRanged, attackStyle,
 *               attackRange, dotEffect, kite. Lets a boss flip stance mid-fight
 *               (e.g. melee → ranged kiter at 50% HP). Each field is independent and
 *               optional; only provided fields change. `dotEffect: null` clears an
 *               existing DoT override. To kite after a flip, set `kite: true` AND
 *               extend `attackRange` (the standoff band scales off the live range).
 *   slam      — instant AoE burst centered on the boss, hitting all players AND
 *               enemy summons within `radius`. Pure damage (no slow/DoT). Pair with
 *               a RepeatingAction to slam every N seconds. `damageMult` scales off
 *               the boss's current attack (default 1.0).
 *
 *   apply-shield   — gain a runtime enemyShield override mid-fight (same mechanic as
 *               the static MonsterDefinition.enemyShield). The barrier comes up on the
 *               next incoming hit. Permanent until shed-defense / boss death.
 *   apply-soft-cap — gain a runtime enemySoftCap override mid-fight (same mechanic as
 *               the static MonsterDefinition.enemySoftCap). Permanent until shed.
 *   shed-defense   — drop ALL active defenses: clears the runtime shield/soft-cap
 *               overrides AND suppresses any static enemyShield/enemySoftCap, then
 *               reduces current plating to ~20%. The desperation finale. Pair with an
 *               explicit slam in the same phase for the transition impact.
 *   modify-ramp-debuff — raise the caps on this boss's rampDebuff. Patches live
 *               frost-ramp stacks on players in-node and all future applications.
 *   spawn-adds     — spawn a burst of trash adds near the boss (same as summon) and
 *               track them so they are despawned when the boss dies. `maxAlive` caps
 *               the tracked living adds: a repeating spawn-adds tops the swarm back up
 *               to (not past) the cap, so a long-lived summoner (e.g. a graveyard
 *               necromancer with this on a repeating timer) can never flood the node.
 *
 * `stat-buff` supports `evasion` in addition to the entity stats: it multiplies the
 * boss's effective per-hit dodge fraction via a runtime override (mult 0 = stop
 * dodging entirely).
 *
 * Omitting durationMs (or undefined) means the effect lasts until the boss dies.
 */
export type BossAction =
  | { type: 'enrage';    atkMult: number; cdMult: number;     durationMs?: number }
  | { type: 'regen';     hpPctPerSec: number;                 durationMs?: number }
  | { type: 'shield';    drAdd: number;   durationMs: number }
  | { type: 'summon';    monsterTypeId: string; count: number; offsetRange?: number }
  | { type: 'stat-buff'; stat: 'attack' | 'speed' | 'plating' | 'damageReduction' | 'evasion'; mult: number; durationMs?: number }
  | { type: 'slam';      radius: number; damageMult?: number }
  | { type: 'apply-shield';   shieldPct: number; intervalMs: number; durationMs: number }
  | { type: 'apply-soft-cap'; capPct: number; capMult: number }
  | { type: 'shed-defense' }
  | { type: 'modify-ramp-debuff'; moveSlowMaxPct: number; atkSlowMaxPct: number }
  | { type: 'spawn-adds'; monsterTypeId: string; count: number; offsetRange?: number; maxAlive?: number }
  | {
      type: 'morph';
      isRanged?: boolean;
      attackStyle?: string;
      attackRange?: number;
      /** Object sets a runtime DoT override; null clears it (revert to no DoT). */
      dotEffect?: {
        debuffId?: string;
        label?: string;
        color?: string;
        damagePerStack: number;
        maxStacks: number;
        tickIntervalMs: number;
        durationMs?: number;
        element?: DamageElement;
        bypassShield?: boolean;
      } | null;
      kite?: boolean;
      /** When set, revert to pre-morph values after durationMs. Omit = permanent phase flip. */
      durationMs?: number;
    };

/**
 * HP-threshold phase — fires once per fight when boss HP% drops below hpPct.
 * Define phases from highest hpPct to lowest for readable scripts.
 */
export interface BossPhase {
  /** 0.0–1.0 fraction of maxHp below which this phase fires. */
  hpPct: number;
  actions: BossAction[];
}

/**
 * Periodic action that fires on a fixed interval while the boss is engaged.
 * Timers start counting from first aggro.
 */
export interface RepeatingAction {
  intervalMs: number;
  /** Delay before the first fire. Defaults to intervalMs when omitted. */
  initialDelayMs?: number;
  actions: BossAction[];
}

/**
 * Full fight script for a boss monster.
 * Attach to MonsterDefinition.bossScript to opt in.
 *
 *   phases    — one-shot HP-threshold triggers, each fires at most once per life.
 *   repeating — periodic timers, run for the duration of the fight once engaged.
 */
export interface BossScript {
  phases?: BossPhase[];
  repeating?: RepeatingAction[];
}

// ── Ultimate encounter types ──────────────────────────────────────────────────

/**
 * Objective-driven encounter script for major bosses.
 *
 * Unlike BossScript, stages advance from explicit conditions such as clearing
 * tracked waves or elites rather than HP thresholds.
 */
export interface UltimateEncounter {
  anchor?: 'center';
  /** Empty-node reset is handled by node freeze/thaw; this covers party wipes. */
  reset: { onWipe: boolean };
  stages: EncounterStage[];
  /** When set, staged adds spawn on this node feature's perimeter instead of around the boss. */
  spawnFromFeatureId?: string;
}

export interface EncounterStage {
  id: string;
  /** HUD label; falls back to id.toUpperCase() when omitted. */
  displayName?: string;
  /** Overrides server-built objective headline when set. */
  objectiveLabel?: string;
  /** Default false. Final stages usually set this true and omit completeWhen. */
  vulnerable?: boolean;
  onEnter: StageAction[];
  /** Omit on a final stage that ends only when the boss dies. */
  completeWhen?: StageCondition;
}

export type StageAction =
  | { type: 'spawn-waves'; waves: WaveDef[] }
  | { type: 'spawn-elites'; monsterTypeId: string; count: number; offsetRange?: number }
  | {
      type: 'environmental-dot';
      effectId: string;
      damagePerStack: number;
      tickIntervalMs: number;
      /** Pass 0 for linear stacks × damagePerStack (used by void flood ramp). */
      maxStacks: number;
      refreshMs: number;
      /** Max stacks the hazard ramps up to over the fight. */
      stackCap?: number;
      /** HUD hint, e.g. "Leave the throne hazard". */
      hazardHint?: string;
    }
  | { type: 'set-invulnerable'; value: boolean }
  | { type: 'set-rooted'; value: boolean }
  | { type: 'set-cannot-attack'; value: boolean }
  /** Toggle a node-feature obstacle on/off for this node while engaged. */
  | { type: 'set-feature-block'; featureId: string; value: boolean };

export interface WaveDef {
  adds: { monsterTypeId: string; count: number }[];
}

export type StageCondition =
  | { kind: 'adds-cleared' }
  | { kind: 'elites-cleared' }
  | { kind: 'waves-cleared' };

export interface UltimateEnvironmentalDot {
  effectId: string;
  damagePerStack: number;
  tickIntervalMs: number;
  maxStacks: number;
  refreshMs: number;
  refreshTimerMs: number;
  /** Max stacks the flood ramp reaches. */
  stackCap: number;
  /** Current ramp intensity (1..stackCap). */
  currentStacks: number;
  /** Refresh cycles since flood started — ramp skips the first. */
  refreshCount: number;
}

export interface UltimateSavedBaseline {
  speed?: number;
  pullRange?: number;
  spawn?: Vec2;
}

// ── Monster definition ────────────────────────────────────────────────────────

export type MonsterTargetingMode = 'closest' | 'lowest-hp';

export interface MonsterTargeting {
  /**
   * Initial aggro acquisition policy. Omitted defaults to 'closest', matching
   * the legacy behavior. Monsters do not periodically retarget from this alone.
   */
  mode?: MonsterTargetingMode;
  /**
   * Future taunt hook. Omitted/false means taunts may override this monster once
   * the taunt system ships.
   */
  ignoresTaunts?: boolean;
}

/** Effects a monster can leave behind when a player kills it. */
export interface MonsterOnDeath {
  /** Lingering runtime pool. Ground-zone authority is implemented by the server. */
  spawnHazard?: {
    kind: 'toxic-pool';
    radius: number;
    durationMs: number;
    damagePerTick: number;
    tickIntervalMs: number;
    slowSpeedMult?: number;
  };
  /** Timed, stacking damage buff applied to living monsters in the radius. */
  empowerAllies?: {
    radius: number;
    damagePct: number;
    durationMs: number;
    maxStacks?: number;
  };
}

export interface MonsterDefinition {
  id: string;
  name: string;
  /** Phaser hex color for the placeholder rectangle sprite. */
  color: number;
  stats: {
    hp: number;
    attack: number;
    plating: number;
    damageReduction: number;
    speed: number;
    attackRange: number;
    attackCooldown: number;
    pullRange: number;
  };
  /**
   * Combat behavior — the single source of truth for how this monster fights.
   * `monsterIsRanged()` / `monsterKites()` derive the mechanical flags from it.
   */
  behavior: MonsterBehavior;
  /** Visual style for attack animations: 'slash' | 'impact' | 'poison' | 'magic' */
  attackStyle: string;
  /** Biome group this monster belongs to — must match a BiomeDefinition id. */
  biome: string;
  /**
   * Short bestiary hint describing the monster's combat profile (e.g.
   * "Fast-attacking swarmer", "Slow, armored bruiser"). When omitted, a profile
   * is derived from the monster's stats and mechanics. Authoring this overrides
   * the derived text — the intended home for hand-written flavor/lore later.
   */
  profile?: string;
  rewards: {
    essence: number;
    essenceType: EssenceType;
    level: number;
    biomeXp?: number;
    /**
     * Per-kill catalyst progress contributed toward this biome's catalyst.
     * Scaled by toughness tier (normal < tanky < elite < guardian). Omitted/0
     * means the monster grants no catalyst progress.
     */
    catalystWeight?: number;
    /**
     * One-time catalyst bundle granted the first time this monster is cleared
     * (guardians / bosses). Applied only on the newly-recorded boss clear.
     */
    catalystBundle?: number;
  };
  ai: {
    wanderRadius: number;
    leashRange: number;
    idleMinMs: number;
    idleMaxMs: number;
  };
  /** True for dungeon boss monsters — affects spawn logic and client visuals. */
  isBoss?: boolean;
  /**
   * Marks a standout "elite" of its biome — the strong/dangerous one the player
   * should notice and (often) kill first (graveyard necromancers, trench apex
   * predators). Drives a yellow client outline (derived from this flag, no networked
   * field) and the `focus-elites` targeting rune's priority bonus. Purely a
   * classification tag — it grants no stats on its own.
   */
  elite?: boolean;
  /** Fight script — opt-in boss mechanics (phases, regen, enrage, summons, etc.). */
  bossScript?: BossScript;
  /** Objective-driven multi-stage encounter controller. */
  ultimateEncounter?: UltimateEncounter;
  /** How this monster chooses an aggro target when first pulled. Defaults to closest. */
  targeting?: MonsterTargeting;
  /** Optional player-kill trigger. Fires before the dead monster is removed. */
  onDeath?: MonsterOnDeath;
  /**
   * If set, the monster bursts at speedMult x base speed for durationMs when it
   * first acquires an aggro target (both pull-range and retaliation aggro).
   * The charge overrides the kite ramp for its duration.
   */
  chargeOnAggro?: { speedMult: number; durationMs: number };
  /**
   * Fixed patrol route. Presence replaces random wander: while un-aggroed the
   * monster walks a deterministic path of waypoints (relative to its spawn, so one
   * def works at any spawn anchor) instead of picking random wander points. Aggro
   * interrupts normally; on return the monster resumes from its current waypoint
   * index. Movement still uses A* — patrols route around `nodeFeatures` chokepoints.
   */
  patrol?: {
    /** Waypoints RELATIVE to spawn. A single waypoint = a held post. */
    waypoints: Vec2[];
    /** 'loop' = …→last→first→…; 'pingpong' = …→last→…→first→…. */
    mode: 'loop' | 'pingpong';
    /** Pause at each waypoint before advancing. Defaults to the mob's idle timing. */
    holdMinMs?: number;
    holdMaxMs?: number;
  };
  /**
   * Movement ecology tag. When true, this monster can cross mountain ledge
   * node-features for pathing and movement. The client may present the crossing
   * as a hop, but the server remains authoritative.
   */
  vaultsMountainLedges?: boolean;
  /**
   * Defensive-post ecology tag. When true, this monster spawns ON a terrain
   * chokepoint and holds it (short leash + reduced wander) instead of roaming —
   * the "archer guarding the pass" fantasy. Explicit intent, NOT inferred from
   * `behavior: 'ranged'`, so a roaming/kiting ranged mob is not accidentally
   * pinned to a post. Chokepoint geometry currently exists only for mountain
   * nodes (`mountainChokepointsForNode`), so today it only takes effect there;
   * other biomes can opt in once they define chokepoints.
   */
  holdsChokepoints?: boolean;
  /**
   * Pack behavior. Presence opts the mob into coordinated grouped AI (handled by
   * the server pack system, which only sets aggro INTENT — `updateMonsters` stays
   * the executor). An aggroed pack member pulls un-aggroed mates that are within
   * `callRange` of an already-aggroed member onto the shared target (assist /
   * call-allies). Spawning: when the population top-up rolls an `alpha` type, the
   * whole pack (alpha + `followers`) spawns clustered around one anchor.
   */
  pack?: {
    role: 'alpha' | 'follower';
    /**
     * Max distance from an already-aggroed pack-mate at which this un-aggroed mob
     * is alerted onto the shared target. Omit/0 = never alerted (still spawns with
     * the pack and assists once it aggros on its own).
     */
    callRange?: number;
    /**
     * ALPHA ONLY: follower groups spawned alongside this alpha as one pack. An
     * array so a pack can mix types (e.g. melee wolves + a ranged support).
     */
    followers?: { typeId: string; count: number }[];
  };
  /**
   * Swarm flocking. Presence makes the mob steer as part of a group while chasing a
   * shared target: a light boids cohesion+separation offset is added to its chase
   * destination (handled by the server swarm system, which runs AFTER `updateMonsters`
   * and only nudges the destination — never speed or leash). Turns "many mobs each
   * peel off solo" into "many mobs converge as pressure". Position-derived, no RNG.
   */
  swarm?: {
    /** Pull toward the group centroid, 0..1 (gentle — ~0.1). 0 = separation only. */
    cohesion: number;
    /** Mobs closer than this (px) push apart so they fan out instead of stacking. */
    separation: number;
  };
  /** Dev test-room target behavior. These monsters are interacted with by standing in attack range. */
  interactKind?: 'reset' | 'gainPoint';
  /**
   * If set, this monster applies a DoT effect on every hit.
   * damagePerStack: damage dealt per stack per tick.
   * maxStacks: maximum stacks that can be on the target simultaneously.
   * tickIntervalMs: time between DoT ticks in milliseconds.
   */
  dotEffect?: {
    /** Stable debuff identity. Same id stacks together; different ids are separate debuffs. */
    debuffId?: string;
    /** Player-facing debuff label. Omitted falls back to biome/element flavor. */
    label?: string;
    /** Player-facing icon color. Omitted falls back to biome/element flavor. */
    color?: string;
    damagePerStack: number;
    maxStacks: number;
    tickIntervalMs: number;
    durationMs?: number;
    /** DoT element for damage-number flavor (color/glyph). Defaults to poison. */
    element?: DamageElement;
    /**
     * Exception flag: when true this DoT's ticks ignore the player's shields and
     * hit HP directly. The DEFAULT (omitted/false) is that DoT ticks are absorbed
     * by shields like any other damage — bypass should stay rare and deliberate.
     */
    bypassShield?: boolean;
  };
  /**
   * If set, this monster applies a movement slow (or root when speedMult = 0) to
   * the player on every successful hit. The effect is refreshed on each hit.
   */
  slowEffect?: { speedMult: number; durationMs: number };
  /**
   * Trench "abyssal pressure" — on every landed hit this monster stacks the player's
   * `antiheal` status (up to `maxStacks`), suppressing ALL of the player's healing by
   * `reductionPerStack` per stack (read by `getAntiHealMult`). Decays `durationMs`
   * after the last hit (refreshed each hit). The fantasy: you can't out-heal an
   * abyssal terror — you must burst/execute it. Skipped on an evaded hit.
   */
  appliesAntiheal?: { reductionPerStack: number; maxStacks: number; durationMs: number };
  /**
   * If set, this monster's basic attack also deals splash damage to all players
   * AND enemy summons within `radius` px of the primary target. The primary target
   * takes its normal direct hit (full pipeline, including slow/DoT); everyone else
   * takes splash only. Splash bypasses the combat pipeline (pure damage — no
   * slow/DoT), matching player empowered-AoE semantics. `damageMult` scales the
   * splash off the monster's current attack (default 1.0), so it composes with
   * enrage / stat-buff / morph.
   */
  aoeAttack?: { radius: number; damageMult?: number };
  /**
   * In-combat attack ramp. While the monster has an aggro target, a multiplier on
   * `stat` grows by perTickPct every tickIntervalMs, clamped at maxPct. Deterministic
   * (counts elapsed ticks). Resets to zero on de-aggro / leash.
   */
  rampOnCombat?: {
    stat: 'attack';
    perTickPct: number;
    maxPct: number;
    tickIntervalMs: number;
  };
  /**
   * Stacking debuff applied to the PLAYER on every landed hit: a movement slow and
   * an attack-speed slow, each accumulating per hit and clamped at its own MaxPct.
   * The whole debuff decays stackDurationMs after the last hit taken (refreshed each
   * hit). ⚠ atkSlowMaxPct is load-bearing — an uncapped attack-speed debuff
   * death-spirals (slower attack → slower kill → more stacks).
   */
  rampDebuff?: {
    moveSlowPerHit: number;
    moveSlowMaxPct: number;
    atkSlowPerHit: number;
    atkSlowMaxPct: number;
    stackDurationMs: number;
  };
  /**
   * Deterministic cadence finisher — port of the player cadence empowered attack.
   * Every `everyNAttacks` landed basic attacks, that attack's outgoing damage is
   * multiplied by `multiplier`. Counter-based (no RNG); the boosted hit resolves
   * through the player's full defensive pipeline (damage-cap, shields, plating, DR)
   * exactly like a player empowered attack — these spikes are what the player's
   * damage-cap armor is meant to answer.
   */
  cadenceFinisher?: { everyNAttacks: number; multiplier: number };
  /**
   * Deterministic cooldown finisher — port of the player cooldown empowered attack.
   * The timer starts on combat entry; once `cooldownMs` elapses the monster's NEXT
   * landed attack is multiplied by `multiplier` and the timer resets. If the monster
   * cannot attack the instant the timer expires, the empowered state waits for the
   * next actual attack (it is evaluated at attack time, never wasted on an idle tick).
   * Resolves through the player's full defensive pipeline.
   */
  empoweredCooldown?: { cooldownMs: number; multiplier: number };
  /**
   * Opening strike: the FIRST landed attack after acquiring a fresh aggro target is
   * multiplied by `multiplier`, then disarms until the monster re-engages (a new
   * combat session). The pounce-out-of-ambush (Jungle) and the duelist's lethal
   * opener (Desert). Deterministic (armed per combat session, no RNG); resolves
   * through the player's full defensive pipeline, so the spike is exactly what the
   * player's damage-cap / last-stand armor is meant to answer.
   */
  openingStrike?: { multiplier: number };
  /**
   * Sun Mark — SETUP half of the Desert mark/finisher pair. On every landed hit this
   * monster applies a cleansable "sun-mark" debuff to the player for `durationMs`.
   * The mark does nothing on its own (expires harmlessly); it only enables a
   * `markedStrike` finisher to land amplified. Desert's cleanse answer removes it
   * (it is a normal non-DoT status the cleanse pass strips). Skipped on an evaded hit.
   */
  appliesMark?: { durationMs: number };
  /**
   * Sun Mark — FINISHER half. When this monster lands a hit on a player who carries
   * the `sun-mark` debuff, that hit is multiplied by `multiplier` and the mark is
   * consumed. The payoff the marker sets up; resolves through the player's full
   * defensive pipeline like any other spike. No effect against an un-marked target.
   */
  markedStrike?: { multiplier: number };
  /**
   * Periodic absorb barrier on the MONSTER — mirror of the player periodic shield
   * (defense.shield-pct). Every `intervalMs` the monster gains a shield equal to
   * `shieldPct × maxHp` lasting `durationMs`; it absorbs incoming player direct-hit
   * damage before the monster's HP (same scope as the player shield, which likewise
   * only absorbs combat-pipeline hits). Rewards burst (one big hit pops it) and
   * punishes chip (small hits waste themselves against it). Timer is deterministic.
   */
  enemyShield?: {
    shieldPct: number;
    intervalMs: number;
    durationMs: number;
    /**
     * Tundra ICE ARMOR shatter window. Presence turns a plain absorb barrier into a
     * brittle shell: when a player's hit DEPLETES the barrier (breaks it), it SHATTERS —
     * dealing `selfDamagePct × maxHp` bonus damage to this monster (rewarding the burst
     * that cracked it) and sending a freezing shockwave that STUNS other enemy monsters
     * within `freezeRadius` for `freezeDurationMs` (crowd-control upside — never the
     * player). Chip damage just chinks the shell; a burst pops it and triggers the shatter.
     */
    shatter?: { selfDamagePct: number; freezeRadius: number; freezeDurationMs: number };
  };
  /**
   * Soft damage cap protecting the MONSTER — mirror of the player damage-cap
   * (defense.max-hit-pct / max-hit-mult). When a single player hit exceeds
   * `capPct × maxHp`, the portion above the threshold is scaled by `capMult`
   * (threshold + excess × capMult). Partial only — never reduces a hit to zero.
   * Punishes slow single-big-hit builds; rewards fast consistent damage and pierce.
   */
  enemySoftCap?: { capPct: number; capMult: number };
  /**
   * Deterministic evasion: per-hit dodge chance as a fraction (0–1), the same
   * notation as the player `evasion` stat. The value is added to a fractional
   * accumulator each incoming player hit and the hit is dodged when it crosses
   * 1.0 (e.g. 0.2 ⇒ dodges every 5th hit, 0.25 ⇒ every 4th). Not RNG.
   */
  evasion?: number;
  /**
   * Fraction of damage avoided on one of this monster's dodges (0..1). Defaults
   * to GAME_CONFIG.EVADE_MITIGATION_BASE (0.5). Set to 1 to fully negate the hit
   * (the legacy behavior).
   */
  evadeMitigation?: number;
  /**
   * If true, the player's debuffs/DoT stacks still land even when this monster
   * dodges the hit. Default false (a dodged hit applies no debuffs).
   */
  appliesThroughEvade?: boolean;
  /**
   * Charged (cast-time) special attack — a TELEGRAPHED big hit. When the per-combat
   * `cooldownMs` is ready and the monster is in range, it begins a `castMs` wind-up
   * (a cast bar shows over its head; no movement/normal attacks during the cast).
   * When the cast completes it lands a single attack multiplied by `multiplier`,
   * resolved through the player's full defensive pipeline (so the damage cap / DR /
   * Brace all apply to the spike — same as any empowered monster hit). A STUN or
   * FREEZE during the wind-up INTERRUPTS it (no shot). The cooldown timer starts on
   * combat entry, so the first cast comes after a few normal attacks, not on contact.
   * The flagship of Mountain's "telegraphed huge hit you survive via mitigation" loop
   * — and the trigger the `target-casting` rune condition reacts to. `fx` selects the
   * client charged-shot animation (defaults to a generic power shot).
   */
  chargedAttack?: {
    name: string;
    castMs: number;
    cooldownMs: number;
    multiplier: number;
    /**
     * Cooldown used for the FIRST cast of a combat session (defaults to `cooldownMs`).
     * Set shorter so the empowered shot lands a couple of normal attacks into the
     * fight, then `cooldownMs` governs the recurring rhythm.
     */
    initialCooldownMs?: number;
    fx?: string;
    /**
     * Optional rider applied when the charged hit actually lands. Distance is in
     * pixels and can be reduced by player knockback resistance effects.
     */
    knockback?: { distance: number };
    /**
     * Marked-prey tell. When the charge BEGINS, the monster paints a cleansable
     * "marked" debuff on its target for `durationMs` (reuses the shared sun-mark
     * status + the MARKED buff tile + the marker pulse). The mark is the readable
     * "you are the prey, the pounce is coming" beat shown during the wind-up, a
     * distinct layer over the cast bar; it is consumed when the charged hit lands
     * (and otherwise expires harmlessly if the cast is interrupted). Forest's
     * Scent-of-Blood → Savage Maul predator sequence.
     */
    marksTarget?: { durationMs: number };
    /**
     * GROUND-SLAM rider. Turns the charge from a target-following power shot into
     * a COMMITTED circle: the impact point is planted at the target's position
     * when the cast BEGINS, a telegraph zone is broadcast for the wind-up, and on
     * completion everyone standing inside `radius` is hit — the original target
     * included only if they are still in it. Walking out is the counterplay, so
     * the cast deliberately does NOT abort when the target leaves attack range
     * (a stun, freeze or knockback still interrupts it).
     *
     * Each victim resolves through the full `runMonsterAttack` pipeline rather
     * than the raw `applyMonsterAoe` splash path, so the player damage-cap, DR
     * and Brace apply to the slam exactly as they do to a normal charged hit.
     *
     * `damageMult` stacks on top of `multiplier` (default 1) — use it when the
     * splash should hit softer than a single-target spike of the same charge.
     */
    aoe?: { radius: number; damageMult?: number };
  };
}
