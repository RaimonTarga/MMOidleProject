/**
 * Rune system catalog + pure arbitration fold.
 *
 * A rune is a player-authored rule: `<condition> -> <action>`. Rules are
 * evaluated from top to bottom every tick. The first active rule in each channel
 * claims that channel; later active rules in the same channel are ignored for
 * that pass.
 */
import type { AutocombatConfig } from "./components/core/networkedSlices";
import type { CombatArchetype } from "./types/combat";
import { NO_STANCE_ID, stanceDef } from "./stances";

export type RuneChannel =
  | "MOVEMENT"
  | "TARGETING"
  | "OOC_MAINTENANCE"
  | "RESOURCE_MAINTENANCE"
  | "GLOBAL_STRATEGY"
  /** Persistent terrain constraints; composes with approach and travel steering. */
  | "PATH_SAFETY"
  /** Optional approach bias around non-target elites; composes with safety. */
  | "APPROACH_STYLE"
  /** Optional local steering away from unengaged hostiles during map travel. */
  | "TRAVEL_PATHING"
  /** Whether a travel objective may yield to combat and resume afterwards. */
  | "TRAVEL_RESPONSE"
  | "CONTROL"
  // System rework Step 7: each ability slot gets its own channel so a Technique
  // override and a Guard override (and taunt in CONTROL) can be equipped at once.
  //
  // Abilities evolution §7: one channel per SLOT INDEX, not per slot kind —
  // channels are single-claim, so a second Technique slot needs its own channel
  // to carry an independent trigger. The `_2` channels are inert until the
  // player's tier actually grants that slot.
  | "TECHNIQUE"
  | "TECHNIQUE_2"
  | "GUARD"
  | "GUARD_2"
  // System rework Step 10: the stance-switch action gets its own single-claim
  // channel so it coexists with technique/guard overrides and a control taunt.
  | "STANCE";

export type RuneConditionId =
  | "always"
  | "in-combat"
  | "when-idle"
  | "hp-below-25"
  | "hp-above-90"
  | "target-hp-below-25"
  | "has-debuff"
  | "in-party"
  // Active only while the player is standing inside a visible, unresolved
  // hostile ground telegraph. Being safely outside the damage region does not
  // satisfy this condition.
  | "inside-telegraph"
  // Reactive telegraph hook: active while an enemy attacking you is charging a
  // cast-time attack (e.g. the Ridge Archer's Power Shot). Pairs with Fire Guard /
  // Switch Stance for read-and-react defense.
  | "target-casting"
  // Active while your NEXT attack is empowered (the finisher / execution / discharge
  // is armed and waiting to land). Class-agnostic: it reads the shared empowered flag,
  // so it fires for cadence (finisher armed), cooldown (execution ready), and energy
  // (energy maxed). Inert for classes with no empowered attack (DoT/reload/summoner
  // baseline). Pairs with Fire Technique to land your Technique on the empowered hit.
  | "before-empowered"
  // Active while your current attack target is an ELITE. Lets two equipped
  // Techniques specialise against the same enemy — e.g. Expose Weakness to kill
  // the elite faster vs. Stun Strike to control it (abilities evolution §9).
  | "target-elite"
  // Active while a STACKING damage-over-time you own on your current target sits
  // at its own ceiling. The affliction toolkit's timing condition: it is the
  // moment Contagion has the most to copy and Detonate the most to cash in, and
  // for a DoT class it is also the moment further stacking is wasted.
  //
  // Weapon reservoirs deliberately do NOT satisfy it. They are `maxStacks: 1`
  // internally, so counting them would make the condition true from the first
  // hit and it would never turn off again — a rule that fires constantly is not
  // a timing rule. See `stackCap` in the server's dot inventory.
  //
  // Inert rather than hidden for a build with no stacking DoT, exactly like
  // `before-empowered` for a class with no empowered attack: rune CONDITIONS
  // carry no archetype restriction (only actions do).
  | "target-max-stacks"
  /** Active only while a server-owned map navigation path has remaining hops. */
  | "while-traveling"
  // Active while the active stance's own charge is full. Currently only Powering Up
  // charges, and this is how a rule LEAVES it to cash the charge in.
  | "stance-charged"
  | "n-aggro-3";

export type RuneActionId =
  | "chase-enemy"
  | "flee"
  | "orbit"
  | "step-back"
  | "follow-and-assist"
  | "focus-closest"
  | "focus-lowest-hp"
  | "focus-highest-max-hp"
  | "let-dots-finish"
  | "spread-dots"
  | "focus-elites"
  | "tactical-reload"
  | "wait-for-execution"
  | "wait-for-regen"
  | "auto-path-enemy"
  | "avoid-hazards"
  | "careful-pulling"
  | "avoid-enemies"
  | "fight-back"
  | "lead-the-way"
  | "taunt-current-target"
  // System rework Step 7: override the built-in auto-fire timing of an ability.
  // Abilities evolution §7: `-2` variants drive the SECOND slot of each kind.
  | "fire-technique"
  | "fire-technique-2"
  | "fire-guard"
  | "fire-guard-2"
  // Switch to a destination stance authored on the assembled rule.
  | "switch-stance";

export interface ConditionDef {
  id: RuneConditionId;
  name: string;
  blurb: string;
  cost: number;
  tier: number;
  kind: "state";
}

export interface ActionDef {
  id: RuneActionId;
  name: string;
  blurb: string;
  cost: number;
  tier: number;
  channel: RuneChannel;
  allowedConditionIds?: readonly RuneConditionId[];
  requiredArchetype?: Exclude<CombatArchetype, null>;
}

/** An assembled rule: one condition wired to one action. Ordered by priority. */
export interface EquippedRule {
  conditionId: string;
  actionId: string;
  /** Required destination for switch-stance; invalid and ignored on other actions. */
  targetStanceId?: string;
}

export const RUNE_CHANNELS: RuneChannel[] = [
  "MOVEMENT",
  "TARGETING",
  "OOC_MAINTENANCE",
  "RESOURCE_MAINTENANCE",
  "GLOBAL_STRATEGY",
  "PATH_SAFETY",
  "APPROACH_STYLE",
  "TRAVEL_PATHING",
  "TRAVEL_RESPONSE",
  "CONTROL",
  "TECHNIQUE",
  "TECHNIQUE_2",
  "GUARD",
  "GUARD_2",
  "STANCE",
];

const COMBAT_CONDITIONS: readonly RuneConditionId[] = [
  "in-combat",
  "hp-below-25",
  "has-debuff",
  "n-aggro-3",
];

const TARGETING_CONDITIONS: readonly RuneConditionId[] = [
  "in-combat",
  "in-party",
  "n-aggro-3",
];

const RECOVERY_CONDITIONS: readonly RuneConditionId[] = [
  "when-idle",
  "hp-below-25",
];

/**
 * Recover First additionally accepts "Always". Out of Combat keys off the
 * post-combat grace timer, so a player who has just killed the last thing on
 * top of them is still "in combat" for several seconds and spends them walking
 * to the next pull. Always keys off actual engagement instead: hold the moment
 * nothing is attacking you and you have no live target, timer or not.
 */
const RECOVER_FIRST_CONDITIONS: readonly RuneConditionId[] = [
  "always",
  ...RECOVERY_CONDITIONS,
];

const STRATEGY_CONDITIONS: readonly RuneConditionId[] = [
  "always",
  "when-idle",
  "in-party",
];

const PATHING_CONDITIONS: readonly RuneConditionId[] = [
  "always",
  "when-idle",
  "in-combat",
];

const TRAVEL_CONDITIONS: readonly RuneConditionId[] = ["while-traveling"];

const CONTROL_CONDITIONS: readonly RuneConditionId[] = [
  "in-combat",
  "in-party",
];

// System rework Step 7: conditions a player can wire to an ability-fire override.
const TECHNIQUE_CONDITIONS: readonly RuneConditionId[] = [
  "in-combat",
  "before-empowered",
  "target-elite",
  "target-max-stacks",
  "n-aggro-3",
];

const GUARD_CONDITIONS: readonly RuneConditionId[] = [
  "in-combat",
  "hp-below-25",
  "has-debuff",
  "target-casting",
  "target-elite",
  "n-aggro-3",
];

// System rework Step 10: situations a player can wire to a stance auto-switch.
const STANCE_CONDITIONS: readonly RuneConditionId[] = [
  "always",
  "in-combat",
  "when-idle",
  "hp-below-25",
  "hp-above-90",
  "target-hp-below-25",
  "has-debuff",
  "target-casting",
  // The empowered window is a posture decision as much as an ability-timing one —
  // `Empowered Ready -> Time to Strike` is that stance's whole reason to exist. The
  // condition already existed for ability-fire rules; this only lets Switch Stance
  // name it too.
  "before-empowered",
  // `Stance Charged -> <anything>` is how a charging posture is left on purpose.
  "stance-charged",
  "while-traveling",
  "n-aggro-3",
];

export const CONDITION_DATABASE = new Map<string, ConditionDef>([
  [
    "always",
    {
      id: "always",
      name: "Always",
      blurb: "Works whenever the response can run.",
      cost: 0,
      tier: 1,
      kind: "state",
    },
  ],
  [
    "in-combat",
    {
      id: "in-combat",
      name: "In Combat",
      blurb: "Works while you are fighting.",
      cost: 1,
      tier: 1,
      kind: "state",
    },
  ],
  [
    "when-idle",
    {
      id: "when-idle",
      name: "Out of Combat",
      blurb: "Works when combat has cleared.",
      cost: 1,
      tier: 1,
      kind: "state",
    },
  ],
  [
    "hp-below-25",
    {
      id: "hp-below-25",
      name: "HP Below 25%",
      blurb: "Works while your health is at or under 25%.",
      cost: 1,
      tier: 1,
      kind: "state",
    },
  ],
  [
    "hp-above-90",
    {
      id: "hp-above-90",
      name: "HP Above 90%",
      blurb: "Works while your health is at or above 90%.",
      cost: 1,
      tier: 2,
      kind: "state",
    },
  ],
  [
    "target-hp-below-25",
    {
      id: "target-hp-below-25",
      name: "Target HP Below 25%",
      blurb: "Works while your current target is at or under 25% health.",
      cost: 1,
      tier: 2,
      kind: "state",
    },
  ],
  [
    "has-debuff",
    {
      id: "has-debuff",
      name: "When Debuffed",
      blurb: "Works while you are carrying a harmful debuff or damage-over-time effect.",
      cost: 1,
      tier: 1,
      kind: "state",
    },
  ],
  [
    "in-party",
    {
      id: "in-party",
      name: "In A Party",
      blurb: "Works while in a party with one or more players.",
      cost: 1,
      tier: 1,
      kind: "state",
    },
  ],
  [
    "n-aggro-3",
    {
      id: "n-aggro-3",
      name: "Surrounded",
      blurb: "Works when three or more enemies are chasing you.",
      cost: 2,
      tier: 4,
      kind: "state",
    },
  ],
  [
    "inside-telegraph",
    {
      id: "inside-telegraph",
      name: "Inside Telegraph",
      blurb: "Works while you are standing inside an unresolved hostile attack telegraph.",
      cost: 1,
      tier: 1,
      kind: "state",
    },
  ],
  [
    "target-casting",
    {
      id: "target-casting",
      name: "Enemy Charging",
      blurb: "Works while an enemy attacking you is winding up a cast-time attack.",
      cost: 2,
      tier: 2,
      kind: "state",
    },
  ],
  [
    "stance-charged",
    {
      id: "stance-charged",
      name: "Stance Charged",
      // Deliberately generic rather than "Powering Up is full": a charging posture
      // is a shape, and a second one would reuse this rather than add a condition.
      blurb:
        "Works while your active stance has finished charging and is holding a full charge, waiting to be spent.",
      cost: 1,
      tier: 3,
      kind: "state",
    },
  ],
  [
    "before-empowered",
    {
      id: "before-empowered",
      name: "Empowered Ready",
      // Numbers (cost/tier) are PLACEHOLDERS — user balance pass.
      blurb:
        "Works the instant your next attack becomes empowered — a finisher, execution, or full-energy discharge that is armed and waiting to land.",
      cost: 2,
      tier: 2,
      kind: "state",
    },
  ],
  [
    "target-elite",
    {
      id: "target-elite",
      name: "Elite Target",
      // Numbers (cost/tier) are PLACEHOLDERS — user balance pass.
      blurb:
        "Works while the enemy you are attacking is an elite — the high-value target worth spending a specialised ability on.",
      cost: 2,
      tier: 2,
      kind: "state",
    },
  ],
  [
    "target-max-stacks",
    {
      id: "target-max-stacks",
      name: "Fully Afflicted",
      // Numbers (cost/tier) are PLACEHOLDERS — user balance pass.
      blurb:
        "Works while your damage over time on the target has stacked as high as it goes — the moment there is most to spread, and most to detonate.",
      cost: 2,
      tier: 3,
      kind: "state",
    },
  ],
  [
    "while-traveling",
    {
      id: "while-traveling",
      name: "While Traveling",
      blurb: "Works while you are following an intentional map travel route.",
      cost: 0,
      tier: 1,
      kind: "state",
    },
  ],
]);

export const ACTION_DATABASE = new Map<string, ActionDef>([
  [
    "chase-enemy",
    {
      id: "chase-enemy",
      name: "Chase Enemy",
      blurb: "Move into the weapon's normal attack range.",
      cost: 0,
      tier: 1,
      channel: "MOVEMENT",
      allowedConditionIds: COMBAT_CONDITIONS,
    },
  ],
  [
    "flee",
    {
      id: "flee",
      name: "Flee",
      blurb: "Retreat from the current fight.",
      cost: 1,
      tier: 1,
      channel: "MOVEMENT",
      allowedConditionIds: COMBAT_CONDITIONS,
    },
  ],
  [
    "orbit",
    {
      id: "orbit",
      name: "Keep Distance",
      blurb: "Hold a standoff gap and kite while attacking.",
      cost: 2,
      tier: 1,
      channel: "MOVEMENT",
      allowedConditionIds: COMBAT_CONDITIONS,
    },
  ],
  [
    "step-back",
    {
      id: "step-back",
      name: "Step Back",
      blurb: "Take the shortest reasonable route out of visible attack telegraphs.",
      cost: 2,
      tier: 1,
      channel: "MOVEMENT",
      allowedConditionIds: ["inside-telegraph"],
    },
  ],
  [
    "follow-and-assist",
    {
      id: "follow-and-assist",
      name: "Follow And Assist",
      blurb: "Follow the party leader out of combat, and attack their target in combat.",
      cost: 1,
      tier: 1,
      channel: "MOVEMENT",
      allowedConditionIds: ["in-party"],
    },
  ],
  [
    "focus-closest",
    {
      id: "focus-closest",
      name: "Focus Closest",
      blurb: "Prefer the nearest valid enemy.",
      cost: 0,
      tier: 1,
      channel: "TARGETING",
      allowedConditionIds: TARGETING_CONDITIONS,
    },
  ],
  [
    "focus-lowest-hp",
    {
      id: "focus-lowest-hp",
      name: "Focus Lowest HP",
      blurb: "Prefer fast kills to reduce enemy count.",
      cost: 2,
      tier: 4,
      channel: "TARGETING",
      allowedConditionIds: TARGETING_CONDITIONS,
    },
  ],
  [
    "focus-highest-max-hp",
    {
      id: "focus-highest-max-hp",
      name: "Focus Highest HP",
      blurb: "Prefer the enemy with the largest maximum health pool.",
      cost: 2,
      tier: 1,
      channel: "TARGETING",
      allowedConditionIds: TARGETING_CONDITIONS,
    },
  ],
  [
    "let-dots-finish",
    {
      id: "let-dots-finish",
      name: "Let DoTs Finish",
      blurb: "Prefer a new enemy when your damage over time should finish the current one.",
      cost: 1,
      tier: 2,
      channel: "TARGETING",
      allowedConditionIds: TARGETING_CONDITIONS,
      requiredArchetype: "dot",
    },
  ],
  [
    "spread-dots",
    {
      id: "spread-dots",
      name: "Spread DoTs",
      blurb: "In multi-enemy fights, rotate targets to keep your damage over time active.",
      cost: 2,
      tier: 2,
      channel: "TARGETING",
      allowedConditionIds: TARGETING_CONDITIONS,
      requiredArchetype: "dot",
    },
  ],
  [
    "focus-elites",
    {
      id: "focus-elites",
      name: "Focus Elites",
      blurb: "Prioritize elite enemies (the yellow-outlined standouts) — necromancers, apex predators — before clearing the rest.",
      cost: 2,
      tier: 2,
      channel: "TARGETING",
      allowedConditionIds: TARGETING_CONDITIONS,
      // No requiredArchetype — focusing the dangerous one is a universal tactic.
    },
  ],
  [
    "tactical-reload",
    {
      id: "tactical-reload",
      name: "Reload Safely",
      blurb: "Out of combat, pause to refill reload-class clips.",
      cost: 1,
      tier: 1,
      channel: "RESOURCE_MAINTENANCE",
      allowedConditionIds: RECOVERY_CONDITIONS,
      requiredArchetype: "reload",
    },
  ],
  [
    "wait-for-execution",
    {
      id: "wait-for-execution",
      name: "Ready Execution",
      blurb: "Out of combat, wait until your cooldown-class execution is ready.",
      cost: 1,
      tier: 1,
      channel: "OOC_MAINTENANCE",
      allowedConditionIds: RECOVERY_CONDITIONS,
      requiredArchetype: "cooldown",
    },
  ],
  [
    "wait-for-regen",
    {
      id: "wait-for-regen",
      name: "Recover First",
      blurb:
        "Hold position until HP is full instead of moving on. With Always, it holds as soon as nothing is attacking you, without waiting for combat to time out.",
      cost: 1,
      tier: 1,
      channel: "OOC_MAINTENANCE",
      allowedConditionIds: RECOVER_FIRST_CONDITIONS,
    },
  ],
  [
    "auto-path-enemy",
    {
      id: "auto-path-enemy",
      name: "Find Enemies",
      blurb: "When idle, path to the nearest valid enemy in this node.",
      cost: 0,
      tier: 1,
      channel: "GLOBAL_STRATEGY",
      allowedConditionIds: STRATEGY_CONDITIONS,
    },
  ],
  [
    "avoid-hazards",
    {
      id: "avoid-hazards",
      name: "Avoid Hazards",
      blurb: "Route around damaging and slowing terrain when pathing.",
      cost: 2,
      tier: 1,
      channel: "PATH_SAFETY",
      allowedConditionIds: PATHING_CONDITIONS,
    },
  ],
  [
    "careful-pulling",
    {
      id: "careful-pulling",
      name: "Careful Pulling",
      blurb: "While approaching a target, bias movement away from nearby non-target elites.",
      cost: 2,
      tier: 1,
      channel: "APPROACH_STYLE",
      allowedConditionIds: PATHING_CONDITIONS,
    },
  ],
  [
    "avoid-enemies",
    {
      id: "avoid-enemies",
      name: "Avoid Enemies",
      blurb: "While traveling, take reasonable local detours around unengaged hostiles.",
      cost: 1,
      tier: 1,
      channel: "TRAVEL_PATHING",
      allowedConditionIds: TRAVEL_CONDITIONS,
    },
  ],
  [
    "fight-back",
    {
      id: "fight-back",
      name: "Fight Back",
      blurb: "Pause travel when attacked, use your normal combat rules, then resume the route.",
      cost: 0,
      tier: 1,
      channel: "TRAVEL_RESPONSE",
      allowedConditionIds: TRAVEL_CONDITIONS,
    },
  ],
  [
    "lead-the-way",
    {
      id: "lead-the-way",
      name: "Lead The Way",
      blurb: "As party leader, look for enemies in this zone so followers can trail you.",
      cost: 0,
      tier: 1,
      channel: "GLOBAL_STRATEGY",
      allowedConditionIds: ["in-party"],
    },
  ],
  [
    "taunt-current-target",
    {
      id: "taunt-current-target",
      name: "Taunt Target",
      blurb: "On hit, force your current enemy to attack you. Has a 4 second cooldown.",
      cost: 1,
      tier: 1,
      channel: "CONTROL",
      allowedConditionIds: CONTROL_CONDITIONS,
    },
  ],
  [
    "fire-technique",
    {
      id: "fire-technique",
      name: "Fire Technique",
      blurb:
        "Override your Technique's auto-timing: arm it when this situation holds instead of the default.",
      cost: 1,
      tier: 1,
      channel: "TECHNIQUE",
      allowedConditionIds: TECHNIQUE_CONDITIONS,
    },
  ],
  [
    "fire-technique-2",
    {
      id: "fire-technique-2",
      name: "Fire Technique II",
      blurb:
        "Override the auto-timing of your SECOND Technique. Inert until a second Technique slot is unlocked.",
      cost: 1,
      tier: 3,
      channel: "TECHNIQUE_2",
      allowedConditionIds: TECHNIQUE_CONDITIONS,
    },
  ],
  [
    "fire-guard",
    {
      id: "fire-guard",
      name: "Fire Guard",
      blurb:
        "Override your Guard's auto-timing: trigger it when this situation holds instead of the default.",
      cost: 1,
      tier: 1,
      channel: "GUARD",
      allowedConditionIds: GUARD_CONDITIONS,
    },
  ],
  [
    "fire-guard-2",
    {
      id: "fire-guard-2",
      name: "Fire Guard II",
      blurb:
        "Override the auto-timing of your SECOND Guard. Inert until a second Guard slot is unlocked.",
      cost: 1,
      tier: 4,
      channel: "GUARD_2",
      allowedConditionIds: GUARD_CONDITIONS,
    },
  ],
  [
    "switch-stance",
    {
      id: "switch-stance",
      name: "Switch Stance",
      blurb:
        "Switch to a chosen learned stance while this situation holds, reverting to your default otherwise.",
      // Deliberately 0. The action is a verb with no power of its own — every gram of
      // what a stance rule buys you is the destination, which already carries a 1-4 RP
      // surcharge. Charging for the verb as well taxed the whole axis twice and made the
      // cheapest possible tactical transition (1 + 2 + 1) cost as much as a premium Rite,
      // so Stance micro stopped being a luxury optimization and became unaffordable.
      // A stance rule now costs condition + destination; see `runeRuleCost`.
      cost: 0,
      tier: 2,
      channel: "STANCE",
      allowedConditionIds: STANCE_CONDITIONS,
    },
  ],
]);

/** Every fragment id (conditions + actions). Useful for validation/tooling. */
export const ALL_RUNE_IDS: string[] = [
  ...CONDITION_DATABASE.keys(),
  ...ACTION_DATABASE.keys(),
];

export const DEFAULT_RUNE_LOADOUT: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
  { conditionId: "always", actionId: "wait-for-regen" },
  { conditionId: "hp-below-25", actionId: "flee" },
  { conditionId: "while-traveling", actionId: "fight-back" },
];

export const STARTER_RUNE_IDS: string[] = Array.from(
  new Set([
    // Situations are baseline vocabulary. Progression unlocks new responses.
    ...CONDITION_DATABASE.keys(),
    ...DEFAULT_RUNE_LOADOUT.flatMap((rule) => [rule.conditionId, rule.actionId]),
    // Party runes and basic targeting are available from the start
    "in-party",
    "lead-the-way",
    "follow-and-assist",
    "taunt-current-target",
    "focus-closest",
    // Step 7: ability-fire overrides are available from the start (a timing
    // preference for an ability you already had to unlock). Equipping still
    // costs RP. The user can move these onto recipes in a later balance pass.
    "fire-technique",
    "fire-guard",
    // Abilities evolution §7: the slot-2 overrides ride the same reasoning, and
    // are inert until the player's tier grants a second slot of that kind.
    "fire-technique-2",
    "fire-guard-2",
    // Stance auto-switch is a timing preference for a learned destination.
    "switch-stance",
    // Reactive "enemy is charging a cast" condition — available from the start so
    // players can answer telegraphed casts once they meet a charging mob.
    "target-casting",
    // "Empowered Ready" condition. TEMPORARY starter so it's usable now; intended to
    // become an earned reward later (move it onto a rune recipe in the reward pass).
    "before-empowered",
    // "Elite Target" condition — the situation that makes a specialised second
    // Technique worth equipping. Same TEMPORARY-starter caveat as above.
    "target-elite",
    // "Fully Afflicted" condition. Starter vocabulary (DESIGNER CALL) rather than
    // a swamp rune recipe: it is the timing half of the Contagion/Detonate pair,
    // and gating the timing behind a THIRD swamp unlock would mean buying two
    // techniques that then sit on a naive `in-combat` trigger. Inert until the
    // player actually has a stacking DoT, so granting it early costs nothing.
    "target-max-stacks",
    // DESIGNER CALL, 2026-08-25: default-unlocked so every character can
    // answer danger the way a human does without waiting on a Cave-gated
    // recipe first -- recover before pulling again, and retreat when a fight
    // has gone bad. Previously gated behind rune-recipe-recover-first and
    // rune-recipe-flee. CLEANUP, 2026-08-28: both recipes are marked
    // `deprecated: true` in `runeRecipes.ts` -- kept live for recipe-id/save
    // stability, but hidden from every player-facing surface and rejected by
    // `craftRuneRecipe` before any essence is spent.
    "wait-for-regen",
    "flee",
    "while-traveling",
    "fight-back",
    "avoid-enemies",
  ]),
);

export function isRuneFragmentKnown(id: string): boolean {
  return CONDITION_DATABASE.has(id) || ACTION_DATABASE.has(id);
}

const LEGACY_CONDITION_IDS: Record<string, RuneConditionId> = {
  "low-hp": "hp-below-25",
};

const LEGACY_ACTION_IDS: Record<string, RuneActionId> = {
  "keep-distance": "orbit",
  explore: "auto-path-enemy",
};

export function normalizeRuneRule(rule: EquippedRule): EquippedRule {
  return {
    conditionId: LEGACY_CONDITION_IDS[rule.conditionId] ?? rule.conditionId,
    actionId: LEGACY_ACTION_IDS[rule.actionId] ?? rule.actionId,
    ...(rule.actionId === "switch-stance" && typeof rule.targetStanceId === "string"
      ? { targetStanceId: rule.targetStanceId }
      : {}),
  };
}

export function normalizeRuneLoadout(rules: EquippedRule[]): EquippedRule[] {
  return rules
    .filter(
      (rule) =>
        rule &&
        typeof rule.conditionId === "string" &&
        typeof rule.actionId === "string",
    )
    .map(normalizeRuneRule);
}

/**
 * Rune-point budget. System rework Step 4: Global Mastery replaces the tier term —
 * RP now scales with farmed breadth, not raw tier, so a high-tier/low-GM rusher is
 * under-budgeted until they farm (the brainstorm's catch-up mechanism).
 *
 * PLACEHOLDER (non-regressive): the `/ 10` divisor is anchored so RP at equivalent
 * progression is ≥ the old `8 + tier*2`. A tier-complete player levels ~5 biomes to
 * ~level 4 (where content currently stops — auto-traverse skips the empty levels 5–6),
 * so GM ≈ 20 per cleared tier → +2 RP/tier, matching the retired tier term. base 8 =
 * old tier-0. The divisor is the user's balance lever. (Step 5 retired the crafted
 * rune-capacity recipes; RP now comes solely from GM.)
 */
export const RUNE_POINT_GLOBAL_MASTERY_STEP = 10;

export function runeBudgetForGlobalMastery(globalMastery: number): number {
  return 8 + Math.floor(Math.max(0, globalMastery) / RUNE_POINT_GLOBAL_MASTERY_STEP);
}

export function runeRuleCost(rule: EquippedRule): number {
  const condition = CONDITION_DATABASE.get(rule.conditionId);
  const action = ACTION_DATABASE.get(rule.actionId);
  if (!condition || !action) return 0;
  // `switch-stance` prices its destination, not itself (its own cost is 0), so the sum
  // below is the whole and only truth about what a stance rule costs. Every surface that
  // shows a stance rule's price must call THIS, never `action.cost` plus a guess.
  const destinationCost = action.id === "switch-stance"
    ? (stanceDef(rule.targetStanceId)?.runeCost ?? 0)
    : 0;
  return condition.cost + action.cost + destinationCost;
}

export function runeLoadoutCost(rules: EquippedRule[]): number {
  return rules.reduce((sum, rule) => sum + runeRuleCost(rule), 0);
}

export function runeChannelLabel(channel: RuneChannel): string {
  switch (channel) {
    case "MOVEMENT":
      return "Movement";
    case "TARGETING":
      return "Targeting";
    case "OOC_MAINTENANCE":
      return "Recovery";
    case "RESOURCE_MAINTENANCE":
      return "Resource";
    case "GLOBAL_STRATEGY":
      return "Search";
    case "PATH_SAFETY":
      return "Path Safety";
    case "APPROACH_STYLE":
      return "Approach";
    case "TRAVEL_PATHING":
      return "Travel Pathing";
    case "TRAVEL_RESPONSE":
      return "Travel Response";
    case "CONTROL":
      return "Control";
    case "TECHNIQUE":
      return "Technique";
    case "TECHNIQUE_2":
      return "Technique II";
    case "GUARD":
      return "Guard";
    case "GUARD_2":
      return "Guard II";
    case "STANCE":
      return "Stance";
  }
}

export function isRuneRuleKnown(rule: EquippedRule): boolean {
  return (
    CONDITION_DATABASE.has(rule.conditionId) &&
    ACTION_DATABASE.has(rule.actionId)
  );
}

export function isRuneRuleCompatible(rule: EquippedRule): boolean {
  return isRuneRuleCompatibleForArchetype(rule, undefined);
}

export function isRuneRuleCompatibleForArchetype(
  rule: EquippedRule,
  combatArchetype: CombatArchetype | undefined,
): boolean {
  const condition = CONDITION_DATABASE.get(rule.conditionId);
  const action = ACTION_DATABASE.get(rule.actionId);
  if (!condition || !action) return false;
  if (
    action.requiredArchetype !== undefined &&
    action.requiredArchetype !== combatArchetype
  ) {
    return false;
  }
  return (
    action.allowedConditionIds === undefined ||
    action.allowedConditionIds.includes(condition.id)
  );
}

export function isRuneRuleOwned(
  rule: EquippedRule,
  owned: ReadonlySet<string>,
): boolean {
  return owned.has(rule.conditionId) && owned.has(rule.actionId);
}

export function sanitizeRuneLoadout(
  rules: EquippedRule[],
  owned: ReadonlySet<string>,
  budget: number,
  combatArchetype?: CombatArchetype,
  knownStances?: ReadonlySet<string>,
): EquippedRule[] {
  const sanitized: EquippedRule[] = [];
  let spent = 0;
  for (const raw of normalizeRuneLoadout(rules)) {
    if (
      !raw ||
      typeof raw.conditionId !== "string" ||
      typeof raw.actionId !== "string" ||
      !isRuneRuleKnown(raw) ||
      !isRuneRuleCompatibleForArchetype(raw, combatArchetype) ||
      !isRuneRuleOwned(raw, owned)
    ) {
      continue;
    }
    if (
      raw.actionId === "switch-stance" &&
      (!raw.targetStanceId ||
        (raw.targetStanceId !== NO_STANCE_ID &&
          (!stanceDef(raw.targetStanceId) ||
            (knownStances !== undefined && !knownStances.has(raw.targetStanceId)))))
    ) continue;
    const cost = runeRuleCost(raw);
    if (spent + cost > budget) continue;
    sanitized.push({
      conditionId: raw.conditionId,
      actionId: raw.actionId,
      ...(raw.targetStanceId ? { targetStanceId: raw.targetStanceId } : {}),
    });
    spent += cost;
  }
  return sanitized;
}

export type RuneConflictKind = "redundant" | "suppressed" | "overlap";

export interface RuneRuleConflict {
  /** Later rule that needs player-facing explanation. */
  ruleIndex: number;
  /** Earlier same-lane rule that interacts with it. */
  earlierRuleIndex: number;
  channel: RuneChannel;
  kind: RuneConflictKind;
}

/**
 * True when every activation of `narrower` is also an activation of `broader`.
 * The deliberately small relation is conservative: equal conditions and Always
 * are enough to identify permanent suppression without pretending unrelated
 * combat states have a total ordering.
 */
export function runeConditionContains(
  broaderId: string,
  narrowerId: string,
): boolean {
  return broaderId === narrowerId || broaderId === "always";
}

/** Only surface an overlap warning when two situations can actually be true together. */
function runeConditionsCanOverlap(leftId: string, rightId: string): boolean {
  const pair = new Set([leftId, rightId]);
  return !(
    (pair.has("in-combat") && pair.has("when-idle")) ||
    (pair.has("hp-below-25") && pair.has("hp-above-90"))
  );
}

/**
 * Explain same-lane Rune interactions for the loadout board. A later rule is
 * only marked suppressed when it can never claim its lane; ordinary overlapping
 * conditions remain legal priority layering and receive an explanation instead.
 */
export function analyzeRuneLoadoutConflicts(
  rules: readonly EquippedRule[],
): RuneRuleConflict[] {
  const conflicts: RuneRuleConflict[] = [];
  for (let index = 0; index < rules.length; index += 1) {
    const rule = rules[index];
    const action = ACTION_DATABASE.get(rule.actionId);
    if (!action) continue;
    for (let earlierIndex = 0; earlierIndex < index; earlierIndex += 1) {
      const earlier = rules[earlierIndex];
      const earlierAction = ACTION_DATABASE.get(earlier.actionId);
      if (!earlierAction || earlierAction.channel !== action.channel) continue;
      if (earlier.conditionId === rule.conditionId && earlier.actionId === rule.actionId) {
        conflicts.push({ ruleIndex: index, earlierRuleIndex: earlierIndex, channel: action.channel, kind: "redundant" });
        break;
      } else if (runeConditionContains(earlier.conditionId, rule.conditionId)) {
        conflicts.push({ ruleIndex: index, earlierRuleIndex: earlierIndex, channel: action.channel, kind: "suppressed" });
        break;
      } else if (runeConditionsCanOverlap(earlier.conditionId, rule.conditionId)) {
        conflicts.push({ ruleIndex: index, earlierRuleIndex: earlierIndex, channel: action.channel, kind: "overlap" });
        break;
      }
    }
  }
  return conflicts;
}

/** Replace an exact same-condition, same-lane rule; retain legitimate layering. */
export function addRuneRuleWithReplacement(
  rules: readonly EquippedRule[],
  added: EquippedRule,
): EquippedRule[] {
  const action = ACTION_DATABASE.get(added.actionId);
  if (!action) return [...rules, added];
  const replacementIndex = rules.findIndex((rule) => {
    const existing = ACTION_DATABASE.get(rule.actionId);
    return existing?.channel === action.channel && rule.conditionId === added.conditionId;
  });
  if (replacementIndex < 0) return [...rules, added];
  const next = [...rules];
  next[replacementIndex] = added;
  return next;
}

export interface NamedRule {
  name: string;
  blurb: string;
}

function ruleKey(conditionId: string, actionId: string): string {
  return `${conditionId}:${actionId}`;
}

export const NAMED_RULES = new Map<string, NamedRule>([
  [
    ruleKey("inside-telegraph", "step-back"),
    {
      name: "Read The Ground",
      blurb: "Step out of an incoming ground attack, then resume your normal movement rule.",
    },
  ],
  [
    ruleKey("always", "auto-path-enemy"),
    {
      name: "Scout",
      blurb: "Keep looking for the nearest enemy in this zone.",
    },
  ],
  [
    ruleKey("when-idle", "auto-path-enemy"),
    {
      name: "Scout",
      blurb: "When combat ends, look for the nearest enemy in this zone.",
    },
  ],
  [
    ruleKey("always", "avoid-hazards"),
    {
      name: "Careful Footing",
      blurb: "Route around dangerous terrain whenever pathing can avoid it.",
    },
  ],
  [
    ruleKey("when-idle", "avoid-hazards"),
    {
      name: "Marshwise",
      blurb: "Out of combat, route around dangerous terrain while moving.",
    },
  ],
  [
    ruleKey("in-combat", "avoid-hazards"),
    {
      name: "Watch Your Step",
      blurb: "While fighting, route around dangerous terrain when repositioning.",
    },
  ],
  [
    ruleKey("in-combat", "careful-pulling"),
    {
      name: "Careful Pulling",
      blurb: "While fighting, approach your target from safer angles away from nearby elites.",
    },
  ],
  [
    ruleKey("in-combat", "chase-enemy"),
    {
      name: "Brawler",
      blurb: "Once a fight starts, move into your weapon's natural range.",
    },
  ],
  [
    ruleKey("in-combat", "focus-closest"),
    {
      name: "Pragmatist",
      blurb: "In combat, attack the closest valid target.",
    },
  ],
  [
    ruleKey("in-combat", "focus-highest-max-hp"),
    {
      name: "Cull The Large",
      blurb: "In combat, focus the enemy with the largest maximum health pool.",
    },
  ],
  [
    ruleKey("in-combat", "let-dots-finish"),
    {
      name: "Wither",
      blurb: "When your DoT should finish an enemy, start pressuring another one.",
    },
  ],
  [
    ruleKey("in-combat", "spread-dots"),
    {
      name: "Multidot",
      blurb: "Rotate between enemies to keep your DoTs rolling across the fight.",
    },
  ],
  [
    ruleKey("hp-below-25", "flee"),
    {
      name: "Survivor",
      blurb: "At or below 25% HP, retreat from the fight.",
    },
  ],
  [
    ruleKey("in-combat", "orbit"),
    {
      name: "Kiter",
      blurb: "While fighting, hold a standoff gap and attack from range.",
    },
  ],
  [
    ruleKey("in-party", "follow-and-assist"),
    {
      name: "Wingman",
      blurb: "Follow the party leader out of combat, and attack their target in combat.",
    },
  ],
  [
    ruleKey("in-party", "lead-the-way"),
    {
      name: "Trailblazer",
      blurb: "While leading, find enemies in this zone for the party to fight.",
    },
  ],
  [
    ruleKey("when-idle", "wait-for-regen"),
    {
      name: "Cautious",
      blurb: "After combat, wait for full HP before moving on.",
    },
  ],
  [
    ruleKey("always", "wait-for-regen"),
    {
      name: "Convalescent",
      blurb:
        "Whenever nothing is attacking you, wait for full HP before looking for the next enemy.",
    },
  ],
  [
    ruleKey("when-idle", "wait-for-execution"),
    {
      name: "Patient Strike",
      blurb: "After combat, wait until your execution is ready before moving on.",
    },
  ],
  [
    ruleKey("before-empowered", "fire-technique"),
    {
      name: "Finishing Technique",
      blurb:
        "Arm your Technique the instant your next attack becomes empowered, so the big hit also carries it.",
    },
  ],
  [
    ruleKey("in-combat", "taunt-current-target"),
    {
      name: "Challenge",
      blurb: "While fighting, your hits pull your target's attention onto you.",
    },
  ],
  [
    ruleKey("in-party", "taunt-current-target"),
    {
      name: "Protector",
      blurb: "While in a party, your hits pull your target's attention onto you.",
    },
  ],
]);

export function getRuleName(
  conditionId: string,
  actionId: string,
): NamedRule | null {
  return NAMED_RULES.get(ruleKey(conditionId, actionId)) ?? null;
}

export const BASELINE_ACQUIRE_RADIUS = 600;

export const RUNE_NODE_ACQUIRE_RADIUS = 10000;

export const BASELINE_RUNE_CONFIG: AutocombatConfig = {
  priorityMode: "nearest",
  fleeWhenLow: false,
  fleeHpPct: 0.25,
  acquireRadius: BASELINE_ACQUIRE_RADIUS,
  focusLeaderTarget: false,
  engageUltimateBosses: false,
};

export interface RuneContext {
  hpPct: number;
  targetHpPct?: number;
  inCombat: boolean;
  /**
   * Something is actually on the player right now: a live attack target, or at
   * least one monster aggroed onto them. Narrower than `inCombat`, which stays
   * true through the post-combat grace window. Absent for callers that have not
   * measured it — they fall back to `inCombat`.
   */
  activelyEngaged?: boolean;
  inParty: boolean;
  aggroCount: number;
  combatArchetype?: CombatArchetype;
  /** Player currently has a harmful debuff or DoT. */
  debuffed?: boolean;
  /** An enemy attacking this player is currently winding up a cast-time attack. */
  enemyCharging?: boolean;
  /** Player is currently inside a visible, unresolved hostile ground telegraph. */
  insideDangerousTelegraph?: boolean;
  /**
   * This player's next attack is empowered (the shared empowered-attack flag is
   * armed). Drives the `before-empowered` condition. False/absent for classes that
   * have no empowered attack armed.
   */
  empoweredImminent?: boolean;
  /**
   * The player's current attack target is an elite. Drives `target-elite`, the
   * condition that makes a specialised second Technique worth equipping.
   */
  targetIsElite?: boolean;
  /**
   * A STACKING damage-over-time this player owns on their current attack target
   * is at its own ceiling. Drives `target-max-stacks`. Measured server-side
   * through the DoT inventory, so a future T4 DoT path drives it with no change
   * here. Weapon reservoirs are excluded by that inventory, not by this flag.
   */
  targetAtMaxDotStacks?: boolean;
  /** An intentional server-owned map navigation path still has work to do. */
  traveling?: boolean;
  /**
   * The active stance's own charge is full. Only a charging posture (Powering Up)
   * ever sets this; every other stance leaves it false, so a `Stance Charged` rule
   * built without one simply never fires.
   */
  stanceCharged?: boolean;
}

export interface ClaimedRuneAction {
  rule: EquippedRule;
  action: ActionDef;
  condition: ConditionDef;
}

export type ClaimedRuneChannels = Record<RuneChannel, ClaimedRuneAction | null>;

export interface DerivedRuneConfig {
  config: AutocombatConfig;
  claimed: ClaimedRuneChannels;
  movementAction: RuneActionId | null;
  targetingAction: RuneActionId | null;
  oocMaintenanceAction: RuneActionId | null;
  resourceMaintenanceAction: RuneActionId | null;
  globalStrategyAction: RuneActionId | null;
  pathSafetyAction: RuneActionId | null;
  approachStyleAction: RuneActionId | null;
  travelPathingAction: RuneActionId | null;
  travelResponseAction: RuneActionId | null;
  controlAction: RuneActionId | null;
  techniqueAction: RuneActionId | null;
  technique2Action: RuneActionId | null;
  guardAction: RuneActionId | null;
  guard2Action: RuneActionId | null;
  stanceAction: RuneActionId | null;
  stanceTargetId: string | null;
  fleeRequested: boolean;
  orbit: boolean;
  evadeTelegraph: boolean;
  autoPathEnemy: boolean;
  avoidHazards: boolean;
  carefulPulling: boolean;
  avoidEnemies: boolean;
  fightBackWhileTraveling: boolean;
  waitForRegen: boolean;
  tacticalReload: boolean;
  waitForExecution: boolean;
  followLeader: boolean;
  leadTheWay: boolean;
  tauntCurrentTarget: boolean;
  letDotsFinish: boolean;
  spreadDots: boolean;
  /** A `focus-elites` rule is active this tick — prioritize elite-tagged enemies. */
  focusElites: boolean;
  /** A `fire-technique` rule's condition is active this tick (override Technique slot 0). */
  fireTechnique: boolean;
  /** A `fire-technique-2` rule's condition is active this tick (Technique slot 1). */
  fireTechnique2: boolean;
  /** A `fire-guard` rule's condition is active this tick (override Guard slot 0). */
  fireGuard: boolean;
  /** A `fire-guard-2` rule's condition is active this tick (Guard slot 1). */
  fireGuard2: boolean;
  /** A valid `switch-stance` rule claims the Stance channel this tick. */
  switchStance: boolean;
}

function emptyClaims(): ClaimedRuneChannels {
  return {
    MOVEMENT: null,
    TARGETING: null,
    OOC_MAINTENANCE: null,
    RESOURCE_MAINTENANCE: null,
    GLOBAL_STRATEGY: null,
    PATH_SAFETY: null,
    APPROACH_STYLE: null,
    TRAVEL_PATHING: null,
    TRAVEL_RESPONSE: null,
    CONTROL: null,
    TECHNIQUE: null,
    TECHNIQUE_2: null,
    GUARD: null,
    GUARD_2: null,
    STANCE: null,
  };
}

function isConditionActive(conditionId: string, ctx: RuneContext): boolean {
  switch (conditionId) {
    case "always":
      return true;
    case "in-combat":
      return ctx.inCombat;
    case "when-idle":
      return !ctx.inCombat;
    case "hp-below-25":
      return ctx.hpPct <= 0.25;
    case "hp-above-90":
      return ctx.hpPct >= 0.9;
    case "target-hp-below-25":
      return ctx.targetHpPct !== undefined && ctx.targetHpPct <= 0.25;
    case "has-debuff":
      return ctx.debuffed ?? false;
    case "in-party":
      return ctx.inParty;
    case "inside-telegraph":
      return ctx.insideDangerousTelegraph ?? false;
    case "n-aggro-3":
      return ctx.aggroCount >= 3;
    case "target-casting":
      return ctx.enemyCharging ?? false;
    case "before-empowered":
      return ctx.empoweredImminent ?? false;
    case "target-elite":
      return ctx.targetIsElite ?? false;
    case "target-max-stacks":
      return ctx.targetAtMaxDotStacks ?? false;
    case "while-traveling":
      return ctx.traveling ?? false;
    case "stance-charged":
      return ctx.stanceCharged ?? false;
    default:
      return false;
  }
}

export function deriveAutoConfigFromRunes(
  equipped: EquippedRule[],
  ctx: RuneContext,
): DerivedRuneConfig {
  const claimed = emptyClaims();
  const derived: DerivedRuneConfig = {
    config: { ...BASELINE_RUNE_CONFIG },
    claimed,
    movementAction: null,
    targetingAction: null,
    oocMaintenanceAction: null,
    resourceMaintenanceAction: null,
    globalStrategyAction: null,
    pathSafetyAction: null,
    approachStyleAction: null,
    travelPathingAction: null,
    travelResponseAction: null,
    controlAction: null,
    techniqueAction: null,
    technique2Action: null,
    guardAction: null,
    guard2Action: null,
    stanceAction: null,
    stanceTargetId: null,
    fleeRequested: false,
    orbit: false,
    evadeTelegraph: false,
    autoPathEnemy: false,
    avoidHazards: false,
    carefulPulling: false,
    avoidEnemies: false,
    fightBackWhileTraveling: false,
    waitForRegen: false,
    tacticalReload: false,
    waitForExecution: false,
    followLeader: false,
    leadTheWay: false,
    tauntCurrentTarget: false,
    letDotsFinish: false,
    spreadDots: false,
    focusElites: false,
    fireTechnique: false,
    fireTechnique2: false,
    fireGuard: false,
    fireGuard2: false,
    switchStance: false,
  };

  const engaged = ctx.activelyEngaged ?? ctx.inCombat;

  for (const raw of normalizeRuneLoadout(equipped)) {
    const condition = CONDITION_DATABASE.get(raw.conditionId);
    const action = ACTION_DATABASE.get(raw.actionId);
    if (!condition || !action) continue;
    if (!isRuneRuleCompatibleForArchetype(raw, ctx.combatArchetype)) continue;
    // "Always -> Recover First" is the one maintenance rule allowed to claim its
    // channel while the combat timer is still running. It self-gates on actual
    // engagement instead, so it stops the player from seeking the next enemy the
    // moment nothing is attacking them.
    const holdsWhileDisengaged =
      action.id === "wait-for-regen" && condition.id === "always" && !engaged;
    if (
      (action.channel === "OOC_MAINTENANCE" ||
        action.channel === "RESOURCE_MAINTENANCE") &&
      ctx.inCombat &&
      !holdsWhileDisengaged
    ) {
      continue;
    }
    if (
      action.channel === "GLOBAL_STRATEGY" &&
      action.id !== "lead-the-way" &&
      !(action.id === "auto-path-enemy" && condition.id === "always") &&
      ctx.inCombat
    ) {
      continue;
    }
    if (claimed[action.channel]) continue;
    if (!isConditionActive(condition.id, ctx)) continue;

    const rule: EquippedRule = {
      conditionId: condition.id,
      actionId: action.id,
      ...(raw.targetStanceId ? { targetStanceId: raw.targetStanceId } : {}),
    };
    claimed[action.channel] = { rule, action, condition };
  }

  derived.movementAction = claimed.MOVEMENT?.action.id ?? null;
  derived.targetingAction = claimed.TARGETING?.action.id ?? null;
  derived.oocMaintenanceAction = claimed.OOC_MAINTENANCE?.action.id ?? null;
  derived.resourceMaintenanceAction =
    claimed.RESOURCE_MAINTENANCE?.action.id ?? null;
  derived.globalStrategyAction = claimed.GLOBAL_STRATEGY?.action.id ?? null;
  derived.pathSafetyAction = claimed.PATH_SAFETY?.action.id ?? null;
  derived.approachStyleAction = claimed.APPROACH_STYLE?.action.id ?? null;
  derived.travelPathingAction = claimed.TRAVEL_PATHING?.action.id ?? null;
  derived.travelResponseAction = claimed.TRAVEL_RESPONSE?.action.id ?? null;
  derived.controlAction = claimed.CONTROL?.action.id ?? null;
  derived.techniqueAction = claimed.TECHNIQUE?.action.id ?? null;
  derived.technique2Action = claimed.TECHNIQUE_2?.action.id ?? null;
  derived.guardAction = claimed.GUARD?.action.id ?? null;
  derived.guard2Action = claimed.GUARD_2?.action.id ?? null;
  derived.stanceAction = claimed.STANCE?.action.id ?? null;
  derived.stanceTargetId = claimed.STANCE?.rule.targetStanceId ?? null;

  switch (derived.movementAction) {
    case "flee":
      derived.fleeRequested = true;
      break;
    case "orbit":
      derived.orbit = true;
      break;
    case "step-back":
      derived.evadeTelegraph = true;
      break;
    case "follow-and-assist":
      derived.followLeader = true;
      derived.config.focusLeaderTarget = true;
      break;
    default:
      break;
  }

  switch (derived.targetingAction) {
    case "focus-lowest-hp":
      derived.config.priorityMode = "lowest-hp";
      break;
    case "focus-highest-max-hp":
      derived.config.priorityMode = "highest-max-hp";
      break;
    case "let-dots-finish":
      derived.letDotsFinish = true;
      derived.config.priorityMode = "nearest";
      break;
    case "spread-dots":
      derived.spreadDots = true;
      derived.config.priorityMode = "nearest";
      break;
    case "focus-elites":
      // Elites first, ties broken by proximity: keep the nearest distance weighting
      // but route through the scored path (not strict-nearest) so the elite bonus applies.
      derived.focusElites = true;
      derived.config.priorityMode = "nearest";
      break;
    case "focus-closest":
    default:
      derived.config.priorityMode = "nearest";
      break;
  }

  if (derived.oocMaintenanceAction === "wait-for-regen") {
    derived.waitForRegen = true;
  }
  if (derived.resourceMaintenanceAction === "tactical-reload") {
    derived.tacticalReload = true;
  }
  if (derived.oocMaintenanceAction === "wait-for-execution") {
    derived.waitForExecution = true;
  }
  if (
    derived.globalStrategyAction === "auto-path-enemy" ||
    (derived.globalStrategyAction === "lead-the-way" && !ctx.inCombat)
  ) {
    derived.autoPathEnemy = true;
    derived.config.acquireRadius = RUNE_NODE_ACQUIRE_RADIUS;
  }
  if (derived.globalStrategyAction === "lead-the-way") {
    derived.leadTheWay = true;
  }
  if (derived.pathSafetyAction === "avoid-hazards") {
    derived.avoidHazards = true;
  }
  if (derived.approachStyleAction === "careful-pulling") {
    derived.carefulPulling = true;
  }
  if (derived.travelPathingAction === "avoid-enemies") {
    derived.avoidEnemies = true;
  }
  if (derived.travelResponseAction === "fight-back") {
    derived.fightBackWhileTraveling = true;
  }
  if (derived.controlAction === "taunt-current-target") {
    derived.tauntCurrentTarget = true;
  }
  if (derived.techniqueAction === "fire-technique") {
    derived.fireTechnique = true;
  }
  if (derived.technique2Action === "fire-technique-2") {
    derived.fireTechnique2 = true;
  }
  if (derived.guardAction === "fire-guard") {
    derived.fireGuard = true;
  }
  if (derived.guard2Action === "fire-guard-2") {
    derived.fireGuard2 = true;
  }
  if (derived.stanceAction === "switch-stance") {
    derived.switchStance = true;
  }

  return derived;
}
