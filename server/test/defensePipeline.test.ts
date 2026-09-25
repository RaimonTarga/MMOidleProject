import assert from 'node:assert/strict';
import { applyStatusEffect, getResource, setCooldown } from '@mmo-idle/shared';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { BREADTH_CELLS } from '../bench/balance/playerBreadthSpec';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { makeCombatContext, emitCombatEvent } from '../src/systems/combat/engine/combatPipeline';
import { applyWard } from '../src/systems/defense/barrier/wards';
import { runDebtDrain } from '../src/systems/defense/mitigation/hitToDot';
import { DEBT_POOL_KEY } from '../src/systems/defense/core/pools';
import { applyMonsterAoe } from '../src/systems/combat/damage/aoeDamage';
import { summonerProfileFor } from '../src/systems/classes/archetypes/summoner/profile';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';

// Damage-pipeline order: Guard position, debt installments, splash through
// defense, and Conduit redirection ahead of debt/recuperation.

function fixture(identityId = 'breadth-t3-slinger-light') {
  const world = createBalanceWorld();
  const c = structuredClone(BREADTH_CELLS.find(c => c.identityId === identityId && c.role === 'farm')!);
  assert(c, `missing breadth cell ${identityId}`);
  const { bot } = prepareSurveyBot(world, c, { x: 400, y: 400 });
  bot.usesSkills.passives = {}; if (bot.evadesHits) bot.evadesHits.dodgeRate = 0;
  bot.mitigatesDamage.plating = 0; bot.mitigatesDamage.damageReduction = 0;
  bot.hasHealth.maxHp = 1000; bot.hasHealth.hp = 1000; bot.tracksProgression.activeStance = null;
  if (bot.hasBarrier) bot.hasBarrier.current = 0;
  const monster = world.createMonster(c.nodeId, 'magma-brute', { x: 400, y: 400 })!;
  assert(monster);
  const hit = (damage: number) => {
    const ctx = makeCombatContext(monster, 'monster', bot, 'player');
    ctx.damage = damage; ctx.metadata.incomingGross = damage;
    emitCombatEvent('onAttack', ctx, world); emitCombatEvent('onDamageTaken', ctx, world);
    return ctx;
  };
  return { world, bot, monster, hit };
}

// Guard runs before wards: it protects shield capacity.
{
  const { world, bot, hit } = fixture();
  applyWard(world, bot, 100, 5000);
  applyStatusEffect(bot.tracksCombat, { id: 'ability-guard', remainingMs: 3000, totalMs: 3000, stacks: 1, data: { drPct: 0.5 } });
  const ctx = hit(100);
  assert.equal(ctx.damage, 0);
  assert.equal(bot.holdsWards?.wards[0].amount, 50, 'Guard protects ward capacity');
}

// Debt: four one-second installments, fractional, resistance fixed at queue time.
{
  const { world, bot, hit } = fixture();
  bot.usesSkills.passives = { 'defense.hit-to-dot-pct': 0.3, 'defense.dot-resistance': 0.25 };
  const ctx = hit(10);
  assert.equal(ctx.damage, 7);
  assert.equal(getResource(bot.tracksCombat, DEBT_POOL_KEY), 2.25);
  bot.usesSkills.passives['defense.dot-resistance'] = 0.9;
  for (let i = 0; i < 4; i++) { setCooldown(bot.tracksCombat, 'debtTick', 0); runDebtDrain(world, bot); }
  assert.equal(bot.hasHealth.hp, 997.75, 'fractional debt conserved and resistance snapshotted');
  assert.equal(getResource(bot.tracksCombat, DEBT_POOL_KEY), 0);
}

// Debt forgiveness clears queued installments, so forgiven debt never pays later.
{
  const { world, bot, hit } = fixture();
  bot.usesSkills.passives = { 'defense.hit-to-dot-pct': 0.5, 'defense.debt-cheat-death': 1 };
  bot.hasHealth.hp = 60;
  hit(200);
  assert.equal(getResource(bot.tracksCombat, DEBT_POOL_KEY), 100);
  setCooldown(bot.tracksCombat, 'debtTick', 0); runDebtDrain(world, bot);
  assert.equal(getResource(bot.tracksCombat, DEBT_POOL_KEY), 0, 'lethal debt is forgiven');
  const hp = bot.hasHealth.hp;
  hit(8);
  for (let i = 0; i < 4; i++) { setCooldown(bot.tracksCombat, 'debtTick', 0); runDebtDrain(world, bot); }
  assert.equal(hp - bot.hasHealth.hp, 4, 'only the new debt is paid; forgiven installments never return');
}

// Secondary splash enters the defensive pipeline (wards pay).
{
  const { world, bot, monster } = fixture();
  applyWard(world, bot, 100, 5000);
  applyMonsterAoe(world, monster, bot.hasPosition.current, 100, 40);
  assert.equal(bot.hasHealth.hp, 1000, 'secondary splash must respect wards');
  assert.equal(bot.holdsWards?.wards[0].amount, 60);
}

// Conduit redirection: after shields, before the owner's debt and recuperation.
{
  const { world, bot, hit } = fixture('breadth-t3-conduit-balanced');
  updateSummonerArchetype(world, 0, 1_000);
  const minionIds = bot.summonsMinions?.minionIds.filter(Boolean) ?? [];
  assert(minionIds.length > 0, 'Conduit fixture must field summons');
  const pct = summonerProfileFor(bot).redirectionPct;
  assert(pct > 0, 'Conduit fixture must redirect');
  bot.usesSkills.passives = { 'defense.hit-to-dot-pct': 0.5 };
  applyWard(world, bot, 20, 5000);
  const minionHp = () => minionIds.reduce((sum, id) => sum + (world.getMinionEntity(id)?.hasHealth.hp ?? 0), 0);
  const before = minionHp();
  const ctx = hit(120);
  const redirected = Math.round(100 * pct);
  assert.equal(bot.holdsWards?.wards[0]?.amount ?? 0, 0, 'wards pay before redirection');
  assert.equal(before - minionHp(), redirected, 'summons take their share of post-shield damage, before debt carves it');
  assert.equal(getResource(bot.tracksCombat, DEBT_POOL_KEY), (100 - redirected) * 0.5, 'debt converts only what the summons left');
  assert.equal(ctx.damage, (100 - redirected) * 0.5);
}

// Splash on the owner is not redirected: nearby summons already take their own splash.
{
  const { world, bot, monster } = fixture('breadth-t3-conduit-balanced');
  updateSummonerArchetype(world, 0, 1_000);
  const minionIds = bot.summonsMinions!.minionIds.filter(Boolean);
  for (const id of minionIds) world.getMinionEntity(id)!.hasPosition.current = { x: 5000, y: 5000 };
  const before = minionIds.reduce((sum, id) => sum + world.getMinionEntity(id)!.hasHealth.hp, 0);
  applyMonsterAoe(world, monster, bot.hasPosition.current, 100, 40);
  const after = minionIds.reduce((sum, id) => sum + world.getMinionEntity(id)!.hasHealth.hp, 0);
  assert.equal(after, before, 'owner splash must not be redirected to summons');
  assert(bot.hasHealth.hp < 1000, 'the owner still takes the splash');
}

console.log('defensePipeline: ok');
