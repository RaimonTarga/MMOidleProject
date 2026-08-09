/**
 * Abilities catalog (system rework Step 7).
 *
 * The active-ability system, distinct from the passive talent tree (`UsesSkills`).
 * Two slots: a **Technique** (offensive, enemy-facing — arms/modifies the next
 * attack) and a **Guard** (defensive, self-facing — an immediate reaction).
 * Mobility is a TAG on an ability, never a slot.
 *
 * State (the learned pool + equipped slots) lives on `TracksProgression`, exactly
 * like runes — abilities are build/loadout data, not a recalculated component.
 * Firing behavior lives in `server/src/systems/player/abilities/`.
 */

export type AbilitySlot = "technique" | "guard";

/** Every slot kind, for iteration. */
export const ABILITY_SLOTS: readonly AbilitySlot[] = ["technique", "guard"];

/** Behavioral tags. Mobility is a tag, not a slot. Grows as content lands. */
export type AbilityTag = "mobility";

/**
 * How an ability EXECUTES, independent of which slot it occupies (abilities
 * evolution plan §5). The slot says whose problem it solves; the shape says how
 * the server runs it.
 * - `armed`: rides the next qualifying attack cycle (`hasArmedAbility`).
 * - `cast`: enters an explicit wind-up (`isCastingAbility`), then resolves.
 * - `reposition`: resolves instantly by MOVING the player.
 * - `instant`: resolves immediately and self-facing (the classic Guard shape).
 */
export type AbilityShape = "armed" | "cast" | "reposition" | "instant";

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
  | { kind: "has-debuff" };

/**
 * What an ability does when it fires. Deliberately narrow for v1 — extend the
 * union as content lands, don't over-generalize up front.
 * - `cleave`: Technique rider — the armed next attack splashes to nearby enemies.
 * - `empower`: Technique rider — the armed next attack hits one target for
 *   `damageMult`× damage (single-target burst; no splash).
 * - `damage-reduction`: Guard immediate — an EXPLICIT BUFF (shows in the buff bar,
 *   {@link ABILITY_GUARD_EFFECT_ID}) granting `drPct` damage reduction for `durationMs`.
 *   `knockbackResistPct`, when present, reduces incoming knockback distance.
 * - `cleanse`: Guard immediate — strips up to `stacks` from each harmful debuff/DoT
 *   on the player. When `drPct`/`durationMs` are set, also grants a short
 *   damage-reduction guard buff (post-cleanse resilience), reusing the same buff.
 * - `heal`: Guard heal-over-time — recover `healPct` of max HP over `durationMs`
 *   (antiheal applies), a cooldown sustain button.
 */
export type AbilityEffectSpec =
  | { kind: "cleave"; splashPct: number; radius: number }
  | { kind: "empower"; damageMult: number }
  /**
   * Casted-Technique payload (abilities evolution §5.2). Unlike `empower` — which
   * rides the NEXT attack — this resolves on its own when the wind-up completes,
   * dealing `damageMult` × the player's attack. `radius` > 0 makes it an AoE
   * around the target; omitted/0 keeps it single-target.
   */
  | { kind: "cast-strike"; damageMult: number; radius?: number }
  | { kind: "expose-weakness"; damageTakenPct: number; durationMs: number }
  /**
   * Reposition (abilities evolution §5.3) — resolves by MOVING the player
   * `distance` px toward (`toward: true`, e.g. Charge) or away from
   * (`toward: false`, e.g. Disengage) the current target. `empowerMult`, when
   * present, additionally arms the next attack for that multiplier, turning a
   * gap-closer into an alpha strike.
   *
   * These stay Technique/Guard abilities — there is deliberately no third
   * "mobility" ability slot, and this is unrelated to the `mobility` gear slot.
   */
  | { kind: "reposition"; distance: number; toward: boolean; empowerMult?: number }
  /**
   * Temporary hardening + flat retaliation (Bramble Guard). Grants `platingBonus`
   * plating for `durationMs` and deals `reflectFlat` back to monsters that land a
   * DIRECT hit while it is up. Reflect is flat, never a fraction of damage taken,
   * so it cannot scale with incoming damage into a degenerate tank-and-win loop.
   */
  | { kind: "bramble"; platingBonus: number; reflectFlat: number; durationMs: number }
  | { kind: "damage-reduction"; drPct: number; durationMs: number; knockbackResistPct?: number }
  | { kind: "cleanse"; stacks: number; drPct?: number; durationMs?: number }
  | { kind: "heal"; healPct: number; durationMs?: number };

/**
 * Status-effect id for the active Guard-ability buff (system rework Step 7).
 * The server applies it (with `totalMs`/`drPct` in data), an onDamageTaken
 * listener reads it, and a buff descriptor projects it to the buff bar
 * (label/color from the ability in that slot). Doubles as the buff id.
 *
 * This is GUARD SLOT 0. Slot 1 uses {@link ABILITY_GUARD_EFFECT_IDS}[1] — once
 * two Guards can be equipped they need independent effects, and since status
 * `data` is numbers-only the owning slot has to be encoded in the id itself.
 */
export const ABILITY_GUARD_EFFECT_ID = "ability-guard";

/** Guard DR buff effect id per slot index. Length tracks {@link MAX_ABILITY_SLOTS}. */
export const ABILITY_GUARD_EFFECT_IDS = ["ability-guard", "ability-guard-2"] as const;

export type AbilityGuardEffectId = (typeof ABILITY_GUARD_EFFECT_IDS)[number];

/** The Guard DR effect id owned by a slot (clamped, so a bad index can't collide). */
export function guardEffectIdForSlot(slotIndex: number): AbilityGuardEffectId {
  return ABILITY_GUARD_EFFECT_IDS[slotIndex] ?? ABILITY_GUARD_EFFECT_IDS[0];
}
export const ABILITY_SECOND_WIND_EFFECT_ID = "ability-second-wind";

/**
 * Client-effect tag (system rework Step 7) emitted on a `player-hit` event when a
 * Sweep Technique lands, so the client overlays a horizontal cleave slash on top
 * of the normal attack FX and pulses the Technique HUD icon. Shared so the server
 * (which stamps `ctx.metadata.clientEffects`) and the client FX dispatcher agree
 * on the string. Add a sibling constant per Technique as more FX-bearing
 * techniques land.
 */
export const ABILITY_SWEEP_FX = "ability-sweep";

export const EXPOSE_WEAKNESS_EFFECT_ID = "expose-weakness";

/**
 * Client-effect tag for a landed Expose Weakness Technique. The client overlays
 * a targeting/impact cue on the normal attack FX and pulses the Technique HUD
 * icon. Sibling of {@link ABILITY_SWEEP_FX}.
 */
export const ABILITY_EXPOSE_WEAKNESS_FX = "ability-expose-weakness";

/**
 * Generic client-effect tag for Techniques that do not need bespoke in-world FX.
 * The client uses it to pulse the Technique HUD icon and start the cooldown sweep.
 */
export const ABILITY_TECHNIQUE_FIRED_FX = "ability-technique-fired";

export interface AbilityDef {
  id: string;
  name: string;
  slot: AbilitySlot;
  /** How the server executes it. Defaults to `armed` for techniques, `instant` for guards. */
  shape: AbilityShape;
  tags: AbilityTag[];
  blurb: string;
  /**
   * Home tier — the player tier this ability is authored for. Drives automatic
   * numeric deepening: see {@link abilityTierScale}.
   */
  tier: number;
  /**
   * Fractional magnitude gain per player tier ABOVE `tier` (abilities evolution
   * plan §4.1). Owned magnitudes deepen automatically; the ability id and form
   * never change. Omitted = no automatic scaling.
   */
  scalePerTierPct?: number;
  /**
   * Evolution family (abilities evolution plan §4.2/§10). Grouping only — an
   * evolution NEVER destroys or replaces its predecessor, so unlike gear
   * lineages there is no consume/reconstruct semantic here.
   */
  lineageId?: string;
  /** Min ms between fires (per-ability cooldown, tracked on TracksCombat). */
  cooldownMs: number;
  /** Wind-up duration. REQUIRED for `shape: "cast"`, meaningless otherwise. */
  castMs?: number;
  /** Built-in auto-fire heuristic (runes can override per slot). */
  trigger: AbilityTrigger;
  /** Effect applied on fire — Technique rider (on hit) or Guard immediate. */
  effect: AbilityEffectSpec;
  icon?: string;
}

/**
 * Equipped abilities, as ORDERED lists (abilities evolution plan §7).
 *
 * List order IS arbitration priority: index 0 is considered first when several
 * rune conditions go valid on the same tick. Each list's length is bounded by
 * {@link abilitySlotCount}; an unused slot is simply a shorter list. Mirrors
 * `EquippedRites`, and lets reordering in the UI be a real build decision
 * without a separate priority field.
 */
export interface EquippedAbilities {
  techniques: string[];
  guards: string[];
}

export function emptyEquippedAbilities(): EquippedAbilities {
  return { techniques: [], guards: [] };
}

/**
 * Number of ability slots at a given player tier (abilities evolution plan §7).
 *
 * Deliberately keyed on PLAYER TIER, not Global Mastery — Biome Mastery owns
 * ability unlocks; tier owns ability slots (§3.1).
 *
 * T1–T2 → 1/1 (learn the fundamentals), T3 → 2/1 (offensive repertoire),
 * T4+ → 2/2 (full tactical loadout). A third slot is deliberately NOT assumed.
 */
export function abilitySlotCount(playerTier: number): Record<AbilitySlot, number> {
  return {
    technique: playerTier >= 3 ? 2 : 1,
    guard: playerTier >= 4 ? 2 : 1,
  };
}

/** Highest slot count any tier grants — sizes the per-slot buff-id tables. */
export const MAX_ABILITY_SLOTS = 2;

/**
 * Automatic numeric deepening multiplier for an owned ability (plan §4.1).
 * Applies ONLY to magnitude fields (see {@link ABILITY_SCALABLE_FIELDS}) — never
 * to durations, stun times, radii, or movement distances.
 */
export function abilityTierScale(ability: AbilityDef, playerTier: number): number {
  const perTier = ability.scalePerTierPct ?? 0;
  if (perTier <= 0) return 1;
  return 1 + perTier * Math.max(0, playerTier - ability.tier);
}

/**
 * Which fields of each effect kind are MAGNITUDE (scaled by tier deepening and,
 * for offensive payloads, by Technique Power) versus utility semantics that must
 * never inflate (plan §6.2). Authored explicitly per effect rather than as a
 * blanket multiplier — adding an effect kind means deciding this deliberately.
 */
export const ABILITY_SCALABLE_FIELDS: Record<
  AbilityEffectSpec["kind"],
  readonly string[]
> = {
  cleave: ["splashPct"], // NOT radius
  "cast-strike": ["damageMult"], // NOT radius
  empower: ["damageMult"],
  "expose-weakness": ["damageTakenPct"], // NOT durationMs
  reposition: ["empowerMult"], // NOT distance — a longer dash is not "deeper"
  bramble: ["platingBonus", "reflectFlat"], // NOT durationMs
  "damage-reduction": ["drPct", "knockbackResistPct"], // NOT durationMs
  cleanse: ["stacks", "drPct"], // NOT durationMs
  heal: ["healPct"], // NOT durationMs
};

/**
 * Which effect kinds carry an OFFENSIVE payload that Technique Power scales
 * (plan §6.2). Defensive/utility Guard effects are absent by design — Guard
 * potency is a separate stat family and the budgets must not leak.
 */
export const TECHNIQUE_POWER_FIELDS: Partial<
  Record<AbilityEffectSpec["kind"], readonly string[]>
> = {
  cleave: ["splashPct"],
  "cast-strike": ["damageMult"],
  empower: ["damageMult"],
  // Only the strike rider — Technique Power must never lengthen a dash.
  reposition: ["empowerMult"],
  // `bramble` is absent on purpose: it is defensive, and Guard potency is a
  // separate stat family (plan §3.3).
};

/**
 * How an armed Technique resolves for a MULTI-HIT attack cycle — the Reload
 * magazine case (plan §12).
 * - `first-hit`: the payload lands once, on the first qualifying hit. The safe
 *   default and the behaviour that shipped in Step 7.
 * - `distribute`: a scalar payload is split across the cycle's hits.
 *
 * Deliberately per-effect-kind rather than a universal `consumeMode`: a 1.5 s
 * stun must not silently become five 0.3 s stuns.
 */
export const ABILITY_MULTIHIT_MODE: Record<
  AbilityEffectSpec["kind"],
  "first-hit" | "distribute"
> = {
  cleave: "distribute",
  // A cast is a single deliberate action — never once per bullet (plan §12).
  "cast-strike": "first-hit",
  empower: "first-hit",
  "expose-weakness": "first-hit",
  // A dash happens once; a reflect window is a state, not a per-bullet payload.
  reposition: "first-hit",
  bramble: "first-hit",
  "damage-reduction": "first-hit",
  cleanse: "first-hit",
  heal: "first-hit",
};

// ── Worked content (Step 7): one Technique + one Guard. ──────────────────────
// Numbers (cooldowns, thresholds, magnitudes) are PLACEHOLDERS — user balance pass.
const abilities: AbilityDef[] = [
  {
    id: "sweep",
    name: "Sweep",
    slot: "technique",
    shape: "armed",
    tags: [],
    blurb: "Arms your next attack to cleave nearby enemies.",
    tier: 1,
    scalePerTierPct: 0.15,
    lineageId: "sweep",
    cooldownMs: 4000,
    trigger: { kind: "in-combat" },
    effect: { kind: "cleave", splashPct: 0.6, radius: 90 },
    icon: "sweep",
  },
  {
    id: "brace",
    name: "Brace",
    slot: "guard",
    shape: "instant",
    tags: [],
    blurb: "Brace for impact — reduce incoming damage when under heavy pressure.",
    tier: 1,
    scalePerTierPct: 0.1,
    cooldownMs: 7000,
    trigger: { kind: "hp-below", hpPct: 0.5 },
    effect: { kind: "damage-reduction", drPct: 0.4, durationMs: 3000, knockbackResistPct: 0.55 },
    icon: "brace",
  },
  // ── Step 7 follow-up: rough T1 per-biome abilities (placeholder numbers). ──
  {
    id: "cleanse",
    name: "Cleanse",
    slot: "guard",
    shape: "instant",
    tags: [],
    blurb: "Purge rot and debuffs, then steel yourself briefly against further harm.",
    tier: 1,
    scalePerTierPct: 0.1,
    cooldownMs: 9000,
    trigger: { kind: "has-debuff" },
    effect: { kind: "cleanse", stacks: 3, drPct: 0.2, durationMs: 3000 },
    icon: "cleanse",
  },
  {
    id: "expose-weakness",
    name: "Expose Weakness",
    slot: "technique",
    shape: "armed",
    tags: [],
    blurb: "Arms your next attack to expose the target, increasing all damage it takes.",
    tier: 1,
    scalePerTierPct: 0.15,
    cooldownMs: 12000,
    trigger: { kind: "in-combat" },
    effect: { kind: "expose-weakness", damageTakenPct: 0.2, durationMs: 4000 },
    icon: "expose-weakness",
  },
  {
    id: "second-wind",
    name: "Second Wind",
    slot: "guard",
    shape: "instant",
    tags: [],
    blurb: "Catch your breath and recover health over a few seconds.",
    tier: 1,
    scalePerTierPct: 0.1,
    cooldownMs: 12000,
    trigger: { kind: "in-combat" },
    effect: { kind: "heal", healPct: 0.3, durationMs: 4000 },
    icon: "second-wind",
  },
  // ── T2 (abilities evolution §9): NOT roster growth for its own sake. These three
  // introduce REFLECT, REPOSITIONING and CASTING while every T1 ability keeps
  // auto-scaling numerically. Numbers are PLACEHOLDERS — user balance pass.
  {
    id: "bramble-guard",
    name: "Bramble Guard",
    slot: "guard",
    shape: "instant",
    tags: [],
    blurb: "Harden your skin with thorns — gain armor and injure attackers who strike you.",
    tier: 2,
    scalePerTierPct: 0.1,
    cooldownMs: 10000,
    // Jungle is the high-density biome: the answer to being hit OFTEN is to make
    // each of those hits cost the attacker something.
    trigger: { kind: "n-aggro", count: 3 },
    effect: { kind: "bramble", platingBonus: 12, reflectFlat: 8, durationMs: 5000 },
    icon: "bramble-guard",
  },
  {
    id: "charge",
    name: "Charge",
    slot: "technique",
    shape: "reposition",
    tags: ["mobility"],
    blurb: "Close the gap in an instant, and land the next blow with the weight of the rush.",
    tier: 2,
    scalePerTierPct: 0.12,
    cooldownMs: 9000,
    trigger: { kind: "in-combat" },
    effect: { kind: "reposition", distance: 220, toward: true, empowerMult: 1.6 },
    icon: "charge",
  },
  {
    id: "charged-strike",
    name: "Charged Strike",
    slot: "technique",
    // The first player CAST. Wind up, stop attacking, then deliver one heavy blow.
    shape: "cast",
    tags: [],
    blurb: "Wind up a devastating blow. You stop attacking while it charges — and hard control breaks it.",
    tier: 2,
    scalePerTierPct: 0.15,
    cooldownMs: 11000,
    castMs: 1600,
    trigger: { kind: "in-combat" },
    effect: { kind: "cast-strike", damageMult: 4.5 },
    icon: "charged-strike",
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
};

/** Map a persisted id through {@link RENAMED_ABILITY_IDS}. */
export function currentAbilityId(id: string): string {
  return RENAMED_ABILITY_IDS[id] ?? id;
}

/**
 * THE single seam where an authored ability effect becomes the numbers the
 * server actually applies. Every consumer must go through this — a new ability
 * that reads `ability.effect` raw silently opts out of tier deepening and
 * Technique Power.
 *
 * Two independent multipliers, both restricted to magnitude fields:
 * - automatic tier deepening (plan §4.1), applied to every scalable field;
 * - Technique Power (plan §6.2), applied ONLY to fields listed in
 *   {@link TECHNIQUE_POWER_FIELDS} — i.e. offensive payloads. Guard potency is a
 *   separate stat family read at guard-fire time and must not leak in here.
 *
 * Durations, radii, stun times and movement distances are never touched.
 */
export function resolveAbilityEffect(
  ability: AbilityDef,
  opts: { playerTier: number; techniquePowerPct?: number },
): AbilityEffectSpec {
  const tierMult = abilityTierScale(ability, opts.playerTier);
  const powerMult = 1 + Math.max(0, opts.techniquePowerPct ?? 0);
  const powerFields = TECHNIQUE_POWER_FIELDS[ability.effect.kind] ?? [];
  const scalable = ABILITY_SCALABLE_FIELDS[ability.effect.kind];
  if (tierMult === 1 && powerMult === 1) return ability.effect;

  const out: Record<string, unknown> = { ...ability.effect };
  for (const field of scalable) {
    const base = out[field];
    if (typeof base !== "number") continue;
    const mult = tierMult * (powerFields.includes(field) ? powerMult : 1);
    // `stacks` is a count — keep it whole, and never round a real effect to nothing.
    out[field] = field === "stacks" ? Math.max(1, Math.round(base * mult)) : base * mult;
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
