import {
  ITEM_DATABASE,
  itemMechanicEffectsAt,
  previewEquipmentStats,
  relicRatingsFromPassives,
  resolveRelicComparison,
  type EquipmentPreviewInput,
  type EquipmentPreviewStat,
  type EquipmentSlot,
} from '@mmo-idle/shared';
import {
  formatMechanicEffectEntries,
  formatWeaponEffects,
  resolvedRelicProfileRows,
  type RelicProfileRow,
} from '../crafting/itemDisplay';

/**
 * The inventory stat sheet as data: a stable character sheet, what one item
 * would change (or what an equipped item contributes), and which of its effects
 * the numbers actually account for. Pure, so the whole comparison is testable
 * without React.
 */

type PreviewStats = ReturnType<typeof previewEquipmentStats>['stats'];
type SheetStat = Exclude<EquipmentPreviewStat, 'dps'> | 'toughness';

export interface SheetRowDef {
  key: SheetStat;
  label: string;
  group: 'Offense' | 'Defense' | 'Utility';
  fmt: (v: number) => string;
  /** Signed change, in the unit a player reads it in (percent for ratios and multipliers). */
  fmtDelta: (d: number) => string;
  /** Value at which the stat does nothing; rows at neutral stay hidden unless they change. */
  neutral: number;
  lowerIsBetter?: boolean;
  /** Always shown, even at neutral: the stats every build reads. */
  pinned?: boolean;
}

const round = (v: number, places = 0) => {
  const f = 10 ** places;
  return String(Math.round(v * f) / f);
};
const pct = (v: number) => `${round(v * 100)}%`;
const mult = (v: number) => `×${round(v, 2)}`;
const sign = (s: string) => (s.startsWith('-') ? s : `+${s}`);
const flatDelta = (places = 0) => (d: number) => sign(round(d, places));
const pctDelta = (d: number) => `${sign(round(d * 100))}%`;

export const SHEET_ROWS: readonly SheetRowDef[] = [
  { key: 'attack', label: 'Attack', group: 'Offense', fmt: v => round(v), fmtDelta: flatDelta(), neutral: 0, pinned: true },
  { key: 'onHitDamage', label: 'On-hit damage', group: 'Offense', fmt: v => round(v), fmtDelta: flatDelta(), neutral: 0 },
  { key: 'attacksPerSecond', label: 'Attacks / sec', group: 'Offense', fmt: v => round(v, 2), fmtDelta: flatDelta(2), neutral: 0, pinned: true },
  { key: 'damageDealtMult', label: 'Final damage dealt', group: 'Offense', fmt: mult, fmtDelta: pctDelta, neutral: 1 },
  { key: 'attackRange', label: 'Range', group: 'Offense', fmt: v => round(v), fmtDelta: flatDelta(), neutral: 0 },
  { key: 'maxHp', label: 'Max HP', group: 'Defense', fmt: v => round(v), fmtDelta: flatDelta(), neutral: 0, pinned: true },
  { key: 'damageReduction', label: 'Damage reduction', group: 'Defense', fmt: pct, fmtDelta: pctDelta, neutral: 0, pinned: true },
  { key: 'plating', label: 'Plating', group: 'Defense', fmt: v => round(v), fmtDelta: flatDelta(), neutral: 0 },
  { key: 'dodgeRate', label: 'Dodge rate', group: 'Defense', fmt: pct, fmtDelta: pctDelta, neutral: 0 },
  { key: 'evadeMitigation', label: 'Damage avoided per dodge', group: 'Defense', fmt: pct, fmtDelta: pctDelta, neutral: 0 },
  { key: 'damageTakenMult', label: 'Final damage taken', group: 'Defense', fmt: mult, fmtDelta: pctDelta, neutral: 1, lowerIsBetter: true },
  { key: 'recovery', label: 'Recovery', group: 'Defense', fmt: v => round(v, 1), fmtDelta: flatDelta(1), neutral: 0 },
  { key: 'speed', label: 'Move speed', group: 'Utility', fmt: v => round(v), fmtDelta: flatDelta(), neutral: 0 },
];

/**
 * Toughness: max HP scaled by every multiplicative defence the preview knows —
 * damage reduction, final damage taken, and the expected share of damage a dodge
 * removes. Plating (flat per hit) and recovery (over time) depend on the enemy
 * and the fight length, so they stay as their own rows rather than being guessed in.
 */
export function toughness(stats: PreviewStats): number {
  const taken = Math.max(0.05,
    (1 - stats.damageReduction) * stats.damageTakenMult * (1 - stats.dodgeRate * stats.evadeMitigation));
  return stats.maxHp / taken;
}

function value(stats: PreviewStats, key: SheetStat): number {
  return key === 'toughness' ? toughness(stats) : stats[key];
}

export type SheetMode =
  /** Nothing selected: your character as it stands. */
  | 'character'
  /** A bag item: what equipping it would change. */
  | 'swap'
  /** An equipped item: what it currently contributes (you with it vs without it). */
  | 'contribution';

export interface SheetRow {
  def: SheetRowDef;
  /** Before: current (swap), without the item (contribution), current (character). */
  before: number;
  after: number;
  changed: boolean;
  /** +1 better, -1 worse, 0 unchanged, with lower-is-better stats inverted. */
  direction: -1 | 0 | 1;
}

export interface SheetEffects {
  /** Lines whose keys move a number above when removed. */
  counted: string[];
  /** Lines the preview cannot see: removing them changes nothing it measures. */
  uncounted: string[];
  /** Advisory lines with no mechanic of their own. */
  notes: string[];
  /** The equipped item's lines that the candidate does not carry (swap only). */
  lost: string[];
}

export interface StatSheetData {
  mode: SheetMode;
  slot: EquipmentSlot | null;
  /** The equipped item being replaced, in swap mode. */
  replacesId: string | null;
  dps: { before: number; after: number };
  toughness: { before: number; after: number };
  rows: SheetRow[];
  effects: SheetEffects;
  relicRows: RelicProfileRow[];
}

/** The live build, exactly as the stat preview takes it. */
export type StatSheetBuild = EquipmentPreviewInput;

const EPS = 1e-6;

function statsDiffer(a: PreviewStats, b: PreviewStats): boolean {
  return (Object.keys(a) as (keyof PreviewStats)[]).some((key) => Math.abs(a[key] - b[key]) > EPS)
    || Math.abs(toughness(a) - toughness(b)) > EPS;
}

function direction(def: SheetRowDef, before: number, after: number): -1 | 0 | 1 {
  const d = after - before;
  if (Math.abs(d) <= EPS) return 0;
  return (def.lowerIsBetter ? -d : d) > 0 ? 1 : -1;
}

function itemLines(defId: string, plus: number) {
  const def = ITEM_DATABASE.get(defId);
  if (!def) return { keyed: [], weapon: [] as string[] };
  return {
    keyed: formatMechanicEffectEntries(itemMechanicEffectsAt(def, plus)),
    weapon: def.slot === 'weapon' ? formatWeaponEffects(def.id) : [],
  };
}

export function buildStatSheet(build: StatSheetBuild, defId: string | null): StatSheetData {
  const current = previewEquipmentStats(build);
  const def = defId ? ITEM_DATABASE.get(defId) : undefined;
  const slot = def ? (def.slot as EquipmentSlot) : null;
  const equipped = !!def && !!slot && build.equipment[slot] === def.id;
  const mode: SheetMode = !def ? 'character' : equipped ? 'contribution' : 'swap';

  // The equipment the item is measured in, and the state it is compared against.
  const withItem = def && slot ? { ...build.equipment, [slot]: def.id } : build.equipment;
  const before = mode === 'contribution' && slot
    ? previewEquipmentStats({ ...build, equipment: { ...build.equipment, [slot]: null } })
    : current;
  const after = mode === 'swap' ? previewEquipmentStats({ ...build, equipment: withItem }) : current;

  const rows: SheetRow[] = SHEET_ROWS
    .map((rowDef) => {
      const b = value(before.stats, rowDef.key);
      const a = value(after.stats, rowDef.key);
      return { def: rowDef, before: b, after: a, changed: Math.abs(a - b) > EPS, direction: direction(rowDef, b, a) };
    })
    .filter((row) => row.def.pinned || row.changed
      || Math.abs(row.before - row.def.neutral) > EPS || Math.abs(row.after - row.def.neutral) > EPS);

  const effects: SheetEffects = { counted: [], uncounted: [], notes: [], lost: [] };
  let relicRows: RelicProfileRow[] = [];
  if (def && slot) {
    const plus = build.itemUpgrades[def.id] ?? 0;
    const lines = itemLines(def.id, plus);
    // Measured in the state where the item is worn: drop one line's keys and see
    // whether anything the sheet reports moves.
    const buildWithItem = { ...build, equipment: withItem };
    const reference = mode === 'swap' ? after : current;
    for (const entry of lines.keyed) {
      if (entry.keys.length === 0) { effects.notes.push(entry.text); continue; }
      const ablated = previewEquipmentStats({
        ...buildWithItem,
        omitItemEffects: { defId: def.id, keys: new Set(entry.keys) },
      });
      (statsDiffer(reference.stats, ablated.stats) ? effects.counted : effects.uncounted).push(entry.text);
    }
    // The DPS estimate models a weapon's own damage-over-time package directly.
    effects.counted.push(...lines.weapon);

    if (mode === 'swap' && build.equipment[slot]) {
      const wornId = build.equipment[slot]!;
      const worn = itemLines(wornId, build.itemUpgrades[wornId] ?? 0);
      const mine = new Set([...lines.keyed.map((entry) => entry.text), ...lines.weapon]);
      effects.lost = [...worn.keyed.map((entry) => entry.text), ...worn.weapon].filter((text) => !mine.has(text));
    }

    if (slot === 'relic') {
      const skills = build.usesSkills;
      const profile = resolveRelicComparison(
        skills.combatArchetype,
        before.passives,
        relicRatingsFromPassives(before.passives),
        relicRatingsFromPassives(after.passives),
        {
          subVariant: skills.selectedSubVariant,
          playerTier: build.playerTier,
          unlockedSkills: skills.unlockedSkills,
          selectedRange: skills.selectedRange,
        },
      );
      relicRows = profile ? resolvedRelicProfileRows(profile) : [];
    }
  }

  return {
    mode,
    slot,
    replacesId: mode === 'swap' && slot ? build.equipment[slot] ?? null : null,
    dps: { before: before.stats.dps, after: after.stats.dps },
    toughness: { before: toughness(before.stats), after: toughness(after.stats) },
    rows,
    effects,
    relicRows,
  };
}
