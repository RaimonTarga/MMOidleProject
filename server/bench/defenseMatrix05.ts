// Defense rework qualification matrix (2026-09-25): original vs pipeline-only vs
// full candidate, all six classes, T1-T4, every biome's farm node and every boss.
// Same harness and cells in every arm; only the checked-out source differs.
// Roaming farm: native auto-combat, repopulation on, first death ends the run.
// Boss: guardians removed, boss awakened, win = dungeon cooldown state.
// Usage: tsx --conditions=development bench/defenseMatrix05.ts <outDir>
//   env MATRIX_ARM (label), MATRIX_SHARD "i/n", MATRIX_HITBOXES, MATRIX_PREFLIGHT=1
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, appendFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { DUNGEON_DEFS, NODE_BIOMES, ITEM_DATABASE } from '@mmo-idle/shared';
import { BREADTH_CELLS } from './balance/playerBreadthSpec';
import { prepareSurveyBot, SURVEY_CELLS, type SurveyCell } from './balance/ttkSurveySpec';
import { createFarmWorld } from './balance/worldFactory';
import { setupArena, teardownArena, BOT_SPAWN } from './balance/arena';
import { ensureDungeon } from '../src/systems/world/dungeons/dungeon';
import { hydrateHitboxCacheFromArtifact, writeHitboxArtifact } from '../src/hitbox/cache';
import { registerCombatListener, unregisterCombatListener, type CombatEventHandler } from '../src/systems/combat/engine/combatPipeline';

const CLASSES = ['squire', 'striker', 'slinger', 'apprentice', 'spirit', 'conduit'] as const;
const MELEE = new Set(['squire', 'striker', 'conduit']);
const SEEDS = [515003, 515037];
const CAP_MS = 180_000;
const FARM_PLUS = 3;
const BOSS_PLUS = 5;

/** Class reference build per tier: T1 survey solo cell, T2-T4 balanced breadth cell. */
function baseCell(tier: number, cls: string, boss: boolean): SurveyCell {
  if (tier === 1) {
    const c = SURVEY_CELLS.find(c => c.tier === 1 && c.className === cls && c.role === 'solo' && !c.alternate);
    assert(c, `T1 survey cell ${cls}`);
    return structuredClone(c);
  }
  const role = boss ? 'boss' : 'farm';
  const c = BREADTH_CELLS.find(c => c.tier === tier && c.className === cls && c.frame === 'balanced' && c.role === role
    && !c.controlCaseId && !c.id.includes('-far-') && (tier < 4 || c.identityId.endsWith('-a')));
  assert(c, `breadth cell ${tier}/${cls}/${role}`);
  return structuredClone(c);
}

/** Breadth convention: melee and Conduit wear Mountain, ranged/casters Jungle (Forest at T1). */
function referenceArmor(tier: number, cls: string): string {
  if (MELEE.has(cls)) return `mountain-vest-t${tier}`;
  return tier === 1 ? 'forest-vest-t1' : `jungle-vest-t${tier}`;
}

const cells: SurveyCell[] = [];
function add(kind: 'home' | 'ref' | 'boss', tier: number, cls: string, nodeId: string, armor: string) {
  const cell = baseCell(tier, cls, kind === 'boss');
  cell.nodeId = nodeId;
  cell.isDungeon = kind === 'boss';
  cell.upgradeLevel = kind === 'boss' ? BOSS_PLUS : FARM_PLUS;
  cell.build.gearItemIds.armor = armor;
  cell.id = `${kind}-t${tier}-${cls}-${nodeId}-${armor}`;
  cell.build.id = cell.id;
  cells.push(cell);
}

for (const tier of [1, 2, 3, 4]) {
  const farmNodes = Object.entries(NODE_BIOMES)
    .filter(([id, n]) => n.biomeTier === tier && id.endsWith('-03') && !id.includes('dungeon'))
    .map(([id, n]) => ({ id, biome: n.biomeGroup }));
  const bossNodes = [...DUNGEON_DEFS.entries()].filter(([, d]) => d.biomeTier === tier).map(([id]) => id);
  for (const cls of CLASSES) {
    const ref = referenceArmor(tier, cls);
    for (const { id, biome } of farmNodes) {
      const home = `${biome}-vest-t${tier}`;
      if (ITEM_DATABASE.has(home)) add('home', tier, cls, id, home);
      if (ref !== home) add('ref', tier, cls, id, ref);
    }
    for (const node of bossNodes) add('boss', tier, cls, node, ref);
  }
}

async function main() {
  assert(process.argv[2], 'output directory required');
  const out = resolve(process.argv[2]);
  const artifact = resolve(process.env.MATRIX_HITBOXES ?? resolve(out, '..', 'hitboxes.json'));
  if (!existsSync(artifact)) await writeHitboxArtifact(artifact);
  assert(hydrateHitboxCacheFromArtifact(artifact) > 0);
  assert(new Set(cells.map(c => c.id)).size === cells.length, 'duplicate cell ids');
  for (const c of cells) {
    assert(NODE_BIOMES[c.nodeId], `unknown node ${c.nodeId}`);
    assert(ITEM_DATABASE.has(c.build.gearItemIds.armor!), `unknown armor ${c.build.gearItemIds.armor}`);
  }
  const [shard, shards] = (process.env.MATRIX_SHARD ?? '0/1').split('/').map(Number);
  const selected = cells.filter((_, i) => i % shards === shard);
  if (process.env.MATRIX_PREFLIGHT === '1') {
    const kinds: Record<string, number> = {};
    for (const c of cells) { const k = c.id.split('-t')[0] + '-t' + c.tier; kinds[k] = (kinds[k] ?? 0) + 1; }
    console.log(JSON.stringify({ cells: cells.length, runs: cells.length * SEEDS.length, kinds }));
    for (const c of selected) { const world = createFarmWorld(); prepareSurveyBot(world, c, BOT_SPAWN); teardownArena(world); }
    console.log(`preflight ok: ${selected.length} cells prepared`);
    return;
  }
  assert(!existsSync(out), `Refusing to overwrite ${out}`);
  mkdirSync(out, { recursive: true });
  writeFileSync(resolve(out, 'manifest.json'), JSON.stringify({
    schema: 1, arm: process.env.MATRIX_ARM ?? 'unlabelled', shard: `${shard}/${shards}`,
    source: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    diff: execFileSync('git', ['diff'], { encoding: 'utf8', maxBuffer: 20e6 }),
    runnerSha256: createHash('sha256').update(readFileSync(__filename)).digest('hex'),
    hitboxSha256: createHash('sha256').update(readFileSync(artifact)).digest('hex'),
    capMs: CAP_MS, seeds: SEEDS, cellIds: selected.map(c => c.id),
  }, null, 2));

  const originalRandom = Math.random, originalNow = Date.now;
  let completed = 0;
  for (const cell of selected) for (const seed of SEEDS) {
    let state = seed;
    Math.random = () => { state |= 0; state = state + 0x6D2B79F5 | 0; let t = Math.imul(state ^ state >>> 15, 1 | state); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    let now = 0; Date.now = () => now;
    const world = createFarmWorld(); world.suppressRepopulation = !!cell.isDungeon;
    const target = { nodeId: cell.nodeId, biomeGroup: NODE_BIOMES[cell.nodeId].biomeGroup, contentTier: cell.tier, isDungeon: !!cell.isDungeon };
    let deathCause: unknown = null;
    const originalKill = world.killPlayer.bind(world);
    world.killPlayer = (id, cause) => { deathCause = cause; originalKill(id, cause); };
    let kills = 0, maxHit = 0, fullHpLethalHits = 0, damage = 0, hitCount = 0, evades = 0;
    const hits: unknown[] = [];
    const listener: CombatEventHandler = ctx => {
      if (ctx.defenderType !== 'player') return;
      hitCount++; if (ctx.metadata.evaded) evades++;
      maxHit = Math.max(maxHit, ctx.damage); damage += ctx.damage;
      if (ctx.damage >= ctx.defender.hasHealth.maxHp) fullHpLethalHits++;
      hits.push({ t: now, attacker: ctx.attackerType === 'monster' ? ctx.attacker.isMonster.monsterTypeId : ctx.attackerType, hpBefore: ctx.defender.hasHealth.hp, damage: ctx.damage, gross: ctx.metadata.incomingGross, ability: ctx.metadata.abilityName });
      if (hits.length > 12) hits.shift();
    };
    const kill: CombatEventHandler = ctx => { if (ctx.defenderType === 'monster') kills++; };
    registerCombatListener('onDamageTaken', listener); registerCombatListener('onKill', kill);
    try {
      setupArena(world, target);
      const bossId = cell.isDungeon ? DUNGEON_DEFS.get(cell.nodeId)!.boss.bossId : null;
      if (cell.isDungeon) {
        ensureDungeon(world, cell.nodeId);
        const d = world.dungeons.get(cell.nodeId)!; assert(d);
        for (const id of d.guardianIds) world.removeMonsterEntity(id);
        d.guardianIds = []; d.guardiansEngaged = true; d.status = 'bossAwakening'; d.bossAwakensAtMs = -1;
      }
      const { bot } = prepareSurveyBot(world, cell, BOT_SPAWN);
      const starting = { hp: bot.hasHealth.maxHp, plating: bot.mitigatesDamage.plating, dr: bot.mitigatesDamage.damageReduction, dodge: bot.evadesHits?.dodgeRate ?? 0 };
      let outcome = 'timeout', bossSeen = false, bossHpFraction = 1, minHp = 1, lowHpMs = 0;
      for (; now < CAP_MS;) {
        world.tick(100, now); now += 100; world.pendingDeaths = [];
        if (bot.hasHealth.hp <= 0 || bot.isDead) { outcome = 'bot_died'; break; }
        minHp = Math.min(minHp, bot.hasHealth.hp / bot.hasHealth.maxHp);
        if (bot.hasHealth.hp / bot.hasHealth.maxHp < 0.25) lowHpMs += 100;
        if (bossId) {
          const boss = [...world.monsterEntitiesInNode(cell.nodeId)].find(m => m.isMonster.monsterTypeId === bossId);
          if (boss) { bossSeen = true; bossHpFraction = boss.hasHealth.hp / boss.hasHealth.maxHp; }
          else if (bossSeen) {
            outcome = world.dungeons.get(cell.nodeId)?.status === 'cooldown' ? 'boss_killed' : 'boss_missing';
            if (outcome === 'boss_killed') bossHpFraction = 0;
            break;
          }
        }
      }
      const row = { id: cell.id, tier: cell.tier, className: cell.className, kind: cell.id.split('-')[0], nodeId: cell.nodeId, armor: cell.build.gearItemIds.armor, seed, outcome, elapsedMs: now, kills, bossSeen, bossHpFraction, minHp, lowHpMs, hpEnd: bot.hasHealth.hp, maxHit, fullHpLethalHits, damage, hitCount, evades, starting, deathCause, lastHits: hits };
      appendFileSync(resolve(out, 'rows.jsonl'), JSON.stringify(row) + '\n');
      console.log(JSON.stringify({ completed: ++completed, total: selected.length * SEEDS.length, id: cell.id, seed, outcome, kills, elapsedMs: now }));
    } catch (error) {
      appendFileSync(resolve(out, 'failures.jsonl'), JSON.stringify({ id: cell.id, seed, error: String(error) }) + '\n');
      throw error;
    } finally {
      unregisterCombatListener('onDamageTaken', listener); unregisterCombatListener('onKill', kill);
      teardownArena(world); Math.random = originalRandom; Date.now = originalNow;
    }
  }
  writeFileSync(resolve(out, 'complete.json'), JSON.stringify({ completed, expected: selected.length * SEEDS.length }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
