// Runtime regressions for class-resolved relics and the common on-hit channel.
import { baseRecoveryForTier } from '@mmo-idle/shared';
import {
  GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment, ITEM_DATABASE,
  relicRatingsFromEffects, resolveRelicPreview, resolveSummonerProfile,
  estimatePlayerDps, applyStatusEffect, getStatusEffect, composePlayerView, resolveLaserProfile, resolveCadenceRelicProfile, ZERO_RELIC_RATINGS, previewEquipmentStats, resolveOnHitDamage, resolveRelicComparison,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { equipItem } from '../src/systems/player/economy/inventory';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { updateReloadT3Ticks } from '../src/systems/classes/archetypes/reload/t3/ticks/laser';

import { formatResolvedRelicProfile } from '../../client/src/ui/crafting/itemDisplay';

initCombatSystems();
let serial = 0;
function fixture(archetype: 'cadence' | 'cooldown' | 'reload' | 'dot' | 'energy' | 'summoner' | null) {
  const id = `audit-${serial++}`;
  const world = new World();
  const slices: PersistedPlayerSlices = {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [],
      questProgress: {}, playerTier: 4, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    // Root-only: the class-first Passive Tree has no frames.
    usesSkills: {
      unlockedSkills: archetype ? [`${archetype}-root`] : [],
      passives: {}, selectedClass: archetype ? `${archetype}-root` : null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: archetype,
    },
  };
  const player = world.attachPlayerEntity(slices, id);
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  return { world, player };
}
function targetFor(world: World) {
  const target = world.createMonster('node-clearing', 'plains-slime', { x: 410, y: 400 });
  if (!target) throw new Error('missing target');
  target.hasHealth.hp = target.hasHealth.maxHp = 1000000;
  target.mitigatesDamage.plating = target.mitigatesDamage.damageReduction = 0;
  return target;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function eq(actual: number, expected: number, message: string) {
  assert(Math.abs(actual - expected) < 1e-8, `${message}: got ${actual}, expected ${expected}`);
}
const attack = (world: World, player: ReturnType<typeof fixture>['player'], target: ReturnType<typeof targetFor>) =>
  runPlayerAttack(world, player, target, 1000, { attackOrigin: player.hasPosition.current, aggroSource: { id: player.isPlayer.id, kind: 'player' } });

// Intentional discrete breakpoints; no hidden doubled frequency coefficient.
for (const [frequency, expected] of [[0.1, 4], [0.2, 3], [0.35, 3], [1, 2], [-0.2, 5], [-0.3, 6]]) {
  eq(resolveCadenceRelicProfile(4, 2, { ...ZERO_RELIC_RATINGS, frequency }).threshold.after, expected, 'four-hit breakpoint');
}

// All authored relics reach the runtime, rather than only testing the pure resolver.
for (const root of ['cadence', 'cooldown', 'reload', 'dot', 'energy', 'summoner'] as const) {
  for (const relic of [...ITEM_DATABASE.values()].filter(item => item.slot === 'relic')) {
    const { world, player } = fixture(root);
    player.holdsInventory.inventory = [relic.id];
    assert(equipItem(world, player, relic.id), 'relic equip');
    const preview = resolveRelicPreview(root, player.usesSkills.passives, relicRatingsFromEffects(relic.mechanicEffects), { subVariant: null, playerTier: 4, unlockedSkills: player.usesSkills.unlockedSkills });
    world.tick(100, 100);
    const target = targetFor(world);
    if (root !== 'summoner') attack(world, player, target);
    assert(preview, 'preview exists');
    switch (preview.archetype) {
      case 'cadence': eq(player.usesCadence!.threshold, preview.threshold.after, relic.id); break;
      case 'cooldown': eq(player.usesCooldown!.executionCooldownMs, preview.cooldownMs.after, relic.id); break;
      case 'reload': eq(player.usesReload!.ammoMax, preview.ammoMax.after, relic.id); break;
      case 'dot': {
        const dot = getStatusEffect(target.tracksCombat, 'dot');
        assert(dot, 'dot applied');
        eq(dot.maxStacks, preview.maxStacks.after, relic.id);
        eq(dot.data.tickIntervalMs, preview.tickIntervalMs.after, relic.id); break;
      }
      case 'energy':
        eq(player.usesEnergy!.energyMax, preview.maxEnergy.after, relic.id);
        eq(player.usesEnergy!.energy, preview.gainPerHit.after, relic.id); break;
      case 'summoner':
        eq(player.summonsMinions!.targetCount, preview.summonCount.after, relic.id);
        eq(resolveSummonerProfile({ ...player.usesSkills }).reconstructionIntervalMs, preview.respawnMs.after, relic.id); break;
    }
  }
}

{
  const input = { selectedSubVariant: null, selectedRange: null, unlockedSkills: [], passives: {} };
  const before = resolveSummonerProfile(input);
  const after = resolveSummonerProfile({ ...input, relicRatings: { ...ZERO_RELIC_RATINGS, potency: 0.4 } });
  eq(before.slots.length, 4, 'formation baseline');
  eq(after.slots.length, 6, 'larger army');
  eq(after.slots[0].offenseWeight, before.slots[0].offenseWeight, 'extra bodies do not dilute damage');
  eq(after.slots[0].defenseWeight, before.slots[0].defenseWeight, 'extra bodies do not dilute health');
}

// Melter's magazine is heat; capacity must not implicitly extend the full reload.
for (const potency of [-0.25, 0.4]) {
  const { world, player } = fixture('reload');
  targetFor(world);
  Object.assign(player.usesSkills.passives, { 'reload.laser': 1, 'relic.mechanic-potency': potency, 'relic.mechanic-frequency': 0.35 });
  const profile = resolveLaserProfile(player.usesSkills.passives);
  eq(profile.heatMax, Math.round(100 * (1 + potency)), 'heat capacity');
  for (let tick = 0; tick < Math.ceil(profile.heatMax / profile.heatPerTick); tick++) updateReloadT3Ticks(world, 100, tick * 100);
  assert(player.usesReload!.laserOverheated, 'overheat at resolved capacity');
  eq(player.usesReload!.laserHeat, profile.heatMax, 'heat stops at capacity');
  const view = composePlayerView(player);
  eq(view!.heatPct, 100, 'network view normalizes actual heat');
  for (let tick = 0; tick < Math.ceil(profile.coolingMs / 100); tick++) updateReloadT3Ticks(world, 100, 10000 + tick * 100);
  assert(!player.usesReload!.laserOverheated, 'full cooling ends overheat');
}
for (const root of ['cadence', 'cooldown', 'reload', 'dot', 'energy'] as const) {
  const { player } = fixture(root);
  const input = { attack: 100, onHitDamage: 20, attackCooldownMs: 1000, archetype: root, passives: player.usesSkills.passives, selectedSubVariant: null, playerTier: 4 };
  const before = estimatePlayerDps(input).total;
  assert(estimatePlayerDps({ ...input, passives: { ...input.passives, 'relic.mechanic-frequency': 0.35 } }).total > before, `${root}: DPS reflects frequency`);
}
{
  const p = { 'cadence.empowered-threshold': 4 };
  const comparison = resolveRelicComparison('cadence', p, { ...ZERO_RELIC_RATINGS, frequency: 0.35 }, ZERO_RELIC_RATINGS);
  assert(comparison?.archetype === 'cadence', 'cadence comparison');
  eq(comparison.threshold.before, 3, 'unequip starts from current relic');
  eq(comparison.threshold.after, 4, 'unequip restores base');
}
// Player-facing descriptions expose class outcomes, including inert breakpoints.
{
  const ratings = { ...ZERO_RELIC_RATINGS, frequency: 0.1, potency: 0.4 };
  const cadence = formatResolvedRelicProfile(resolveRelicPreview('cadence', { 'cadence.empowered-threshold': 4 }, ratings));
  assert(cadence.some(line => line.includes('every 4 attacks') && line.includes('unchanged')), 'unchanged breakpoint is explicit');
  const laser = formatResolvedRelicProfile(resolveRelicPreview('reload', { 'reload.laser': 1 }, ratings));
  assert(laser.some(line => line.includes('Maximum heat') && line.includes('140')), 'Melter shows actual heat');
  assert(!laser.some(line => /ammo|mechanic frequency|mechanic potency/i.test(line)), 'Melter hides generic and Slinger labels');
  const flash = resolveRelicPreview('energy', { 'energy.flash': 1 }, { ...ZERO_RELIC_RATINGS, frequency: 1 });
  assert(flash?.archetype === 'energy', 'Flash resolves energy');
  eq(flash.gainPerHit.after, 10, 'Flash uses its own five-energy base');
  assert(!formatResolvedRelicProfile(flash).some(line => line.includes('Discharge')), 'Flash has no fictitious discharge');
  for (const [passive, cap] of [['dot.poison-explosion', 10], ['dot.eternal-doom', 50]] as const) {
    const profile = resolveRelicPreview('dot', { [passive]: 1 }, { ...ZERO_RELIC_RATINGS, potency: 0.4 });
    assert(profile?.archetype === 'dot', 'special DoT preview');
    eq(profile.maxStacks.before, cap, 'special DoT cap before relic');
    eq(profile.maxStacks.after, Math.round(cap * 1.4), 'special DoT cap after relic');
  }
}
// A secondary line must say which rating produced it; "Overdrive attack-speed bonus"
// reads exactly like a Frequency/Potency line otherwise.
{
  const buffOnly = { ...ZERO_RELIC_RATINGS, buffEffect: 0.25 };
  const overdrive = formatResolvedRelicProfile(resolveRelicPreview('cooldown', { 'cooldown.overdrive': 1, 'cooldown.overdrive-attack-speed-pct': 0.5 }, buffOnly));
  assert(overdrive.includes('Buff effect · Overdrive attack-speed bonus: 50% → 62.5%'), 'buff effect is attributed with real values');
  assert(!overdrive.some(line => line.startsWith('Debuff effect')), 'a buff-only relic claims no debuff');

  const debuffOnly = { ...ZERO_RELIC_RATINGS, debuffEffect: 0.25 };
  const chill = formatResolvedRelicProfile(resolveRelicPreview('dot', { 'dot.freezing-cold': 1 }, debuffOnly));
  assert(chill.includes('Debuff effect · Chill movement slow per stack: 5% → 6.25%'), 'debuff effect is attributed');
  assert(chill.includes('Debuff effect · Frozen damage taken: 35% → 43.75%'), 'Frozen damage taken is attributed');
  assert(chill.filter(line => line.startsWith('Debuff effect')).length === 4, 'every eligible debuff is listed');
  assert(!chill.some(line => line.startsWith('Buff effect')), 'a debuff-only relic claims no buff');

  // A rating with both halves (the retired Haunted Prism's shape) shows both categories.
  const prism = { ...ZERO_RELIC_RATINGS, buffEffect: 0.25, debuffEffect: 0.25 };
  const both = formatResolvedRelicProfile(resolveRelicPreview('dot', { 'dot.frenzy': 1, 'dot.freezing-cold': 1 }, prism, { playerTier: 4 }));
  assert(both.some(line => line.startsWith('Buff effect')) && both.some(line => line.startsWith('Debuff effect')), 'a two-half rating shows both categories');

  // A rated relic whose build registers nothing says so per category instead of going quiet.
  const inert = formatResolvedRelicProfile(resolveRelicPreview('cadence', { 'cadence.empowered-threshold': 5 }, prism));
  assert(inert.includes('Buff effect · No eligible mechanic buff in this build'), 'inert buff rating is explicit');
  assert(inert.includes('Debuff effect · No eligible mechanic debuff in this build'), 'inert debuff rating is explicit');

  // An unrated relic earns no secondary headings even where effects are registered.
  const unrated = formatResolvedRelicProfile(resolveRelicPreview('cooldown', { 'cooldown.overdrive': 1 }, { ...ZERO_RELIC_RATINGS, frequency: 0.2 }));
  assert(!unrated.some(line => /^(Buff|Debuff) effect/.test(line)), 'no secondary rating, no secondary lines');
  assert(!unrated.some(line => line.includes('relic.mechanic')), 'raw relic keys stay hidden');
}
console.log('coreRelicIntegration: ok');
