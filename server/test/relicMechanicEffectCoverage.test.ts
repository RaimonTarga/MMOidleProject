// Runtime regressions for the ACTIVE mechanics that were missing Relic
// Buff/Debuff Effect coverage: Tempest's Endless Storm and the Winter Warden
// Frozen payoff. Grand Ritual, Harrier Brood, and Withering Chorus went with
// the Conduit specializations (CD8). Berserker Rampage went with the cadence
// T3 paths (CS7). Each block compares an otherwise identical build at secondary
// relic rating 0 vs +25%, using the real runtime call sites (not a
// reimplementation of the formula).
import { baseRecoveryForTier } from '@mmo-idle/shared';
import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
  resolveRelicPreview,
  SCALABLE_MECHANIC_DEBUFFS,
  scaleMechanicEffectConfig,
  ZERO_RELIC_RATINGS,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { attachComponent } from '../src/ecs/markerHelpers';
import { FROZEN_EFFECT } from '../src/systems/classes/archetypes/dot/t3/core/constants';
import { STORM_FX } from '../src/systems/classes/archetypes/energy/t3/core/constants';

initCombatSystems();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function close(actual: number, expected: number, message: string, epsilon = 1e-6): void {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(`${message}: got ${actual}, expected ${expected}`);
  }
}

let serial = 0;

function fixture(archetype: 'dot' | 'energy') {
  const id = `mech-${serial++}`;
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
    usesSkills: {
      unlockedSkills: [`${archetype}-root`, `${archetype}-balanced`],
      passives: {}, selectedClass: `${archetype}-root`,
      selectedSubVariant: 'balanced', selectedRange: null, combatArchetype: archetype,
    },
  } as unknown as PersistedPlayerSlices;
  const player = world.attachPlayerEntity(slices, id);
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  return { world, player };
}

function nonSummonerTarget(world: World) {
  const target = world.createMonster('node-clearing', 'plains-slime', { x: 410, y: 400 });
  assert(target !== null, 'test target must exist in the monster database');
  target.hasHealth.hp = target.hasHealth.maxHp = 1_000_000;
  target.mitigatesDamage.plating = 0;
  target.mitigatesDamage.damageReduction = 0;
  return target;
}

const hit = (world: World, player: ReturnType<typeof fixture>['player'], target: ReturnType<typeof nonSummonerTarget>, now: number) =>
  runPlayerAttack(world, player, target, now, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });

// ── 7/8. Tempest / Endless Storm — debuff effect scales tick damage only ────────
{
  function stormRun(debuffEffect: number) {
    const { world, player } = fixture('energy');
    player.usesSkills.passives['energy.endless-storm'] = 1;
    if (debuffEffect !== 0) player.usesSkills.passives['relic.mechanic-debuff-effect'] = debuffEffect;
    player.dealsDamage!.attack = 4_500; // makes damagePerTick land on an exact integer pre-scaling
    const target = nonSummonerTarget(world);
    attachComponent(world, player, 'hasEmpoweredAttack', {});
    hit(world, player, target, 1_000);
    const storm = getStatusEffect(target.tracksCombat, STORM_FX);
    assert(storm !== undefined, 'Endless Storm must apply the storm DoT on an empowered discharge');
    return storm!;
  }
  const base = stormRun(0);
  const boosted = stormRun(0.25);
  close(base.data.damagePerTick, 8_000, 'sanity: baseline damagePerTick matches the authored formula');
  close(boosted.data.damagePerTick / base.data.damagePerTick, 1.25,
    '+25% Debuff Effect scales Storm tick damage by exactly the rated bonus');
  close(base.remainingMs, boosted.remainingMs, 'Storm base duration must not scale with the relic');
  close(base.data.tickIntervalMs, boosted.data.tickIntervalMs, 'Storm tick interval must not scale with the relic');
  close(base.data.totalMs, boosted.data.totalMs, 'Storm max duration must not scale with the relic');

  // Extension per normal hit is a separate, untouched code path.
  const { world: extWorld, player: extPlayer } = fixture('energy');
  extPlayer.usesSkills.passives['energy.endless-storm'] = 1;
  extPlayer.usesSkills.passives['relic.mechanic-debuff-effect'] = 0.25;
  extPlayer.dealsDamage!.attack = 4_500;
  const extTarget = nonSummonerTarget(extWorld);
  attachComponent(extWorld, extPlayer, 'hasEmpoweredAttack', {});
  hit(extWorld, extPlayer, extTarget, 1_000);
  const beforeExtend = getStatusEffect(extTarget.tracksCombat, STORM_FX)!.remainingMs;
  hit(extWorld, extPlayer, extTarget, 1_100); // a normal (non-empowered) follow-up hit
  const afterExtend = getStatusEffect(extTarget.tracksCombat, STORM_FX)!.remainingMs;
  assert(afterExtend > beforeExtend, 'a follow-up normal hit must still extend the storm');

  // Preview parity: previewed as the attack-independent totalMult, which scales
  // identically to damagePerTick since damagePerTick is linear in it.
  const preview = resolveRelicPreview('energy', { 'energy.endless-storm': 1 }, { ...ZERO_RELIC_RATINGS, debuffEffect: 0.25 });
  const line = preview?.secondaryEffects?.find((e) => e.label === 'Storm damage multiplier');
  assert(line !== undefined, 'preview must surface a Storm debuff line');
  close(line!.after / line!.before, boosted.data.damagePerTick / base.data.damagePerTick,
    'preview scaling ratio must match the runtime scaling ratio');
}

// ── 9/10. Winter Warden Frozen payoff — debuff effect scales damageTakenPct only ──
{
  function freezeRun(debuffEffect: number) {
    const { world, player } = fixture('dot');
    player.usesSkills.passives['dot.freezing-cold'] = 1;
    if (debuffEffect !== 0) player.usesSkills.passives['relic.mechanic-debuff-effect'] = debuffEffect;
    const target = nonSummonerTarget(world);
    for (let i = 0; i < 9; i++) hit(world, player, target, 1_000 + i * 100); // CHILL_MAX = 9
    const frozen = getStatusEffect(target.tracksCombat, FROZEN_EFFECT);
    assert(frozen !== undefined, 'nine stacking hits with Freezing Cold must trigger Frozen');
    return frozen!;
  }
  const base = freezeRun(0);
  const boosted = freezeRun(0.25);
  close(base.data.damageTakenPct, 0.35, 'sanity: baseline Frozen damage taken matches authored tuning');
  close(boosted.data.damageTakenPct, 0.4375, '+25% Debuff Effect: 35% -> 43.75%');
  close(base.remainingMs, boosted.remainingMs, 'Frozen duration must not scale with the relic');
  close(base.data.moveSlowPct, boosted.data.moveSlowPct, 'Frozen movement slow must not scale with the relic');
  close(base.data.attackSlowPct, boosted.data.attackSlowPct, 'Frozen attack slow must not scale with the relic');

  // The Chill threshold itself (9 hits) must not move: 8 hits must never freeze.
  {
    const { world, player } = fixture('dot');
    player.usesSkills.passives['dot.freezing-cold'] = 1;
    player.usesSkills.passives['relic.mechanic-debuff-effect'] = 0.25;
    const target = nonSummonerTarget(world);
    for (let i = 0; i < 8; i++) hit(world, player, target, 1_000 + i * 100);
    assert(getStatusEffect(target.tracksCombat, FROZEN_EFFECT) === undefined,
      'the Chill threshold must not shrink under a Debuff Effect rating');
  }

  // Preview parity.
  const preview = resolveRelicPreview('dot', { 'dot.freezing-cold': 1 }, { ...ZERO_RELIC_RATINGS, debuffEffect: 0.25 });
  const line = preview?.secondaryEffects?.find((e) => e.label === 'Frozen damage taken');
  assert(line !== undefined, 'preview must surface a Frozen debuff line');
  close(line!.before, 0.35, 'preview before must match authored tuning');
  close(line!.after, 0.4375, 'preview after must match the runtime-scaled magnitude');
}

// ── 11. A non-mechanic debuff must stay outside the registry's reach ────────────
{
  // dr-shatter was never opted into the Relic mechanic registry: scaling it
  // through SCALABLE_MECHANIC_DEBUFFS must be a no-op even at an extreme rating.
  const untouched = scaleMechanicEffectConfig(
    { id: 'dr-shatter', sourceId: 'p', data: { anything: 5 } },
    2.0,
    SCALABLE_MECHANIC_DEBUFFS,
  );
  close(untouched.data!.anything, 5, 'an id absent from the mechanic-debuff registry must never be scaled');

  // A monster-applied debuff on the player must not read the player's own Relic
  // at all — it isn't routed through applyPlayerDebuff, so this is definitional,
  // but assert the registry would refuse it anyway if someone tried.
  const monsterSlow = scaleMechanicEffectConfig(
    { id: 'debuff-slow', sourceId: 'monster', data: { moveSlowPct: 0.5 } },
    2.0,
    SCALABLE_MECHANIC_DEBUFFS,
  );
  close(monsterSlow.data!.moveSlowPct, 0.5, 'a monster-applied slow must never be scaled by a player Relic rating');
}

console.log('relicMechanicEffectCoverage.test.ts: ok');
