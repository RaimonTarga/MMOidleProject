/**
 * Abilities catalog — the active-ability system, distinct from the passive
 * talent tree (`UsesSkills`).
 *
 * Two slot families: a **Technique** (the offensive/tactical active) and a
 * **Guard** (the defensive/recovery/status active). Mobility is a TAG, never a
 * slot. A Technique does NOT have to be enemy-facing: Frenzy is an instant
 * self-buff and is still a Technique, because its job is offense.
 *
 * State (the learned pool + equipped slots) lives on `TracksProgression`, exactly
 * like runes — abilities are build/loadout data, not a recalculated component.
 * Firing behavior lives in `server/src/systems/player/abilities/`.
 *
 * PROGRESSION IS AUTHORED, NOT SCALED (design_docs/ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md
 * §1.3). Every ability owns one authored {@link AbilityRank} per player tier from
 * its home tier onward. It is the SAME learned ability throughout — the rank is a
 * display numeral, never a second loadout entry. Once a mechanic reaches its
 * natural ceiling (Sweep at 100% splash) the next rank deepens a different axis
 * (cooldown) instead of inflating the first one forever.
 */

export type AbilitySlot = "technique" | "guard";

/** Every slot kind, for iteration. */
export const ABILITY_SLOTS: readonly AbilitySlot[] = ["technique", "guard"];

/**
 * Behavioral tags. Tags exist because SYSTEMS need them, not for taxonomy.
 *
 * - `mobility` — the Scout core's mobility cooldown reduction and refund apply.
 * - `recovery` — a Recovery SKILL: it activates a fraction of the player's
 *   Recovery rate, and is the only thing `defense.recovery-skill-potency`
 *   amplifies. Passive Recovery access is deliberately NOT tagged.
 * - `mitigation` — a continuous defensive magnitude that `guard.potency-pct`
 *   may amplify.
 * - `control` — applies slow/root/stun to a target.
 * - `cleanse` — removes something rather than adding it; discrete, so generic
 *   potency must never touch it.
 * - `offensive-buff` — a self-facing offensive window.
 */
export type AbilityTag =
  | "mobility"
  | "recovery"
  | "mitigation"
  | "control"
  | "cleanse"
  | "offensive-buff";

/**
 * How an ability EXECUTES, independent of which slot it occupies. The slot says
 * whose problem it solves; the shape says how the server runs it.
 * - `armed`: rides the next qualifying attack cycle (`hasArmedAbility`).
 * - `cast`: enters an explicit wind-up (`isCastingAbility`), then resolves.
 * - `charge`: winds up, then rushes toward its target at an authored speed.
 * - `reposition`: resolves instantly by MOVING the player.
 * - `instant`: resolves immediately and self-facing.
 */
export type AbilityShape = "armed" | "cast" | "charge" | "reposition" | "instant";

/**
 * Built-in auto-fire trigger (the default heuristic). Abilities fire on this with
 * zero runes equipped. A `fire-technique` / `fire-guard` rune action overrides the
 * timing for its slot — when a rune drives the slot, this trigger is ignored.
 */
export type AbilityTrigger =
  /** Technique: arm whenever in combat with a live target (and off cooldown). */
  | { kind: "in-combat" }
  /** Guard: fire when HP fraction is at/below `hpPct` (0..1) and off cooldown. */
  | { kind: "hp-below"; hpPct: number }
  /** Guard: fire when `count`+ enemies are aggroed onto the player (off cooldown). */
  | { kind: "n-aggro"; count: number }
  /** Guard: fire when the player carries a harmful debuff/DoT (and off cooldown). */
  | { kind: "has-debuff" }
  /**
   * Guard: fire while the player is HARD-CONTROLLED (stun / lockdown). Break
   * Free's whole point, and the reason ability execution has an explicit
   * exception to the "you cannot act while stunned" rule.
   */
  | { kind: "has-hard-control" }
  /**
   * Technique: fire when the engageable target sits at least `minGapPx` beyond
   * the player's normal reach — the gap-closer's "there is actually a gap to
   * close" test. Without it Charge burns its cooldown while already adjacent.
   */
  | { kind: "target-beyond-reach"; minGapPx: number }
  /**
   * Technique: fire when an enemy is within `maxGapPx` of the player — the
   * disengage/spacing test.
   */
  | { kind: "enemy-within"; maxGapPx: number };

/**
 * What an ability does when it fires.
 *
 * - `cleave`: Technique rider — the armed next attack splashes to nearby enemies.
 * - `empower`: Technique rider — the armed next attack hits for `damageMult`×
 *   damage (single-target; no splash).
 * - `cast-strike`: casted Technique payload. Unlike `empower` — which rides the
 *   NEXT attack — this resolves on its own when the wind-up completes, dealing
 *   `damageMult` × the player's attack. `radius` > 0 makes it AoE around the
 *   target; `stunMs` > 0 hard-controls the target on resolve (Stunning Strike).
 * - `expose-weakness`: Technique rider — the target takes `damageTakenPct` more
 *   damage from everyone for `durationMs`.
 * - `slow-strike`: Technique rider — a modest damage bump plus a SLOW. The
 *   target still attacks and casts; only its movement suffers.
 * - `root-strike`: Technique rider — a modest damage bump plus a ROOT. The target
 *   cannot move but may still attack anything already in its reach.
 * - `reposition`: resolves by MOVING the player `distance` px toward
 *   (`toward: true`, Charge) or away from (`toward: false`, Disengage) the
 *   current target. `empowerMult`, when present, additionally arms the next
 *   attack, turning a gap-closer into an alpha strike.
 * - `bramble`: temporary hardening + FLAT retaliation. Reflect is never a
 *   fraction of damage taken, so "get hit harder" can never mean "deal more".
 * - `damage-reduction`: Guard immediate — an EXPLICIT BUFF (shows in the buff
 *   bar) granting `drPct` damage reduction for `durationMs`.
 *   `knockbackResistPct`, when present, reduces incoming knockback distance.
 * - `cleanse`: Guard immediate — strips `stacks` from up to `debuffs` distinct
 *   harmful effects. DISCRETE: never run these counts through a percentage
 *   multiplier. Carries no DR rider — mitigation is Brace/Endure's job.
 * - `heal`: Guard Recovery access — switches on `recoveryPct` of the player's
 *   Recovery RATE for `durationMs` (antiheal applies). NOT a flat % of max HP,
 *   so investing in Recovery gear makes the button better.
 * - `attack-speed`: Technique instant — a pure attack-speed window (Frenzy).
 *   Deliberately grants attack speed and NOTHING else.
 * - `break-free`: Guard immediate — removes the current hard control, optionally
 *   followed by `controlResistPct` control resistance for `controlResistMs`.
 */
export type AbilityEffectSpec =
  | { kind: "cleave"; splashPct: number; radius: number }
  | { kind: "empower"; damageMult: number }
  | { kind: "cast-strike"; damageMult: number; radius?: number; stunMs?: number }
  | { kind: "expose-weakness"; damageTakenPct: number; durationMs: number }
  | { kind: "slow-strike"; damageMult: number; slowPct: number; slowDurationMs: number }
  | { kind: "root-strike"; damageMult: number; rootMs: number }
  | { kind: "reposition"; distance: number; toward: boolean; empowerMult?: number }
  | { kind: "bramble"; platingBonus: number; reflectFlat: number; durationMs: number }
  | { kind: "damage-reduction"; drPct: number; durationMs: number; knockbackResistPct?: number }
  | { kind: "cleanse"; stacks: number; debuffs: number }
  | { kind: "heal"; recoveryPct: number; durationMs: number }
  | { kind: "attack-speed"; attackSpeedPct: number; durationMs: number }
  | { kind: "break-free"; controlResistPct?: number; controlResistMs?: number };

/**
 * One authored rank. Index 0 in {@link AbilityDef.ranks} is the ability's HOME
 * TIER; each later entry is the single upgrade granted when the player advances
 * a tier while owning it.
 *
 * Every axis is authored per rank rather than derived, which is the entire point:
 * a rank may deepen damage, or duration, or cooldown, or nothing at all on the
 * axis the previous rank touched.
 */
export interface AbilityRank {
  effect: AbilityEffectSpec;
  /** Min ms between fires (per-ability cooldown, tracked on TracksCombat). */
  cooldownMs: number;
  /** Wind-up duration. REQUIRED for `shape: "cast"` / `shape: "charge"`. */
  castMs?: number;
  /** Charge speed relative to the player's normal movement speed. */
  chargeSpeedMult?: number;
  /** Maximum time a charge may pursue its original target before ending. */
  chargeMaxMs?: number;
  /**
   * Extra ENGAGEMENT reach, in px, beyond the player's normal attack range.
   *
   * This is what makes a gap-closer and a long-range cast worth having. Ability
   * targeting is otherwise limited to whatever the player can already hit, which
   * is why Charge used to fire only once it was already adjacent (nothing to
   * close) and why a melee build could never open with a cast. Charge carries its
   * dash distance here; Snipe carries its bespoke +300 px.
   *
   * It extends the ABILITY only — the player's `attackRange` is untouched, so a
   * melee character equipping Snipe gains a ranged tool without becoming a ranged
   * basic-attacker.
   */
  rangeBonus?: number;
}

export interface AbilityDef {
  id: string;
  name: string;
  slot: AbilitySlot;
  /** How the server executes it. */
  shape: AbilityShape;
  tags: AbilityTag[];
  blurb: string;
  /** Home tier — the player tier `ranks[0]` is authored for. */
  tier: number;
  /**
   * Evolution family. Grouping only — an evolution NEVER destroys or replaces its
   * predecessor, so unlike gear lineages there is no consume/reconstruct here.
   */
  lineageId?: string;
  /** Built-in auto-fire heuristic (runes can override per slot). */
  trigger: AbilityTrigger;
  /**
   * Authored ranks, `ranks[0]` = home tier. Never empty. Ranks past the last
   * authored one clamp: an ability simply stops deepening until T5+ is designed.
   */
  ranks: readonly [AbilityRank, ...AbilityRank[]];
  icon?: string;
}

/**
 * Status-effect id for the active Guard-ability buff. The server applies it
 * (with `totalMs`/`drPct` in data), an onDamageTaken listener reads it, and a
 * buff descriptor projects it to the buff bar (label/color from the ability in
 * that slot). Doubles as the buff id.
 *
 * This is GUARD SLOT 0. Slot 1 uses {@link ABILITY_GUARD_EFFECT_IDS}[1] — two
 * equipped Guards need independent effects, and since status `data` is
 * numbers-only the owning slot has to be encoded in the id itself.
 */
export const ABILITY_GUARD_EFFECT_ID = "ability-guard";

/** Guard DR buff effect id per slot index. Length tracks {@link MAX_ABILITY_SLOTS}. */
export const ABILITY_GUARD_EFFECT_IDS = ["ability-guard", "ability-guard-2"] as const;

export type AbilityGuardEffectId = (typeof ABILITY_GUARD_EFFECT_IDS)[number];

/** The Guard DR effect id owned by a slot (clamped, so a bad index can't collide). */
export function guardEffectIdForSlot(slotIndex: number): AbilityGuardEffectId {
  return ABILITY_GUARD_EFFECT_IDS[slotIndex] ?? ABILITY_GUARD_EFFECT_IDS[0];
}

/**
 * Recovery-skill buff ids, one per GUARD SLOT. Second Wind and Recuperate are
 * deliberately different shapes of the same access (strong/short vs weak/long),
 * so a player may equip both — and they must not overwrite each other's window.
 */
export const ABILITY_RECOVERY_EFFECT_IDS = [
  "ability-second-wind",
  "ability-second-wind-2",
] as const;

export type AbilityRecoveryEffectId = (typeof ABILITY_RECOVERY_EFFECT_IDS)[number];

export function recoveryEffectIdForSlot(slotIndex: number): AbilityRecoveryEffectId {
  return ABILITY_RECOVERY_EFFECT_IDS[slotIndex] ?? ABILITY_RECOVERY_EFFECT_IDS[0];
}

/** Back-compat alias — slot 0's Recovery buff id. */
export const ABILITY_SECOND_WIND_EFFECT_ID = ABILITY_RECOVERY_EFFECT_IDS[0];

/** Frenzy's attack-speed window (read at the attack-cadence gate, never a stat write). */
export const ABILITY_FRENZY_EFFECT_ID = "ability-frenzy";

/** Break Free's post-escape control resistance. */
export const ABILITY_CONTROL_RESIST_EFFECT_ID = "ability-control-resist";

/** Hamstring's slow on a monster. */
export const ABILITY_SLOW_EFFECT_ID = "ability-slowed";

/** Binding Strike's root on a monster. */
export const ABILITY_ROOT_EFFECT_ID = "ability-rooted";

/**
 * Client-effect tags stamped on a `player-hit` event so the client can overlay
 * the right in-world FX on top of the normal attack FX and pulse the HUD icon.
 * Shared so the server (which stamps `ctx.metadata.clientEffects`) and the
 * client FX dispatcher agree on the strings.
 */
export const ABILITY_SWEEP_FX = "ability-sweep";
export const ABILITY_EXPOSE_WEAKNESS_FX = "ability-expose-weakness";
export const ABILITY_HAMSTRING_FX = "ability-hamstring";
export const ABILITY_BINDING_STRIKE_FX = "ability-binding-strike";
export const ABILITY_QUICK_STRIKE_FX = "ability-quick-strike";

/**
 * Generic client-effect tag for Techniques that do not need bespoke in-world FX.
 * The client uses it to pulse the Technique HUD icon and start the cooldown sweep.
 */
export const ABILITY_TECHNIQUE_FIRED_FX = "ability-technique-fired";

export const EXPOSE_WEAKNESS_EFFECT_ID = "expose-weakness";

/**
 * Equipped abilities, as ORDERED lists.
 *
 * List order IS arbitration priority: index 0 is considered first when several
 * rune conditions go valid on the same tick. Each list's length is bounded by
 * {@link abilitySlotCount}; an unused slot is simply a shorter list.
 */
export interface EquippedAbilities {
  techniques: string[];
  guards: string[];
}

export function emptyEquippedAbilities(): EquippedAbilities {
  return { techniques: [], guards: [] };
}

/**
 * Number of ability slots at a given player tier.
 *
 * Deliberately keyed on PLAYER TIER, not Global Mastery — Biome Mastery owns
 * ability unlocks; tier owns ability slots. T1–T2 → 1/1 (learn the
 * fundamentals), T3 → 2/1 (offensive repertoire), T4+ → 2/2 (full tactical
 * loadout). A third slot is deliberately NOT assumed.
 */
export function abilitySlotCount(playerTier: number): Record<AbilitySlot, number> {
  return {
    technique: playerTier >= 3 ? 2 : 1,
    guard: playerTier >= 4 ? 2 : 1,
  };
}

/** Highest slot count any tier grants — sizes the per-slot buff-id tables. */
export const MAX_ABILITY_SLOTS = 2;

// ── Rank resolution ──────────────────────────────────────────────────────────

/**
 * 0-based index into {@link AbilityDef.ranks} for a player at `playerTier`.
 *
 * `rank = playerTier - homeTier + 1`, clamped to the authored ranks. Clamping at
 * the top is the T5+ story: an ability keeps working at its last authored rank
 * until a bespoke upgrade is written for it. Clamping at the bottom matters for
 * a de-levelled or admin-edited character, which must never read `ranks[-1]`.
 */
export function abilityRankIndex(ability: AbilityDef, playerTier: number): number {
  return Math.max(0, Math.min(ability.ranks.length - 1, playerTier - ability.tier));
}

/** 1-based rank, the number the UI shows as a numeral. */
export function abilityRankNumber(ability: AbilityDef, playerTier: number): number {
  return abilityRankIndex(ability, playerTier) + 1;
}

/** Highest authored rank — how far this ability's lineage currently goes. */
export function abilityMaxRank(ability: AbilityDef): number {
  return ability.ranks.length;
}

/** The whole authored rank for this player. */
export function abilityRankAt(ability: AbilityDef, playerTier: number): AbilityRank {
  return ability.ranks[abilityRankIndex(ability, playerTier)]!;
}

/** Authored effect at this player's rank, BEFORE Technique Power. */
export function abilityEffectAt(
  ability: AbilityDef,
  playerTier: number,
): AbilityEffectSpec {
  return abilityRankAt(ability, playerTier).effect;
}

/** Authored cooldown at this player's rank, BEFORE cooldown reduction. */
export function abilityCooldownMs(ability: AbilityDef, playerTier: number): number {
  return abilityRankAt(ability, playerTier).cooldownMs;
}

/** Authored wind-up at this player's rank, BEFORE cast speed. 0 when no wind-up applies. */
export function abilityCastMs(ability: AbilityDef, playerTier: number): number {
  return abilityRankAt(ability, playerTier).castMs ?? 0;
}

/**
 * Extra engagement reach at this player's rank. See {@link AbilityRank.rangeBonus}.
 */
export function abilityRangeBonus(ability: AbilityDef, playerTier: number): number {
  return abilityRankAt(ability, playerTier).rangeBonus ?? 0;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"] as const;

/** Rank numeral for display ("Sweep III"). Falls back to digits past X. */
export function abilityRankNumeral(rank: number): string {
  return ROMAN[rank - 1] ?? String(rank);
}

/** Display name including the rank numeral, e.g. `Sweep III`. */
export function abilityDisplayName(ability: AbilityDef, playerTier: number): string {
  return `${ability.name} ${abilityRankNumeral(abilityRankNumber(ability, playerTier))}`;
}

/**
 * Which effect kinds carry an OFFENSIVE payload that Technique Power scales, and
 * which fields of them.
 *
 * Authored explicitly per kind rather than as a blanket multiplier — adding an
 * effect kind means deciding this deliberately. Defensive/utility Guard effects
 * are absent by design: Guard potency is a separate stat family and the budgets
 * must not leak. Control durations, dash distances, Snipe's range and Expose
 * Weakness's vulnerability are absent for the same reason — a damage stat must
 * not buy control or reach.
 */
export const TECHNIQUE_POWER_FIELDS: Partial<
  Record<AbilityEffectSpec["kind"], readonly string[]>
> = {
  cleave: ["splashPct"],
  "cast-strike": ["damageMult"],
  empower: ["damageMult"],
  "slow-strike": ["damageMult"], // NOT slowPct / slowDurationMs
  "root-strike": ["damageMult"], // NOT rootMs
  // Only the strike rider — Technique Power must never lengthen a dash.
  reposition: ["empowerMult"],
  // `bramble`, `attack-speed`, `expose-weakness` are absent on purpose.
};

/**
 * How an armed Technique resolves for a MULTI-HIT attack cycle — the Reload
 * magazine case.
 * - `first-hit`: the payload lands once, on the first qualifying hit.
 * - `distribute`: a scalar payload is split across the cycle's hits.
 *
 * Deliberately per-effect-kind rather than a universal `consumeMode`: a 1.5 s
 * stun must not silently become five 0.3 s stuns, and neither must a root.
 */
export const ABILITY_MULTIHIT_MODE: Record<
  AbilityEffectSpec["kind"],
  "first-hit" | "distribute"
> = {
  cleave: "distribute",
  // A cast is a single deliberate action — never once per bullet.
  "cast-strike": "first-hit",
  empower: "first-hit",
  "expose-weakness": "first-hit",
  "slow-strike": "first-hit",
  "root-strike": "first-hit",
  // A dash happens once; a reflect window is a state, not a per-bullet payload.
  reposition: "first-hit",
  bramble: "first-hit",
  "damage-reduction": "first-hit",
  cleanse: "first-hit",
  heal: "first-hit",
  "attack-speed": "first-hit",
  "break-free": "first-hit",
};

// ── The roster ───────────────────────────────────────────────────────────────
//
// 18 abilities across T1–T4: 11 Techniques, 7 Guards. The count imbalance is
// deliberate — later progression grants the second Technique slot before the
// second Guard slot, and the Technique space naturally has more
// positional/control/offensive variants.
//
// ALL NUMBERS ARE FIRST-PASS SEEDS. They express relative roles and give the
// simulation a coherent starting point; the balance pass owns the values.

const abilities: AbilityDef[] = [
  // ── T1: the fundamentals ───────────────────────────────────────────────────
  // Three Techniques (distribute damage / amplify damage / deal burst) and three
  // Guards (prevent / recover / remove), so the first tier teaches the whole
  // decision space before adding a single new verb.
  {
    id: "sweep",
    name: "Sweep",
    slot: "technique",
    shape: "armed",
    tags: [],
    blurb: "Arms your next attack to cleave nearby enemies.",
    tier: 1,
    lineageId: "sweep",
    trigger: { kind: "in-combat" },
    icon: "sweep",
    // Splash has an intuitive ceiling: 100% means a secondary target receives a
    // full-strength copy of the payload. Once T3 reaches it, T4 buys frequency
    // instead of inventing 120% splash.
    ranks: [
      { effect: { kind: "cleave", splashPct: 0.6, radius: 90 }, cooldownMs: 6000 },
      { effect: { kind: "cleave", splashPct: 0.8, radius: 90 }, cooldownMs: 6000 },
      { effect: { kind: "cleave", splashPct: 1.0, radius: 90 }, cooldownMs: 6000 },
      { effect: { kind: "cleave", splashPct: 1.0, radius: 90 }, cooldownMs: 5000 },
    ],
  },
  {
    id: "second-wind",
    name: "Second Wind",
    slot: "guard",
    shape: "instant",
    tags: ["recovery"],
    blurb: "Catch your breath, sharply raising your recovery rate for a few seconds.",
    tier: 1,
    trigger: { kind: "hp-below", hpPct: 0.6 },
    icon: "second-wind",
    // The STRONG/SHORT half of the Recovery pair (Recuperate is weak/long).
    // At base Recovery 10, rank I restores ~20% of max HP over the window and
    // rank III ~28%, before antiheal and the overheal ward.
    ranks: [
      { effect: { kind: "heal", recoveryPct: 0.5, durationMs: 4000 }, cooldownMs: 12000 },
      { effect: { kind: "heal", recoveryPct: 0.6, durationMs: 4000 }, cooldownMs: 12000 },
      { effect: { kind: "heal", recoveryPct: 0.7, durationMs: 4000 }, cooldownMs: 12000 },
      { effect: { kind: "heal", recoveryPct: 0.7, durationMs: 4000 }, cooldownMs: 10500 },
    ],
  },
  {
    id: "cleanse",
    name: "Cleanse",
    slot: "guard",
    shape: "instant",
    tags: ["cleanse"],
    blurb: "Purge the worst of what is eating you — stacks first, then a second affliction.",
    tier: 1,
    trigger: { kind: "has-debuff" },
    icon: "cleanse",
    // DISCRETE progression: stacks, then breadth, then stacks again. Never run
    // these counts through a percentage multiplier and round. Cleanse carries no
    // DR rider — mitigation belongs to Brace/Endure, and hard control to Break Free.
    ranks: [
      { effect: { kind: "cleanse", stacks: 1, debuffs: 1 }, cooldownMs: 10000 },
      { effect: { kind: "cleanse", stacks: 2, debuffs: 1 }, cooldownMs: 10000 },
      { effect: { kind: "cleanse", stacks: 2, debuffs: 2 }, cooldownMs: 10000 },
      { effect: { kind: "cleanse", stacks: 3, debuffs: 2 }, cooldownMs: 10000 },
    ],
  },
  {
    id: "brace",
    name: "Brace",
    slot: "guard",
    shape: "instant",
    tags: ["mitigation"],
    blurb: "Brace for impact — heavy mitigation and footing, for a moment.",
    tier: 1,
    trigger: { kind: "hp-below", hpPct: 0.5 },
    icon: "brace",
    // The BURST mitigation Guard: high DR, short window. DR approaches a safe
    // ceiling and then stops — later ranks buy duration and knockback footing
    // rather than walking toward immunity.
    ranks: [
      {
        effect: { kind: "damage-reduction", drPct: 0.35, durationMs: 3000, knockbackResistPct: 0.5 },
        cooldownMs: 10000,
      },
      {
        effect: { kind: "damage-reduction", drPct: 0.4, durationMs: 3000, knockbackResistPct: 0.55 },
        cooldownMs: 10000,
      },
      {
        effect: { kind: "damage-reduction", drPct: 0.45, durationMs: 3000, knockbackResistPct: 0.6 },
        cooldownMs: 10000,
      },
      {
        effect: { kind: "damage-reduction", drPct: 0.45, durationMs: 3500, knockbackResistPct: 0.65 },
        cooldownMs: 10000,
      },
    ],
  },
  {
    id: "power-strike",
    name: "Power Strike",
    slot: "technique",
    shape: "cast",
    tags: [],
    blurb: "Wind up a devastating blow. You stop attacking while it charges — and hard control breaks it.",
    tier: 1,
    trigger: { kind: "in-combat" },
    icon: "power-strike",
    // THE REFERENCE ALL-DAMAGE CAST. Every other cast Technique spends part of
    // its budget on range or control and must therefore deal less than this at
    // comparable progression. Its only axis is damage, so that is the only axis
    // its ranks touch.
    ranks: [
      { effect: { kind: "cast-strike", damageMult: 3.0 }, cooldownMs: 10000, castMs: 1600 },
      { effect: { kind: "cast-strike", damageMult: 3.5 }, cooldownMs: 10000, castMs: 1600 },
      { effect: { kind: "cast-strike", damageMult: 4.0 }, cooldownMs: 10000, castMs: 1600 },
      { effect: { kind: "cast-strike", damageMult: 4.5 }, cooldownMs: 10000, castMs: 1600 },
    ],
  },
  {
    id: "expose-weakness",
    name: "Expose Weakness",
    slot: "technique",
    shape: "armed",
    tags: [],
    blurb: "Arms your next attack to expose the target, increasing all damage it takes.",
    tier: 1,
    trigger: { kind: "in-combat" },
    icon: "expose-weakness",
    // Vulnerability is capped EARLY and deliberately: a multiplicative
    // damage-taken effect scales with the whole build and with every other
    // attacker, so once it reaches its band the next rank buys uptime instead.
    ranks: [
      { effect: { kind: "expose-weakness", damageTakenPct: 0.15, durationMs: 4000 }, cooldownMs: 12000 },
      { effect: { kind: "expose-weakness", damageTakenPct: 0.175, durationMs: 4000 }, cooldownMs: 12000 },
      { effect: { kind: "expose-weakness", damageTakenPct: 0.2, durationMs: 4000 }, cooldownMs: 12000 },
      { effect: { kind: "expose-weakness", damageTakenPct: 0.2, durationMs: 5000 }, cooldownMs: 12000 },
    ],
  },

  // ── T2: positioning, soft control, sustained mitigation ────────────────────
  {
    id: "hamstring",
    name: "Hamstring",
    slot: "technique",
    shape: "armed",
    tags: ["control"],
    blurb: "Arms your next attack to cripple the target's stride.",
    tier: 2,
    trigger: { kind: "in-combat" },
    icon: "hamstring",
    // Rung one of the control ladder: movement slowed, actions untouched. The
    // control eats most of the power budget, which is why the damage rider sits
    // far below Power Strike.
    ranks: [
      { effect: { kind: "slow-strike", damageMult: 1.15, slowPct: 0.4, slowDurationMs: 3000 }, cooldownMs: 6000 },
      { effect: { kind: "slow-strike", damageMult: 1.2, slowPct: 0.45, slowDurationMs: 3500 }, cooldownMs: 6000 },
      { effect: { kind: "slow-strike", damageMult: 1.25, slowPct: 0.5, slowDurationMs: 4000 }, cooldownMs: 5500 },
    ],
  },
  {
    id: "bramble-guard",
    name: "Bramble Guard",
    slot: "guard",
    shape: "instant",
    tags: ["mitigation"],
    blurb: "Harden your skin with thorns — gain armor and injure attackers who strike you.",
    tier: 2,
    // Jungle is the high-density biome: the answer to being hit OFTEN is to make
    // each of those hits cost the attacker something.
    trigger: { kind: "n-aggro", count: 3 },
    icon: "bramble-guard",
    ranks: [
      { effect: { kind: "bramble", platingBonus: 6, reflectFlat: 6, durationMs: 5000 }, cooldownMs: 12000 },
      { effect: { kind: "bramble", platingBonus: 8, reflectFlat: 10, durationMs: 5000 }, cooldownMs: 12000 },
      { effect: { kind: "bramble", platingBonus: 10, reflectFlat: 14, durationMs: 5000 }, cooldownMs: 12000 },
    ],
  },
  {
    id: "charge",
    name: "Charge",
    slot: "technique",
    shape: "charge",
    tags: ["mobility"],
    blurb: "Wind up, then surge across the gap and land the next blow with the weight of the rush.",
    tier: 2,
    // The gap-closer only fires when there is a gap. Paired with `rangeBonus`,
    // this is what makes Charge a real tool: it engages a target it could not
    // otherwise reach, closes the distance, and lands the empowered blow.
    trigger: { kind: "target-beyond-reach", minGapPx: 70 },
    icon: "charge",
    // Distance never scales — the movement itself is part of the budget, and a
    // longer dash is not a "deeper" ability. Ranks buy the strike rider, then
    // frequency.
    ranks: [
      {
        effect: { kind: "reposition", distance: 300, toward: true, empowerMult: 2.2 },
        cooldownMs: 9000,
        castMs: 400,
        chargeSpeedMult: 4,
        chargeMaxMs: 1500,
        rangeBonus: 300,
      },
      {
        effect: { kind: "reposition", distance: 300, toward: true, empowerMult: 2.5 },
        cooldownMs: 9000,
        castMs: 400,
        chargeSpeedMult: 4,
        chargeMaxMs: 1500,
        rangeBonus: 300,
      },
      {
        effect: { kind: "reposition", distance: 300, toward: true, empowerMult: 2.8 },
        cooldownMs: 8500,
        castMs: 400,
        chargeSpeedMult: 4,
        chargeMaxMs: 1500,
        rangeBonus: 300,
      },
    ],
  },
  {
    id: "endure",
    name: "Endure",
    slot: "guard",
    shape: "instant",
    tags: ["mitigation"],
    blurb: "Set your jaw and take it — modest mitigation, held for a long while.",
    tier: 2,
    trigger: { kind: "hp-below", hpPct: 0.7 },
    icon: "endure",
    // The deliberate counterpart to Brace: lower mitigation, much longer window.
    // The two must stay recognisably different, so Endure's ranks buy duration,
    // never a march toward Brace's DR.
    ranks: [
      { effect: { kind: "damage-reduction", drPct: 0.18, durationMs: 8000 }, cooldownMs: 14000 },
      { effect: { kind: "damage-reduction", drPct: 0.2, durationMs: 8000 }, cooldownMs: 14000 },
      { effect: { kind: "damage-reduction", drPct: 0.2, durationMs: 10000 }, cooldownMs: 14000 },
    ],
  },

  // ── T3: tempo, and hard movement/control counterplay ───────────────────────
  {
    id: "binding-strike",
    name: "Binding Strike",
    slot: "technique",
    shape: "armed",
    tags: ["control"],
    blurb: "Arms your next attack to pin the target where it stands.",
    tier: 3,
    trigger: { kind: "in-combat" },
    icon: "binding-strike",
    // Rung two of the ladder. Root stops MOVEMENT only: a rooted monster still
    // swings at anything already in its reach. That is what keeps root
    // structurally distinct from stun rather than a weaker number of it.
    ranks: [
      { effect: { kind: "root-strike", damageMult: 1.2, rootMs: 1500 }, cooldownMs: 8000 },
      { effect: { kind: "root-strike", damageMult: 1.3, rootMs: 2000 }, cooldownMs: 8000 },
    ],
  },
  {
    id: "break-free",
    name: "Break Free",
    slot: "guard",
    shape: "instant",
    tags: ["cleanse", "control"],
    blurb: "Tear yourself out of whatever is holding you — and shrug off the next attempt.",
    tier: 3,
    // The one trigger that must fire WHILE the player is locked down. Ordinary
    // ability execution is not blocked by stun, but this is the trigger that
    // depends on it.
    trigger: { kind: "has-hard-control" },
    icon: "break-free",
    // Deliberately situational. It should be extremely valuable in control-heavy
    // content without making that content mathematically impossible without it.
    ranks: [
      { effect: { kind: "break-free" }, cooldownMs: 14000 },
      { effect: { kind: "break-free", controlResistPct: 0.5, controlResistMs: 3000 }, cooldownMs: 12000 },
    ],
  },
  {
    id: "frenzy",
    name: "Frenzy",
    slot: "technique",
    shape: "instant",
    tags: ["offensive-buff"],
    blurb: "Cut loose — your hands move faster for a few furious seconds.",
    tier: 3,
    trigger: { kind: "in-combat" },
    icon: "frenzy",
    // ATTACK SPEED ONLY. No damage, no crit, no on-hit, no movement. Attack speed
    // already interacts with every class engine — basic attacks, on-hit procs,
    // energy generation, cadence, DoT application — and that is identity enough.
    ranks: [
      { effect: { kind: "attack-speed", attackSpeedPct: 0.3, durationMs: 4000 }, cooldownMs: 10000 },
      { effect: { kind: "attack-speed", attackSpeedPct: 0.35, durationMs: 5000 }, cooldownMs: 10000 },
    ],
  },
  {
    id: "quick-strike",
    name: "Quick Strike",
    slot: "technique",
    shape: "armed",
    tags: [],
    blurb: "A small, fast opening — nothing special, and always ready.",
    tier: 3,
    trigger: { kind: "in-combat" },
    icon: "quick-strike",
    // The "spam skill" archetype, deliberately much weaker per activation than a
    // normal Technique. Its value is FREQUENCY, which is what makes it the build
    // option for anything that cares about how often you use a Technique.
    ranks: [
      { effect: { kind: "empower", damageMult: 1.25 }, cooldownMs: 3000 },
      { effect: { kind: "empower", damageMult: 1.3 }, cooldownMs: 2500 },
    ],
  },

  // ── T4: advanced range, escape, hard CC, long sustain ──────────────────────
  // Only rank I is authored — these debut at the end of the supplied biome map.
  // T5+ must give each of them a bespoke upgrade, not resume percentage growth.
  {
    id: "disengage",
    name: "Disengage",
    slot: "technique",
    shape: "reposition",
    tags: ["mobility"],
    blurb: "Break contact and buy yourself the room to keep fighting.",
    tier: 4,
    trigger: { kind: "enemy-within", maxGapPx: 90 },
    icon: "disengage",
    // A Technique because its tactical purpose is to preserve offensive
    // spacing/range — not because every Technique must deal damage. The
    // reposition IS the effect, so it carries no strike rider.
    ranks: [
      { effect: { kind: "reposition", distance: 180, toward: false }, cooldownMs: 8000 },
    ],
  },
  {
    id: "recuperate",
    name: "Recuperate",
    slot: "guard",
    shape: "instant",
    tags: ["recovery"],
    blurb: "Settle into a long, steady mend that outlasts the fight's worst stretch.",
    tier: 4,
    trigger: { kind: "hp-below", hpPct: 0.7 },
    icon: "recuperate",
    // The WEAK/LONG half of the Recovery pair. Scales from Recovery and Recovery
    // Skill Potency; never from offense.
    ranks: [
      { effect: { kind: "heal", recoveryPct: 0.25, durationMs: 10000 }, cooldownMs: 16000 },
    ],
  },
  {
    id: "snipe",
    name: "Snipe",
    slot: "technique",
    shape: "cast",
    tags: [],
    blurb: "Line up a deliberate shot from far outside your usual reach.",
    tier: 4,
    trigger: { kind: "in-combat" },
    icon: "snipe",
    // Less damage than Power Strike IV on purpose: part of the budget is spent on
    // extraordinary range. `rangeBonus` extends the ABILITY only, so a melee
    // character gains a ranged tool without becoming a ranged basic-attacker.
    ranks: [
      {
        effect: { kind: "cast-strike", damageMult: 3.0 },
        cooldownMs: 12000,
        castMs: 2000,
        rangeBonus: 300,
      },
    ],
  },
  {
    id: "stunning-strike",
    name: "Stunning Strike",
    slot: "technique",
    shape: "cast",
    tags: ["control"],
    blurb: "A committed blow that puts the target on the floor.",
    tier: 4,
    trigger: { kind: "in-combat" },
    icon: "stunning-strike",
    // Rung three of the ladder — movement AND actions stopped. The strongest
    // early control, so it pays in cast commitment, a long cooldown, and less
    // damage than Power Strike.
    ranks: [
      {
        effect: { kind: "cast-strike", damageMult: 2.3, stunMs: 1500 },
        cooldownMs: 14000,
        castMs: 1500,
      },
    ],
  },
];

export const ABILITY_DATABASE = new Map<string, AbilityDef>(
  abilities.map((a) => [a.id, a]),
);

export function abilityDef(id: string | null | undefined): AbilityDef | undefined {
  return id ? ABILITY_DATABASE.get(id) : undefined;
}

/**
 * All known-ability ids that resolve to a real def, with renamed ids mapped
 * forward and duplicates collapsed (filters stale/removed ids).
 */
export function validAbilityIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const raw of ids) {
    const id = currentAbilityId(raw);
    if (ABILITY_DATABASE.has(id)) seen.add(id);
  }
  return [...seen];
}

/**
 * Ability ids renamed after they had already shipped. Applied on hydrate so
 * saves that learned the old id keep the ability. Additive-only — never remove
 * an entry, or the affected saves silently lose the ability.
 */
export const RENAMED_ABILITY_IDS: Record<string, string> = {
  "heavy-strike": "expose-weakness",
  // Charged Strike became the T1 Mountain **Power Strike** lineage: the same
  // wind-up-then-deliver cast, re-homed a tier earlier as the reference
  // all-damage cast. Saves that learned it keep it.
  "charged-strike": "power-strike",
};

/** Map a persisted id through {@link RENAMED_ABILITY_IDS}. */
export function currentAbilityId(id: string): string {
  return RENAMED_ABILITY_IDS[id] ?? id;
}

/**
 * THE single seam where an authored ability effect becomes the numbers the
 * server actually applies. Every consumer must go through this — a new ability
 * that reads a rank's `effect` raw silently opts out of Technique Power.
 *
 * Two layers, in order:
 * 1. the AUTHORED RANK for the player's tier (there is no generic percentage
 *    scaling any more — {@link AbilityRank} is the whole progression model);
 * 2. Technique Power, applied ONLY to fields listed in
 *    {@link TECHNIQUE_POWER_FIELDS} — i.e. offensive payloads. Guard potency is a
 *    separate stat family read at guard-fire time and must not leak in here.
 *
 * Durations, radii, control times, ranges and movement distances are never
 * touched by either layer.
 */
export function resolveAbilityEffect(
  ability: AbilityDef,
  opts: { playerTier: number; techniquePowerPct?: number },
): AbilityEffectSpec {
  const effect = abilityEffectAt(ability, opts.playerTier);
  const powerMult = 1 + Math.max(0, opts.techniquePowerPct ?? 0);
  const powerFields = TECHNIQUE_POWER_FIELDS[effect.kind] ?? [];
  if (powerMult === 1 || powerFields.length === 0) return effect;

  const out: Record<string, unknown> = { ...effect };
  for (const field of powerFields) {
    const base = out[field];
    if (typeof base !== "number") continue;
    out[field] = base * powerMult;
  }
  return out as AbilityEffectSpec;
}

/**
 * Legacy equipped shape from Step 7 (one named Technique + one named Guard).
 * Kept only so `playerRepo` can migrate old rows on hydrate — nothing new should
 * produce this shape.
 */
export interface LegacyEquippedAbilities {
  technique?: string | null;
  guard?: string | null;
}

/**
 * Coerce whatever is in a persisted row into the current list shape, dropping
 * ids that no longer resolve, duplicates, and entries that don't fit their slot.
 * Accepts the legacy `{technique, guard}` shape so old saves migrate silently.
 * Does NOT enforce the tier slot cap — that's a live check (see
 * {@link clampEquippedAbilities}) so a de-levelled row never loses data on load.
 */
export function normalizeEquippedAbilities(raw: unknown): EquippedAbilities {
  if (!raw || typeof raw !== "object") return emptyEquippedAbilities();

  const source = raw as Partial<EquippedAbilities> & LegacyEquippedAbilities;
  const fromLegacy = (id: string | null | undefined): string[] =>
    typeof id === "string" ? [id] : [];

  const pick = (list: unknown, legacy: string | null | undefined): string[] =>
    Array.isArray(list) ? list.filter((id): id is string => typeof id === "string") : fromLegacy(legacy);

  const forSlot = (ids: string[], slot: AbilitySlot): string[] => {
    const seen = new Set<string>();
    for (const raw of ids) {
      const id = currentAbilityId(raw);
      if (seen.has(id)) continue;
      if (ABILITY_DATABASE.get(id)?.slot !== slot) continue;
      seen.add(id);
    }
    return [...seen];
  };

  return {
    techniques: forSlot(pick(source.techniques, source.technique), "technique"),
    guards: forSlot(pick(source.guards, source.guard), "guard"),
  };
}

/** Trim each list to the slot count the player's tier currently grants. */
export function clampEquippedAbilities(
  equipped: EquippedAbilities,
  playerTier: number,
): EquippedAbilities {
  const slots = abilitySlotCount(playerTier);
  return {
    techniques: equipped.techniques.slice(0, slots.technique),
    guards: equipped.guards.slice(0, slots.guard),
  };
}

/** The equipped list for a slot kind. */
export function equippedForSlot(
  equipped: EquippedAbilities,
  slot: AbilitySlot,
): string[] {
  return slot === "technique" ? equipped.techniques : equipped.guards;
}

/** Validation for dev boot: every rank must be authored coherently. */
export function validateAbilities(): string[] {
  const errors: string[] = [];
  for (const ability of ABILITY_DATABASE.values()) {
    if (ability.ranks.length === 0) {
      errors.push(`${ability.id} authors no ranks.`);
      continue;
    }
    const kind = ability.ranks[0]!.effect.kind;
    for (const [index, rank] of ability.ranks.entries()) {
      const label = `${ability.id} rank ${index + 1}`;
      // A rank that changes effect KIND is a different ability wearing the same
      // id — the lineage promise is that the form never changes.
      if (rank.effect.kind !== kind) {
        errors.push(`${label} changes effect kind ${kind} -> ${rank.effect.kind}.`);
      }
      if (rank.cooldownMs <= 0) errors.push(`${label} has a non-positive cooldown.`);
      // Both wind-up shapes REQUIRE castMs; every other shape must not author it.
      // `charge` is a wind-up followed by a rush, so it is bound by the same rule
      // as `cast` — keep this list in step with `AbilityShape`.
      const windsUp = ability.shape === "cast" || ability.shape === "charge";
      if (windsUp && !(rank.castMs && rank.castMs > 0)) {
        errors.push(`${label} is a ${ability.shape} with no castMs.`);
      }
      if (!windsUp && rank.castMs !== undefined) {
        errors.push(`${label} authors castMs but has no wind-up.`);
      }
      if (ability.shape === "charge") {
        if (!(rank.chargeSpeedMult && rank.chargeSpeedMult > 0)) {
          errors.push(`${label} is a charge with no chargeSpeedMult.`);
        }
        if (!(rank.chargeMaxMs && rank.chargeMaxMs > 0)) {
          errors.push(`${label} is a charge with no chargeMaxMs.`);
        }
      } else if (rank.chargeSpeedMult !== undefined || rank.chargeMaxMs !== undefined) {
        errors.push(`${label} authors charge fields but is not a charge.`);
      }
    }
  }
  return errors;
}
