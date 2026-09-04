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
 *   roar      — briefly hasten the boss and nearby monster allies.
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
 *   cast           — root the boss and suppress its basic attacks while it visibly
 *               casts, then resolve the nested scripted actions at completion. This
 *               is for readable, delayed boss beats such as reinforcement calls.
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
  | {
      type: 'stat-buff';
      stat: 'attack' | 'speed' | 'plating' | 'damageReduction' | 'evasion' | 'attackSpeed';
      mult: number;
      /** Optional paired movement-speed multiplier for an attack-speed buff. */
      moveSpeedMult?: number;
      /** Maximum concurrent stacks of this named buff. Omit for no cap. */
      maxStacks?: number;
      durationMs?: number;
      /** Optional target-frame label for this boss effect. */
      label?: string;
    }
  | { type: 'roar'; attackSpeedPct: number; durationMs: number; radius?: number }
  | {
      type: 'apply-shield';
      shieldPct: number;
      intervalMs: number;
      durationMs: number;
      /** Optional brittle-shell rider — same shape as `MonsterDefinition.enemyShield.shatter`. */
      shatter?: {
        selfDamagePct: number;
        vulnerability?: { damageTakenPct: number; durationMs: number };
        freezeRadius?: number;
        freezeDurationMs?: number;
      };
    }
  | { type: 'apply-soft-cap'; capPct: number; capMult: number }
  | { type: 'shed-defense' }
  | { type: 'modify-ramp-debuff'; moveSlowMaxPct: number; atkSlowMaxPct: number }
  | { type: 'spawn-adds'; monsterTypeId: string; count: number; offsetRange?: number; maxAlive?: number }
  | {
      /** A visible, non-damaging boss cast that resolves its actions at completion. */
      type: 'cast';
      castMs: number;
      label: string;
      actions: BossAction[];
      /** Cast-start cue. Defaults to the rallying-roar treatment. */
      fx?: 'roar' | 'frenzy' | 'shield';
    }
  /**
   * RAISE DEAD (Wasteland) — one burst resurrection. Claims up to `count` corpses
   * from the node's corpse registry within `corpseRange` and raises each as a risen
   * copy (zero rewards, leaves no corpse of its own, crumbles when the raiser dies).
   * Raises fewer than `count` when fewer corpses are in reach — never conjures.
   *
   * `maxAliveAdd` permanently raises this boss's `raisesDead.maxAlive` ceiling, so a
   * later phase can let the tide stand deeper rather than only arriving faster.
   */
  | {
      type: 'raise-dead';
      count: number;
      corpseRange?: number;
      hpMult?: number;
      damageMult?: number;
      maxAliveAdd?: number;
    }
  /**
   * STOKE RAMP (Volcano) — bend the node's ambient ramp (`NodeFeatureSpec.ambientRamp`)
   * for everyone in the boss's node. `rampMsMult` scales the accumulate/decay cadence
   * (< 1 = the room heats faster and cools slower in equal measure), `minStacks` is a
   * floor the ramp can no longer decay below, and `maxStacksAdd` raises the ceiling.
   *
   * Node-scoped, not per-player: someone who arrives late walks into the same caldera.
   * Cleared when the boss dies or the node freezes — the room cools with it.
   */
  | {
      type: 'stoke-ramp';
      rampMsMult?: number;
      minStacks?: number;
      maxStacksAdd?: number;
    }
  /**
   * SPAWN POOL — lay a hazard pool centred on the boss. The same ground zone the
   * charged-attack `pool` rider and `onDeath.spawnHazard` publish, exposed as a
   * scripted beat so a phase can flood the arena (Swamp Rot Bloom, Volcano magma).
   */
  | {
      type: 'spawn-pool';
      radius: number;
      durationMs: number;
      damagePerTick: number;
      tickIntervalMs: number;
      slowSpeedMult?: number;
    }
  /**
   * EMPOWER CHARGED — escalate the boss's SIGNATURE telegraphed attack instead of
   * bolting a new mechanic onto it. Multipliers compose across phases (two phases
   * each passing `cooldownMult: 0.8` land at 0.64), so a lineage can deepen one idea
   * rather than acquiring unrelated ones. All fields optional; omitted = unchanged.
   */
  | {
      type: 'empower-charged';
      /** Scales `chargedAttack.multiplier`. */
      multiplierMult?: number;
      /** Scales `chargedAttack.cooldownMs` (< 1 = it comes around sooner). */
      cooldownMult?: number;
      /** Scales `chargedAttack.aoe.radius`. */
      radiusMult?: number;
      /** Scales `chargedAttack.castMs` (< 1 = a shorter tell). */
      castMsMult?: number;
      /** Added rays on a `radial-fault-lines` aftershock. */
      aftershockRayCountAdd?: number;
      /** Scales the aftershock's `damageMultiplier`. */
      aftershockDamageMult?: number;
    }
  /**
   * EMPOWER SHRED (Cave) — deepen the boss's `appliesPlatingShred` mid-fight. The
   * Cave lineage's whole idea is that your shell erodes as the fight runs long, so
   * its escalation is "the erosion goes further", not a second unrelated mechanic.
   */
  | {
      type: 'empower-shred';
      platingPerStackAdd?: number;
      maxStacksAdd?: number;
      /** Extra stack counts at which the threshold poison fires (Cave T3+). */
      extraThresholds?: number[];
    }
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
        bypassBarrier?: boolean;
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
  /**
   * ANTI-BODY-BLOCK. While at least one PLAYER is inside this monster's pull range,
   * minions are not aggro candidates at all — it walks past the summon wall and
   * fights the person who sent it. It still falls back to minions when no player is
   * in reach, and minions are still hit by anything area-shaped it does.
   *
   * This is the systemic replacement for the old anti-summon `aoeAttack` cleave that
   * every slow boss carried: bosses no longer need to periodically wipe summons in
   * order to stay on their intended target, so boss AoE can go back to existing
   * because the ENCOUNTER wants it (Earthshatter, Eruption, pools) rather than
   * because the Summoner class exists.
   */
  prefersPlayers?: boolean;
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

/**
 * Necromancy: while engaged, the monster reaches for a nearby CORPSE (recorded by
 * the server's per-node corpse registry when a player kills something) and raises
 * it as a risen copy of whatever died. No corpse in reach means no raise — the
 * tide is fed by the player's own kills, never conjured from nothing.
 *
 * Risen mobs carry the `isRaised` marker: zero rewards, capped population, and
 * they crumble the moment the raiser dies. That is the whole counterplay.
 */
export interface MonsterRaisesDead {
  /** Cadence between raise attempts once the first one has come due. */
  intervalMs: number;
  /** Delay after the aggro session starts, so a raise is never the opener. */
  initialDelayMs?: number;
  /** How far it will reach for a corpse. */
  corpseRange: number;
  /** Hard cap on simultaneously-living risen mobs from this raiser. */
  maxAlive: number;
  /** Scalars on the risen copy (default 1) — the dead come back diminished. */
  hpMult?: number;
  damageMult?: number;
  /** Optional readable wind-up before each cadence raise resolves. */
  castMs?: number;
  /** Cast-bar label. Required by authoring convention whenever castMs is set. */
  castName?: string;
  /** Client resolve cue, reusing the ordinary monster cast event. */
  castFx?: string;
}

/** A player-facing rider on a generic monster ability hit. */
export type MonsterAbilityPlayerEffect =
  | { kind: 'slow'; speedMult: number; durationMs: number }
  | { kind: 'antiheal'; reduction: number; durationMs: number }
  | { kind: 'vulnerability'; damageTakenPct: number; durationMs: number };

/**
 * Effects resolved by a generic monster ability. The list is deliberately small:
 * direct damage, committed area damage, player debuffs, and self-support cover
 * the readable elite/boss beats without turning authoring into a second spell
 * system.
 */
export type MonsterAbilityAction =
  | {
      type: 'hit';
      multiplier: number;
      effect?: MonsterAbilityPlayerEffect;
      knockback?: { distance: number };
    }
  | {
      type: 'area-hit';
      radius: number;
      multiplier: number;
      effect?: MonsterAbilityPlayerEffect;
      stunMs?: number;
      knockback?: { distance: number };
    }
  | {
      type: 'attack-speed-buff';
      effectId: string;
      attackSpeedPct: number;
      durationMs: number;
      attacks?: number;
    }
  | {
      type: 'shield';
      effectId: string;
      shieldPct: number;
      durationMs: number;
      shatter?: {
        selfDamagePct: number;
        vulnerability?: { damageTakenPct: number; durationMs: number };
        freezeRadius?: number;
        freezeDurationMs?: number;
      };
    };

/**
 * Reusable cast-time monster ability. A player-targeted area hit plants at the
 * target's cast-start position; self-targeted area hits plant at the caster.
 */
export interface MonsterAbility {
  id: string;
  name: string;
  castMs: number;
  cooldownMs: number;
  initialCooldownMs?: number;
  target: 'player' | 'self';
  /** Defaults to true for player-targeted abilities and false for self abilities. */
  requiresRange?: boolean;
  /** Allows the cast to be armed while the target is outside basic attack range. */
  castWhileOutOfRange?: boolean;
  actions: MonsterAbilityAction[];
  fx?: string;
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
  /** Raises corpses of the recently killed as zero-reward risen mobs. */
  raisesDead?: MonsterRaisesDead;
  /**
   * If set, the monster bursts at speedMult x base speed for durationMs when it
   * first acquires an aggro target (both pull-range and retaliation aggro).
   * The charge overrides the kite ramp for its duration.
   */
  chargeOnAggro?: { speedMult: number; durationMs: number };
  /**
   * Multi-step opener run once per fresh player-aggro session. Every stage is
   * interruptible. Cave brutes charge, lock and then begin their authored slam;
   * dive bombers first telegraph their flight, then rush into a brief landing root.
   */
  engageSequence?:
    | {
        kind: 'charge-lock-charged-attack';
        speedMult: number;
        maxChargeMs: number;
        lockoutMs: number;
      }
    | {
        kind: 'cast-charge-root';
        name: string;
        castMs: number;
        speedMult: number;
        maxChargeMs: number;
        rootMs: number;
        /** On contact, immediately arm this monster's authored charged attack. */
        followWithChargedAttack?: boolean;
        /** Client flight tell played as the wind-up resolves. */
        fx?: string;
      }
    | {
        /** A casted aerial approach whose landing is an amplified first hit. */
        kind: 'cast-charge-strike';
        name: string;
        castMs: number;
        speedMult: number;
        maxChargeMs: number;
        damageMultiplier: number;
        /** Client flight tell played as the wind-up resolves. */
        fx?: string;
      };
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
   * FLIGHT. This monster is airborne: it crosses mountain ledges for pathing (like
   * `vaultsMountainLedges`, but because it is in the air rather than because it
   * hops), and while un-aggroed it ROAMS AERIALLY — a wide, lazy circuit rather
   * than the ground wander every other mob uses.
   *
   * Deliberately separate from `vaultsMountainLedges` even though both ignore
   * ledges: the caprine identity is "climbs the terrain", the flyer identity is
   * "the terrain does not apply", and only the latter should get the aerial idle
   * or the client's hover presentation.
   *
   * ⚠ Flight changes IDLE and PATHING only. A flyer fights on the ground plane like
   * anything else, and must never become a repeated hit-and-run loop — the locked
   * rule is one approach/dive on engagement, then ordinary combat.
   */
  flies?: boolean;
  /**
   * STATIC SENTRY. The monster does not roam at all: it holds the spot it spawned
   * on, activates when a player enters its pull range, fires from that position,
   * and walks back to it afterwards.
   *
   * The generalisation of `holdsChokepoints` past Mountain. `holdsChokepoints`
   * needs authored chokepoint geometry (which only mountain nodes have) and picks a
   * post NEAR the spawn; this one needs no terrain data at all and pins the mob to
   * its own spawn point, so any biome can use it. A def may carry either, not both.
   *
   * Explicit intent, NOT inferred from `behavior: 'ranged'` — a roaming ranged mob
   * must not be accidentally nailed to the floor.
   */
  staticSentry?: boolean;
  /**
   * PREFERRED IDLE TERRAIN. While un-aggroed, this monster picks its wander
   * destinations in/around a specific kind of node feature instead of wandering
   * freely, so the biome's terrain and its ambushers read as one thing:
   *
   *   'jungle-bush' — the thicket-lurking ambusher (Jungle Snake). The bush already
   *                   doubles player detection, so a snake that LIVES there turns
   *                   "I walked into the undergrowth" into the ambush.
   *   'swamp-pool'  — the half-submerged pool dweller (Bog Lurker). It idles INSIDE
   *                   the pool rather than roaming past it, and erupts when a player
   *                   comes near.
   *
   * Falls back to ordinary wander when the node has no such feature.
   */
  idleAnchor?: 'jungle-bush' | 'swamp-pool';
  /**
   * Presentational concealment for a monster that is visually subdued while
   * idle, but does not need terrain-specific idle movement. The client reveals
   * it automatically once the monster enters combat. Kept separate from
   * `idleAnchor` so camouflage does not accidentally change AI positioning.
   */
  concealedWhileIdle?: boolean;
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
     * Exception flag: when true this DoT's ticks ignore the player's wards and
     * barrier and hit HP directly. The DEFAULT (omitted/false) is that DoT ticks
     * are absorbed like any other damage — bypass should stay rare and deliberate.
     * Either way the tick still restarts the barrier's recharge delay.
     */
    bypassBarrier?: boolean;
    /**
     * VENOMOUS OPENER — the FIRST landed hit of each combat session applies this
     * many stacks at once instead of one. The Swamp ambush lineage: a normal bite
     * is one stack, the bite that opens the fight is two (Mire Stalker) or three
     * (Bog Lurker), so the ambush lands as poison ALPHA rather than a damage spike.
     *
     * Session-keyed and deterministic, like `openingStrike`. Still clamped by
     * `maxStacks`, and still skipped entirely on an evaded hit.
     */
    openerStacks?: number;
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
   * Desert "sundering" — on every landed hit this monster stacks the player's
   * `sundered` status (up to `maxStacks`), raising the damage the player TAKES from
   * EVERY source by `damageTakenPct` per stack (read by `playerIncomingDamageMult`,
   * capped by `MAX_DAMAGE_TAKEN_PCT`). Decays `durationMs` after the last hit
   * (refreshed each hit). The controller half of the Desert pair: the tanky mob that
   * pins you barely scratches you itself — it makes its kiting dealer's shots land
   * twice as hard. Cleanse strips it. Skipped on an evaded hit.
   */
  appliesVulnerability?: { damageTakenPct: number; maxStacks: number; durationMs: number };
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
  /** Full combat-pipeline hits delivered by one basic-attack beat. */
  consecutiveHits?: number;
  /**
   * OPENING VOLLEY — the first attack of each combat session delivers `hits` full
   * pipeline hits instead of one, then the monster settles into ordinary combat.
   *
   * The reveal-and-fire beat for the Chameleon line: it uncloaks and empties a
   * couple of shots before you have closed. Session-keyed exactly like
   * `openingStrike` (re-arms on a fresh aggro, deterministic, no RNG), and a
   * deliberate ALTERNATIVE to it — a volley is more shots, not one bigger shot, so
   * it reads as a burst of pressure rather than a spike the damage cap must answer.
   */
  openingVolley?: { hits: number };
  /**
   * CADENCE VOLLEY — every `everyNAttacks` attack beats, that beat delivers `hits`
   * full pipeline hits instead of one.
   *
   * Forest's Thorn Spitter: a periodic burst of thorns rather than a constant
   * stream. Counter-based and deterministic, the same shape as `cadenceFinisher`,
   * and composable with it (a beat can be both a volley and empowered) — though
   * authoring both on one monster is almost always too much.
   */
  cadenceVolley?: { everyNAttacks: number; hits: number };
  /**
   * SHELL UP — a one-shot defensive state, the Snapper lineage's identity.
   *
   * The first time this monster drops to or below `atHpPct` of its max HP it
   * retracts into its shell for `durationMs`: it cannot move and cannot attack, and
   * incoming DIRECT damage is multiplied by `directDamageMult` (a small number —
   * "extremely resistant", not immune).
   *
   * ⚠ DoTs deliberately keep ticking at full strength while shelled. That is the
   * counterplay and the reason the state cannot stall a fight forever: a build with
   * any damage-over-time simply keeps working, and a pure-burst build waits.
   *
   * Once per life (not per combat session) so it can never become a stall loop.
   * `pool` is the evolved version: shelling also contaminates the ground around it,
   * turning a defensive beat into space denial.
   */
  shellUp?: {
    /** HP fraction (0..1) that triggers the retract. */
    atHpPct: number;
    /** Optional wind-up before the shell closes. The monster is planted during it. */
    castMs?: number;
    durationMs: number;
    /**
     * BOSS SHELL CYCLE. When set, the shell is no longer once-per-life: after it
     * opens it re-arms, and every shell after the first ignores `atHpPct` and simply
     * comes back this many ms later. Reserved for bosses whose identity IS the cycle
     * (Volcano T3): pair it with a mild `directDamageMult` and a `pool`, so the beat
     * reads as "it hardens, then floods the ground when it opens" rather than as a
     * repeating invulnerability that stalls the fight.
     */
    repeatIntervalMs?: number;
    /** Multiplier on incoming DIRECT damage while shelled (e.g. 0.15). */
    directDamageMult: number;
    /** Evolved Snapper: a lingering toxic pool laid down when the shell closes. */
    pool?: {
      radius: number;
      durationMs: number;
      damagePerTick: number;
      tickIntervalMs: number;
      slowSpeedMult?: number;
    };
  };
  /**
   * NECROTIC SCREECH — periodically hastens nearby allied monsters while this one
   * is engaged. The Wasteland's ranged support: it does not hurt you directly, it
   * makes everything else hurt you faster.
   *
   * Distinct from `onDeath.empowerAllies` (a death rattle) — this fires on a timer
   * during the fight. Attack speed only, and non-stacking by refresh, because the
   * locked rule is not to stack a big damage boost and a big speed boost at once.
   */
  empowersAllies?: {
    intervalMs: number;
    radius: number;
    /** Added attack-speed fraction on each affected ally (e.g. 0.25). */
    attackSpeedPct: number;
    durationMs: number;
  };
  /**
   * In-combat attack ramp. While the monster has an aggro target, a multiplier on
   * `stat` grows by perTickPct every tickIntervalMs, clamped at maxPct. Deterministic
   * (counts elapsed ticks). Resets to zero on de-aggro / leash.
   */
  rampOnCombat?: {
    stat: 'attack' | 'attackSpeed';
    perTickPct: number;
    maxPct: number;
    tickIntervalMs: number;
  };
  /** Encounter-long, stacking player plating reduction applied on landed hits. */
  appliesPlatingShred?: {
    platingPerStack: number;
    maxStacks: number;
    /** Optional poison payoff applied only when corrosion reaches these stacks. */
    thresholdPoison?: {
      atStacks: number[];
      debuffId: string;
      label: string;
      damagePerStack: number;
      maxStacks: number;
      tickIntervalMs: number;
      durationMs: number;
      element?: DamageElement;
      bypassBarrier?: boolean;
    };
  };
  /**
   * Tundra capstone — this monster's outgoing damage scales with the AMBIENT NODE RAMP
   * its target is carrying (`NodeFeatureSpec.ambientRamp`): +`perStackPct` per stack,
   * capped at `maxPct`. A plain outgoing-damage layer like the Wasteland death-empower,
   * not an empowered spike, so it does not touch cadence/charge metadata and resolves
   * through the player's full defensive pipeline.
   *
   * Locked decision 5 keeps this to ONE T4 elite per biome: the chill that slows
   * everyone also feeds the apex, which is a reason to cleanse it and a reason not to
   * plant-and-outlast the one fight where outlasting is worst. A roster-wide version
   * would just be a second difficulty knob on the ramp payload.
   */
  scalesWithAmbientRamp?: {
    perStackPct: number;
    maxPct: number;
    /**
     * When true, ONLY charged/empowered hits scale with the ramp — ordinary
     * attacks are untouched.
     *
     * The Tundra apex's locked shape: its huge telegraphed Glacial Slam becomes
     * more dangerous the colder the room has made you, but its normal swings do
     * not. Scaling everything turned "arrive cold and the slam lands on someone
     * who cannot walk out of it" into a flat damage bonus, which is a difficulty
     * knob rather than a tell.
     */
    chargedOnly?: boolean;
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
  cadenceFinisher?: {
    everyNAttacks: number;
    multiplier: number;
    /**
     * CONSTRICT — the boosted cadence hit also ROOTS the target for `rootMs`.
     *
     * The Emerald Constrictor's headline: a predictable heavier hit that briefly
     * pins you, which is dangerous less for its damage than for WHERE it happens —
     * it roots you inside a Jungle pull the terrain already gathered. Uses the same
     * shared `slow`-at-zero root as the charged-attack rider, so Cleanse strips it,
     * mobility tenacity shortens it, and the player can still fight while rooted.
     *
     * Only fires on the beats the cadence actually fires; skipped on an evaded hit.
     */
    rootMs?: number;
  };
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
   * Periodic absorb shield on the MONSTER. Deliberately NOT the player's barrier:
   * this one is timed and cyclic. Every `intervalMs` the monster gains a shield
   * equal to `shieldPct × maxHp` lasting `durationMs`; it absorbs incoming player
   * direct-hit damage before the monster's HP (it only sees combat-pipeline hits).
   * Rewards burst (one big hit pops it) and punishes chip (small hits waste
   * themselves against it). Timer is deterministic.
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
    shatter?: {
      selfDamagePct: number;
      /**
       * SHATTER PAYOFF (Tundra Bear line). Breaking the shell staggers the monster:
       * for `durationMs` it takes `damageTakenPct` MORE damage from every source —
       * the reward for timing a burst into the shell instead of chipping at it.
       *
       * This replaces the old "shatter freezes nearby enemies" rider (de-emphasised
       * in the T1-T4 rework): a crowd-control upside was a strange thing to hang off
       * a defensive window, and it paid out most in exactly the crowded fights
       * Tundra is not supposed to have.
       */
      vulnerability?: { damageTakenPct: number; durationMs: number };
      /** Legacy freezing shockwave. Optional; prefer `vulnerability`. */
      freezeRadius?: number;
      freezeDurationMs?: number;
    };
    /**
     * RECHARGE ON CLEAN — when set, the barrier does NOT come back on the plain
     * `intervalMs` metronome. It returns only once this monster has gone
     * `rechargeAfterCleanMs` without taking a hit, and any hit restarts that timer.
     *
     * The Sunshield Scarab: catch the kiting dealer and keep pressure on it and it
     * stays as fragile as its HP says; lose it for a few seconds and the shield is
     * back. It makes the dealer hard to kill without making it generically tanky,
     * which is the distinction the locked design cares about.
     */
    rechargeAfterCleanMs?: number;
  };
  /**
   * A one-time, low-health defensive cast. At or below `thresholdPct` max HP the
   * monster stops to cast, then gains a temporary ward which absorbs direct hits
   * before HP. Unlike `enemyShield`, this is not periodic and never recharges.
   */
  lowHealthWard?: {
    name: string;
    thresholdPct: number;
    castMs: number;
    wardPct: number;
    durationMs: number;
    effectId: string;
    fx?: string;
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
  /** Non-damaging cast-time haste applied to self or nearby monster allies. */
  castedAttackSpeedBuff?: {
    name: string;
    castMs: number;
    cooldownMs: number;
    initialCooldownMs?: number;
    effectId: string;
    attackSpeedPct: number;
    durationMs?: number;
    attacks?: number;
    target: 'self' | 'nearby-monsters';
    /** Nearby targeting includes the caster by default (Howl); supports can opt out. */
    includeSelf?: boolean;
    radius?: number;
    /** Start and complete this self/ally boon without requiring attack range. */
    castWhileOutOfRange?: boolean;
    /**
     * Optional capped rally performed by the same cast. Unaggroed, non-boss
     * monsters in `radius` receive the caster's current target. This is an
     * explicit alternative to passive pack membership, so it remains readable
     * and cannot recursively pull an unlimited group by default.
     */
    rallyNearby?: {
      maxTargets: number;
      /** Defaults to true: one rally per aggro session. */
      oncePerCombat?: boolean;
    };
    fx?: string;
  };
  /**
   * Ordered list of independent, cast-time monster abilities. Each ability owns
   * its own cooldown and resolves one or more authored actions, so an elite can
   * have a readable rotation without growing another bespoke combat subsystem.
   * The first ready ability in the list is selected.
   */
  monsterAbilities?: MonsterAbility[];
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
    /** Briefly stun the primary target when the wind-up starts. */
    precastStunMs?: number;
    /**
     * ROOT the primary target for `rootMs` when the charged hit LANDS.
     *
     * Reuses the shared `slow` status at `speedMult: 0`, which is already the
     * game's root: movement stops, the buff HUD renders it as ROOT, Cleanse strips
     * it and mobility tenacity shortens it. Crucially it does NOT lock attacks —
     * a rooted player still fights, which is what keeps these abilities solvable by
     * configuration rather than by reflex. Hard control (movement AND attacks) stays
     * the Cave Troll's `engageSequence` lockdown alone.
     *
     * The one telegraphed-root primitive behind three locked designs: the Basilisk's
     * PETRIFYING GAZE, the Rime Caster's FROSTBIND, and the Emerald Constrictor's
     * CONSTRICT. Skipped on an evaded hit like every other on-hit rider.
     */
    rootMs?: number;
    /**
     * SLOW the primary target when the charged hit lands. Unlike `rootMs`, this
     * retains movement at the authored fraction. Used for the Sand Scorpion's
     * telegraphed Numbing Sting rather than applying a slow on every basic hit.
     */
    appliesSlow?: { speedMult: number; durationMs: number };
    /**
     * WITHER — the landed charged hit suppresses the target's Recovery
     * effectiveness by `reduction` for `durationMs`, as ONE non-stacking debuff.
     *
     * Reuses the existing `antiheal` status, so `getAntiHealMult` and the buff tile
     * both pick it up unchanged. The difference from `appliesAntiheal` is WHERE it
     * comes from: that one fires on every ordinary hit (which is how the Trench
     * ended up at 75-90% suppression), this one is a periodic, telegraphed ability
     * you can see coming. The Bog Witch's whole reason to exist, and the shape the
     * Abyssal Serpent's Bite uses.
     */
    appliesAntiheal?: { reduction: number; durationMs: number };
    /**
     * PLAGUE HEX — the landed charged hit EXTENDS every monster DoT already on the
     * target by `extendMs` (clamped to `maxTotalMs` so a support mob cannot make a
     * poison effectively permanent).
     *
     * ⚠ It creates NO new stacks and no new DoT. That restriction is the whole
     * design: the evolved Swamp hexer is a SUPPORT creature that makes the rest of
     * the biome's poison matter longer, not a fourth thing applying its own poison.
     * With nothing else in the fight it does nothing at all, which is correct.
     */
    refreshesPlayerDots?: { extendMs: number; maxTotalMs: number };
    /**
     * CHILL GATE — the ability is unavailable until the target is carrying at least
     * this many stacks of the node's ambient ramp (`AmbientRampPayload`).
     *
     * Tundra's Frostbind: the caster's root only comes online once the room has
     * already chilled you, so the environment and the roster are one mechanic
     * instead of two. A simple threshold on purpose — no continuous formula.
     *
     * When the gate is closed the monster simply keeps making ordinary attacks; the
     * charge stays armed and fires as soon as the threshold is met.
     */
    requiresAmbientStacks?: number;
    /** Stun each player caught by the resolved AoE. */
    stunMs?: number;
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
    /**
     * DEVOUR — the caster restores this fraction of its own maxHp when the charged
     * hit LANDS (never on a miss, an evade, or an aborted wind-up). The Trench
     * serpent's signature: a slow, enormous, entirely readable bite that you have to
     * actually answer, because eating it hands the fight back to the boss.
     */
    healsSelfPct?: number;
    aoe?: { radius: number; damageMult?: number };
    /** Lingering toxic pool left at the planted impact point after resolution. */
    pool?: {
      durationMs: number;
      damagePerTick: number;
      tickIntervalMs: number;
      slowSpeedMult?: number;
      /** Non-stacking damage-taken debuff refreshed while inside. */
      vulnerability?: { damageTakenPct: number; durationMs: number };
      /** Burst at expiry, resolved through the owning monster's hit pipeline. */
      detonationMultiplier?: number;
    };
    /** Delayed spoke-shaped aftershock planted when the main charged AoE lands. */
    aftershock?: {
      kind: 'radial-fault-lines';
      delayMs: number;
      rayCount: number;
      length: number;
      lineRadius: number;
      innerRadius?: number;
      damageMultiplier: number;
    };
  };
}
