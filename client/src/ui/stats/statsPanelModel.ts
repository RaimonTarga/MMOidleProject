/**
 * The Stats panel as data (design §26.4: "a Stats panel of its own, in the dense
 * ordered layout of the prototype run's thesis D. Nothing expands on the left any
 * more.").
 *
 * Four groups in a fixed order — offence, defence, recovery, movement & rhythm —
 * and every number says where it came from. The client decides no gameplay
 * number here: each value is `previewEquipmentStats`, the server's own stat
 * formula on a detached copy, and each SOURCE is the same formula run with one
 * equipped item taken away: "with it" minus "without it" is that item's share,
 * honest even where pieces multiply.
 *
 * Pure, so `server/test/statsPanel.test.ts` runs it without a DOM.
 */
import {
  GAME_CONFIG,
  ITEM_DATABASE,
  TECHNIQUE_CAST_SPEED_CAP,
  RECIPE_DATABASE,
  previewEquipmentStats,
  resolveDotClassProfile,
  type EquipmentPreviewInput,
  type EquipmentSlot,
} from '@mmo-idle/shared';
import { toughness } from '../inventory/statSheetModel';

type Preview = ReturnType<typeof previewEquipmentStats>;

export type StatsGroupKey = 'offence' | 'defence' | 'recovery' | 'rhythm';

/** Where a number comes from: an item, the base, or a fixed rule. */
export interface StatsSource {
  kind: 'item' | 'base' | 'rule';
  /** "Poison Dagger", "base", "fixed". */
  label: string;
  /** The share, in the row's unit: "+18", "+44", "+10%". Absent for a rule. */
  amount?: string;
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

export interface StatsPanelData {
  groups: StatsGroup[];
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
  { key: 'techniquePower', label: 'Technique power', group: 'offence', value: (p) => p.passives['technique.power-pct'] ?? 0, fmt: (v) => signed(pct(v)), delta: points, neutral: 0 },
  // The Technique lane's own second number (design §22.9: "cast speed is the
  // Technique lane's stat ... shown beside Technique Power"), capped as the cast
  // lifecycle caps it, so the sheet never promises a wind-up the server refuses.
  { key: 'castSpeed', label: 'Cast speed', group: 'offence', value: (p) => Math.min(TECHNIQUE_CAST_SPEED_CAP, p.passives['technique.cast-speed-pct'] ?? 0), fmt: (v) => signed(pct(v)), delta: points, neutral: 0 },
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

// ─── Build ───────────────────────────────────────────────────────────────────

function itemName(defId: string): string {
  return ITEM_DATABASE.get(defId)?.name ?? defId;
}

export function buildStatsPanel(input: StatsPanelInput): StatsPanelData {
  const { build } = input;
  const full = previewEquipmentStats(build);
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
    for (const [slot, without] of withoutSlot) {
      const share = value - def.value(without, input);
      if (Math.abs(share) <= EPS) continue;
      accounted += share;
      sources.push({ kind: 'item', label: itemName(build.equipment[slot]!), amount: def.delta(share) });
    }
    const base = value - accounted;
    // Items in slot order, then the base.
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

  return {
    groups: GROUP_ORDER.map((key) => ({ key, title: GROUP_TITLES[key], rows: rows.get(key)! })),
  };
}
