import assert from 'node:assert/strict';
import {
  ABILITY_DATABASE, MONSTER_DATABASE, RESOLVED_NODE_FEATURES,
  applyStatusEffect, emptyEquipment, setResource, setFlag,
  BERSERKER_SELF_DAMAGE_INTERVAL_MS, initUsesEnergy,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { PlayerEntity, MonsterEntity, MinionEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { applyPlayerAoe, applyMonsterAoe } from '../src/systems/combat/damage/aoeDamage';
import { runPlayerAttack, runMonsterAttack, runMonsterAttackOnMinion } from '../src/systems/combat/engine/combat';
import { resolveDetonate } from '../src/systems/player/abilities/abilityAffliction';
import { applyBrambleGuard } from '../src/systems/player/abilities/abilityBramble';
import { runDebtDrain } from '../src/systems/defense/mitigation/hitToDot';
import { DEBT_POOL_KEY } from '../src/systems/defense/core/pools';
import { redirectDamageToMinion } from '../src/systems/classes/archetypes/summoner/damageSponge';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { tickSummonerSpecializations } from '../src/systems/classes/archetypes/summoner/specs';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { markEngaged } from '../src/systems/combat/ai/engagement';
import { updateStanceSwitch } from '../src/systems/player/stances/stanceSwitch';
import { updateNodeFeatures } from '../src/systems/world/nodeFeatures';
import { updateUltimateEncounters } from '../src/systems/combat/ai/ultimateEncounter';
import { updateAlternatingCurrents } from '../src/systems/classes/archetypes/energy/t3/ticks/alternatingCurrents';
import { updateDotArchetype } from '../src/systems/classes/archetypes/dot/dotPrototype';
import { attachComponent, attachMarker } from '../src/ecs/markerHelpers';
import { applyWard } from '../src/systems/defense/barrier/wards';
import { prepareCombatText, renderCombatText } from '../../client/src/render/combatText';
import { createRenderState } from '../../client/src/render/state';

initCombatSystems();
const NODE = 'node-5-5';
function setup(summoner = false, volatile = false) {
  const world = new World();
  const slices: PersistedPlayerSlices = {
    isPlayer: { id: 'p', name: 'P' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: 120 },
    hasHealth: { hp: 10000, maxHp: 10000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [],
      questProgress: {}, playerTier: 4, currentSkillTier: 4, bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      equippedAbilities: { technique: null, guard: null }, knownStances: [],
      equippedStances: { default: null }, activeStance: null, knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: summoner ? ['summoner-root', ...(volatile ? ['summoner-light', 'summoner-range-far', 'summoner-light-t3-c'] : [])] : [],
      passives: {}, selectedClass: summoner ? 'summoner-root' : null,
      selectedSubVariant: volatile ? 'light' : null, selectedRange: volatile ? 'summoner-range-far' : null,
      combatArchetype: summoner ? 'summoner' : null,
    },
  };
  const player = world.attachPlayerEntity(slices, 'p');
  if (summoner) {
    syncArchetypeSlices(world, player);
    recalculatePlayerEntityStats(world, player);
  }
  player.hasHealth.hp = player.hasHealth.maxHp = 10000;
  player.hasHealth.recovery = 0;
  if (summoner) updateSummonerArchetype(world, 0, 1000);
  return { world, player };
}
function monster(world: World, type = 'bone-crawler', x = 405) {
  const target = world.createMonster(NODE, type, { x, y: 400 });
  assert(target);
  target.hasHealth.hp = target.hasHealth.maxHp = 10000;
  target.mitigatesDamage.plating = target.mitigatesDamage.damageReduction = 0;
  return target;
}
type Victim = PlayerEntity | MonsterEntity | MinionEntity;
const id = (e: Victim) => e.isPlayer?.id ?? e.isMonster?.id ?? e.isMinion!.id;
function probe(world: World, victims: Victim[], action: () => void, counts = victims.map(() => 1)) {
  world.takeNodeEvents(NODE);
  const before = victims.map(v => v.hasHealth.hp);
  action();
  const events = world.buildNodeDelta(NODE, { patched: new Map(), detached: new Map() }).events;
  const entries = prepareCombatText(events).entries;
  victims.forEach((victim, i) => {
    const hits = entries.filter(e => e.targetId === id(victim) && !e.shield);
    assert.equal(hits.length, counts[i], `missing/duplicate instances for ${id(victim)}`);
    assert(before[i] > victim.hasHealth.hp, `fixture must lose HP: ${id(victim)}`);
    assert.equal(hits.reduce((sum, e) => sum + e.amount, 0), Math.round(before[i] - victim.hasHealth.hp));
  });
  return { events, entries };
}

// AoE and Detonate emit one damage-only event per victim, not attack animation events.
{
  const { world, player } = setup();
  const a = monster(world), b = monster(world, 'bone-crawler', 450);
  probe(world, [a, b], () => applyPlayerAoe(world, player, a.hasPosition.current, 200, 25));
  applyStatusEffect(a.tracksCombat, { id: 'dot', sourceId: 'p', stacks: 1, maxStacks: 1,
    remainingMs: 5000, data: { damagePerStack: 10, tickIntervalMs: 1000, nextTickIn: 1000 } });
  const packet = probe(world, [a], () => resolveDetonate(world, player, ABILITY_DATABASE.get('detonate')!, a));
  assert(packet.events.some(e => e.kind === 'dot-detonate'));
}
// Previously uncovered AoE must also survive beside an explicit hit and DoT.
{
  const { world, player } = setup();
  const target = monster(world);
  applyStatusEffect(target.tracksCombat, {
    id: 'dot', sourceId: 'p', stacks: 1, maxStacks: 1, remainingMs: 5000,
    data: { damagePerStack: 7, nextTickIn: 0, tickIntervalMs: 1000 },
  });
  attachMarker(world, target, 'hasDot');
  const { events, entries } = probe(world, [target], () => {
    assert.equal(runPlayerAttack(world, player, target, 1000, {
      attackOrigin: player.hasPosition.current, aggroSource: { id: 'p', kind: 'player' },
    }), 'hit');
    applyPlayerAoe(world, player, target.hasPosition.current, 30, 25);
    updateDotArchetype(world, 100);
  }, [3]);
  assert(events.some(e => e.kind === 'player-hit'));
  assert(events.some(e => e.kind === 'damage'));
  assert(events.some(e => e.kind === 'dot-tick'));
  assert.equal(entries.filter(e => e.hint.isDot).length, 1);
}
// Incoming minion hits, redirected damage, and monster AoE (both player and minions).
{
  const { world, player } = setup(true);
  const m = world.getMinionEntity(player.summonsMinions!.minionIds[0])!;
  const attacker = monster(world);
  probe(world, [m], () => runMonsterAttackOnMinion(world, attacker, m, 1000));
  probe(world, [m], () => redirectDamageToMinion(m, 9, world));
  m.hasPosition.current = { ...player.hasPosition.current };
  probe(world, [player, m], () => applyMonsterAoe(world, attacker, player.hasPosition.current, 500, 12));
}
// Debt is a semantically distinct DoT, without inventing an element.
{
  const { world, player } = setup();
  setResource(player.tracksCombat, DEBT_POOL_KEY, 100);
  const { entries } = probe(world, [player], () => { runDebtDrain(world, player); });
  assert(entries[0].hint.isDot);
  const shown: string[] = [];
  renderCombatText({ entries }, createRenderState(), (_p, _o, _a, _c, style) => shown.push(style?.symbol ?? ''));
  assert(shown[0], 'unflavored DoT must have a distinct glyph');
}
// Reflection plus the original hit must each be represented once.
{
  const { world, player } = setup();
  const attacker = monster(world);
  applyBrambleGuard(player, 0, 17, 5000);
  probe(world, [attacker, player], () => { runMonsterAttack(world, attacker, player, 1000); });
}
// Barrier shatter is extra HP loss; absorption is not counted as HP damage.
{
  const key = 'combat-text-shatter';
  MONSTER_DATABASE.set(key, { ...MONSTER_DATABASE.get('bone-crawler')!, id: key,
    enemyShield: { shieldPct: 0.001, intervalMs: 999999, durationMs: 5000, shatter: { selfDamagePct: 0.01 } } });
  try {
    const { world, player } = setup();
    const target = monster(world, key);
    player.dealsDamage.attack = 200;
    setAggroTarget(world, target, { id: 'p', kind: 'player' }, 1000);
    const packet = probe(world, [target], () => { runPlayerAttack(world, player, target, 1000, {
      attackOrigin: player.hasPosition.current, aggroSource: { id: 'p', kind: 'player' },
    }); }, [2]);
    assert.equal(packet.entries.filter(e => e.shield).length, 1);
  } finally { MONSTER_DATABASE.delete(key); }
}
// Berserker's explicit self-damage does not depend on observing a net HP delta.
{
  const { world, player } = setup();
  player.tracksProgression.activeStance = 'berserker-stance';
  player.tracksProgression.equippedStances.default = 'berserker-stance';
  setFlag(player.tracksCombat, 'stance.gate.met', false);
  markEngaged(world, player, 1000);
  probe(world, [player], () => updateStanceSwitch(world, BERSERKER_SELF_DAMAGE_INTERVAL_MS, 1000));
}
// Additional audit finding: reconstruction payment and deliberate volatile sacrifice.
{
  const { world, player } = setup(true);
  const deadId = player.summonsMinions!.minionIds[0];
  world.getMinionEntity(deadId)!.hasHealth.hp = 0;
  updateSummonerArchetype(world, 0, 1100);
  probe(world, [player], () => updateSummonerArchetype(world, 10000, 12000));
}
{
  const { world, player } = setup(true, true);
  const target = monster(world);
  updateSummonerArchetype(world, 0, 7000);
  const index = player.summonsMinions!.slotIds.indexOf(player.summonsMinions!.volatileMarkedSlotId!);
  const m = world.getMinionEntity(player.summonsMinions!.minionIds[index])!;
  m.hasAttackTarget = { targetId: target.isMonster.id };
  probe(world, [m, target], () => tickSummonerSpecializations(world, player as never, 9000));
}
// Node-feature ticks: both recipients, and the existing swamp event isn't doubled.
for (const effectId of ['combat-text-environment', 'swamp-rot']) {
  const saved = RESOLVED_NODE_FEATURES[NODE];
  RESOLVED_NODE_FEATURES[NODE] = [{ id: 'text-zone', x: 400, y: 400, displayW: 600, displayH: 600,
    shape: { kind: 'circle', x: 400, y: 400, radius: 300 },
    damage: { effectId, damagePerStack: 7, tickIntervalMs: 1000, refreshMs: 5000, maxStacks: 1, targets: ['player', 'monster'] },
  }];
  try {
    const { world, player } = setup();
    const target = monster(world);
    const { entries } = probe(world, [player, target], () => updateNodeFeatures(world, 1000));
    assert(entries.every(e => e.hint.isDot));
  } finally { RESOLVED_NODE_FEATURES[NODE] = saved; }
}
// Ultimate environmental DoT through its real tick driver.
{
  const { world, player } = setup();
  const boss = monster(world, 'void-overlord');
  assert(boss.scriptsUltimate);
  boss.scriptsUltimate.engaged = true;
  boss.scriptsUltimate.stageIndex = -1;
  boss.scriptsUltimate.activeDot = {
    effectId: 'text-ultimate-dot', damagePerStack: 8, tickIntervalMs: 1000, refreshMs: 5000,
    maxStacks: 1, stackCap: 1, currentStacks: 1, refreshCount: 0, refreshTimerMs: 0,
  };
  const { entries } = probe(world, [player], () => updateUltimateEncounters(world, 1000));
  assert(entries[0].hint.isDot);
}
// Audit finding: Alternating Currents damage was logged but had no text event.
{
  const { world, player } = setup();
  const target = monster(world);
  attachComponent(world, player, 'usesEnergy', initUsesEnergy());
  attachComponent(world, player, 'inAcDischarge', { remainingMs: 5000, tickNext: 0, baseCd: 1000 });
  player.usesSkills.passives['energy.alternating-currents'] = 1;
  player.hasAttackTarget = { targetId: target.isMonster.id };
  const { entries } = probe(world, [target], () => updateAlternatingCurrents(world, 100));
  assert.equal(entries[0].hint.dotElement, 'lightning');
}
// A fully absorbed monster DoT still has a shield number, without false HP loss.
{
  const { world, player } = setup();
  applyWard(world, player, 100, 5000);
  applyStatusEffect(player.tracksCombat, { id: 'dot', sourceId: 'absent-monster', stacks: 1, maxStacks: 1,
    remainingMs: 5000, data: { damagePerStack: 10, nextTickIn: 0, tickIntervalMs: 1000 } });
  attachMarker(world, player, 'hasDot');
  world.takeNodeEvents(NODE);
  const before = player.hasHealth.hp;
  updateDotArchetype(world, 100);
  const entries = prepareCombatText(world.takeNodeEvents(NODE)).entries;
  assert.equal(player.hasHealth.hp, before);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].shield, true);
  assert.equal(entries[0].amount, 10);
}
// Lethal AoE still produces a number with its captured position after removal.
{
  const { world, player } = setup();
  const target = monster(world);
  target.hasHealth.hp = 1;
  world.takeNodeEvents(NODE);
  applyPlayerAoe(world, player, target.hasPosition.current, 30, 25);
  assert(!world.getMonsterEntity(target.isMonster.id));
  const batch = prepareCombatText(world.takeNodeEvents(NODE));
  const amounts: number[] = [];
  renderCombatText(batch, createRenderState(), (_p, _o, amount) => amounts.push(amount));
  assert.deepEqual(amounts, [25]);
}
console.log('combatTextCoverage.test.ts: ok');
