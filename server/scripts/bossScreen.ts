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
import {
  MONSTER_DATABASE, NODE_BIOMES, composePlayerView,
  runicPointLoadoutCost, runeBudgetForGlobalMastery,
} from '@mmo-idle/shared';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { setupArena, teardownArena, BOT_SPAWN } from '../bench/balance/arena';
import { prepareSurveyBot, resolveSurveyPackage } from '../bench/balance/ttkSurveySpec';
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
  BOSS1_TIMBERCLAW_BOSS_ID,
  BOSS1_TIMBERCLAW_CAP_MS,
  BOSS1_TIMBERCLAW_SEEDS,
  assertBoss1Definitions,
} from '../bench/balance/boss1Spec';
import {
  BOSS2_BLOCKS,
  BOSS2_BOSSES,
  BOSS2_CAP_MS,
  BOSS2_SEED,
  assertBoss2Definitions,
} from '../bench/balance/boss2Spec';
import {
  BOSS3_BLOCKS,
  BOSS3_BLOCKS_DEF,
  BOSS3_CAP_MS,
  assertBoss3Definitions,
} from '../bench/balance/boss3Spec';
import {
  BOSSREF_BLOCKS,
  BOSSREF_BOSS_ID,
  BOSSREF_CAP_MS,
  BOSSREF_SEEDS,
  assertBossReferenceDefinitions,
} from '../bench/balance/bossReferenceSpec';
import {
  classifyBossTick, countsTowardAdds, isVictory, resolveTerminalBossHp,
  type BossTerminal,
} from '../bench/balance/bossTerminal';
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

/**
 * One entry per frozen trial. Each owns its boss, blocks, seeds and cap, so adding
 * a trial never reinterprets an existing one -- `boss1` behaves exactly as it did
 * when its packet was frozen.
 *
 * `escorts` is the adoption-changed species a boss summons. Apex Timberclaw summons
 * nothing, so its entry is empty and the escort receipt rule simply does not apply
 * to it; that is recorded rather than faked.
 */
interface BlockSpec {
  bossId: string; capMs: number; seeds: readonly number[];
  escorts: Record<string, { hp: number; attack: number }>;
}
const TRIALS: Record<string, {
  defaultBlock: string;
  blocks: Record<string, { cells: Night5Cell[]; durationMs: number; pilotIds: string[] }>;
  /** Boss identity is per BLOCK: an earlier/later screen fights two different bosses. */
  perBlock: Record<string, BlockSpec>;
  assertDefinitions: () => void;
}> = {
  boss1: {
    defaultBlock: 'sovereign', blocks: BOSS1_BLOCKS,
    perBlock: {
      sovereign: { bossId: BOSS1_BOSS_ID, capMs: BOSS1_CAP_MS, seeds: BOSS1_SEEDS, escorts: BOSS1_ESCORTS },
      timberclaw: { bossId: BOSS1_TIMBERCLAW_BOSS_ID, capMs: BOSS1_TIMBERCLAW_CAP_MS,
        seeds: BOSS1_TIMBERCLAW_SEEDS, escorts: {} },
    },
    assertDefinitions: assertBoss1Definitions,
  },
  /**
   * Boss2 -- one BLOCK PER BOSS, six in all. The blocks are independent by
   * construction, so a local problem on one boss never consumes another's
   * allocation, and `escorts` is per boss rather than per screen: only the
   * Razortusk summons anything, and only its receipt rule has teeth.
   */
  boss2: {
    defaultBlock: BOSS2_BOSSES[0]!.name, blocks: BOSS2_BLOCKS,
    perBlock: Object.fromEntries(BOSS2_BOSSES.map((b) => [b.name, {
      bossId: b.bossId, capMs: BOSS2_CAP_MS, seeds: [BOSS2_SEED], escorts: b.escorts,
    }])),
    assertDefinitions: assertBoss2Definitions,
  },
  /**
   * Boss3 -- the Brace-to-Cleanse substitution, two blocks of twelve.
   *
   * Unlike Boss2, a block here holds BOTH ARMS of one boss: the baseline and the
   * substitution run back to back on the same revision and the same reused seed, so
   * the pair is never split across two runs that could diverge in anything else.
   * Neither boss summons, so the escort receipt rule has no teeth on either -- which
   * is recorded rather than faked.
   */
  boss3: {
    defaultBlock: BOSS3_BLOCKS_DEF[0]!.name, blocks: BOSS3_BLOCKS,
    perBlock: Object.fromEntries(BOSS3_BLOCKS_DEF.map((b) => [b.name, {
      bossId: b.bossId, capMs: BOSS3_CAP_MS, seeds: [b.seed], escorts: {},
    }])),
    assertDefinitions: assertBoss3Definitions,
  },
  bossref: {
    defaultBlock: 'reference', blocks: BOSSREF_BLOCKS,
    perBlock: {
      reference: { bossId: BOSSREF_BOSS_ID, capMs: BOSSREF_CAP_MS, seeds: BOSSREF_SEEDS, escorts: {} },
    },
    assertDefinitions: assertBossReferenceDefinitions,
  },
};

const trialSpec = TRIALS[trial];
assert(trialSpec, `unknown trial ${trial}`);
trialSpec.assertDefinitions();

const blockName = args.block ?? trialSpec.defaultBlock;
const block = trialSpec.blocks[blockName];
assert(block, `unknown block ${blockName}`);
const spec = trialSpec.perBlock[blockName];
assert(spec, `block ${blockName} declares no boss`);
const cells: Night5Cell[] = mode === 'pilot'
  ? block.cells.filter((c) => block.pilotIds.includes(c.id))
  : block.cells;
assert(cells.length > 0, `${trial}/${blockName}: mode ${mode} selected no cells`);
const seeds = mode === 'run' ? [...spec.seeds] : [spec.seeds[0]!];

hydrateHitboxCacheFromArtifact(JSON.parse(readFileSync(args.hitboxes, 'utf8')));

const revision = args.revision
  ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

const manifest = {
  schema: 1,
  mode,
  trial,
  block: blockName,
  revision,
  definitionsHash: checkpointDefinitionsHash(),
  hitboxesSha256: sha(readFileSync(args.hitboxes)),
  synthetic: true,
  economyEligible: false,
  dtMs: 100,
  // A pilot is a short proof the encounter runs; it is never a measurement.
  durationMs: mode === 'pilot' ? 60000 : spec.capMs,
  sampleEveryMs: 1000,
  bossId: spec.bossId,
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
    if (m.isMonster.monsterTypeId === spec.bossId) return m;
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
    /** Resolved from the cell before preparation, so the declaration is never read back off the bot. */
    const declared = resolveSurveyPackage(cell);
    const { bot, view } = prepareSurveyBot(world, cell, BOT_SPAWN);

    // Tick once so the boss actually spawns before the receipt is written; a
    // receipt taken before the wake-up records an empty arena.
    world.tick(100, now);
    const boss = findBoss(world, cell.nodeId);
    assert(boss, `${cell.id}: boss never woke — the encounter was not exercised`);
    /** Pinned at wake so kill evidence can be matched to THIS boss entity. */
    const bossEntityId = boss.entityId;

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
      bossId: spec.bossId,
      guardianAccess: 'not-measured-guard-stripped',
      view,
      /**
       * The package as DECLARED, recorded before the fight so a case can never be
       * read as something it was not run as.
       *
       * This is the RESOLVED declaration -- what `resolveSurveyPackage` says
       * preparation will apply -- not the cell's raw optional fields. Recording the
       * raw fields is what failed Boss1's Sovereign block: twelve clean fights
       * declared `stance: null` against a correctly applied Offensive, because a
       * cell that INHERITS the preparation default carries no stance of its own.
       *
       * It is still computed from the cell ALONE, before the fight, so the check
       * against `appliedPackage` stays a real one. `sources` keeps an omitted field,
       * an explicit choice and a tier that admits no stance apart; `runeRules: []`
       * remains a real statement (the legacy package equips none), not a gap.
       */
      declaredPackage: {
        treatment: cell.treatment,
        classRoot: cell.build.classRoot,
        skillPath: [...cell.build.skillPath],
        gearItemIds: { ...cell.build.gearItemIds },
        upgradeLevel: declared.upgradeLevel,
        stance: declared.stance,
        abilities: declared.abilities,
        runeRules: declared.runeRules,
        sources: declared.sources,
      },
      /**
       * The package as it actually MATERIALISED on the bot, read back from the
       * entity. A divergence between this and `declaredPackage` is the run being
       * something other than what the packet says.
       */
      appliedPackage: {
        selectedSubVariant: view.selectedSubVariant,
        selectedRange: view.selectedRange,
        activeStance: view.activeStance,
        attunedStances: [...view.attunedStances ?? []],
        attunedAbilities: structuredClone(view.attunedAbilities),
        runesEquipped: structuredClone(view.runesEquipped),
        equipment: { ...view.equipment },
        itemUpgrades: { ...view.itemUpgrades },
        globalMastery: view.globalMastery,
        biomeLevel: { ...view.biomeLevel },
      },
      /** RP is the budget all three of stance, abilities and rules draw on. */
      runicPoints: {
        budget: runeBudgetForGlobalMastery(view.globalMastery),
        cost: runicPointLoadoutCost({
          rules: declared.runeRules as never,
          abilities: declared.abilities,
          stances: declared.stance ? [declared.stance] : [],
          rites: [...view.equippedRites ?? []],
        }),
      },
      /** Effective stats at the starting bell, after every layer has resolved. */
      effectiveStats: {
        maxHp: view.maxHp, attack: view.attack, plating: view.plating,
        damageReduction: view.damageReduction, dodgeRate: view.dodgeRate,
        evadeMitigation: view.evadeMitigation, recovery: view.recovery,
        speed: view.speed, attackRange: view.attackRange,
        attackCooldown: view.attackCooldown,
        finalDamageDealtMult: view.finalDamageDealtMult,
        finalDamageTakenMult: view.finalDamageTakenMult,
        barrier: view.barrier, barrierMax: view.barrierMax,
      },
      /** Archetype and wallet resources at the starting bell. */
      resources: {
        energyCount: view.energyCount, energyMax: view.energyMax,
        ammoCount: view.ammoCount, ammoMax: view.ammoMax,
        cadenceCount: view.cadenceCount, cadenceThreshold: view.cadenceThreshold,
        essences: { ...view.essences }, catalysts: { ...view.catalysts },
      },
      /** How the encounter was initialized, stated rather than assumed. */
      encounterSetup: {
        nodeId: cell.nodeId,
        isDungeon: true,
        guardHandling: 'stripped-before-spawn',
        bossWake: 'forced-immediate',
        capMs: manifest.durationMs,
        seed,
        nonBossBodiesAtStart: initial.filter((m) => m.type !== spec.bossId).length,
      },
      /** The boss as it actually stands at wake-up, after any node modifier. */
      bossRuntime: {
        maxHp: boss.hasHealth.maxHp,
        attack: boss.dealsDamage.attack,
        plating: boss.mitigatesDamage.plating,
        dr: boss.mitigatesDamage.damageReduction,
      },
      bossAuthored: MONSTER_DATABASE.get(spec.bossId)!.stats,
      /**
       * The receipt this screen exists for: the three adoption-changed escorts at
       * their AUTHORED values, so a boss row can be checked against the ordinary
       * Graveyard T4 family it shares them with.
       */
      escortsAuthored: Object.fromEntries(
        Object.keys(spec.escorts).map((id) => [id, { ...MONSTER_DATABASE.get(id)!.stats }]),
      ),
      escortsDeclared: spec.escorts,
      initialRoster: initial,
      initialRosterHash: sha(JSON.stringify(initial)),
      /** Both trials install nothing; a non-empty treatment would mean an overlay came back. */
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
    let bossSeen = true, killedAtMs: number | null = null;
    /**
     * Last boss HP read while the boss was genuinely PRESENT. Terminal HP is taken
     * from this rather than fabricated, so a disappearance never reports a zero it
     * cannot support.
     */
    let lastSupportedBossHp: number | null = bossMaxHp;
    /** Authoritative, boss-specific: a kill event naming the boss as victim. */
    let bossKillEvidence: { atMs: number; victimId: string; victimName: string | null; killerId: string | null } | null = null;
    let playerDeathEvidence: { atMs: number; cause: unknown } | null = null;
    let resetEvidence: { atMs: number; message: string } | null = null;
    let terminal: BossTerminal = null;
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
        // Authoritative boss-specific kill evidence. The victim must BE the boss:
        // a kill anywhere else in the node says nothing about this encounter.
        if (ev.kind === 'kill') {
          const k = e as { victim?: { id?: string; name?: string }; killer?: { id?: string } };
          const victimId = k.victim?.id ?? '';
          const victimType = typeById.get(victimId)
            ?? (k.victim?.name ? TYPE_BY_NAME.get(k.victim.name) : undefined);
          if (victimId === bossEntityId || victimType === spec.bossId) {
            bossKillEvidence ??= { atMs: elapsed, victimId,
              victimName: k.victim?.name ?? null, killerId: k.killer?.id ?? null };
          }
        }
        if (ev.kind === 'player-death') {
          playerDeathEvidence ??= { atMs: elapsed, cause: (e as { cause?: unknown }).cause ?? null };
        }
        // `resetDungeon` announces itself. "The guard reforms." is the wipe path that
        // removes the boss and respawns the guard in the same tick.
        if (ev.kind === 'dungeon-message') {
          const msg = (e as { message?: string }).message ?? '';
          if (/reforms/i.test(msg)) resetEvidence ??= { atMs: elapsed, message: msg };
        }
        if (ev.kind === 'damage' && ev.target?.id === bot.isPlayer.id) {
          const srcId = ev.source?.id ?? '';
          const amount = ev.hpDamage ?? 0;
          const name = ev.source?.name;
          const type = typeById.get(srcId)
            ?? world.getMonsterEntity(srcId)?.isMonster.monsterTypeId
            ?? (name ? TYPE_BY_NAME.get(name) ?? name : 'unknown');
          if (type === spec.bossId) bossDamage += amount;
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
      if (live) {
        lastSupportedBossHp = live.hasHealth.hp;
        if (crossedHalfAtMs === null && lastSupportedBossHp <= bossMaxHp * 0.5) crossedHalfAtMs = elapsed;
      }

      // Classify BEFORE anything is attributed to this tick. A wipe removes the boss
      // and respawns the guard in the same tick, so a tick that terminated must not
      // also donate its bodies to add statistics.
      terminal = classifyBossTick({
        bossKillEvent: bossKillEvidence?.atMs === elapsed,
        // `isDead` is a presence-gated COMPONENT, not a boolean flag.
        playerDead: playerDeathEvidence?.atMs === elapsed || !!bot.isDead || bot.hasHealth.hp <= 0,
        bossPresent: live !== null,
        dungeonReset: resetEvidence?.atMs === elapsed,
        bossSeen,
      });

      let addsAlive = 0;
      for (const m of world.monsterEntitiesInNode(cell.nodeId)) {
        if (m.isMonster.monsterTypeId !== spec.bossId) addsAlive++;
      }
      if (countsTowardAdds(terminal)) maxAddsAlive = Math.max(maxAddsAlive, addsAlive);
      if (terminal === 'boss-killed' || terminal === 'simultaneous-terminal') killedAtMs = elapsed;

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
          incomingDot: v.incomingDot, bossHp: lastSupportedBossHp, bossMaxHp, addsAlive, pos: v.pos });
      }
      if (terminal !== null) { outcome = terminal; break; }
      world.pendingDeaths = [];
    }
    metrics.close(elapsed, outcome);

    const terminalHp = resolveTerminalBossHp(terminal, lastSupportedBossHp);
    const result = {
      cell: cell.id, seed, outcome, elapsedMs: elapsed, windowMs,
      /** Terminal outcome FIRST; every number below is read in its light. */
      bossKilled: isVictory(terminal),
      /**
       * The authoritative evidence, carried so a victory can never rest on the
       * boss merely being absent. `null` here with `bossKilled` true is a defect.
       */
      bossKillEvidence,
      playerDeathEvidence,
      encounterResetEvidence: resetEvidence,
      killedAtMs,
      bossMaxHp,
      /** Last SUPPORTED reading. Null means no reading could be supported. */
      bossHpRemaining: terminalHp.hp,
      terminalBossHpSupported: terminalHp.supported,
      bossHpFractionRemoved: terminalHp.hp === null ? null : 1 - terminalHp.hp / bossMaxHp,
      /** Phase evidence. Absent casts are not proof of absent mechanics. */
      crossedHalfAtMs,
      castsStarted: casts.length,
      castLabels: [...new Set(casts.map((c) => c.label))],
      /** Post-terminal replacement guardians are excluded; see `countsTowardAdds`. */
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
