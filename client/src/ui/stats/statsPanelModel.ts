/**
 * The Stats panel as data (design §26.4: "a Stats panel of its own, in the dense
 * ordered layout of the prototype run's thesis D, with the lean's contribution
 * marked. Nothing expands on the left any more.").
 *
 * Four groups in a fixed order — offence, defence, recovery, movement & rhythm —
 * and every number says where it came from. The client decides no gameplay
 * number here: each value is `previewEquipmentStats`, the server's own stat
 * formula on a detached copy, and each SOURCE is the same formula run with one
 * piece taken away (an equipped item, the active lean): "with it" minus "without
 * it" is that piece's share, honest even where pieces multiply. The lean's share
 * is marked in its lane colour.
 *
 * Pure, so `server/test/statsPanel.test.ts` runs it without a DOM.
 */
import {
  GAME_CONFIG,
  ITEM_DATABASE,
  RECIPE_DATABASE,
  defensiveFaceForSubVariant,
  lineageForEquippedItem,
  lineagePayloadScales,
  packetDefinition,
  previewEquipmentStats,
  rankNumeral,
  resolveActiveLineages,
  resolveDotClassProfile,
  rhythmFirings,
  type EquipmentPreviewInput,
  type EquipmentSlot,
  type LineageCard,
  type LineageDefinition,
  type LineageProgress,
  type RhythmFiring,
} from '@mmo-idle/shared';
import { toughness } from '../inventory/statSheetModel';
import { cardRank, cardSentenceAt, maxCardRank } from '../lineage/legibilityContracts';

type Preview = ReturnType<typeof previewEquipmentStats>;

export type StatsGroupKey = 'offence' | 'defence' | 'recovery' | 'rhythm';

/** Where a number comes from: an item, the lean (in its lane colour), the base, or a fixed rule. */
export interface StatsSource {
  kind: 'item' | 'lean' | 'base' | 'rule';
  /** "Poison Dagger", "Coated Edge I", "base", "fixed". */
  label: string;
  /** The share, in the row's unit: "+18", "+44", "+10%". Absent for a rule. */
  amount?: string;
  /** The lean's lane colour; absent for everything else. */
  color?: string;
}

export interface StatsRow {
  key: string;
  label: string;
  value: string;
  sources: StatsSource[];
}

export interface StatsGroup {
  key: StatsGroupKey;
  title: string;
  rows: StatsRow[];
}

/** The active lean, named once at the top in its lane colour. */
export interface StatsLean {
  name: string;
  /** "rank II of III", or undefined for an unranked lean. */
  rank?: string;
  sentence?: string;
  color: string;
}

export interface StatsPanelData {
  groups: StatsGroup[];
  lean?: StatsLean;
}

export interface StatsPanelInput {
  build: EquipmentPreviewInput;
  /** The live barrier pool, which the preview does not model (it is a class mechanic). */
  barrierMax?: number;
}

// ─── Formatting ──────────────────────────────────────────────────────────────

const EPS = 1e-6;

function trimmed(value: number, places = 0): string {
  const f = 10 ** places;
  return String(Math.round(value * f) / f);
}
const signed = (text: string): string => (text.startsWith('-') ? text : `+${text}`);
const pct = (v: number, places = 0) => `${trimmed(v * 100, places)}%`;

interface RowDef {
  key: string;
  label: string;
  group: StatsGroupKey;
  value: (p: Preview, input: StatsPanelInput) => number;
  fmt: (v: number) => string;
  /** The share's text: "+18", "+10%". */
  delta: (d: number) => string;
  /** Hidden when the value sits here and no source moves it. */
  neutral?: number;
  /** Always shown. */
  pinned?: boolean;
  /** Shown only for a class that reads it. */
  onlyFor?: string;
}

const flat = (places = 0) => (d: number) => signed(trimmed(d, places));
const points = (d: number) => `${signed(trimmed(d * 100))}%`;

const ROWS: readonly RowDef[] = [
  // ── Offence ──
  { key: 'attack', label: 'Attack', group: 'offence', value: (p) => p.stats.attack, fmt: (v) => trimmed(v), delta: flat(), pinned: true },
  { key: 'onHitDamage', label: 'On-hit damage', group: 'offence', value: (p) => p.stats.onHitDamage, fmt: (v) => trimmed(v), delta: flat(), neutral: 0 },
  { key: 'attacksPerSecond', label: 'Swings / s', group: 'offence', value: (p) => p.stats.attacksPerSecond, fmt: (v) => trimmed(v, 2), delta: flat(2), pinned: true },
  { key: 'dps', label: 'DPS (estimate)', group: 'offence', value: (p) => p.stats.dps, fmt: (v) => trimmed(v, v >= 100 ? 0 : 1), delta: flat(1), pinned: true },
  { key: 'damageDealtMult', label: 'Final damage', group: 'offence', value: (p) => p.stats.damageDealtMult, fmt: (v) => `×${trimmed(v, 2)}`, delta: points, neutral: 1 },
  {
    key: 'dotMult', label: 'DoT potency', group: 'offence', onlyFor: 'dot',
    value: (p, input) => resolveDotClassProfile(p.passives, input.build.usesSkills.selectedSubVariant).dotMechanicMultiplier,
    fmt: (v) => `×${trimmed(v, 2)}`, delta: points, pinned: true,
  },
  // The Effect lean on a weapon with a reservoir (design §26.2): it amplifies
  // what the reservoir banks (`weapon.reservoir-potency-pct`), never joins it.
  { key: 'reservoirPotency', label: 'Reservoir potency', group: 'offence', value: (p) => p.passives['weapon.reservoir-potency-pct'] ?? 0, fmt: (v) => signed(pct(v)), delta: points, neutral: 0 },
  { key: 'bleedOnHit', label: 'Bleed per hit', group: 'offence', value: (p) => p.passives['shared.bleed-on-hit-pct'] ?? 0, fmt: (v) => pct(v), delta: points, neutral: 0 },
  { key: 'slowOnHit', label: 'Slow on hit', group: 'offence', value: (p) => p.passives['shared.slow-on-hit-pct'] ?? 0, fmt: (v) => pct(v), delta: points, neutral: 0 },
  { key: 'techniquePower', label: 'Technique power', group: 'offence', value: (p) => p.passives['technique.power-pct'] ?? 0, fmt: (v) => signed(pct(v)), delta: points, neutral: 0 },
  { key: 'attackRange', label: 'Range', group: 'offence', value: (p) => p.stats.attackRange, fmt: (v) => trimmed(v), delta: flat(), pinned: true },
  // ── Defence ──
  { key: 'maxHp', label: 'Health', group: 'defence', value: (p) => p.stats.maxHp, fmt: (v) => trimmed(v), delta: flat(), pinned: true },
  { key: 'damageReduction', label: 'Damage reduction', group: 'defence', value: (p) => p.stats.damageReduction, fmt: (v) => pct(v), delta: points, pinned: true },
  { key: 'plating', label: 'Plating', group: 'defence', value: (p) => p.stats.plating, fmt: (v) => trimmed(v), delta: flat(), pinned: true },
  { key: 'dodgeRate', label: 'Dodge', group: 'defence', value: (p) => p.stats.dodgeRate, fmt: (v) => pct(v), delta: points, neutral: 0 },
  { key: 'evadeMitigation', label: 'Avoided per dodge', group: 'defence', value: (p) => (p.stats.dodgeRate > 0 ? p.stats.evadeMitigation : 0), fmt: (v) => pct(v), delta: points, neutral: 0 },
  { key: 'damageTakenMult', label: 'Final damage taken', group: 'defence', value: (p) => p.stats.damageTakenMult, fmt: (v) => `×${trimmed(v, 2)}`, delta: points, neutral: 1 },
  { key: 'barrier', label: 'Barrier', group: 'defence', value: (_p, input) => input.barrierMax ?? 0, fmt: (v) => trimmed(v), delta: flat(), neutral: 0 },
  { key: 'toughness', label: 'Toughness', group: 'defence', value: (p) => toughness(p.stats), fmt: (v) => trimmed(v), delta: flat(), pinned: true },
  // ── Recovery ──
  { key: 'recovery', label: 'Recovery', group: 'recovery', value: (p) => p.stats.recovery, fmt: (v) => `${trimmed(v, 1)} HP/s`, delta: flat(1), pinned: true },
  // ── Movement & rhythm ──
  { key: 'speed', label: 'Move speed', group: 'rhythm', value: (p) => p.stats.speed, fmt: (v) => trimmed(v), delta: flat(), pinned: true },
];

const GROUP_TITLES: Readonly<Record<StatsGroupKey, string>> = {
  offence: 'Offence',
  defence: 'Defence',
  recovery: 'Recovery',
  rhythm: 'Movement & rhythm',
};
const GROUP_ORDER: readonly StatsGroupKey[] = ['offence', 'defence', 'recovery', 'rhythm'];

/** Slots in the order their sources are named. */
const SLOTS: readonly EquipmentSlot[] = ['weapon', 'armor', 'recovery', 'mobility', 'core', 'relic'];

// ─── The lean ────────────────────────────────────────────────────────────────

interface ActiveLean {
  lineage: LineageDefinition;
  progress: LineageProgress;
  card: LineageCard;
}

/** The active stat-row card of the lineage worn in the weapon slot, if any. */
export function activeWeaponLean(build: EquipmentPreviewInput): ActiveLean | undefined {
  const lineage = lineageForEquippedItem(build.equipment.weapon);
  const progress = lineage ? build.lineages?.[lineage.id] : undefined;
  const cardId = progress?.active.stat;
  if (!lineage || !progress || !cardId || !progress.ownedCards.includes(cardId)) return undefined;
  const card = lineage.cards.find((c) => c.id === cardId && c.row === 'stat');
  return card ? { lineage, progress, card } : undefined;
}

function withoutLean(build: EquipmentPreviewInput, lean: ActiveLean): EquipmentPreviewInput {
  const active = { ...lean.progress.active };
  delete active.stat;
  return { ...build, lineages: { ...build.lineages, [lean.lineage.id]: { ...lean.progress, active } } };
}

function leanLabel(lean: ActiveLean): string {
  const max = maxCardRank(lean.card);
  return max > 1 ? `${lean.card.name} ${rankNumeral(Math.max(1, cardRank(lean.progress, lean.card.id)))}` : lean.card.name;
}

// ─── Rhythm rows ─────────────────────────────────────────────────────────────

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

/** How often a verb can fire, from its trigger's shape — the ring's own grammar. */
export function cadenceText(firing: RhythmFiring): string {
  const { trigger } = firing;
  const cap = trigger.capMs ? `every ${trimmed(trigger.capMs / 1000, 1)} s at most` : undefined;
  switch (firing.shape) {
    case 'cap': return cap!;
    case 'count': return `every ${ordinal(Math.round(trigger.n ?? 1))} hit`;
    case 'latch-body': return 'first hit on each target';
    case 'latch-engagement': return 'first hit of a fight';
    case 'carry': return 'the hit after a kill';
    case 'pulse':
    default:
      return trigger.kind === 'mechanic-fired' ? 'when your mechanic fires'
        : trigger.kind === 'technique-cast' ? 'when a Technique lands'
          : trigger.kind === 'kill' ? 'on a kill'
            : 'on its moment';
  }
}

// ─── Build ───────────────────────────────────────────────────────────────────

function itemName(defId: string): string {
  return ITEM_DATABASE.get(defId)?.name ?? defId;
}

export function buildStatsPanel(input: StatsPanelInput): StatsPanelData {
  const { build } = input;
  const full = previewEquipmentStats(build);
  const lean = activeWeaponLean(build);
  const leanColor = lean ? packetDefinition(lean.card.lane)?.color ?? '#a99e8a' : undefined;
  const noLean = lean ? previewEquipmentStats(withoutLean(build, lean)) : undefined;
  const withoutSlot = new Map<EquipmentSlot, Preview>();
  for (const slot of SLOTS) {
    if (build.equipment[slot]) {
      withoutSlot.set(slot, previewEquipmentStats({ ...build, equipment: { ...build.equipment, [slot]: null } }));
    }
  }
  const archetype = build.usesSkills.combatArchetype;

  const rows = new Map<StatsGroupKey, StatsRow[]>(GROUP_ORDER.map((g) => [g, []]));
  for (const def of ROWS) {
    if (def.onlyFor && def.onlyFor !== archetype) continue;
    const value = def.value(full, input);
    const sources: StatsSource[] = [];
    let accounted = 0;
    const leanShare = lean && noLean ? value - def.value(noLean, input) : 0;
    for (const [slot, without] of withoutSlot) {
      let share = value - def.value(without, input);
      // The weapon's share includes its lineage; the lean is named on its own.
      if (slot === 'weapon') share -= leanShare;
      if (Math.abs(share) <= EPS) continue;
      accounted += share;
      sources.push({ kind: 'item', label: itemName(build.equipment[slot]!), amount: def.delta(share) });
    }
    if (lean && Math.abs(leanShare) > EPS) {
      accounted += leanShare;
      sources.push({ kind: 'lean', label: leanLabel(lean), amount: def.delta(leanShare), color: leanColor });
    }
    const base = value - accounted;
    // Items in slot order, the lean after them, then the base.
    sources.sort((a, b) => (a.kind === 'lean' ? 1 : 0) - (b.kind === 'lean' ? 1 : 0));
    if (sources.length > 0 && Math.abs(base) > EPS && (def.neutral === undefined || Math.abs(base - def.neutral) > EPS)) {
      sources.push({ kind: 'base', label: 'base', amount: def.fmt(base).replace(/^\+/, '') });
    }
    const moved = sources.some((s) => s.kind !== 'base');
    if (!def.pinned && def.neutral !== undefined && Math.abs(value - def.neutral) <= EPS && !moved) continue;
    rows.get(def.group)!.push({ key: def.key, label: def.label, value: def.fmt(value), sources });
  }

  // The weapon's own reservoir (a data fact, not a computed number).
  const weaponId = build.equipment.weapon;
  const reservoir = weaponId ? RECIPE_DATABASE.get(weaponId)?.weaponDot : undefined;
  if (weaponId && reservoir) {
    const element = reservoir.element === 'poison' ? 'Poison' : reservoir.element === 'fire' ? 'Burn'
      : reservoir.element === 'frost' ? 'Chill' : 'Reservoir';
    const share = reservoir.convPct;
    const potency = rows.get('offence')!.find((r) => r.key === 'reservoirPotency');
    if (potency) potency.label = `${element} potency`;
    rows.get('offence')!.push({
      key: 'reservoir',
      label: `${element} per hit`,
      value: Math.abs(share - 0.5) < EPS ? 'half the hit' : `${pct(share)} of the hit`,
      sources: [{ kind: 'rule', label: `×${trimmed(reservoir.dotMultiplier, 2)} owed, drained over ${trimmed(reservoir.drainDurationMs / 1000, 1)} s · ${itemName(weaponId)}` }],
    });
  }

  rows.get('recovery')!.push({
    key: 'outOfCombat', label: 'Out of combat', value: `${pct(GAME_CONFIG.OOC_RECOVERY_PCT)} / s`,
    sources: [{ kind: 'rule', label: 'fixed, of your pool' }],
  });

  // The verbs: one row each, how often they can fire (the ring's grammar).
  const firings = rhythmFirings(resolveActiveLineages(
    { equipment: build.equipment, lineages: build.lineages },
    defensiveFaceForSubVariant(build.usesSkills.selectedSubVariant),
  ));
  // The payload SCALE an Effect lean puts on a verb (design §26.1: on a weapon
  // with no mechanic of its own, Effect is the size of the verb's payload).
  const weaponLineage = lineageForEquippedItem(build.equipment.weapon);
  const weaponProgress = weaponLineage ? build.lineages?.[weaponLineage.id] : undefined;
  const scales = weaponLineage && weaponProgress ? lineagePayloadScales(weaponLineage, weaponProgress) : {};
  for (const firing of firings) {
    const sources: StatsSource[] = [{ kind: 'rule', label: cadenceText(firing), color: packetDefinition(firing.lane)?.color }];
    const scale = firing.source === 'card' ? scales[firing.payloadLane] ?? 0 : 0;
    if (scale > EPS) {
      const fromLean = lean?.card.statKey === 'payloadScale' && lean.card.lane === firing.payloadLane;
      sources.push(fromLean
        ? { kind: 'lean', label: `payload · ${leanLabel(lean!)}`, amount: signed(pct(scale)), color: leanColor }
        : { kind: 'rule', label: `payload ${signed(pct(scale))} · your form` });
    }
    rows.get('rhythm')!.push({
      key: `verb:${firing.key}`,
      label: firing.name,
      value: firing.source === 'capstone' ? 'capstone' : 'verb',
      sources,
    });
  }

  const data: StatsPanelData = {
    groups: GROUP_ORDER.map((key) => ({ key, title: GROUP_TITLES[key], rows: rows.get(key)! })),
  };
  if (lean) {
    const max = maxCardRank(lean.card);
    const rank = cardRank(lean.progress, lean.card.id);
    data.lean = {
      name: lean.card.name,
      ...(max > 1 ? { rank: `rank ${rankNumeral(rank)} of ${rankNumeral(max)}` } : {}),
      sentence: cardSentenceAt(lean.card, lean.progress),
      color: leanColor!,
    };
  }
  return data;
}
