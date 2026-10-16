/**
 * Throwaway (OV-CONDUIT): the class boss sim's fight with a per-second timeline of the Conduit's
 * formation, so a lost boss fight says why. Same build path as `bench/classBossSim.ts`.
 *
 *   DATABASE_URL=<lane db> node --conditions=development --import tsx test/_conduitBossProbe.ts \
 *     --tier 1 --boss plains --gear a,b,c [--levels plains=6] [--cleared plains:1] [--skills x] [--every 2]
 */
import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  DEFAULT_RUNE_LOADOUT,
  DUNGEON_DEFS,
  GAME_CONFIG,
  ITEM_DATABASE,
  MONSTER_DATABASE,
  baseRecoveryForTier,
  biomeLevelCap,
  emptyEquipment,
  getResource,
  listBiomeGroupsAtTier,
  runeIdsForArchetype,
} from '@mmo-idle/shared';
import { BENCH_DT_MS, ensureBenchHitboxCache } from '../bench/harness';
import type { World } from '../src/world/World';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { setupArena, teardownArena, BOT_SPAWN } from '../bench/balance/arena';
import { BENCH_BOT_ID } from '../bench/balance/botFactory';
import { ensureDungeon } from '../src/systems/world/dungeons/dungeon';
import { unlockSkill } from '../src/systems/player/progression/skills';
import { equipItem } from '../src/systems/player/economy/inventory';
import { refreshClassConfig } from '../src/systems/player/progression/classConfig';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';

const ARGV = process.argv.slice(2);
const argOf = (name: string): string | null => {
  const i = ARGV.indexOf(name);
  return i >= 0 && ARGV[i + 1] && !ARGV[i + 1].startsWith('--') ? ARGV[i + 1] : null;
};
const list = (value: string | null): string[] => (value ? value.split(',').map((s) => s.trim()).filter(Boolean) : []);
const TIER = Number(argOf('--tier') ?? 1);
const BOSS_BIOME = argOf('--boss') ?? 'plains';
const GEAR = list(argOf('--gear'));
const SKILLS = list(argOf('--skills'));
const CLEARED = list(argOf('--cleared'));
const LEVELS = list(argOf('--levels'));
const EVERY = Number(argOf('--every') ?? 2);
const MAX_SECONDS = Number(argOf('--max-seconds') ?? 240);

function bossNodes(): { nodeId: string; biomeGroup: string; bossId: string }[] {
  const out: { nodeId: string; biomeGroup: string; bossId: string }[] = [];
  for (const def of DUNGEON_DEFS.values()) {
    if (def.biomeTier !== TIER || (BOSS_BIOME !== 'all' && def.biomeGroup !== BOSS_BIOME)) continue;
    if (!MONSTER_DATABASE.get(def.boss.bossId)?.isBoss) continue;
    out.push({ nodeId: def.nodeId, biomeGroup: def.biomeGroup, bossId: def.boss.bossId });
  }
  if (out.length === 0) throw new Error('no boss');
  return out;
}

function levels(): Record<string, number> {
  const out: Record<string, number> = {};
  if (LEVELS.length > 0) {
    for (const entry of LEVELS) { const [g, l] = entry.split('='); out[g] = Number(l); }
    return out;
  }
  out.clearing = biomeLevelCap(TIER, 'clearing');
  for (let t = 1; t <= TIER; t++) for (const g of listBiomeGroupsAtTier(t)) out[g] = biomeLevelCap(TIER, g);
  return out;
}

function slices(nodeId: string, pos: { x: number; y: number }): PersistedPlayerSlices {
  return {
    isPlayer: { id: BENCH_BOT_ID, name: 'probe' },
    hasPosition: { current: pos, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, biomeLevel: levels(), unlockedRecipes: [], questProgress: {}, playerTier: TIER,
      currentSkillTier: 0, bossesCleared: [...CLEARED], clearedNodes: [],
      runesOwned: runeIdsForArchetype(null), runesEquipped: [...DEFAULT_RUNE_LOADOUT],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null },
  };
}

function build(world: World, nodeId: string): PlayerEntity {
  const p = world.attachPlayerEntity(slices(nodeId, { x: BOT_SPAWN.x, y: BOT_SPAWN.y }), BENCH_BOT_ID);
  p.tracksProgression.playerTier = TIER;
  p.tracksProgression.skillPoints = 999;
  for (const id of ['summoner-root', ...SKILLS]) if (!unlockSkill(world, p, id)) throw new Error(`unlock ${id}`);
  for (const id of GEAR) {
    if (!ITEM_DATABASE.get(id)) throw new Error(`unknown item ${id}`);
    p.holdsInventory.inventory.push(id);
    equipItem(world, p, id);
  }
  refreshClassConfig(world, p);
  syncArchetypeSlices(world, p);
  recalculatePlayerEntityStats(world, p);
  syncArchetypeSlices(world, p);
  Object.assign(p.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, { auto: true, autoTraverse: false });
  p.hasHealth.hp = p.hasHealth.maxHp;
  return p;
}


const REAL_DATE_NOW = Date.now;
const RUNS = Number(argOf('--runs') ?? 1);
const VERBOSE = ARGV.includes('--verbose');
const SETS = list(argOf('--set'));

/** `--set core.formationOffenseMult=2,piece.conduit-plains-tank.hpMult=4`: runtime overrides for exploring numbers. */
async function applySets(): Promise<void> {
  const shared = await import('@mmo-idle/shared');
  for (const entry of SETS) {
    const [key, value] = entry.split('=');
    const parts = key.split('.');
    const v = Number(value);
    if (parts[0] === 'core') (shared.SUMMONER_CORE_TUNING as Record<string, number>)[parts[1]] = v;
    else if (parts[0] === 'piece') {
      const piece = shared.CONDUIT_KIT.pieces.find((x) => x.id === parts[1]);
      if (!piece) throw new Error(`no piece ${parts[1]}`);
      (piece.params as Record<string, number>)[parts[2]] = v;
      if (parts[2] === 'command') (piece as { command: number }).command = v;
    } else if (parts[0] === 'trophy') {
      const t = shared.CONDUIT_KIT.trophies.find((x) => x.id === parts[1]);
      if (!t) throw new Error(`no trophy ${parts[1]}`);
      (t.params as Record<string, number>)[parts[2]] = v;
    } else if (parts[0] === 'scaling') {
      const { CONDUIT_COMMAND_SCALING } = await import('../src/systems/classes/archetypes/summoner/profile');
      (CONDUIT_COMMAND_SCALING as Record<string, number>)[parts[1]] = v;
    } else throw new Error(`bad --set ${entry}`);
  }
}

interface Summary { outcome: string; seconds: number; bossLeft: number; youLeft: number; dps: number; deaths: number; rebuilds: number }

function fight(node: { nodeId: string; biomeGroup: string; bossId: string }, run: number): Summary {
  const world = createBalanceWorld();
  setupArena(world, { nodeId: node.nodeId, biomeGroup: node.biomeGroup, contentTier: TIER, isDungeon: true });
  ensureDungeon(world, node.nodeId);
  const state = world.dungeons.get(node.nodeId)!;
  for (const id of state.guardianIds) world.removeMonsterEntity(id);
  state.guardianIds = [];
  state.guardiansEngaged = true;
  state.status = 'bossAwakening';
  state.bossAwakensAtMs = -1;
  const p = build(world, node.nodeId);
  p.hasPosition.current.x += ((run * 37) % 120) - 60;
  if (run === 0) {
    const config = p.configuresClass?.config;
    console.log('config', JSON.stringify(config?.system?.kind === 'formation' ? config.system.roster : config?.system), 'relic', JSON.stringify(config?.relic));
    console.log(`player hp ${p.hasHealth.maxHp} atk ${p.dealsDamage.attack} cd ${p.performsAttack.attackCooldown} plating ${p.mitigatesDamage.plating} dr ${p.mitigatesDamage.damageReduction.toFixed(2)} rec ${p.hasHealth.recovery}`);
    const passives = Object.entries(p.usesSkills.passives).filter(([k]) => k.startsWith('conduit') || k.startsWith('summoner'));
    console.log('passives', JSON.stringify(Object.fromEntries(passives)));
  }
  const counts: Record<string, number> = {};
  const dmgBy: Record<string, number> = {};
  // The live server's world clock is the wall clock; some aggro code reads Date.now() directly.
  let now = REAL_DATE_NOW();
  Date.now = () => now;
  const t0 = now;
  let nextLog = now;
  let bossSeen = false;
  let bossStart = now;
  let rebuilds = 0;
  let lastQueue = 0;
  let deaths = 0;
  let alive = new Set<string>();
  let bossHp = 1;
  let bossMax = 1;
  let outcome = 'timeout';
  for (let tick = 0; tick < (MAX_SECONDS * 1000) / BENCH_DT_MS; tick++) {
    world.tick(BENCH_DT_MS, now);
    world.pendingDeaths = [];
    now += BENCH_DT_MS;
    for (const ev of world.takeNodeEvents(node.nodeId)) {
      counts[ev.kind] = (counts[ev.kind] ?? 0) + 1;
      const e = ev as unknown as Record<string, unknown>;
      if (ev.kind === 'player-hit') for (const fx of (e.effects as string[] | undefined) ?? []) counts[`fx:${fx}`] = (counts[`fx:${fx}`] ?? 0) + 1;
      if (ev.kind === 'damage' || ev.kind === 'monster-hit') {
        const key = `${ev.kind}->${String(e.targetId ?? '?').replace(/^node-.*_monster-\d+$/, 'monster').replace(/^minion_.*$/, 'summon')}`;
        dmgBy[key] = (dmgBy[key] ?? 0) + Number(e.damage ?? e.amount ?? 0);
      }
    }
    const boss = [...world.monsterEntitiesInNode(node.nodeId)].find((m: MonsterEntity) => m.isMonster.monsterTypeId === node.bossId);
    if (boss) {
      if (!bossSeen) bossStart = now;
      bossSeen = true;
      bossHp = boss.hasHealth.hp;
      bossMax = boss.hasHealth.maxHp;
    }
    const s = p.summonsMinions;
    const q = (s?.reconstructionQueue.length ?? 0) + (s?.activeReconstruction ? 1 : 0);
    if (q < lastQueue) rebuilds += lastQueue - q;
    lastQueue = q;
    const nowAlive = new Set((s?.minionIds ?? []).filter((id) => id && world.getMinionEntity(id)));
    for (const id of alive) if (!nowAlive.has(id)) deaths++;
    alive = nowAlive;
    if (VERBOSE && (now >= nextLog || p.hasHealth.hp <= 0 || (bossSeen && !boss))) {
      nextLog += EVERY * 1000;
      const minions = (s?.minionIds ?? []).map((id, i) => {
        const m = id ? world.getMinionEntity(id) : undefined;
        const slot = s!.slotIds[i]?.replace('conduit-', '') ?? '?';
        if (!m) return `${slot} DEAD`;
        const tgt = m.hasAttackTarget ? (boss && m.hasAttackTarget.targetId === boss.isMonster.id ? 'B' : 'o') : '-';
        return `${slot} ${Math.round(m.hasHealth.hp)}/${m.hasHealth.maxHp} a${m.dealsDamage.attack}${tgt}`;
      });
      const aggro = boss?.hasAggroTarget ? `${boss.hasAggroTarget.targetKind === 'player' ? 'YOU' : 'summon'}${boss.heldByTaunt ? '(T)' : ''}` : '-';
      const adds = [...world.monsterEntitiesInNode(node.nodeId)].filter((m) => m !== boss).length;
      console.log(`t${((now - t0) / 1000).toFixed(0).padStart(3)} boss ${boss ? Math.round(boss.hasHealth.hp) : 0} on ${aggro} adds ${adds} | you ${Math.round(p.hasHealth.hp)}/${p.hasHealth.maxHp} q${q} | ${minions.join(' | ')}`);
    }
    if (p.hasHealth.hp <= 0 || p.isDead) { outcome = 'died'; break; }
    if (bossSeen && !boss) { bossHp = 0; outcome = 'win'; break; }
  }
  const seconds = (now - bossStart) / 1000;
  if (VERBOSE) {
    console.log('events', JSON.stringify(counts));
    console.log('damage', JSON.stringify(dmgBy));
  }
  Date.now = REAL_DATE_NOW;
  const summary = { outcome, seconds: Math.round(seconds), bossLeft: Math.round((bossHp / bossMax) * 100), youLeft: Math.round((Math.max(0, p.hasHealth.hp) / p.hasHealth.maxHp) * 100), dps: Math.round((bossMax - bossHp) / Math.max(1, seconds)), deaths, rebuilds };
  teardownArena(world);
  return summary;
}

async function main(): Promise<void> {
  await ensureBenchHitboxCache();
  await applySets();
  const rows: Summary[] = [];
  for (const node of bossNodes()) for (let run = 0; run < RUNS; run++) {
    const row = fight(node, run);
    rows.push(row);
    console.log(`#${node.biomeGroup.padEnd(9)} ${run} ${row.outcome.padEnd(7)} ${String(row.seconds).padStart(4)}s boss ${String(row.bossLeft).padStart(3)}% you ${String(row.youLeft).padStart(3)}% dps ${row.dps} summon deaths ${row.deaths} rebuilds ${row.rebuilds}`);
  }
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
