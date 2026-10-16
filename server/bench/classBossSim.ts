/**
 * Class boss sim: one class, as a route leaves it at a boss, against that boss, in-process
 * and many times faster than a live lane (overnight 2026-10-16).
 *
 * The player is built the way the live server builds one: the class root and the tier picks
 * through `unlockSkill`, the gear through `equipItem` (no upgrades unless asked), the biome
 * levels and boss clears the route would hold, then `refreshClassConfig`, so the class runs its
 * `auto` default exactly as a bot on `--policy=intended` does (the bot only sets auto; the
 * server's own AI and class runtime fight). The guard is stripped and the boss wakes at once
 * (`bossExam`'s method), and the player starts at full HP: a live attempt meets the boss after
 * the guard, often below full, so a sim win at a thin margin can still be a live loss.
 *
 *   pnpm --filter @mmo-idle/server exec tsx --conditions=development bench/classBossSim.ts \
 *     --class cadence --tier 1 --boss plains \
 *     --gear striker-broadblade-t1,plains-vest-t1,clearing-charm-t1,clearing-boots-t1 \
 *     [--skills striker-light,...] [--levels plains=6,clearing=4] [--cleared plains:1]
 *     [--runs 3] [--max-seconds 240] [--upgrade 0] [--json]
 *
 * `--levels` replaces the default (every biome of the tier and below at its cap for the tier);
 * `--cleared` lists boss clears (`<biome>:<tier>`), which grant trophies; `--skills` lists the
 * discipline / specialization / leaf ids after the root. The output names each run's outcome,
 * the boss HP left, the fight length, the player's damage per second on the boss, the HP it
 * lost per second, and which hit effects fired (the class's pieces show up as effect names).
 */
import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  DEFAULT_RUNE_LOADOUT,
  DUNGEON_DEFS,
  GAME_CONFIG,
  ITEM_DATABASE,
  MONSTER_DATABASE,
  SKILL_TREE,
  baseRecoveryForTier,
  biomeLevelCap,
  emptyEquipment,
  getMaxUpgrade,
  listBiomeGroupsAtTier,
  runeIdsForArchetype,
} from '@mmo-idle/shared';
import { BENCH_DT_MS, ensureBenchHitboxCache } from './harness';
import type { World } from '../src/world/World';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { createBalanceWorld } from './balance/worldFactory';
import { setupArena, teardownArena, BOT_SPAWN } from './balance/arena';
import { BENCH_BOT_ID } from './balance/botFactory';
import { ensureDungeon } from '../src/systems/world/dungeons/dungeon';
import { unlockSkill } from '../src/systems/player/progression/skills';
import { equipItem } from '../src/systems/player/economy/inventory';
import { refreshClassConfig } from '../src/systems/player/progression/classConfig';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';

// ── CLI ──────────────────────────────────────────────────────────────────────

const ARGV = process.argv.slice(2);
const argOf = (name: string): string | null => {
  const i = ARGV.indexOf(name);
  return i >= 0 && ARGV[i + 1] && !ARGV[i + 1].startsWith('--') ? ARGV[i + 1] : null;
};
const list = (value: string | null): string[] => (value ? value.split(',').map((s) => s.trim()).filter(Boolean) : []);

const CLASS = argOf('--class') ?? 'cadence';
const CLASS_ROOT = CLASS.endsWith('-root') ? CLASS : `${CLASS}-root`;
const TIER = Number(argOf('--tier') ?? 1);
const BOSS_BIOME = argOf('--boss');
const GEAR = list(argOf('--gear'));
const SKILLS = list(argOf('--skills'));
const CLEARED = list(argOf('--cleared'));
const LEVELS = list(argOf('--levels'));
const RUNS = Number(argOf('--runs') ?? 3);
const MAX_SECONDS = Number(argOf('--max-seconds') ?? 240);
const UPGRADE = Number(argOf('--upgrade') ?? 0);
const JSON_OUT = ARGV.includes('--json');

if (SKILL_TREE.get(CLASS_ROOT)?.tier !== 0) throw new Error(`unknown class "${CLASS}"`);

// ── The encounter ────────────────────────────────────────────────────────────

interface BossNode { nodeId: string; biomeGroup: string; bossId: string }

function bossNodes(): BossNode[] {
  const out: BossNode[] = [];
  for (const def of DUNGEON_DEFS.values()) {
    if (def.biomeTier !== TIER) continue;
    if (BOSS_BIOME && def.biomeGroup !== BOSS_BIOME) continue;
    if (!MONSTER_DATABASE.get(def.boss.bossId)?.isBoss) continue;
    out.push({ nodeId: def.nodeId, biomeGroup: def.biomeGroup, bossId: def.boss.bossId });
  }
  if (out.length === 0) throw new Error(`no tier-${TIER} boss${BOSS_BIOME ? ` in ${BOSS_BIOME}` : ''}`);
  return out;
}

/** Strip the guard and wake the boss on the next tick (bossExam's method). */
function forceBossPhase(world: World, nodeId: string): void {
  ensureDungeon(world, nodeId);
  const state = world.dungeons.get(nodeId);
  if (!state) throw new Error(`no dungeon state for ${nodeId}`);
  for (const id of state.guardianIds) world.removeMonsterEntity(id);
  state.guardianIds = [];
  state.guardiansEngaged = true;
  state.status = 'bossAwakening';
  state.bossAwakensAtMs = -1;
}

function findBoss(world: World, node: BossNode): MonsterEntity | null {
  for (const m of world.monsterEntitiesInNode(node.nodeId)) {
    if (m.isMonster.monsterTypeId === node.bossId) return m;
  }
  return null;
}

// ── The player, as the route leaves it ───────────────────────────────────────

function biomeLevels(): Record<string, number> {
  const levels: Record<string, number> = {};
  if (LEVELS.length > 0) {
    for (const entry of LEVELS) {
      const [group, level] = entry.split('=');
      levels[group] = Number(level);
    }
    return levels;
  }
  levels.clearing = biomeLevelCap(TIER, 'clearing');
  for (let tier = 1; tier <= TIER; tier++) {
    for (const group of listBiomeGroupsAtTier(tier)) levels[group] = biomeLevelCap(TIER, group);
  }
  return levels;
}

function playerSlices(nodeId: string, pos: { x: number; y: number }): PersistedPlayerSlices {
  return {
    isPlayer: { id: BENCH_BOT_ID, name: 'sim' },
    hasPosition: { current: pos, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {},
      biomeLevel: biomeLevels(),
      unlockedRecipes: [],
      questProgress: {},
      playerTier: TIER,
      currentSkillTier: 0,
      bossesCleared: [...CLEARED],
      clearedNodes: [],
      runesOwned: runeIdsForArchetype(null),
      runesEquipped: [...DEFAULT_RUNE_LOADOUT],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  };
}

function buildPlayer(world: World, node: BossNode, run: number): PlayerEntity {
  // A small spawn offset per run, so repeated runs are not one identical fight.
  const pos = { x: BOT_SPAWN.x + ((run * 37) % 120) - 60, y: BOT_SPAWN.y };
  const p = world.attachPlayerEntity(playerSlices(node.nodeId, pos), BENCH_BOT_ID);
  p.tracksProgression.playerTier = TIER;
  p.tracksProgression.skillPoints = 999;
  for (const skillId of [CLASS_ROOT, ...SKILLS]) {
    if (!unlockSkill(world, p, skillId)) throw new Error(`unlock failed: ${skillId}`);
  }
  for (const itemId of GEAR) {
    const def = ITEM_DATABASE.get(itemId);
    if (!def) throw new Error(`unknown item ${itemId}`);
    p.holdsInventory.inventory.push(itemId);
    equipItem(world, p, itemId);
    if (!Object.values(p.holdsInventory.equipment).includes(itemId)) throw new Error(`could not equip ${itemId}`);
    if (UPGRADE > 0) p.holdsInventory.itemUpgrades[itemId] = Math.min(UPGRADE, getMaxUpgrade(def));
  }
  refreshClassConfig(world, p);
  syncArchetypeSlices(world, p);
  recalculatePlayerEntityStats(world, p);
  syncArchetypeSlices(world, p);
  Object.assign(p.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true, autoTraverse: false });
  p.hasHealth.hp = p.hasHealth.maxHp;
  return p;
}

// ── One fight ────────────────────────────────────────────────────────────────

interface Row {
  boss: string;
  biome: string;
  run: number;
  outcome: 'win' | 'died' | 'timeout';
  seconds: number;
  bossHpLeftPct: number;
  playerMaxHp: number;
  playerHpLeftPct: number;
  dpsOnBoss: number;
  hpLostPerS: number;
  bossDpsPctOfPool: number;
  effects: Record<string, number>;
  events: Record<string, number>;
}

function fight(node: BossNode, run: number): Row {
  const world = createBalanceWorld();
  const dt = BENCH_DT_MS;
  try {
    setupArena(world, { nodeId: node.nodeId, biomeGroup: node.biomeGroup, contentTier: TIER, isDungeon: true });
    forceBossPhase(world, node.nodeId);
    const p = buildPlayer(world, node, run);
    const effects: Record<string, number> = {};
    const events: Record<string, number> = {};
    let now = 0;
    let ticks = 0;
    const maxTicks = Math.ceil((MAX_SECONDS * 1000) / dt);
    let lastHp = p.hasHealth.hp;
    let hpLost = 0;
    let bossSeen = false;
    let bossMaxHp = MONSTER_DATABASE.get(node.bossId)?.stats.hp ?? 1;
    let bossHp = bossMaxHp;
    let bossStart = -1;
    let outcome: Row['outcome'] = 'timeout';
    while (ticks < maxTicks) {
      world.tick(dt, now);
      world.pendingDeaths = [];
      now += dt;
      ticks++;
      for (const ev of world.takeNodeEvents(node.nodeId)) {
        events[ev.kind] = (events[ev.kind] ?? 0) + 1;
        if (ev.kind === 'player-hit') {
          for (const e of ev.effects ?? []) effects[e] = (effects[e] ?? 0) + 1;
          if (ev.empowered) effects['(empowered)'] = (effects['(empowered)'] ?? 0) + 1;
        }
      }
      const hp = p.hasHealth.hp;
      if (hp < lastHp) hpLost += lastHp - hp;
      lastHp = hp;
      const boss = findBoss(world, node);
      if (boss) {
        if (!bossSeen) bossStart = now;
        bossSeen = true;
        bossMaxHp = boss.hasHealth.maxHp;
        bossHp = boss.hasHealth.hp;
      }
      if (p.hasHealth.hp <= 0 || p.isDead) { outcome = 'died'; break; }
      if (bossSeen && !boss) { bossHp = 0; outcome = 'win'; break; }
    }
    const seconds = (now - Math.max(0, bossStart)) / 1000;
    return {
      boss: MONSTER_DATABASE.get(node.bossId)?.name ?? node.bossId,
      biome: node.biomeGroup,
      run,
      outcome,
      seconds,
      bossHpLeftPct: Math.round((bossHp / bossMaxHp) * 100),
      playerMaxHp: Math.round(p.hasHealth.maxHp),
      playerHpLeftPct: Math.round((Math.max(0, p.hasHealth.hp) / p.hasHealth.maxHp) * 100),
      dpsOnBoss: seconds > 0 ? Math.round((bossMaxHp - bossHp) / seconds) : 0,
      hpLostPerS: seconds > 0 ? Math.round(hpLost / seconds) : 0,
      bossDpsPctOfPool: seconds > 0 ? Math.round((hpLost / seconds / p.hasHealth.maxHp) * 1000) / 10 : 0,
      effects,
      events,
    };
  } finally {
    teardownArena(world);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  await ensureBenchHitboxCache();
  const rows: Row[] = [];
  for (const node of bossNodes()) {
    for (let run = 0; run < RUNS; run++) rows.push(fight(node, run));
  }
  if (JSON_OUT) {
    console.log(JSON.stringify(rows));
    return;
  }
  console.log(`\n${CLASS_ROOT} T${TIER} skills [${SKILLS.join(', ') || '-'}] gear [${GEAR.join(', ') || 'none'}] upgrade +${UPGRADE}`);
  console.log(`cleared [${CLEARED.join(', ') || '-'}]${LEVELS.length ? ` levels [${LEVELS.join(', ')}]` : ''}`);
  for (const r of rows) {
    console.log(
      `${r.boss.padEnd(24)} ${r.biome.padEnd(10)} #${r.run} ${r.outcome.padEnd(7)} ${r.seconds.toFixed(0).padStart(4)}s` +
      ` boss left ${String(r.bossHpLeftPct).padStart(3)}%  you ${String(r.playerHpLeftPct).padStart(3)}% of ${r.playerMaxHp}` +
      `  dps ${r.dpsOnBoss}  taken/s ${r.hpLostPerS} (${r.bossDpsPctOfPool}% pool)`,
    );
  }
  const effects: Record<string, number> = {};
  const events: Record<string, number> = {};
  for (const r of rows) {
    for (const [k, v] of Object.entries(r.effects)) effects[k] = (effects[k] ?? 0) + v;
    for (const [k, v] of Object.entries(r.events)) events[k] = (events[k] ?? 0) + v;
  }
  console.log(`hit effects: ${Object.entries(effects).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`);
  console.log(`events: ${Object.entries(events).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
