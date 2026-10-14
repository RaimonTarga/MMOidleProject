/**
 * Abilities catalog — the active-ability system, distinct from the passive
 * talent tree (`UsesSkills`).
 *
 * Two semantic families: a **Technique** (the offensive/tactical active) and a
 * **Guard** (the defensive/recovery/status active). Mobility is a TAG, never a
 * family. A Technique does NOT have to be enemy-facing: Imbue Lightning is an
 * instant self-buff and is still a Technique, because its job is offense.
 *
 * State (the learned pool + ordered attunements) lives on `TracksProgression`, exactly
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
import type { DamageElement } from "./systems/dotElements";

export type AbilityFamily = "technique" | "guard";

/** Semantic families, for categorization and combat arbitration. */
export const ABILITY_FAMILIES: readonly AbilityFamily[] = ["technique", "guard"];

/**
 * Ability tags are queried through abilityHasTag / abilityTags. Technique, Guard,
 * and Armed derive from family/shape; the remaining roles are authored below.
 *
 * - `mobility` — Scout cooldown reduction and Bruiser kill refunds apply.
 * - `recovery` — a Recovery SKILL: it activates a fraction of the player's
 *   Recovery rate, and is the only thing `defense.recovery-skill-potency`
 *   amplifies. Passive Recovery access is deliberately NOT tagged.
 * - `mitigation` — a continuous defensive magnitude that `guard.potency-pct`
 *   may amplify.
 * - `control` — applies or counters crowd control.
 * - `cleanse` — removes something rather than adding it; discrete, so generic
 *   potency must never touch it.
 * - `offensive-buff` — a self-facing offensive window.
 */
export type AbilityTag =
  | "technique"
  | "guard"
  | "armed"
  | "cast"
  | "aoe"
  | "mobility"
  | "recovery"
  | "mitigation"
  | "control"
  | "cleanse"
  | "offensive-buff";

/**
 * How an ability EXECUTES, independent of its family. The family says
 * whose problem it solves; the shape says how the server runs it.
 * - `armed`: rides the next qualifying attack cycle (`hasArmedAbility`).
 * - `cast`: enters an explicit wind-up (`isCastingAbility`), then resolves.
 * - `charge`: winds up, then rushes toward its target at an authored speed.
 * - `self-cast`: a wind-up that resolves on the PLAYER, needing no target.
 * - `reposition`: resolves instantly by MOVING the player.
 * - `instant`: resolves immediately and self-facing.
 *
 * `self-cast` exists because `cast` and `instant` each get a self-buff wind-up
 * half-wrong. A `cast` resolves against a monster and ABORTS when that monster
 * dies or drifts out of reach — correct for a strike, absurd for buffing your
 * own hands. An `instant` has no wind-up at all, and the validator rightly
 * refuses `castMs` on one. `self-cast` is the third thing: a real, hard-CC
 * -interruptible telegraph with no target to lose.
 */
export type AbilityShape =
  | "armed"
  | "cast"
  | "charge"
  | "self-cast"
  | "reposition"
  | "instant";

/*
 * NO TRIGGER OF ITS OWN. An ability fires only when something calls the engine
 * (`fireTechnique` / `fireGuard` in the server's `abilityFiring.ts`): the class
 * runtimes, which place every ability inside their own system.
 *
 * What remains here are EXECUTION GATES, not triggers: whatever fires them, a
 * few abilities decline to spend their cooldown on nothing (Cleanse with no
 * debuff, Break Free with no hard control on you, Charge with no gap to close).
 */

/**
 * Charge declines to fire unless its target sits at least this far (edge-to-edge
 * px) beyond contact, so it opens on distant enemies instead of spending the
 * cooldown on whatever is adjacent. A caller that picked its own moment skips
 * this gate (`chargeAtAnyRange`, see `fireGateOpen`).
 */
export const CHARGE_MIN_GAP_PX = 70;

/**
 * A backward reposition (Disengage) may select a threat within this gap even
 * outside a short-range character's own reach, so it can pick the enemy it is
 * escaping. WHEN it fires is the `Enemy in Contact` condition's job.
 */
export const DISENGAGE_MAX_GAP_PX = 90;

/**
 * True for the one ability that may execute WHILE the player is hard-controlled
 * — Break Free's whole point, and the explicit exception to "you cannot act
 * while stunned".
 */
export function abilityActsWhileControlled(ability: AbilityDef): boolean {
  return ability.ranks[0].effect.kind === "break-free";
}

/**
 * What an ability does when it fires.
 *
 * - `cleave`: Technique rider — the armed next attack splashes to nearby enemies.
 *   `tempoRefundMs`, when authored, switches on TEMPO: every accumulated
 *   attack-equivalent of ordinary basic-attack delivery takes that many ms off
 *   the ability's REMAINING cooldown (never below
 *   {@link TECHNIQUE_TEMPO_MIN_CYCLE_MS} after its last activation). Absent =
 *   no Tempo, which is how Sweep I stays the simple teaching rank; a `0` would
 *   be encoding absence as a number and is rejected by `validateAbilities`.
 * - `cast-strike`: casted Technique payload. Unlike an armed rider — which rides
 *   the NEXT attack — this resolves on its own when the wind-up completes, dealing
 *   `damageMult` × the player's attack. `radius` > 0 makes it AoE around the
 *   target; `stunMs` > 0 hard-controls the target on resolve (Stunning Strike).
 * - `execute-strike`: casted Technique payload (Cull) — a single-target strike
 *   whose multiplier RISES as the target's health share falls: `damageMult` at
 *   or above `thresholdPct` of max HP, climbing linearly to `executeMult` at
 *   zero. A kill refunds the ability's own cooldown. The curve is the rank's
 *   shape; Technique Power scales both ends of it, never the threshold.
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
 * - `dodge-window`: Guard immediate (Sidestep) — an evasion window plus a short
 *   move-speed burst that ends with it. It authors NO number: both magnitudes
 *   and the window come from `sidestepWindow` (abilityMagnitudes.ts), one row
 *   per rank, so the ability file holds only the rank shape.
 * - `break-free`: Guard immediate — removes the current hard control, optionally
 *   followed by `controlResistPct` control resistance for `controlResistMs`.
 * - `spread-dots`: armed Technique rider (Contagion) — your next hit COPIES every
 *   damage-over-time the player owns on the target onto up to `maxTargets`
 *   other enemies within `radius`. The original keeps its own; copies carry full
 *   stacks and the full reservoir pool, so `maxTargets` is the only thing
 *   bounding the multiplication and is therefore the balance lever. Neither
 *   field is a Technique Power field: breadth and reach are not damage stats.
 * - `detonate-dots`: casted Technique payload (Detonate) — CONSUMES every
 *   damage-over-time the player owns on the target and deals what they still
 *   owed: weapon reservoirs times `detonateMult`, every other DoT family (class
 *   stacks, Permafrost, Conflagration) times `classDotMult`. Single-target on purpose: the multiplier is the
 *   payoff, and splashing it would make Contagion→Detonate one AoE nuke rather
 *   than a two-cast combo.
 * - `imbue`: instant Technique payload (Imbue Lightning) — a charge-based
 *   on-hit window that opens on activation. Adds `onHitDamage` to each landed hit
 *   and spends one of `charges` per hit. NO duration: it waits as long as it
 *   takes, which is what makes it a deliberate pre-load rather than a race
 *   against a timer.
 *
 * The ability pass (design §22.2) retired `empower` (Quick Strike),
 * `expose-weakness`, `slow-strike` (Hamstring) and `attack-speed` (Frenzy) with
 * the abilities that were their only users.
 */
export type AbilityEffectSpec =
  | { kind: "cleave"; splashPct: number; radius: number; tempoRefundMs?: number }
  | { kind: "cast-strike"; damageMult: number; radius?: number; stunMs?: number }
  | { kind: "execute-strike"; damageMult: number; executeMult: number; thresholdPct: number }
  | { kind: "root-strike"; damageMult: number; rootMs: number }
  | { kind: "reposition"; distance: number; toward: boolean; empowerMult?: number }
  | { kind: "bramble"; platingBonus: number; reflectFlat: number; durationMs: number }
  | { kind: "damage-reduction"; drPct: number; durationMs: number; knockbackResistPct?: number }
  | { kind: "cleanse"; stacks: number; debuffs: number }
  | { kind: "heal"; recoveryPct: number; durationMs: number }
  | { kind: "dodge-window" }
  | { kind: "break-free"; controlResistPct?: number; controlResistMs?: number }
  | { kind: "spread-dots"; radius: number; maxTargets: number }
  | { kind: "detonate-dots"; detonateMult: number; classDotMult: number }
  | { kind: "imbue"; onHitDamage: number; charges: number; element: DamageElement };

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
  /**
   * Rank-specific replacement for {@link AbilityDef.blurb}.
   *
   * Exists because a rank may add a MECHANIC, not just a number: Sweep II turns
   * on Tempo, and the T1 sentence stops being true. Authored here so every
   * surface (attunement list, HUD tooltip) reads one shared string rather than
   * each re-deriving "does this rank have Tempo?" in presentation code.
   */
  blurb?: string;
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
  /**
   * Fixed RP reservation, independent of rank and tier. Priced net of the Rune
   * rule that wires it (see `referenceAbilityRule`).
   */
  attunementCost: number;
  slot: AbilityFamily;
  /** How the server executes it. */
  shape: AbilityShape;
  tags: AbilityTag[];
  blurb: string;
  /** Home tier — the player tier `ranks[0]` is authored for. */
  tier: number;
  /**
   * Authored ranks, `ranks[0]` = home tier. Never empty. Ranks past the last
   * authored one clamp: an ability simply stops deepening until T5+ is designed.
   */
  ranks: readonly [AbilityRank, ...AbilityRank[]];
  icon?: string;
}

/** Stable runtime effect ID for Brace; independent of attunement priority. */
export const ABILITY_GUARD_EFFECT_ID = "ability-guard";

/** Authored Brace and Endure effect IDs, independent of ability capacity. */
export const ABILITY_GUARD_EFFECT_IDS = ["ability-guard", "ability-guard-2"] as const;

export type AbilityGuardEffectId = (typeof ABILITY_GUARD_EFFECT_IDS)[number];

/** Resolve the authored DR effect identity. */
export function guardEffectIdForAbility(abilityId: string): AbilityGuardEffectId | undefined {
  return abilityId === "brace" ? ABILITY_GUARD_EFFECT_IDS[0] : abilityId === "endure" ? ABILITY_GUARD_EFFECT_IDS[1] : undefined;
}

/** Independent Second Wind and Recuperate effect identities. */
export const ABILITY_RECOVERY_EFFECT_IDS = [
  "ability-second-wind",
  "ability-second-wind-2",
] as const;

export type AbilityRecoveryEffectId = (typeof ABILITY_RECOVERY_EFFECT_IDS)[number];

export function recoveryEffectIdForAbility(abilityId: string): AbilityRecoveryEffectId | undefined {
  return abilityId === "second-wind" ? ABILITY_RECOVERY_EFFECT_IDS[0] : abilityId === "recuperate" ? ABILITY_RECOVERY_EFFECT_IDS[1] : undefined;
}

/** Second Wind effect identity. */
export const ABILITY_SECOND_WIND_EFFECT_ID = ABILITY_RECOVERY_EFFECT_IDS[0];

/**
 * Sidestep's window: an evasion bonus and a move-speed burst on ONE status, so
 * the burst ends exactly when the window does (one clock, one tile). Read by the
 * player evade roll (`defense/mitigation/evasion.ts`) and the movement speed
 * layers (`world/movement.ts`).
 */
export const ABILITY_SIDESTEP_EFFECT_ID = "ability-sidestep";

/** Break Free's post-escape control resistance. */
export const ABILITY_CONTROL_RESIST_EFFECT_ID = "ability-control-resist";

/**
 * Endure's Unyielding keystone (design §22.4): while it stands, no hard control
 * and no root lands on the player. A REFUSAL at the appliers (`applyStun`, the
 * player debuff writers, the Cave lockdown, the lair drag) — an existing control
 * is never removed by it. Generic on purpose: a future "cannot be controlled"
 * source only has to apply this status.
 */
export const ABILITY_UNYIELDING_EFFECT_ID = "ability-unyielding";

/**
 * Cleanse's Immunity keystone (design §22.4): the affliction kinds a Cleanse
 * stripped cannot be reapplied while it stands. ONE status whatever was stripped:
 * status data holds numbers only, so each refused kind (the stripped status id)
 * is a KEY of its data, `abilityImmunityKindKey(kind)` = 1. Refused at the player
 * debuff writers' admission check (`playerRefusesStatus`).
 */
export const ABILITY_IMMUNITY_EFFECT_ID = "ability-immunity";

/** The data key that marks one refused affliction kind on the Immunity status. */
export function abilityImmunityKindKey(kind: string): string {
  return `kind:${kind}`;
}

/**
 * The default ability-family slow on a monster. Hamstring, its first writer, was
 * cut by the ability pass (design §22.2); the id is kept because the Mid range
 * at-bay slow still writes it (`applyMonsterSlow`'s default).
 */
export const ABILITY_SLOW_EFFECT_ID = "ability-slowed";

/** Binding Strike's root on a monster. */
export const ABILITY_ROOT_EFFECT_ID = "ability-rooted";

/**
 * Bramble Guard's Entangle keystone (design §22.4): the slow on a body that hit a
 * brambled player. Its own id ("Entangled") rather than the shared ability slow,
 * whose copy still names a cut ability; one of `MONSTER_SLOW_STATUS_IDS`, so it is
 * the same rung as every slow.
 */
export const ABILITY_ENTANGLE_EFFECT_ID = "ability-entangled";

/**
 * Client-effect tags stamped on a `player-hit` event so the client can overlay
 * the right in-world FX on top of the normal attack FX and pulse the HUD icon.
 * Shared so the server (which stamps `ctx.metadata.clientEffects`) and the
 * client FX dispatcher agree on the strings.
 */
export const ABILITY_SWEEP_FX = "ability-sweep";
export const ABILITY_BINDING_STRIKE_FX = "ability-binding-strike";

/**
 * Generic client-effect tag for Techniques that do not need bespoke in-world FX.
 * The client uses it to pulse the Technique HUD icon and start the cooldown sweep.
 */
export const ABILITY_TECHNIQUE_FIRED_FX = "ability-technique-fired";

/**
 * Imbue Lightning's charge-based on-hit window.
 *
 * Stored as a status effect with `remainingMs: -1` (permanent) and spent by
 * CHARGES rather than by time — `data.charges` counts down on each landed hit
 * and the effect is removed at zero. It lives on `TracksCombat`, which is
 * server-only scratch state and is never persisted, so the window is correctly
 * transient across death and logout without any explicit cleanup.
 */
export const ABILITY_IMBUE_EFFECT_ID = "ability-imbue";

/** Client-effect tag for a hit that spent an Imbue charge. */
export const ABILITY_IMBUE_FX = "ability-imbue";

/**
 * Equipped abilities, as ORDERED lists.
 *
 * List order IS arbitration priority: index 0 is considered first when several
 * rune conditions go valid on the same tick. There is no capacity cap. Custom Rune priority precedes default attunement order.
 */
export interface AttunedAbilities {
  techniques: string[];
  guards: string[];
}

export function emptyAttunedAbilities(): AttunedAbilities {
  return { techniques: [], guards: [] };
}

export function attunedAbilityIds(abilities: AttunedAbilities): string[] {
  return [...new Set([...abilities.techniques, ...abilities.guards])];
}


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

/** Highest authored rank — how far this ability currently goes. */
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

/**
 * Floor on a Tempo-bearing ability's whole cycle: it can never become ready
 * sooner than this many ms after its previous ACTIVATION, no matter how many
 * attacks land in between.
 *
 * 3000 ms, against Sweep's 7000 ms base: an extremely fast build can more than
 * halve the cycle and then stops. Without it, attack-speed stacking would drive
 * Sweep toward a permanent cleave aura and quietly delete the decision the
 * ability exists to pose. Applied to the LIVE remaining cooldown, and clamped
 * so it can never LENGTHEN a cooldown that equipment already shortened below it.
 */
export const TECHNIQUE_TEMPO_MIN_CYCLE_MS = 3000;

/**
 * Ms of remaining cooldown one accumulated attack-equivalent refunds at this
 * player's rank, or 0 when this rank owns no Tempo mechanic.
 *
 * The single seam every Tempo consumer reads — presence of the authored field
 * is what gates the whole mechanic, so a rank that simply omits it (Sweep I) is
 * inert without any rank-number test anywhere in the server.
 */
export function abilityTempoRefundMs(ability: AbilityDef, playerTier: number): number {
  const effect = abilityEffectAt(ability, playerTier);
  return effect.kind === "cleave" ? Math.max(0, effect.tempoRefundMs ?? 0) : 0;
}

/**
 * The blurb for this player's rank — the authored rank override when there is
 * one, otherwise the ability's own.
 *
 * A rank that adds a MECHANIC needs a different sentence, and the description
 * must only promise what the CURRENT rank actually does (Sweep I must not
 * advertise Tempo).
 */
export function abilityBlurbAt(ability: AbilityDef, playerTier: number): string {
  return abilityRankAt(ability, playerTier).blurb ?? ability.blurb;
}

/** Authored wind-up at this player's rank, BEFORE cast speed. 0 when no wind-up applies. */
export function abilityCastMs(ability: AbilityDef, playerTier: number): number {
  return abilityRankAt(ability, playerTier).castMs ?? 0;
}

/**
 * The most a wind-up can be shortened, against EVERY source combined (design
 * §22.9: "the 60% cap holds against every source combined"): the weapon's
 * `technique.cast-speed-pct`, and an ability amplifier's `cast` axis. The
 * telegraph is the cost that makes Technique Power on casts a fair trade, so a
 * cast never collapses into an instant — it never drops below 40% of its wind-up.
 */
export const TECHNIQUE_CAST_SPEED_CAP = 0.6;

/**
 * A wind-up after cast speed: every source's fraction SUMMED, then capped once at
 * {@link TECHNIQUE_CAST_SPEED_CAP}, then applied once — the server's cast
 * lifecycle and the client's ability text both read this, so they cannot disagree.
 */
export function castWindupMs(authoredMs: number, ...castSpeedPcts: number[]): number {
  if (!(authoredMs > 0)) return 0;
  const total = castSpeedPcts.reduce((sum, pct) => sum + Math.max(0, pct || 0), 0);
  return Math.max(1, Math.round(authoredMs * (1 - Math.min(TECHNIQUE_CAST_SPEED_CAP, total))));
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

/**
 * Which slice of the name a surface shows: `full` and `noun` are the name and the
 * rank numeral (*Sweep III*) — the tooltips, the Abilities panel, the hotbar, the
 * cast callout; `plain` is the name alone — running copy (the tutorial's lines, a
 * buff tile's printed label).
 */
export type AbilityNameForm = "full" | "noun" | "plain";

/**
 * THE one entry point for an ability's player-facing name: every surface — the
 * hotbar, the Abilities panel, the tooltips, the buff bar, the cast callout and
 * the tutorial's copy — reads it. `Sweep III`: the name, then the rank numeral.
 * Numbers never appear in a name; the numeral is the rank.
 */
export function abilityDisplayName(
  ability: AbilityDef,
  playerTier: number,
  form: AbilityNameForm = "full",
): string {
  if (form === "plain") return ability.name;
  return `${ability.name} ${abilityRankNumeral(abilityRankNumber(ability, playerTier))}`;
}

/**
 * Which effect kinds carry an OFFENSIVE payload that Technique Power scales, and
 * which fields of them.
 *
 * Authored explicitly per kind rather than as a blanket multiplier — adding an
 * effect kind means deciding this deliberately. Defensive/utility Guard effects
 * are absent by design: Guard potency is a separate stat family and the budgets
 * must not leak. Control durations, dash distances and Snipe's range are absent
 * for the same reason — a damage stat must not buy control or reach.
 */
export const TECHNIQUE_POWER_FIELDS: Partial<
  Record<AbilityEffectSpec["kind"], readonly string[]>
> = {
  cleave: ["splashPct"],
  "cast-strike": ["damageMult"],
  // Both ends of Cull's curve scale; the threshold where it starts to climb is
  // the rank's shape, not a payload, so a damage stat never moves it.
  "execute-strike": ["damageMult", "executeMult"],
  "root-strike": ["damageMult"], // NOT rootMs
  // Only the strike rider — Technique Power must never lengthen a dash.
  reposition: ["empowerMult"],
  // Detonate's multiplier is a pure offensive payload, so it scales. The
  // remaining DoT damage it multiplies is NOT touched here — that already
  // reflects whatever the player's DoT investment earned.
  "detonate-dots": ["detonateMult", "classDotMult"],
  // Imbue's on-hit value is authored FLAT, which makes Technique Power the thing
  // keeping it relevant past its home tier. `charges` is deliberately absent: a
  // damage stat must not buy duration, and a charge count is duration.
  imbue: ["onHitDamage"],
  // `spread-dots` is absent on purpose — `radius` is reach and `maxTargets` is
  // breadth, and Technique Power buys neither (same rule that keeps it off
  // Snipe's range and every control duration).
  // `bramble` and `dodge-window` are absent on purpose (Guards never scale with
  // Technique Power).
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
  "execute-strike": "first-hit",
  "root-strike": "first-hit",
  // A dash happens once; a reflect window is a state, not a per-bullet payload.
  reposition: "first-hit",
  bramble: "first-hit",
  "damage-reduction": "first-hit",
  cleanse: "first-hit",
  heal: "first-hit",
  "dodge-window": "first-hit",
  "break-free": "first-hit",
  // Spreading or detonating once per bullet would let a magazine copy the same
  // DoTs five times over: armed Contagion lands on the clip's first hit only.
  "spread-dots": "first-hit",
  "detonate-dots": "first-hit",
  // Imbue is a window, not a payload — it is never armed onto an attack cycle,
  // so this entry only exists to keep the record exhaustive.
  imbue: "first-hit",
};

// ── The roster ───────────────────────────────────────────────────────────────
//
// 19 authored abilities across T1-T4 (the ability pass, design §22.2 and §22.8:
// 11 Techniques, 8 Guards). Technique and Guard are semantic families; all
// attuned tools reserve RP, without family capacity caps.
//
// ALL NUMBERS ARE FIRST-PASS SEEDS. They express relative roles and give the
// simulation a coherent starting point; the balance pass owns the values.

const abilities: AbilityDef[] = [
  // ── T1: the fundamentals ───────────────────────────────────────────────────
  // Three Techniques (distribute damage / close the gap / deal burst) and four
  // Guards (recover / remove / endure / avoid), so the first tier teaches the
  // whole decision space before adding a single new verb.
  {
    id: "sweep",
    attunementCost: 4,
    name: "Sweep",
    slot: "technique",
    shape: "armed",
    tags: [],
    blurb: "Arms your next attack to cleave nearby enemies.",
    tier: 1,
    icon: "sweep",
    // Splash has an intuitive ceiling: 100% means a secondary target receives a
    // full-strength copy of the payload. Once T3 reaches it there is nowhere
    // left to go on that axis, so the later ranks deepen FREQUENCY instead.
    //
    // Frequency is bought as TEMPO rather than as a shorter authored cooldown.
    // A flat cut pays every build the same, which is exactly backwards for a
    // swarm answer: the builds that most need Sweep are the slow, heavy ones
    // that land few attacks between activations. Tempo pays per landed basic
    // attack, so a 2 s-swing bruiser roughly preserves the old ~6 s cadence
    // (7000 − ~3 attacks × 1000) while a fast build genuinely earns more
    // activations — and the earning is capped by TECHNIQUE_TEMPO_MIN_CYCLE_MS
    // so no attack rate turns Sweep into a permanent cleave aura.
    //
    // Rank I deliberately has NO Tempo: it is the rank that teaches "arm, then
    // hit", and a second mechanic on top of that would blur the lesson.
    ranks: [
      { effect: { kind: "cleave", splashPct: 0.6, radius: 90 }, cooldownMs: 6000 },
      {
        effect: { kind: "cleave", splashPct: 0.8, radius: 90, tempoRefundMs: 1000 },
        cooldownMs: 7000,
        blurb: "Arms your next attack to cleave nearby enemies. Your attacks hasten its return.",
      },
      {
        effect: { kind: "cleave", splashPct: 1.0, radius: 90, tempoRefundMs: 1000 },
        cooldownMs: 7000,
        blurb: "Arms your next attack to cleave nearby enemies. Your attacks hasten its return.",
      },
      {
        effect: { kind: "cleave", splashPct: 1.0, radius: 90, tempoRefundMs: 1000 },
        cooldownMs: 7000,
        blurb: "Arms your next attack to cleave nearby enemies. Your attacks hasten its return.",
      },
    ],
  },
  {
    id: "second-wind",
    attunementCost: 4,
    name: "Second Wind",
    slot: "guard",
    shape: "instant",
    tags: ["recovery"],
    blurb: "Catch your breath, sharply raising your recovery rate for a few seconds.",
    tier: 1,
    icon: "second-wind",
    // The STRONG/SHORT half of the Recovery pair (Recuperate is weak/long).
    // Recovery is flat HP/s (Phase 0b, 2026-09-30): rank I restores recovery × 0.5
    // × 4 s — at the naked T1 base of 6.5 HP/s that is 13 HP, ~10% of a 130 HP
    // reference pool; charms add to it and a bigger pool does not. If human play
    // says the button is too weak, raise `recoveryPct` here rather than the base
    // rate: the 0a bench showed doubling it while a bot fires it at fight start
    // simply cancels a base-rate cut.
    ranks: [
      { effect: { kind: "heal", recoveryPct: 0.5, durationMs: 4000 }, cooldownMs: 12000 },
      { effect: { kind: "heal", recoveryPct: 0.6, durationMs: 4000 }, cooldownMs: 12000 },
      { effect: { kind: "heal", recoveryPct: 0.7, durationMs: 4000 }, cooldownMs: 12000 },
      { effect: { kind: "heal", recoveryPct: 0.7, durationMs: 4000 }, cooldownMs: 10500 },
    ],
  },
  {
    id: "cleanse",
    attunementCost: 1,
    name: "Cleanse",
    slot: "guard",
    shape: "instant",
    tags: ["cleanse"],
    blurb: "Purge the worst of what is eating you — stacks first, then a second affliction.",
    tier: 1,
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
    attunementCost: 3,
    name: "Brace",
    slot: "guard",
    shape: "instant",
    tags: ["mitigation"],
    blurb: "Brace for impact — heavy mitigation and footing, for a moment.",
    tier: 1,
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
    id: "charge",
    attunementCost: 3,
    name: "Charge",
    slot: "technique",
    shape: "charge",
    tags: ["mobility"],
    blurb: "Wind up, then surge across the gap and land the next blow with the weight of the rush.",
    tier: 1,
    icon: "charge",
    // Re-homed from T2 Desert 3 to T1 Cave 3 by the ability pass (design §22.2):
    // the tutorial teaches it at the Cave in Expose Weakness's old place. Rank I is
    // the new T1 rank and copies the T2 rank's numbers (no new number); ranks
    // II–IV are the old T2–T4 ranks, unchanged and not re-indexed.
    //
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
    id: "slam",
    attunementCost: 4,
    name: "Slam",
    slot: "technique",
    shape: "cast",
    tags: [],
    blurb:
      "Wind up and drive the blow into the ground, striking everything around the impact. You stop attacking while it charges — and hard control breaks it.",
    tier: 1,
    icon: "slam",
    // THE BURST CAST (design §22.2, ability pass 2026-10-06): Slam absorbed Power
    // Strike and re-homed from T2 Mountain 9 to T1 Mountain 5, Power Strike's
    // slot. Rank I is the new T1 rank, still cast with Slam's radius. Its
    // damageMult AND its wind-up are the two numbers the ability pass authored,
    // solved together by the lab's parity rule (§22.1/§22.12: the T1 boss kits
    // swapped Expose Weakness for Slam, and every class must hold its T1 boss DPS
    // within ±5%; reports/ability-pass/): a lower multiple trims the Conduit, which
    // casts while its summon keeps hitting, and a shorter wind-up returns what the
    // attackers lose while they stand. Rank I stays a cast (§22.9). Its cooldown
    // is Power Strike's. Ranks II–IV are 2.45 / 2.7 / 2.95 (design §22.12: Slam
    // never weakens on tier-up — the old +0.25 per tier, counted from W1-A's
    // single-number rank I, 2.2), on rank I's 0.6 s wind-up (design §22.13); the
    // old half-of-Power-Strike relation went with Power Strike.
    //
    // It favours heavy, slow builds WITHOUT ever asking about attack speed:
    // it scales from Attack, its wind-up ignores attack cadence, and casting
    // stops ordinary attacking — so the faster the build, the more real damage
    // the wind-up (0.6 s at every rank) costs it. No inverse-speed
    // multiplier, no weapon tags, no cadence query. Cast speed still shortens the
    // wind-up through the ordinary `technique.cast-speed-pct` seam, which is a
    // separate, intended synergy.
    //
    // The radius is authored and NEVER scales: `TECHNIQUE_POWER_FIELDS` lists
    // only `damageMult` for `cast-strike`, so a damage stat can never buy reach
    // — the same rule that keeps Technique Power off Snipe's range. Held flat
    // across ranks for the first implementation; breadth is the identity, and
    // widening it is a balance decision to make against measured data.
    ranks: [
      // Rank I: 1.2 on a 0.6 s wind-up, the parity pair (W4-A two-number ladder on the
      // tutorial-pair lab, 30 seeds, castMs 1600 → 600 on the 100 ms tick grid; every
      // T1 kit cell inside ±5%, worst −4.7% on the Striker's Greatbear). 0.6 s is the
      // longest wind-up that passes: at 0.7 s the Striker's and the Apprentice's
      // Greatbear cells straddle ±5% at every rank I hit size; 1.18–1.20 pass at 0.6 s;
      // reports/ability-pass/README.md §8 and w4a-ladder.md.
      { effect: { kind: "cast-strike", damageMult: 1.2, radius: 150 }, cooldownMs: 10000, castMs: 600 },
      // Ranks II–IV: design §22.12, +0.25 per tier, on rank I's 0.6 s wind-up (design
      // §22.13, superseding §22.12's 1.6 s). Measured at T2 (reports/ability-pass/
      // measure-slam-t2.md, the T2 composition lab's no-card kit, 1,500 fights per
      // arm): rank II on 1.6 s added −0.8% to +1.9% over Sweep for the Striker,
      // Slinger and Spirit and +23.8% for the Conduit; on 0.6 s every class gains
      // +12.9% to +30.9% over Sweep and the class spread narrows (25 → 18 points).
      { effect: { kind: "cast-strike", damageMult: 2.45, radius: 150 }, cooldownMs: 10000, castMs: 600 },
      { effect: { kind: "cast-strike", damageMult: 2.7, radius: 150 }, cooldownMs: 10000, castMs: 600 },
      { effect: { kind: "cast-strike", damageMult: 2.95, radius: 150 }, cooldownMs: 10000, castMs: 600 },
    ],
  },
  {
    id: "sidestep",
    // PROVISIONAL: priced like Brace, the other burst Guard (net of its In
    // Combat reference wiring, abilityWiring.ts).
    attunementCost: 3,
    name: "Sidestep",
    slot: "guard",
    shape: "instant",
    tags: ["mobility"],
    blurb: "Slip aside — for a moment you are hard to hit and quick on your feet.",
    tier: 1,
    icon: "sidestep",
    // THE AVOID GUARD (design §22.8). Second Wind and Recuperate are Sustain;
    // Brace, Endure and Bramble Guard are Endure; Cleanse and Break Free are
    // removal — so a Light-frame player had no Guard of their own. It is not
    // Disengage: Disengage moves you out of contact, Sidestep stays and dodges.
    //
    // NO NUMBER IN THIS FILE beyond the rank shape: the evasion window and the
    // move-speed burst both come from `sidestepWindow` in abilityMagnitudes.ts,
    // one row per rank, and the burst ends with the window. The cooldown is
    // Brace's (PROVISIONAL). Situational: it does not fire with nothing in reach.
    ranks: [
      { effect: { kind: "dodge-window" }, cooldownMs: 10000 },
      { effect: { kind: "dodge-window" }, cooldownMs: 10000 },
      { effect: { kind: "dodge-window" }, cooldownMs: 10000 },
      { effect: { kind: "dodge-window" }, cooldownMs: 10000 },
    ],
  },

  // ── T2: positioning, soft control, sustained mitigation ────────────────────
  {
    id: "binding-strike",
    attunementCost: 2,
    name: "Binding Strike",
    slot: "technique",
    shape: "armed",
    tags: ["control"],
    blurb: "Arms your next attack to pin the target where it stands.",
    tier: 2,
    icon: "binding-strike",
    // Re-homed from T3 Tundra 3 to T2 Jungle 3 by the ability pass (design §22.2),
    // Hamstring's slot: the root is the T2 control. Rank I is the new T2 rank and
    // copies the old T3 rank's numbers; ranks II–III are the old T3–T4 ranks.
    //
    // Rung two of the ladder. Root stops MOVEMENT only: a rooted monster still
    // swings at anything already in its reach. That is what keeps root
    // structurally distinct from stun rather than a weaker number of it.
    ranks: [
      { effect: { kind: "root-strike", damageMult: 1.2, rootMs: 1500 }, cooldownMs: 8000 },
      { effect: { kind: "root-strike", damageMult: 1.2, rootMs: 1500 }, cooldownMs: 8000 },
      { effect: { kind: "root-strike", damageMult: 1.3, rootMs: 2000 }, cooldownMs: 8000 },
    ],
  },
  {
    id: "bramble-guard",
    attunementCost: 2,
    name: "Bramble Guard",
    slot: "guard",
    shape: "instant",
    tags: ["mitigation"],
    blurb: "Harden your skin with thorns — gain armor and injure attackers who strike you.",
    tier: 2,
    icon: "bramble-guard",
    ranks: [
      { effect: { kind: "bramble", platingBonus: 6, reflectFlat: 6, durationMs: 5000 }, cooldownMs: 12000 },
      { effect: { kind: "bramble", platingBonus: 8, reflectFlat: 10, durationMs: 5000 }, cooldownMs: 12000 },
      { effect: { kind: "bramble", platingBonus: 10, reflectFlat: 14, durationMs: 5000 }, cooldownMs: 12000 },
    ],
  },
  {
    id: "endure",
    attunementCost: 4,
    name: "Endure",
    slot: "guard",
    shape: "instant",
    tags: ["mitigation"],
    blurb: "Set your jaw and take it — modest mitigation, held for a long while.",
    tier: 2,
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

  {
    id: "contagion",
    attunementCost: 5,
    name: "Contagion",
    slot: "technique",
    shape: "armed",
    tags: [],
    blurb:
      "Arms your next attack to spread the target's afflictions outward — every burn, poison and frost you put on it takes hold in the enemies around it.",
    tier: 2,
    icon: "contagion",
    // ARMED since the ability pass (design §22.9: a cast iff the ability deals its
    // own damage). Contagion deals none, so it waits for your next hit instead of
    // winding up, and spreads what THAT hit's target carries. On a Conduit it
    // rides the formation-rider adapter Sweep uses: the first summon hit that
    // lands it spreads once.
    //
    // NOT called "Spread": the rune catalog already ships an action displayed as
    // "Spread DoTs" (the Multidot targeting behavior), and two unrelated things
    // wearing one name in the same build UI is a support ticket waiting to happen.
    //
    // Copies at FULL strength — full stacks, full reservoir pool — so the only
    // thing bounding the damage multiplication is `maxTargets`. That makes the
    // target count the real balance dial and the radius a pure convenience:
    // widening the radius without raising the cap can never increase output, it
    // only makes the cap easier to fill.
    //
    // Homed at T2, which is where its half of the affliction pair belongs: T2 is
    // the first tier with real pack density (jungle), and spreading is the answer
    // to breadth. Detonate stays at T3 as the later, more build-warping half —
    // Learn to spread first, learn to cash in second. Each tool then competes
    // with the rest of the attuned build for RP.
    ranks: [
      { effect: { kind: "spread-dots", radius: 120, maxTargets: 5 }, cooldownMs: 14000 },
      { effect: { kind: "spread-dots", radius: 150, maxTargets: 6 }, cooldownMs: 12000 },
      { effect: { kind: "spread-dots", radius: 180, maxTargets: 7 }, cooldownMs: 9000 },
    ],
  },

  {
    id: "snipe",
    attunementCost: 3,
    name: "Snipe",
    slot: "technique",
    shape: "cast",
    tags: [],
    blurb: "Line up a deliberate shot from far outside your usual reach.",
    tier: 2,
    icon: "snipe",
    // Re-homed from T4 Graveyard 3 to T2 Desert 3 by the ability pass (design
    // §22.8, Charge's old slot): Snipe is the ranged opener, and a ranged build had
    // none until the last tier while melee had Charge at T1. Rank I is the new T2
    // rank and copies the T4 rank's numbers; the T4 rank stays as rank II (read at
    // T3 and T4). Its +300 reach and hold-position are unchanged.
    //
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
      {
        effect: { kind: "cast-strike", damageMult: 3.0 },
        cooldownMs: 12000,
        castMs: 2000,
        rangeBonus: 300,
      },
    ],
  },

  // ── T3: tempo, and hard movement/control counterplay ───────────────────────
  {
    id: "imbue-lightning",
    attunementCost: 4,
    name: "Imbue Lightning",
    slot: "technique",
    shape: "instant",
    tags: ["offensive-buff"],
    blurb:
      "Call the storm into your hands. Your next few strikes land with it — however long they take to land.",
    tier: 3,
    icon: "imbue-lightning",
    // The ability pass (design §22.2, §22.9) re-homed it from T4 Jungle 15 to T3
    // Volcanic 3 (Frenzy's slot) and made it INSTANT: a self-buff needs no
    // telegraph, so the charge window opens the moment it is activated, and like
    // every instant Technique it neither claims nor waits for the offensive
    // channel. Rank I is the new T3 rank and copies the T4 rank's numbers.
    //
    // The first CHARGE-based window in the roster.
    //
    // Charges rather than seconds is the whole identity. Every other offensive
    // window in the game (Overdrive) races a clock,
    // which punishes exactly the builds that attack slowly and rewards the ones
    // that were already fastest. A charge window pays the same to everyone: five
    // hits are five hits whether they take three seconds or ten. The cost of
    // that fairness is the half-second tell and a cooldown you cannot shorten by
    // fighting faster.
    //
    // `onHitDamage` is authored FLAT (the designer's call), which means it is
    // Technique Power — not tiering — that keeps it alive past T4. Revisit the
    // seed alongside T5 on-hit gear.
    ranks: [
      {
        effect: { kind: "imbue", onHitDamage: 45, charges: 5, element: "lightning" },
        cooldownMs: 9000,
      },
      {
        effect: { kind: "imbue", onHitDamage: 45, charges: 5, element: "lightning" },
        cooldownMs: 9000,
      },
    ],
  },
  {
    id: "break-free",
    attunementCost: 1,
    name: "Break Free",
    slot: "guard",
    shape: "instant",
    tags: ["cleanse", "control"],
    blurb: "Tear yourself out of whatever is holding you — and shrug off the next attempt.",
    tier: 3,
    icon: "break-free",
    // Deliberately situational. It should be extremely valuable in control-heavy
    // content without making that content mathematically impossible without it.
    ranks: [
      { effect: { kind: "break-free" }, cooldownMs: 14000 },
      { effect: { kind: "break-free", controlResistPct: 0.5, controlResistMs: 3000 }, cooldownMs: 12000 },
    ],
  },
  {
    id: "detonate",
    attunementCost: 4,
    name: "Detonate",
    slot: "technique",
    shape: "cast",
    tags: [],
    blurb:
      "Rip every affliction off the target at once, dealing all the damage they had left to give — and then some.",
    tier: 3,
    icon: "detonate",
    // The long cooldown is the whole design. Detonate converts patience into a
    // burst, so it must not be available for every ramp — otherwise a DoT build
    // stops being a DoT build and becomes a nuke on a short timer.
    //
    // 2026-09-26: 1.2x/1.4x with a 2s cast -> 5.0x/5.5x with a 1.2s cast, same
    // cooldowns. A weapon reservoir drains in ~4.5s, so at any moment it holds only
    // a few seconds of converted damage; at 1.2x Detonate lost to Power Strike on
    // EVERY weapon, worst of all on the heavy-conversion Rimebrand. At 5x it beats
    // Power Strike by ~15-45% sustained for the Apprentice and on DoT-conversion
    // weapons, while plain weapons on other classes gain nothing (there is nothing
    // to detonate), so it stays the payoff for DoT builds rather than a universal
    // pick. Ability damage now also feeds weapon reservoirs (weaponReservoir.ts).
    //
    // 2026-09-27 T4 power curve: weapon reservoir 5.0/5.5 -> 3.6/4.0. With Glacial
    // Rimebrand it was every class's damage ceiling (up to x1.5 the median spec);
    // it now stays the best pick on a conversion weapon (~+20% over Power Strike).
    ranks: [
      { effect: { kind: "detonate-dots", detonateMult: 3.6, classDotMult: 2.0 }, cooldownMs: 15000, castMs: 1200 },
      { effect: { kind: "detonate-dots", detonateMult: 4.0, classDotMult: 2.0 }, cooldownMs: 12000, castMs: 1200 },
    ],
  },
  {
    id: "cull",
    // PROVISIONAL: priced like Power Strike was (net of its In Combat reference
    // wiring, abilityWiring.ts).
    attunementCost: 4,
    name: "Cull",
    slot: "technique",
    shape: "cast",
    tags: [],
    blurb: "Wind up a finishing blow that hits harder the weaker the target is. A kill readies it again.",
    tier: 3,
    icon: "cull",
    // THE KILL-SHAPED TECHNIQUE (design §22.8): no ability was kill-shaped. A cast,
    // because it deals its own damage (§22.9), scaled by Technique Power.
    //
    // The curve IS the rank's shape: `damageMult` at or above `thresholdPct` of the
    // target's max HP, climbing linearly to `executeMult` at zero. A kill refunds
    // Cull's own cooldown (abilityCasting.ts). PROVISIONAL numbers, borrowed rather
    // than invented: the top of the curve is Slam's per-body multiple at the same
    // tier and the bottom is the retired Power Strike's single-target one (T3 2.0 →
    // 4.0, T4 2.25 → 4.5), starting at half health; the cooldown and wind-up are
    // Power Strike's.
    ranks: [
      {
        effect: { kind: "execute-strike", damageMult: 2.0, executeMult: 4.0, thresholdPct: 0.5 },
        cooldownMs: 10000,
        castMs: 1600,
      },
      {
        effect: { kind: "execute-strike", damageMult: 2.25, executeMult: 4.5, thresholdPct: 0.5 },
        cooldownMs: 10000,
        castMs: 1600,
      },
    ],
  },

  // ── T4: advanced range, escape, hard CC, long sustain ──────────────────────
  // Only rank I is authored — these debut at the end of the supplied biome map.
  // T5+ must give each of them a bespoke upgrade, not resume percentage growth.
  {
    id: "disengage",
    attunementCost: 1,
    name: "Disengage",
    slot: "technique",
    shape: "reposition",
    tags: ["mobility"],
    blurb: "Break contact and buy yourself the room to keep fighting.",
    tier: 4,
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
    attunementCost: 4,
    name: "Recuperate",
    slot: "guard",
    shape: "instant",
    tags: ["recovery"],
    blurb: "Settle into a long, steady mend that outlasts the fight's worst stretch.",
    tier: 4,
    icon: "recuperate",
    // The WEAK/LONG half of the Recovery pair. Scales from Recovery and Recovery
    // Skill Potency; never from offense.
    ranks: [
      { effect: { kind: "heal", recoveryPct: 0.25, durationMs: 10000 }, cooldownMs: 16000 },
    ],
  },
  {
    id: "stunning-strike",
    attunementCost: 4,
    name: "Stunning Strike",
    slot: "technique",
    shape: "cast",
    tags: ["control"],
    blurb: "A committed blow that puts the target on the floor.",
    tier: 4,
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
  //
  // Both targets were later CUT (the ability pass, below), so these two renames
  // now resolve to a retired id and drop with it — kept, because removing an
  // entry would let a renamed id slip past the retirement as an unknown one.
  "charged-strike": "power-strike",
};

/** Map a persisted id through {@link RENAMED_ABILITY_IDS}. */
export function currentAbilityId(id: string): string {
  return RENAMED_ABILITY_IDS[id] ?? id;
}

/**
 * Player abilities the ability pass CUT (design §22.2, 2026-10-02): each one's
 * job moved to a lane payoff, and Power Strike merged into Slam. A save that still
 * names one — known, attuned, wired by a `use-ability` Rune rule, or holding node
 * progress — drops it on load (`attunementMigration.ts`), and the load logs one
 * line per character. Additive-only, like {@link RENAMED_ABILITY_IDS}.
 *
 * PLAYER ability ids only. Several share a name with a monster id ('frenzy' is a
 * boss buff and an fx, 'power-strike' a monster attack style); nothing here
 * touches those.
 */
export const RETIRED_ABILITY_IDS: readonly string[] = [
  "expose-weakness",
  "power-strike",
  "hamstring",
  "frenzy",
  "quick-strike",
];

/** True when a persisted ability id (after renames) names a cut ability. */
export function isRetiredAbilityId(id: string): boolean {
  return RETIRED_ABILITY_IDS.includes(currentAbilityId(id));
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
  const powerMult = ability.slot === "technique" ? 1 + Math.max(0, opts.techniquePowerPct ?? 0) : 1;
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
export interface LegacyAttunedAbilities {
  technique?: string | null;
  guard?: string | null;
}

/**
 * Coerce whatever is in a persisted row into the current list shape, dropping
 * ids that no longer resolve, duplicates, and entries that don't fit their slot.
 * Accepts the legacy `{technique, guard}` shape so old saves migrate silently.
 * There is no tier or family capacity limit. RP validation belongs to loadout edits.
 */
export function normalizeAttunedAbilities(raw: unknown): AttunedAbilities {
  if (!raw || typeof raw !== "object") return emptyAttunedAbilities();

  const source = raw as Partial<AttunedAbilities> & LegacyAttunedAbilities;
  const fromLegacy = (id: string | null | undefined): string[] =>
    typeof id === "string" ? [id] : [];

  const pick = (list: unknown, legacy: string | null | undefined): string[] =>
    Array.isArray(list) ? list.filter((id): id is string => typeof id === "string") : fromLegacy(legacy);

  const forSlot = (ids: string[], slot: AbilityFamily): string[] => {
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


/** Ordered attunements in a semantic family. */
export function attunedForFamily(
  equipped: AttunedAbilities,
  slot: AbilityFamily,
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
    if (kind === "damage-reduction" && !guardEffectIdForAbility(ability.id)) errors.push(`${ability.id} needs an authored DR buff identity.`);
    if (kind === "heal" && !recoveryEffectIdForAbility(ability.id)) errors.push(`${ability.id} needs an authored Recovery buff identity.`);
    for (const [index, rank] of ability.ranks.entries()) {
      const label = `${ability.id} rank ${index + 1}`;
      // A rank that changes effect KIND is a different ability wearing the same
      // id — the lineage promise is that the form never changes.
      if (rank.effect.kind !== kind) {
        errors.push(`${label} changes effect kind ${kind} -> ${rank.effect.kind}.`);
      }
      if (rank.cooldownMs <= 0) errors.push(`${label} has a non-positive cooldown.`);
      // Cull's curve must climb: a threshold outside (0, 1] or an execute end
      // below the base would make "hits harder the lower the target" false.
      if (rank.effect.kind === "execute-strike") {
        if (!(rank.effect.thresholdPct > 0 && rank.effect.thresholdPct <= 1)) {
          errors.push(`${label} authors an execute threshold outside (0, 1].`);
        }
        if (!(rank.effect.executeMult >= rank.effect.damageMult)) {
          errors.push(`${label} authors an execute curve that falls as health falls.`);
        }
      }
      // Absence gates Tempo; an authored 0 would be encoding "no Tempo" as a
      // number, which is exactly the shape the component rules forbid.
      if (rank.effect.kind === "cleave" && rank.effect.tempoRefundMs !== undefined) {
        if (rank.effect.tempoRefundMs <= 0) {
          errors.push(`${label} authors a non-positive tempoRefundMs — omit the field instead.`);
        }
        if (rank.cooldownMs <= TECHNIQUE_TEMPO_MIN_CYCLE_MS) {
          errors.push(`${label} authors Tempo on a cooldown at/below the ${TECHNIQUE_TEMPO_MIN_CYCLE_MS}ms minimum cycle, so Tempo can never do anything.`);
        }
      }
      // Every wind-up shape REQUIRES castMs; every other shape must not author
      // it. `charge` is a wind-up followed by a rush and `self-cast` a wind-up
      // that lands on the player, so both are bound by the same rule as `cast` —
      // keep this list in step with `AbilityShape`.
      const windsUp =
        ability.shape === "cast" ||
        ability.shape === "charge" ||
        ability.shape === "self-cast";
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
