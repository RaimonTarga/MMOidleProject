/**
 * Rune system — catalog + pure fold (MVP).
 *
 * A rune is a `<condition> → <action>` rule. The player owns *fragments*
 * (conditions and actions) and wires them into rules. With zero rules the AI
 * runs a deliberately dumb baseline ({@link BASELINE_RUNE_CONFIG}); every
 * smarter behavior is a rule the player assembles.
 *
 * This MVP ships 3 conditions × 3 actions with no budget, charge, flaws, or
 * acquisition gating — see `.cursor/design/runes.md` for the full design.
 */
import type { AutocombatConfig } from "./components/core/networkedSlices";

/** Arbitration priority tier (in-game flavor name). Highest → lowest. */
export type RuneCategory = "instinct" | "linking" | "wayfinding" | "targeting";

/** The AI control resource an action writes. */
export type RuneChannel = "move" | "target" | "config" | "oneshot";

/** A condition fragment — for the MVP every condition is a live-evaluated state. */
export interface ConditionDef {
  id: string;
  name: string;
  blurb: string;
  kind: "state";
}

/** An action fragment. */
export interface ActionDef {
  id: string;
  name: string;
  blurb: string;
  category: RuneCategory;
  channel: RuneChannel;
}

/** An assembled rule: one condition wired to one action. Ordered in loadout. */
export interface EquippedRule {
  conditionId: string;
  actionId: string;
}

export const CONDITION_DATABASE = new Map<string, ConditionDef>([
  [
    "when-idle",
    {
      id: "when-idle",
      name: "Idle",
      blurb: "True while you are out of combat.",
      kind: "state",
    },
  ],
  [
    "low-hp",
    {
      id: "low-hp",
      name: "Hurt",
      blurb: "True while your health is at or under 25%.",
      kind: "state",
    },
  ],
  [
    "in-combat",
    {
      id: "in-combat",
      name: "Fighting",
      blurb: "True while you are actively fighting.",
      kind: "state",
    },
  ],
]);

export const ACTION_DATABASE = new Map<string, ActionDef>([
  [
    "flee",
    {
      id: "flee",
      name: "Flee",
      blurb: "Retreat from the fight when triggered.",
      category: "instinct",
      channel: "move",
    },
  ],
  [
    "keep-distance",
    {
      id: "keep-distance",
      name: "Keep Distance",
      blurb: "Keep targets at the edge of your range.",
      category: "targeting",
      channel: "config",
    },
  ],
  [
    "explore",
    {
      id: "explore",
      name: "Explore",
      blurb: "Auto-traverse: finish the biome and move on.",
      category: "wayfinding",
      channel: "move",
    },
  ],
]);

/** Every fragment id (conditions + actions) — granted whole in the MVP. */
export const ALL_RUNE_IDS: string[] = [
  ...CONDITION_DATABASE.keys(),
  ...ACTION_DATABASE.keys(),
];

/** A named (condition, action) pairing — surfaced as a UI hint. */
export interface NamedRule {
  name: string;
  blurb: string;
}

/** Key helper for {@link NAMED_RULES}. */
function ruleKey(conditionId: string, actionId: string): string {
  return `${conditionId}:${actionId}`;
}

/** All 9 condition × action pairings, named for the UI. */
export const NAMED_RULES = new Map<string, NamedRule>([
  [
    ruleKey("when-idle", "flee"),
    {
      name: "Pacer",
      blurb:
        "With nothing to fight, the flee routine walks you to the nearest gate, hops to the next node, and back — pacing forever. Near-nonsense, but harmless.",
    },
  ],
  [
    ruleKey("when-idle", "keep-distance"),
    {
      name: "Skittish",
      blurb:
        "Out of combat you hold position until an enemy wanders into your personal space, then step directly away. Keeps roaming threats at arm\u2019s length without engaging.",
    },
  ],
  [
    ruleKey("when-idle", "explore"),
    {
      name: "Explorer",
      blurb:
        "Whenever you are out of combat, auto-traverse the biome and move on. The clean, intended exploration build.",
    },
  ],
  [
    ruleKey("low-hp", "flee"),
    {
      name: "Survivor",
      blurb:
        "At or below 25% HP, retreat from the fight. The classic safety net.",
    },
  ],
  [
    ruleKey("low-hp", "keep-distance"),
    {
      name: "Desperate Kiter",
      blurb:
        "Below 25% HP you start kiting — back-pedal while firing. Buys a ranged build survival; melee just holds the edge of range.",
    },
  ],
  [
    ruleKey("low-hp", "explore"),
    {
      name: "Flight Forward",
      blurb:
        "When hurt, head for the next node instead of fighting. Sometimes an escape, sometimes it walks you deeper into danger — reckless.",
    },
  ],
  [
    ruleKey("in-combat", "flee"),
    {
      name: "Coward",
      blurb:
        "Bolt the instant a fight starts; you never trade a single hit. A pure comedy/trap build.",
    },
  ],
  [
    ruleKey("in-combat", "keep-distance"),
    {
      name: "Kiter",
      blurb:
        "While fighting, hold a standoff gap and attack from range. The headline use of keep-distance, now available to any archetype.",
    },
  ],
  [
    ruleKey("in-combat", "explore"),
    {
      name: "Tourist",
      blurb:
        "The moment combat begins you travel to the next node; leaving ends combat, so you stutter between bumping into fights and wandering off. Never commits.",
    },
  ],
]);

/** Resolve the named pairing for a (condition, action), or null if unnamed. */
export function getRuleName(
  conditionId: string,
  actionId: string,
): NamedRule | null {
  return NAMED_RULES.get(ruleKey(conditionId, actionId)) ?? null;
}

/**
 * The dumb baseline the AI runs with zero rules equipped: hit the nearest
 * thing within {@link BASELINE_ACQUIRE_RADIUS}, never flee, ignore the party.
 * With nothing in range the selector returns idle and the player walks to the
 * nearest engageable mob on the node.
 */
export const BASELINE_ACQUIRE_RADIUS = 600;

export const BASELINE_RUNE_CONFIG: AutocombatConfig = {
  priorityMode: "nearest",
  fleeWhenLow: false,
  fleeHpPct: 0.25,
  acquireRadius: BASELINE_ACQUIRE_RADIUS,
  focusLeaderTarget: false,
  engageUltimateBosses: false,
};

/** Live per-tick context the conditions are evaluated against. */
export interface RuneContext {
  hpPct: number;
  inCombat: boolean;
}

/** The folded result of an equipped loadout for one tick. */
export interface DerivedRuneConfig {
  /** Baseline + any config-channel overrides (last-writer-wins by loadout order). */
  config: AutocombatConfig;
  /** `explore` action active. */
  autoTraverse: boolean;
  /** `flee` action active. */
  fleeRequested: boolean;
  /** `keep-distance` action active. */
  keepDistance: boolean;
}

function isConditionActive(conditionId: string, ctx: RuneContext): boolean {
  switch (conditionId) {
    case "when-idle":
      return !ctx.inCombat;
    case "low-hp":
      return ctx.hpPct <= 0.25;
    case "in-combat":
      return ctx.inCombat;
    default:
      return false;
  }
}

/**
 * Fold an equipped loadout into a derived AI config for the current tick.
 *
 * Starts from {@link BASELINE_RUNE_CONFIG} with all flags off, then iterates the
 * rules in loadout order: each rule whose condition holds applies its action.
 * The `config` object is written generically (last-writer-wins by loadout
 * order) so future config-channel actions slot in — the current three actions
 * only set the flags / autoTraverse.
 */
export function deriveAutoConfigFromRunes(
  equipped: EquippedRule[],
  ctx: RuneContext,
): DerivedRuneConfig {
  const derived: DerivedRuneConfig = {
    config: { ...BASELINE_RUNE_CONFIG },
    autoTraverse: false,
    fleeRequested: false,
    keepDistance: false,
  };

  for (const rule of equipped) {
    if (!isConditionActive(rule.conditionId, ctx)) continue;
    switch (rule.actionId) {
      case "flee":
        derived.fleeRequested = true;
        break;
      case "keep-distance":
        derived.keepDistance = true;
        break;
      case "explore":
        derived.autoTraverse = true;
        break;
      default:
        break;
    }
  }

  return derived;
}
