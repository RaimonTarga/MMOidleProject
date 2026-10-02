/**
 * The FAMILY-CONTRACT instrument — design §18 3b's arbiter (run 4, W2-A step 2).
 *
 * WHY THIS EXISTS, in one paragraph. The lane matrix ranks six lanes against each
 * other on a blended node, and run 3 proved that reading is below the instrument's
 * own resolution: at 21–57 kills per profile per seed the ordinal ranking failed to
 * reproduce between two seeds for SEVEN of nine families, and the margins moved
 * 7–15 pp between a 90 s and a 270 s cap — larger than the ±3 pp band the criterion
 * is written in. `monster-proposals-run3.md` §2 names the fix it needs:
 *
 *   "stop ranking six lanes against each other on one node and instead compare ONE
 *    lane against ONE lane on its own favoured node, pooled across all three
 *    lineages that carry it, with enough seeds to put a confidence interval on that
 *    single difference."
 *
 * That is exactly this file.
 *
 * Four things about the instrument a reader must know before trusting a row.
 *
 * 1. THE NODE IS SYNTHETIC AND 100% ONE FAMILY. A family's "own node" on the real
 *    map is a 70/20/10 blend, so three in ten kills on it belong to other families
 *    and a quarter of the measurement is about mobs the contract says nothing about.
 *    Worse, nine of the 37 Tier-2 blends do not resolve as authored (`swamp-mire`
 *    and `jungle-stalker` have no Tier-2 member), so Jungle's authored Stalker node
 *    collapses into an Ape node and the matrix measures a contract it is not naming.
 *    Here a real node of the family's own biome and tier has its authored blend
 *    OVERWRITTEN IN PROCESS to `{ family: 1 }`, so the resolved blend, the spawn
 *    cycle and every body in it belong to the family under test. The spawner, the
 *    density, the pack logic, the terrain and the repopulation cadence are all the
 *    live ones — only the composition is forced. THE OVERRIDE IS NEVER WRITTEN
 *    ANYWHERE: it lives in this process and the assertion below proves it landed.
 *
 * 2. THE READING IS ONE LANE AGAINST ONE LANE, NOT A RANKING. The family's favoured
 *    lane (`FamilyDefinition.drops`, which design §18.7 settles IS the definition of
 *    "favours") against the lane it declares it punishes. A margin between two
 *    quantities has a variance this instrument can estimate; a rank among six does
 *    not.
 *
 * 3. EVERY CELL RUNS TO A FIXED KILL COUNT, not a fixed clock. A fixed clock gives a
 *    tanky family's node a handful of kills and a swarm's node thirty, so the two
 *    rows carry different precision and the table cannot be read as one. Fixed N
 *    puts the same sample behind every cell and moves the variation into the thing
 *    being measured — the TIME to reach it. A cell that cannot reach N inside the
 *    hard cap is reported as NOT MEASURED rather than scored on what it managed.
 *
 * 4. THE QUANTITY IS UPLIFT OVER THE LINEAGE'S OWN BAND-MATCHED CONTROL (design
 *    §18.3), pooled across every weapon lineage carrying the lane. The absolute
 *    throughput of `rapier/tempo` is mostly Striker-with-a-rapier; only the
 *    difference from the same build with no cards is the lane. Pooling across the
 *    two or three lineages that carry a lane is the variance reduction §2 asked for.
 *    The raw time-to-kill-N ratio is reported beside it, because that is the
 *    quantity the brief names and because a margin whose sign disagrees with it is
 *    not trustworthy (guard G5 below).
 *
 * THE GUARDS, all of which must pass before a `drops` move is called decisive:
 *
 *   G1  reached-N        the lane cell AND its control each reached N kills inside
 *                       the cap, in every seed. Run 3's ranking floor was eight
 *                       kills per seed; this is a stronger form of the same guard —
 *                       not "enough kills" but "the same kills".
 *   G2  carriers         at least one weapon lineage carries each lane, and the
 *                       count is printed, because a one-lineage lane (Technique, on
 *                       the Broadsword alone) is a thinner reading than a
 *                       three-lineage one and the reader must see which it is.
 *   G3  seed agreement   every seed puts the margin on the same side of zero. This
 *                       is §18 3b's "both seeds agree", generalised to N seeds.
 *   G4  spread           |mean margin| exceeds half the seed-to-seed spread of the
 *                       margin, i.e. the crude interval around the difference does
 *                       not contain zero. This is the guard run 3 lacked: its
 *                       margins moved by more than the band they were judged in.
 *   G5  ratio agreement  the raw time-to-kill-N ratio agrees in sign with the
 *                       control-normalised margin.
 *
 * WHAT A DECISIVE INVERSION MAY AND MAY NOT BUY. The brief says "move `drops` to the
 * lane that won". With a two-lane instrument the lane that won IS the punished lane,
 * and `drops === punishes` is a state the data layer refuses —
 * `server/test/lineageMaterials.test.ts` asserts `family.drops !== family.punishes`
 * by name, and a family that rewarded the lane it punishes would be incoherent
 * besides. So a decisive inversion is a SHORTLIST entry, and the lane to move to is
 * found by re-running this bench over that family's node with `FAM_ALL_LANES=1`,
 * which ranks every weapon lane on the same synthetic node. Where the winner of
 * that wider pass is a third lane, `drops` moves there. Where the winner is the
 * punished lane itself, nothing moves and the row is reported as a monster-shape
 * finding, which is what design §18.7 says it is.
 *
 * Usage, from `server/`:
 *
 *   node --conditions=development --import tsx bench/familyContracts.ts [out-dir]
 *
 *   FAM_KILLS=30             kills per cell per seed (the fixed sample)
 *   FAM_CAP_MS=600000        hard cap of sim time per cell per seed
 *   FAM_SEEDS=...            four seeds by default
 *   FAM_TIERS=1,2            which node tiers to build synthetic nodes for
 *   FAM_FAMILIES=a,b         limit to these family ids
 *   FAM_BANDS=1,2            which bands to measure (default: the node's own tier)
 *   FAM_ALL_LANES=1          measure every weapon lane, not just the two
 *   FAM_REPORT=family-contracts  output basename (`.md` and `.json`)
 *   FAM_REPLAY=path.json     rebuild the report from a previous run's rows
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  BIOME_DATABASE,
  FAMILY_DATABASE,
  NODE_BIOMES,
  NODE_BLENDS,
  WORLD_NODES,
  WORLD_NODE_LIST,
  blendEntries,
  nodeSpawnBlend,
  type FamilyId,
  type NodeBlend,
  type PacketId,
  type TierEntryProfile,
} from '@mmo-idle/shared';
import {
  ALL_LANE_PROFILES,
  ALL_LANE_REFERENCES,
  type BandTier,
  type LineageLaneReference,
} from '../../bot/src/tierEntry/profiles';
import { setupArena, teardownArena } from './balance/arena';
import { reviveInFarmNode } from './balance/runFarm';
import { createFarmWorld } from './balance/worldFactory';
import { prepareLaneBot } from './lineage/laneBot';
import { hydrateHitboxCacheFromArtifact, writeHitboxArtifact } from '../src/hitbox/cache';
import { isPlayerActivelyInCombat } from '../src/systems/combat/ai/engagement';
import {
  registerCombatListener,
  unregisterCombatListener,
  type CombatEventHandler,
} from '../src/systems/combat/engine/combatPipeline';
import type { World } from '../src/world/World';

// ── The synthetic node ────────────────────────────────────────────────────────

interface SyntheticNode {
  /** The real node whose blend was overwritten, and therefore the node the bench runs in. */
  nodeId: string;
  family: FamilyId;
  familyName: string;
  biome: string;
  tier: number;
  /** The blend the node authored before the override, for the report's honesty. */
  authored: string;
  /** Every body the family can field at this tier, in pool order. */
  mobs: readonly string[];
  favoured: PacketId;
  punished: PacketId;
}

const short = (family: FamilyId): string => FAMILY_DATABASE.get(family)?.name ?? family;

/**
 * Bodies a family can actually field at a tier: its own monster list intersected
 * with the biome's pool for that tier, deduplicated (a pool may list a mob twice
 * to weight the flat random pick, which inside a one-family blend would only make
 * the node alternate between two copies of one mob).
 */
function fieldableMobs(family: FamilyId, tier: number): string[] {
  const def = FAMILY_DATABASE.get(family);
  if (!def) return [];
  const pool = BIOME_DATABASE.get(def.biome)?.monsterPoolByTier[tier] ?? [];
  return [...new Set(pool.filter((id) => def.monsterIds.includes(id)))];
}

/**
 * Build one synthetic node per (family, tier) by OVERWRITING a real node's authored
 * blend, in this process only.
 *
 * One distinct host node per family, because `nodeSpawnBlend` memoizes per node id
 * and the override has to land before the first resolution — using a different host
 * for each family makes that structural rather than a matter of call order. Host
 * selection walks the biome's own normal nodes of that tier in map order and takes
 * the first unused one; every family biome has at least three such nodes and at most
 * three families, so the supply is sufficient by construction and asserted below.
 *
 * Returns the nodes in (biome, tier, family) order. MUST be called before anything
 * else resolves a blend.
 */
function installSyntheticNodes(
  tiers: readonly number[],
  families: readonly FamilyId[],
  /**
   * `FAM_HOST=cave-brute:node-t1-cave-03,...` — force a family's host node.
   *
   * Exists because run 4 found that two hosts of the SAME forced 100% blend can rank
   * the lanes differently: `t1-cave-01` put Tempo first and Affliction fifth on a pure
   * Cave Brute encounter, `t1-cave-02` put Affliction first and Tempo second. The
   * composition is identical, so the difference is the node itself — terrain, mob
   * density, spawn geometry. A ranking that moves with the host has to be measured
   * over SEVERAL hosts before it can name a lane, and this is how the extra hosts are
   * selected.
   */
  hostOverride: Map<FamilyId, string>,
): SyntheticNode[] {
  const out: SyntheticNode[] = [];
  const takenHosts = new Set<string>([...hostOverride.values()]);
  for (const tier of tiers) {
    // Host assignment walks EVERY family the tier can field, not just the selected
    // ones, and only the selected ones are emitted. Otherwise a family's synthetic
    // node would depend on which other families happened to be in the run: the full
    // sweep gives Cave Brood `t1-cave-01` and Cave Brute `t1-cave-02`, but a
    // `FAM_FAMILIES=cave-brute` re-run on its own would take `t1-cave-01` and land on
    // a different node's terrain and density. Two runs of the same contract have to
    // mean the same encounter, or a narrow follow-up pass cannot be compared to the
    // sweep that prompted it.
    for (const family of FAMILY_DATABASE.keys()) {
      const def = FAMILY_DATABASE.get(family)!;
      const mobs = fieldableMobs(family, tier);
      if (mobs.length === 0) continue;
      const selected = families.includes(family);
      const forced = hostOverride.get(family);
      const host = forced
        ? WORLD_NODE_LIST.find((node) => node.id === forced)
        : WORLD_NODE_LIST.find((node) =>
          node.biomeGroup === def.biome
          && node.biomeTier === tier
          && NODE_BIOMES[node.id]?.kind === 'normal'
          && !!node.blend
          && !takenHosts.has(node.id));
      if (forced) {
        assert(host, `FAM_HOST names unknown node "${forced}"`);
        assert(host!.biomeGroup === def.biome && host!.biomeTier === tier,
          `FAM_HOST ${forced} is ${host!.biomeGroup} T${host!.biomeTier}, not ${def.biome} T${tier}`);
        assert(NODE_BIOMES[host!.id]?.kind === 'normal' && !!host!.blend,
          `FAM_HOST ${forced} is not a normal node with an authored blend`);
      }
      assert(host, `no spare ${def.biome} T${tier} node to host the ${def.name} contract`);
      takenHosts.add(host!.id);
      // Claim the host either way, then skip the unselected family: claiming is what
      // keeps the mapping stable, emitting is what the caller asked for.
      if (!selected) continue;
      const authored = blendEntries(host!.blend!)
        .map((e) => `${short(e.family)} ${Math.round(e.share * 100)}%`).join(' / ');

      // The override. Written to the node record AND to `NODE_BLENDS`, the
      // nodeId-keyed view built at module load, so the two cannot disagree.
      const pureBlend: NodeBlend = { [family]: 1 } as NodeBlend;
      // `WORLD_NODES` holds the SAME object as `WORLD_NODE_LIST` (the registry builds
      // the map from the list), so mutating the record reaches every reader of either.
      assert(WORLD_NODES.get(host!.id) === host, `${host!.id}: registry and list disagree`);
      (host as { blend?: NodeBlend }).blend = pureBlend;
      NODE_BLENDS[host!.id] = pureBlend;

      // Prove it landed: `nodeSpawnBlend` memoizes, so a host that had already been
      // resolved would silently keep its authored cycle and every number below would
      // be about the wrong encounter.
      const resolved = nodeSpawnBlend(host!.id);
      assert(resolved, `${host!.id}: the forced blend resolved to nothing`);
      assert(resolved!.shares[family] === 1 && blendEntries(resolved!.shares).length === 1,
        `${host!.id}: forced blend resolved to ${JSON.stringify(resolved!.shares)}`);
      assert(resolved!.cycle.every((f) => f === family),
        `${host!.id}: spawn cycle is not 100% ${family}`);
      assert(JSON.stringify([...(resolved!.poolByFamily.get(family) ?? [])]) === JSON.stringify(mobs),
        `${host!.id}: pool is ${JSON.stringify(resolved!.poolByFamily.get(family))}, expected ${JSON.stringify(mobs)}`);

      out.push({
        nodeId: host!.id,
        family,
        familyName: def.name,
        biome: def.biome,
        tier,
        authored,
        mobs,
        favoured: def.drops,
        punished: def.punishes,
      });
    }
  }
  return out;
}

// ── One measurement: time to kill N ──────────────────────────────────────────

interface Row {
  cellId: string;
  profileId: string;
  lineageId: string;
  lane: PacketId | null;
  bandTier: BandTier;
  family: FamilyId;
  nodeId: string;
  tier: number;
  seed: number;
  /** The fixed target, and the count actually reached (a final tick may overshoot). */
  killTarget: number;
  kills: number;
  reachedTarget: boolean;
  /** Sim ms elapsed when the run stopped, and engaged ms inside it. */
  simMs: number;
  engagedMs: number;
  capMs: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
  fx: Record<string, number>;
  refusals: string[];
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function measure(
  profile: TierEntryProfile,
  reference: LineageLaneReference,
  node: SyntheticNode,
  seed: number,
  killTarget: number,
  capMs: number,
): Row {
  const originalRandom = Math.random;
  const originalNow = Date.now;
  Math.random = seededRandom(seed);
  let now = 0;
  Date.now = () => now;

  const world: World = createFarmWorld();
  let kills = 0;
  let deaths = 0;
  let engagedMs = 0;
  let damageDealt = 0;
  let damageTaken = 0;
  const fx: Record<string, number> = {};
  const onKill: CombatEventHandler = (ctx) => {
    if (ctx.defenderType === 'monster') kills += 1;
  };
  const onDealt: CombatEventHandler = (ctx) => {
    if (ctx.defenderType === 'monster' && ctx.damage > 0) damageDealt += ctx.damage;
    if (ctx.defenderType === 'player' && ctx.damage > 0) damageTaken += ctx.damage;
  };
  registerCombatListener('onKill', onKill);
  registerCombatListener('onDamageTaken', onDealt);
  try {
    setupArena(world, {
      nodeId: node.nodeId, biomeGroup: node.biome, contentTier: node.tier, isDungeon: false,
    });
    const { bot, refusals } = prepareLaneBot(world, profile, reference, node.nodeId);
    for (; now < capMs && kills < killTarget;) {
      world.tick(100, now);
      now += 100;
      world.pendingDeaths = [];
      for (const event of world.takeNodeEvents(node.nodeId)) {
        if (event.kind === 'card-fx') fx[event.fx] = (fx[event.fx] ?? 0) + 1;
      }
      world.clearNodeEvents(node.nodeId);
      const dead = bot.isDead !== undefined || bot.hasHealth.hp <= 0;
      if (!dead && isPlayerActivelyInCombat(world, bot)) engagedMs += 100;
      if (dead) {
        deaths += 1;
        reviveInFarmNode(world, bot, node.nodeId);
      }
    }
    return {
      cellId: `${profile.id}@${node.nodeId}`,
      profileId: profile.id,
      lineageId: reference.lineageId,
      lane: reference.lane,
      bandTier: reference.bandTier,
      family: node.family,
      nodeId: node.nodeId,
      tier: node.tier,
      seed,
      killTarget,
      kills,
      reachedTarget: kills >= killTarget,
      simMs: now,
      engagedMs,
      capMs,
      deaths,
      damageDealt,
      damageTaken,
      fx,
      refusals,
    };
  } finally {
    unregisterCombatListener('onKill', onKill);
    unregisterCombatListener('onDamageTaken', onDealt);
    teardownArena(world);
    Math.random = originalRandom;
    Date.now = originalNow;
  }
}

// ── Aggregation ──────────────────────────────────────────────────────────────

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const fmt = (x: number | null, digits = 2): string => (x === null ? '—' : x.toFixed(digits));
const signedPct = (x: number | null): string =>
  x === null ? '—' : `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;

const baselineProfileId = (lineageId: string, band: BandTier): string =>
  `lineage-${lineageId}-baseline${band === 1 ? '' : '-t2'}`;

/** One lane's reading on one node in one seed, pooled across the lineages carrying it. */
interface LaneReading {
  lane: PacketId;
  /** Median control-relative uplift across the carriers that were measurable. */
  uplift: number | null;
  /** Median engaged ms per kill across the same carriers. */
  ttkMs: number | null;
  /** Median sim ms to reach N across the same carriers. */
  timeToNMs: number | null;
  carriers: number;
  /** Carriers dropped because they, or their control, did not reach N (guard G1). */
  dropped: string[];
  deaths: number;
  fx: number;
}

async function main(): Promise<void> {
  const out = resolve(process.argv[2] ?? '../reports/progression-phase1');
  const killTarget = Number(process.env.FAM_KILLS ?? 30);
  const capMs = Number(process.env.FAM_CAP_MS ?? 600_000);
  const seeds = (process.env.FAM_SEEDS ?? '101009,101033,101063,101081').split(',').map(Number);
  const tiers = (process.env.FAM_TIERS ?? '1,2').split(',').map(Number);
  const familyFilter = process.env.FAM_FAMILIES?.split(',');
  const bandFilter = process.env.FAM_BANDS?.split(',').map(Number) as BandTier[] | undefined;
  const allLanes = process.env.FAM_ALL_LANES === '1';
  mkdirSync(out, { recursive: true });

  const families = [...FAMILY_DATABASE.keys()].filter((id) => !familyFilter || familyFilter.includes(id));
  const hostOverride = new Map<FamilyId, string>(
    (process.env.FAM_HOST ?? '').split(',').filter(Boolean).map((pair) => {
      const [family, nodeId] = pair.split(':');
      assert(family && nodeId, `FAM_HOST entry "${pair}" is not family:nodeId`);
      assert(FAMILY_DATABASE.has(family as FamilyId), `FAM_HOST names unknown family "${family}"`);
      return [family as FamilyId, nodeId] as const;
    }),
  );
  // MUST run before anything resolves a blend, `nodeSpawnBlend` being memoized.
  const nodes = installSyntheticNodes(tiers, families, hostOverride);
  assert(nodes.length > 0, 'no (family, tier) pair can be fielded at all');

  if (!process.env.FAM_REPLAY) {
    const artifact = process.env.LANE_HITBOX ?? join(tmpdir(), 'mmo-lane-matrix-hitboxes.json');
    if (!existsSync(artifact)) await writeHitboxArtifact(artifact);
    assert(hydrateHitboxCacheFromArtifact(artifact) > 0, 'hitbox cache is empty');
  }

  const laneRefs = ALL_LANE_REFERENCES.filter((r) => r.lane);
  const controls = ALL_LANE_REFERENCES.filter((r) => !r.lane);
  /**
   * The band a node of this tier is measured at: the MATCHED one, because the
   * question "does this family reward its declared lane" is asked of the character
   * who is actually farming it, and that character's gear is its tier's.
   */
  const bandForTier = (tier: number): BandTier => (tier <= 1 ? 1 : 2);

  const rows: Row[] = [];
  let replayElapsedMs = 0;
  const startedAt = Date.now();
  if (process.env.FAM_REPLAY) {
    const stored = JSON.parse(readFileSync(resolve(process.env.FAM_REPLAY), 'utf8')) as
      { rows: Row[]; elapsedMs?: number };
    assert(Array.isArray(stored.rows) && stored.rows.length > 0, 'replay file holds no rows');
    rows.push(...stored.rows);
    // The measured run's wall clock travels in the JSON, so a replay that only
    // regenerates the prose does not silently rewrite the header to "0.0 min".
    // `FAM_ELAPSED_MS` covers a JSON written before `elapsedMs` was stored: a replay of
    // one of those would otherwise print "wall clock 0.0 min" for a run that took over
    // an hour, which is worse than taking the number from the operator.
    replayElapsedMs = stored.elapsedMs ?? Number(process.env.FAM_ELAPSED_MS ?? 0);
    console.log(`replaying ${rows.length} measured rows`);
  } else {
    for (const node of nodes) {
      const band = bandForTier(node.tier);
      if (bandFilter && !bandFilter.includes(band)) continue;
      const lanes = allLanes
        ? [...new Set(laneRefs.filter((r) => r.bandTier === band).map((r) => r.lane!))]
        : [...new Set([node.favoured, node.punished])];
      const lanePlan = laneRefs.filter((r) => r.bandTier === band && lanes.includes(r.lane!));
      // One control per lineage involved, measured once and shared by its lanes.
      const controlPlan = controls.filter((r) => r.bandTier === band
        && lanePlan.some((l) => l.lineageId === r.lineageId));
      const plan = [...lanePlan, ...controlPlan];
      console.log(`\n=== ${node.familyName} (${node.biome} T${node.tier}) @ ${node.nodeId}`
        + ` — 100% ${node.family}, bodies ${node.mobs.join(', ')};`
        + ` favours ${node.favoured}, punishes ${node.punished}; band ${band};`
        + ` ${plan.length} profiles x ${seeds.length} seeds to ${killTarget} kills`);
      for (const reference of plan) {
        const profile = ALL_LANE_PROFILES.get(reference.profileId)!;
        const cell: Row[] = [];
        for (const seed of seeds) {
          cell.push(measure(profile, reference, node, seed, killTarget, capMs));
        }
        rows.push(...cell);
        const reached = cell.filter((r) => r.reachedTarget).length;
        console.log(
          `  ${reference.profileId.padEnd(34)} reachedN=${reached}/${seeds.length}`
          + ` simToN=${Math.round(median(cell.map((r) => r.simMs)) / 1000)}s`
          + ` ttk=${Math.round(median(cell.map((r) => (r.kills ? r.engagedMs / r.kills : capMs))))}ms`
          + ` deaths=${cell.reduce((a, r) => a + r.deaths, 0)}`
          + ` fx=${cell.reduce((a, r) => a + Object.values(r.fx).reduce((x, y) => x + y, 0), 0)}`
          + (cell[0].refusals.length ? ` REFUSED ${cell[0].refusals.join('; ')}` : ''),
        );
      }
    }
  }
  const elapsedMs = process.env.FAM_REPLAY ? replayElapsedMs : Date.now() - startedAt;

  // ── Readings ──────────────────────────────────────────────────────────────

  const rowFor = (profileId: string, nodeId: string, seed: number): Row | undefined =>
    rows.find((r) => r.profileId === profileId && r.nodeId === nodeId && r.seed === seed);

  /**
   * One lane on one node in one seed.
   *
   * Guard G1 is applied HERE, per carrier: a carrier whose lane cell or whose
   * control failed to reach N inside the cap contributes nothing and is named in
   * `dropped`. Dropping the carrier rather than the whole lane is deliberate — two
   * of three carriers reaching N is a thinner reading, not no reading, and `carriers`
   * says which it was.
   */
  const readingFor = (lane: PacketId, node: SyntheticNode, band: BandTier, seed: number): LaneReading => {
    const carriers = laneRefs.filter((r) => r.lane === lane && r.bandTier === band);
    const uplifts: number[] = [];
    const ttks: number[] = [];
    const times: number[] = [];
    const dropped: string[] = [];
    let deaths = 0;
    let fx = 0;
    for (const reference of carriers) {
      const cell = rowFor(reference.profileId, node.nodeId, seed);
      const control = rowFor(baselineProfileId(reference.lineageId, band), node.nodeId, seed);
      if (!cell || !control) { dropped.push(`${reference.lineageId} (not run)`); continue; }
      deaths += cell.deaths;
      fx += Object.values(cell.fx).reduce((a, b) => a + b, 0);
      if (!cell.reachedTarget || !control.reachedTarget) {
        dropped.push(`${reference.lineageId} (lane ${cell.kills}/${cell.killTarget},`
          + ` control ${control.kills}/${control.killTarget} kills in ${cell.capMs / 1000} s)`);
        continue;
      }
      // Fixed N, so kills/min is N / minutes and the uplift is the inverse ratio of
      // the sim times. Written as the throughput ratio anyway, to stay the same
      // quantity the lane matrix reports.
      const laneRate = cell.kills / (cell.simMs / 60_000);
      const controlRate = control.kills / (control.simMs / 60_000);
      if (controlRate <= 0) { dropped.push(`${reference.lineageId} (control killed nothing)`); continue; }
      uplifts.push(laneRate / controlRate - 1);
      ttks.push(cell.engagedMs / cell.kills);
      times.push(cell.simMs);
    }
    return {
      lane,
      uplift: uplifts.length ? median(uplifts) : null,
      ttkMs: ttks.length ? median(ttks) : null,
      timeToNMs: times.length ? median(times) : null,
      carriers: uplifts.length,
      dropped,
      deaths,
      fx,
    };
  };

  interface ContractRow {
    node: SyntheticNode;
    band: BandTier;
    favoured: PacketId;
    punished: PacketId;
    /** Per seed: the two readings and the margin between them. */
    perSeed: Array<{
      seed: number;
      fav: LaneReading;
      pun: LaneReading;
      marginPp: number | null;
      ttkRatio: number | null;
    }>;
    meanMarginPp: number | null;
    /** Half the seed-to-seed spread of the margin: the crude interval (guard G4). */
    halfSpreadPp: number | null;
    meanTtkRatio: number | null;
    favCarriers: number;
    punCarriers: number;
    /** Why the row could not be measured at all, when it could not. */
    unmeasured: string | null;
    guards: {
      g1ReachedN: boolean;
      g2Carriers: boolean;
      g3SeedsAgree: boolean;
      g4SpreadExcludesZero: boolean;
      g5RatioAgrees: boolean;
    };
    /**
     * Symmetric on purpose: "decisive" means all five guards passed, whichever way
     * the margin fell. A `holds` that fails G4 or G5 is just as much inside the
     * noise as an `inverted` that does, and run 3's mistake was reading one of
     * those as a finding.
     */
    verdict: 'holds (decisive)' | 'holds' | 'inverted' | 'inverted (decisive)' | 'not measured';
  }

  const contractRows: ContractRow[] = [];
  for (const node of nodes) {
    const band = bandForTier(node.tier);
    if (bandFilter && !bandFilter.includes(band)) continue;
    const favCarriersAuthored = laneRefs.filter((r) => r.lane === node.favoured && r.bandTier === band);
    const punCarriersAuthored = laneRefs.filter((r) => r.lane === node.punished && r.bandTier === band);
    const perSeed = seeds.map((seed) => {
      const fav = readingFor(node.favoured, node, band, seed);
      const pun = readingFor(node.punished, node, band, seed);
      return {
        seed, fav, pun,
        marginPp: fav.uplift !== null && pun.uplift !== null ? fav.uplift - pun.uplift : null,
        ttkRatio: fav.ttkMs !== null && pun.ttkMs !== null && fav.ttkMs > 0 ? pun.ttkMs / fav.ttkMs : null,
      };
    });
    const margins = perSeed.flatMap((s) => (s.marginPp === null ? [] : [s.marginPp]));
    const ratios = perSeed.flatMap((s) => (s.ttkRatio === null ? [] : [s.ttkRatio]));
    const meanMarginPp = margins.length ? margins.reduce((a, b) => a + b, 0) / margins.length : null;
    const halfSpreadPp = margins.length > 1 ? (Math.max(...margins) - Math.min(...margins)) / 2 : null;
    const meanTtkRatio = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null;

    let unmeasured: string | null = null;
    if (punCarriersAuthored.length === 0) {
      unmeasured = `no weapon lineage carries \`${node.punished}\`, so the punished half has no reference`;
    } else if (favCarriersAuthored.length === 0) {
      unmeasured = `no weapon lineage carries \`${node.favoured}\``;
    } else if (margins.length === 0) {
      unmeasured = 'no seed produced both readings (see the dropped carriers)';
    }

    const g1ReachedN = margins.length === seeds.length
      && perSeed.every((s) => s.fav.dropped.length === 0 && s.pun.dropped.length === 0);
    const g2Carriers = favCarriersAuthored.length >= 1 && punCarriersAuthored.length >= 1;
    const g3SeedsAgree = margins.length === seeds.length
      && (margins.every((m) => m > 0) || margins.every((m) => m < 0));
    const g4SpreadExcludesZero = meanMarginPp !== null && halfSpreadPp !== null
      && Math.abs(meanMarginPp) > halfSpreadPp;
    const g5RatioAgrees = meanMarginPp !== null && meanTtkRatio !== null
      && ((meanMarginPp > 0 && meanTtkRatio > 1) || (meanMarginPp < 0 && meanTtkRatio < 1));

    const allGuards = g1ReachedN && g2Carriers && g3SeedsAgree && g4SpreadExcludesZero && g5RatioAgrees;
    const verdict: ContractRow['verdict'] = unmeasured
      ? 'not measured'
      : meanMarginPp !== null && meanMarginPp >= 0
        ? (allGuards ? 'holds (decisive)' : 'holds')
        : (allGuards ? 'inverted (decisive)' : 'inverted');

    contractRows.push({
      node, band,
      favoured: node.favoured,
      punished: node.punished,
      perSeed,
      meanMarginPp,
      halfSpreadPp,
      meanTtkRatio,
      favCarriers: Math.max(...perSeed.map((s) => s.fav.carriers), 0),
      punCarriers: Math.max(...perSeed.map((s) => s.pun.carriers), 0),
      unmeasured,
      guards: { g1ReachedN, g2Carriers, g3SeedsAgree, g4SpreadExcludesZero, g5RatioAgrees },
      verdict,
    });
  }

  // ── The wider pass, when `FAM_ALL_LANES=1` ────────────────────────────────
  //
  // Every weapon lane of the band ranked on the same synthetic node. This is what
  // names the lane to move `drops` TO: the two-lane contract reading can only say
  // that the favoured lane lost, and the lane it lost to is the lane it punishes,
  // which `drops` may never become.
  const wider: string[] = allLanes
    ? nodes.flatMap((node) => {
      const band = bandForTier(node.tier);
      if (bandFilter && !bandFilter.includes(band)) return [];
      const lanes = [...new Set(laneRefs.filter((r) => r.bandTier === band).map((r) => r.lane!))];
      const scored = lanes.map((lane) => {
        const perSeed = seeds.map((seed) => readingFor(lane, node, band, seed));
        const values = perSeed.flatMap((r) => (r.uplift === null ? [] : [r.uplift]));
        return {
          lane,
          mean: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
          seedsWithReading: values.length,
          carriers: Math.max(...perSeed.map((r) => r.carriers), 0),
          /** Did every seed with a reading rank it the same way? Reported, not thresholded. */
          perSeed: values,
        };
      }).sort((a, b) => (b.mean ?? -Infinity) - (a.mean ?? -Infinity));
      return [
        '',
        `### \`${node.nodeId}\` — 100% ${short(node.family)} (${node.biome} T${node.tier}, band ${band})`,
        '',
        `Favours \`${node.favoured}\`, punishes \`${node.punished}\`.`,
        '',
        '| rank | lane | mean uplift | carriers | seeds with a reading | per-seed uplift |',
        '|---:|---|---:|---:|---:|---|',
        ...scored.map((r, i) => `| ${i + 1} | ${r.lane}`
          + `${r.lane === node.favoured ? ' **(favoured)**' : ''}`
          + `${r.lane === node.punished ? ' _(punished)_' : ''}`
          + ` | ${signedPct(r.mean)} | ${r.carriers} | ${r.seedsWithReading}/${seeds.length}`
          + ` | ${r.perSeed.map((v) => signedPct(v)).join(', ') || '—'} |`),
      ];
    })
    : ['Not measured on this run (`FAM_ALL_LANES=1` to add it).'];

  // ── Report ────────────────────────────────────────────────────────────────

  const yn = (ok: boolean): string => (ok ? 'yes' : 'NO');
  const verdictMark = (v: ContractRow['verdict']): string =>
    v === 'holds (decisive)' ? 'holds (decisive)'
      : v === 'holds' ? 'holds (inside noise)'
        : v === 'inverted (decisive)' ? '**INVERTED (decisive)**'
          : v === 'inverted' ? 'inverted (inside noise)' : '_not measured_';

  const contractTable = [
    '| family | node | tier | band | favours | punishes | fav uplift | pun uplift | margin (fav − pun) | ± half-spread | TTK-N ratio (pun/fav) | carriers f/p | G1 | G3 | G4 | G5 | verdict |',
    '|---|---|---:|---:|---|---|---:|---:|---:|---:|---:|---|:--:|:--:|:--:|:--:|---|',
    ...contractRows.map((r) => {
      const favU = median(r.perSeed.flatMap((s) => (s.fav.uplift === null ? [] : [s.fav.uplift])));
      const punU = median(r.perSeed.flatMap((s) => (s.pun.uplift === null ? [] : [s.pun.uplift])));
      const anyFav = r.perSeed.some((s) => s.fav.uplift !== null);
      const anyPun = r.perSeed.some((s) => s.pun.uplift !== null);
      return `| ${short(r.node.family)} | \`${r.node.nodeId}\` | ${r.node.tier} | ${r.band}`
        + ` | ${r.favoured} | ${r.punished}`
        + ` | ${anyFav ? signedPct(favU) : '—'} | ${anyPun ? signedPct(punU) : '—'}`
        + ` | ${signedPct(r.meanMarginPp)} | ${r.halfSpreadPp === null ? '—' : signedPct(r.halfSpreadPp)}`
        + ` | ${fmt(r.meanTtkRatio)} | ${r.favCarriers}/${r.punCarriers}`
        + ` | ${yn(r.guards.g1ReachedN)} | ${yn(r.guards.g3SeedsAgree)}`
        + ` | ${yn(r.guards.g4SpreadExcludesZero)} | ${yn(r.guards.g5RatioAgrees)}`
        + ` | ${verdictMark(r.verdict)} |`;
    }),
  ];

  const perSeedTable = [
    '| family | node | band | per-seed margin (fav − pun) | per-seed TTK-N ratio | dropped carriers |',
    '|---|---|---:|---|---|---|',
    ...contractRows.map((r) => `| ${short(r.node.family)} | \`${r.node.nodeId}\` | ${r.band}`
      + ` | ${r.perSeed.map((s) => signedPct(s.marginPp)).join(', ')}`
      + ` | ${r.perSeed.map((s) => fmt(s.ttkRatio)).join(', ')}`
      + ` | ${[...new Set(r.perSeed.flatMap((s) => [...s.fav.dropped, ...s.pun.dropped]))].join('; ') || 'none'} |`),
  ];

  const unmeasuredRows = contractRows.filter((r) => r.unmeasured);
  const inverted = contractRows.filter((r) => r.verdict.startsWith('inverted'));
  const decisive = contractRows.filter((r) => r.verdict === 'inverted (decisive)');

  /**
   * (family, tier) pairs that got NO synthetic node because the biome's pool for that
   * tier fields none of the family's bodies.
   *
   * Reported rather than skipped silently: `swamp-mire` and `jungle-stalker` having no
   * Tier-2 member is why nine of the 37 authored Tier-2 blends do not resolve as
   * authored, and why the Jungle's authored Stalker node collapses into an Ape node in
   * the lane matrix. This instrument cannot measure a contract whose family the tier
   * cannot field either — but unlike the matrix it says so instead of quietly measuring
   * a different family.
   *
   * Only counted where the family's BIOME has a pool at that tier. A Tundra family with
   * no Tier-1 body is not a gap — the Tundra does not exist at Tier 1 — and listing all
   * of those would bury the three rows that are real.
   */
  const unfieldable = tiers.flatMap((tier) => families
    .filter((family) => {
      const biome = FAMILY_DATABASE.get(family)!.biome;
      const pool = BIOME_DATABASE.get(biome)?.monsterPoolByTier[tier] ?? [];
      return pool.length > 0 && fieldableMobs(family, tier).length === 0;
    })
    .map((family) => ({ family, tier, biome: FAMILY_DATABASE.get(family)!.biome })));

  const nodeTable = [
    '| family | host node | tier | authored blend (OVERWRITTEN) | forced blend | bodies it fields |',
    '|---|---|---:|---|---|---|',
    ...nodes.map((n) => `| ${short(n.family)} | \`${n.nodeId}\` | ${n.tier} | ${n.authored}`
      + ` | ${short(n.family)} 100% | ${n.mobs.join(', ')} |`),
  ];

  const md = [
    '# Family contracts — the §18 3b arbiter',
    '',
    `Generated ${new Date().toISOString()} from \`${execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()}\`.`,
    `${nodes.length} synthetic nodes x ${seeds.length} seeds (${seeds.join(', ')}),`
    + ` every cell run to **${killTarget} kills** or a ${capMs / 1000} s hard cap;`
    + ` ${rows.length} measured runs; wall clock ${(elapsedMs / 60_000).toFixed(1)} min.`,
    '',
    'This instrument answers one question per family: **does the family reward the',
    'lane it declares it favours more than the lane it declares it punishes, on an',
    'encounter made entirely of its own bodies?** `FamilyDefinition.drops` IS the',
    'definition of "favours" (design §18.7), so a family that does not is a',
    'monster-shape finding, not a magnitude to tune.',
    '',
    'It exists because the lane matrix cannot answer it. Ranking six lanes against',
    'each other on one blended node is below that instrument\'s resolution: run 3\'s',
    'ordinal ranking failed to reproduce between two seeds for seven of nine families,',
    'and its margins moved 7–15 pp between a 90 s and a 270 s cap — more than the ±3 pp',
    'band the criterion is written in. `monster-proposals-run3.md` §2 prescribed exactly',
    'this replacement: one lane against one lane, on its own node, pooled across every',
    'lineage carrying the lane, with enough seeds to put an interval on the difference.',
    '',
    '## How it differs from the lane matrix',
    '',
    '1. **The node is 100% the family.** A real "own node" is a 70/20/10 blend, so a',
    '   quarter of its kills belong to families whose contract is not under test — and',
    '   nine of the 37 Tier-2 blends do not even resolve as authored, so the matrix',
    '   sometimes measures a different family than the one its row names. Here a real',
    '   node of the family\'s own biome and tier has its authored blend overwritten',
    '   **in this process only** to 100% that family. The spawner, density, pack logic,',
    '   terrain and repopulation are the live ones; only the composition is forced, and',
    '   an assertion proves the forced cycle actually landed before any measurement.',
    '2. **Two lanes, not six.** A margin between two quantities has a variance this',
    '   bench can estimate. A rank among six does not.',
    '3. **A fixed kill count, not a fixed clock.** Every cell carries the same sample,',
    '   so a tanky family\'s row and a swarm\'s row are equally precise and the variation',
    '   moves into the thing being measured — the time to reach N. A cell that cannot',
    '   reach N inside the cap is reported as not measured rather than scored on what',
    '   it managed.',
    '4. **The band matches the node\'s tier.** A Tier-2 node is measured by the',
    '   character who actually farms it, carrying the Tier-2 band on Tier-2 gear',
    '   (`bot/src/tierEntry/profiles.ts`), against that band\'s own lane-less control.',
    '',
    '## The guards',
    '',
    'All five must pass before an inversion is called **decisive**, which is the only',
    'state that may move a `drops` field.',
    '',
    '| guard | what it requires |',
    '|---|---|',
    '| G1 reached-N | the lane cell AND its control reached N kills inside the cap, in every seed and for every carrier |',
    '| G2 carriers | at least one weapon lineage carries each of the two lanes (the count is printed, because a one-lineage lane is a thinner reading) |',
    '| G3 seed agreement | every seed puts the margin on the same side of zero — §18 3b\'s "both seeds agree", generalised |',
    '| G4 spread | &#124;mean margin&#124; exceeds half the seed-to-seed spread, so the crude interval around the difference excludes zero. This is the guard run 3 lacked |',
    '| G5 ratio agreement | the raw time-to-kill-N ratio agrees in sign with the control-normalised margin |',
    '',
    '## The synthetic nodes',
    '',
    'One host node per (family, tier). `nodeSpawnBlend` memoizes per node id, so each',
    'family gets its OWN host and the override is structural rather than a matter of',
    'call order. Nothing here is written to disk.',
    '',
    ...nodeTable,
    '',
    '### (family, tier) pairs with no node, because the tier fields none of their bodies',
    '',
    'Not a failure of this instrument — a gap in the monster pools. It is the same gap',
    'that makes nine of the 37 authored Tier-2 blends resolve as something other than',
    'what they name, so the lane matrix measures a different family on those nodes while',
    'this bench simply has no row.',
    '',
    ...(unfieldable.length
      ? ['| family | biome | tier | why |', '|---|---|---:|---|',
         ...unfieldable.map((u) => `| ${short(u.family)} | ${u.biome} | ${u.tier}`
           + ` | \`monsterPoolByTier[${u.tier}]\` of ${u.biome} fields none of its bodies |`)]
      : ['None: every family selected is fieldable at every tier selected.']),
    '',
    '## The contract, per family',
    '',
    'Uplift is against the same lineage\'s band-matched lane-less control on the same',
    'synthetic node, pooled (median) across every weapon lineage carrying the lane.',
    'The margin is favoured minus punished in percentage points of uplift; positive',
    'means the contract holds. The TTK-N ratio is the punished lane\'s engaged',
    'milliseconds per kill over the favoured lane\'s — above 1 also means the contract',
    'holds, and it is the quantity the brief names.',
    '',
    ...contractTable,
    '',
    '### Per seed, and what was dropped',
    '',
    ...perSeedTable,
    '',
    '## Verdicts',
    '',
    `- Contracts measured: **${contractRows.length - unmeasuredRows.length}** of ${contractRows.length}.`,
    `- Holding: **${contractRows.filter((r) => r.verdict.startsWith('holds')).length}**, of which`
    + ` **${contractRows.filter((r) => r.verdict === 'holds (decisive)').length}** with all five guards`
    + " passing; the rest hold on the mean but sit inside the instrument's own noise.",
    `- Inverted: **${inverted.length}**, of which **${decisive.length}** decisive (all five guards).`,
    `- Not measured: **${unmeasuredRows.length}**.`,
    '',
    ...(decisive.length
      ? ['### Decisive inversions — the `drops` shortlist', '',
         'The favoured lane lost on the family\'s own bodies with every guard passing.',
         'The lane to move `drops` TO is **not** read off this table: with two lanes the',
         'winner is by construction the lane the family punishes, and `drops === punishes`',
         'is refused by `server/test/lineageMaterials.test.ts` and incoherent besides. The',
         'wider pass below (`FAM_ALL_LANES=1`) names the lane.',
         '',
         '| family | node | tier | band | drops today | margin | half-spread | TTK-N ratio |',
         '|---|---|---:|---:|---|---:|---:|---:|',
         ...decisive.map((r) => `| ${short(r.node.family)} | \`${r.node.nodeId}\` | ${r.node.tier}`
           + ` | ${r.band} | \`${r.favoured}\` | ${signedPct(r.meanMarginPp)}`
           + ` | ${r.halfSpreadPp === null ? '—' : signedPct(r.halfSpreadPp)} | ${fmt(r.meanTtkRatio)} |`),
         '']
      : ['### Decisive inversions', '', 'None: no family fails its contract with all five guards passing.', '']),
    ...(inverted.length > decisive.length
      ? ['### Inverted but NOT decisive', '',
         'The favoured lane lost on average, but at least one guard failed — so the',
         'inversion is inside the instrument\'s noise and nothing moves. The failing',
         'guards are in the table above.',
         '',
         ...inverted.filter((r) => r.verdict === 'inverted')
           .map((r) => `- **${short(r.node.family)}** T${r.node.tier} band ${r.band}:`
             + ` margin ${signedPct(r.meanMarginPp)}, half-spread`
             + ` ${r.halfSpreadPp === null ? '—' : signedPct(r.halfSpreadPp)}; failed`
             + ` ${Object.entries(r.guards).filter(([, ok]) => !ok).map(([k]) => k).join(', ') || 'nothing'}`),
         '']
      : []),
    ...(unmeasuredRows.length
      ? ['### Not measured, and why', '',
         ...unmeasuredRows.map((r) => `- **${short(r.node.family)}** T${r.node.tier}`
           + ` (\`${r.node.nodeId}\`): ${r.unmeasured}`),
         '']
      : []),
    '## The wider pass — every weapon lane on the same synthetic node',
    '',
    'What names the lane a decisive inversion should move `drops` to.',
    '',
    ...wider,
    '',
    ...(() => {
      const refused = rows.filter((r) => r.refusals.length > 0);
      return refused.length
        ? ['## Refused purchases', '',
           ...[...new Set(refused.map((r) => `- \`${r.profileId}\`: ${r.refusals.join('; ')}`))], '']
        : ['## Refused purchases', '', 'None — every lane bought its whole band.', ''];
    })(),
  ].join('\n');

  const base = process.env.FAM_REPORT ?? 'family-contracts';
  writeFileSync(resolve(out, `${base}.md`), `${md}\n`);
  writeFileSync(resolve(out, `${base}.json`), `${JSON.stringify({
    schema: 1,
    killTarget, capMs, seeds, tiers, allLanes,
    elapsedMs,
    nodes,
    unfieldable,
    rows,
    contracts: contractRows.map((r) => ({
      family: r.node.family,
      nodeId: r.node.nodeId,
      tier: r.node.tier,
      bandTier: r.band,
      favoured: r.favoured,
      punished: r.punished,
      meanMarginPp: r.meanMarginPp,
      halfSpreadPp: r.halfSpreadPp,
      meanTtkRatio: r.meanTtkRatio,
      favCarriers: r.favCarriers,
      punCarriers: r.punCarriers,
      guards: r.guards,
      verdict: r.verdict,
      unmeasured: r.unmeasured,
      perSeed: r.perSeed.map((s) => ({
        seed: s.seed,
        marginPp: s.marginPp,
        ttkRatio: s.ttkRatio,
        favUplift: s.fav.uplift,
        punUplift: s.pun.uplift,
        favTtkMs: s.fav.ttkMs,
        punTtkMs: s.pun.ttkMs,
        dropped: [...s.fav.dropped, ...s.pun.dropped],
      })),
    })),
  }, null, 2)}\n`);
  console.log(`\nwrote ${resolve(out, `${base}.md`)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
