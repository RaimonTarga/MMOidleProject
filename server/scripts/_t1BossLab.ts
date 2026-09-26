/**
 * Throwaway T1 boss lab (2026-09-26). Not a frozen packet: a quick seeded boss fight
 * per plan row, guard stripped and boss force-woken exactly like bossScreen.ts, with
 * bossTerminal's classifier deciding the outcome. One JSON line per fight.
 *
 *   tsx scripts/_t1BossLab.ts --plan=plan.json --out=res.jsonl --hitboxes=... [--shard=0 --shards=1]
 */
import assert from 'node:assert/strict';
import { readFileSync, appendFileSync } from 'node:fs';
import { ABILITY_DATABASE, ITEM_DATABASE, RECIPE_DATABASE, MONSTER_DATABASE, NODE_BIOMES, composePlayerView, runicPointLoadoutCost, withReferenceAbilityWiring } from '@mmo-idle/shared';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { setupArena, teardownArena, BOT_SPAWN } from '../bench/balance/arena';
import { prepareSurveyBot, SURVEY_CLASSES, type SurveyCell } from '../bench/balance/ttkSurveySpec';
import { hydrateHitboxCacheFromArtifact } from '../src/hitbox/cache';
import { ensureDungeon } from '../src/systems/world/dungeons/dungeon';
import { classifyBossTick, isVictory } from '../bench/balance/bossTerminal';
import type { World } from '../src/world/World';

const args = Object.fromEntries(process.argv.slice(2).map((s) => {
  const i = s.indexOf('=');
  return [s.slice(2, i), s.slice(i + 1)];
})) as Record<string, string>;

interface Row {
  id: string; boss: string; cls: string; weapon: string; armor: string; charm: string; boots: string;
  techniques: string[]; guards: string[]; rules?: { conditionId: string; actionId: string }[];
  treatment?: string; seed?: number; capMs?: number; tier?: number; upgrade?: number; stance?: string | null;
  /** Weapon overrides for tuning: [+0, +5] endpoints; the whole delta rides on upgrade step 1. */
  /** Ability overrides: per-rank effect field values, plus cast/cooldown. */
  ap?: Record<string, { field?: string; values?: number[]; castMs?: number; cooldownMs?: number }>;
  wp?: Record<string, { atk?: [number, number]; aps?: [number, number]; me?: Record<string, [number, number]> }>;
}

const BOSS_NODE: Record<string, string> = {
  'tusked-razorback': 'node-t1-plains-dungeon',
  'gnarled-greatbear': 'node-t1-forest-dungeon',
  'grave-toadeater': 'node-t1-swamp-dungeon',
  'crag-behemoth': 'node-t1-mountain-dungeon',
  'obsidian-broodmother': 'node-t1-cave-dungeon',
  'apex-timberclaw': 'node-t2-forest-dungeon',
  'crag-gorged-horn-behemoth': 'node-t3-mountain-dungeon',
  'iron-crest-titan': 'node-t4-mountain-dungeon',
};

/** Named definition patches. Each returns its own restore. */
type Patch = (row: Row) => () => void;
const def = (id: string) => MONSTER_DATABASE.get(id) as any;
function patchDef(id: string, mutate: (d: any) => void): () => void {
  const d = def(id);
  const saved = structuredClone(d);
  mutate(d);
  return () => { for (const k of Object.keys(d)) delete d[k]; Object.assign(d, saved); };
}
const frenzy = (d: any) => d.bossScript.repeating[0].actions[0].actions[0];
const TREATMENTS: Record<string, Patch> = {
  live: () => () => {},
  // Training dummies: the row's boss with its offense stripped and 1M HP.
  'dummy-bare': (row) => patchDef(row.boss, (d) => dummy(d, 0, 0)),
  'dummy-armored': (row) => patchDef(row.boss, (d) => dummy(d, 6, 0.10)),
  // T4-realistic armour: median T4 boss is ~14 plating / 10% DR, up to 22 / 24%.
  'dummy-heavy': (row) => patchDef(row.boss, (d) => dummy(d, 16, 0.15)),
  // Greatbear candidates
  'bear-atk18': () => patchDef('gnarled-greatbear', (d) => { d.stats.attack = 18; }),
  'bear-cap4': () => patchDef('gnarled-greatbear', (d) => { frenzy(d).maxStacks = 4; }),
  'bear-atk18-cap4': () => patchDef('gnarled-greatbear', (d) => { d.stats.attack = 18; frenzy(d).maxStacks = 4; }),
  'bear-atk20-cap4': () => patchDef('gnarled-greatbear', (d) => { d.stats.attack = 20; frenzy(d).maxStacks = 4; }),
  'bear-atk20-cap5': () => patchDef('gnarled-greatbear', (d) => { d.stats.attack = 20; frenzy(d).maxStacks = 5; }),
  'bear-atk21-cap5': () => patchDef('gnarled-greatbear', (d) => { d.stats.attack = 21; frenzy(d).maxStacks = 5; }),
  'bear-atk22-cap5': () => patchDef('gnarled-greatbear', (d) => { d.stats.attack = 22; frenzy(d).maxStacks = 5; }),
  'bear-atk19': () => patchDef('gnarled-greatbear', (d) => { d.stats.attack = 19; }),
  'bear-atk20': () => patchDef('gnarled-greatbear', (d) => { d.stats.attack = 20; }),
  'bear-atk19-x115': () => patchDef('gnarled-greatbear', (d) => { d.stats.attack = 19; frenzy(d).mult = 1.15; }),
  'bear-atk18-x115': () => patchDef('gnarled-greatbear', (d) => { d.stats.attack = 18; frenzy(d).mult = 1.15; }),
  // Razorback candidates
  'razor-atk26': () => patchDef('tusked-razorback', (d) => { d.stats.attack = 26; }),
  'razor-adds': () => patchDef('tusked-razorback', razorAdds),
  'razor-F': () => patchDef('tusked-razorback', (d) => { d.stats.attack = 26; razorAdds(d); }),
  'razor-F28': () => patchDef('tusked-razorback', (d) => { d.stats.attack = 28; razorAdds(d); }),
  'razor-F30': () => patchDef('tusked-razorback', (d) => { d.stats.attack = 30; razorAdds(d); }),
};
function dummy(d: any, plating: number, dr: number): void {
  d.stats.hp = 1_000_000; d.stats.attack = 0; d.stats.attackCooldown = 1e9; d.stats.plating = plating; d.stats.damageReduction = dr;
  d.evasion = 0;
  for (const k of ['bossScript', 'chargedAttack', 'monsterAbilities', 'bossPattern', 'dotEffect', 'consecutiveHits', 'castsPlatingShred']) delete d[k];
}
function patchAbilities(ap: Row['ap']): () => void {
  const undo: (() => void)[] = [];
  for (const [id, a] of Object.entries(ap ?? {})) {
    const def = ABILITY_DATABASE.get(id) as any;
    assert(def, `unknown ability ${id}`);
    const saved = structuredClone(def.ranks);
    undo.push(() => { def.ranks.splice(0, def.ranks.length, ...saved); });
    def.ranks.forEach((r: any, i: number) => {
      if (a.field && a.values) r.effect[a.field] = a.values[Math.min(i, a.values.length - 1)];
      if (a.castMs !== undefined) r.castMs = a.castMs;
      if (a.cooldownMs !== undefined) r.cooldownMs = a.cooldownMs;
    });
  }
  return () => { for (const u of undo.reverse()) u(); };
}
/** Install weapon overrides; returns restore. */
function patchWeapons(wp: Row['wp']): () => void {
  const undo: (() => void)[] = [];
  for (const [id, w] of Object.entries(wp ?? {})) {
    const item = ITEM_DATABASE.get(id) as any, recipe = RECIPE_DATABASE.get(id) as any;
    assert(item && recipe, `unknown weapon ${id}`);
    const saved = { sm: structuredClone(item.statModifiers), me: structuredClone(item.mechanicEffects), aps: item.attacksPerSecond,
      rs: structuredClone(recipe.stats), rme: structuredClone(recipe.mechanicEffects), raps: recipe.attacksPerSecond, ups: structuredClone(item.upgrades) };
    undo.push(() => { item.statModifiers = saved.sm; item.mechanicEffects = saved.me; item.attacksPerSecond = saved.aps;
      recipe.stats = saved.rs; recipe.mechanicEffects = saved.rme; recipe.attacksPerSecond = saved.raps; item.upgrades.splice(0, item.upgrades.length, ...saved.ups); });
    const me0: Record<string, number> = { ...(item.mechanicEffects ?? {}) }, meD: Record<string, number> = {};
    for (const [k, [a, b]] of Object.entries(w.me ?? {})) { me0[k] = a; meD[k] = b - a; }
    const atk0 = w.atk?.[0] ?? item.statModifiers.attack;
    const aps0 = w.aps?.[0] ?? item.attacksPerSecond;
    // Current +5 totals, for fields not overridden.
    let atk5 = item.statModifiers.attack, aps5 = item.attacksPerSecond; const me5: Record<string, number> = { ...(item.mechanicEffects ?? {}) };
    for (const u of item.upgrades) { atk5 += u.stats?.attack ?? 0; aps5 += u.attacksPerSecond ?? 0; for (const [k, v] of Object.entries(u.mechanicEffects ?? {})) me5[k] = (me5[k] ?? 0) + (v as number); }
    for (const k of Object.keys(me5)) if (!(k in meD)) meD[k] = me5[k]! - (me0[k] ?? 0);
    const dAtk = (w.atk?.[1] ?? atk5) - atk0, dAps = (w.aps?.[1] ?? aps5) - aps0;
    item.statModifiers = { ...item.statModifiers, attack: atk0 }; recipe.stats = { ...recipe.stats, attack: atk0 };
    item.attacksPerSecond = aps0; recipe.attacksPerSecond = aps0;
    item.mechanicEffects = me0; recipe.mechanicEffects = me0;
    // Keep every non-attack stat each step already grants (on-hit, HP...); only attack/APS/mechanics move.
    const ups = item.upgrades.map((u: any, i: number) => ({ ...u, stats: { ...(u.stats ?? {}), attack: i === 0 ? dAtk : 0 }, attacksPerSecond: i === 0 ? dAps : 0, mechanicEffects: i === 0 ? meD : {} }));
    item.upgrades.splice(0, item.upgrades.length, ...ups);
  }
  return () => { for (const u of undo.reverse()) u(); };
}
function razorAdds(d: any): void {
  const rally = d.bossScript.phases[0].actions[0].actions;
  d.bossScript.phases[0].actions[0].actions = [
    { ...rally[0], count: 2, maxAlive: 4 },
    rally[2],
  ];
  const rep = d.bossScript.repeating[0];
  rep.intervalMs = 12_000;
  rep.actions[0].actions[0] = { ...rep.actions[0].actions[0], count: 1, maxAlive: 3 };
}

const DEFAULT_RULES = (melee: boolean) => [
  { conditionId: 'always', actionId: 'auto-path-enemy' },
  { conditionId: 'inside-telegraph', actionId: 'step-back' },
  { conditionId: 'in-combat', actionId: melee ? 'chase-enemy' : 'orbit' },
  { conditionId: 'always', actionId: 'avoid-hazards' },
  { conditionId: 'always', actionId: 'wait-for-regen' },
];

/** Richest rule set the 22 RP T1 budget admits: full -> no hazards/regen -> no step-back. */
function pickRules(row: Row, melee: boolean) {
  if (row.rules) return row.rules;
  const full = DEFAULT_RULES(melee);
  const abilities = { techniques: row.techniques, guards: row.guards };
  for (const rules of [full, full.slice(0, 3), [full[0]!, full[2]!]]) {
    const cost = runicPointLoadoutCost({ rules: withReferenceAbilityWiring(rules, abilities), abilities, stances: [], rites: [] } as any);
    if (cost <= 22) { chosenRules = rules.length; return rules; }
  }
  throw Error('no legal rule set');
}
let chosenRules = 0;

function forceBossPhase(world: World, nodeId: string): void {
  ensureDungeon(world, nodeId);
  const state = world.dungeons.get(nodeId)!;
  for (const id of state.guardianIds) world.removeMonsterEntity(id);
  state.guardianIds = [];
  state.guardiansEngaged = true;
  state.status = 'bossAwakening';
  state.bossAwakensAtMs = -1;
}

const realNow = Date.now, realRandom = Math.random;

function run(row: Row) {
  const seed = row.seed ?? 173;
  let rs = seed, now = 1800000000000;
  Math.random = () => { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 4294967296; };
  Date.now = () => now;
  const restoreWeapons = patchWeapons(row.wp);
  const restoreAbilities = patchAbilities(row.ap);
  const restore = (TREATMENTS[row.treatment ?? 'live'] ?? (() => { throw Error(`unknown treatment ${row.treatment}`); }))(row);
  const nodeId = BOSS_NODE[row.boss]!;
  const tier = row.tier ?? 1;
  const c = SURVEY_CLASSES.find((x) => x.name === row.cls)!;
  assert(c, row.cls);
  const world = createBalanceWorld();
  try {
    setupArena(world, { nodeId, biomeGroup: NODE_BIOMES[nodeId]!.biomeGroup, contentTier: tier, isDungeon: true });
    forceBossPhase(world, nodeId);
    const cell: SurveyCell = {
      id: row.id, className: row.cls, tier, role: 'boss', nodeId, alternate: false, isDungeon: true,
      stance: row.stance === undefined ? (tier >= 2 ? 'offensive-stance' : null) : row.stance, upgradeLevel: row.upgrade ?? 5,
      abilities: { techniques: row.techniques, guards: row.guards },
      runeRules: pickRules(row, c.melee),
      build: {
        id: row.id, classRoot: `${c.prefix}-root`, contentTier: tier, playerTier: tier, gearTier: tier,
        skillPath: [`${c.prefix}-root`, ...(tier >= 2 ? [`${c.prefix}-balanced`] : []), ...(tier >= 3 ? [`${c.prefix}-range-${c.melee ? 'close' : 'mid'}`] : []), ...(tier >= 4 ? [`${c.prefix}-balanced-t3-a`] : [])],
        gearItemIds: { weapon: row.weapon, armor: row.armor, recovery: row.charm, mobility: row.boots },
      },
    } as SurveyCell;
    const { bot, view } = prepareSurveyBot(world, cell, BOT_SPAWN);
    const loadout = {
      maxHp: view.maxHp, plating: view.plating, dr: view.damageReduction, dodge: (view as any).dodgeRate ?? (view as any).evasion,
      barrier: view.barrierMax, recovery: (view as any).recovery, attack: view.attack,
    };
    world.tick(100, now);
    const findBoss = () => { for (const m of world.monsterEntitiesInNode(nodeId)) if (m.isMonster.monsterTypeId === row.boss) return m; return null; };
    const boss = findBoss();
    assert(boss, `${row.id}: boss never woke`);
    const bossMaxHp = boss.hasHealth.maxHp, bossEntityId = boss.entityId;
    const cap = row.capMs ?? 180_000;
    let elapsed = 0, outcome = 'capped', minHp = 1, lastBotHp = bot.hasHealth.hp, hpLost = 0;
    let bossHp = bossMaxHp, killAt: number | null = null, deathAt: number | null = null, resetAt: number | null = null;
    let hpAt8: number | null = null;
    let fromBoss = 0, fromAdds = 0, maxAdds = 0, halfAt: number | null = null, killer: string | null = null;
    world.worldLogJournal = []; world.worldLogByPlayer.clear(); world.takeNodeEvents(nodeId);
    for (; elapsed < cap; elapsed += 100) {
      now = 1800000000000 + elapsed;
      world.tick(100, now);
      const hp = bot.hasHealth.hp;
      if (hp < lastBotHp) hpLost += lastBotHp - hp;
      lastBotHp = hp;
      for (const e of world.worldLogJournal as any[]) {
        if (e.kind === 'kill' && (e.victim?.id === bossEntityId || e.victim?.name === def(row.boss).name)) killAt ??= elapsed;
        if (e.kind === 'player-death') { deathAt ??= elapsed; killer ??= e.cause?.killer?.name ?? e.cause?.killer?.monsterTypeId ?? JSON.stringify(e.cause ?? null).slice(0, 160); }
        if (e.kind === 'dungeon-message' && /reforms/i.test(e.message ?? '')) resetAt ??= elapsed;
        if (e.kind === 'damage' && e.target?.id === bot.isPlayer.id) {
          const amt = e.hpDamage ?? 0;
          if (e.source?.id === bossEntityId || e.source?.name === def(row.boss).name) fromBoss += amt; else fromAdds += amt;
        }
      }
      world.worldLogJournal = []; world.worldLogByPlayer.clear(); world.takeNodeEvents(nodeId);
      const live = findBoss();
      if (elapsed === 8000 && live) hpAt8 = live.hasHealth.hp;
      if (live) { bossHp = live.hasHealth.hp; if (halfAt === null && bossHp <= bossMaxHp / 2) halfAt = elapsed; }
      let adds = 0;
      for (const m of world.monsterEntitiesInNode(nodeId)) if (m.isMonster.monsterTypeId !== row.boss) adds++;
      if (args.debugAdds && elapsed === 5000) console.log([...world.monsterEntitiesInNode(nodeId)].map((m) => m.isMonster.monsterTypeId + ":" + Math.round(Math.hypot(m.hasPosition.current.x - bot.hasPosition.current.x, m.hasPosition.current.y - bot.hasPosition.current.y))).join(" "));
      const terminal = classifyBossTick({
        bossKillEvent: killAt === elapsed,
        playerDead: deathAt === elapsed || !!bot.isDead || bot.hasHealth.hp <= 0,
        bossPresent: live !== null, dungeonReset: resetAt === elapsed, bossSeen: true,
      });
      const v = composePlayerView(bot)!;
      minHp = Math.min(minHp, v.hp / v.maxHp);
      if (terminal !== null) { outcome = terminal; break; }
      maxAdds = Math.max(maxAdds, adds);
      world.pendingDeaths = [];
    }
    return {
      id: row.id, boss: row.boss, cls: row.cls, treatment: row.treatment ?? 'live', seed,
      weapon: row.weapon, armor: row.armor, charm: row.charm, techniques: row.techniques, guards: row.guards,
      rules: chosenRules, outcome, won: isVictory(outcome as any), t: elapsed / 1000, dealt: bossMaxHp - bossHp, dps8: hpAt8 === null ? null : Math.round(((bossMaxHp - hpAt8) / 8.1) * 10) / 10, dps: Math.round(((bossMaxHp - bossHp) / Math.max(0.1, elapsed / 1000)) * 10) / 10, bossPctLeft: Math.round((bossHp / bossMaxHp) * 1000) / 10,
      minHpPct: Math.round(minHp * 1000) / 10, hpLost, fromBoss, fromAdds, maxAdds, halfAt: halfAt && halfAt / 1000, killer, loadout,
    };
  } finally {
    try { teardownArena(world); } catch { /* ignore */ }
    restore(); restoreWeapons(); restoreAbilities();
    Date.now = realNow; Math.random = realRandom;
  }
}

assert(hydrateHitboxCacheFromArtifact(args.hitboxes) > 0, 'hitbox artifact required');
const plan = JSON.parse(readFileSync(args.plan!, 'utf8')) as Row[];
const shard = Number(args.shard ?? 0), shards = Number(args.shards ?? 1);
for (let i = shard; i < plan.length; i += shards) {
  const row = plan[i]!;
  const started = realNow();
  let res: unknown;
  try { res = run(row); } catch (e) { res = { id: row.id, boss: row.boss, cls: row.cls, treatment: row.treatment, error: String((e as Error).message).slice(0, 300) }; }
  appendFileSync(args.out!, JSON.stringify({ ...(res as object), wallMs: realNow() - started }) + '\n');
}
