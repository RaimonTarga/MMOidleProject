import { BIOME_DATABASE, type BiomeDefinition } from '../biomeDatabase';
import { ITEM_DATABASE } from '../itemDatabase';
import { MONSTER_DATABASE } from '../monsterDatabase';
import { SKILL_TREE, type SkillNode, type SubVariant } from '../skillTree';
import { emptyEquipment, type ItemDefinition } from '../items';
import type { MonsterDefinition } from '../data/monsters/types';
import type { CombatArchetype } from '../types/combat';
import { GAME_CONFIG } from '../config/gameConfig';
import { estimateMonsterHitDamage } from './combatEstimates';
import { estimatePlayerDps, type DpsEstimateInput } from './dpsEstimate';
import { getMaxUpgrade } from './itemUpgrades';
import { recalculatePlayerStats, type PlayerStatsTarget } from './stats';
import { resolveSummonerProfile } from './summonerProfile';
import { T1_STARTER_PROGRESSION, type BalanceProgressionPolicy } from '../data/balanceProgression';
import type { BalanceBiomeAuthoringBrief } from '../data/balanceProgression';

export type BalanceLabThreatStatus = 'Safe' | 'Risky' | 'Blocked';
export type BalanceLabDamageType = 'Direct' | 'DoT' | 'Mixed';

export interface BalanceLabReferenceProfile {
  biomeTier: number;
  label: string;
  gearLabel: string;
  maxHp: number;
  plating: number;
  damageReduction: number;
  dodgeRate: number;
  evadeMitigation: number;
  planningDps: number;
  buildSamples: number;
  usedFallbackTier: boolean;
}

export interface BalanceLabBiomeRow {
  biomeTier: number;
  biomeId: string;
  biomeName: string;
  density: number | null;
  rosterSize: number;
  uniqueMonsters: number;
  threatIndex: number;
  meanHp: number;
  maxHp: number;
  meanIncomingDps: number;
  maxIncomingDps: number;
  worstSpikePctHp: number;
  worstSpikeMonster: string;
  meanEssence: number;
  meanBiomeXp: number;
  rewardThreatRatio: number;
  status: BalanceLabThreatStatus;
  deviationSignals: number;
}

export interface BalanceLabEncounterRow {
  monsterId: string;
  name: string;
  biomeId: string;
  biomeName: string;
  biomeTier: number;
  isBoss: boolean;
  isElite: boolean;
  poolWeight: number;
  role: string;
  damageType: BalanceLabDamageType;
  hp: number;
  attack: number;
  attacksPerSecond: number;
  rawDps: number;
  dotDps: number;
  spikeMultiplier: number;
  plating: number;
  damageReduction: number;
  speed: number;
  range: number;
  essence: number;
  biomeXp: number;
  catalystWeight: number;
  incomingDps: number;
  spikePctHp: number;
  playerTtlSec: number | null;
  planningTtkSec: number | null;
  status: BalanceLabThreatStatus;
  specials: string[];
}

export type BalanceLabProgressionFit = 'Locked baseline' | 'Fits declared intent' | 'Order violation' | 'Below minimum';

export interface BalanceLabProgressionRow {
  policyId: string;
  biomeTier: number;
  biomeId: string;
  biomeName: string;
  order: number;
  locked: boolean;
  previousBiomeId: string | null;
  minimumVsBaseline: number | null;
  currentVsBaseline: number;
  encounterBurdenPctHp: number;
  meanIncomingDps: number;
  meanPlanningTtkSec: number;
  worstSpikePctHp: number;
  density: number | null;
  orderPass: boolean | null;
  minimumPass: boolean | null;
  fit: BalanceLabProgressionFit;
}

export interface BalanceLabProgressionPolicyView {
  id: string;
  name: string;
  tier: number;
  status: 'draft' | 'approved';
  baselineBiomeId: string;
  assessmentMetric: 'encounter-burden-v1';
  assessmentStatus: 'analytical-proxy';
  authoringBriefs: BalanceBiomeAuthoringBrief[];
  authoringRules: string[];
  validationRules: string[];
}

export interface BalanceLabSnapshot {
  generatedAt: number;
  tiers: number[];
  referenceProfiles: BalanceLabReferenceProfile[];
  biomes: BalanceLabBiomeRow[];
  encounters: BalanceLabEncounterRow[];
  progressionPolicies: BalanceLabProgressionPolicyView[];
  progression: BalanceLabProgressionRow[];
  caveats: string[];
}

interface BuildCombo {
  classId: string;
  subVariant: SubVariant | null;
  rangeId: string | null;
  archetype: Exclude<CombatArchetype, null>;
  unlockedSkills: string[];
}

interface ReferenceProfile extends BalanceLabReferenceProfile {
  offenceSamples: DpsEstimateInput[];
}

interface Threat {
  incomingDps: number;
  spikePctHp: number;
  ttlSec: number;
  status: BalanceLabThreatStatus;
}

const ITEM_UPGRADE_LEVEL = 3;
const TUTORIAL_MONSTER_IDS = new Set(['tiny-slime']);
const TUTORIAL_WEAPON_IDS = new Set(['primordial-club']);
const OUTLIER_PCT = 0.25;

export function buildBalanceLabSnapshot(generatedAt = Date.now()): BalanceLabSnapshot {
  const tiers = reportBiomeTiers();
  const profilesByTier = new Map(tiers.map((tier) => [tier, playerProfilesForBiomeTier(tier)]));
  const encounters: BalanceLabEncounterRow[] = [];
  const biomes: BalanceLabBiomeRow[] = [];

  for (const biomeTier of tiers) {
    const profiles = profilesByTier.get(biomeTier) ?? [];
    const entry = profiles.find((profile) => profile.label.startsWith('Entry')) ?? profiles[0];
    const bossReady = profiles.find((profile) => profile.label.startsWith('Boss-ready')) ?? profiles.at(-1);
    if (!entry) continue;

    const tierBiomeDrafts = biomeGroupsAtTier(biomeTier)
      .filter((group) => group.mobs.length > 0)
      .map((group) => buildBiomeDraft(group.biome, biomeTier, group.mobs, entry));
    const tierMedianThreat = median(tierBiomeDrafts.map((row) => row.meanIncomingDps));
    const medians = {
      threat: tierMedianThreat,
      maxThreat: median(tierBiomeDrafts.map((row) => row.maxIncomingDps)),
      spike: median(tierBiomeDrafts.map((row) => row.worstSpikePctHp)),
      density: median(tierBiomeDrafts.map((row) => row.density ?? 0)),
      essence: median(tierBiomeDrafts.map((row) => row.meanEssence)),
      xp: median(tierBiomeDrafts.map((row) => row.meanBiomeXp)),
    };

    for (const draft of tierBiomeDrafts) {
      const deviationSignals = [
        deviates(draft.meanIncomingDps, medians.threat),
        deviates(draft.maxIncomingDps, medians.maxThreat),
        deviates(draft.worstSpikePctHp, medians.spike),
        deviates(draft.density ?? 0, medians.density),
        deviates(draft.meanEssence, medians.essence),
        deviates(draft.meanBiomeXp, medians.xp),
      ].filter(Boolean).length;
      biomes.push({
        ...draft,
        threatIndex: tierMedianThreat > 0 ? draft.meanIncomingDps / tierMedianThreat : 0,
        rewardThreatRatio: draft.meanIncomingDps > 0
          ? (draft.meanEssence + draft.meanBiomeXp) / draft.meanIncomingDps
          : 0,
        status: threatStatus(draft.worstSpikePctHp, entry.maxHp / Math.max(0.0001, draft.maxIncomingDps), false),
        deviationSignals,
      });
    }

    for (const group of biomeGroupsAtTier(biomeTier)) {
      const counts = countIds(group.biome.monsterPoolByTier[biomeTier] ?? []);
      for (const monster of uniqueById(group.mobs)) {
        encounters.push(buildEncounter(monster, group.biome, biomeTier, counts.get(monster.id) ?? 1, entry));
      }
      if (bossReady) {
        for (const boss of uniqueById(group.bosses)) {
          encounters.push(buildEncounter(boss, group.biome, biomeTier, 1, bossReady));
        }
      }
    }
  }

  const progressionPolicies = [T1_STARTER_PROGRESSION];
  return {
    generatedAt,
    tiers,
    referenceProfiles: [...profilesByTier.values()].flat().map(({ offenceSamples, ...profile }) => profile),
    biomes: biomes.sort((a, b) => a.biomeTier - b.biomeTier || b.threatIndex - a.threatIndex),
    encounters: encounters.sort((a, b) => a.biomeTier - b.biomeTier || a.biomeName.localeCompare(b.biomeName) || Number(a.isBoss) - Number(b.isBoss) || a.name.localeCompare(b.name)),
    progressionPolicies: progressionPolicies.map(({ steps: _steps, ...policy }) => policy),
    progression: progressionPolicies.flatMap((policy) => buildProgressionRows(policy, biomes, encounters, profilesByTier)),
    caveats: [
      // Mirrors LOADOUT_MODEL_NOTE in tools/balance-data.ts. Kept as a separate string
      // because shared/ must not import from tools/; keep the two in step.
      'Reference players carry weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. No core, relic, rune, rite, stance or ability is equipped, so these numbers are not comparable to bench output in absolute terms.',
      'Threat uses an analytical entry reference with no healing or multi-enemy pressure; use farm and fight benches for runtime outcomes.',
      'Planning TTK uses class-aware cycles but excludes abilities, movement, target-state mechanics, enemy shields, and soft caps.',
      'Threat indices and deviation signals compare siblings at the same tier. They expose drift; they are not balance targets.',
    ],
  };
}

function buildProgressionRows(
  policy: BalanceProgressionPolicy,
  biomes: BalanceLabBiomeRow[],
  encounters: BalanceLabEncounterRow[],
  profilesByTier: Map<number, ReferenceProfile[]>,
): BalanceLabProgressionRow[] {
  const entry = profilesByTier.get(policy.tier)?.find((profile) => profile.label.startsWith('Entry'));
  if (!entry) return [];
  const drafts = policy.steps.map((step) => {
    const biome = biomes.find((row) => row.biomeTier === policy.tier && row.biomeId === step.biomeId);
    const mobs = encounters.filter((row) => row.biomeTier === policy.tier && row.biomeId === step.biomeId && !row.isBoss);
    if (!biome || mobs.length === 0) return null;
    const totalWeight = mobs.reduce((sum, mob) => sum + mob.poolWeight, 0);
    const weightedMean = (select: (mob: BalanceLabEncounterRow) => number) =>
      mobs.reduce((sum, mob) => sum + select(mob) * mob.poolWeight, 0) / Math.max(1, totalWeight);
    const meanPlanningTtkSec = weightedMean((mob) => mob.planningTtkSec ?? 0);
    const encounterBurdenPctHp = weightedMean((mob) => mob.incomingDps * (mob.planningTtkSec ?? 0)) / Math.max(1, entry.maxHp);
    return { step, biome, meanPlanningTtkSec, encounterBurdenPctHp };
  }).filter((value): value is NonNullable<typeof value> => value !== null);
  const baselineBurden = drafts.find(({ step }) => step.biomeId === policy.baselineBiomeId)?.encounterBurdenPctHp ?? 0;

  return drafts.map((draft, index) => {
    const previous = drafts[index - 1];
    const currentVsBaseline = baselineBurden > 0 ? draft.encounterBurdenPctHp / baselineBurden : 0;
    const orderPass = draft.step.mustExceedPrevious && previous
      ? draft.encounterBurdenPctHp > previous.encounterBurdenPctHp
      : null;
    const minimumPass = draft.step.minimumVsBaseline === undefined
      ? null
      : currentVsBaseline >= draft.step.minimumVsBaseline;
    const fit: BalanceLabProgressionFit = draft.step.locked
      ? 'Locked baseline'
      : minimumPass === false
        ? 'Below minimum'
        : orderPass === false
          ? 'Order violation'
          : 'Fits declared intent';
    return {
      policyId: policy.id,
      biomeTier: policy.tier,
      biomeId: draft.biome.biomeId,
      biomeName: draft.biome.biomeName,
      order: draft.step.order,
      locked: draft.step.locked,
      previousBiomeId: previous?.step.biomeId ?? null,
      minimumVsBaseline: draft.step.minimumVsBaseline ?? null,
      currentVsBaseline,
      encounterBurdenPctHp: draft.encounterBurdenPctHp,
      meanIncomingDps: draft.biome.meanIncomingDps,
      meanPlanningTtkSec: draft.meanPlanningTtkSec,
      worstSpikePctHp: draft.biome.worstSpikePctHp,
      density: draft.biome.density,
      orderPass,
      minimumPass,
      fit,
    };
  });
}

function buildBiomeDraft(biome: BiomeDefinition, biomeTier: number, mobs: MonsterDefinition[], entry: ReferenceProfile) {
  const threats = mobs.map((monster) => threatAgainst(entry, monster, false));
  const spikeMonster = mobs.reduce((best, monster) =>
    threatAgainst(entry, monster, false).spikePctHp > threatAgainst(entry, best, false).spikePctHp ? monster : best);
  return {
    biomeTier,
    biomeId: biome.id,
    biomeName: biome.name,
    density: biome.mobDensity ?? null,
    rosterSize: mobs.length,
    uniqueMonsters: new Set(mobs.map((monster) => monster.id)).size,
    meanHp: mean(mobs.map((monster) => monster.stats.hp)),
    maxHp: Math.max(...mobs.map((monster) => monster.stats.hp)),
    meanIncomingDps: mean(threats.map((threat) => threat.incomingDps)),
    maxIncomingDps: Math.max(...threats.map((threat) => threat.incomingDps)),
    worstSpikePctHp: threatAgainst(entry, spikeMonster, false).spikePctHp,
    worstSpikeMonster: spikeMonster.name,
    meanEssence: mean(mobs.map((monster) => monster.rewards.essence)),
    meanBiomeXp: mean(mobs.map((monster) => monster.rewards.biomeXp ?? 0)),
  };
}

function buildEncounter(
  monster: MonsterDefinition,
  biome: BiomeDefinition,
  biomeTier: number,
  poolWeight: number,
  profile: ReferenceProfile,
): BalanceLabEncounterRow {
  const threat = threatAgainst(profile, monster, Boolean(monster.isBoss));
  const dps = referenceDpsAgainst(profile, monster);
  return {
    monsterId: monster.id,
    name: monster.name,
    biomeId: biome.id,
    biomeName: biome.name,
    biomeTier,
    isBoss: Boolean(monster.isBoss),
    isElite: Boolean(monster.elite),
    poolWeight,
    role: monsterRole(monster),
    damageType: damageType(monster),
    hp: monster.stats.hp,
    attack: monster.stats.attack,
    attacksPerSecond: aps(monster),
    rawDps: rawTotalDps(monster),
    dotDps: monsterDotDps(monster),
    spikeMultiplier: monsterSpikeMultiplier(monster),
    plating: monster.stats.plating,
    damageReduction: monster.stats.damageReduction,
    speed: monster.stats.speed,
    range: monster.stats.attackRange,
    essence: monster.rewards.essence,
    biomeXp: monster.rewards.biomeXp ?? 0,
    catalystWeight: monster.rewards.catalystWeight ?? 0,
    incomingDps: threat.incomingDps,
    spikePctHp: threat.spikePctHp,
    playerTtlSec: finiteOrNull(threat.ttlSec),
    planningTtkSec: finiteOrNull(dps > 0 ? monster.stats.hp / dps : Number.POSITIVE_INFINITY),
    status: threat.status,
    specials: monsterSpecials(monster),
  };
}

function playerProfilesForBiomeTier(biomeTier: number): ReferenceProfile[] {
  const max = maxItemTier();
  const playerTier = Math.min(biomeTier + 1, max);
  const usedFallbackTier = biomeTier + 1 > max;
  const classTier = playerTier - 1;
  const combos = comparisonCombos(classTier);

  const profile = (label: string, gearTier: number, plus: number, tankiest = false): ReferenceProfile | null => {
    const armors = itemsForSlotTier('armor', gearTier);
    if (armors.length === 0) return null;
    const defence = averageDefence(combos, gearTier, plus, classTier, tankiest);
    const offence = averageOffence(combos, gearTier, plus, classTier);
    const planningDps = mean(offence.samples.map((sample) => estimatePlayerDps(sample).total));
    return {
      biomeTier,
      label,
      gearLabel: `T${gearTier} +${plus}`,
      ...defence,
      planningDps,
      buildSamples: offence.samples.length,
      usedFallbackTier,
      offenceSamples: offence.samples,
    };
  };

  return [
    profile('Entry (prev-tier +3)', Math.max(1, playerTier - 1), ITEM_UPGRADE_LEVEL),
    profile('Same-tier +0', playerTier, 0),
    profile('Same-tier +3', playerTier, ITEM_UPGRADE_LEVEL),
    profile('Boss-ready (tankiest +3)', playerTier, ITEM_UPGRADE_LEVEL, true),
  ].filter((value): value is ReferenceProfile => value !== null);
}

function averageDefence(combos: BuildCombo[], gearTier: number, plus: number, classTier: number, tankiest: boolean) {
  let armors = itemsForSlotTier('armor', gearTier);
  let recoveries = itemsForSlotTier('recovery', gearTier);
  if (tankiest) {
    armors = [armors.sort((a, b) => defensiveItemScore(b) - defensiveItemScore(a))[0]];
    if (recoveries.length > 0) recoveries = [recoveries.sort((a, b) => defensiveItemScore(b) - defensiveItemScore(a))[0]];
  }
  const recoveryChoices: Array<ItemDefinition | undefined> = recoveries.length > 0 ? recoveries : [undefined];
  const total = { maxHp: 0, plating: 0, damageReduction: 0, dodgeRate: 0, evadeMitigation: 0, count: 0 };
  for (const combo of combos) for (const armor of armors) for (const recovery of recoveryChoices) {
    const stats = makeStatsTarget(combo, { armor, recovery }, plus, classTier);
    recalculatePlayerStats(stats);
    total.maxHp += stats.hasHealth.maxHp;
    total.plating += stats.mitigatesDamage.plating;
    total.damageReduction += stats.mitigatesDamage.damageReduction;
    total.dodgeRate += stats.evadesHits.dodgeRate;
    total.evadeMitigation += stats.evadesHits.evadeMitigation;
    total.count++;
  }
  const count = Math.max(1, total.count);
  return {
    maxHp: total.maxHp / count,
    plating: total.plating / count,
    damageReduction: total.damageReduction / count,
    dodgeRate: total.dodgeRate / count,
    evadeMitigation: total.evadeMitigation / count,
  };
}

function averageOffence(combos: BuildCombo[], gearTier: number, plus: number, classTier: number) {
  const samples: DpsEstimateInput[] = [];
  for (const combo of combos) for (const weapon of itemsForSlotTier('weapon', gearTier)) {
    const stats = makeStatsTarget(combo, { weapon }, plus, classTier);
    recalculatePlayerStats(stats);
    samples.push(dpsInputForStats(stats));
  }
  return { samples };
}

function makeStatsTarget(
  combo: BuildCombo,
  items: { weapon?: ItemDefinition; armor?: ItemDefinition; recovery?: ItemDefinition },
  plus: number,
  classTier: number,
): PlayerStatsTarget {
  const equipment = emptyEquipment();
  const inventory: string[] = [];
  const itemUpgrades: Record<string, number> = {};
  for (const item of [items.weapon, items.armor, items.recovery]) {
    if (!item) continue;
    inventory.push(item.id);
    itemUpgrades[item.id] = Math.min(plus, getMaxUpgrade(item));
  }
  if (items.weapon) equipment.weapon = items.weapon.id;
  if (items.armor) equipment.armor = items.armor.id;
  if (items.recovery) equipment.recovery = items.recovery.id;
  return {
    dealsDamage: { attack: 0, onHitDamage: 0, attackStyle: 'slash' },
    mitigatesDamage: { plating: 0, damageReduction: 0 },
    evadesHits: { dodgeRate: 0, evadeMitigation: 0, charge: 0 },
    performsAttack: { attackRange: 0, attackCooldown: 0, lastAttackAt: 0 },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP },
    hasPosition: { current: { x: 0, y: 0 }, nodeId: 'balance-lab', speed: 0 },
    usesSkills: {
      unlockedSkills: combo.unlockedSkills,
      passives: {},
      selectedClass: combo.classId,
      selectedSubVariant: combo.subVariant,
      selectedRange: combo.rangeId,
      combatArchetype: combo.archetype,
    },
    holdsInventory: { inventory, equipment, itemUpgrades },
    playerTier: classTier,
  };
}

function dpsInputForStats(stats: PlayerStatsTarget): DpsEstimateInput {
  const profileInput = {
    selectedSubVariant: stats.usesSkills.selectedSubVariant,
    selectedRange: stats.usesSkills.selectedRange,
    unlockedSkills: stats.usesSkills.unlockedSkills,
    passives: stats.usesSkills.passives,
  };
  return {
    attack: stats.dealsDamage.attack,
    onHitDamage: stats.dealsDamage.onHitDamage,
    attackCooldownMs: stats.performsAttack.attackCooldown,
    archetype: stats.usesSkills.combatArchetype,
    passives: stats.usesSkills.passives,
    selectedSubVariant: stats.usesSkills.selectedSubVariant,
    playerTier: stats.playerTier,
    summoner: stats.usesSkills.combatArchetype === 'summoner'
      ? { profileInput, activeCount: resolveSummonerProfile(profileInput).slots.length }
      : undefined,
  };
}

function comparisonCombos(classTier: number): BuildCombo[] {
  const cappedTier = Math.min(2, classTier);
  const combos: BuildCombo[] = [];
  for (const root of classRoots()) {
    const archetype = root.id.replace(/-root$/, '') as Exclude<CombatArchetype, null>;
    const frames: Array<SkillNode | null> = cappedTier >= 1 ? frameNodes(root.id) : [null];
    for (const frame of frames) {
      const ranges: Array<'close' | 'far' | null> = cappedTier >= 2 ? ['close', 'far'] : [null];
      for (const range of ranges) {
        const rangeId = range ? `${archetype}-range-${range}` : null;
        const validRangeId = rangeId && SKILL_TREE.has(rangeId) ? rangeId : null;
        combos.push({
          classId: root.id,
          subVariant: frame?.subVariantId ?? null,
          rangeId: validRangeId,
          archetype,
          unlockedSkills: [root.id, ...(frame ? [frame.id] : []), ...(validRangeId ? [validRangeId] : [])],
        });
      }
    }
  }
  return combos;
}

function classRoots(): SkillNode[] {
  return [...SKILL_TREE.values()].filter((node) => node.tier === 0 && node.classId === node.id).sort((a, b) => a.id.localeCompare(b.id));
}

function frameNodes(classId: string): SkillNode[] {
  return [...SKILL_TREE.values()].filter((node) => node.tier === 1 && node.classId === classId && node.subVariantId).sort((a, b) => String(a.subVariantId).localeCompare(String(b.subVariantId)));
}

function itemsForSlotTier(slot: 'weapon' | 'armor' | 'recovery', tier: number): ItemDefinition[] {
  return [...ITEM_DATABASE.values()].filter((item) => item.slot === slot && item.tier === tier && !TUTORIAL_WEAPON_IDS.has(item.id));
}

function reportBiomeTiers(): number[] {
  const tiers = new Set<number>();
  for (const biome of BIOME_DATABASE.values()) for (const key of Object.keys(biome.monsterPoolByTier)) {
    const tier = Number(key);
    if (tier >= 1 && mobsForBiomeTier(biome, tier).length > 0) tiers.add(tier);
  }
  return [...tiers].sort((a, b) => a - b);
}

function biomeGroupsAtTier(biomeTier: number) {
  return [...BIOME_DATABASE.values()]
    .filter((biome) => biome.id !== 'testroom')
    .map((biome) => ({ biome, mobs: mobsForBiomeTier(biome, biomeTier), bosses: bossesForBiomeTier(biome, biomeTier) }))
    .filter((group) => group.mobs.length > 0 || group.bosses.length > 0);
}

function mobsForBiomeTier(biome: BiomeDefinition, tier: number): MonsterDefinition[] {
  return (biome.monsterPoolByTier[tier] ?? []).map((id) => MONSTER_DATABASE.get(id)).filter((monster): monster is MonsterDefinition => Boolean(monster && !monster.isBoss && monster.biome !== 'testroom' && !monster.interactKind && !TUTORIAL_MONSTER_IDS.has(monster.id)));
}

function bossesForBiomeTier(biome: BiomeDefinition, tier: number): MonsterDefinition[] {
  return (biome.bossPoolByTier?.[tier] ?? []).map((id) => MONSTER_DATABASE.get(id)).filter((monster): monster is MonsterDefinition => Boolean(monster && monster.biome !== 'testroom'));
}

function threatAgainst(profile: ReferenceProfile, monster: MonsterDefinition, isBoss: boolean): Threat {
  const hit = estimateMonsterHitDamage({ attack: monster.stats.attack, targetPlating: profile.plating, targetDamageReduction: profile.damageReduction });
  const incomingDps = hit * aps(monster) * Math.max(0, 1 - profile.dodgeRate * profile.evadeMitigation) + monsterDotDps(monster);
  const spikeHit = estimateMonsterHitDamage({ attack: monster.stats.attack * monsterSpikeMultiplier(monster), targetPlating: profile.plating, targetDamageReduction: profile.damageReduction });
  const spikePctHp = spikeHit / Math.max(1, profile.maxHp);
  const ttlSec = incomingDps > 0 ? profile.maxHp / incomingDps : Number.POSITIVE_INFINITY;
  return { incomingDps, spikePctHp, ttlSec, status: threatStatus(spikePctHp, ttlSec, isBoss) };
}

function referenceDpsAgainst(profile: ReferenceProfile, target: MonsterDefinition): number {
  return mean(profile.offenceSamples.map((sample) => estimatePlayerDps({ ...sample, target: { plating: target.stats.plating, damageReduction: target.stats.damageReduction } }).total));
}

function threatStatus(spikePctHp: number, ttlSec: number, isBoss: boolean): BalanceLabThreatStatus {
  const block = isBoss ? 8 : 10;
  const risk = isBoss ? 20 : 30;
  if (spikePctHp >= 1 || ttlSec < block) return 'Blocked';
  if (ttlSec < risk || spikePctHp >= 0.5) return 'Risky';
  return 'Safe';
}

function aps(monster: MonsterDefinition): number {
  return 1000 / Math.max(100, monster.stats.attackCooldown);
}

function monsterDotDps(monster: MonsterDefinition): number {
  const dot = monster.dotEffect;
  return dot ? dot.maxStacks * dot.damagePerStack * (1000 / Math.max(1, dot.tickIntervalMs)) : 0;
}

function rawTotalDps(monster: MonsterDefinition): number {
  return monster.stats.attack * aps(monster) * Math.max(1, monster.consecutiveHits ?? 1) + monsterDotDps(monster);
}

function monsterSpikeMultiplier(monster: MonsterDefinition): number {
  let multiplier = 1;
  if (monster.cadenceFinisher) multiplier = Math.max(multiplier, monster.cadenceFinisher.multiplier);
  if (monster.empoweredCooldown) multiplier = Math.max(multiplier, monster.empoweredCooldown.multiplier);
  if (monster.openingStrike) multiplier = Math.max(multiplier, monster.openingStrike.multiplier);
  if (monster.markedStrike) multiplier = Math.max(multiplier, monster.markedStrike.multiplier);
  if (monster.chargedAttack) multiplier = Math.max(multiplier, monster.chargedAttack.multiplier * (monster.chargedAttack.aoe?.damageMult ?? 1));
  if (monster.aoeAttack) multiplier = Math.max(multiplier, 1 + (monster.aoeAttack.damageMult ?? 1));
  if (monster.rampOnCombat) multiplier = Math.max(multiplier, 1 + monster.rampOnCombat.maxPct);
  const scriptedActions = [
    ...(monster.bossScript?.phases ?? []).flatMap((phase) => phase.actions),
    ...(monster.bossScript?.repeating ?? []).flatMap((sequence) => sequence.actions),
  ];
  for (const action of scriptedActions) {
    if (action.type === 'enrage') multiplier = Math.max(multiplier, action.atkMult);
    if (action.type === 'stat-buff' && action.stat === 'attack') multiplier = Math.max(multiplier, action.mult);
  }
  return multiplier;
}

function damageType(monster: MonsterDefinition): BalanceLabDamageType {
  const direct = monster.stats.attack * aps(monster);
  const dot = monsterDotDps(monster);
  const share = direct + dot > 0 ? dot / (direct + dot) : 0;
  return share >= 0.6 ? 'DoT' : share <= 0.2 ? 'Direct' : 'Mixed';
}

function monsterRole(monster: MonsterDefinition): string {
  if (monster.isBoss) return monster.ultimateEncounter ? 'Ultimate' : 'Boss';
  if (monsterDotDps(monster) > monster.stats.attack * aps(monster)) return 'DoT';
  if (monster.aoeAttack) return 'AoE';
  if (monster.behavior === 'ranged' || monster.behavior === 'kiter') return 'Ranged';
  if (monsterSpikeMultiplier(monster) >= 1.8) return 'Spiker';
  if (monster.stats.plating >= 8 || monster.stats.damageReduction >= 0.2) return 'Tank';
  if (aps(monster) >= 1.2 && monster.stats.hp <= 30) return 'Swarm';
  if ((monster.evasion ?? 0) >= 0.15) return 'Evasive';
  return 'Bruiser';
}

function monsterSpecials(monster: MonsterDefinition): string[] {
  const specials: string[] = [];
  if (monster.dotEffect) specials.push(`DoT ×${monster.dotEffect.maxStacks}`);
  if (monster.slowEffect) specials.push(monster.slowEffect.speedMult === 0 ? 'Root' : 'Slow');
  if (monster.chargedAttack) specials.push(`Charged: ${monster.chargedAttack.name}`);
  if (monster.cadenceFinisher) specials.push(`Cadence ×${monster.cadenceFinisher.multiplier}`);
  if (monster.empoweredCooldown) specials.push(`Cooldown ×${monster.empoweredCooldown.multiplier}`);
  if (monster.openingStrike) specials.push(`Opener ×${monster.openingStrike.multiplier}`);
  if (monster.enemyShield) specials.push('Shield');
  if (monster.enemySoftCap) specials.push('Soft cap');
  if (monster.rampOnCombat || monster.rampDebuff) specials.push('Ramp');
  if (monster.aoeAttack) specials.push('AoE');
  if (monster.pack) specials.push('Pack');
  if (monster.swarm) specials.push('Swarm');
  if (monster.bossScript) specials.push('Scripted');
  return specials;
}

function maxItemTier(): number {
  return Math.max(...[...ITEM_DATABASE.values()].filter((item) => item.slot === 'armor').map((item) => item.tier));
}

function defensiveItemScore(item: ItemDefinition): number {
  return (item.statModifiers.maxHp ?? 0) + (item.statModifiers.plating ?? 0) * 5 + (item.statModifiers.damageReduction ?? 0) * 100 + (item.statModifiers.recovery ?? 0) * 4 + (item.mechanicEffects?.['defense.barrier-pct'] ?? 0) * 100;
}

function countIds(ids: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

function uniqueById(monsters: MonsterDefinition[]): MonsterDefinition[] {
  return [...new Map(monsters.map((monster) => [monster.id, monster])).values()];
}

function mean(values: number[]): number {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function deviates(value: number, siblingMedian: number): boolean {
  return siblingMedian > 0 && Math.abs(value / siblingMedian - 1) >= OUTLIER_PCT;
}

function finiteOrNull(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}
