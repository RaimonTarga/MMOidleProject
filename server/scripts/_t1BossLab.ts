/**
 * Throwaway T1 boss lab (2026-09-26). Not a frozen packet: a quick seeded boss fight
 * per plan row, guard stripped and boss force-woken exactly like bossScreen.ts, with
 * bossTerminal's classifier deciding the outcome. One JSON line per fight.
 *
 *   tsx scripts/_t1BossLab.ts --plan=plan.json --out=res.jsonl --hitboxes=... [--shard=0 --shards=1]
 */
import assert from 'node:assert/strict';
import { readFileSync, appendFileSync } from 'node:fs';
import { ABILITY_DATABASE, ESSENCE_TYPES, ITEM_DATABASE, LINEAGE_DATABASE, RECIPE_DATABASE, MONSTER_DATABASE, NODE_BIOMES, SKILL_TREE, composePlayerView, runicPointLoadoutCost, withReferenceAbilityWiring } from '@mmo-idle/shared';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { setupArena, teardownArena, BOT_SPAWN } from '../bench/balance/arena';
import { prepareSurveyBot, SURVEY_CLASSES, type SurveyCell } from '../bench/balance/ttkSurveySpec';
import { hydrateHitboxCacheFromArtifact } from '../src/hitbox/cache';
import { ensureDungeon } from '../src/systems/world/dungeons/dungeon';
import { classifyBossTick, isVictory } from '../bench/balance/bossTerminal';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { refillBarrier } from '../src/systems/defense/barrier/barrier';
import { setLineageActive, unlockLineageCard } from '../src/systems/player/economy/lineages';
import type { PlayerEntity } from '../src/ecs/entity';
import type { World } from '../src/world/World';

const args = Object.fromEntries(process.argv.slice(2).map((s) => {
  const i = s.indexOf('=');
  return [s.slice(2, i), s.slice(i + 1)];
})) as Record<string, string>;

interface Row {
  id: string; boss: string; cls: string; weapon: string; armor: string; charm: string; boots: string;
  techniques: string[]; guards: string[]; rules?: { conditionId: string; actionId: string }[];
  treatment?: string; seed?: number; capMs?: number;
  /** Farm mode: auto-farm an OPEN node (`node`) instead of fighting a boss. */
  mode?: 'farm'; node?: string; durable?: boolean;
  /** Survival profile for treatment 'attacker': equal raw DPS = 2*hit per second. */
  prof?: { kind: 'swarm' | 'slam' | 'dot'; hit: number; cdMs?: number; dotPerStack?: number };
  /** Tally world-log events that touch the bot (diagnostics). */
  debugEvents?: boolean; tier?: number; upgrade?: number; stance?: string | null;
  /** Class build: frame (default balanced), T4 spec letter (default a), range (default by class), core, relic. */
  frame?: 'light' | 'balanced' | 'heavy'; spec?: 'a' | 'b' | 'c'; range?: 'close' | 'mid' | 'far'; core?: string; relic?: string;
  /** Weapon overrides for tuning: [+0, +5] endpoints; the whole delta rides on upgrade step 1. */
  /** Ability overrides: per-rank effect field values, plus cast/cooldown. */
  ap?: Record<string, { field?: string; values?: number[]; castMs?: number; cooldownMs?: number }>;
  wp?: Record<string, { atk?: [number, number]; aps?: [number, number]; me?: Record<string, [number, number]> }>;
  /** Skill-node overrides: mechanicEffects / statEffects values merged onto the node. */
  sp?: Record<string, { me?: Record<string, number>; st?: Record<string, number> }>;
  /**
   * Boss-definition overrides by dot-path, e.g.
   * `{ 'crag-behemoth': { 'stats.attack': 50, 'bossPattern.damageMultiplier': 1.7 } }`.
   * Arrays index numerically (`bossScript.phases.0.actions.0.multiplierMult`). A path
   * that does not already exist on the definition throws, so a candidate can never be
   * a silent no-op -- which is how an A/B on the same seeds reads as "no effect".
   */
  bp?: Record<string, Record<string, number>>;
  /**
   * Seeded APPROACH GEOMETRY, instead of the one fixed `BOT_SPAWN` point.
   *
   * Without it a solo boss fight is fully DETERMINISTIC: measured 2026-10-02, 24 of
   * the 30 class x boss cells returned 20 byte-identical fights from 20 seeds, because
   * nothing in them rolls a die -- no T1 boss authors `evasion`, the tutorial kits
   * carry no dodge, the Chaotic Axe's whiff is a COUNTED dead swing, and the guards
   * are stripped. Only the Razorback varied, off its adds' spawn offsets. So a
   * seedless win rate is 0% or 100% and can never express "sometimes".
   *
   * This restores the one thing the arena removed rather than inventing a
   * distribution: a player walks to the altar from the node's entrance, not from a
   * fixed pixel. Angle is uniform and radius is 400 +/- 80 -- the same engagement
   * distance, a different bearing -- which is exactly the question a directional lane
   * charge and a travelling mound ask. Drawing it moves the RNG stream, so jittered
   * rows compare only against jittered rows.
   */
  jitter?: boolean;
  /**
   * The lean × verb composition matrix (course-correction W3-A). `lineage` names the
   * weapon lineage whose T1 band the row buys; `lean` and `verb` are its T1 `stat`
   * and `payoff` card ids (either may be null; both null is the no-band CONTROL,
   * which still wears the form). Bought through the REAL economy handler with a
   * generous wallet, after the bot is prepared; a refusal is recorded in the result's
   * `refusals`, never faked. The row's `weapon` must be the lineage's form, since a
   * lineage pays only while its own form is worn.
   */
  lineage?: string;
  lean?: string | null;
  verb?: string | null;
  /** Drop the per-second HP track and the loadout from the result (matrix runs). */
  compact?: boolean;
}

/**
 * Wallet the composition rows are credited before buying. Generous on purpose, like
 * the lane bench's (`bench/lineage/laneBot.ts`): the matrix measures combat, and the
 * purchase still goes through the real handler, so a mastery refusal is a refusal.
 */
const MATRIX_ESSENCE = 5_000;
const MATRIX_SHARDS = 200;

/**
 * Buy the row's lean and verb through the real economy handler and slot both.
 * Returns the refusals (empty when the band is live exactly as declared).
 */
function buyBand(world: World, bot: PlayerEntity, row: Row): string[] {
  if (!row.lineage) return [];
  const lineage = LINEAGE_DATABASE.get(row.lineage);
  assert(lineage, `${row.id}: unknown lineage ${row.lineage}`);
  const p = bot.tracksProgression;
  const tree = composePlayerView(bot)!.lineages[row.lineage];
  const refusals: string[] = [];
  if (!tree) refusals.push(`no tree: wearing ${bot.holdsInventory.equipment.weapon} opened no ${row.lineage} tree`);
  else if (tree.wornForm !== row.weapon) refusals.push(`worn form is ${tree.wornForm}, not ${row.weapon}`);
  const cardIds = [row.lean, row.verb].filter((id): id is string => !!id);
  const savedEssences = { ...p.essences };
  for (const type of ESSENCE_TYPES) p.essences[type] = MATRIX_ESSENCE;
  for (const cardId of cardIds) {
    const card = lineage.cards.find((c) => c.id === cardId);
    assert(card, `${row.id}: ${cardId} is not a card of ${row.lineage}`);
    p.shards[card.lane] = MATRIX_SHARDS;
  }
  for (const cardId of cardIds) {
    const bought = unlockLineageCard(world, bot, row.lineage, cardId);
    if (!bought.success) refusals.push(`unlockCard ${cardId}: ${bought.reason}`);
  }
  for (const cardId of cardIds) {
    const card = lineage.cards.find((c) => c.id === cardId)!;
    const activated = setLineageActive(world, bot, row.lineage, card.row, cardId);
    if (!activated.success) refusals.push(`setActive ${cardId}: ${activated.reason}`);
  }
  Object.assign(p.essences, savedEssences);
  recalculatePlayerEntityStats(world, bot);
  syncArchetypeSlices(world, bot);
  bot.hasHealth.hp = bot.hasHealth.maxHp;
  refillBarrier(world, bot);
  const live = composePlayerView(bot)!.lineages[row.lineage];
  for (const cardId of cardIds) {
    const card = lineage.cards.find((c) => c.id === cardId)!;
    if (live?.active[card.row] !== cardId) refusals.push(`${cardId} is not the live ${card.row} card (${live?.active[card.row] ?? 'none'})`);
  }
  return refusals;
}

function skillPathFor(row: Row, c: { prefix: string; melee: boolean }, tier: number): string[] {
  const frame = row.frame ?? 'balanced';
  const range = row.range ?? (c.melee ? 'close' : 'mid');
  return [`${c.prefix}-root`, ...(tier >= 2 ? [`${c.prefix}-${frame}`] : []), ...(tier >= 3 ? [`${c.prefix}-range-${range}`] : []), ...(tier >= 4 ? [`${c.prefix}-${frame}-t3-${row.spec ?? 'a'}`] : [])];
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
  // Boss-lineage redesign smoke (2026-09-27): every boss.
  'gorging-razortusk': 'node-t2-plains-dungeon',
  'stoneplate-juggernaut': 'node-t2-mountain-dungeon',
  'mire-gorged-behemoth': 'node-t2-swamp-dungeon',
  'chitinous-dreadbore': 'node-t2-cave-dungeon',
  'dune-stalker-emperor': 'node-t2-desert-dungeon',
  'jungle-dread-gorger': 'node-t2-jungle-dungeon',
  'rot-spore-croc-behemoth': 'node-t3-swamp-dungeon',
  'deep-core-burrow-gorger': 'node-t3-cave-dungeon',
  'dune-carapace-monarch': 'node-t3-desert-dungeon',
  'apex-bramble-slasher': 'node-t3-jungle-dungeon',
  'cinder-shell-magma-salamander': 'node-t3-volcanic-dungeon',
  'frost-plated-rime-mammoth': 'node-t3-tundra-dungeon',
  'dune-throne-sovereign': 'node-t4-desert-dungeon',
  'verdant-crown-predator': 'node-t4-jungle-dungeon',
  'glacial-patriarch': 'node-t4-tundra-dungeon',
  'caldera-sovereign': 'node-t4-volcanic-dungeon',
  'charnel-crown-sovereign': 'node-t4-graveyard-dungeon',
  'elder-trench-serpent': 'node-t4-trench-dungeon',
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
  // Survival dummy: 1e9 HP, no mechanics, one authored damage shape (row.prof).
  attacker: (row) => patchDef(row.boss, (d) => {
    dummy(d, 0, 0);
    d.stats.hp = 1_000_000_000;
    const h = row.prof!.hit;
    const pr = row.prof!;
    if (pr.cdMs !== undefined) {
      // Explicit profile: hit size + cadence (+ optional poison) set by the plan.
      d.stats.attack = h; d.stats.attackCooldown = pr.cdMs;
      if (pr.dotPerStack) d.dotEffect = { debuffId: 'grave-toadeater-poison', label: 'Toad Poison', damagePerStack: pr.dotPerStack, maxStacks: 5, tickIntervalMs: 1000, durationMs: 6000 };
    } else if (pr.kind === 'swarm') { d.stats.attack = h; d.stats.attackCooldown = 500; }
    else if (pr.kind === 'slam') { d.stats.attack = 8 * h; d.stats.attackCooldown = 4000; }
    else {
      d.stats.attack = Math.max(1, Math.round(h / 2)); d.stats.attackCooldown = 1000;
      d.dotEffect = { debuffId: 'grave-toadeater-poison', label: 'Toad Poison', damagePerStack: Math.max(1, Math.round(h * 0.3)), maxStacks: 5, tickIntervalMs: 1000, durationMs: 6000 };
    }
  }),
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
/** Install skill-node overrides; returns restore. */
function patchSkills(sp: Row['sp']): () => void {
  const undo: (() => void)[] = [];
  for (const [id, o] of Object.entries(sp ?? {})) {
    const node = SKILL_TREE.get(id) as any;
    assert(node, `unknown skill node ${id}`);
    const saved = { me: structuredClone(node.mechanicEffects), st: structuredClone(node.statEffects) };
    undo.push(() => { node.mechanicEffects = saved.me; node.statEffects = saved.st; });
    node.mechanicEffects = { ...(node.mechanicEffects ?? {}), ...(o.me ?? {}) };
    node.statEffects = { ...(node.statEffects ?? {}), ...(o.st ?? {}) };
  }
  return () => { for (const u of undo.reverse()) u(); };
}
/**
 * Install boss-definition overrides by dot-path; returns restore.
 *
 * This is the tuning lever the T1 boss pass (2026-10-02) runs its candidates on:
 * every candidate is the same plan row with one `bp` block, so a before/after pair
 * shares its seeds exactly and the only moving part is the number under test.
 */
function patchBossStats(bp: Row['bp']): () => void {
  const undo: (() => void)[] = [];
  for (const [id, paths] of Object.entries(bp ?? {})) {
    assert(def(id), `unknown monster ${id}`);
    undo.push(patchDef(id, (d) => {
      for (const [path, value] of Object.entries(paths)) {
        const keys = path.split('.');
        let cur: any = d;
        for (const k of keys.slice(0, -1)) {
          cur = cur?.[k];
          assert(cur !== null && typeof cur === 'object', `${id}: no such path ${path}`);
        }
        const last = keys[keys.length - 1]!;
        assert(last in cur, `${id}: no such field ${path}`);
        cur[last] = value;
      }
    }));
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
  // An explicit rule set is honoured verbatim; its RP legality is still enforced,
  // by `prepareSurveyBot`'s `setAbilityLoadout` assert, which sees the equipped
  // rules alongside the abilities.
  if (row.rules) { chosenRules = row.rules.length; return row.rules; }
  const full = DEFAULT_RULES(melee);
  const abilities = { techniques: row.techniques, guards: row.guards };
  for (const rules of [full, full.slice(0, 3), [full[0]!, full[2]!]]) {
    const cost = runicPointLoadoutCost({ rules: withReferenceAbilityWiring(rules, abilities), abilities, stances: [], rites: [] } as any);
    if (cost <= 22) { chosenRules = rules.length; return rules; }
  }
  throw Error('no legal rule set');
}
let chosenRules = 0;

/** Worst sum over any window of `w` consecutive ticks. */
function worstWindow(xs: number[], w: number): number {
  let run = 0, best = 0;
  for (let i = 0; i < xs.length; i++) {
    run += xs[i]!;
    if (i >= w) run -= xs[i - w]!;
    if (run > best) best = run;
  }
  return Math.round(best * 10) / 10;
}

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

/**
 * FARM mode: the bot auto-farms an open node for capMs. Reports kills/min,
 * distance travelled and time split between moving and fighting. With
 * durable=true the bot cannot die, isolating pace (travel + kill speed) from
 * safety.
 */
function runFarm(row: Row) {
  const seed = row.seed ?? 173;
  let rs = seed, now = 1800000000000;
  Math.random = () => { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 4294967296; };
  Date.now = () => now;
  const restoreWeapons = patchWeapons(row.wp);
  const restoreAbilities = patchAbilities(row.ap);
  const restoreSkills = patchSkills(row.sp);
  const nodeId = row.node!;
  const tier = NODE_BIOMES[nodeId]!.biomeTier;
  const c = SURVEY_CLASSES.find((x) => x.name === row.cls)!;
  const world = createBalanceWorld();
  try {
    setupArena(world, { nodeId, biomeGroup: NODE_BIOMES[nodeId]!.biomeGroup, contentTier: tier, isDungeon: false });
    const cell: SurveyCell = {
      id: row.id, className: row.cls, tier, role: 'farm', nodeId, alternate: false, isDungeon: false,
      stance: row.stance === undefined ? (tier >= 2 ? 'offensive-stance' : null) : row.stance, upgradeLevel: row.upgrade ?? 5,
      abilities: { techniques: row.techniques, guards: row.guards },
      runeRules: pickRules(row, c.melee),
      build: {
        id: row.id, classRoot: `${c.prefix}-root`, contentTier: tier, playerTier: tier, gearTier: tier,
        skillPath: skillPathFor(row, c, tier),
        gearItemIds: { weapon: row.weapon, armor: row.armor, recovery: row.charm, mobility: row.boots, ...(row.core ? { core: row.core } : {}), ...(row.relic ? { relic: row.relic } : {}) },
      },
    } as SurveyCell;
    const { bot } = prepareSurveyBot(world, cell, BOT_SPAWN);
    if (row.durable) { bot.hasHealth.maxHp = 10_000_000; bot.hasHealth.hp = 10_000_000; }
    const cap = row.capMs ?? 300_000;
    let kills = 0, deaths = 0, dist = 0, movingMs = 0, combatMs = 0;
    const killTimes: number[] = [];
    let initial = 0; for (const _ of world.monsterEntitiesInNode(nodeId)) initial++;
    let last = { ...bot.hasPosition.current };
    world.worldLogJournal = []; world.worldLogByPlayer.clear(); world.takeNodeEvents(nodeId);
    for (let elapsed = 0; elapsed < cap; elapsed += 100) {
      now = 1800000000000 + elapsed;
      world.tick(100, now);
      for (const e of world.worldLogJournal as any[]) {
        if (e.kind === 'kill' && e.killer?.id === bot.isPlayer.id) { kills++; killTimes.push(elapsed); }
        if (e.kind === 'player-death') deaths++;
      }
      world.worldLogJournal = []; world.worldLogByPlayer.clear(); world.takeNodeEvents(nodeId);
      const pos = bot.hasPosition.current;
      const step = Math.hypot(pos.x - last.x, pos.y - last.y);
      if (step > 0.5) { dist += step; movingMs += 100; }
      if (bot.hasAttackTarget) combatMs += 100;
      last = { ...pos };
      if (row.durable) bot.hasHealth.hp = bot.hasHealth.maxHp;
      world.pendingDeaths = [];
    }
    return {
      id: row.id, mode: 'farm', node: nodeId, cls: row.cls, boots: row.boots, weapon: row.weapon, seed,
      initial, tClearHalf: killTimes[Math.floor(initial / 2) - 1] !== undefined ? killTimes[Math.floor(initial / 2) - 1]! / 1000 : null,
      tClear: killTimes[initial - 1] !== undefined ? killTimes[initial - 1]! / 1000 : null,
      kills, killsPerMin: Math.round((kills / (cap / 60000)) * 10) / 10, deaths,
      dist: Math.round(dist), avgMoveSpeed: movingMs > 0 ? Math.round(dist / (movingMs / 1000)) : 0,
      movingPct: Math.round((movingMs / cap) * 100), targetPct: Math.round((combatMs / cap) * 100),
    };
  } finally {
    try { teardownArena(world); } catch { /* ignore */ }
    restoreWeapons(); restoreAbilities(); restoreSkills();
    Date.now = realNow; Math.random = realRandom;
  }
}

function run(row: Row) {
  const seed = row.seed ?? 173;
  let rs = seed, now = 1800000000000;
  Math.random = () => { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 4294967296; };
  Date.now = () => now;
  const restoreWeapons = patchWeapons(row.wp);
  const restoreAbilities = patchAbilities(row.ap);
  const restoreSkills = patchSkills(row.sp);
  const restore = (TREATMENTS[row.treatment ?? 'live'] ?? (() => { throw Error(`unknown treatment ${row.treatment}`); }))(row);
  // After the treatment, so a `bp` candidate is the last word on the definition.
  const restoreBoss = patchBossStats(row.bp);
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
        skillPath: skillPathFor(row, c, tier),
        gearItemIds: { weapon: row.weapon, armor: row.armor, recovery: row.charm, mobility: row.boots, ...(row.core ? { core: row.core } : {}), ...(row.relic ? { relic: row.relic } : {}) },
      },
    } as SurveyCell;
    const spawn = row.jitter
      ? (() => {
        const angle = Math.random() * Math.PI * 2, radius = 320 + Math.random() * 160;
        return { x: BOT_SPAWN.x + Math.cos(angle) * radius, y: BOT_SPAWN.y - 400 + Math.sin(angle) * radius };
      })()
      : BOT_SPAWN;
    const { bot } = prepareSurveyBot(world, cell, spawn);
    // The composition matrix's band, bought AFTER the kit is prepared so the lean's
    // stat is in the view the loadout below reports.
    const refusals = buyBand(world, bot, row);
    const view = composePlayerView(bot)!;
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
    // Recovery report (T1 boss pass decision 7, 2026-10-02). `healed` is the logged
    // heal total -- `applyHealToPlayer` is the single funnel and logs the APPLIED
    // amount, so overheal is already out of it. `hpGained` sums positive per-tick HP
    // deltas, which is NET of damage landing in the same 100 ms tick and so reads
    // lower; the healed-back share is `healed`, and `hpGained` is how much of it the
    // bar actually kept.
    let healed = 0, hpGained = 0, under25Ms = 0;
    const hpTrack: number[] = [];
    // Burst shape, for the Behemoth trim (decision 3): the biggest SINGLE post-
    // mitigation hit, and the worst 5-second window of damage taken. 5 s is the Crag
    // Charge sequence end to end (2.4 s cast + ~1.3 s run + 1 s recovery), so
    // `burst5s` is the number "survivable from ~60% HP" is a statement about -- the
    // dominant hit alone is not, because the sequence lands ordinary swings too.
    let maxHit = 0, maxHitFrom: string | null = null;
    const dmgPerTick: number[] = [];
    let bossHp = bossMaxHp, killAt: number | null = null, deathAt: number | null = null, resetAt: number | null = null;
    let hpAt8: number | null = null;
    const tally: Record<string, { n: number; amount: number }> = {};
    let fromBoss = 0, fromAdds = 0, maxAdds = 0, halfAt: number | null = null, killer: string | null = null;
    // `card-fx` per card id: a verb's landed firings (the composition matrix's
    // "does the moment fire, and how often").
    const fxByCard: Record<string, number> = {};
    world.worldLogJournal = []; world.worldLogByPlayer.clear(); world.takeNodeEvents(nodeId);
    for (; elapsed < cap; elapsed += 100) {
      now = 1800000000000 + elapsed;
      world.tick(100, now);
      let tickDmg = 0;
      const hp = bot.hasHealth.hp;
      if (hp < lastBotHp) hpLost += lastBotHp - hp; else hpGained += hp - lastBotHp;
      lastBotHp = hp;
      if (hp > 0 && hp < bot.hasHealth.maxHp * 0.25) under25Ms += 100;
      if (elapsed % 1000 === 0) hpTrack.push(Math.round((hp / bot.hasHealth.maxHp) * 100));
      // Refill to 90%, never 100%: a full bar turns the next heal into overheal (ward).
      if (row.durable && bot.hasHealth.hp > 0 && bot.hasHealth.hp < bot.hasHealth.maxHp * 0.5) { bot.hasHealth.hp = Math.floor(bot.hasHealth.maxHp * 0.9); lastBotHp = bot.hasHealth.hp; }
      for (const e of world.worldLogJournal as any[]) {
        if (row.debugEvents && (e.target?.id === bot.isPlayer.id || e.player?.id === bot.isPlayer.id)) {
          const k = e.kind + (e.kind === 'damage' ? (e.source?.id === bossEntityId ? ':boss' : ':other') : '');
          const t = (tally[k] ??= { n: 0, amount: 0 }); t.n++; t.amount += e.hpDamage ?? e.amount ?? e.damage ?? 0;
        }
        if (e.kind === 'kill' && (e.victim?.id === bossEntityId || e.victim?.name === def(row.boss).name)) killAt ??= elapsed;
        if (e.kind === 'player-death') { deathAt ??= elapsed; killer ??= e.cause?.killer?.name ?? e.cause?.killer?.monsterTypeId ?? JSON.stringify(e.cause ?? null).slice(0, 160); }
        if (e.kind === 'dungeon-message' && /reforms/i.test(e.message ?? '')) resetAt ??= elapsed;
        if (e.kind === 'heal' && e.target?.id === bot.isPlayer.id) healed += e.amount ?? 0;
        if (e.kind === 'damage' && e.target?.id === bot.isPlayer.id) {
          const amt = e.hpDamage ?? 0;
          tickDmg += amt;
          if (amt > maxHit) { maxHit = amt; maxHitFrom = e.source?.name ?? e.source?.id ?? null; }
          if (e.source?.id === bossEntityId || e.source?.name === def(row.boss).name) fromBoss += amt; else fromAdds += amt;
        }
      }
      world.worldLogJournal = []; world.worldLogByPlayer.clear();
      for (const event of world.takeNodeEvents(nodeId)) {
        if (event.kind === 'card-fx' && event.cardId !== undefined) fxByCard[event.cardId] = (fxByCard[event.cardId] ?? 0) + 1;
      }
      dmgPerTick.push(tickDmg);
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
    const band = row.lineage
      ? { lineage: row.lineage, lean: row.lean ?? null, verb: row.verb ?? null, refusals, fxByCard,
        verbFires: row.verb ? fxByCard[row.verb] ?? 0 : 0 }
      : {};
    if (row.compact) {
      return {
        id: row.id, boss: row.boss, cls: row.cls, seed, weapon: row.weapon, ...band,
        outcome, won: isVictory(outcome as any), t: elapsed / 1000, dealt: bossMaxHp - bossHp,
        dps: Math.round(((bossMaxHp - bossHp) / Math.max(0.1, elapsed / 1000)) * 10) / 10,
        bossPctLeft: Math.round((bossHp / bossMaxHp) * 1000) / 10, minHpPct: Math.round(minHp * 1000) / 10,
        hpLost: Math.round(hpLost), killer, maxHp: loadout.maxHp, attack: loadout.attack,
      };
    }
    return {
      id: row.id, boss: row.boss, cls: row.cls, treatment: row.treatment ?? 'live', seed, jitter: row.jitter ?? false, ...band,
      weapon: row.weapon, armor: row.armor, charm: row.charm, techniques: row.techniques, guards: row.guards,
      ...(row.debugEvents ? { tally } : {}), rules: chosenRules, outcome, won: isVictory(outcome as any), t: elapsed / 1000, dealt: bossMaxHp - bossHp, dps8: hpAt8 === null ? null : Math.round(((bossMaxHp - hpAt8) / 8.1) * 10) / 10, dps: Math.round(((bossMaxHp - bossHp) / Math.max(0.1, elapsed / 1000)) * 10) / 10, bossPctLeft: Math.round((bossHp / bossMaxHp) * 1000) / 10,
      minHpPct: Math.round(minHp * 1000) / 10, hpLost, fromBoss, fromAdds, maxAdds, halfAt: halfAt && halfAt / 1000, killer, loadout,
      // `healApplied` is the EXACT healing this fight applied, from the HP ledger:
      // every point of raw hpDamage that the bar does not show as missing was healed
      // back. Prefer it over both of the others. `healed` (the sum of logged heal
      // events) is wrong in both directions at flat Recovery, because the log rounds
      // a sub-1 per-tick slice: 0.5 HP/tick logs as 1 (Striker/Toadeater reads 378
      // against a true 215) and anything under 0.5 logs as 0, which is why four
      // classes report literally no healing. `hpGained` is net of damage landing in
      // the same 100 ms tick, so it is a floor, not the total.
      hpEnd: Math.round(bot.hasHealth.hp * 10) / 10,
      healApplied: Math.round(((fromBoss + fromAdds) - (bot.hasHealth.maxHp - Math.max(0, bot.hasHealth.hp))) * 10) / 10,
      healed, hpGained, healedShare: hpLost > 0 ? Math.round((healed / hpLost) * 1000) / 10 : null,
      maxHit, maxHitFrom, maxHitPctPool: Math.round((maxHit / loadout.maxHp) * 1000) / 10,
      burst5s: worstWindow(dmgPerTick, 50), burst5sPctPool: Math.round((worstWindow(dmgPerTick, 50) / loadout.maxHp) * 1000) / 10,
      under25Pct: elapsed > 0 ? Math.round((under25Ms / elapsed) * 1000) / 10 : 0, under25s: under25Ms / 1000, hpTrack,
    };
  } finally {
    try { teardownArena(world); } catch { /* ignore */ }
    restoreBoss(); restore(); restoreWeapons(); restoreAbilities(); restoreSkills();
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
  try { res = row.mode === 'farm' ? runFarm(row) : run(row); } catch (e) { res = { id: row.id, boss: row.boss, cls: row.cls, treatment: row.treatment, error: String((e as Error).message).slice(0, 300) }; }
  appendFileSync(args.out!, JSON.stringify({ ...(res as object), wallMs: realNow() - started }) + '\n');
}
