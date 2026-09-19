/**
 * Mire-Gorged Behemoth venom — the ADOPTED coefficient, pinned narrowly.
 *
 * `dotEffect.damagePerStack` was written into source as **6** on 2026-09-19, from the
 * Boss4 `swamp-pressure` screen (24/24 verified observations; 2/6 -> 4/6 victories on
 * the Boss3 Cleanse reference). This file is the regression that keeps it there, and
 * it is deliberately NARROW: it pins the one adopted number, proves that number is
 * what the fight actually resolves, and pins the fields the adoption promised not to
 * touch. It is not a balance assertion and makes no claim about win rates.
 *
 * WHY A REAL TICK AND NOT A FIELD READ. The authored value is one thing; the value
 * the DoT system resolves is another. `boss4Pressure.test.ts` established that
 * distinction while the change was still a process-local candidate — an install that
 * moved a definition the simulation never read would have passed every field
 * assertion. Adoption inherits the same exposure in reverse, so the same channel is
 * measured here: the payload `effectiveMonsterDot` hands the on-hit listener, the
 * status it paints on a real bot, and one full tick interval of the real world.
 *
 * MUTATION-CHECKED, and the check was run rather than reasoned about. Reverting
 * `damagePerStack` to 9 fails this file in four places: the authored pin, the live
 * payload, the painted status, and the resolved tick damage — the last because it is
 * a PAIRED comparison against the pre-adoption coefficient resolved through the same
 * path, not an absolute bound. An absolute bound would not have caught the revert:
 * four stacks of the old payload land 14 against a raw-coefficient ceiling of 24.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/behemothVenom.test.ts
 */
import {
  MONSTER_DATABASE, getStatusEffect, resolveMonsterDotDebuff,
} from '@mmo-idle/shared';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { setupArena, BOT_SPAWN } from '../bench/balance/arena';
import { createMonster } from '../src/systems/world/spawning/index';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { applyMonsterDotToPlayer } from '../src/systems/combat/status/monsterDot';
import { effectiveMonsterDot } from '../src/systems/combat/engine/monsterMechanics';
import { BOSS4_BLOCKS_DEF, boss4ArmCells } from '../bench/balance/boss4Spec';
import type { Night5Cell } from '../bench/balance/night5Spec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

initCombatSystems();

const BOSS_ID = 'mire-gorged-behemoth';
/** The adopted coefficient, spelled once. */
const ADOPTED_PER_STACK = 6;
/** What it replaced, kept so the direction of the adoption stays legible. */
const PRE_ADOPTION_PER_STACK = 9;

const def = MONSTER_DATABASE.get(BOSS_ID)!;

// ═══ 1. The authored value, and the fields the adoption promised not to move ══════

{
  const dot = def.dotEffect!;
  assert(dot.damagePerStack === ADOPTED_PER_STACK,
    `authored venom damagePerStack is ${dot.damagePerStack}, not the adopted ${ADOPTED_PER_STACK}`);
  assert(ADOPTED_PER_STACK < PRE_ADOPTION_PER_STACK,
    'the adoption reduced the coefficient; this file is stating the wrong direction');
  assert(ADOPTED_PER_STACK >= 1, 'the adoption must leave a live mechanic, not delete it');

  // ONE FIELD MOVED. Everything else the Boss4 screen held fixed is pinned here too,
  // so a later edit that "adjusts the venom" by widening the stack cap or shortening
  // the cadence cannot arrive under cover of this adoption.
  assert(dot.debuffId === 'mire-gorged-venom', `venom identity moved to ${dot.debuffId}`);
  assert(dot.maxStacks === 4, `venom stack cap moved to ${dot.maxStacks}`);
  assert(dot.tickIntervalMs === 1000, `venom cadence moved to ${dot.tickIntervalMs}`);
  assert(dot.durationMs === 8000, `venom duration moved to ${dot.durationMs}`);
  assert(dot.openerStacks === undefined, 'venom gained an opener; the adoption assumed none');

  assert(def.stats.hp === 3375, `boss HP moved to ${def.stats.hp}`);
  assert(def.stats.attack === 38, `the ordinary attack moved to ${def.stats.attack}`);
  assert(def.stats.plating === 6, `boss plating moved to ${def.stats.plating}`);
  assert(def.stats.damageReduction === 0.08, `boss DR moved to ${def.stats.damageReduction}`);
  assert(def.stats.attackCooldown === 2800, `attack cadence moved to ${def.stats.attackCooldown}`);

  const pool = def.chargedAttack!;
  assert(pool.multiplier === 1.1, 'Corrosive Pool multiplier moved');
  assert(pool.pool?.damagePerTick === 5, 'Corrosive Pool payload moved');
  assert(pool.pool?.vulnerability?.damageTakenPct === 0.12, 'Corrosive Pool vulnerability moved');
  const phase = def.bossScript!.phases![0]!;
  assert(phase.hpPct === 0.5, 'the 50% phase moved');
  assert(JSON.stringify(phase.actions) === JSON.stringify([
    { type: 'enrage', atkMult: 1.0, cdMult: 0.70 },
    { type: 'empower-charged', cooldownMult: 0.70, radiusMult: 1.15 },
  ]), 'the 50% phase actions moved');
}

// ═══ 2. The adopted value is what the FIGHT resolves ══════════════════════════════

/**
 * Apply the venom to a real reference bot through the real on-hit helper and advance
 * the real world one full tick interval.
 *
 * The bot is the Boss4 swamp package — the reference the adoption was measured on —
 * so what is measured here is the same channel on the same preparation, not a
 * synthetic target.
 */
function venomTick(stacks: number, perStackOverride?: number) {
  const swamp = BOSS4_BLOCKS_DEF.find((b) => b.name === 'swamp-pressure')!;
  const cell: Night5Cell = boss4ArmCells('swamp-pressure', swamp.arms[0]!.name)
    .find((c) => c.className === 'striker')!;
  let now = 1800000000000;
  const realNow = Date.now;
  Date.now = () => now;
  try {
    const world = createBalanceWorld();
    setupArena(world, { nodeId: cell.nodeId, biomeGroup: swamp.role, contentTier: 2, isDungeon: true });
    const { bot } = prepareSurveyBot(world, cell, BOT_SPAWN);
    // Spawned far away: this measures the DoT channel, not the boss's swings.
    const boss = createMonster(world, cell.nodeId, BOSS_ID, { x: BOT_SPAWN.x + 3000, y: BOT_SPAWN.y + 3000 })!;
    const authoredPayload = effectiveMonsterDot(boss, def)!;
    // The override exists so the pre-adoption coefficient can be resolved through the
    // SAME path, on the same bot, without touching MONSTER_DATABASE. That is what
    // makes the comparison below a real mutation check: it fails if the adopted
    // number stops reaching the DoT system, and it cannot be satisfied by a payload
    // the simulation never reads.
    const live = perStackOverride === undefined
      ? authoredPayload
      : { ...authoredPayload, damagePerStack: perStackOverride };
    for (let i = 0; i < stacks; i++) applyMonsterDotToPlayer(world, boss, bot, live, 'venom-regression');
    const effectId = resolveMonsterDotDebuff({ monster: def }).statusEffectId;
    const painted = getStatusEffect(bot.tracksCombat, effectId)!;
    let tickDamage = 0;
    for (let t = 0; t < live.tickIntervalMs; t += 100) {
      now += 100;
      world.tick(100, now);
      for (const e of world.worldLogJournal as {
        kind?: string; target?: { id?: string }; damageType?: string; hpDamage?: number; absorbed?: number;
      }[]) {
        if (e.kind !== 'damage' || e.target?.id !== bot.isPlayer.id) continue;
        if (e.damageType !== 'dot') continue;
        tickDamage += (e.hpDamage ?? 0) + (e.absorbed ?? 0);
      }
      world.worldLogJournal = [];
    }
    return { livePerStack: authoredPayload.damagePerStack, painted, tickDamage, effectId };
  } finally {
    Date.now = realNow;
  }
}

{
  const stacks = 4;
  const r = venomTick(stacks);

  // The payload the on-hit listener actually calls for...
  assert(r.livePerStack === ADOPTED_PER_STACK,
    `the live venom payload is ${r.livePerStack}, not the adopted ${ADOPTED_PER_STACK}`);
  // ...and the status it paints on the player.
  assert(r.painted.data.damagePerStack === ADOPTED_PER_STACK,
    `the applied stack carries ${r.painted.data.damagePerStack}, not ${ADOPTED_PER_STACK}`);
  assert(r.painted.maxStacks === 4, `the painted stack cap is ${r.painted.maxStacks}`);
  assert(r.effectId === 'monster-dot:mire-gorged-venom', `the venom identity moved to ${r.effectId}`);

  // And a REAL tick resolves it, STRICTLY LESS than the coefficient it replaced.
  //
  // Stated as a comparison rather than a literal for two reasons. Plating and DR sit
  // between the coefficient and the landed number, so a literal here would be a
  // stale-literal failure waiting for the next mitigation retune — and, worse, a
  // loose absolute bound would not actually catch a revert: four stacks of the
  // PRE-ADOPTION payload still land well inside any ceiling derived from the raw
  // adopted coefficient. Resolving both through the same path on the same bot is what
  // gives this teeth.
  const before = venomTick(stacks, PRE_ADOPTION_PER_STACK);
  assert(r.tickDamage > 0,
    'the probe resolved no DoT damage at all — the fixture is not measuring the channel');
  assert(before.tickDamage > 0,
    'the pre-adoption comparison resolved no DoT damage — the override never reached the tick');
  assert(r.tickDamage < before.tickDamage,
    `one ${stacks}-stack tick resolved ${r.tickDamage} on the adopted ${ADOPTED_PER_STACK}/stack `
    + `payload against ${before.tickDamage} on the pre-adoption ${PRE_ADOPTION_PER_STACK}/stack one — `
    + 'the adopted coefficient is not reaching the DoT system');

  console.log(
    `  venom: authored ${ADOPTED_PER_STACK}/stack (was ${PRE_ADOPTION_PER_STACK}); one `
    + `${r.painted.data.tickIntervalMs}ms tick at ${stacks} stacks resolved ${r.tickDamage} `
    + `against ${before.tickDamage} on the pre-adoption payload `
    + `(cap ${r.painted.maxStacks}, ${r.painted.data.totalMs}ms — unchanged)`,
  );
}

console.log('behemothVenom: ok');
