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
 * All four tiers are locked with the user (T1 2026-08-17, T2-T4 2026-08-23). Each tier
 * keeps five biomes from the previous one and swaps two in at the TOP of the ladder:
 * T2 adds Jungle + Desert above Caverns, T3 drops Plains/Forest and adds Tundra +
 * Volcanic, T4 drops Swamp/Caverns and adds Wasteland + Trench. Returning biomes keep
 * their relative order throughout, so the railroad a player learned in T1 still reads
 * the same way in T4.
 */
const PROGRESSION: Record<number, string[]> = {
  1: ['plains', 'forest', 'swamp', 'mountain', 'cave'],
  2: ['plains', 'forest', 'swamp', 'mountain', 'cave', 'jungle', 'desert'],
  3: ['swamp', 'mountain', 'cave', 'jungle', 'desert', 'tundra', 'volcanic'],
  4: ['mountain', 'jungle', 'desert', 'tundra', 'volcanic', 'graveyard', 'trench'],
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
 *
 * T2-T4, locked with the user 2026-08-23. These tiers are SEVEN biomes = six steps,
 * not four, so the two axes were reconsidered separately rather than copied:
 *   sustained danger x1.20/stage — HELD at the T1 value on purpose. "The next biome
 *     is ~20% more dangerous" is the rule the player is meant to internalise once and
 *     carry through the whole game; rescaling it per tier would make the same step
 *     mean different things at different tiers. Six steps span x2.99 end to end.
 *   effective HP    x1.26/stage — SOFTENED from x1.41. Compounded over six steps
 *     x1.41 lands the tier ceiling at x7.9 the anchor's durability, and the T1 pass's
 *     central finding is that eHP cancels out of danger entirely: a curve led by
 *     durability reads as tedium, not threat. x1.26 reproduces T1's ~x4 end-to-end
 *     chunk over the longer ladder, so late-tier monsters stay elite-feeling without
 *     late-tier kills becoming a slog.
 *   => cost per kill compounds at ~1.51/stage (x11.9 across the tier).
 */
interface TierTargets { sustainedPerStage: number; ehpPerStage: number }
const TARGETS: Record<number, TierTargets> = {
  1: { sustainedPerStage: 1.20, ehpPerStage: 1.41 },
  2: { sustainedPerStage: 1.20, ehpPerStage: 1.26 },
  // T3/T4 widen the DANGER step, locked with the user 2026-08-23. Node modifiers get
  // stronger with depth (MODIFIER_MAGNITUDE_BY_TIER 0.05 / 0.10 / 0.15 / 0.20) while a
  // fixed x1.20 ladder step does not, so from T3 the within-biome modifier spread
  // catches and then passes the between-biome step:
  //
  //     measured spread   T1 x1.06-1.12   T2 x1.12-1.15   T3 x1.18-1.25   T4 x1.25-1.29
  //
  // At T4 that makes EVERY railroad step overlap no matter how well the roster is tuned
  // — a well-rolled earlier node simply out-pressures a badly-rolled later one, and the
  // biome order stops being the thing the player reads. The step is widened just past
  // each tier's measured spread so the ladder outruns it.
  //
  // The eHP step deliberately does NOT widen: it is a separate axis answering tedium,
  // not ordering, and cost/kill (= sustained x eHP) already compounds from both.
  3: { sustainedPerStage: 1.27, ehpPerStage: 1.26 },
  4: { sustainedPerStage: 1.32, ehpPerStage: 1.26 },
};

/**
 * Biomes EXEMPT from the sustained-pressure target, locked with the user 2026-08-23.
 *
 * The encounter model was derived for a PULL: `sustained = d(N+1)/2` describes the mean
 * number of live attackers as a group burns down. At N=1 that term collapses to 1 and
 * the metric stops describing the encounter — a solo mini-boss is dangerous through its
 * per-hit spike and the length of the exchange, not through attrition from a crowd.
 *
 * The Deep-Sea Trench is authored as exactly that ("every enemy is a mini-boss", density
 * 10, N=1) and reads as the SOFTEST biome in T4 on sustained while carrying by far the
 * highest eHP and cost/kill. Rather than force a metric that does not describe it, Trench
 * is scored on cost-per-kill and spike, and its sustained row is reported for information
 * only. The alternative — hitting the sustained target at N=1 — would require roughly
 * doubling per-mob DPS against a 3-concurrency biome, on top of an eHP that is already
 * the tier's largest.
 */
const SUSTAINED_EXEMPT = new Set(['trench']);
/**
 * How each tier's ladder is positioned, locked with the user 2026-08-23.
 *
 * The two axes are anchored DIFFERENTLY, because only one of them is comparable
 * across tiers.
 *
 * SUSTAINED DANGER is pure authored DPS and concurrency, so it means the same thing
 * in every tier and the ladder can be chained straight through the tier boundaries:
 *
 *     tier N floor = tier (N-1) floor x TARGETS[N].sustainedPerStage ^ TIER_BOUNDARY_RUNGS
 *
 * This replaced a per-tier geometric-mean fit, which turned out not to work at all.
 * Re-anchoring each tier AND preserving each tier's own scale places every tier in the
 * same absolute band — measured GM sustained is T1 33.2 / T2 35.9 / T3 44.3 / T4 92.0,
 * and a per-tier fit collapses all of them onto ~40. There is then no tier boundary:
 * the x1.20 ladder simply restarts in place. It produced a T2 Stampede Bull at attack
 * 13 against T1's Boar at 18 — a tier-2 monster hitting softer than a tier-1 one.
 *
 * EFFECTIVE HP cannot be chained. Its probes are anchored to each tier's own median
 * monster attack (see PROBE_MULTIPLES), so eHP numbers are comparable WITHIN a tier
 * only and a cross-tier eHP ratio is meaningless. It therefore keeps the per-tier
 * geometric-mean fit, which moves the tier's durability SHAPE without claiming to know
 * its cross-tier scale.
 *
 * COST PER KILL is not fitted at all. It is exactly `sustained x eHP`
 * (`d·h·(N+1)/2 = (d·(N+1)/2)·h`), so it falls out of the two axes above and stays a
 * derived quantity, never a target in its own right.
 */

/**
 * TIER BOUNDARY — how far the ladder's floor lifts when a tier ends, expressed in
 * RUNGS OF THE TIER BEING ENTERED. Locked with the user 2026-08-23.
 *
 *     tier N floor = tier (N-1) floor x TARGETS[N].sustainedPerStage ^ TIER_BOUNDARY_RUNGS
 *
 * TWO rungs, and the reason is arithmetic rather than taste. Every tier keeps five
 * biomes and swaps two: T2 adds Jungle + Desert above Caverns, T3 drops Plains/Forest
 * and adds Tundra + Volcanic, T4 drops Swamp/Caverns and adds Wasteland + Trench. The
 * two that leave always leave from the BOTTOM, so every returning biome slides down
 * exactly two rungs at each boundary. A one-rung boundary step therefore leaves it a
 * net rung LOWER than it was: at x1.20 the whole returning cast softened by x0.83 per
 * tier, which would have made T4 Jungle weaker than the T3 Jungle above it and handed
 * players softer content with better rewards for advancing.
 *
 * At two rungs nothing ever gets easier. A biome's difficulty becomes a property of
 * that biome, and a tier extends the ladder upward through its new arrivals instead of
 * sliding the veterans down.
 */
const TIER_BOUNDARY_RUNGS = 2;

/**
 * How the SUSTAINED anchor is chosen per tier.
 *
 * `first` — hold the first biome exactly where it is. Sound only where the first biome
 *   is genuinely the tier floor. T1 qualifies: Plains is the softest thing in the tier
 *   on both axes and was deliberately left untouched by the 2026-08-17 pass as the
 *   measured baseline, so T1's already-playtested biomes do not move.
 *
 * `chain` — take T1's measured floor and lift it TIER_BOUNDARY_RUNGS rungs at every
 *   tier boundary below this one, priced in the rungs of the tier being entered.
 *   Two rungs, because each tier drops exactly two biomes off the BOTTOM of the
 *   ladder, so a returning biome slides down two rungs at every boundary and a
 *   one-rung lift would leave it net easier than it was a tier ago.
 */
type AnchorMode = 'first' | 'chain';
const ANCHOR_MODE: Record<number, AnchorMode> = { 1: 'first', 2: 'chain', 3: 'chain', 4: 'chain' };
const DEFAULT_ANCHOR_MODE: AnchorMode = 'chain';

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

/**
 * Sustained direct DPS under a node modifier (attack and cadence both reshape).
 *
 * Reshapes the monster and re-runs the SAME rotation model as `directDps` rather than
 * recomputing a bare attack/cooldown quotient. The old shortcut dropped every per-beat
 * rider — consecutive hits, volleys, cadence finishers, the charged-attack cycle — so a
 * modified node reported a different offence *shape* than the unmodified one, and the
 * modifier cross-table quietly disagreed with the biome summary above it.
 *
 * Charged and empowered cooldowns are deliberately NOT shortened by the cadence scalar:
 * `attackCooldownMult` is the basic-attack cadence, and the server reshapes only that.
 */
function modifiedDps(
  m: MonsterDefinition,
  modifier: NodeModifierFamily,
  biomeTier: number,
): number {
  const s = modifierStatScalars(modifier, biomeTier);
  const reshaped = {
    ...m,
    stats: {
      ...m.stats,
      attack: Math.max(1, Math.round(m.stats.attack * s.attackMult)),
      attackCooldown: Math.max(1, Math.round(m.stats.attackCooldown * s.attackCooldownMult)),
    },
  } as MonsterDefinition;
  return directDps(reshaped);
}
/**
 * Mean damage MULTIPLE delivered by one ordinary attack beat, relative to a single
 * unmodified hit. Folds every deterministic per-beat rider the monster carries.
 *
 * Four things land on a beat and every one of them was previously invisible or
 * half-counted:
 *
 *   consecutiveHits  — one attack opportunity resolves this many full pipeline hits
 *                      (the loop in combat.ts). Leaving it out understated the Gnarled
 *                      Greatbear by exactly 2x.
 *   cadenceVolley    — every Nth beat delivers `hits` pipeline hits INSTEAD OF ONE
 *                      (note: instead of one, not instead of `consecutiveHits` — the
 *                      volley replaces the beat's normal shape entirely).
 *   cadenceFinisher  — every Nth beat is multiplied by `multiplier`.
 *   openingStrike / openingVolley are deliberately NOT here: they fire once per combat
 *                      session, so they are burst, not sustained. See `openingBurst`.
 *
 * Volley and finisher are composable on one monster (the type comments say so), and
 * their cycles are independent counters, so they compose as a product of means. That is
 * an approximation only when the two periods share a factor and the beats align; no
 * authored monster currently carries both, so it costs nothing today.
 */
function beatMultiple(m: MonsterDefinition): number {
  const base = Math.max(1, Math.round(m.consecutiveHits ?? 1));
  let mult = base;
  const v = m.cadenceVolley;
  if (v) {
    const n = Math.max(1, Math.round(v.everyNAttacks));
    mult = (base * (n - 1) + Math.max(1, v.hits)) / n;
  }
  const f = m.cadenceFinisher;
  if (f) {
    const n = Math.max(1, Math.round(f.everyNAttacks));
    mult *= ((n - 1) + f.multiplier) / n;
  }
  return mult;
}

/**
 * Sustained direct DPS, pre-mitigation. Pure authored offence, averaged over the
 * monster's full ability rotation.
 *
 * A charged attack is NOT free damage bolted onto the auto-attack stream: during
 * `castMs` the monster neither moves nor auto-attacks, so a cast cycle trades normal
 * beats for one multiplied hit. Modelling the cycle honestly is what finally makes the
 * pure-CONTROL charged attacks legible — Petrifying Gaze, Wither and Frostbind all sit
 * at `multiplier: 1.0`, so they read here as a small sustained-damage LOSS, which is
 * exactly right: those monsters pay damage to buy control. Scoring them as a "x1 spike"
 * (the old behaviour) recorded them as carrying no mechanic at all, which is how Desert
 * and Tundra's entire control identity went missing from the tier table.
 *
 * `empoweredCooldown` is a timer finisher with no cast, so it simply adds its surplus
 * over a normal beat, amortised across its cooldown.
 */
function directDps(m: MonsterDefinition): number {
  const { attack, attackCooldown } = m.stats;
  const cd = Math.max(1, attackCooldown);
  const beat = beatMultiple(m);
  const plain = (attack * beat * 1000) / cd;

  const charged = (m as unknown as {
    chargedAttack?: { castMs: number; cooldownMs: number; multiplier: number };
  }).chargedAttack;

  let dps = plain;
  if (charged) {
    const cycle = Math.max(1, charged.cooldownMs);
    // Beats actually taken in a cycle: the wind-up is dead time for normal attacks.
    const beats = Math.max(0, (cycle - charged.castMs) / cd);
    const perCycle = attack * beat * beats + attack * charged.multiplier;
    dps = (perCycle * 1000) / cycle;
  }

  if (m.empoweredCooldown) {
    const cycle = Math.max(1, m.empoweredCooldown.cooldownMs);
    // One beat per cycle is upgraded, so only the surplus over a normal beat is new.
    dps += (attack * Math.max(0, m.empoweredCooldown.multiplier - 1) * 1000) / cycle;
  }
  return dps;
}

/**
 * One-time damage the monster front-loads on a fresh aggro, as a MULTIPLE of one
 * ordinary hit. Reported next to the spike column and never folded into sustained DPS,
 * because it does not repeat inside a fight.
 */
function openingBurst(m: MonsterDefinition): number {
  const strike = m.openingStrike?.multiplier ?? 0;
  const volley = m.openingVolley ? Math.max(1, m.openingVolley.hits) : 0;
  return Math.max(strike, volley);
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

/**
 * Control the monster imposes on the player. Never folded into DPS.
 *
 * The charged-attack riders matter as much as the standalone effects: the whole point
 * of the rework's control abilities is that they are TELEGRAPHED, so they live on
 * `chargedAttack` rather than on every landed hit. Reading only the top-level fields
 * (the old behaviour) made the Basilisk's Petrifying Gaze, the Bog Witch's Wither, the
 * Rime Caster's Frostbind and the Mire Hexer's Plague Hex all report as no control at
 * all — which is most of what Desert, Tundra and evolved Swamp exist to do.
 */
function controlTags(m: MonsterDefinition): string[] {
  const t: string[] = [];
  if (m.slowEffect) t.push(m.slowEffect.speedMult === 0 ? 'root' : 'slow ' + Math.round((1 - m.slowEffect.speedMult) * 100) + '%');
  if (m.rampDebuff) t.push('ramp-slow ' + Math.round(m.rampDebuff.moveSlowMaxPct * 100) + '/' + Math.round(m.rampDebuff.atkSlowMaxPct * 100) + '%');
  if (m.appliesVulnerability) t.push('vuln ' + Math.round(m.appliesVulnerability.damageTakenPct * 100) + '% x' + m.appliesVulnerability.maxStacks);
  if (m.appliesAntiheal) t.push('antiheal ' + Math.round(m.appliesAntiheal.reductionPerStack * 100) + '% x' + m.appliesAntiheal.maxStacks);
  if (m.appliesMark) t.push('mark');
  if (m.engageSequence) t.push('lockout ' + m.engageSequence.lockoutMs + 'ms');
  if (m.appliesPlatingShred) {
    const s = m.appliesPlatingShred;
    t.push('shred ' + s.platingPerStack + ' x' + s.maxStacks);
  }
  if (m.cadenceFinisher?.rootMs) t.push('cadence-root ' + m.cadenceFinisher.rootMs + 'ms');

  const c = (m as unknown as {
    chargedAttack?: {
      name: string; rootMs?: number; stunMs?: number; precastStunMs?: number;
      appliesAntiheal?: { reduction: number; durationMs: number };
      refreshesPlayerDots?: { extendMs: number };
      requiresAmbientStacks?: number;
    };
  }).chargedAttack;
  if (c) {
    const riders: string[] = [];
    if (c.rootMs) riders.push('root ' + c.rootMs + 'ms');
    if (c.stunMs) riders.push('stun ' + c.stunMs + 'ms');
    if (c.precastStunMs) riders.push('precast-stun ' + c.precastStunMs + 'ms');
    if (c.appliesAntiheal) riders.push('antiheal ' + Math.round(c.appliesAntiheal.reduction * 100) + '%');
    if (c.refreshesPlayerDots) riders.push('dot-extend ' + c.refreshesPlayerDots.extendMs + 'ms');
    if (riders.length) {
      const gate = c.requiresAmbientStacks ? ' @' + c.requiresAmbientStacks + ' ambient' : '';
      t.push(c.name + ': ' + riders.join('+') + gate);
    }
  }
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
  if (m.empowersAllies) {
    const e = m.empowersAllies;
    t.push('hastes-allies +' + Math.round(e.attackSpeedPct * 100) + '% r' + e.radius);
  }
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
  // A one-shot defensive state: real eHP for the fight, but only once per life and
  // only against direct damage, so it cannot honestly be folded into the eHP curve.
  if (m.shellUp) t.push('shell-up');
  return t;
}

interface Row {
  id: string; name: string; biome: string; weight: number; kind: 'normal' | 'boss';
  hp: number; attack: number; cd: number; plating: number; dr: number; ev: number;
  speed: number; range: number; pull: number; ranged: boolean;
  direct: number; dot: number; dotRamp: number; total: number;
  spikeMult: number; spikeSrc: string; spikeDmg: number; ramp: number; opener: number;
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
  const direct = directDps(m);
  return {
    id, name: m.name, biome: m.biome, weight, kind,
    hp: s.hp, attack: s.attack, cd: s.attackCooldown, plating: s.plating,
    dr: s.damageReduction, ev: evasionOf(m), speed: s.speed, range: s.attackRange,
    pull: s.pullRange, ranged: s.attackRange > 60,
    direct, dot: d.dps, dotRamp: d.rampSec, total: direct + d.dps,
    spikeMult: sp.mult, spikeSrc: sp.source, spikeDmg: s.attack * sp.mult, ramp: rampCeiling(m),
    opener: openingBurst(m),
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

/**
 * Biome-level multiplier from `empowersAllies` — a support monster that hastens the
 * things standing next to it.
 *
 * This is the one offence term that is NOT a property of a single monster, which is
 * why it was missing entirely: the Carrion Vulture deals no meaningful damage itself
 * and so read as a harmless filler mob, while its actual job is to make the rest of
 * Wasteland attack 25% faster. A per-monster DPS column can never see that.
 *
 * Three factors, all from authored data:
 *   uptime    = durationMs / intervalMs, capped at 1 (a refresh cannot exceed 100%).
 *   presence  = 1 - (1 - share)^N, the chance at least one empowerer is in a pull of N
 *               drawn from the weighted pool. Non-stacking by refresh, so a second one
 *               adds nothing and only presence matters.
 *   affected  = (N - 1) / N, since the buff lands on ALLIES, not on the caster.
 *
 * Deliberately approximate: it assumes pulls are drawn i.i.d. from the spawn pool and
 * that everything in radius is in the pull. It is a correction on the order of a few
 * percent, applied so the term is visible and arguable rather than silently zero.
 */
function allyHasteMult(rows: Row[], n: number): number {
  if (n < 2) return 1;
  const totalW = rows.reduce((s, r) => s + r.weight, 0);
  if (!totalW) return 1;
  let mult = 1;
  for (const r of rows) {
    const e = MONSTER_DATABASE.get(r.id)?.empowersAllies;
    if (!e) continue;
    const uptime = Math.min(1, e.durationMs / Math.max(1, e.intervalMs));
    const presence = 1 - Math.pow(1 - r.weight / totalW, n);
    mult *= 1 + e.attackSpeedPct * uptime * presence * ((n - 1) / n);
  }
  return mult;
}

/**
 * The three numbers every biome-level table needs, computed once so the summary, the
 * progression curve, the target table and the modifier cross-table cannot drift apart.
 */
function biomeOffence(b: BiomeBlock): { h: number; d: number; n: number; haste: number } {
  const n = CONCURRENCY[b.id] ?? DEFAULT_CONCURRENCY;
  const haste = allyHasteMult(b.rows, n);
  return { h: weightedMean(b.rows, (r) => r.ehpLight), d: weightedMean(b.rows, (r) => r.total) * haste, n, haste };
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
  L.push('| biome | density | N | uniq | w.mean eHP@' + light + ' | w.mean total DPS | ally haste | sustained | cost/kill | pull load | w.mean essence | w.mean biomeXp |');
  L.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const b of blocks) {
    const { h, d, n, haste } = biomeOffence(b);
    const e = encounterLoad(h, d, n);
    L.push('| ' + b.name + ' | ' + b.density + ' | ' + n + ' | ' + b.rows.length + ' | '
      + Math.round(h) + ' | ' + round1(d) + ' | ' + (haste > 1 ? 'x' + haste.toFixed(3) : '—') + ' | '
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
  L.push('`ally haste` is the biome-wide `empowersAllies` correction already folded into the DPS');
  L.push('column — a support monster that hastens its neighbours contributes offence no per-monster');
  L.push('column can show.');
  L.push('');
  L.push('### Progression curve (indexed to the first biome in the row order above)');
  L.push('');
  const idx = blocks.map((b) => {
    const { h, d, n } = biomeOffence(b);
    return { name: b.name, ...encounterLoad(h, d, n) };
  });
  const rel = (pick: (v: typeof idx[number]) => number): string =>
    idx.map((v) => (pick(v) / Math.max(1e-9, pick(idx[0]))).toFixed(2)).join(' → ');
  L.push('- sustained pressure: `' + rel((v) => v.sustained) + '`');
  L.push('- cost per kill:      `' + rel((v) => v.costPerKill) + '`');
  L.push('- pull load:          `' + rel((v) => v.pullLoad) + '`');
  L.push('');
  const targets = TARGETS[tier];
  if (targets) {
    const mode = ANCHOR_MODE[tier] ?? DEFAULT_ANCHOR_MODE;
    L.push('### Target vs current');
    L.push('');
    L.push('Targets grow `x' + targets.sustainedPerStage + '`/stage on sustained danger and `x'
      + targets.ehpPerStage + '`/stage on eHP, positioned by the **`' + mode + '`** anchor rule.');
    L.push('Per-mob DPS is then forced: `DPS = sustained / ((N+1)/2)`.');
    L.push('');
    if (mode === 'first') {
      L.push('> **`first`** holds ' + blocks[0].name + ' exactly where it is and builds the ladder upward');
      L.push('> from it. That is only sound where the first biome is genuinely the tier floor, which');
      L.push('> is true here and was locked as the measured baseline — so every biome already sitting');
      L.push('> on the ladder keeps the numbers it was tuned and playtested with.');
    } else {
      L.push('> **`chain`** sets this tier\'s sustained floor by taking T1\'s measured floor and');
      L.push('> lifting it ' + TIER_BOUNDARY_RUNGS + ' rungs at every tier boundary below this one. Two rungs because each');
      L.push('> tier drops exactly two biomes off the BOTTOM of the ladder, so every returning biome');
      L.push('> slides down two rungs at each boundary; a one-rung lift left the whole returning cast');
      L.push('> x0.83 softer per tier, which would have put T4 Jungle below the T3 Jungle above it.');
      L.push('>');
      L.push('> A per-tier geometric-mean fit was tried before this and does not work at all:');
      L.push('> re-anchoring every tier places all four in the same absolute band (measured GM');
      L.push('> sustained T1 33 / T2 36 / T3 44 / T4 92 all collapse onto ~40), so the ladder just');
      L.push('> restarts in place and a T2 Stampede Bull lands at attack 13 against T1\'s Boar at 18.');
      L.push('>');
      L.push('> **eHP is NOT chained** — its probes are anchored to each tier\'s own median attack, so');
      L.push('> cross-tier eHP ratios are meaningless. It keeps the geometric-mean fit, reshaping the');
      L.push('> tier\'s durability curve while claiming nothing about its scale relative to other');
      L.push('> tiers. **cost/kill is neither** — it is exactly `sustained x eHP`, so it is derived.');
    }
    L.push('');
    L.push('| biome | N | eHP now | eHP target | Δ | DPS now | DPS target | Δ | sustained now | target | cost/kill now | target |');
    L.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');

    const measured = blocks.map((b) => {
      const o = biomeOffence(b);
      return { b, o, load: encounterLoad(o.h, o.d, o.n) };
    });
    const gmean = (v: number[]): number =>
      Math.exp(v.reduce((s, x) => s + Math.log(Math.max(1e-9, x)), 0) / Math.max(1, v.length));

    /**
     * Fit anchor `A` in `v_i = A · step^i` so the ladder's geometric mean matches the
     * measured geometric mean: `gm(A·step^i) = A·step^mean(i)`, so
     * `A = gm(measured) / step^mean(i)`. Moves the SHAPE, not the overall scale.
     *
     * `indices` are the ladder positions of the rows constraining the fit; exempt biomes
     * are dropped from the values but their rungs stay spaced (see SUSTAINED_EXEMPT).
     */
    const gmAnchor = (values: number[], indices: number[], step: number): number => {
      if (!values.length) return 1;
      const meanIdx = indices.reduce((s, i) => s + i, 0) / indices.length;
      return gmean(values) / Math.pow(step, meanIdx);
    };

    const sFitIdx = measured.map((m, i) => i).filter((i) => !SUSTAINED_EXEMPT.has(measured[i].b.id));

    /**
     * SUSTAINED anchor. `first` reads the measured floor straight off row 0 (T1 only,
     * where row 0 really is the floor). `chain` walks T1's measured floor up through
     * every tier boundary below this one, lifting it TIER_BOUNDARY_RUNGS rungs of the
     * tier being entered each time. T1's floor is recomputed live from T1's own table
     * rather than hard-coded, so it follows if T1 Plains is ever re-tuned.
     */
    let sAnchor: number;
    if (mode === 'first') {
      sAnchor = measured[0].load.sustained;
    } else {
      const t1Blocks = collect(1).blocks;
      let floor = measured[0].load.sustained;
      if (t1Blocks.length) {
        const o = biomeOffence(t1Blocks[0]);
        floor = encounterLoad(o.h, o.d, o.n).sustained;
      }
      // Each boundary is priced in the rungs of the tier being ENTERED, because that
      // tier's own step is what the two departing biomes are worth inside it.
      for (let t = 2; t <= tier; t += 1) {
        const step = TARGETS[t]?.sustainedPerStage ?? targets.sustainedPerStage;
        floor *= Math.pow(step, TIER_BOUNDARY_RUNGS);
      }
      sAnchor = floor;
    }

    // eHP probes are anchored to each tier's OWN median attack, so eHP is comparable
    // within a tier only and cannot be chained across tiers. It keeps the geometric-mean
    // fit: reshape the tier's durability curve, claim nothing about its cross-tier scale.
    // eHP probes are anchored to each tier's OWN median attack, so eHP is comparable
    // within a tier only and cannot be chained across tiers. It keeps the geometric-mean
    // fit: reshape the tier's durability curve, claim nothing about its cross-tier scale.
    //
    // Sustained-exempt biomes are dropped from THIS fit too. A biome scored on cost/kill
    // alone is free to choose its own damage/durability split, so its eHP is not a ladder
    // reading — and leaving the Trench's 7 790 in the geometric mean dragged every other
    // T4 biome's durability target up behind an outlier that is deliberately off-ladder.
    const hAnchor = mode === 'first'
      ? measured[0].o.h
      : gmAnchor(sFitIdx.map((i) => measured[i].o.h), sFitIdx, targets.ehpPerStage);

    const exempt: string[] = [];
    measured.forEach(({ b, o, load }, i) => {
      const { h: hNow, d: dNow, n } = o;
      const hWant = hAnchor * Math.pow(targets.ehpPerStage, i);
      const sWant = sAnchor * Math.pow(targets.sustainedPerStage, i);
      const dWant = sWant / ((n + 1) / 2);
      // Cost per kill is EXACTLY sustained x eHP — `d·h·(N+1)/2 = (d·(N+1)/2)·h` — so it
      // is derived from the two axes above and never fitted or targeted on its own.
      const cWant = sWant * hWant;
      const delta = (now: number, want: number): string => {
        const m = want / Math.max(1e-9, now);
        return (m >= 1 ? '**x' + round1(m) + '**' : 'x' + round1(m));
      };
      const off = SUSTAINED_EXEMPT.has(b.id);
      if (off) exempt.push(b.name);
      const dash = (s: string): string => (off ? '_' + s + '_' : s);
      L.push('| ' + b.name + (off ? ' †' : '') + ' | ' + n + ' | ' + Math.round(hNow) + ' | ' + Math.round(hWant) + ' | ' + delta(hNow, hWant)
        + ' | ' + round1(dNow) + ' | ' + dash(round1(dWant).toString()) + ' | ' + dash(delta(dNow, dWant))
        + ' | ' + round1(load.sustained) + ' | ' + dash(round1(sWant).toString())
        + ' | ' + Math.round(load.costPerKill) + ' | ' + Math.round(cWant) + ' |');
    });
    L.push('');
    if (exempt.length) {
      L.push('† **' + exempt.join(', ') + ' is exempt from the sustained target** (see `SUSTAINED_EXEMPT`).');
      L.push('At `N=1` the `(N+1)/2` term collapses and the metric stops describing the encounter:');
      L.push('a solo mini-boss threatens through per-hit spike and the length of the exchange, not');
      L.push('through attrition from a crowd. Its sustained and DPS targets are shown _italicised_');
      L.push('for information only; **cost/kill is the axis it is actually held to.**');
      L.push('');
    }
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

  const base0 = biomeOffence(blocks[0]);
  const ref = encounterLoad(base0.h, base0.d, base0.n);

  /** Re-read a biome's three axes under one modifier. */
  function underModifier(b: BiomeBlock, modifier: NodeModifierFamily | null) {
    const tierOf = tier;
    const n = (CONCURRENCY[b.id] ?? DEFAULT_CONCURRENCY) *
      (modifier ? modifierSpawnFactor(modifier, tierOf) : 1);
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
    // Population modifiers move N, and the ally-haste term is a function of N, so it is
    // recomputed here rather than reused from the unmodified row.
    return encounterLoad(h, d * allyHasteMult(b.rows, n), n);
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
      // A sustained-exempt biome is not held to the sustained ladder, so comparing it on
      // that axis reports a failure the design deliberately chose. The Trench fights one
      // at a time: `d(N+1)/2` collapses at N=1 and it is scored on cost/kill instead, the
      // axis on which this same step IS clean.
      const exemptAxis = axis.key === 'sustained'
        && (SUSTAINED_EXEMPT.has(blocks[i].id) || SUSTAINED_EXEMPT.has(blocks[i + 1].id));
      L.push('| ' + blocks[i].name + ' → ' + blocks[i + 1].name + ' | ' + axis.label + ' | '
        + worstEarlier.toFixed(2) + ' | ' + bestLater.toFixed(2) + ' | '
        + (exemptAxis ? 'n/a — exempt' : bestLater >= worstEarlier ? 'clean' : '**overlaps**') + ' |');
    }
  }
  L.push('');

  for (const b of blocks) {
    L.push('## ' + b.name + '  (density ' + b.density + ', ' + b.slots + ' pool slots)');
    L.push('');
    L.push('| monster | w | HP | atk | cd | direct | dot | dot ramp | total | spike | opener | ramp | pl | DR | ev | eHP@' + light + ' | eHP@' + heavy + ' | spread | spd | rng | control | ecology | partial |');
    L.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|');
    for (const r of [...b.rows, ...b.bosses]) {
      const label = (r.kind === 'boss' ? 'BOSS ' : r.unpooled ? 'follower ' : '') + r.name + ' `' + r.id + '`';
      L.push('| ' + label + ' | ' + (r.kind === 'boss' ? '—' : 'x' + r.weight) + ' | ' + r.hp + ' | ' + r.attack + ' | '
        + r.cd + ' | ' + round1(r.direct) + ' | ' + (r.dot ? round1(r.dot) : '—') + ' | ' + (r.dot ? round1(r.dotRamp) + 's' : '—') + ' | ' + round1(r.total) + ' | '
        + (r.spikeMult > 1 ? 'x' + r.spikeMult + ' = ' + Math.round(r.spikeDmg) + ' (' + r.spikeSrc + ')' : '—') + ' | '
        + (r.opener > 1 ? 'x' + round1(r.opener) : '—') + ' | '
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
  // `opener` and a beat multiple above 1 both count: an opening volley and a cadence
  // volley are mechanics the player reads and answers, and neither shows up in the spike
  // column (a volley is more shots, not one bigger one). Judging by `spikeMult` alone
  // filed every volley monster in the tier under "pure stat block".
  const bare = blocks.flatMap((b) => b.rows
    .filter((r) => !r.control.length && !r.ecology.length && !r.dot && !r.ev && !r.partial.length
      && r.spikeMult === 1 && r.ramp === 1 && r.opener <= 1
      && beatMultiple(MONSTER_DATABASE.get(r.id)!) <= 1)
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
