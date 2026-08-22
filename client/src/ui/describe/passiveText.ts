import { mechanicLabel } from '@mmo-idle/shared';

import { STAT_HELP } from '../../hud/stat/statHelp';

/**
 * Mechanic-effect maps (`mechanicEffects` on skill nodes, stances, rites, gear)
 * as player-facing rows.
 *
 * There are ~270 distinct passive keys across the skill tree alone, so this is
 * deliberately RULE-DRIVEN rather than a hand-written table: the authored keys
 * follow a strict `namespace.feature[-qualifier]` convention, and that
 * convention carries enough information to derive a readable label and a
 * correctly-united value for every key, including ones authored after this file
 * was last touched. Hand-written prose is layered on top via `STAT_HELP` and
 * shows up as the row's tooltip — a key with no prose still reports its number,
 * it just explains itself less.
 *
 * Companion keys collapse into their feature's row: `defense.barrier-pct`,
 * `defense.barrier-delay-ms` and `defense.barrier-recharge-pct` are one line
 * ("Barrier — 15%, 4s, 25%"), not three.
 */

export interface PassiveLine {
  /** The stem key; stable enough for a React key and for help lookup. */
  key: string;
  label: string;
  /** Headline value, e.g. "15%" or "Enabled". */
  value: string;
  /** Companion qualifiers, already phrased, e.g. "every 8s · for 4s". */
  detail: string;
  help: string | undefined;
  /** True when this line's numbers came with authored prose. */
  curated: boolean;
  namespace: string;
}

// ── Key grammar ───────────────────────────────────────────────────────────────

/**
 * Qualifier suffixes, longest-first so `-max-stacks` is stripped before
 * `-stacks` and `-interval-ms` before `-ms`. Order is load-bearing.
 */
const QUALIFIER_SUFFIXES = [
  '-recharge-pct',
  '-ramptime-ms',
  '-interval-ms',
  '-duration-ms',
  '-delay-ms',
  '-max-stacks',
  '-per-stack',
  '-per-tier',
  '-per-sec',
  '-tick-ms',
  '-seconds',
  '-attacks',
  '-stacks',
  '-ticks',
  '-bonus',
  '-count',
  '-floor',
  '-flat',
  '-mult',
  '-rate',
  '-cap',
  '-max',
  '-min',
  '-pct',
  '-ms',
] as const;

type QualifierSuffix = (typeof QUALIFIER_SUFFIXES)[number];

/** The feature a key belongs to: its key minus any qualifier suffix. */
function stemOf(key: string): { stem: string; suffix: QualifierSuffix | null } {
  for (const suffix of QUALIFIER_SUFFIXES) {
    if (key.endsWith(suffix) && key.length > suffix.length) {
      return { stem: key.slice(0, -suffix.length), suffix };
    }
  }
  return { stem: key, suffix: null };
}

/** Words that must not be title-cased naively. */
const WORD_OVERRIDES: Record<string, string> = {
  aps: 'APS',
  atk: 'attack',
  cd: 'cooldown',
  dot: 'DoT',
  dr: 'DR',
  hp: 'HP',
  ooc: 'out-of-combat',
  pen: 'penalty',
  rp: 'RP',
  vuln: 'vulnerability',
  aoe: 'AoE',
};

/**
 * Fractions whose key does not end in `-pct`. The naming convention is good but
 * not total, and reporting a resistance as "+0.18" is exactly the failure this
 * module exists to prevent. Anything genuinely unit-less stays out of this list.
 */
const PERCENT_KEYS = new Set([
  'cadence.momentum-buildup',
  'cooldown.reverb-bonus-per-attack',
  'cooldown.rupture-dr-pierce',
  'defense.debuff-resist',
  'defense.debuff-resistance',
  'defense.dot-resistance',
  'defense.evade-mitigation',
  'dot.rimeshatter-dr-reduction',
  'reload.cannon-charge-fraction',
  'reload.cannon-damage-per-shot',
  'reload.hair-trigger-pct-per-shot',
  'reload.momentum-reload-reduction',
  'reload.momentum-reload-reduction-floor',
  'reload.snipe-fullhp-threshold',
  'weapon.brittle-dr',
]);

/** Scalars that multiply rather than measure, whatever their suffix reads like. */
const MULTIPLIER_KEYS = new Set([
  'reload.snipe-as-to-dmg',
]);

function humanize(text: string): string {
  return text
    .split('-')
    .filter(Boolean)
    .map((word, index) => {
      const override = WORD_OVERRIDES[word];
      if (override) return override;
      return index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    })
    .join(' ');
}

export function passiveNamespace(key: string): string {
  const dot = key.indexOf('.');
  return dot === -1 ? '' : key.slice(0, dot);
}

const NAMESPACE_LABELS: Record<string, string> = {
  cadence: 'Cadence',
  cooldown: 'Cooldown',
  core: 'Core',
  defense: 'Defense',
  dot: 'Damage over Time',
  energy: 'Energy',
  guard: 'Guard',
  mobility: 'Mobility',
  reload: 'Reload',
  relic: 'Relic',
  rite: 'Rite',
  shared: 'General',
  summoner: 'Summoner',
  technique: 'Technique',
  weapon: 'Weapon',
};

export function passiveNamespaceLabel(key: string): string {
  const namespace = passiveNamespace(key);
  return NAMESPACE_LABELS[namespace] ?? humanize(namespace);
}

/** The feature name, without its namespace: `cadence.debuff-vuln` → "Debuff Vulnerability". */
function stemLabel(stem: string): string {
  const dot = stem.indexOf('.');
  return humanize(dot === -1 ? stem : stem.slice(dot + 1));
}

// ── Value formatting ──────────────────────────────────────────────────────────

const round = (value: number, digits = 2): string => {
  const factor = 10 ** digits;
  return String(Math.round(value * factor) / factor);
};

function formatDuration(ms: number): string {
  if (Math.abs(ms) < 1000) return `${round(ms, 0)}ms`;
  return `${round(ms / 1000, 2)}s`;
}

function formatPercent(value: number, withSign: boolean): string {
  const pct = Math.round(value * 1000) / 10;
  if (withSign) return `${pct >= 0 ? '+' : '−'}${Math.abs(pct)}%`;
  return `${pct}%`;
}

function formatNumber(value: number, withSign: boolean): string {
  if (withSign) return `${value >= 0 ? '+' : '−'}${round(Math.abs(value))}`;
  return round(value);
}

/** A single key's value, united by its suffix. */
export function formatPassiveValue(
  key: string,
  value: number,
  options: { signed?: boolean } = {},
): string {
  const { suffix } = stemOf(key);
  const withSign = options.signed ?? false;

  // Keys whose unit the naming convention does not carry.
  if (PERCENT_KEYS.has(key)) return formatPercent(value, withSign);
  if (MULTIPLIER_KEYS.has(key) || key.endsWith('-factor') || key.endsWith('-scale')) {
    return `×${round(value)}`;
  }
  if (key.endsWith('-rad')) return `${Math.round((value * 180) / Math.PI)}°`;

  switch (suffix) {
    case '-pct':
    case '-recharge-pct':
      return formatPercent(value, withSign);
    case '-ms':
    case '-tick-ms':
    case '-interval-ms':
    case '-duration-ms':
    case '-delay-ms':
    case '-ramptime-ms':
      return formatDuration(value);
    case '-mult':
      return `×${round(value)}`;
    case '-seconds':
      return `${round(value)}s`;
    case '-per-sec':
    case '-rate':
      return `${round(value)}/s`;
    default:
      return formatNumber(value, withSign);
  }
}

/** How a companion key reads once attached to its feature's row. */
function qualifierPhrase(suffix: QualifierSuffix, key: string, value: number): string {
  const formatted = formatPassiveValue(key, value);
  switch (suffix) {
    case '-interval-ms':
    case '-tick-ms':
      return `every ${formatted}`;
    case '-duration-ms':
    case '-ms':
      return `for ${formatted}`;
    case '-ramptime-ms':
      return `ramps over ${formatted}`;
    case '-delay-ms':
      return `after ${formatted} undamaged`;
    case '-recharge-pct':
      return `${formatted} per second`;
    case '-max-stacks':
      return `up to ${formatted} stacks`;
    case '-stacks':
      return `${formatted} stacks`;
    case '-ticks':
      return `${formatted} ticks`;
    case '-per-stack':
      return `${formatted} per stack`;
    case '-per-tier':
      return `${formatted} per tier`;
    case '-attacks':
      return `${formatted} attacks`;
    case '-cap':
      return `cap ${formatted}`;
    case '-floor':
      return `floor ${formatted}`;
    case '-max':
      return `max ${formatted}`;
    case '-min':
      return `min ${formatted}`;
    case '-flat':
      return `${formatted} flat`;
    case '-bonus':
      return `${formatted} bonus`;
    case '-mult':
      return `${formatted} damage`;
    case '-per-sec':
    case '-rate':
    case '-seconds':
    case '-count':
    case '-pct':
      return formatted;
    default:
      return formatted;
  }
}

/** Which qualifier gets promoted to the headline when the stem itself is absent. */
const HEADLINE_PRIORITY: QualifierSuffix[] = [
  '-pct',
  '-recharge-pct',
  '-mult',
  '-flat',
  '-bonus',
  '-max',
  '-stacks',
  '-max-stacks',
  '-per-stack',
  '-count',
  '-rate',
  '-per-sec',
  '-seconds',
  '-attacks',
  '-ticks',
  '-cap',
  '-floor',
  '-min',
  '-per-tier',
  '-ms',
  '-tick-ms',
  '-interval-ms',
  '-duration-ms',
  '-ramptime-ms',
];

// ── Main entry point ──────────────────────────────────────────────────────────

export function passiveLines(
  effects: Record<string, number> | undefined,
  options: { signed?: boolean } = {},
): PassiveLine[] {
  if (!effects) return [];

  // Group every key under its feature stem, preserving authored order.
  const groups = new Map<string, { key: string; suffix: QualifierSuffix | null; value: number }[]>();
  for (const [key, value] of Object.entries(effects)) {
    if (value === 0) continue;
    const { stem, suffix } = stemOf(key);
    const bucket = groups.get(stem);
    if (bucket) bucket.push({ key, suffix, value });
    else groups.set(stem, [{ key, suffix, value }]);
  }

  const lines: PassiveLine[] = [];
  for (const [stem, entries] of groups) {
    // The headline is the key that IS the feature (a flag like `cadence.rampage`)
    // when present, otherwise the most magnitude-like qualifier.
    const bare = entries.find((entry) => entry.suffix === null);
    const headline = bare
      ?? HEADLINE_PRIORITY.map((suffix) => entries.find((e) => e.suffix === suffix)).find(Boolean)
      ?? entries[0];

    // A bare key set to 1 is a feature switch, not a quantity ("Detonation: 1").
    const isFlag = headline.suffix === null && headline.value === 1;
    const value = isFlag
      ? 'Enabled'
      : formatPassiveValue(headline.key, headline.value, options);

    const detail = entries
      .filter((entry) => entry !== headline && entry.suffix !== null)
      .map((entry) => qualifierPhrase(entry.suffix!, entry.key, entry.value))
      .join(' · ');

    // Prose is looked up on the real authored keys, headline first, so a curated
    // companion key can still explain a feature whose headline has no copy.
    const helpKey = [headline.key, stem, ...entries.map((entry) => entry.key)]
      .find((candidate) => STAT_HELP[candidate] !== undefined);

    lines.push({
      key: stem,
      // The curated vocabulary wins when it has an entry for this feature's
      // headline key; the rule engine below is the fallback that covers the
      // ~270 skill-tree keys nobody is going to hand-label.
      label: mechanicLabel(headline.key) ?? stemLabel(stem),
      value,
      detail,
      help: helpKey ? STAT_HELP[helpKey] : undefined,
      curated: helpKey !== undefined,
      namespace: passiveNamespace(stem),
    });
  }

  return lines;
}

/** Terse one-line form for dense rows, e.g. "Barrier 15% · DoT Resist 20%". */
export function passiveSummary(effects: Record<string, number> | undefined): string {
  return passiveLines(effects)
    .map((line) => `${line.label} ${line.value}`)
    .join(' · ');
}
