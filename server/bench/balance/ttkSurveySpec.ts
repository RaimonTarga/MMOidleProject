import { applyProgressionSnapshot, snapshotReceipts, type ProgressionSnapshot } from './progressionSnapshot';
import assert from 'node:assert/strict';
import { requiredBiomeLevelForUpgrade, upgradeCeilingFromGlobalMastery, globalMastery, ITEM_DATABASE, RECIPE_DATABASE, NODE_BIOMES, RUNE_RECIPE_DATABASE,
  isRuneRecipeUnlocked, composePlayerView } from '@mmo-idle/shared';
import { materializeBot, BENCH_BOT_ID } from './botFactory';
import { validateBuild } from '../../../bot/src/loadout/loadout';
import { recalculatePlayerEntityStats } from '../../src/ecs/playerEntityFormulas';
import { syncArchetypeSlices } from '../../src/ecs/archetypeSliceSync';
import { refillBarrier } from '../../src/systems/defense/barrier/barrier';
import { setAbilityLoadout } from '../../src/systems/player/economy/abilityCrafting';
import type { World } from '../../src/world/World';
import type { BuildSpec } from './types';
import type { AttunedAbilities, EquippedRule } from '@mmo-idle/shared';

export const SURVEY_CLASSES = [
  { name: 'striker', prefix: 'cadence', melee: true, weapons: ['flash-rapier','gale-needle','volcanic-cinderlash'] },
  { name: 'squire', prefix: 'cooldown', melee: true, weapons: ['heavy-hammer','quake-hammer','mountain-avalanche-maul'] },
  { name: 'apprentice', prefix: 'dot', melee: false, weapons: ['chaotic-axe','ruinous-axe','cave-cataclysm-axe'] },
  { name: 'slinger', prefix: 'reload', melee: false, weapons: ['ashbrand-blade','jungle-stinger-rapier','jungle-venomthorn-rapier'] },
  { name: 'conduit', prefix: 'summoner', melee: false, weapons: ['chaotic-axe','ruinous-axe','cave-cataclysm-axe'] },
  { name: 'spirit', prefix: 'energy', melee: false, weapons: ['chaotic-axe','ruinous-axe','cave-cataclysm-axe'] },
] as const;
export const SURVEY_SEEDS = [173, 947, 2027] as const;
export interface SurveyCell { rites?: string[]; progressionSnapshot?: ProgressionSnapshot; id: string; className: string; tier: number; role: string; nodeId: string; alternate: boolean; build: BuildSpec; technique?: 'sweep' | 'slam';
  /**
   * Stance to attune. OMITTED inherits the preparation default (Offensive from
   * tier 2). Explicit `null` is a different statement -- it means the package
   * runs NO stance on purpose -- and is honoured rather than defaulted, so a
   * neutral package cannot be silently read as an Offensive one.
   */
  stance?: string | null;
  /** Additional legally learned postures reserved for native Rune switching. */
  additionalStances?: string[]; orbit?: boolean; focusElites?: boolean;
  /**
   * Item upgrade level to equip at. Omitted keeps the long-standing +5 bench
   * default. Durability32's T1 Mountain block uses +0 for its first-arrival
   * preparation context, because the durability factory's +5 kit is not what a
   * character actually owns when it first walks into Mountain.
   */
  upgradeLevel?: number;
  /**
   * Guard abilities to attune instead of the tier default. Durability33's
   * Mountain-entry context uses this: the shipped T1 route has learned Second
   * Wind, Cleanse and Brace by the time it first travels to Mountain, and Brace
   * is the mitigation that Power Shot's counterplay actually depends on.
   * Legality is still enforced by setAbilityLoadout and validateBuild.
   */
  guards?: string[];
  /**
   * Target a DUNGEON node. Ordinary survey cells fight an open node, so this
   * defaults to false and every existing cell keeps its exact contract. The boss
   * screen sets it: a dungeon target is what makes `activateDungeonAltar` /
   * `ensureDungeon` state reachable, and fighting a dungeon node as though it
   * were open is precisely how `--mode boss` ended up measuring only guards.
   */
  isDungeon?: boolean;
  /**
   * Explicit ability loadout, replacing the derived technique/guard defaults.
   *
   * The defaults express ONE technique plus a fixed guard pair, which cannot state
   * a historical package that ran a different technique and a different guard pair.
   * When set, it is used verbatim and still passes through `setAbilityLoadout` and
   * `validateBuild`, so an illegal RP total fails exactly as before.
   */
  abilities?: AttunedAbilities;
  /**
   * Explicit rune rules, replacing the derived five-rule policy. An EMPTY array is
   * meaningful and is honoured: it means the package runs no behaviour rules at all,
   * which is what the legacy bench bot actually does. `undefined` keeps the default.
   *
   * Rules cost RP alongside abilities and the stance, so a cell that sets this must
   * set `abilities` to a package the combined budget actually admits -- do not pair
   * explicit rules with a 30-RP ability set and expect it to pass.
   */
  runeRules?: EquippedRule[]; }
export const SURVEY_CELLS: SurveyCell[] = [1,2,3].flatMap(tier =>
  ['solo','small-group','swarm'].flatMap(role => SURVEY_CLASSES.flatMap(c => {
    const group = role === 'solo' ? 'cave' : role === 'small-group' ? 'mountain' : tier === 3 ? 'volcanic' : 'plains';
    const nodeId = `node-t${tier}-${group}-${role === 'solo' ? '02' : role === 'small-group' ? '04' : '03'}`;
    return (tier >= 2 && ['conduit','slinger'].includes(c.name) ? [false,true] : [false]).map(alternate => {
      const weapon = alternate ? c.name === 'conduit' ? ['jungle-stinger-rapier','jungle-venomthorn-rapier'][tier-2]
        : ['swamp-mirebrand','swamp-blightbrand'][tier-2] : c.weapons[tier-1];
      const id = `ttk-t${tier}-${c.name}-${role}-${alternate ? 'weapon-alt' : 'baseline'}`;
      return { id, tier, role, nodeId, className: c.name, alternate, build: {
        id, classRoot: `${c.prefix}-root`, contentTier: tier, playerTier: tier, gearTier: tier,
        skillPath: [`${c.prefix}-root`, ...(tier >= 2 ? [`${c.prefix}-balanced`] : []),
          ...(tier >= 3 ? [`${c.prefix}-range-${c.melee ? 'close' : 'mid'}`] : [])],
        gearItemIds: { weapon, armor: `${group}-vest-t${tier}`, recovery: `${group}-charm-t${tier}`,
          mobility: `mountain-boots-t${tier}`, ...(tier >= 2 ? { core: 'core-tempered' } : {}) },
      } };
    });
  })));

/**
 * How a cell's OPTIONAL fields become the package preparation will actually apply.
 *
 * This exists because Boss1's Sovereign block failed its own declared-versus-applied
 * check on twelve completed fights. The receipt serialized the cell's RAW optional
 * fields -- `stance: null`, `runeRules: null`, `abilities: null` -- while
 * `prepareSurveyBot` resolved and applied Offensive, the five-rule survey policy and
 * the tier ability set. Nothing was wrong with the bot; the declaration simply was
 * not the thing being declared.
 *
 * So the defaults live HERE, once, and both preparation and the receipt read them.
 * A declaration is then computable from the cell ALONE, before any fight -- it is
 * never copied back from the observed bot, which would make the check vacuous. A
 * genuine mismatch (a stance that failed to attune, a rule dropped by legality, an
 * ability budget that did not take) still shows up as a divergence.
 *
 * `sources` keeps the three cases apart, because they are different statements:
 *   - `explicit`             the cell said so, including an empty rule array
 *   - `preparation-default`  the cell omitted it and inherited this resolution
 *   - `tier-none`            the tier admits no stance at all (tier 1)
 */
export type PackageFieldSource = 'explicit' | 'preparation-default' | 'tier-none';
export interface ResolvedSurveyPackage {
  stance: string | null;
  abilities: AttunedAbilities;
  runeRules: EquippedRule[];
  upgradeLevel: number;
  sources: { stance: PackageFieldSource; abilities: PackageFieldSource; runeRules: PackageFieldSource; upgradeLevel: PackageFieldSource };
}
export function resolveSurveyPackage(cell: SurveyCell): ResolvedSurveyPackage {
  const c = SURVEY_CLASSES.find((x) => x.name === cell.className);
  assert(c, `${cell.id}: unknown class ${cell.className}`);
  // `??` cannot express an intentional neutral stance, because it swallows null
  // alongside undefined. Only an OMITTED field may inherit the default.
  const stance = cell.tier >= 2 ? (cell.stance !== undefined ? cell.stance : 'offensive-stance') : null;
  // An EMPTY rule array is a real package (the legacy bench bot equips none) and is
  // honoured; only an omitted field falls through to the five-rule policy.
  const runeRules = cell.runeRules ?? [
    ...(cell.focusElites ? [{conditionId:'in-combat',actionId:'focus-elites'}] : []),
    { conditionId:'always', actionId:'auto-path-enemy' },
    { conditionId:'inside-telegraph', actionId:'step-back' },
    ...((cell.orbit ?? !c.melee) ? [{ conditionId:'in-combat', actionId:'orbit' }] : []),
    { conditionId:'always', actionId:'avoid-hazards' },
    { conditionId:'always', actionId:'wait-for-regen' },
  ];
  const abilities = cell.abilities ?? {
    techniques: [...(cell.tier >= 3 ? ['frenzy'] : []), cell.technique ?? 'sweep'],
    guards: cell.guards ?? (cell.tier === 1 ? ['second-wind'] : ['second-wind','cleanse']),
  };
  return {
    stance, abilities, runeRules, upgradeLevel: cell.upgradeLevel ?? 5,
    sources: {
      stance: cell.tier < 2 ? 'tier-none' : cell.stance !== undefined ? 'explicit' : 'preparation-default',
      abilities: cell.abilities !== undefined ? 'explicit' : 'preparation-default',
      runeRules: cell.runeRules !== undefined ? 'explicit' : 'preparation-default',
      upgradeLevel: cell.upgradeLevel !== undefined ? 'explicit' : 'preparation-default',
    },
  };
}

export function prepareSurveyBot(world: World, cell: SurveyCell, pos: {x:number;y:number}) {
  assert(NODE_BIOMES[cell.nodeId]?.biomeTier === cell.tier);
  for (const id of Object.values(cell.build.gearItemIds)) {
    const recipe = RECIPE_DATABASE.get(id!);
    assert(recipe && ITEM_DATABASE.has(id!), `Missing recipe/item ${id}`);
    assert(recipe.tier <= cell.tier, `Future item ${id}`);
  }
  // ONE resolution, shared with the receipt: the bot is prepared from exactly the
  // package a declaration can be computed from before the fight.
  const declared = resolveSurveyPackage(cell);
  const bot = materializeBot(world, cell.build, {nodeId:cell.nodeId,biomeGroup:NODE_BIOMES[cell.nodeId].biomeGroup,contentTier:cell.tier,isDungeon:cell.isDungeon ?? false}, pos, BENCH_BOT_ID, declared.upgradeLevel);
  if(cell.progressionSnapshot) { snapshotReceipts.set(bot,applyProgressionSnapshot(bot,cell)); world.fixedBiomeMasteryPlayers.add(bot.isPlayer.id); }
  const p = bot.tracksProgression;
  for(const id of Object.values(cell.build.gearItemIds)) {
    const recipe=RECIPE_DATABASE.get(id!)!;
    assert((p.biomeLevel[recipe.recipeGroup]??0)>=recipe.requiredBiomeLevel, `Unreachable gear ${id}`);
    const plus=bot.holdsInventory.itemUpgrades[id!]??0;
    assert(plus<=upgradeCeilingFromGlobalMastery(globalMastery(p.biomeLevel),recipe.tier), `Global upgrade gate ${id}`);
    // requiredBiomeLevelForUpgrade expects a TARGET plus of 1 or more (it indexes
    // upgrades[target-1] and returns a 999 sentinel otherwise). Holding an item at
    // +0 is free, so only an actual upgrade is gated.
    assert(plus===0||(p.biomeLevel[recipe.recipeGroup]??0)>=requiredBiomeLevelForUpgrade(ITEM_DATABASE.get(id!)!,plus), `Biome upgrade gate ${id}`);
  }
  p.skillPoints = 0; // Factory grants unlock scaffolding; none survives into measurement.
  p.equippedRites = [...(cell.rites ?? [])];
  p.attunedAbilities = { techniques: [], guards: [] };
  const stance = declared.stance;
  p.attunedStances = [...(stance ? [stance] : []), ...(cell.additionalStances ?? [])];
  for (const id of p.attunedStances) assert(p.knownStances.includes(id), `Unlearned stance ${id}`);
  p.equippedStances = { default: stance };
  p.activeStance = stance;
  const c = SURVEY_CLASSES.find(c=>c.name===cell.className)!;
  const rules = declared.runeRules;
  for (const r of RUNE_RECIPE_DATABASE.values()) if (r.runeId && rules.some(rule=>rule.actionId===r.runeId)) {
    assert(isRuneRecipeUnlocked(r,p), `Unreachable rune ${r.id}`);
    if(!p.runesOwned.includes(r.runeId)) p.runesOwned.push(r.runeId);
  }
  p.runesEquipped = rules;
  const abilities = declared.abilities;
  assert(setAbilityLoadout(world,bot,abilities).success, `${cell.id}: illegal ability budget`);
  recalculatePlayerEntityStats(world,bot); syncArchetypeSlices(world,bot);
  bot.hasHealth.hp = bot.hasHealth.maxHp; refillBarrier(world,bot);
  const view = composePlayerView(bot)!;
  assert.deepEqual(validateBuild({abilities, runeRules:rules, stances:{attuned:p.attunedStances,default:stance},rites:[]},view), [], cell.id);
  // Derived from the cell's OWN skill path rather than hardcoded to 'balanced'.
  // The assertion's intent is "the build that was declared is the build that
  // materialised"; every existing cell declares `-balanced`, so this is identical
  // for them, while a historical package on `-heavy` can now be stated at all.
  // The T3 suffix nodes (`...-t3-a`) and range nodes (`-range-mid`) do not match.
  const declaredVariant = cell.build.skillPath
    .find(id => /-(light|balanced|heavy)$/.test(id))?.split('-').pop() ?? null;
  assert.equal(view.selectedSubVariant, cell.tier >= 2 ? declaredVariant : null);
  assert.equal(view.selectedRange, cell.build.skillPath.find(id => id.includes('-range-')) ?? null);
  return {bot, view};
}
