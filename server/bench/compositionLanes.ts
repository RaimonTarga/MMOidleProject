/**
 * The lean × verb composition matrix on the LANE BENCH (course-correction W3-A,
 * design §24.1–§24.2).
 *
 * Every weapon lineage's nine T1 pairs (`lineage/compositionPairs.ts`) plus its
 * no-band control, worn by each of the six classes, farming the weapon's HOME
 * biome's family-dominated nodes (the `LANE_OWN_NODES=1` set within the home
 * biome — the nodes whose shards buy the weapon's band). One row per
 * (pair, class, node, seed), written as JSON lines.
 *
 * The character. Each class's canonical lane-bench character — the root's
 * canonical-frame reference (`LINEAGE_FRAME_PROFILES`: its T1-complete manifest,
 * frame, gear and package) — with ONE change: the weapon is this lineage's T1
 * form. So within a (weapon, class) every row is the same character and the band
 * is the only variable; the control wears the form with no cards, which is what
 * a pair's uplift is read against (`compositionReport.ts`). The band is bought
 * through the real economy handler by `prepareLaneBot` — a lean in one lane and a
 * verb in another — and a refusal is recorded, never faked.
 *
 * Every class may wear every T1 weapon: `equipItem` has no class or range gate,
 * and a weapon carries no attack range of its own (ranged classes stay ranged by
 * archetype). So the matrix is the full 5 × 6 cross; nothing is skipped.
 *
 * Usage, from `server/`:
 *
 *   node --conditions=development --import tsx bench/compositionLanes.ts <out.jsonl>
 *
 *   LANE_SHARD=0 LANE_SHARDS=6   round-robin over (pair, class, node) jobs
 *   CMP_SEEDS=10                 seeds per cell (the first N of a fixed list)
 *   CMP_CAP_MS=90000             sim time per cell per seed
 *   CMP_FILTER=rapier            substring filter on the profile id
 *   LANE_HITBOX=path.json        hitbox artifact (written to tmp if absent)
 *
 * Rows are APPENDED as they finish and a restarted shard skips the (cell, seed)
 * pairs ANY `.jsonl` in its output's directory already holds, so an interrupted
 * run resumes rather than restarts — even under a different shard count. Give
 * each shard its own output file (`matrix-lanes.shard<i>.jsonl`) and concatenate
 * them when every shard is done.
 */
import assert from 'node:assert/strict';
import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { LINEAGE_DATABASE, type PacketId, type TierEntryProfile } from '@mmo-idle/shared';
import {
  LINEAGE_FRAME_PROFILES,
  LINEAGE_FRAME_REFERENCES,
  type LineageLaneReference,
} from '../../bot/src/tierEntry/profiles';
import { hydrateHitboxCacheFromArtifact, writeHitboxArtifact } from '../src/hitbox/cache';
import { OWN_NODE_SHARE, laneNodes, measure, type LaneNode } from './lineage/laneMeasure';
import {
  CLASS_BY_ROOT,
  compositionPairs,
  t1FormOf,
  weaponLineages,
  type CompositionPair,
} from './lineage/compositionPairs';

/** The lane bench's seed list, extended to ten (the first two are its defaults). */
const SEEDS = [101009, 101033, 101051, 101063, 101081, 101089, 101107, 101113, 101117, 101119];

interface CompositionReference extends LineageLaneReference {
  pair: CompositionPair;
  className: string;
}

/** The class's canonical lane-bench character, wearing `form` instead of its own weapon. */
function compositionProfile(classRoot: string, form: string, profileId: string): TierEntryProfile {
  const frame = LINEAGE_FRAME_REFERENCES.find((r) => r.classRoot === classRoot && r.canonical && r.bandTier === 1);
  assert(frame, `${classRoot}: no canonical band-1 frame reference`);
  const base = LINEAGE_FRAME_PROFILES.get(frame.profileId);
  assert(base, `${frame.profileId}: no profile`);
  const previous = base.equipment.weapon;
  const inventory = [...new Set([
    ...base.inventory.filter((id) => id !== form),
    ...(previous && previous !== form ? [previous] : []),
  ])];
  return {
    ...base,
    id: profileId,
    lane: undefined,
    equipment: { ...base.equipment, weapon: form },
    inventory,
    itemUpgrades: {},
  };
}

function references(): Array<{ reference: CompositionReference; profile: TierEntryProfile }> {
  const out: Array<{ reference: CompositionReference; profile: TierEntryProfile }> = [];
  for (const lineage of weaponLineages()) {
    const form = t1FormOf(lineage);
    for (const [classRoot, className] of Object.entries(CLASS_BY_ROOT)) {
      const frame = LINEAGE_FRAME_REFERENCES.find((r) => r.classRoot === classRoot && r.canonical && r.bandTier === 1)!;
      for (const pair of compositionPairs(lineage)) {
        const profileId = `cmp-${lineage.id}-${className}-${pair.label}`;
        const cardIds = [pair.leanCardId, pair.verbCardId].filter((id): id is string => id !== null);
        out.push({
          profile: compositionProfile(classRoot, form, profileId),
          reference: {
            profileId,
            lineageId: lineage.id,
            // The row's lanes are `pair.lean` / `pair.verb`; `lane` stays null so
            // nothing downstream mistakes a composition for a pure lane.
            lane: null,
            classRoot,
            frameId: frame.frameId,
            bandTier: 1,
            baseForm: form,
            wornForm: form,
            homeBiome: lineage.homeBiome,
            cardIds,
            activeCardIds: cardIds,
            shardsUnobtainableAtT1: false,
            pair,
            className,
          },
        });
      }
    }
  }
  return out;
}

/** The compact row this bench writes — what the composition report reads. */
export interface CompositionLaneRow {
  cellId: string;
  lineageId: string;
  cls: string;
  pair: string;
  lean: PacketId | null;
  verb: PacketId | null;
  nodeId: string;
  seed: number;
  kills: number;
  deaths: number;
  engagedMs: number;
  capMs: number;
  damageDealt: number;
  damageTaken: number;
  refusals: string[];
  /** Landed applications of the verb (its `card-fx` count), or 0 on the control. */
  verbFires: number;
  fxByCard: Record<string, number>;
  wallMs: number;
}

async function main(): Promise<void> {
  const outPath = resolve(process.argv[2] ?? '../reports/course-correction/matrix-lanes.jsonl');
  const shards = Number(process.env.LANE_SHARDS ?? 1);
  const shard = Number(process.env.LANE_SHARD ?? 0);
  assert(Number.isInteger(shards) && shards >= 1 && shard >= 0 && shard < shards, 'LANE_SHARD must be in [0, LANE_SHARDS)');
  const nSeeds = Number(process.env.CMP_SEEDS ?? 10);
  assert(nSeeds >= 1 && nSeeds <= SEEDS.length, `CMP_SEEDS must be 1..${SEEDS.length}`);
  const seeds = SEEDS.slice(0, nSeeds);
  const capMs = Number(process.env.CMP_CAP_MS ?? 90_000);
  const filter = process.env.CMP_FILTER;

  const artifact = process.env.LANE_HITBOX ?? join(tmpdir(), 'mmo-lane-matrix-hitboxes.json');
  if (!existsSync(artifact)) await writeHitboxArtifact(artifact);
  assert(hydrateHitboxCacheFromArtifact(artifact) > 0, 'hitbox cache is empty');

  // The home biome's family-dominated T1 nodes, per lineage.
  const allNodes = laneNodes();
  const homeNodes = (homeBiome: string): LaneNode[] => allNodes
    .filter((n) => n.tier === 1 && n.biome === homeBiome && n.dominantShare >= OWN_NODE_SHARE);

  // Resume: the (cell, seed) pairs already measured — in this output AND in every
  // other `.jsonl` beside it, so a run restarted with a different shard count
  // (more processes freed up) skips what any earlier shard already wrote.
  const done = new Set<string>();
  const dir = dirname(outPath);
  for (const file of existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.jsonl')) : []) {
    for (const line of readFileSync(join(dir, file), 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const row = JSON.parse(line) as CompositionLaneRow;
        if (row.cellId && row.seed !== undefined) done.add(`${row.cellId}#${row.seed}`);
      } catch { /* a torn last line from a killed run: measured again */ }
    }
  }

  const jobs = references()
    .filter(({ reference }) => !filter || reference.profileId.includes(filter))
    .flatMap(({ reference, profile }) => {
      const nodes = homeNodes(LINEAGE_DATABASE.get(reference.lineageId)!.homeBiome);
      assert(nodes.length > 0, `${reference.lineageId}: no family-dominated T1 node in its home biome`);
      return nodes.map((node) => ({ reference, profile, node }));
    });
  const mine = jobs.filter((_, index) => index % shards === shard);
  console.log(`composition lanes: ${jobs.length} jobs x ${seeds.length} seeds; shard ${shard}/${shards} runs ${mine.length} jobs; ${done.size} rows already in ${outPath}`);

  const started = Date.now();
  let measured = 0;
  for (const { reference, profile, node } of mine) {
    const cellId = `${profile.id}@${node.nodeId}`;
    let kills = 0;
    let fires = 0;
    let refused = '';
    for (const seed of seeds) {
      if (done.has(`${cellId}#${seed}`)) continue;
      const t0 = Date.now();
      const row = measure(profile, reference, null, node, seed, capMs);
      const verbFires = reference.pair.verbCardId ? row.fxByCard?.[reference.pair.verbCardId] ?? 0 : 0;
      const out: CompositionLaneRow = {
        cellId,
        lineageId: reference.lineageId,
        cls: reference.className,
        pair: reference.pair.label,
        lean: reference.pair.lean,
        verb: reference.pair.verb,
        nodeId: node.nodeId,
        seed,
        kills: row.kills,
        deaths: row.deaths,
        engagedMs: row.engagedMs,
        capMs: row.capMs,
        damageDealt: Math.round(row.damageDealt),
        damageTaken: Math.round(row.damageTaken ?? 0),
        refusals: row.refusals,
        verbFires,
        fxByCard: row.fxByCard ?? {},
        wallMs: Date.now() - t0,
      };
      appendFileSync(outPath, `${JSON.stringify(out)}\n`);
      kills += row.kills;
      fires += verbFires;
      if (row.refusals.length) refused = ` REFUSED ${row.refusals.join('; ')}`;
      measured += 1;
    }
    console.log(`${profile.id.padEnd(44)} ${node.nodeId.padEnd(20)} kills=${String(kills).padStart(4)} verb=${String(fires).padStart(4)}${refused}`);
  }
  console.log(`\nshard ${shard}/${shards}: ${measured} rows in ${((Date.now() - started) / 60_000).toFixed(1)} min -> ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
