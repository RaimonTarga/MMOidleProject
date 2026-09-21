import assert from 'node:assert/strict';
import { DUNGEON_DEFS, MONSTER_DATABASE, NODE_BIOMES, runicPointLoadoutCost, runeBudgetForGlobalMastery } from '@mmo-idle/shared';
import { SURVEY_CLASSES, resolveSurveyPackage, type SurveyCell } from './ttkSurveySpec';
import type { Night5Cell } from './night5Spec';
import type { PlayerEntity } from '../../src/ecs/entity';
import { getHitboxDef } from '../../src/hitbox/cache';

/** Opening screen only. No historical treatment imports or installers. */
export const FAST_PASS_SEED = 101003;
export const FAST_PASS_CAP_MS = 300000;
const settings = [
  { tier: 2, farm: 'node-t2-plains-03', boss: 'stoneplate-juggernaut' },
  { tier: 3, farm: 'node-t3-volcanic-03', boss: 'crag-gorged-horn-behemoth' },
  { tier: 4, farm: 'node-t4-graveyard-03', boss: 'iron-crest-titan' },
];
const t4Weapons: Record<string, string> = {
  striker: 'volcanic-eruption-lash', squire: 'mountain-warmaul', apprentice: 'graveyard-plague-axe',
  slinger: 'jungle-deathfang-rapier', conduit: 'jungle-deathfang-rapier', spirit: 'volcanic-eruption-lash',
};
export const FAST_PASS_BOSSES = settings.map(s => {
  const d = [...DUNGEON_DEFS.values()].find(d => d.boss.bossId === s.boss);
  assert(d && d.biomeTier === s.tier, `Missing T${s.tier} boss ${s.boss}`);
  return { ...s, nodeId: d.nodeId };
});
export const FAST_PASS_CELLS: Night5Cell[] = FAST_PASS_BOSSES.flatMap(s => SURVEY_CLASSES.flatMap(c => {
  // Keep equipment and behavior identical across the two settings. Conduit uses
  // a fast weapon from T2 onward; its formation delivers Techniques, not owner swings.
  const weapon = s.tier === 4 ? t4Weapons[c.name] : c.name === 'conduit'
    ? (s.tier === 2 ? 'jungle-stinger-rapier' : 'jungle-venomthorn-rapier') : c.weapons[s.tier - 1];
  const armor = c.melee || c.name === 'conduit' ? 'mountain' : 'jungle';
  return (['farm', 'boss'] as const).map(setting => {
    const id = `pfp-t${s.tier}-${c.name}-${setting}`;
    return {
      id, className: c.name, tier: s.tier, role: setting, alternate: false,
      nodeId: setting === 'farm' ? s.farm : s.nodeId, isDungeon: setting === 'boss',
      treatment: 'authored-source', targetTypes: setting === 'boss' ? [s.boss] : [],
      upgradeLevel: 5, stance: 'offensive-stance',
      // Built-in triggers and production formation/DoT/clip adapters do delivery.
      abilities: { techniques: s.tier === 2 ? ['expose-weakness'] : s.tier === 3 ? ['frenzy', 'expose-weakness'] : ['frenzy', 'expose-weakness', 'sweep'],
        guards: s.tier === 2 ? ['second-wind', 'brace'] : ['second-wind', 'brace', 'cleanse'] },
      runeRules: [
        { conditionId: 'always', actionId: 'auto-path-enemy' },
        { conditionId: 'inside-telegraph', actionId: 'step-back' },
        ...(!c.melee ? [{ conditionId: 'in-combat', actionId: 'orbit' }] : []),
        { conditionId: 'always', actionId: 'avoid-hazards' },
        { conditionId: 'always', actionId: 'wait-for-regen' },
      ],
      build: { id, classRoot: `${c.prefix}-root`, contentTier: s.tier, playerTier: s.tier, gearTier: s.tier,
        skillPath: [`${c.prefix}-root`, `${c.prefix}-balanced`,
          ...(s.tier >= 3 ? [`${c.prefix}-range-${c.melee ? 'close' : 'mid'}`] : []),
          ...(s.tier === 4 ? [`${c.prefix}-balanced-t3-a`] : [])],
        gearItemIds: { weapon, armor: `${armor}-vest-t${s.tier}`, recovery: `mountain-charm-t${s.tier}`,
          mobility: `mountain-boots-t${s.tier}`, core: 'core-tempered',
          ...(s.tier === 4 ? { relic: 'relic-colossus-heart' } : {}) },
      },
    };
  });
}));
export const FAST_PASS_BLOCKS = Object.fromEntries(settings.flatMap(s => ['farm', 'boss'].map(setting => {
  const cells = FAST_PASS_CELLS.filter(c => c.tier === s.tier && c.role === setting);
  return [`t${s.tier}-${setting}`, { cells, durationMs: FAST_PASS_CAP_MS,
    pilotIds: cells.filter(c => c.className === (setting === 'farm' ? 'conduit' : 'squire')).map(c => c.id) }];
})));

export function assertFastPassDefinitions(): void {
  assert.equal(FAST_PASS_CELLS.length, 36);
  assert.equal(new Set(FAST_PASS_CELLS.map(c => c.id)).size, 36);
  for (const c of FAST_PASS_CELLS) {
    assert.equal(NODE_BIOMES[c.nodeId]?.biomeTier, c.tier);
    assert.equal(!!NODE_BIOMES[c.nodeId]?.isDungeon, c.isDungeon);
    for (const id of c.targetTypes) assert(MONSTER_DATABASE.get(id)?.isBoss);
  }
}

/** Complete zero-tick receipt, shared by ordinary and boss paths. */
export function fastPassReadback(cell: SurveyCell, bot: PlayerEntity, globalMastery: number) {
  const p = bot.tracksProgression, declared = resolveSurveyPackage(cell);
  assert.equal(p.skillPoints, 0);
  assert.deepEqual(bot.usesSkills.unlockedSkills, cell.build.skillPath);
  for (const [slot, id] of Object.entries(cell.build.gearItemIds)) {
    assert.equal(bot.holdsInventory.equipment[slot as keyof typeof bot.holdsInventory.equipment], id);
  }
  assert.deepEqual(p.attunedAbilities, declared.abilities);
  assert.deepEqual(p.runesEquipped, declared.runeRules);
  assert.equal(p.activeStance, declared.stance);
  const cost = runicPointLoadoutCost({ rules: p.runesEquipped, abilities: p.attunedAbilities,
    stances: p.attunedStances ?? [], rites: p.equippedRites });
  const budget = runeBudgetForGlobalMastery(globalMastery);
  assert(cost <= budget);
  return { declared, skillPath: [...bot.usesSkills.unlockedSkills], equipment: structuredClone(bot.holdsInventory),
    mastery: { biomeLevel: { ...p.biomeLevel }, globalMastery }, runicPoints: { budget, cost, unused: budget - cost,
      reason: 'Fixed practical package; headroom is deliberate, not an optimal-loadout claim.' },
    access: 'Synthetic mature tier; capped reachable biomes, declared gear only; no acquisition or guardian evidence.',
    skillPoints: p.skillPoints, knownAbilities: [...p.knownAbilities], rites: [...p.equippedRites] };
}

export function assertFastPassHitboxes(entities: Iterable<{ hasHitbox?: { frameName?: string | null } }>) {
  for (const e of entities) {
    const frame = e.hasHitbox?.frameName;
    assert(frame && getHitboxDef(frame)?.rects.length, `Missing baked hitbox: ${frame}`);
  }
}
