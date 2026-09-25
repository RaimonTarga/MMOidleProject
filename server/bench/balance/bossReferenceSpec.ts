import assert from 'node:assert/strict';
import {
  DUNGEON_DEFS, MONSTER_DATABASE, NODE_BIOMES,
  runicPointLoadoutCost, runeBudgetForGlobalMastery,
  type AttunedAbilities, withReferenceAbilityWiring,
} from '@mmo-idle/shared';
import { enumerateBuildsForContentTier } from './progression';
import { canonicalLoadout } from './botFactory';
import type { Night5Cell } from './night5Spec';

/**
 * Boss reference check — TWO cases, one boss, one skill path, one seed.
 *
 * The question is narrow and is NOT about boss balance: does the current boss
 * runner reproduce a boss clear that actually happened, when it is given the
 * package that achieved it?
 *
 * On 2026-09-13, at revision 61080e54, the V1i Spirit route beat Apex Timberclaw
 * 2/2 on the live bot harness with player HP never below 41.9% of a 231 pool. The
 * boss and its script are BYTE-IDENTICAL at HEAD and it summons nothing. Against
 * that, `bench/bossExam.ts` reported 0 wins in 126 fights at content tier 2. Those
 * two statements are about different PACKAGES, not different bosses.
 *
 * So both cases run the same boss, the same encounter initialization, the same
 * declared seed and the same 300 s cap, and differ only in the complete package:
 *
 *   A  the historical successful package, as recovered from the V1i route
 *   B  the legacy benchmark package for the SAME skill path
 *
 * These are COMPLETE packages and are never mixed. A package's rune rules, ability
 * set and stance all draw on one RP budget, so lifting one component out of B and
 * dropping it into A produces a loadout that is simply illegal -- 30 RP of abilities
 * and stance leaves nothing for behaviour rules. Component-removal arms were
 * deliberately NOT built, and nothing here may be made legal by quietly changing
 * another input.
 *
 * Interpretation is bounded in advance. A successful Case A establishes a usable
 * current reference FOR THIS BOSS AND THIS BUILD -- not harness correctness in
 * general and not a boss balance result. If A wins and B loses, the explanation
 * stops at package level; ranking individual causes is not required and is not
 * this check's job.
 */

export const BOSSREF_BOSS_ID = 'apex-timberclaw';
export const BOSSREF_NODE_ID = 'node-t2-forest-dungeon';
export const BOSSREF_TIER = 2;
export const BOSSREF_ROLE = 'forest';
export const BOSSREF_CLASS = 'spirit';

/**
 * ONE declared seed, deliberately.
 *
 * Apex Timberclaw has no adds, a fixed spawn, and evasion is deterministic in this
 * codebase; two seeds against it were measured producing byte-identical outcomes.
 * A second seed would add a fight and no information.
 */
export const BOSSREF_SEEDS = [96011] as const;

/** 300 s, as specified. The V1i boss phase itself ran 25.0-27.0 s. */
export const BOSSREF_CAP_MS = 300000;

/** The recovered V1i skill path: Spirit on the `energy-heavy` frame. */
export const BOSSREF_SKILL_PATH = ['energy-root', 'energy-heavy'] as const;

/** Apex Timberclaw's authored block, pinned so a silent edit invalidates the check. */
export const BOSSREF_BOSS_STATS = { hp: 3750, attack: 44, plating: 0, damageReduction: 0 };

/**
 * Case A — the complete historical successful package.
 *
 * Recovered from `bot/src/routes/campaignT2Boss.ts`
 * (`spirit-campaign-forest-ruinous-axe-t2`) and the V1i report's Phase C:
 * Ruinous Axe +5, Cave Vest +5, Mountain Charm +5, Plains Boots +5, Tempered Core,
 * Expose Weakness, Second Wind, Brace, defensive stance, and the ordered
 * orbit / Step Back / avoid-hazards / wait-for-regen rules.
 *
 * The kit is deliberately MIXED-BIOME. That is what was actually worn.
 */
export const BOSSREF_A_GEAR = {
  weapon: 'ruinous-axe', armor: 'cave-vest-t2', recovery: 'mountain-charm-t2',
  mobility: 'plains-boots-t2', core: 'core-tempered',
} as const;
export const BOSSREF_A_ABILITIES: AttunedAbilities = {
  techniques: ['expose-weakness'], guards: ['second-wind', 'brace'],
};
export const BOSSREF_A_STANCE = 'defensive-stance';
/** `t2Runes("ranged-orbit")`, in the route's order. Step Back must precede orbit. */
export const BOSSREF_A_RULES = [
  { conditionId: 'always', actionId: 'auto-path-enemy' },
  { conditionId: 'inside-telegraph', actionId: 'step-back' },
  { conditionId: 'in-combat', actionId: 'orbit' },
  { conditionId: 'always', actionId: 'avoid-hazards' },
  { conditionId: 'always', actionId: 'wait-for-regen' },
];

/**
 * Case B — the complete legacy benchmark package for the SAME skill path.
 *
 * Gear is what `resolveGearLoadout` picks for this root at forest T2, abilities are
 * `botFactory`'s canonical round-robin at playerTier 2, the stance is its
 * unconditional `offensive-stance`, and there are NO rune rules -- because the
 * legacy bot has none. All four are asserted against their live sources below, so
 * this stays the real legacy package rather than a remembered copy of it.
 */
export const BOSSREF_B_GEAR = {
  weapon: 'gale-needle', armor: 'forest-vest-t2', recovery: 'forest-charm-t2',
  // Force since the 2026-09-25 defense rebudget removed its HP penalty; the legacy
  // scorer now prefers it over Tempered.
  mobility: 'forest-boots-t2', core: 'core-force',
} as const;
export const BOSSREF_B_STANCE = 'offensive-stance';
/** Empty is meaningful: the legacy bot equips no behaviour rules at all. */
export const BOSSREF_B_RULES: { conditionId: string; actionId: string }[] = [];

const cell = (
  id: string,
  gear: Record<string, string>,
  abilities: AttunedAbilities,
  stance: string,
  runeRules: { conditionId: string; actionId: string }[],
): Night5Cell => ({
  id,
  nodeId: BOSSREF_NODE_ID,
  tier: BOSSREF_TIER,
  role: BOSSREF_ROLE,
  className: BOSSREF_CLASS,
  alternate: false,
  isDungeon: true,
  treatment: id.includes('-a-') ? 'historical-success' : 'legacy-benchmark',
  targetTypes: [BOSSREF_BOSS_ID],
  stance,
  abilities,
  runeRules,
  // +5 everywhere. Every T2 item authors exactly 5 upgrade steps, so the legacy
  // bench default of "fully upgraded" IS +5 -- upgrade level is not a difference
  // between these two cases and must not be introduced as one.
  upgradeLevel: 5,
  build: {
    id,
    classRoot: 'energy-root',
    contentTier: BOSSREF_TIER, playerTier: BOSSREF_TIER, gearTier: BOSSREF_TIER,
    skillPath: [...BOSSREF_SKILL_PATH],
    gearItemIds: { ...gear },
  },
});

export const BOSSREF_CELLS: Night5Cell[] = [
  cell('bossref-timberclaw-a-historical', BOSSREF_A_GEAR, BOSSREF_A_ABILITIES,
    BOSSREF_A_STANCE, BOSSREF_A_RULES),
  cell('bossref-timberclaw-b-legacy', BOSSREF_B_GEAR,
    canonicalLoadout(BOSSREF_TIER).attunedAbilities, BOSSREF_B_STANCE, BOSSREF_B_RULES),
];

export const BOSSREF_BLOCKS: Record<string, { cells: Night5Cell[]; durationMs: number; pilotIds: string[] }> = {
  reference: {
    cells: BOSSREF_CELLS,
    durationMs: BOSSREF_CAP_MS,
    // Qualification verifies setup on BOTH declared cells and fights neither. There
    // is no pilot fight: an extra fight here would be an undeclared observation.
    pilotIds: [],
  },
};

/** The check installs nothing; the boss is fought at authored source values. */
export function installBossReferenceTreatment(): null { return null; }

/** RP cost of a case, on the same budget the bot actually has. */
export function bossReferenceRpCost(c: Night5Cell): number {
  return runicPointLoadoutCost({
    rules: withReferenceAbilityWiring((c.runeRules ?? []) as never, c.abilities!),
    abilities: c.abilities!,
    stances: c.stance ? [c.stance] : [],
    rites: [],
  });
}

/** Fail loudly at load time if any frozen identity or source package has drifted. */
export function assertBossReferenceDefinitions(): void {
  const boss = MONSTER_DATABASE.get(BOSSREF_BOSS_ID);
  assert(boss?.isBoss, `${BOSSREF_BOSS_ID} missing or not a boss`);
  assert.equal(boss.stats.hp, BOSSREF_BOSS_STATS.hp, 'boss hp drift');
  assert.equal(boss.stats.attack, BOSSREF_BOSS_STATS.attack, 'boss attack drift');
  assert.equal(boss.stats.plating, BOSSREF_BOSS_STATS.plating, 'boss plating drift');
  assert.equal(boss.stats.damageReduction, BOSSREF_BOSS_STATS.damageReduction, 'boss dr drift');

  // It summons nothing: there is no escort receipt question on this boss, and any
  // non-boss body in the arena is node population, not an add.
  const b = boss as { bossScript?: { phases?: { actions?: { type: string }[] }[] }; raisesDead?: unknown };
  const spawns = (b.bossScript?.phases ?? []).flatMap(p => p.actions ?? [])
    .filter(a => a.type === 'spawn-adds');
  assert.equal(spawns.length, 0, 'Apex Timberclaw is expected to summon nothing');
  assert.equal(b.raisesDead ?? null, null, 'Apex Timberclaw is expected to raise nothing');

  const def = [...DUNGEON_DEFS.values()].find(d => d.nodeId === BOSSREF_NODE_ID);
  assert(def, `no dungeon def for ${BOSSREF_NODE_ID}`);
  assert.equal(def.boss.bossId, BOSSREF_BOSS_ID, 'dungeon boss drift');
  assert.equal(def.biomeTier, BOSSREF_TIER, 'dungeon tier drift');
  assert.equal(NODE_BIOMES[BOSSREF_NODE_ID]?.isDungeon, true, 'node is not a dungeon');

  assert.equal(BOSSREF_CELLS.length, 2, 'exactly two cases');
  assert.equal(BOSSREF_SEEDS.length, 1, 'one declared seed');
  for (const c of BOSSREF_CELLS) {
    assert.equal(c.nodeId, BOSSREF_NODE_ID, `${c.id}: node drift`);
    assert.equal(c.isDungeon, true, `${c.id}: must target the dungeon node`);
    assert.equal(c.upgradeLevel, 5, `${c.id}: upgrade level must match across cases`);
    assert.deepEqual([...c.build.skillPath], [...BOSSREF_SKILL_PATH],
      `${c.id}: both cases must run the recovered V1i skill path`);
  }

  // Case B must remain the LIVE legacy package, not a remembered copy of it.
  const legacyBuild = enumerateBuildsForContentTier(BOSSREF_TIER, BOSSREF_ROLE)
    .find(x => JSON.stringify(x.skillPath) === JSON.stringify([...BOSSREF_SKILL_PATH]));
  assert(legacyBuild, 'the legacy enumerator no longer produces this skill path');
  assert.deepEqual({ ...BOSSREF_B_GEAR }, { ...legacyBuild.gearItemIds },
    'Case B gear no longer matches what the legacy scorer picks');
  const canonical = canonicalLoadout(BOSSREF_TIER);
  assert.deepEqual(BOSSREF_CELLS[1]!.abilities, canonical.attunedAbilities,
    'Case B abilities no longer match the canonical bench loadout');
  assert.equal(canonical.equippedStances.default, BOSSREF_B_STANCE,
    'Case B stance no longer matches the canonical bench stance');
  assert.equal(BOSSREF_B_RULES.length, 0, 'the legacy package equips no rune rules');

  // Both packages must fit the SAME budget. This is the guard against quietly
  // making an illegal hybrid legal by changing another input.
  const budget = runeBudgetForGlobalMastery(72);
  for (const c of BOSSREF_CELLS) {
    const cost = bossReferenceRpCost(c);
    assert(cost <= budget, `${c.id}: package costs ${cost} RP against a ${budget} budget`);
  }
}
