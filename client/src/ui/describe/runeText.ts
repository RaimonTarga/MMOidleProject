import {
  ACTION_DATABASE,
  BASELINE_ACQUIRE_RADIUS,
  BASELINE_RUNE_CONFIG,
  CONDITION_DATABASE,
  RUNE_CAREFUL_PULLING_MAX_THREAT_RADIUS,
  RUNE_CAREFUL_PULLING_MIN_THREAT_RADIUS,
  RUNE_FLEE_GATE_CLEAR_MARGIN,
  RUNE_KEEP_DISTANCE_GAP,
  RUNE_KEEP_DISTANCE_RANGED_BUFFER,
  RUNE_NODE_ACQUIRE_RADIUS,
  runeChannelLabel,
  runeRuleCost,
  type EquippedRule,
} from '@mmo-idle/shared';
import type { DetailLine } from './index';

/**
 * Runes, in numbers.
 *
 * A rune rule is `<condition> -> <action>`, and both halves used to be pure
 * prose: "back away", "give elites a wide berth", "look further for targets".
 * The distances behind those verbs are now authored in shared (`runeTuning.ts`),
 * so a rule can state what it will actually do.
 *
 * Conditions carry their threshold in the id itself (`hp-below-25`,
 * `n-aggro-3`), which is why they are read from a table here rather than a
 * field: the authored data has no numeric slot for them, and inventing one would
 * be a data migration for something only the UI needs.
 */

const px = (value: number): string => `${Math.round(value)}px`;

/** What each condition is really testing, stated as a number where it has one. */
const CONDITION_FACTS: Record<string, DetailLine[]> = {
  'hp-below-25': [
    { key: 'threshold', label: 'Triggers at', value: '25% health or below' },
  ],
  'n-aggro-3': [
    { key: 'threshold', label: 'Triggers at', value: '3+ enemies on you' },
  ],
  'target-casting': [
    {
      key: 'window',
      label: 'Active while',
      value: 'an attacker is winding up',
      help: 'Only while an enemy that is attacking YOU is charging a cast-time attack, e.g. the Ridge Archer’s Power Shot. It goes inactive the moment that attack resolves.',
    },
  ],
  'before-empowered': [
    {
      key: 'window',
      label: 'Active while',
      value: 'your next attack is empowered',
      help: 'Reads the shared empowered flag, so it fires for a cadence finisher, a cooldown execution and a maxed energy discharge alike. Inert for classes with no empowered attack.',
    },
  ],
};

/** What each action is really doing, stated as a number where it has one. */
const ACTION_FACTS: Record<string, DetailLine[]> = {
  orbit: [
    {
      key: 'gap',
      label: 'Holds a gap of',
      value: px(RUNE_KEEP_DISTANCE_GAP),
      help: 'Edge-to-edge, not centre-to-centre. Hold position until an enemy is closer than this, then back away.',
    },
    {
      key: 'buffer',
      label: 'Past enemy reach by',
      value: px(RUNE_KEEP_DISTANCE_RANGED_BUFFER),
      help: 'When kiting, aim to stand this far outside the target’s own attack range. Only achievable while you out-range it.',
    },
  ],
  'step-back': [
    {
      key: 'gap',
      label: 'Backs off to',
      value: px(RUNE_KEEP_DISTANCE_GAP),
      help: 'Edge-to-edge gap, the same standoff Keep Distance holds.',
    },
  ],
  flee: [
    {
      key: 'margin',
      label: 'Retreats past the gate by',
      value: px(RUNE_FLEE_GATE_CLEAR_MARGIN),
      help: 'Distance from the node edge the retreat settles at before holding to heal. Any closer and the gate pulls you straight back through.',
    },
    {
      key: 'hp',
      label: 'Default flee threshold',
      value: `${Math.round(BASELINE_RUNE_CONFIG.fleeHpPct * 100)}% health`,
    },
  ],
  'careful-pulling': [
    {
      key: 'berth',
      label: 'Elite berth',
      value: `${px(RUNE_CAREFUL_PULLING_MIN_THREAT_RADIUS)}–${px(RUNE_CAREFUL_PULLING_MAX_THREAT_RADIUS)}`,
      help: 'The route bends around any elite within this radius, scaled to that elite’s leash range and clamped to this band.',
    },
  ],
  'auto-path-enemy': [
    {
      key: 'radius',
      label: 'Search radius',
      value: `${px(RUNE_NODE_ACQUIRE_RADIUS)} (whole node)`,
      help: `Without this rune you only acquire targets within ${px(BASELINE_ACQUIRE_RADIUS)}. With it, anything in the node is a valid target and you will path across it.`,
    },
  ],
  'focus-closest': [
    { key: 'radius', label: 'Default search radius', value: px(BASELINE_ACQUIRE_RADIUS) },
  ],
};

/** Everything a single fragment promises, numbers included. */
export function conditionLines(conditionId: string): DetailLine[] {
  return CONDITION_FACTS[conditionId] ?? [];
}

export function actionLines(actionId: string): DetailLine[] {
  const action = ACTION_DATABASE.get(actionId);
  const lines: DetailLine[] = [];
  if (action) {
    lines.push({
      key: 'channel',
      label: 'Channel',
      value: runeChannelLabel(action.channel),
      help: 'Rules are read top-down and the first active rule in a channel claims it. Two rules in the same channel never both fire — the lower one is a fallback.',
    });
  }
  return [...lines, ...(ACTION_FACTS[actionId] ?? [])];
}

/** Everything an assembled rule promises: its cost, its trigger, its distances. */
export function ruleLines(rule: EquippedRule): DetailLine[] {
  const lines: DetailLine[] = [{
    key: 'cost',
    label: 'Rune points',
    value: String(runeRuleCost(rule)),
    help: 'Spent from your Rune Point budget, which grows with Global Mastery.',
  }];
  const condition = CONDITION_DATABASE.get(rule.conditionId);
  const action = ACTION_DATABASE.get(rule.actionId);
  if (condition && action) {
    lines.push(...conditionLines(rule.conditionId), ...actionLines(rule.actionId));
  }
  return lines;
}

/** True when this fragment has real numbers to show, so callers can skip empties. */
export function hasRuneNumbers(id: string): boolean {
  return CONDITION_FACTS[id] !== undefined || ACTION_FACTS[id] !== undefined;
}
