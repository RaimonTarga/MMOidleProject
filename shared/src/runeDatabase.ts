/**
 * Rune system catalog + pure arbitration fold.
 *
 * A rune is a player-authored rule: `<condition> -> <action>`. Rules are
 * evaluated from top to bottom every tick. The first active rule in each channel
 * claims that channel; later active rules in the same channel are ignored for
 * that pass.
 */
import type { AutocombatConfig } from "./components/core/networkedSlices";

export type RuneChannel =
  | "MOVEMENT"
  | "TARGETING"
  | "OOC_MAINTENANCE"
  | "GLOBAL_STRATEGY";

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
  | "focus-shielded"
  | "tactical-reload"
  | "wait-for-regen"
  | "auto-path-enemy"
  | "lead-the-way";

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
  "GLOBAL_STRATEGY",
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
    "focus-shielded",
    {
      id: "focus-shielded",
      name: "Focus Shielded",
      blurb: "Prefer enemies with active mitigation layers. Placeholder for shield tags.",
      cost: 2,
      tier: 4,
      channel: "TARGETING",
      allowedConditionIds: TARGETING_CONDITIONS,
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
      channel: "OOC_MAINTENANCE",
      allowedConditionIds: RECOVERY_CONDITIONS,
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
]);

/** Every fragment id (conditions + actions). Granted whole until acquisition ships. */
export const ALL_RUNE_IDS: string[] = [
  ...CONDITION_DATABASE.keys(),
  ...ACTION_DATABASE.keys(),
];

export const DEFAULT_RUNE_LOADOUT: EquippedRule[] = [
  { conditionId: "when-idle", actionId: "tactical-reload" },
  { conditionId: "in-party", actionId: "follow-and-assist" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
  { conditionId: "in-combat", actionId: "focus-closest" },
  { conditionId: "always", actionId: "auto-path-enemy" },
];

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

/** Tuned for the mutable starter loadout; adjust after playtest. */
export function runeBudgetForTier(playerTier: number): number {
  return 8 + Math.max(0, playerTier) * 2;
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
    case "GLOBAL_STRATEGY":
      return "Search";
  }
}

export function isRuneRuleKnown(rule: EquippedRule): boolean {
  return (
    CONDITION_DATABASE.has(rule.conditionId) &&
    ACTION_DATABASE.has(rule.actionId)
  );
}

export function isRuneRuleCompatible(rule: EquippedRule): boolean {
  const condition = CONDITION_DATABASE.get(rule.conditionId);
  const action = ACTION_DATABASE.get(rule.actionId);
  if (!condition || !action) return false;
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
): EquippedRule[] {
  const sanitized: EquippedRule[] = [];
  let spent = 0;
  for (const raw of normalizeRuneLoadout(rules)) {
    if (
      !raw ||
      typeof raw.conditionId !== "string" ||
      typeof raw.actionId !== "string" ||
      !isRuneRuleKnown(raw) ||
      !isRuneRuleCompatible(raw) ||
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
  globalStrategyAction: RuneActionId | null;
  fleeRequested: boolean;
  orbit: boolean;
  autoPathEnemy: boolean;
  waitForRegen: boolean;
  tacticalReload: boolean;
  followLeader: boolean;
  leadTheWay: boolean;
}

function emptyClaims(): ClaimedRuneChannels {
  return {
    MOVEMENT: null,
    TARGETING: null,
    OOC_MAINTENANCE: null,
    GLOBAL_STRATEGY: null,
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
    globalStrategyAction: null,
    fleeRequested: false,
    orbit: false,
    autoPathEnemy: false,
    waitForRegen: false,
    tacticalReload: false,
    followLeader: false,
    leadTheWay: false,
  };

  for (const raw of normalizeRuneLoadout(equipped)) {
    const condition = CONDITION_DATABASE.get(raw.conditionId);
    const action = ACTION_DATABASE.get(raw.actionId);
    if (!condition || !action) continue;
    if (!isRuneRuleCompatible(raw)) continue;
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
  derived.globalStrategyAction = claimed.GLOBAL_STRATEGY?.action.id ?? null;

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
      derived.config.priorityMode = "damage";
      break;
    case "focus-shielded":
      derived.config.priorityMode = "threat";
      break;
    case "focus-closest":
    default:
      derived.config.priorityMode = "nearest";
      break;
  }

  if (derived.oocMaintenanceAction === "wait-for-regen") {
    derived.waitForRegen = true;
  }
  if (derived.oocMaintenanceAction === "tactical-reload") {
    derived.tacticalReload = true;
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

  return derived;
}
