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

export type RuneChannel =
  | "MOVEMENT"
  | "TARGETING"
  | "OOC_MAINTENANCE"
  | "RESOURCE_MAINTENANCE"
  | "GLOBAL_STRATEGY"
  | "CONTROL"
  // System rework Step 7: each ability slot gets its own channel so a Technique
  // override and a Guard override (and taunt in CONTROL) can be equipped at once.
  | "TECHNIQUE"
  | "GUARD"
  // System rework Step 10: the stance-switch action gets its own single-claim
  // channel so it coexists with technique/guard overrides and a control taunt.
  | "STANCE";

export type RuneConditionId =
  | "always"
  | "in-combat"
  | "when-idle"
  | "hp-below-25"
  | "in-party"
  // Future telegraph hook. Keep out of CONDITION_DATABASE until casts are live.
  // | "target-casting"
  | "n-aggro-3";

export type RuneActionId =
  | "chase-enemy"
  | "flee"
  | "orbit"
  | "step-back"
  | "follow-and-assist"
  | "focus-closest"
  | "focus-lowest-hp"
  | "let-dots-finish"
  | "spread-dots"
  | "focus-elites"
  | "tactical-reload"
  | "wait-for-execution"
  | "wait-for-regen"
  | "auto-path-enemy"
  | "lead-the-way"
  | "taunt-current-target"
  // System rework Step 7: override the built-in auto-fire timing of an ability.
  | "fire-technique"
  | "fire-guard"
  // System rework Step 10: auto-switch to the equipped reactive stance.
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
}

export const RUNE_CHANNELS: RuneChannel[] = [
  "MOVEMENT",
  "TARGETING",
  "OOC_MAINTENANCE",
  "RESOURCE_MAINTENANCE",
  "GLOBAL_STRATEGY",
  "CONTROL",
  "TECHNIQUE",
  "GUARD",
  "STANCE",
];

const COMBAT_CONDITIONS: readonly RuneConditionId[] = [
  "in-combat",
  "hp-below-25",
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

const STRATEGY_CONDITIONS: readonly RuneConditionId[] = [
  "always",
  "when-idle",
  "in-party",
];

const CONTROL_CONDITIONS: readonly RuneConditionId[] = [
  "in-combat",
  "in-party",
];

// System rework Step 7: conditions a player can wire to an ability-fire override.
const TECHNIQUE_CONDITIONS: readonly RuneConditionId[] = [
  "in-combat",
  "n-aggro-3",
];

const GUARD_CONDITIONS: readonly RuneConditionId[] = [
  "in-combat",
  "hp-below-25",
  "n-aggro-3",
];

// System rework Step 10: situations a player can wire to a stance auto-switch.
const STANCE_CONDITIONS: readonly RuneConditionId[] = [
  "in-combat",
  "hp-below-25",
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
      blurb: "Back out of a telegraphed danger zone. Placeholder for cast telegraphs.",
      cost: 3,
      tier: 4,
      channel: "MOVEMENT",
      allowedConditionIds: [],
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
      blurb: "Out of combat, hold position until HP is full.",
      cost: 1,
      tier: 1,
      channel: "OOC_MAINTENANCE",
      allowedConditionIds: RECOVERY_CONDITIONS,
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
    "switch-stance",
    {
      id: "switch-stance",
      name: "Switch Stance",
      blurb:
        "Switch to your reactive stance while this situation holds, reverting to your default otherwise.",
      cost: 2,
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
];

export const STARTER_RUNE_IDS: string[] = Array.from(
  new Set([
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
    // Step 10: stance auto-switch is a timing preference for stances you already
    // learned (the stance recipes are the real T2 gate). Equipping still costs RP
    // and is inert with no reactive stance equipped.
    "switch-stance",
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
export function runeBudgetForGlobalMastery(globalMastery: number): number {
  return 8 + Math.floor(Math.max(0, globalMastery) / 10);
}

export function runeRuleCost(rule: EquippedRule): number {
  const condition = CONDITION_DATABASE.get(rule.conditionId);
  const action = ACTION_DATABASE.get(rule.actionId);
  if (!condition || !action) return 0;
  return condition.cost + action.cost;
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
    case "CONTROL":
      return "Control";
    case "TECHNIQUE":
      return "Technique";
    case "GUARD":
      return "Guard";
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
    const cost = runeRuleCost(raw);
    if (spent + cost > budget) continue;
    sanitized.push({
      conditionId: raw.conditionId,
      actionId: raw.actionId,
    });
    spent += cost;
  }
  return sanitized;
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
  engageUltimateBosses: false,
};

export interface RuneContext {
  hpPct: number;
  inCombat: boolean;
  inParty: boolean;
  aggroCount: number;
  combatArchetype?: CombatArchetype;
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
  controlAction: RuneActionId | null;
  techniqueAction: RuneActionId | null;
  guardAction: RuneActionId | null;
  stanceAction: RuneActionId | null;
  fleeRequested: boolean;
  orbit: boolean;
  autoPathEnemy: boolean;
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
  /** A `fire-technique` rule's condition is active this tick (override Technique). */
  fireTechnique: boolean;
  /** A `fire-guard` rule's condition is active this tick (override Guard). */
  fireGuard: boolean;
  /** A `switch-stance` rule's condition is active this tick (use reactive stance). */
  switchStance: boolean;
}

function emptyClaims(): ClaimedRuneChannels {
  return {
    MOVEMENT: null,
    TARGETING: null,
    OOC_MAINTENANCE: null,
    RESOURCE_MAINTENANCE: null,
    GLOBAL_STRATEGY: null,
    CONTROL: null,
    TECHNIQUE: null,
    GUARD: null,
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
    case "in-party":
      return ctx.inParty;
    case "n-aggro-3":
      return ctx.aggroCount >= 3;
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
    controlAction: null,
    techniqueAction: null,
    guardAction: null,
    stanceAction: null,
    fleeRequested: false,
    orbit: false,
    autoPathEnemy: false,
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
    fireGuard: false,
    switchStance: false,
  };

  for (const raw of normalizeRuneLoadout(equipped)) {
    const condition = CONDITION_DATABASE.get(raw.conditionId);
    const action = ACTION_DATABASE.get(raw.actionId);
    if (!condition || !action) continue;
    if (!isRuneRuleCompatibleForArchetype(raw, ctx.combatArchetype)) continue;
    if (
      (action.channel === "OOC_MAINTENANCE" ||
        action.channel === "RESOURCE_MAINTENANCE") &&
      ctx.inCombat
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

    const rule = { conditionId: condition.id, actionId: action.id };
    claimed[action.channel] = { rule, action, condition };
  }

  derived.movementAction = claimed.MOVEMENT?.action.id ?? null;
  derived.targetingAction = claimed.TARGETING?.action.id ?? null;
  derived.oocMaintenanceAction = claimed.OOC_MAINTENANCE?.action.id ?? null;
  derived.resourceMaintenanceAction =
    claimed.RESOURCE_MAINTENANCE?.action.id ?? null;
  derived.globalStrategyAction = claimed.GLOBAL_STRATEGY?.action.id ?? null;
  derived.controlAction = claimed.CONTROL?.action.id ?? null;
  derived.techniqueAction = claimed.TECHNIQUE?.action.id ?? null;
  derived.guardAction = claimed.GUARD?.action.id ?? null;
  derived.stanceAction = claimed.STANCE?.action.id ?? null;

  switch (derived.movementAction) {
    case "flee":
      derived.fleeRequested = true;
      break;
    case "orbit":
      derived.orbit = true;
      break;
    case "step-back":
      // Until cast telegraphs exist, step-back uses the same steering as orbit.
      derived.orbit = true;
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
  if (derived.controlAction === "taunt-current-target") {
    derived.tauntCurrentTarget = true;
  }
  if (derived.techniqueAction === "fire-technique") {
    derived.fireTechnique = true;
  }
  if (derived.guardAction === "fire-guard") {
    derived.fireGuard = true;
  }
  if (derived.stanceAction === "switch-stance") {
    derived.switchStance = true;
  }

  return derived;
}
