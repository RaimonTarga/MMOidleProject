import assert from 'node:assert/strict';
import { DUNGEON_DEFS, MONSTER_DATABASE, NODE_BIOMES } from '@mmo-idle/shared';
import { BOSS1_TIMBERCLAW_BOSS_ID, referencePackageCells } from './boss1Spec';
import type { Night5Cell } from './night5Spec';

/**
 * Boss2 -- T2 coverage on PORTABLE references.
 *
 * Boss1 measured two bosses against builds chosen for them. Boss2 asks a different
 * and narrower question: carrying ONE fixed package per root across the rest of the
 * tier, are failures concentrated in particular bosses, in particular roots, or
 * spread across the roster?
 *
 * Six remaining bosses x six roots x one declared seed = 36 formal fights. Apex
 * Timberclaw is NOT re-run: its six observations already exist at the same revision
 * on the same packages, and replaying them would spend six fights to reproduce
 * rows the campaign already holds.
 *
 * What this is NOT:
 *
 *   - Not a search for matchup-specific equipment. The packages are fixed across all
 *     six bosses on purpose. An absent counter-tool (there is no Cleanse in this
 *     shape) is a property of the reference to be read in interpretation, never a
 *     boss-design defect and never something to repair mid-run.
 *   - Not a player-clear probability. One observation per root/boss is a first-pass
 *     coverage map, and six roots on one package shape cannot estimate what a
 *     prepared player does.
 *   - Not a class ranking, and not a cross-tier difficulty comparison.
 *
 * A loss is DATA. Boss1 kept five Timberclaw losses that had removed 51-94% of the
 * boss; those rows are what made the phase exposure readable at all. Nothing here
 * is dropped for losing.
 */

/** One declared seed. See `BOSS2_SEED_NOTE` for what that does and does not buy. */
export const BOSS2_SEED = 98011;
export const BOSS2_CAP_MS = 300000;
export const BOSS2_TIER = 2;

/**
 * Seed honesty, stated rather than implied.
 *
 * Only `gorging-razortusk` has a DECLARED randomness consumer among these six: its
 * Rallying Cry spawns carry `offsetRange`, so a second seed could genuinely move its
 * rows. The other five declare none -- no adds, fixed spawns, and evasion is
 * deterministic -- but that is an absence of declared consumers, NOT a measurement
 * that they are inert. Timberclaw's inertness was measured; theirs was not, and this
 * screen does not spend fights to measure it. Do not present one seed as coverage of
 * seed sensitivity for any of the six.
 */
export const BOSS2_SEED_NOTE =
  'one declared seed; razortusk has a declared randomness consumer, the other five are unmeasured';

/**
 * The six remaining T2 bosses, resolved from `DUNGEON_DEFS` live membership rather
 * than from filenames, comments or node-name suffixes. `assertBoss2Definitions`
 * re-derives this from source and refuses to run if the roster has moved.
 *
 * `summonsNothing` is per BOSS, not per screen. Getting it wrong in either direction
 * is costly: true on a boss that summons fails its legitimate adds as leaked bodies,
 * and false on a boss that summons disables the guard that caught `resetDungeon`
 * respawning a twelve-strong guard into the add count.
 */
export interface Boss2Block {
  name: string;
  bossId: string;
  nodeId: string;
  role: string;
  bossStats: { hp: number; attack: number; plating: number; damageReduction: number };
  /** Species the script actually spawns, at their authored values. Empty for most. */
  escorts: Record<string, { hp: number; attack: number }>;
  summonsNothing: boolean;
  /**
   * `bossPattern` id, if the boss runs one. A boss's mechanics live in TWO separate
   * fields and a census of either alone is wrong:
   *
   *   `bossScript`  -- HP-threshold phases and `repeating` cadences
   *   `bossPattern` -- the multi-step signature loop (cast, charge, conceal, payoff)
   *
   * `jungle-dread-gorger` has NO `bossScript` at all and would read as a bare
   * statline from the script alone, while actually running a three-step escape,
   * stalk and ambush loop.
   */
  patternId: string | null;
  /**
   * Whether the pattern CONCEALS the boss (`chitinous-dreadbore` burrows,
   * `jungle-dread-gorger` stalks unseen).
   *
   * Recorded because it looks like the disappearance the terminal classifier exists
   * to catch, and is not. Concealment attaches an `isConcealed` COMPONENT to a body
   * that stays in the node: it is untargetable and damage-immune for the window, but
   * `monsterEntitiesInNode` still yields it, so `bossPresent` stays true and no
   * `boss-vanished-no-kill` can be produced by a burrow. `endPattern` detaches it
   * unconditionally on every teardown reason, including a reset.
   *
   * `boss2Concealment.test.ts` holds that invariant.
   */
  conceals: boolean;
}

export const BOSS2_BOSSES: Boss2Block[] = [
  {
    name: 'razortusk', bossId: 'gorging-razortusk', nodeId: 'node-t2-plains-dungeon', role: 'plains',
    bossStats: { hp: 4000, attack: 96, plating: 8, damageReduction: 0.05 },
    // Rallying Cry at 50%, at 25%, and on a 10 s repeating cadence. The only summoner
    // in the tier, so it is the only block where the escort receipt rule has teeth.
    escorts: { 'plains-slime': { hp: 50, attack: 12 }, boar: { hp: 100, attack: 18 } },
    summonsNothing: false, patternId: null, conceals: false,
  },
  {
    name: 'juggernaut', bossId: 'stoneplate-juggernaut', nodeId: 'node-t2-mountain-dungeon', role: 'mountain',
    bossStats: { hp: 5000, attack: 128, plating: 10, damageReduction: 0.05 },
    // Barriered charge with an `Overextended` punish window.
    escorts: {}, summonsNothing: true, patternId: 'stoneplate-charge', conceals: false,
  },
  {
    name: 'behemoth', bossId: 'mire-gorged-behemoth', nodeId: 'node-t2-swamp-dungeon', role: 'swamp',
    bossStats: { hp: 3375, attack: 38, plating: 6, damageReduction: 0.08 },
    // No pattern; its pressure is the Corrosive Pool charged attack plus a 50% enrage.
    escorts: {}, summonsNothing: true, patternId: null, conceals: false,
  },
  {
    name: 'dreadbore', bossId: 'chitinous-dreadbore', nodeId: 'node-t2-cave-dungeon', role: 'cave',
    bossStats: { hp: 4375, attack: 139, plating: 12, damageReduction: 0.12 },
    // Burrows UNTARGETABLE, relocates onto the player, erupts. See `conceals`.
    escorts: {}, summonsNothing: true, patternId: 'dreadbore-emergence', conceals: true,
  },
  {
    name: 'emperor', bossId: 'dune-stalker-emperor', nodeId: 'node-t2-desert-dungeon', role: 'desert',
    bossStats: { hp: 3750, attack: 85, plating: 12, damageReduction: 0.08 },
    // Stacking stings into an Execution payoff.
    escorts: {}, summonsNothing: true, patternId: 'dune-execution', conceals: false,
  },
  {
    name: 'gorger', bossId: 'jungle-dread-gorger', nodeId: 'node-t2-jungle-dungeon', role: 'jungle',
    bossStats: { hp: 3625, attack: 85, plating: 0, damageReduction: 0.03 },
    // NO `bossScript` -- its whole encounter is the pattern: flee behind a shield,
    // stalk unseen, ambush. A script-only census reports this boss as a bare statline.
    escorts: {}, summonsNothing: true, patternId: 'gorger-escape', conceals: true,
  },
];

/**
 * Every cell is the Boss1 Timberclaw package, unchanged, on a different boss.
 *
 * Treatment is `reference-portable` on ALL six roots, deliberately. Spirit's package
 * is the one with a historical clear, but that clear is against Apex Timberclaw and
 * corroborates nothing here -- a Boss2 row must never be readable as a historical
 * result. `boss2Matrix.test.ts` asserts no cell claims corroboration.
 */
export const BOSS2_BLOCKS: Record<string, { cells: Night5Cell[]; durationMs: number; pilotIds: string[] }> =
  Object.fromEntries(BOSS2_BOSSES.map((b) => [b.name, {
    cells: referencePackageCells({
      nodeId: b.nodeId, role: b.role, bossId: b.bossId,
      idPrefix: `boss2-${b.name}`, treatmentFor: () => 'reference-portable',
    }),
    durationMs: BOSS2_CAP_MS,
    // No pilot. The encounter setup is the one Boss1 already exercised on the same
    // runner, and a pilot here would be an undeclared 37th observation.
    pilotIds: [],
  }]));

/** Boss2 installs nothing: every boss is fought at authored source values. */
export function installBoss2Treatment(): null {
  return null;
}

/** Walk phases, `repeating`, and actions NESTED inside a cast. */
function summonedSpecies(bossScript: unknown): Set<string> {
  const found = new Set<string>();
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const n of node) walk(n); return; }
    const o = node as { type?: string; monsterTypeId?: string };
    // Razortusk's spawns sit inside a `cast`, and its cadence sits in `repeating`.
    // A census that walks only `phases[].actions` misses both and reports a
    // summoning boss as summoning nothing.
    if (o.type === 'spawn-adds' && o.monsterTypeId) found.add(o.monsterTypeId);
    for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v);
  };
  walk(bossScript);
  return found;
}

/** Fail loudly at load time if the roster, the bosses or the packages have drifted. */
export function assertBoss2Definitions(): void {
  assert.equal(BOSS2_BOSSES.length, 6, 'Boss2 screens the six remaining T2 bosses');
  assert.equal(new Set(BOSS2_BOSSES.map((b) => b.bossId)).size, 6, 'boss ids must be distinct');

  // Live dungeon membership, re-derived from source. Every T2 dungeon must be
  // accounted for: the six here plus Timberclaw, which Boss1 already measured.
  const t2 = [...DUNGEON_DEFS.values()].filter((d) => d.biomeTier === 2);
  const live = new Set(t2.map((d) => d.boss.bossId));
  const screened = new Set([...BOSS2_BOSSES.map((b) => b.bossId), BOSS1_TIMBERCLAW_BOSS_ID]);
  assert.deepEqual([...live].sort(), [...screened].sort(),
    `T2 dungeon roster drift: live ${[...live].sort().join(',')} vs screened ${[...screened].sort().join(',')}`);
  assert(!live.has('void-overlord'), 'the deprecated Void Overlord is not a T2 dungeon boss');

  for (const b of BOSS2_BOSSES) {
    const def = t2.find((d) => d.nodeId === b.nodeId);
    assert(def, `no T2 dungeon def for ${b.nodeId}`);
    assert.equal(def.boss.bossId, b.bossId, `${b.name}: dungeon boss drift`);
    assert.equal(NODE_BIOMES[b.nodeId]?.isDungeon, true, `${b.name}: node is not a dungeon`);
    assert.equal(NODE_BIOMES[b.nodeId]?.biomeTier, BOSS2_TIER, `${b.name}: node tier drift`);
    assert.equal(NODE_BIOMES[b.nodeId]?.biomeGroup, b.role, `${b.name}: biome group drift`);

    const m = MONSTER_DATABASE.get(b.bossId);
    assert(m?.isBoss, `${b.bossId} missing or is not a boss`);
    assert.equal(m.stats.hp, b.bossStats.hp, `${b.name}: boss hp drift`);
    assert.equal(m.stats.attack, b.bossStats.attack, `${b.name}: boss attack drift`);
    assert.equal(m.stats.plating, b.bossStats.plating, `${b.name}: boss plating drift`);
    assert.equal(m.stats.damageReduction, b.bossStats.damageReduction, `${b.name}: boss dr drift`);

    // The declared escorts must be exactly what the script spawns, and
    // `summonsNothing` must follow from that rather than being asserted separately.
    const summoned = summonedSpecies((m as { bossScript?: unknown }).bossScript);
    assert.deepEqual([...summoned].sort(), Object.keys(b.escorts).sort(),
      `${b.name}: declared escorts must be exactly the script's spawn-adds species`);
    assert.equal(b.summonsNothing, summoned.size === 0,
      `${b.name}: summonsNothing must follow from the script, not be declared independently`);
    for (const [id, want] of Object.entries(b.escorts)) {
      const e = MONSTER_DATABASE.get(id);
      assert(e, `${b.name}: escort ${id} missing`);
      assert.equal(e.stats.hp, want.hp, `${b.name}: ${id} hp drift`);
      assert.equal(e.stats.attack, want.attack, `${b.name}: ${id} attack drift`);
    }

    // Mechanics live in `bossPattern` as well as `bossScript`, and a screen that
    // reads only one of them mis-describes what it measured.
    const pattern = (m as { bossPattern?: { id: string; steps: { kind: string }[] } }).bossPattern;
    assert.equal(pattern?.id ?? null, b.patternId, `${b.name}: boss pattern drift`);
    const conceals = (pattern?.steps ?? []).some((step) => step.kind === 'conceal');
    assert.equal(b.conceals, conceals,
      `${b.name}: concealment must follow from the pattern's steps, not be declared independently`);
    // Every one of the six must run SOMETHING, or it is a bare statline and the
    // report should say so rather than the screen discovering it after 36 fights.
    assert(pattern !== undefined || (m as { bossScript?: unknown }).bossScript !== undefined,
      `${b.name}: neither a boss script nor a boss pattern — a bare statline`);
  }
}
