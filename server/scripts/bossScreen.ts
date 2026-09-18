/**
 * Boss screen runner — a seeded, receipt-emitting boss fight.
 *
 * Why this exists rather than `bench/bossExam.ts`:
 *
 *   `bossExam.ts` is right about WHICH fight to run -- it strips the dungeon guard
 *   and forces the boss awake, which `--mode boss` never did (every "boss" row that
 *   mode ever printed was a guard row). It is wrong about HOW to run it for a
 *   frozen packet, in three ways that a screen cannot live with:
 *
 *     1. It takes no seed and `runFight` consumes none, so a declared seed list is
 *        a fiction. (For a no-add boss it is worse than a fiction: two seeds on
 *        `apex-timberclaw` produce byte-identical outcomes.)
 *     2. It emits report rows only, no per-observation receipt -- so a packet that
 *        requires the fight to record which escort species it actually met cannot
 *        be satisfied at all.
 *     3. It builds its bot with `materializeBot` alone, leaving `runesEquipped: []`
 *        -- no telegraph step-back, no hazard avoidance, no regen waiting, no orbit
 *        -- while every mob survey the campaign has run uses `prepareSurveyBot`,
 *        which equips and legality-validates all five. The two harnesses were not
 *        measuring the same player.
 *
 * This runner takes `bossExam`'s encounter setup and the survey's preparation,
 * seeding and receipts, so a boss row is readable against a mob row.
 *
 * Measurement properties this runner does NOT paper over:
 *
 * - HP lost is sampled as per-tick HP DECREASES, not the combat pipeline's
 *   `damageTaken`. Monster DoT, ground pools and AoE splash bypass that pipeline.
 *   Both figures are recorded so the gap between them is visible rather than
 *   silently attributed.
 * - A boss that is not killed reports its outcome and the HP fraction it actually
 *   lost. No `ttk` is extrapolated here: extrapolation assumes constant player DPS
 *   and is optimistic against a boss that hardens late, which is exactly what the
 *   50% Mass Resurrection phase does.
 * - Guardian/access is NOT measured. The guard is stripped by design, so this
 *   reports the boss encounter only and says so.
 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { MONSTER_DATABASE, NODE_BIOMES, composePlayerView } from '@mmo-idle/shared';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { setupArena, teardownArena, BOT_SPAWN } from '../bench/balance/arena';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { SurveyMetrics } from '../bench/balance/ttkSurveyMetrics';
import { hydrateHitboxCacheFromArtifact } from '../src/hitbox/cache';
import { checkpointDefinitionsHash } from '../src/admin/progressionCheckpoint';
import { ensureDungeon } from '../src/systems/world/dungeons/dungeon';
import {
  BOSS1_BLOCKS,
  BOSS1_BOSS_ID,
  BOSS1_CAP_MS,
  BOSS1_ESCORTS,
  BOSS1_SEEDS,
  assertBoss1Definitions,
} from '../bench/balance/boss1Spec';
import type { Night5Cell } from '../bench/balance/night5Spec';
import type { World } from '../src/world/World';

const args = Object.fromEntries(process.argv.slice(2).map((s) => {
  const i = s.indexOf('=');
  return [s.slice(2, i), s.slice(i + 1)];
})) as Record<string, string>;

const realNow = Date.now, realRandom = Math.random;
const sha = (v: string | Buffer): string => createHash('sha256').update(v).digest('hex');

const trial = args.trial ?? 'boss1';
const mode = (args.mode ?? 'run') as 'qualify' | 'pilot' | 'run';
const out = resolve(args.out!);
assert(args.out && args.hitboxes, '--out and --hitboxes are required');
assert(trial === 'boss1', `unknown trial ${trial}`);

assertBoss1Definitions();

const block = BOSS1_BLOCKS[args.block ?? 'sovereign'];
assert(block, `unknown block ${args.block}`);
const cells: Night5Cell[] = mode === 'pilot'
  ? block.cells.filter((c) => block.pilotIds.includes(c.id))
  : block.cells;
const seeds = mode === 'run' ? [...BOSS1_SEEDS] : [BOSS1_SEEDS[0]];

hydrateHitboxCacheFromArtifact(JSON.parse(readFileSync(args.hitboxes, 'utf8')));

const revision = args.revision
  ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

const manifest = {
  schema: 1,
  mode,
  trial,
  block: args.block ?? 'sovereign',
  revision,
  definitionsHash: checkpointDefinitionsHash(),
  hitboxesSha256: sha(readFileSync(args.hitboxes)),
  synthetic: true,
  economyEligible: false,
  dtMs: 100,
  // A pilot is a short proof the encounter runs; it is never a measurement.
  durationMs: mode === 'pilot' ? 60000 : BOSS1_CAP_MS,
  sampleEveryMs: 1000,
  bossId: BOSS1_BOSS_ID,
  /** The guard is stripped by design; access is a separate question this screen does not answer. */
  guardianAccess: 'not-measured-guard-stripped',
  seeds,
  cells,
};

/**
 * Clear the guard and wake the boss now.
 *
 * A dungeon node standing idle holds only its GUARD; the boss is spawned by
 * `activateDungeonAltar` plus a wake-up delay, and a bench bot never touches the
 * altar. Without this the run measures the guard and calls it a boss.
 */
function forceBossPhase(world: World, nodeId: string): void {
  ensureDungeon(world, nodeId);
  const state = world.dungeons.get(nodeId);
  assert(state, `no dungeon state for ${nodeId}`);
  for (const id of state.guardianIds) world.removeMonsterEntity(id);
  state.guardianIds = [];
  state.guardiansEngaged = true;
  state.status = 'bossAwakening';
  state.bossAwakensAtMs = -1; // wakes on the next tick
}

/**
 * Display name -> monster type id.
 *
 * Some damage events carry a source that is no longer a live entity (a DoT tick or
 * ground zone resolving after its owner is gone), leaving only a display name. Without
 * this the boss's own late damage lands in the ADDS bucket as "Charnel-Crown
 * Sovereign", which is exactly the pooling the packet forbids. Raised variants
 * ("Risen Bone Crawler") deliberately do not resolve and keep their own key.
 */
const TYPE_BY_NAME = new Map<string, string>(
  [...MONSTER_DATABASE.values()].map((m) => [m.name, m.id]),
);

const findBoss = (world: World, nodeId: string) => {
  for (const m of world.monsterEntitiesInNode(nodeId)) {
    if (m.isMonster.monsterTypeId === BOSS1_BOSS_ID) return m;
  }
  return null;
};

function run(cell: Night5Cell, seed: number) {
  let randomState = seed, now = 1800000000000;
  Math.random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 4294967296;
  };
  Date.now = () => now;
  const world = createBalanceWorld();
  try {
    setupArena(world, {
      nodeId: cell.nodeId,
      biomeGroup: NODE_BIOMES[cell.nodeId]!.biomeGroup,
      contentTier: cell.tier,
      isDungeon: true,
    });
    forceBossPhase(world, cell.nodeId);
    const { bot, view } = prepareSurveyBot(world, cell, BOT_SPAWN);

    // Tick once so the boss actually spawns before the receipt is written; a
    // receipt taken before the wake-up records an empty arena.
    world.tick(100, now);
    const boss = findBoss(world, cell.nodeId);
    assert(boss, `${cell.id}: boss never woke — the encounter was not exercised`);

    const roster = () => [...world.monsterEntitiesInNode(cell.nodeId)].map((m) => ({
      id: m.entityId,
      type: m.isMonster.monsterTypeId,
      hp: m.hasHealth.hp,
      maxHp: m.hasHealth.maxHp,
      attack: m.dealsDamage.attack,
      plating: m.mitigatesDamage.plating,
      dr: m.mitigatesDamage.damageReduction,
    }));

    const initial = roster();
    const ready = {
      cell: cell.id,
      seed,
      synthetic: true,
      bossId: BOSS1_BOSS_ID,
      guardianAccess: 'not-measured-guard-stripped',
      view,
      /** The boss as it actually stands at wake-up, after any node modifier. */
      bossRuntime: {
        maxHp: boss.hasHealth.maxHp,
        attack: boss.dealsDamage.attack,
        plating: boss.mitigatesDamage.plating,
        dr: boss.mitigatesDamage.damageReduction,
      },
      bossAuthored: MONSTER_DATABASE.get(BOSS1_BOSS_ID)!.stats,
      /**
       * The receipt this screen exists for: the three adoption-changed escorts at
       * their AUTHORED values, so a boss row can be checked against the ordinary
       * Graveyard T4 family it shares them with.
       */
      escortsAuthored: Object.fromEntries(
        Object.keys(BOSS1_ESCORTS).map((id) => [id, { ...MONSTER_DATABASE.get(id)!.stats }]),
      ),
      escortsDeclared: BOSS1_ESCORTS,
      initialRoster: initial,
      initialRosterHash: sha(JSON.stringify(initial)),
      /** Boss1 installs nothing; a non-empty treatment would mean an overlay came back. */
      hpTreatment: [] as unknown[],
    };
    if (mode === 'qualify') return ready;

    const dir = join(out, `${cell.id}-s${seed}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'ready.json'), JSON.stringify(ready, null, 2));

    const metrics = new SurveyMetrics(bot.isPlayer.id);
    /**
     * Entity id -> monster type id, remembered for the whole run.
     *
     * Attribution cannot read the type off the world at damage time: an add is
     * frequently already removed by the time its killing exchange is ingested, and
     * the fallback display name then lands in a SECOND bucket, splitting one
     * species across `plague-hound` and `Plague Hound`. Risen variants are a real
     * distinction and keep their own key; a dead-and-gone ordinary add is not.
     */
    const typeById = new Map<string, string>();
    const register = () => {
      for (const m of world.monsterEntitiesInNode(cell.nodeId)) {
        typeById.set(m.entityId, m.isMonster.monsterTypeId);
        metrics.register(m.entityId, m.isMonster.monsterTypeId,
          MONSTER_DATABASE.get(m.isMonster.monsterTypeId)?.name ?? m.isMonster.monsterTypeId,
          m.hasHealth.maxHp);
      }
    };
    register();

    const log: unknown[] = [], samples: unknown[] = [];
    const windowMs = manifest.durationMs;
    const bossMaxHp = boss.hasHealth.maxHp;
    let elapsed = 0, outcome = 'capped', minHp = 1, attackBeats = 0, lastAttack = 0;
    let minionAttackBeats = 0; const minionLastAttack = new Map<string, number>();
    let hpLost = 0, lastBotHp = bot.hasHealth.hp, peakWindow = 0;
    const burstWindow: number[] = []; let burstSum = 0;
    let bossHp = bossMaxHp, bossSeen = true, killedAtMs: number | null = null;
    /** Add pressure, attributed to the adds rather than folded into the boss. */
    const addDamage = new Map<string, number>();
    let bossDamage = 0;
    /** Phase evidence: the 50% crossing and every cast the script starts. */
    let crossedHalfAtMs: number | null = null;
    const casts: { atMs: number; label: string }[] = [];
    let maxAddsAlive = 0;
    const wallStart = realNow();

    world.worldLogJournal = []; world.worldLogByPlayer.clear();
    world.takeNodeEvents(cell.nodeId);

    for (; elapsed < windowMs; elapsed += 100) {
      if (realNow() - wallStart > 300000) { outcome = 'wall-ceiling'; break; }
      now = 1800000000000 + elapsed;
      register();
      world.tick(100, now);

      const hp = bot.hasHealth.hp;
      const tickLoss = hp < lastBotHp ? lastBotHp - hp : 0;
      hpLost += tickLoss; lastBotHp = hp;
      burstWindow.push(tickLoss); burstSum += tickLoss;
      if (burstWindow.length > 10) burstSum -= burstWindow.shift() ?? 0;
      if (burstSum > peakWindow) peakWindow = burstSum;

      for (const e of world.worldLogJournal) {
        metrics.ingest(e, elapsed);
        const ev = e as { kind?: string; target?: { id?: string }; source?: { id?: string; name?: string }; hpDamage?: number };
        if (ev.kind === 'damage' && ev.target?.id === bot.isPlayer.id) {
          const srcId = ev.source?.id ?? '';
          const amount = ev.hpDamage ?? 0;
          const name = ev.source?.name;
          const type = typeById.get(srcId)
            ?? world.getMonsterEntity(srcId)?.isMonster.monsterTypeId
            ?? (name ? TYPE_BY_NAME.get(name) ?? name : 'unknown');
          if (type === BOSS1_BOSS_ID) bossDamage += amount;
          else addDamage.set(type, (addDamage.get(type) ?? 0) + amount);
        }
        log.push({ atMs: elapsed, event: e });
      }
      world.worldLogJournal = []; world.worldLogByPlayer.clear();
      for (const e of world.takeNodeEvents(cell.nodeId)) {
        if (e.kind === 'monster-cast-start' || e.kind === 'monster-cast-end') {
          const t = metrics.targets.get(e.monsterId);
          if (t) { if (e.kind === 'monster-cast-start') t.castsStarted++; else if (e.fired) t.castsFired++; }
          if (e.kind === 'monster-cast-start') {
            casts.push({ atMs: elapsed, label: (e as { label?: string }).label ?? 'unlabelled' });
          }
          log.push({ atMs: elapsed, event: e });
        }
      }

      const live = findBoss(world, cell.nodeId);
      let addsAlive = 0;
      for (const m of world.monsterEntitiesInNode(cell.nodeId)) {
        if (m.isMonster.monsterTypeId !== BOSS1_BOSS_ID) addsAlive++;
      }
      maxAddsAlive = Math.max(maxAddsAlive, addsAlive);
      if (live) {
        bossHp = live.hasHealth.hp;
        if (crossedHalfAtMs === null && bossHp <= bossMaxHp * 0.5) crossedHalfAtMs = elapsed;
      } else if (bossSeen) {
        bossHp = 0; killedAtMs = elapsed; outcome = 'boss-killed';
      }

      const v = composePlayerView(bot)!;
      minHp = Math.min(minHp, v.hp / v.maxHp);
      if (v.lastAttackAt !== lastAttack) { attackBeats++; lastAttack = v.lastAttackAt; }
      for (const minion of world.minionEntities) {
        if (minion.isMinion.ownerPlayerId !== bot.isPlayer.id) continue;
        const last = minionLastAttack.get(minion.entityId) ?? 0;
        if (minion.performsAttack.lastAttackAt !== last) minionAttackBeats++;
        minionLastAttack.set(minion.entityId, minion.performsAttack.lastAttackAt);
      }
      metrics.closeIfCleared(elapsed);
      metrics.sampleRecovery(elapsed, v.hp >= v.maxHp && v.barrier >= v.barrierMax && v.incomingDot === 0);
      if (elapsed % manifest.sampleEveryMs === 0) {
        samples.push({ atMs: elapsed, hp: v.hp, maxHp: v.maxHp, barrier: v.barrier,
          incomingDot: v.incomingDot, bossHp, bossMaxHp, addsAlive, pos: v.pos });
      }
      if (outcome === 'boss-killed') break;
      if (bot.isDead || bot.hasHealth.hp <= 0) { outcome = 'bot-died'; break; }
      world.pendingDeaths = [];
    }
    metrics.close(elapsed, outcome);

    const result = {
      cell: cell.id, seed, outcome, elapsedMs: elapsed, windowMs,
      /** Terminal outcome FIRST; every number below is read in its light. */
      bossKilled: outcome === 'boss-killed',
      killedAtMs,
      bossMaxHp,
      bossHpRemaining: bossHp,
      bossHpFractionRemoved: 1 - bossHp / bossMaxHp,
      /** Phase evidence. Absent casts are not proof of absent mechanics. */
      crossedHalfAtMs,
      castsStarted: casts.length,
      castLabels: [...new Set(casts.map((c) => c.label))],
      maxAddsAlive,
      /** Add pressure attributed to the adds, never folded into the boss's own output. */
      damageFromBoss: bossDamage,
      damageFromAdds: Object.fromEntries([...addDamage.entries()].sort((a, b) => b[1] - a[1])),
      /** Owner vs summon: Conduit records zero owner beats by design. */
      attackBeats, minionAttackBeats, totalAttackBeats: attackBeats + minionAttackBeats,
      /** Per-tick HP decreases, so DoT/pools/splash are included. */
      hpLost,
      peakBurst1s: peakWindow,
      minHpFraction: minHp,
      wallElapsedMs: realNow() - wallStart,
      initialRosterHash: ready.initialRosterHash,
      ...metrics.result(),
    };
    writeFileSync(join(dir, 'events.jsonl'), log.map((e) => JSON.stringify(e)).join('\n') + '\n');
    writeFileSync(join(dir, 'samples.jsonl'), samples.map((e) => JSON.stringify(e)).join('\n') + '\n');
    writeFileSync(join(dir, 'summary.json'), JSON.stringify(result, null, 2));
    return result;
  } finally {
    try { teardownArena(world); } finally { Date.now = realNow; Math.random = realRandom; }
  }
}

function main(): void {
  assert(!existsSync(out) || mode !== 'run', 'NEW output root required for a run; no retries');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const results: unknown[] = [];
  for (const cell of cells) {
    for (const seed of seeds) {
      results.push(run(cell, seed));
      writeFileSync(join(out, 'index.json'), JSON.stringify(results, null, 2));
      console.log(cell.id, seed, 'complete');
    }
  }
  writeFileSync(join(out, 'complete.json'), JSON.stringify({
    trial, block: manifest.block, mode,
    observations: results.length,
    expected: cells.length * seeds.length,
  }, null, 2));
  console.log(`${trial}/${manifest.block} ${mode}: ${results.length} observations`);
}

main();
