// Diagnostic snapshot, not a regression test: records current behavior, including defects.
// Run from root: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/_coreRelicAudit.ts
import {
  GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment, ITEM_DATABASE,
  relicRatingsFromEffects, resolveRelicPreview, resolveSummonerProfile,
  estimatePlayerDps, applyStatusEffect, getStatusEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { equipItem } from '../src/systems/player/economy/inventory';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { updateReloadT3Ticks } from '../src/systems/classes/archetypes/reload/t3/ticks/laser';
import { recomputeRampageStats } from '../src/systems/classes/archetypes/cadence/t3/core/rampage';

initCombatSystems();
let serial = 0;
function fixture(archetype: 'cadence' | 'cooldown' | 'reload' | 'dot' | 'energy' | 'summoner' | null) {
  const id = `audit-${serial++}`;
  const world = new World();
  const slices: PersistedPlayerSlices = {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: GAME_CONFIG.PLAYER_RECOVERY },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [],
      questProgress: {}, playerTier: 4, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: archetype ? [`${archetype}-root`, `${archetype}-balanced`] : [],
      passives: {}, selectedClass: archetype ? `${archetype}-root` : null,
      selectedSubVariant: 'balanced', selectedRange: null, combatArchetype: archetype,
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
const relics = [...ITEM_DATABASE.values()].filter(i => i.slot === 'relic');
const matrix: unknown[] = [];
for (const root of ['cadence', 'cooldown', 'reload', 'dot', 'energy', 'summoner'] as const) {
  for (const relic of relics) {
    const { world, player } = fixture(root);
    player.holdsInventory.inventory = [relic.id];
    if (!equipItem(world, player, relic.id)) throw new Error(`equip failed: ${root}/${relic.id}`);
    const preview = resolveRelicPreview(root, player.usesSkills.passives, relicRatingsFromEffects(relic.mechanicEffects), { subVariant: 'balanced', playerTier: 4 });
    world.tick(100, 100);
    const target = targetFor(world);
    runPlayerAttack(world, player, target, 1000, { attackOrigin: player.hasPosition.current, aggroSource: { id: player.isPlayer.id, kind: 'player' } });
    const dot = getStatusEffect(target.tracksCombat, 'dot');
    const summon = resolveSummonerProfile({ ...player.usesSkills, passives: player.usesSkills.passives });
    matrix.push({ root, relic: relic.id, preview, runtime: {
      cadenceThreshold: player.usesCadence?.threshold,
      cooldownMs: player.usesCooldown?.executionCooldownMs,
      ammoMax: player.usesReload?.ammoMax,
      energyMax: player.usesEnergy?.energyMax, energy: player.usesEnergy?.energy,
      dot: dot ? { maxStacks: dot.maxStacks, data: dot.data } : undefined,
      summon: root === 'summoner' ? { count: summon.slots.length, reconstructionMs: summon.reconstructionIntervalMs } : undefined,
    } });
  }
}
console.log('MATRIX', JSON.stringify(matrix));

for (const mode of ['normal', 'laser', 'frenzy'] as const) {
  const { world, player } = fixture(mode === 'normal' ? null : mode === 'laser' ? 'reload' : 'dot');
  const target = targetFor(world);
  player.dealsDamage.attack = 100;
  player.dealsDamage.onHitDamage = mode === 'frenzy' ? 0 : 20;
  if (mode === 'laser') {
    player.usesSkills.passives['reload.laser'] = 1;
    player.usesSkills.passives['reload.laser-damage-per-tick-pct'] = 1;
  }
  if (mode === 'frenzy') {
    player.usesSkills.passives['dot.frenzy'] = 1;
    player.usesSkills.passives['dot.frenzy-onhit-per-tier'] = 20;
    applyStatusEffect(player.tracksCombat, { id: 'dot-frenzy', sourceId: player.isPlayer.id, remainingMs: 5000 });
  }
  const damages: number[] = [];
  for (const mult of [0, 1.15]) {
    player.usesSkills.passives['core.onhit-mult'] = mult;
    const hp = target.hasHealth.hp;
    if (mode === 'laser') updateReloadT3Ticks(world, 100, 2000);
    else runPlayerAttack(world, player, target, 2000, { attackOrigin: player.hasPosition.current, aggroSource: { id: player.isPlayer.id, kind: 'player' } });
    damages.push(hp - target.hasHealth.hp);
  }
  console.log('CATALYST', JSON.stringify({ mode, damages, sheetOnHit: player.dealsDamage.onHitDamage }));
}
{
  const { player } = fixture('cadence');
  player.usesSkills.passives['cadence.empowered-threshold'] = 5;
  player.usesSkills.passives['relic.mechanic-frequency'] = -0.3;
  player.usesCadence!.rampageStacks = 2;
  recomputeRampageStats(player);
  console.log('RAMPAGE', JSON.stringify({ actual: player.usesCadence!.threshold, relicAfterRamp: Math.max(2, Math.round((5 - 2) / (1 - 0.3 * 2))) }));
}
for (const root of ['cadence', 'cooldown', 'reload', 'dot', 'energy'] as const) {
  const { player } = fixture(root);
  const input = { attack: 100, onHitDamage: 20, attackCooldownMs: 1000, archetype: root, passives: player.usesSkills.passives, selectedSubVariant: 'balanced' as const, playerTier: 4 };
  const before = estimatePlayerDps(input).total;
  const frequencyOnly = estimatePlayerDps({ ...input, passives: { ...input.passives, 'relic.mechanic-frequency': 0.35 } }).total;
  const catalyst = estimatePlayerDps({ ...input, passives: { ...input.passives, 'core.onhit-mult': 1.15 } }).total;
  console.log('DPS', JSON.stringify({ root, before, frequencyOnly, catalyst }));
}

