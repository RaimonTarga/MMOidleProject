// Runtime regressions for class-resolved relics and the common on-hit channel.
import { baseRecoveryForTier } from '@mmo-idle/shared';
import {
  GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment, ITEM_DATABASE,
  relicRatingsFromEffects, resolveRelicPreview, resolveSummonerProfile,
  estimatePlayerDps, applyStatusEffect, getStatusEffect, resolveCadenceRelicProfile, ZERO_RELIC_RATINGS, previewEquipmentStats, resolveOnHitDamage, resolveRelicComparison,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { equipItem } from '../src/systems/player/economy/inventory';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';

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
for (const root of ['cadence', 'cooldown', 'summoner'] as const) {
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
      // The runtime no longer stores an execution clock (CQ7). The preview still
      // quotes one from cooldown.empowered-cd-ms; that number is not on the slice.
      case 'cooldown': assert(preview.cooldownMs.after > 0, relic.id); break;
      case 'summoner':
        assert(preview.summonCount.before === preview.summonCount.after, `${relic.id}: a relic does not resize the formation`);
        eq(resolveSummonerProfile({ ...player.usesSkills }).reconstructionIntervalMs, preview.respawnMs.after, relic.id); break;
    }
  }
}

{
  const input = { selectedSubVariant: null, selectedRange: null, unlockedSkills: [], passives: {} };
  const before = resolveSummonerProfile(input);
  const after = resolveSummonerProfile({ ...input, relicRatings: { ...ZERO_RELIC_RATINGS, potency: 0.4 } });
  eq(before.slots.length, after.slots.length, 'relic potency does not add summons');
  eq(before.reconstructionIntervalMs, after.reconstructionIntervalMs, 'relic potency does not change reconstruction');
  eq(before.slots.length, 0, 'no roster means no formation');
}

for (const root of ['cadence'] as const) {
  const { player } = fixture(root);
  const input = { attack: 100, onHitDamage: 20, attackCooldownMs: 1000, archetype: root, passives: player.usesSkills.passives, selectedSubVariant: null, playerTier: 4 };
  const before = estimatePlayerDps(input).total;
  assert(estimatePlayerDps({ ...input, passives: { ...input.passives, 'relic.mechanic-frequency': 0.35 } }).total > before, `${root}: DPS reflects frequency`);
}
{
  // The slam fills on Resolve, so a shorter preview clock must not invent DPS.
  const { player } = fixture('cooldown');
  const input = { attack: 100, onHitDamage: 20, attackCooldownMs: 1000, archetype: 'cooldown' as const, passives: player.usesSkills.passives, selectedSubVariant: null, playerTier: 4 };
  const before = estimatePlayerDps(input);
  const after = estimatePlayerDps({ ...input, passives: { ...input.passives, 'relic.mechanic-frequency': 0.35 } });
  eq(after.total, before.total, 'cooldown DPS does not follow the deleted clock');
  assert(before.caveats.some(line => line.includes('slam')), 'the estimate says the slam is omitted');
}
{
  // The magazine is the gun's stats. The reload relic profile is gone.
  const { player } = fixture('reload');
  const input = { attack: 100, onHitDamage: 20, attackCooldownMs: 1000, archetype: 'reload' as const, passives: player.usesSkills.passives, selectedSubVariant: null, playerTier: 4 };
  const before = estimatePlayerDps(input);
  const after = estimatePlayerDps({ ...input, passives: { ...input.passives, 'relic.mechanic-frequency': 0.35 } });
  eq(after.total, before.total, 'reload DPS does not follow the deleted profile');
  assert(resolveRelicPreview('reload', player.usesSkills.passives, { ...ZERO_RELIC_RATINGS, frequency: 0.35 }) === null, 'reload has no relic profile');
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
}
// Secondary lines must say which rating produced them.
{
  // A rating with both halves (the retired Haunted Prism's shape) shows both categories.
  const prism = { ...ZERO_RELIC_RATINGS, buffEffect: 0.25, debuffEffect: 0.25 };
  // A rated relic whose build registers nothing says so per category instead of going quiet.
  const inert = formatResolvedRelicProfile(resolveRelicPreview('cadence', { 'cadence.empowered-threshold': 5 }, prism));
  assert(inert.includes('Buff effect · No eligible mechanic buff in this build'), 'inert buff rating is explicit');
  assert(inert.includes('Debuff effect · No eligible mechanic debuff in this build'), 'inert debuff rating is explicit');

  // An unrated relic earns no secondary headings even where effects are registered.
  const unrated = formatResolvedRelicProfile(resolveRelicPreview('dot', { 'dot.frenzy': 1 }, { ...ZERO_RELIC_RATINGS, frequency: 0.2 }));
  assert(!unrated.some(line => /^(Buff|Debuff) effect/.test(line)), 'no secondary rating, no secondary lines');
  assert(!unrated.some(line => line.includes('relic.mechanic')), 'raw relic keys stay hidden');
}
console.log('coreRelicIntegration: ok');
