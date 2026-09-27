/**
 * Throwaway T4 power-curve lab (2026-09-27). Reference packages come verbatim from the
 * breadth bench (T2-T4, boss role) or the TTK survey (T1 solo), then a row may override
 * individual layers (gear slot, skill path, stance, abilities, rules) for decomposition.
 *
 * Treatments on the tier's host boss node:
 *   live            the real boss, guard stripped, force-woken (bossScreen convention)
 *   dummy-armored   boss offense stripped, 1M HP, 6 plating / 10% DR
 *   dummy-heavy     boss offense stripped, 1M HP, 16 plating / 15% DR
 *   trash:<id>      boss replaced by that trash monster's HP/plating/DR/evasion, offense
 *                   stripped: time-to-kill ONE mob from first damage
 *
 *   node --conditions=development --import tsx scripts/_t4PowerLab.ts --plan=... --out=... --hitboxes=... [--shard=0 --shards=1]
 */
import assert from 'node:assert/strict';
import { readFileSync, appendFileSync } from 'node:fs';
import { ABILITY_DATABASE, SKILL_TREE, MONSTER_DATABASE, NODE_BIOMES, DUNGEON_DEFS, composePlayerView, withReferenceAbilityWiring } from '@mmo-idle/shared';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { setupArena, teardownArena, BOT_SPAWN } from '../bench/balance/arena';
import { prepareSurveyBot, SURVEY_CELLS, SURVEY_CLASSES, type SurveyCell } from '../bench/balance/ttkSurveySpec';
import { BREADTH_CELLS } from '../bench/balance/playerBreadthSpec';
import { hydrateHitboxCacheFromArtifact } from '../src/hitbox/cache';
import { ensureDungeon } from '../src/systems/world/dungeons/dungeon';
import { classifyBossTick, isVictory } from '../bench/balance/bossTerminal';

const args = Object.fromEntries(process.argv.slice(2).map((s) => {
  const i = s.indexOf('=');
  return [s.slice(2, i), s.slice(i + 1)];
})) as Record<string, string>;

interface Row {
  id: string; tier: number; cls: string; frame?: 'light' | 'balanced' | 'heavy'; path?: 'a' | 'b' | 'c';
  /** Dungeon node hosting the fight (default: the tier's HOST). */
  node?: string; treatment: string; seed?: number; capMs?: number; upgrade?: number;
  /** Gear overrides; null removes the slot. */
  gear?: Partial<Record<'weapon' | 'armor' | 'recovery' | 'mobility' | 'core' | 'relic', string | null>>;
  /** Drop the T4 specialization node (keeps root/frame/range). */
  noSpec?: boolean;
  stance?: string | null;
  techniques?: string[]; guards?: string[];
  /** Extra authored rules added before reference wiring (e.g. use-ability on a condition). */
  extraRules?: { conditionId: string; actionId: string; targetAbilityId?: string }[];
  /** Ability overrides: per-rank effect field values. */
  ap?: Record<string, { field: string; values: number[] }>;
  /** Monster def overrides by id (stats merged; other top-level fields replaced). */
  /** Skill-node mechanicEffects overrides. */
  sp?: Record<string, Record<string, number>>;
  mp?: Record<string, { stats?: Record<string, number>; set?: Record<string, unknown>; paths?: Record<string, unknown> }>;
}

const HOST: Record<number, string> = {
  1: 'node-t1-plains-dungeon', 2: 'node-t2-plains-dungeon', 3: 'node-t3-mountain-dungeon', 4: 'node-t4-mountain-dungeon',
};

function baseCell(row: Row): SurveyCell {
  if (row.tier === 1) {
    const c = SURVEY_CELLS.find((c) => c.tier === 1 && c.className === row.cls && c.role === 'solo' && !c.alternate);
    assert(c, `T1 survey cell ${row.cls}`);
    return structuredClone(c);
  }
  const frame = row.frame ?? 'balanced';
  const c = BREADTH_CELLS.find((c) => c.tier === row.tier && c.className === row.cls && c.frame === frame && c.role === 'boss'
    && !c.controlCaseId && !c.id.includes('-far-') && (row.tier < 4 || c.identityId.endsWith('-' + (row.path ?? 'a'))));
  assert(c, `breadth cell ${row.tier}/${row.cls}/${frame}/${row.path}`);
  return structuredClone(c) as SurveyCell;
}

const def = (id: string) => MONSTER_DATABASE.get(id) as any;
function patchDef(id: string, mutate: (d: any) => void): () => void {
  const d = def(id);
  const saved = structuredClone(d);
  mutate(d);
  return () => { for (const k of Object.keys(d)) delete d[k]; Object.assign(d, saved); };
}
function strip(d: any): void {
  d.stats.attack = 0; d.stats.attackCooldown = 1e9; d.evasion = 0;
  for (const k of ['bossScript', 'chargedAttack', 'monsterAbilities', 'bossPattern', 'dotEffect', 'consecutiveHits', 'castsPlatingShred', 'summons', 'shell', 'conceal']) delete d[k];
}
function treatment(row: Row, bossId: string): () => void {
  const t = row.treatment;
  if (t === 'live') return () => {};
  // Live boss with its HP scaled (option-b probe); everything else authored.
  if (t.startsWith('hpx:')) return patchDef(bossId, (d) => { d.stats.hp = Math.round(d.stats.hp * Number(t.slice(4))); });
  if (t === 'dummy-armored') return patchDef(bossId, (d) => { strip(d); d.stats.hp = 1_000_000; d.stats.plating = 6; d.stats.damageReduction = 0.10; });
  if (t === 'dummy-heavy') return patchDef(bossId, (d) => { strip(d); d.stats.hp = 1_000_000; d.stats.plating = 16; d.stats.damageReduction = 0.15; });
  if (t === 'dummy-bare') return patchDef(bossId, (d) => { strip(d); d.stats.hp = 1_000_000; d.stats.plating = 0; d.stats.damageReduction = 0; });
  if (t.startsWith('trash:')) {
    const src = def(t.slice(6));
    assert(src, `unknown trash ${t}`);
    return patchDef(bossId, (d) => {
      strip(d);
      d.stats.hp = src.stats.hp; d.stats.plating = src.stats.plating ?? 0; d.stats.damageReduction = src.stats.damageReduction ?? 0;
      d.evasion = src.evasion ?? 0;
    });
  }
  throw Error(`unknown treatment ${t}`);
}

function patchAbilities(ap: Row["ap"]): () => void {
  const undo: (() => void)[] = [];
  for (const [id, a] of Object.entries(ap ?? {})) {
    const d = ABILITY_DATABASE.get(id) as any;
    assert(d, `unknown ability ${id}`);
    const saved = structuredClone(d.ranks);
    undo.push(() => { d.ranks.splice(0, d.ranks.length, ...saved); });
    d.ranks.forEach((r: any, i: number) => { r.effect[a.field] = a.values[Math.min(i, a.values.length - 1)]; });
  }
  return () => { for (const u of undo.reverse()) u(); };
}
function patchSkills(sp: Row['sp']): () => void {
  const undo: (() => void)[] = [];
  for (const [id, me] of Object.entries(sp ?? {})) {
    const n = SKILL_TREE.get(id) as any;
    assert(n, `unknown skill ${id}`);
    const saved = structuredClone(n.mechanicEffects);
    undo.push(() => { n.mechanicEffects = saved; });
    n.mechanicEffects = { ...(n.mechanicEffects ?? {}), ...me };
  }
  return () => { for (const u of undo.reverse()) u(); };
}
/** Set a value by path: dots, numeric indices, [key=value] selectors, and a trailing '+' to append. */
function setPath(root: any, path: string, value: unknown): void {
  const parts = path.split('.');
  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) cur = step(cur, parts[i]!);
  const last = parts.at(-1)!;
  if (last === '+') { assert(Array.isArray(cur), `${path}: not an array`); cur.push(value); return; }
  assert(cur && typeof cur === 'object', `${path}: bad parent`);
  cur[last] = value;
  function step(o: any, p: string): any {
    const m = p.match(/^(.*)\[(\w+)=([\w-]+)\]$/);
    const base = m ? (m[1] ? o[m[1]] : o) : o[p];
    if (!m) { assert(base !== undefined, `${path}: missing ${p}`); return base; }
    assert(Array.isArray(base), `${path}: ${m[1]} not an array`);
    const hit = base.find((x: any) => String(x?.[m[2]!]) === m[3]);
    assert(hit, `${path}: no ${m[2]}=${m[3]}`);
    return hit;
  }
}
function patchMonsters(mp: Row["mp"]): () => void {
  const undo: (() => void)[] = [];
  for (const [id, o] of Object.entries(mp ?? {})) undo.push(patchDef(id, (d) => { Object.assign(d.stats, o.stats ?? {}); Object.assign(d, o.set ?? {}); for (const [p, v] of Object.entries(o.paths ?? {})) setPath(d, p, v); }));
  return () => { for (const u of undo.reverse()) u(); };
}

const realNow = Date.now, realRandom = Math.random;

function run(row: Row) {
  const seed = row.seed ?? 173;
  let rs = seed, now = 1800000000000;
  Math.random = () => { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 4294967296; };
  Date.now = () => now;
  const nodeId = row.node ?? HOST[row.tier]!;
  const bossId = DUNGEON_DEFS.get(nodeId)!.boss.bossId;
  const restoreMp = patchMonsters(row.mp);
  const restoreAp = patchAbilities(row.ap);
  const restoreSp = patchSkills(row.sp);
  const restore = treatment(row, bossId);
  const world = createBalanceWorld();
  try {
    const cell = baseCell(row);
    cell.id = row.id; cell.build.id = row.id; cell.nodeId = nodeId; cell.isDungeon = true;
    cell.upgradeLevel = row.upgrade ?? 5;
    const g = cell.build.gearItemIds as Record<string, string | undefined>;
    for (const [k, v] of Object.entries(row.gear ?? {})) { if (v === null) delete g[k]; else g[k] = v; }
    if (row.noSpec) cell.build.skillPath = cell.build.skillPath.filter((id) => !/-t3-[abc]$/.test(id));
    if (row.stance !== undefined) cell.stance = row.stance;
    if (row.techniques || row.guards) {
      const a = cell.abilities ?? { techniques: [], guards: [] };
      cell.abilities = { techniques: row.techniques ?? a.techniques, guards: row.guards ?? a.guards };
      // Drop use-ability wiring for abilities no longer attuned; reference wiring re-adds the rest.
      const keep = new Set([...cell.abilities.techniques, ...cell.abilities.guards]);
      if (cell.runeRules) cell.runeRules = cell.runeRules.filter((r: any) => r.actionId !== 'use-ability' || keep.has(r.targetAbilityId));
    }
    if (row.extraRules) cell.runeRules = [...(row.extraRules as any), ...(cell.runeRules ?? [])];
    setupArena(world, { nodeId, biomeGroup: NODE_BIOMES[nodeId]!.biomeGroup, contentTier: row.tier, isDungeon: true });
    ensureDungeon(world, nodeId);
    const state = world.dungeons.get(nodeId)!;
    for (const id of state.guardianIds) world.removeMonsterEntity(id);
    state.guardianIds = []; state.guardiansEngaged = true; state.status = 'bossAwakening'; state.bossAwakensAtMs = -1;
    const { bot, view } = prepareSurveyBot(world, cell, BOT_SPAWN);
    const v0 = view as any;
    const loadout = {
      maxHp: v0.maxHp, plating: v0.plating, dr: v0.damageReduction, evasion: v0.evasion ?? v0.dodgeRate ?? 0,
      barrier: v0.barrierMax ?? 0, recovery: v0.recovery, attack: v0.attack, aps: v0.attacksPerSecond,
    };
    const pkg = {
      skillPath: cell.build.skillPath, gear: { ...g }, stance: cell.stance ?? null, abilities: cell.abilities,
    };
    world.tick(100, now);
    const findBoss = () => { for (const m of world.monsterEntitiesInNode(nodeId)) if (m.isMonster.monsterTypeId === bossId) return m; return null; };
    const boss = findBoss();
    assert(boss, `${row.id}: boss never woke`);
    const bossMaxHp = boss.hasHealth.maxHp, bossEntityId = boss.entityId;
    const cap = row.capMs ?? (row.treatment === 'live' ? 360_000 : row.treatment.startsWith('trash:') ? 60_000 : 120_000);
    let elapsed = 0, outcome = 'capped', minHp = 1, bossHp = bossMaxHp;
    let killer: string | null = null;
    let takenBoss = 0; const takenOther: Record<string, number> = {};
    let killAt: number | null = null, deathAt: number | null = null, resetAt: number | null = null, firstDmgAt: number | null = null;
    const marks: Record<string, number> = {};
    world.worldLogJournal = []; world.worldLogByPlayer.clear(); world.takeNodeEvents(nodeId);
    for (; elapsed < cap; elapsed += 100) {
      now = 1800000000000 + elapsed;
      world.tick(100, now);
      for (const e of world.worldLogJournal as any[]) {
        if (e.kind === 'kill' && e.victim?.id === bossEntityId) killAt ??= elapsed;
        if (e.kind === 'player-death') { deathAt ??= elapsed; killer ??= [e.cause?.killer?.monsterName ?? e.cause?.killer?.name, e.cause?.ability ?? e.cause?.abilityName ?? e.cause?.kind].filter(Boolean).join(' / ') || JSON.stringify(e.cause ?? null).slice(0, 120); }
        if (e.kind === 'dungeon-message' && /reforms/i.test(e.message ?? '')) resetAt ??= elapsed;
        // Damage taken split by source: the boss itself vs everything else (adds, zones).
        if (e.kind === 'damage' && e.target?.id === bot.isPlayer.id) {
          const amt = e.hpDamage ?? 0;
          if (e.source?.id === bossEntityId) takenBoss += amt;
          else { const k = e.source?.name ?? e.source?.id ?? 'other'; takenOther[k] = (takenOther[k] ?? 0) + amt; }
        }
      }
      world.worldLogJournal = []; world.worldLogByPlayer.clear(); world.takeNodeEvents(nodeId);
      const live = findBoss();
      if (live) bossHp = live.hasHealth.hp;
      if (firstDmgAt === null && (bossHp < bossMaxHp || killAt !== null)) firstDmgAt = elapsed;
      if (firstDmgAt !== null) for (const w of [10, 30, 60, 120]) if (elapsed - firstDmgAt === w * 1000) marks[w] = bossMaxHp - bossHp;
      const terminal = classifyBossTick({
        bossKillEvent: killAt === elapsed,
        playerDead: deathAt === elapsed || !!bot.isDead || bot.hasHealth.hp <= 0,
        bossPresent: live !== null, dungeonReset: resetAt === elapsed, bossSeen: true,
      });
      const v = composePlayerView(bot)!;
      minHp = Math.min(minHp, v.hp / v.maxHp);
      if (terminal !== null) { outcome = terminal; if (killAt !== null) bossHp = 0; break; }
      world.pendingDeaths = [];
    }
    const dealt = bossMaxHp - bossHp;
    const fightS = firstDmgAt === null ? null : (elapsed - firstDmgAt) / 1000;
    const dps: Record<string, number | null> = {};
    for (const w of [10, 30, 60, 120]) dps[`dps${w}`] = marks[w] !== undefined ? Math.round(marks[w]! / w) : null;
    return {
      id: row.id, tier: row.tier, cls: row.cls, frame: row.frame ?? null, path: row.path ?? null, treatment: row.treatment, node: nodeId, seed,
      outcome, won: isVictory(outcome as any), t: elapsed / 1000, firstDmgS: firstDmgAt === null ? null : firstDmgAt / 1000, fightS,
      bossMaxHp, dealt, dpsAll: fightS ? Math.round(dealt / fightS) : 0, ...dps, minHpPct: Math.round(minHp * 1000) / 10, killer, deathS: deathAt === null ? null : deathAt / 1000, takenBoss, takenOther, loadout, pkg,
    };
  } finally {
    try { teardownArena(world); } catch { /* ignore */ }
    restore(); restoreAp(); restoreSp(); restoreMp();
    Date.now = realNow; Math.random = realRandom;
  }
}

assert(hydrateHitboxCacheFromArtifact(args.hitboxes) > 0, 'hitbox artifact required');
void SURVEY_CLASSES; void withReferenceAbilityWiring;
const plan = JSON.parse(readFileSync(args.plan!, 'utf8')) as Row[];
const shard = Number(args.shard ?? 0), shards = Number(args.shards ?? 1);
for (let i = shard; i < plan.length; i += shards) {
  const row = plan[i]!;
  const started = realNow();
  let res: unknown;
  try { res = run(row); } catch (e) { res = { id: row.id, tier: row.tier, cls: row.cls, treatment: row.treatment, error: String((e as Error).message).slice(0, 400) }; }
  appendFileSync(args.out!, JSON.stringify({ ...(res as object), wallMs: realNow() - started }) + '\n');
}
