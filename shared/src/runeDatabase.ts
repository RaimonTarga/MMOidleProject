/**
 * Rune system catalog + pure arbitration fold.
 *
 * A rune is a player-authored rule: `<condition> -> <action>`. Rules are
 * evaluated from top to bottom every tick. The first active rule in each channel
 * claims that channel; later active rules in the same channel are ignored for
 * that pass. OOC maintenance is the narrow exception: distinct maintenance
 * predicates compose, while priority still chooses the first rule for each action.
 */
import type { AutocombatConfig } from "./components/core/networkedSlices";
import type { CombatArchetype } from "./types/combat";

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
  /** Conduit only: where the formation stands, independent of the owner's movement. */
  | "FORMATION";

export type RuneConditionId =
  | "always"
  | "in-combat"
  | "when-idle"
  | "hp-below-25"
  | "hp-above-90"
  | "target-hp-below-25"
  | "has-debuff"
  | "in-party"
  // Active while the player is stunned, locked down, frozen or rooted. The
  // natural wiring for Break Free, which acts through hard control.
  | "controlled"
  // Active while a MELEE enemy targeting you is close enough to hit you. The
  // natural wiring for Disengage, and for peeling an attacker with control.
  | "enemy-contact"
  // Active only while the player is standing inside a visible, unresolved
  // hostile ground telegraph. Being safely outside the damage region does not
  // satisfy this condition.
  | "inside-telegraph"
  // Reactive telegraph hook: active while an enemy attacking you is charging a
  // cast-time attack (e.g. the Ridge Archer's Power Shot). Pairs with Fire Guard
  // for read-and-react defense.
  | "target-casting"
  // Active while your NEXT attack is empowered (the finisher / execution / discharge
  // is armed and waiting to land). Class-agnostic: it reads the shared empowered flag,
  // so it fires for cadence (finisher armed), cooldown (execution ready), and energy
  // (energy maxed). Inert for classes with no empowered attack (DoT/reload/summoner
  // baseline).
  | "before-empowered"
  // Active while your current attack target is an ELITE. Lets two equipped
  // Techniques specialise against the same enemy — e.g. Cull to kill
  // the elite faster vs. Stunning Strike to control it (abilities evolution §9).
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
  // Summoner only: at most half of your formation is standing (living summons in
  // your node). Inert for every other archetype. Pairs with Flee so a Conduit whose
  // summons are dying faster than they reform backs off to rebuild.
  | "formation-broken"
  // Active while the enemy you are attacking is behind an absorb barrier — a boss
  // plate, an Escape Guard, an Ice Armor. The natural wiring for a burst Technique.
  | "target-shielded"
  // Active while a boss fighting you is getting away or coming for you unseen: a
  // flee, a travelling burrow, a dash. The natural wiring for a root or stun.
  | "target-escaping"
  // Active while you carry three or more DIFFERENT harmful debuffs — the moment a
  // Cleanse buys the most (Trench Devour counts every distinct debuff).
  | "debuff-pile"
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
  | "wait-for-summons"
  | "recall-summons"
  | "wait-for-regen"
  | "wait-it-out"
  | "auto-path-enemy"
  | "avoid-hazards"
  | "careful-pulling"
  | "avoid-enemies"
  | "fight-back"
  | "lead-the-way"
  | "taunt-current-target";

export interface ConditionDef {
  id: RuneConditionId;
  name: string;
  blurb: string;
  tier: number;
  kind: "state";
}

export interface ActionDef {
  id: RuneActionId;
  name: string;
  blurb: string;
  tier: number;
  channel: RuneChannel;
  allowedConditionIds?: readonly RuneConditionId[];
  requiredArchetype?: Exclude<CombatArchetype, null>;
}

/** An assembled rule: one condition wired to one action. Ordered by priority. */
export interface EquippedRule {
  conditionId: string;
  actionId: string;
  waitOutMode?: "all" | "heat-managed";
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
  "FORMATION",
];

const COMBAT_CONDITIONS: readonly RuneConditionId[] = [
  "in-combat",
  "hp-below-25",
  "has-debuff",
  "n-aggro-3",
  "formation-broken",
  // `Enemy Shielded -> Flee` is how a build takes the breather an armoured boss
  // offers (Tundra T4 Ice Armor) instead of bursting the shell.
  "target-shielded",
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

/** Status maintenance mirrors Recover First's idle/immediate-disengage modes. */
const WAIT_IT_OUT_CONDITIONS: readonly RuneConditionId[] = [
  "always",
  "when-idle",
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

export const CONDITION_DATABASE = new Map<string, ConditionDef>([
  [
    "always",
    {
      id: "always",
      name: "Always",
      blurb: "Works whenever the response can run.",
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
      tier: 1,
      kind: "state",
    },
  ],
  [
    "controlled",
    {
      id: "controlled",
      name: "When Controlled",
      blurb: "Works while you are stunned, locked down, frozen or rooted.",
      tier: 1,
      kind: "state",
    },
  ],
  [
    "enemy-contact",
    {
      id: "enemy-contact",
      name: "Enemy in Contact",
      blurb: "Works while a melee enemy targeting you is close enough to hit you.",
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
      tier: 1,
      kind: "state",
    },
  ],
  [
    "formation-broken",
    {
      id: "formation-broken",
      name: "Formation Broken",
      blurb: "Summoner only: works while half or fewer of your summons are standing.",
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
      tier: 2,
      kind: "state",
    },
  ],
  [
    "target-shielded",
    {
      id: "target-shielded",
      name: "Enemy Shielded",
      blurb: "Works while the enemy you are attacking is behind a barrier that absorbs damage.",
      tier: 2,
      kind: "state",
    },
  ],
  [
    "target-escaping",
    {
      id: "target-escaping",
      name: "Enemy Escaping",
      blurb: "Works while a boss fighting you is fleeing, dashing away, or travelling toward you underground.",
      tier: 2,
      kind: "state",
    },
  ],
  [
    "debuff-pile",
    {
      id: "debuff-pile",
      name: "Debuff Pile",
      blurb: "Works while you carry three or more different harmful debuffs.",
      tier: 3,
      kind: "state",
    },
  ],
  [
    "before-empowered",
    {
      id: "before-empowered",
      name: "Empowered Ready",
      // Tier is a PLACEHOLDER — user balance pass.
      blurb:
        "Works the instant your next attack becomes empowered — a finisher, execution, or full-energy discharge that is armed and waiting to land.",
      tier: 2,
      kind: "state",
    },
  ],
  [
    "target-elite",
    {
      id: "target-elite",
      name: "Elite Target",
      // Tier is a PLACEHOLDER — user balance pass.
      blurb:
        "Works while the enemy you are attacking is an elite — the high-value target worth spending a specialised ability on.",
      tier: 2,
      kind: "state",
    },
  ],
  [
    "target-max-stacks",
    {
      id: "target-max-stacks",
      name: "Fully Afflicted",
      // Tier is a PLACEHOLDER — user balance pass.
      blurb:
        "Works while your damage over time on the target has stacked as high as it goes — the moment there is most to spread, and most to detonate.",
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
      blurb: "Pause to refill your clip. Always holds as soon as combat disengages; Out of Combat waits for the combat grace period to expire.",
      tier: 1,
      channel: "RESOURCE_MAINTENANCE",
      allowedConditionIds: RECOVER_FIRST_CONDITIONS,
      requiredArchetype: "reload",
    },
  ],
  [
    "wait-for-execution",
    {
      id: "wait-for-execution",
      name: "Ready Execution",
      blurb: "Wait until your execution is ready. Always holds as soon as combat disengages; Out of Combat waits for the combat grace period to expire.",
      tier: 1,
      channel: "OOC_MAINTENANCE",
      allowedConditionIds: RECOVER_FIRST_CONDITIONS,
      requiredArchetype: "cooldown",
    },
  ],
  [
    "wait-for-summons",
    {
      id: "wait-for-summons",
      name: "Rebuild Formation",
      blurb: "Wait until every missing summon is reconstructed, without waiting for full summon HP. Always holds as soon as combat disengages; Out of Combat waits for the combat grace period to expire.",
      tier: 1,
      channel: "OOC_MAINTENANCE",
      allowedConditionIds: WAIT_IT_OUT_CONDITIONS,
      requiredArchetype: "summoner",
    },
  ],
  [
    "wait-for-regen",
    {
      id: "wait-for-regen",
      name: "Recover First",
      blurb:
        "Hold position until HP is full instead of moving on. With Always, it holds as soon as nothing is attacking you, without waiting for combat to time out.",
      tier: 1,
      channel: "OOC_MAINTENANCE",
      allowedConditionIds: RECOVER_FIRST_CONDITIONS,
    },
  ],
  [
    "wait-it-out",
    {
      id: "wait-it-out",
      name: "Wait It Out",
      blurb:
        "Hold position until temporary harmful effects fade. With Always, it holds as soon as nothing is attacking you, without waiting for combat to time out.",
      tier: 1,
      channel: "OOC_MAINTENANCE",
      allowedConditionIds: WAIT_IT_OUT_CONDITIONS,
    },
  ],
  [
    "auto-path-enemy",
    {
      id: "auto-path-enemy",
      name: "Find Enemies",
      blurb: "When idle, path to the nearest valid enemy in this node.",
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
      tier: 1,
      channel: "CONTROL",
      allowedConditionIds: CONTROL_CONDITIONS,
    },
  ],
  [
    "recall-summons",
    {
      id: "recall-summons",
      name: "Recall Summons",
      blurb:
        "While this situation holds, your summons drop their targets and stay at your side, then rejoin the fight when it ends.",
      tier: 1,
      channel: "FORMATION",
      allowedConditionIds: ["hp-below-25", "while-traveling", "target-casting"],
      requiredArchetype: "summoner",
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

/**
 * The fragments a character owned before crafted runes went. Ownership is now
 * {@link runeIdsForArchetype}; this set stays for the test and bot fixtures
 * that hand a character this vocabulary.
 */
export const STARTER_RUNE_IDS: string[] = Array.from(
  new Set([
    // Situations are baseline vocabulary.
    ...CONDITION_DATABASE.keys(),
    ...DEFAULT_RUNE_LOADOUT.flatMap((rule) => [rule.conditionId, rule.actionId]),
    // Party runes and basic targeting are available from the start
    "in-party",
    "lead-the-way",
    "follow-and-assist",
    "taunt-current-target",
    "focus-closest",
    // Reactive "enemy is charging a cast" condition — available from the start so
    // players can answer telegraphed casts once they meet a charging mob.
    "target-casting",
    // "Empowered Ready" condition.
    "before-empowered",
    // "Elite Target" condition — the situation that makes a specialised second
    // Technique worth equipping.
    "target-elite",
    // "Fully Afflicted" condition: the timing half of the Contagion/Detonate pair.
    // Inert until the player actually has a stacking DoT.
    "target-max-stacks",
    // DESIGNER CALL, 2026-08-25: default-unlocked so every character can
    // answer danger the way a human does -- recover before pulling again, and
    // retreat when a fight has gone bad.
    "wait-for-regen",
    "wait-it-out",
    // Class maintenance is baseline vocabulary, filtered by requiredArchetype.
    "tactical-reload",
    "wait-for-execution",
    "wait-for-summons",
    "recall-summons",
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
    ...(rule.waitOutMode !== undefined ? { waitOutMode: rule.waitOutMode } : {}),
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
 * The rune fragments a character owns: every rune its class may use. Runes are
 * free standing orders (rules cost nothing), so ownership is every condition
 * and every action that names no class or names this one (`requiredArchetype`).
 */
export function runeIdsForArchetype(combatArchetype: CombatArchetype | undefined): string[] {
  return ALL_RUNE_IDS.filter((id) => {
    const required = ACTION_DATABASE.get(id)?.requiredArchetype;
    return required === undefined || required === combatArchetype;
  });
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
    case "FORMATION":
      return "Formation";
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

/**
 * Class-specific addenda to a response's blurb, shown only to that class. The
 * rule itself is shared; this says what it means for this class's body.
 */
const RUNE_ARCHETYPE_NOTES: Partial<Record<Exclude<CombatArchetype, null>, Partial<Record<RuneActionId, string>>>> = {
  summoner: {
    "taunt-current-target":
      "Conduit: your summons taunt for you. A summon's hit pulls its target onto that summon.",
    "step-back": "Conduit: your summons step out of telegraphs too.",
  },
};

export function runeActionArchetypeNote(
  actionId: string,
  combatArchetype: CombatArchetype | undefined,
): string | null {
  if (!combatArchetype) return null;
  return RUNE_ARCHETYPE_NOTES[combatArchetype]?.[actionId as RuneActionId] ?? null;
}

export function isRuneRuleCompatibleForArchetype(
  rule: EquippedRule,
  combatArchetype: CombatArchetype | undefined,
): boolean {
  const condition = CONDITION_DATABASE.get(rule.conditionId);
  const action = ACTION_DATABASE.get(rule.actionId);
  if (!condition || !action) return false;
  if (rule.waitOutMode !== undefined && (rule.actionId !== "wait-it-out" ||
      !["all", "heat-managed"].includes(rule.waitOutMode) ||
      (rule.waitOutMode === "heat-managed" && rule.conditionId !== "always"))) return false;
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
  combatArchetype?: CombatArchetype,
): EquippedRule[] {
  const sanitized: EquippedRule[] = [];
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
    sanitized.push({
      conditionId: raw.conditionId,
      actionId: raw.actionId,
      ...(raw.waitOutMode !== undefined ? { waitOutMode: raw.waitOutMode } : {}),
    });
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

/** Distinct recovery predicates are cumulative rather than mutually exclusive. */
function runeActionsCompose(
  left: ActionDef | undefined,
  right: ActionDef | undefined,
): boolean {
  if (!left || !right) return false;
  return (
    left.channel === "OOC_MAINTENANCE" &&
    right.channel === "OOC_MAINTENANCE" &&
    left.id !== right.id
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
      } else if (runeActionsCompose(earlierAction, action)) {
        continue;
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
    return existing?.channel === action.channel &&
      !runeActionsCompose(existing, action) &&
      rule.conditionId === added.conditionId;
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
    ruleKey("when-idle", "wait-it-out"),
    {
      name: "Wait It Out",
      blurb: "After combat, wait for temporary harmful effects to fade before moving on.",
    },
  ],
  [
    ruleKey("always", "wait-it-out"),
    {
      name: "Patient Recovery",
      blurb:
        "Whenever nothing is attacking you, wait for temporary harmful effects to fade before looking for the next enemy.",
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
  /** Summoner with at most half its target summon count alive in its node. */
  formationBroken?: boolean;
  inParty: boolean;
  aggroCount: number;
  combatArchetype?: CombatArchetype;
  /** Player currently has a harmful debuff or DoT. */
  debuffed?: boolean;
  /** Player is hard-controlled (stun, lockdown, frozen) or rooted. */
  controlled?: boolean;
  /** A melee enemy aggroed onto the player is within its own reach of them. */
  enemyInContact?: boolean;
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
  /** The current attack target is behind a live absorb barrier. */
  targetShielded?: boolean;
  /** A boss fighting this player is fleeing, dashing, or travelling underground. */
  targetEscaping?: boolean;
  /** Distinct harmful debuffs the player carries. */
  debuffCount?: number;
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
  /** Every active OOC predicate; unlike exclusive channels these compose by action. */
  oocMaintenanceClaims: ClaimedRuneAction[];
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
  fleeRequested: boolean;
  orbit: boolean;
  evadeTelegraph: boolean;
  autoPathEnemy: boolean;
  avoidHazards: boolean;
  carefulPulling: boolean;
  avoidEnemies: boolean;
  fightBackWhileTraveling: boolean;
  waitForRegen: boolean;
  waitItOut: boolean;
  tacticalReload: boolean;
  waitForExecution: boolean;
  waitForSummons: boolean;
  followLeader: boolean;
  leadTheWay: boolean;
  tauntCurrentTarget: boolean;
  recallSummons: boolean;
  letDotsFinish: boolean;
  spreadDots: boolean;
  /** A `focus-elites` rule is active this tick — prioritize elite-tagged enemies. */
  focusElites: boolean;
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
    FORMATION: null,
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
    case "controlled":
      return ctx.controlled ?? false;
    case "enemy-contact":
      return ctx.enemyInContact ?? false;
    case "in-party":
      return ctx.inParty;
    case "inside-telegraph":
      return ctx.insideDangerousTelegraph ?? false;
    case "n-aggro-3":
      return ctx.aggroCount >= 3;
    case "formation-broken":
      return ctx.formationBroken ?? false;
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
    case "target-shielded":
      return ctx.targetShielded ?? false;
    case "target-escaping":
      return ctx.targetEscaping ?? false;
    case "debuff-pile":
      return (ctx.debuffCount ?? 0) >= 3;
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
    oocMaintenanceClaims: [],
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
    fleeRequested: false,
    orbit: false,
    evadeTelegraph: false,
    autoPathEnemy: false,
    avoidHazards: false,
    carefulPulling: false,
    avoidEnemies: false,
    fightBackWhileTraveling: false,
    waitForRegen: false,
    waitItOut: false,
    tacticalReload: false,
    waitForExecution: false,
    waitForSummons: false,
    followLeader: false,
    leadTheWay: false,
    tauntCurrentTarget: false,
    recallSummons: false,
    letDotsFinish: false,
    spreadDots: false,
    focusElites: false,
  };

  const engaged = ctx.activelyEngaged ?? ctx.inCombat;

  for (const raw of normalizeRuneLoadout(equipped)) {
    const condition = CONDITION_DATABASE.get(raw.conditionId);
    const action = ACTION_DATABASE.get(raw.actionId);
    if (!condition || !action) continue;
    if (!isRuneRuleCompatibleForArchetype(raw, ctx.combatArchetype)) continue;
    // "Always" recovery predicates may activate while the combat timer is still
    // running. They self-gate on actual engagement, so they stop the player from
    // seeking the next enemy only after nothing is attacking them.
    const holdsWhileDisengaged =
      (action.channel === "OOC_MAINTENANCE" || action.channel === "RESOURCE_MAINTENANCE") &&
      condition.id === "always" && !engaged;
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
    if (!isConditionActive(condition.id, ctx)) continue;

    const rule: EquippedRule = {
      conditionId: condition.id,
      actionId: action.id,
      ...(raw.waitOutMode !== undefined ? { waitOutMode: raw.waitOutMode } : {}),
    };
    const claim = { rule, action, condition };
    if (action.channel === "OOC_MAINTENANCE") {
      // Each distinct maintenance action is a predicate that can hold movement.
      // Preserve priority within one action, but let Recover First, Wait It Out,
      // and Ready Execution all contribute independently.
      if (derived.oocMaintenanceClaims.some((entry) => entry.action.id === action.id)) continue;
      derived.oocMaintenanceClaims.push(claim);
      claimed.OOC_MAINTENANCE ??= claim;
      continue;
    }
    if (claimed[action.channel]) continue;
    claimed[action.channel] = claim;
  }

  derived.movementAction = claimed.MOVEMENT?.action.id ?? null;
  derived.targetingAction = claimed.TARGETING?.action.id ?? null;
  derived.oocMaintenanceAction = claimed.OOC_MAINTENANCE?.action.id ?? null;
  const oocMaintenanceActions = new Set(
    derived.oocMaintenanceClaims.map((claim) => claim.action.id),
  );
  derived.resourceMaintenanceAction =
    claimed.RESOURCE_MAINTENANCE?.action.id ?? null;
  derived.globalStrategyAction = claimed.GLOBAL_STRATEGY?.action.id ?? null;
  derived.pathSafetyAction = claimed.PATH_SAFETY?.action.id ?? null;
  derived.approachStyleAction = claimed.APPROACH_STYLE?.action.id ?? null;
  derived.travelPathingAction = claimed.TRAVEL_PATHING?.action.id ?? null;
  derived.travelResponseAction = claimed.TRAVEL_RESPONSE?.action.id ?? null;
  derived.controlAction = claimed.CONTROL?.action.id ?? null;
  derived.recallSummons = claimed.FORMATION?.action.id === "recall-summons";

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

  if (oocMaintenanceActions.has("wait-for-regen")) {
    derived.waitForRegen = true;
  }
  if (oocMaintenanceActions.has("wait-it-out")) {
    derived.waitItOut = true;
  }
  if (derived.resourceMaintenanceAction === "tactical-reload") {
    derived.tacticalReload = true;
  }
  if (oocMaintenanceActions.has("wait-for-summons")) {
    derived.waitForSummons = true;
  }
  if (oocMaintenanceActions.has("wait-for-execution")) {
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
  return derived;
}


/** Preserve priority when editing; same-condition/channel collisions replace explicitly. */
export function composeRuneEdit(rules: readonly EquippedRule[], rule: EquippedRule, index: number | null): EquippedRule[] {
  const action = ACTION_DATABASE.get(rule.actionId);
  const channel = action?.channel;
  const collision = rules.findIndex((r, i) => {
    if (i === index) return false;
    const existing = ACTION_DATABASE.get(r.actionId);
    return existing?.channel === channel &&
      (!action || !runeActionsCompose(existing, action)) &&
      r.conditionId === rule.conditionId;
  });
  const anchor = collision >= 0 ? collision : index ?? rules.length;
  const result: EquippedRule[] = [];
  rules.forEach((r, i) => { if (i === anchor) result.push(rule); if (i !== index && i !== collision) result.push(r); });
  if (anchor === rules.length) result.push(rule);
  return result;
}
