import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  BIOME_DATABASE,
  MODIFIER_BANS,
  MONSTER_DATABASE,
  NODE_MODIFIER_FAMILIES,
  modifiedDamageReduction,
  modifiedDotDamagePerStack,
  modifierSpawnFactor,
  modifierStatScalars,
  type MonsterDefinition,
  type NodeModifierFamily,
} from '@mmo-idle/shared';

// ─────────────────────────────────────────────────────────────────────────────
// VACUUM tier table — every monster in a biome tier, described WITHOUT any
// reference player.
//
// This is deliberately NOT tools/mob-report.ts. That report measures monsters
// against reconstructed reference players (incoming DPS vs player HP, player TTK,
// spike as %maxHP). This one refuses to name a player at all: every column here is
// a property of the authored monster and its biome, so the only comparisons it can
// support are monster-vs-monster inside a tier and biome-vs-biome.
//
// The one place "no player" cannot be taken literally is durability. Mitigation is
//   dmg = max(1, round(max(0, hit - plating) * (1 - DR)))
// (shared/src/systems/combatEstimates.ts) — a FLAT subtract before a multiplicative
// reduction, with a hard 1-damage floor. That makes effective HP a function of the
// incoming HIT SIZE, not of the monster alone: plating 8 halves a 16-damage hit and
// barely dents a 160-damage one. So instead of inventing one fake eHP we report a
// curve over probe hit sizes anchored to the tier's own attack scale (see
// PROBE_MULTIPLES). The probes are player-free — they describe the monster's armour
// *character*, and the light/heavy spread is exactly the "which weapons does this
// thing punish" signal a balance pass wants.
//
// Not modelled (by construction): player stats, movement, pathing, aggro chains,
// AI, real concurrency, healing, party effects, boss scripts beyond their opener.
// Ecology columns are authored intent (density, pool weight, pack size), not
// simulated outcomes. Anything derived from a mechanic we cannot evaluate
// statically is marked partial rather than silently dropped.
// ─────────────────────────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = process.argv.slice(2);

function stringArg(name: string): string | null {
  const eq = ARGS.find((a) => a.startsWith(name + '='));
  const i = ARGS.indexOf(name);
  return eq ? eq.slice(name.length + 1) : i >= 0 ? ARGS[i + 1] ?? null : null;
}
function numberArg(name: string): number | null {
  const v = stringArg(name);
  if (!v) return null;
  const nv = Number(v);
  return Number.isFinite(nv) ? nv : null;
}

const TIER = numberArg('--tier') ?? 1;
const EXCLUDED_BIOMES = new Set(['testroom', 'sanctuary', 'clearing']);

/**
 * Abstract per-hit damage probes used for the eHP curve, as MULTIPLES of the
 * tier's own median monster attack.
 *
 * A fixed absolute ladder does not survive contact with the tiers: probing a T4
 * Trench mob (plating 18) with a 10-damage hit floors it to 1 damage and reports
 * an eHP of ~34,000, which says nothing about T4 and everything about the probe
 * being off-scale. Anchoring to the tier's own authored attack scale keeps the
 * probes inside the band the tier actually operates in, and keeps the whole thing
 * player-free: the anchor is monster data.
 *
 * Consequence to remember when reading output: eHP is comparable WITHIN a tier,
 * not across tiers (the probes differ). For cross-tier scale, read raw HP.
 */
const PROBE_MULTIPLES = [0.5, 1, 2, 4] as const;
/** Which multiples get their own summary column. */
const LIGHT_MULT = 0.5;
const HEAVY_MULT = 4;

/**
 * DESIGNER-SET intended progression order per tier — the "railroad" a player is nudged
 * along. Skipping ahead stays legal; it should just be rough. Biomes are reported in this
 * order and the progression curve is indexed to the first entry, so a healthy tier reads
 * as a monotonically rising sequence.
 *
 * T1 is locked with the user. Later tiers are placeholders until their own pass.
 */
const PROGRESSION: Record<number, string[]> = {
  1: ['plains', 'forest', 'swamp', 'mountain', 'cave'],
  2: ['plains', 'forest', 'swamp', 'mountain', 'cave', 'jungle', 'desert'],
  3: ['jungle', 'swamp', 'mountain', 'desert', 'tundra', 'volcanic', 'cave'],
  4: ['jungle', 'volcanic', 'graveyard', 'mountain', 'desert', 'tundra', 'trench'],
};

/**
 * DESIGNER-SET expected concurrency: how many bodies are typically on the player at
 * once in this biome. This is the load-bearing ecology term and it is NOT derivable
 * from `mobDensity` — concurrency is density filtered through pull radius, aggro
 * chaining (pack callRange / swarm), leash and player movement. Density says how many
 * monsters exist in the node; this says how many are hitting you.
 *
 * These are design intent pending validation against the farm bench, which is why they
 * live here as an explicit named assumption rather than being silently inferred.
 */
const CONCURRENCY: Record<string, number> = {
  // T1 locked with the user 2026-08-17. Caverns raised 1 -> 2: at N=1 every cave
  // monster had to absorb the entire 5->1 concurrency collapse in per-mob damage.
  plains: 5, forest: 3, swamp: 2, mountain: 2, cave: 2,
  jungle: 4, desert: 2, tundra: 2, volcanic: 3, graveyard: 4, trench: 1,
};
const DEFAULT_CONCURRENCY = 2;

/**
 * DESIGNER-SET progression targets, as per-stage growth along `PROGRESSION` indexed to
 * the first biome (which is the measured baseline, not itself a target).
 *
 * T1, locked with the user 2026-08-17:
 *   sustained danger x1.20/stage — the axis that makes skipping ahead rough rather
 *     than merely slow. eHP cancels out of it entirely, so this is purely a per-mob
 *     DPS and concurrency statement.
 *   effective HP    x1.41/stage — chosen to land Caverns at ~4x Plains ("moderate
 *     cut" from today's 8.8x), which keeps cave monsters chunky and elite-feeling
 *     without making late T1 a slog.
 *   => cost per kill compounds at ~1.70/stage.
 */
interface TierTargets { sustainedPerStage: number; ehpPerStage: number }
const TARGETS: Record<number, TierTargets> = {
  1: { sustainedPerStage: 1.20, ehpPerStage: 1.41 },
};

/**
 * Encounter model. A pull of N identical mobs, each with effective HP `h` and DPS `d`,
 * focus-fired by a player of DPS P (autocombat focus-fires by default):
 *
 *   mob k dies at t_k = k*h/P, so total damage taken = d * (h/P) * N(N+1)/2
 *
 * Three quantities fall out, and they say different things:
 *
 *   sustained = d * (N+1)/2
 *       Mean live attackers as the pull burns down, times per-mob DPS. This is the
 *       attrition rate the player must out-sustain. Note what is ABSENT: monster eHP
 *       and player DPS both cancel. Monster durability does not make a biome more
 *       dangerous in the sustained sense — it makes it slower. That is precisely why
 *       a durability-led difficulty curve reads as tedium rather than threat.
 *
 *   costPerKill = d * h * (N+1)/2   (proportional to damage taken per kill; P divides out)
 *       Punishment per unit of progress/reward. The farming-viability metric.
 *
 *   pullLoad = d * h * N(N+1)/2     (proportional to damage taken per full pull)
 *       The spike of walking into a group. Quadratic in N — this is why "density x mean
 *       DPS" understates crowded biomes and why density cannot be applied linearly.
 *
 * P cancels in every biome-vs-biome ratio, so all three stay player-free as comparators.
 * Perfect AoE would collapse the (N+1)/2 term toward 1 (everything dies at once); real
 * builds sit between the two, which is where class matchup texture lives.
 */
function encounterLoad(h: number, d: number, n: number): { sustained: number; costPerKill: number; pullLoad: number } {
  const meanLive = (n + 1) / 2;
  return { sustained: d * meanLive, costPerKill: d * h * meanLive, pullLoad: d * h * n * meanLive };
}

/** Median authored attack across a tier's normal monsters — the probe anchor. */
function tierAttackAnchor(defs: MonsterDefinition[]): number {
  const atk = defs.map((m) => m.stats.attack).sort((a, b) => a - b);
  if (!atk.length) return 1;
  const mid = Math.floor(atk.length / 2);
  return atk.length % 2 ? atk[mid] : (atk[mid - 1] + atk[mid]) / 2;
}

const round1 = (v: number): number => Math.round(v * 10) / 10;

/** The authoritative direct-hit formula, mirrored from combatEstimates.ts. */
function damageAfterMitigation(hit: number, plating: number, dr: number): number {
  return Math.max(1, Math.round(Math.max(0, hit - plating) * (1 - dr)));
}

/** Evasion is a deterministic dodge fraction: 0.2 ⇒ every 5th hit is skipped. */
function evasionOf(m: MonsterDefinition): number {
  return (m as unknown as { evasion?: number }).evasion ?? 0;
}

/**
 * eHP against one probe hit size: how much raw damage must be *thrown* to kill.
 * Includes evasion as a straight throughput divisor (dodging 1 hit in 5 means 25%
 * more swings), and periodic absorb shields as a crude uptime-weighted HP bonus.
 */
function effectiveHp(
  m: MonsterDefinition,
  hit: number,
  modifier?: NodeModifierFamily,
  biomeTier = 0,
): number {
  let { hp, plating, damageReduction: dr } = m.stats;
  if (modifier) {
    // Mirror the server's spawn-time reshaping so a modified node's eHP is the eHP
    // the player actually meets.
    const s = modifierStatScalars(modifier, biomeTier);
    hp = Math.max(1, Math.round(hp * s.hpMult));
    plating = Math.round(plating * s.platingMult);
    dr = modifiedDamageReduction(dr, s.incomingDamageMult);
  }
  const applied = damageAfterMitigation(hit, plating, dr);
  const base = (hp * hit) / applied;
  const ev = evasionOf(m);
  const shield = m.enemyShield
    ? 1 + m.enemyShield.shieldPct * Math.min(1, m.enemyShield.durationMs / Math.max(1, m.enemyShield.intervalMs))
    : 1;
  return (base / Math.max(0.01, 1 - ev)) * shield;
}

/** Direct DPS under a node modifier (attack and cadence both reshape). */
function modifiedDps(
  m: MonsterDefinition,
  modifier: NodeModifierFamily,
  biomeTier: number,
): number {
  const s = modifierStatScalars(modifier, biomeTier);
  const attack = Math.max(1, Math.round(m.stats.attack * s.attackMult));
  const cd = Math.max(1, Math.round(m.stats.attackCooldown * s.attackCooldownMult));
  return (attack * 1000) / cd;
}

/**
 * Direct auto-attack DPS, pre-mitigation. Pure authored offence.
 *
 * `consecutiveHits` multiplies in: one attack opportunity resolves that many full
 * pipeline hits (see the loop in combat.ts), so a 2-hit combo really is double DPS.
 * Leaving it out understated the Gnarled Greatbear by exactly 2x — the biggest
 * sustained-damage monster in T1 read as an average one.
 */
function directDps(m: MonsterDefinition): number {
  const hits = Math.max(1, Math.round(m.consecutiveHits ?? 1));
  return (m.stats.attack * hits * 1000) / Math.max(1, m.stats.attackCooldown);
}

/** Sustained DoT DPS at capped stacks. */
function dotDpsFrom(damagePerStack: number, maxStacks: number, tickIntervalMs: number): number {
  return (damagePerStack * maxStacks * 1000) / Math.max(1, tickIntervalMs);
}

/** Sustained DoT DPS once stacks are capped, plus how long capping takes. */
function dotProfile(m: MonsterDefinition): { dps: number; rampSec: number } {
  const d = m.dotEffect;
  if (!d) return { dps: 0, rampSec: 0 };
  const dps = dotDpsFrom(d.damagePerStack, d.maxStacks, d.tickIntervalMs);
  // One stack per landed hit, so capping takes (maxStacks - 1) further swings.
  const rampSec = ((d.maxStacks - 1) * m.stats.attackCooldown) / 1000;
  return { dps, rampSec };
}

/** Largest single-hit multiplier this monster can produce, and where it comes from. */
function spike(m: MonsterDefinition): { mult: number; source: string } {
  const cands: [number, string][] = [];
  if (m.cadenceFinisher) cands.push([m.cadenceFinisher.multiplier, 'cadence/' + m.cadenceFinisher.everyNAttacks]);
  if (m.empoweredCooldown) cands.push([m.empoweredCooldown.multiplier, 'cooldown/' + Math.round(m.empoweredCooldown.cooldownMs / 1000) + 's']);
  if (m.openingStrike) cands.push([m.openingStrike.multiplier, 'opener']);
  if (m.markedStrike) cands.push([m.markedStrike.multiplier, 'mark']);
  const charged = (m as unknown as { chargedAttack?: { multiplier: number; castMs: number } }).chargedAttack;
  if (charged) cands.push([charged.multiplier, 'charged/' + charged.castMs + 'ms']);
  if (!cands.length) return { mult: 1, source: '—' };
  cands.sort((a, b) => b[0] - a[0]);
  return { mult: cands[0][0], source: cands.map((c) => c[1]).join('+') };
}

/** Attack-ramp ceiling as a multiplier on outgoing damage (rampOnCombat). */
function rampCeiling(m: MonsterDefinition): number {
  return m.rampOnCombat ? 1 + m.rampOnCombat.maxPct : 1;
}

/** Control the monster imposes on the player. Never folded into DPS. */
function controlTags(m: MonsterDefinition): string[] {
  const t: string[] = [];
  if (m.slowEffect) t.push(m.slowEffect.speedMult === 0 ? 'root' : 'slow ' + Math.round((1 - m.slowEffect.speedMult) * 100) + '%');
  if (m.rampDebuff) t.push('ramp-slow ' + Math.round(m.rampDebuff.moveSlowMaxPct * 100) + '/' + Math.round(m.rampDebuff.atkSlowMaxPct * 100) + '%');
  if (m.appliesVulnerability) t.push('vuln ' + Math.round(m.appliesVulnerability.damageTakenPct * 100) + '% x' + m.appliesVulnerability.maxStacks);
  if (m.appliesAntiheal) t.push('antiheal ' + Math.round(m.appliesAntiheal.reductionPerStack * 100) + '% x' + m.appliesAntiheal.maxStacks);
  if (m.appliesMark) t.push('mark');
  if (m.engageSequence) t.push('lockout ' + m.engageSequence.lockoutMs + 'ms');
  return t;
}

/** Ecology / grouping intent, from authored data only. */
function ecologyTags(m: MonsterDefinition): string[] {
  const t: string[] = [];
  if (m.pack?.role === 'alpha') {
    const n = (m.pack.followers ?? []).reduce((s, f) => s + f.count, 0);
    t.push('alpha +' + n);
  } else if (m.pack) t.push('follower');
  if (m.swarm) t.push('swarm');
  if (m.patrol) t.push('patrol');
  if (m.holdsChokepoints) t.push('holds-choke');
  if (m.raisesDead) t.push('raises-dead');
  if (m.onDeath) t.push('on-death');
  if (m.aoeAttack) t.push('aoe r' + m.aoeAttack.radius);
  if (m.chargeOnAggro) t.push('charge x' + m.chargeOnAggro.speedMult);
  if (m.vaultsMountainLedges) t.push('vaults');
  if (m.elite) t.push('ELITE');
  return t;
}

/** Static analysis gaps worth surfacing per row rather than silently ignoring. */
function partialTags(m: MonsterDefinition): string[] {
  const t: string[] = [];
  if (m.enemySoftCap) t.push('soft-cap');
  if (m.enemyShield?.shatter) t.push('shatter');
  if (m.scalesWithAmbientRamp) t.push('ambient-scaled');
  if (m.bossScript) t.push('boss-script');
  if (m.ultimateEncounter) t.push('ultimate');
  if (m.raisesDead) t.push('raise-adds');
  return t;
}

interface Row {
  id: string; name: string; biome: string; weight: number; kind: 'normal' | 'boss';
  hp: number; attack: number; cd: number; plating: number; dr: number; ev: number;
  speed: number; range: number; pull: number; ranged: boolean;
  direct: number; dot: number; dotRamp: number; total: number;
  spikeMult: number; spikeSrc: string; spikeDmg: number; ramp: number;
  ehpLight: number; ehpHeavy: number; ehpCurve: number[]; armourSpread: number;
  control: string[]; ecology: string[]; partial: string[]; unpooled?: boolean;
  essence: number; biomeXp: number; catalyst: number;
}

function buildRow(id: string, weight: number, kind: 'normal' | 'boss', anchor: number): Row | null {
  const m = MONSTER_DATABASE.get(id);
  if (!m) return null;
  const s = m.stats;
  const d = dotProfile(m);
  const sp = spike(m);
  const curve = PROBE_MULTIPLES.map((mult) => effectiveHp(m, anchor * mult));
  const light = effectiveHp(m, anchor * LIGHT_MULT);
  const heavy = effectiveHp(m, anchor * HEAVY_MULT);
  return {
    id, name: m.name, biome: m.biome, weight, kind,
    hp: s.hp, attack: s.attack, cd: s.attackCooldown, plating: s.plating,
    dr: s.damageReduction, ev: evasionOf(m), speed: s.speed, range: s.attackRange,
    pull: s.pullRange, ranged: s.attackRange > 60,
    direct: directDps(m), dot: d.dps, dotRamp: d.rampSec, total: directDps(m) + d.dps,
    spikeMult: sp.mult, spikeSrc: sp.source, spikeDmg: s.attack * sp.mult, ramp: rampCeiling(m),
    ehpLight: light, ehpHeavy: heavy, ehpCurve: curve, armourSpread: light / Math.max(1, heavy),
    control: controlTags(m), ecology: ecologyTags(m), partial: partialTags(m),
    essence: m.rewards.essence, biomeXp: m.rewards.biomeXp ?? 0, catalyst: m.rewards.catalystWeight ?? 0,
  };
}

interface BiomeBlock { id: string; name: string; density: number; slots: number; rows: Row[]; bosses: Row[] }

function collect(tier: number): { blocks: BiomeBlock[]; anchor: number } {
  const pools = [...BIOME_DATABASE.values()]
    .filter((b) => !EXCLUDED_BIOMES.has(b.id))
    .map((b) => ({ b, pool: b.monsterPoolByTier?.[tier] ?? [], boss: b.bossPoolByTier?.[tier] ?? [] }))
    .filter((p) => p.pool.length || p.boss.length);

  // Anchor on NORMAL monsters only — bosses would drag the probe scale off the
  // trash the player actually grinds through.
  const normals = [...new Set(pools.flatMap((p) => p.pool))]
    .map((id) => MONSTER_DATABASE.get(id))
    .filter((m): m is MonsterDefinition => !!m);
  const anchor = tierAttackAnchor(normals);

  // Report in intended progression order; anything not on the railroad trails after it.
  const order = PROGRESSION[tier] ?? [];
  const rank = (id: string): number => {
    const i = order.indexOf(id);
    return i === -1 ? order.length : i;
  };
  pools.sort((a, z) => rank(a.b.id) - rank(z.b.id));

  const blocks = pools.map(({ b, pool, boss }) => {
    const uniq = [...new Set(pool)];

    // Pack followers are spawned BY an alpha and may never appear in the pool at all
    // (forest `young-wolf` is pool-invisible but is two thirds of every wolf pack).
    // Counting only pooled ids would overstate the biome, so followers of pooled
    // alphas are folded in with an effective weight of alphaWeight x count — the rate
    // at which their bodies actually appear next to the player.
    const weights = new Map<string, number>();
    for (const id of uniq) weights.set(id, pool.filter((x) => x === id).length);
    const unpooled = new Set<string>();
    for (const id of uniq) {
      const alpha = MONSTER_DATABASE.get(id);
      if (alpha?.pack?.role !== 'alpha') continue;
      const alphaWeight = weights.get(id) ?? 1;
      for (const f of alpha.pack.followers ?? []) {
        if (!MONSTER_DATABASE.has(f.typeId)) continue;
        if (!weights.has(f.typeId)) unpooled.add(f.typeId);
        weights.set(f.typeId, (weights.get(f.typeId) ?? 0) + alphaWeight * f.count);
      }
    }

    const rows = [...weights.entries()]
      .map(([id, w]) => {
        const r = buildRow(id, w, 'normal', anchor);
        if (r && unpooled.has(id)) r.unpooled = true;
        return r;
      })
      .filter((r): r is Row => !!r);

    return {
      id: b.id, name: b.name, density: b.mobDensity ?? 0, slots: pool.length, rows,
      bosses: boss.map((id) => buildRow(id, 1, 'boss', anchor)).filter((r): r is Row => !!r),
    };
  });
  return { blocks, anchor };
}

/** Pool-weighted mean of a per-monster value — respects authored spawn weights. */
function weightedMean(rows: Row[], pick: (r: Row) => number): number {
  const w = rows.reduce((s, r) => s + r.weight, 0);
  if (!w) return 0;
  return rows.reduce((s, r) => s + pick(r) * r.weight, 0) / w;
}

// ─── Markdown emitter ────────────────────────────────────────────────────────

function md(tier: number, blocks: BiomeBlock[], anchor: number): string {
  const light = Math.round(anchor * LIGHT_MULT);
  const heavy = Math.round(anchor * HEAVY_MULT);
  const L: string[] = [];
  L.push('# Tier ' + tier + ' monster table — vacuum view');
  L.push('');
  L.push('Generated by `pnpm tier:table --tier=' + tier + '`. No reference player is used anywhere.');
  L.push('Every number is a property of the authored monster/biome data, so the only valid');
  L.push('comparisons are monster-vs-monster within this tier, and biome-vs-biome.');
  L.push('');
  L.push('**eHP probes.** Mitigation is `max(1, round(max(0, hit - plating) x (1 - DR)))` — flat');
  L.push('subtract then multiplicative reduction, floored at 1. Effective HP therefore depends on');
  L.push('incoming hit size. Probes are anchored to this tier’s median normal-monster attack');
  L.push('(**' + anchor + '**) at ' + PROBE_MULTIPLES.map((m) => m + 'x').join(' / ') + ' = ' + PROBE_MULTIPLES.map((m) => Math.round(anchor * m)).join(' / ') + ' damage.');
  L.push('`eHP@' + light + '` is the chip-weapon reading, `eHP@' + heavy + '` the heavy-weapon reading, and **spread**');
  L.push('(`eHP@' + light + ' / eHP@' + heavy + '`) is the armour character: 1.0 = armour-neutral, >1.5 = punishes fast chip.');
  L.push('');
  L.push('> Because the probes are tier-anchored, eHP is comparable WITHIN this tier only.');
  L.push('> For cross-tier scale read raw HP, and for cross-tier armour character read spread.');
  L.push('');
  L.push('**DPS** is pre-mitigation authored output. `dot` is sustained DPS at capped stacks and');
  L.push('`dot ramp` is how many seconds of uninterrupted hits it takes to get there. Control is');
  L.push('never folded into DPS — it has its own column.');
  L.push('');

  L.push('## Biome summary');
  L.push('');
  L.push('| biome | density | N | uniq | w.mean eHP@' + light + ' | w.mean total DPS | sustained | cost/kill | pull load | w.mean essence | w.mean biomeXp |');
  L.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const b of blocks) {
    const h = weightedMean(b.rows, (r) => r.ehpLight);
    const d = weightedMean(b.rows, (r) => r.total);
    const n = CONCURRENCY[b.id] ?? DEFAULT_CONCURRENCY;
    const e = encounterLoad(h, d, n);
    L.push('| ' + b.name + ' | ' + b.density + ' | ' + n + ' | ' + b.rows.length + ' | '
      + Math.round(h) + ' | ' + round1(d) + ' | '
      + round1(e.sustained) + ' | ' + Math.round(e.costPerKill) + ' | ' + Math.round(e.pullLoad) + ' | '
      + round1(weightedMean(b.rows, (r) => r.essence)) + ' | '
      + Math.round(weightedMean(b.rows, (r) => r.biomeXp)) + ' |');
  }
  L.push('');
  L.push('`N` is DESIGNER-SET expected concurrent attackers (see `CONCURRENCY` in the tool), not');
  L.push('derived from density. `sustained` = `d(N+1)/2` is incoming DPS the player must out-sustain');
  L.push('— eHP and player DPS both cancel out of it. `cost/kill` = `d·h(N+1)/2` is punishment per');
  L.push('unit of progress. `pull load` = `d·h·N(N+1)/2` is the spike of one full pull, quadratic in N.');
  L.push('All three are valid only as biome-vs-biome ratios.');
  L.push('');
  L.push('### Progression curve (indexed to the first biome in the row order above)');
  L.push('');
  const idx = blocks.map((b) => {
    const h = weightedMean(b.rows, (r) => r.ehpLight);
    const d = weightedMean(b.rows, (r) => r.total);
    return { name: b.name, ...encounterLoad(h, d, CONCURRENCY[b.id] ?? DEFAULT_CONCURRENCY) };
  });
  const rel = (pick: (v: typeof idx[number]) => number): string =>
    idx.map((v) => (pick(v) / Math.max(1e-9, pick(idx[0]))).toFixed(2)).join(' → ');
  L.push('- sustained pressure: `' + rel((v) => v.sustained) + '`');
  L.push('- cost per kill:      `' + rel((v) => v.costPerKill) + '`');
  L.push('- pull load:          `' + rel((v) => v.pullLoad) + '`');
  L.push('');

  const targets = TARGETS[tier];
  if (targets) {
    L.push('### Target vs current');
    L.push('');
    L.push('Targets grow `x' + targets.sustainedPerStage + '`/stage on sustained danger and `x'
      + targets.ehpPerStage + '`/stage on eHP, indexed to ' + blocks[0].name + ' as the measured baseline.');
    L.push('Per-mob DPS is then forced: `DPS = sustained / ((N+1)/2)`.');
    L.push('');
    L.push('| biome | N | eHP now | eHP target | Δ | DPS now | DPS target | Δ | sustained now | target |');
    L.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
    const baseH = weightedMean(blocks[0].rows, (r) => r.ehpLight);
    const baseD = weightedMean(blocks[0].rows, (r) => r.total);
    const baseS = encounterLoad(baseH, baseD, CONCURRENCY[blocks[0].id] ?? DEFAULT_CONCURRENCY).sustained;
    blocks.forEach((b, i) => {
      const n = CONCURRENCY[b.id] ?? DEFAULT_CONCURRENCY;
      const hNow = weightedMean(b.rows, (r) => r.ehpLight);
      const dNow = weightedMean(b.rows, (r) => r.total);
      const sNow = encounterLoad(hNow, dNow, n).sustained;
      const hWant = baseH * Math.pow(targets.ehpPerStage, i);
      const sWant = baseS * Math.pow(targets.sustainedPerStage, i);
      const dWant = sWant / ((n + 1) / 2);
      const delta = (now: number, want: number): string => {
        const m = want / Math.max(1e-9, now);
        return (m >= 1 ? '**x' + round1(m) + '**' : 'x' + round1(m));
      };
      L.push('| ' + b.name + ' | ' + n + ' | ' + Math.round(hNow) + ' | ' + Math.round(hWant) + ' | ' + delta(hNow, hWant)
        + ' | ' + round1(dNow) + ' | ' + round1(dWant) + ' | ' + delta(dNow, dWant)
        + ' | ' + round1(sNow) + ' | ' + round1(sWant) + ' |');
    });
    L.push('');
  }

  // ── Modifier cross-table ────────────────────────────────────────────────────
  // Every combat node carries exactly one modifier, so the unmodified figures above
  // are a reference the player never actually meets. This section applies each
  // modifier to each biome and re-reads the three encounter axes, which is the only
  // way to see whether the progression survives contact with the modifier spread.
  L.push('## With node modifiers applied');
  L.push('');
  L.push('Every combat node carries one of the five modifiers, so the biome rows above are a');
  L.push('baseline the player never plays. Values are indexed to **unmodified ' + blocks[0].name + '**.');
  L.push('`—` marks a modifier banned in that biome.');
  L.push('');

  const baseH0 = weightedMean(blocks[0].rows, (r) => r.ehpLight);
  const baseD0 = weightedMean(blocks[0].rows, (r) => r.total);
  const baseN0 = CONCURRENCY[blocks[0].id] ?? DEFAULT_CONCURRENCY;
  const ref = encounterLoad(baseH0, baseD0, baseN0);

  /** Re-read a biome's three axes under one modifier. */
  function underModifier(b: BiomeBlock, modifier: NodeModifierFamily | null) {
    const tierOf = tier;
    const n = (CONCURRENCY[b.id] ?? DEFAULT_CONCURRENCY) *
      (modifier ? modifierSpawnFactor(modifier) : 1);
    const defs = b.rows
      .map((r) => ({ def: MONSTER_DATABASE.get(r.id)!, w: r.weight, row: r }))
      .filter((x) => x.def);
    const totalW = defs.reduce((s, x) => s + x.w, 0) || 1;
    const d = defs.reduce((s, x) => {
      const direct = modifier ? modifiedDps(x.def, modifier, tierOf) : x.row.direct;
      // DoT rides the same attackMult as direct damage.
      const dot = modifier && x.def.dotEffect
        ? dotDpsFrom(
            modifiedDotDamagePerStack(x.def.dotEffect.damagePerStack, modifier, tierOf),
            x.def.dotEffect.maxStacks,
            x.def.dotEffect.tickIntervalMs,
          )
        : x.row.dot;
      return s + (direct + dot) * x.w;
    }, 0) / totalW;
    const h = defs.reduce(
      (s, x) => s + effectiveHp(x.def, anchor * LIGHT_MULT, modifier ?? undefined, tierOf) * x.w,
      0,
    ) / totalW;
    return encounterLoad(h, d, n);
  }

  for (const axis of [
    { key: 'sustained' as const, label: 'Sustained pressure' },
    { key: 'costPerKill' as const, label: 'Cost per kill' },
  ]) {
    L.push('### ' + axis.label);
    L.push('');
    L.push('| biome | unmodified | ' + NODE_MODIFIER_FAMILIES.join(' | ') + ' | spread |');
    L.push('|---|---:|' + NODE_MODIFIER_FAMILIES.map(() => '---:').join('|') + '|---:|');
    for (const b of blocks) {
      const cells: string[] = [];
      const vals: number[] = [];
      for (const family of NODE_MODIFIER_FAMILIES) {
        if ((MODIFIER_BANS[b.id] ?? []).includes(family)) { cells.push('—'); continue; }
        const v = underModifier(b, family)[axis.key] / ref[axis.key];
        vals.push(v);
        cells.push(v.toFixed(2));
      }
      const plain = underModifier(b, null)[axis.key] / ref[axis.key];
      const spread = vals.length ? Math.max(...vals) / Math.min(...vals) : 1;
      L.push('| ' + b.name + ' | ' + plain.toFixed(2) + ' | ' + cells.join(' | ')
        + ' | x' + spread.toFixed(2) + ' |');
    }
    L.push('');
  }

  // Does within-biome modifier variance swamp the between-biome progression step?
  L.push('### Does the railroad survive?');
  L.push('');
  L.push('A step is *clean* when the easiest node of the later biome is still harder than the');
  L.push('hardest node of the earlier one — i.e. modifier variance stays inside the progression');
  L.push('step. Where it overlaps, a well-rolled earlier node out-pressures a badly-rolled later');
  L.push('one, and the biome order stops being the thing the player reads.');
  L.push('');
  L.push('| step | axis | hardest earlier | easiest later | ordering |');
  L.push('|---|---|---:|---:|---|');
  for (let i = 0; i + 1 < blocks.length; i += 1) {
    for (const axis of [
      { key: 'sustained' as const, label: 'sustained' },
      { key: 'costPerKill' as const, label: 'cost/kill' },
    ]) {
      const range = (b: BiomeBlock): number[] =>
        NODE_MODIFIER_FAMILIES
          .filter((f) => !(MODIFIER_BANS[b.id] ?? []).includes(f))
          .map((f) => underModifier(b, f)[axis.key] / ref[axis.key]);
      const worstEarlier = Math.max(...range(blocks[i]));
      const bestLater = Math.min(...range(blocks[i + 1]));
      L.push('| ' + blocks[i].name + ' → ' + blocks[i + 1].name + ' | ' + axis.label + ' | '
        + worstEarlier.toFixed(2) + ' | ' + bestLater.toFixed(2) + ' | '
        + (bestLater >= worstEarlier ? 'clean' : '**overlaps**') + ' |');
    }
  }
  L.push('');

  for (const b of blocks) {
    L.push('## ' + b.name + '  (density ' + b.density + ', ' + b.slots + ' pool slots)');
    L.push('');
    L.push('| monster | w | HP | atk | cd | direct | dot | dot ramp | total | spike | ramp | pl | DR | ev | eHP@' + light + ' | eHP@' + heavy + ' | spread | spd | rng | control | ecology | partial |');
    L.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|');
    for (const r of [...b.rows, ...b.bosses]) {
      const label = (r.kind === 'boss' ? 'BOSS ' : r.unpooled ? 'follower ' : '') + r.name + ' `' + r.id + '`';
      L.push('| ' + label + ' | ' + (r.kind === 'boss' ? '—' : 'x' + r.weight) + ' | ' + r.hp + ' | ' + r.attack + ' | '
        + r.cd + ' | ' + round1(r.direct) + ' | ' + (r.dot ? round1(r.dot) : '—') + ' | ' + (r.dot ? round1(r.dotRamp) + 's' : '—') + ' | ' + round1(r.total) + ' | '
        + (r.spikeMult > 1 ? 'x' + r.spikeMult + ' = ' + Math.round(r.spikeDmg) + ' (' + r.spikeSrc + ')' : '—') + ' | '
        + (r.ramp > 1 ? 'x' + round1(r.ramp) : '—') + ' | '
        + r.plating + ' | ' + (r.dr ? Math.round(r.dr * 100) + '%' : '—') + ' | ' + (r.ev ? Math.round(r.ev * 100) + '%' : '—') + ' | '
        + Math.round(r.ehpLight) + ' | ' + Math.round(r.ehpHeavy) + ' | ' + round1(r.armourSpread) + ' | '
        + r.speed + ' | ' + (r.ranged ? '**' + r.range + '**' : String(r.range)) + ' | '
        + (r.control.join(', ') || '—') + ' | ' + (r.ecology.join(', ') || '—') + ' | ' + (r.partial.join(', ') || '—') + ' |');
    }
    L.push('');
  }

  // Mechanic-coverage audit: the "make them unique" half of the pass.
  L.push('## Mechanic coverage');
  L.push('');
  L.push('Monsters carrying no mechanic at all — pure stat blocks with nothing to read or counter:');
  L.push('');
  const bare = blocks.flatMap((b) => b.rows
    .filter((r) => !r.control.length && !r.ecology.length && !r.dot && !r.ev && !r.partial.length && r.spikeMult === 1 && r.ramp === 1)
    .map((r) => ({ b, r })));
  if (!bare.length) L.push('- none');
  for (const { b, r } of bare) L.push('- ' + r.name + ' (`' + r.id + '`, ' + b.name + ')');
  L.push('');
  return L.join('\n');
}

async function main(): Promise<void> {
  const { blocks, anchor } = collect(TIER);
  if (!blocks.length) {
    console.error('No biomes have a tier-' + TIER + ' pool.');
    process.exit(1);
  }
  const doc = md(TIER, blocks, anchor);
  const outDir = path.join(REPO_ROOT, 'reports');
  await mkdir(outDir, { recursive: true });
  const mdPath = path.join(outDir, 'tier-' + TIER + '-table.md');
  await writeFile(mdPath, doc, 'utf8');
  console.log(doc);
  console.error('\nwrote ' + path.relative(REPO_ROOT, mdPath));
}

void main();
