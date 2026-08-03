import {
  CLEARING_NODE_ID,
  MONSTER_DATABASE,
  NODE_BIOMES,
  RECIPE_DATABASE,
  type Recipe,
  biomeLevelCap,
  coreIsActive,
  isRestrictedCore,
  listBiomeGroupsAtTier,
} from '@mmo-idle/shared';
import { findDungeonNodeFor } from '../../src/world/nodePath';
import {
  OVERLORD_PARTY_SIZE,
  type BuildSpec,
  type ContentTarget,
  type GearSlot,
  type MatrixFilter,
} from './types';

const CLASS_ROOTS = [
  'cadence-root',
  'cooldown-root',
  'reload-root',
  'energy-root',
  'dot-root',
  'summoner-root',
] as const;

const VARIANTS = ['light', 'balanced', 'heavy'] as const;
/**
 * Range-node SUFFIXES. Real skill ids are class-prefixed (`cadence-range-close`),
 * so these are always emitted as `${prefix}-${range}` — pushing the bare suffix
 * threw `unlock failed: range-close` and crashed every run deep enough to pick a
 * range, i.e. all of `--all-paths` and ALL content tiers >= 3. Fixed 2026-08-02.
 */
const RANGES = ['range-close', 'range-mid', 'range-far'] as const;
const T3_CHOICES = ['a', 'b', 'c'] as const;

const GEAR_SLOTS: GearSlot[] = ['weapon', 'armor', 'recovery', 'mobility', 'core'];

/** Cooldown heavy T3 has no server logic yet. Reload T3 is fully implemented. */
export const UNIMPLEMENTED_T3_IDS = new Set<string>([
  'cooldown-heavy-t3-a',
  'cooldown-heavy-t3-b',
  'cooldown-heavy-t3-c',
]);

export function maxSkillTreeTierForContent(contentTier: number): number {
  return Math.max(0, contentTier - 1);
}

function classPrefixFromRoot(classRoot: string): string {
  return classRoot.replace(/-root$/, '');
}

/**
 * The headline stat each slot is ranked by when choosing the "best" item.
 *
 * `core` is absent on purpose: cores carry `stats: {}` and express all of their
 * power through `mechanicEffects` (`core.*` multipliers), so they are scored by
 * {@link coreScore} instead of {@link gearScore}.
 */
const SLOT_PRIMARY_STAT: Record<Exclude<GearSlot, 'core'>, string> = {
  weapon: 'attack',
  armor: 'damageReduction',
  recovery: 'hpRegen',
  mobility: 'speed',
};

/**
 * Rank a recipe within its slot. Primary stat dominates; total stat magnitude is
 * a tiebreaker so a richer item wins when primaries tie. (Bench bots run fully
 * upgraded, so base stats are a faithful proxy for final power.)
 */
function gearScore(recipe: Recipe, slot: Exclude<GearSlot, 'core'>): number {
  const stats = recipe.stats as Record<string, number>;
  const primary = stats[SLOT_PRIMARY_STAT[slot]] ?? 0;
  let total = 0;
  for (const v of Object.values(stats)) total += v;
  return primary * 1000 + total;
}

/**
 * Rank a core by the total budget it spends, using ABSOLUTE magnitudes.
 *
 * Cores are authored with deliberate tradeoffs — the Sniper Core's `-15% maxHp`
 * is *paying for* its `+25% attack`, not a penalty. Summing signed values would
 * rank tradeoff cores far below pure-upside ones and systematically dress every
 * bot in defensive cores, biasing the whole DPS matrix. Absolute magnitude is the
 * closest available proxy for "how much power this core is allowed to move".
 */
function coreScore(recipe: Recipe): number {
  let total = 0;
  for (const v of Object.values(recipe.mechanicEffects ?? {})) total += Math.abs(v);
  return total;
}

/**
 * Is this recipe equippable by a fresh bench bot (not gated behind a boss clear)?
 *
 * `requiredBossClear` is the only gate needed: ultimate gear is expressed as an
 * `ultimate:<boss>` clear token, so it is already excluded. (A second
 * `recipe.ultimate` check used to sit here — `Recipe` has no such field, so it
 * was dead. Removed 2026-08-02 when the benches were first typechecked.)
 */
function isBenchEquippable(recipe: Recipe, playerTier: number): boolean {
  if (recipe.requiredBossClear) return false;
  // Cap is a flat function of player tier, so this gate is biome-independent.
  return recipe.requiredBiomeLevel <= biomeLevelCap(playerTier, recipe.recipeGroup);
}

/**
 * Pick the best gear item for a slot at a given tier. Prefers the native biome's
 * own gear (so solo runs wear the loadout a player farming that biome would
 * craft); when the native biome has no eligible item for the slot (e.g. abyss,
 * whose only T4 gear is ultimate/boss-gated), it falls back to the best
 * non-ultimate item of that tier from any biome — the strongest gear a player
 * could realistically bring into the fight.
 */
function bestGearForSlot(
  slot: Exclude<GearSlot, 'core'>,
  gearTier: number,
  biomeGroup: string,
  playerTier: number,
): string | undefined {
  let nativeBest: Recipe | undefined;
  let anyBest: Recipe | undefined;

  for (const recipe of RECIPE_DATABASE.values()) {
    if (recipe.slot !== slot) continue;
    if (recipe.tier !== gearTier) continue;
    if (!isBenchEquippable(recipe, playerTier)) continue;

    if (!anyBest || gearScore(recipe, slot) > gearScore(anyBest, slot)) {
      anyBest = recipe;
    }
    if (recipe.recipeGroup === biomeGroup) {
      if (!nativeBest || gearScore(recipe, slot) > gearScore(nativeBest, slot)) {
        nativeBest = recipe;
      }
    }
  }

  return (nativeBest ?? anyBest)?.id;
}

/**
 * Pick the core this build would actually wear.
 *
 * A core only contributes if `coreIsActive` says so, so an ineligible core is worth
 * exactly nothing — equipping one would silently under-power the bot. We therefore
 * filter to eligible cores first, then prefer a RESTRICTED core (melee/ranged) over an
 * unrestricted one — matching your build is the entire point of the system, and
 * unrestricted is the deliberately weaker always-on fallback — and only then rank by
 * budget. A build with no range node yet (T1/T2 runs) can wear unrestricted cores
 * alone, which is correct: restricted cores do not unlock until player tier 3.
 */
function bestCoreForBuild(
  gearTier: number,
  biomeGroup: string,
  playerTier: number,
  selectedRange: string | null,
): string | undefined {
  let best: Recipe | undefined;
  let bestRank = -1;

  for (const recipe of RECIPE_DATABASE.values()) {
    if (recipe.slot !== 'core') continue;
    if (recipe.tier !== gearTier) continue;
    if (!isBenchEquippable(recipe, playerTier)) continue;
    if (!coreIsActive(recipe.coreEligibility, selectedRange)) continue;

    // Rank: native+restricted > restricted > native unrestricted > unrestricted.
    const rank =
      (isRestrictedCore(recipe.coreEligibility) ? 2 : 0) +
      (recipe.recipeGroup === biomeGroup ? 1 : 0);
    if (rank > bestRank || (rank === bestRank && best && coreScore(recipe) > coreScore(best))) {
      best = recipe;
      bestRank = rank;
    }
  }

  return best?.id;
}

/** The tier-2 range node in a skill path, in the same form `selectedRange` holds. */
export function selectedRangeFromSkillPath(skillPath: string[]): string | null {
  return skillPath.find((id) => id.includes('-range-')) ?? null;
}

export function resolveGearLoadout(
  biomeGroup: string,
  gearTier: number,
  playerTier: number,
  selectedRange: string | null = null,
): Partial<Record<GearSlot, string>> {
  const loadout: Partial<Record<GearSlot, string>> = {};
  for (const slot of GEAR_SLOTS) {
    const id =
      slot === 'core'
        ? bestCoreForBuild(gearTier, biomeGroup, playerTier, selectedRange)
        : bestGearForSlot(slot, gearTier, biomeGroup, playerTier);
    if (id) loadout[slot] = id;
  }
  return loadout;
}

function makeBuildSpec(
  skillPath: string[],
  classRoot: string,
  contentTier: number,
  biomeGroup: string,
): BuildSpec {
  const playerTier = contentTier;
  const gearTier = contentTier;
  return {
    id: skillPath.join('+'),
    classRoot,
    skillPath,
    contentTier,
    playerTier,
    gearTier,
    gearItemIds: resolveGearLoadout(
      biomeGroup,
      gearTier,
      playerTier,
      selectedRangeFromSkillPath(skillPath),
    ),
  };
}

/** Deepest skill-tree tier with implemented server logic (T3 path modifiers). */
export const MAX_IMPLEMENTED_SKILL_TIER = 3;

export function enumerateBuildsForContentTier(
  contentTier: number,
  biomeGroup: string,
  filter?: MatrixFilter,
  allPaths = false,
): BuildSpec[] {
  // "All paths" explores the full perk space (every variant × range × T3 path),
  // ignoring the realistic per-tier skill-depth cap.
  const maxSkillTier = allPaths
    ? MAX_IMPLEMENTED_SKILL_TIER
    : maxSkillTreeTierForContent(contentTier);
  const builds: BuildSpec[] = [];

  for (const classRoot of CLASS_ROOTS) {
    if (filter?.classRoot && filter.classRoot !== classRoot) continue;

    const prefix = classPrefixFromRoot(classRoot);

    if (maxSkillTier >= 3) {
      for (const variant of VARIANTS) {
        for (const range of RANGES) {
          for (const choice of T3_CHOICES) {
            const t3Id = `${prefix}-${variant}-t3-${choice}`;
            if (UNIMPLEMENTED_T3_IDS.has(t3Id)) continue;
            const skillPath = [
              classRoot,
              `${prefix}-${variant}`,
              `${prefix}-${range}`,
              t3Id,
            ];
            builds.push(
              makeBuildSpec(skillPath, classRoot, contentTier, biomeGroup),
            );
          }
        }
      }
    } else if (maxSkillTier >= 2) {
      for (const variant of VARIANTS) {
        for (const range of RANGES) {
          const skillPath = [classRoot, `${prefix}-${variant}`, `${prefix}-${range}`];
          builds.push(
            makeBuildSpec(skillPath, classRoot, contentTier, biomeGroup),
          );
        }
      }
    } else if (maxSkillTier >= 1) {
      for (const variant of VARIANTS) {
        const skillPath = [classRoot, `${prefix}-${variant}`];
        builds.push(
          makeBuildSpec(skillPath, classRoot, contentTier, biomeGroup),
        );
      }
    } else {
      const skillPath = [classRoot];
      builds.push(
        makeBuildSpec(skillPath, classRoot, contentTier, biomeGroup),
      );
    }
  }

  if (filter?.build) {
    return builds.filter((b) => b.id === filter.build);
  }

  return builds;
}

/**
 * One representative build per class root — the deepest path whose range node
 * best fits that archetype, breaking ties on build id so the pick is stable.
 *
 * Farm income is dominated by clear speed, so the useful per-class question
 * ("does any class farm dramatically faster than the others?") is answered
 * without the ~25x cost of running the whole perk matrix for hours of sim time
 * per entry. `--all-builds` opts into the full enumeration.
 */
export function representativeBuildsPerClass(
  contentTier: number,
  biomeGroup: string,
  filter?: MatrixFilter,
): BuildSpec[] {
  const builds = enumerateBuildsForContentTier(contentTier, biomeGroup, filter);
  const picks: BuildSpec[] = [];
  for (const group of groupBuildsByClass(builds)) {
    const best = [...group.builds].sort(
      (a, b) => rangeFitScore(b) - rangeFitScore(a) || a.id.localeCompare(b.id),
    )[0];
    if (best) picks.push(best);
  }
  return picks;
}

/**
 * Every overlord encounter in the world: a dungeon node whose boss is an
 * objective-driven `ultimateEncounter`. Currently just the void-overlord
 * (`node-10-0`, abyss T4), but new overlords are picked up automatically.
 */
export function enumerateOverlordTargets(filter?: MatrixFilter): ContentTarget[] {
  const targets: ContentTarget[] = [];
  for (const [nodeId, info] of Object.entries(NODE_BIOMES)) {
    if (!info.isDungeon || !info.bossTypeId) continue;
    if (!MONSTER_DATABASE.get(info.bossTypeId)?.ultimateEncounter) continue;
    if (filter?.biome && filter.biome !== info.biomeGroup) continue;
    targets.push({
      nodeId,
      biomeGroup: info.biomeGroup,
      contentTier: info.biomeTier,
      isDungeon: true,
    });
  }
  return targets;
}

interface ClassGroup {
  classRoot: string;
  builds: BuildSpec[];
}

/** Group builds by class root, preserving `CLASS_ROOTS` order; drops empty classes. */
function groupBuildsByClass(builds: BuildSpec[]): ClassGroup[] {
  const byClass = new Map<string, BuildSpec[]>();
  for (const b of builds) {
    const arr = byClass.get(b.classRoot);
    if (arr) arr.push(b);
    else byClass.set(b.classRoot, [b]);
  }
  const groups: ClassGroup[] = [];
  for (const classRoot of CLASS_ROOTS) {
    const arr = byClass.get(classRoot);
    if (arr && arr.length > 0) groups.push({ classRoot, builds: arr });
  }
  return groups;
}

/** Lazy `k`-combinations of `[0, n)`, yielded as ascending index tuples. */
function* indexCombinations(n: number, k: number): Generator<number[]> {
  if (k < 0 || k > n) return;
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    yield idx.slice();
    let p = k - 1;
    while (p >= 0 && idx[p] === n - k + p) p--;
    if (p < 0) break;
    idx[p]++;
    for (let q = p + 1; q < k; q++) idx[q] = idx[q - 1] + 1;
  }
}

/** Cartesian product across groups — one build picked from each group. */
function* cartesianBuilds(groups: ClassGroup[]): Generator<BuildSpec[]> {
  if (groups.length === 0) {
    yield [];
    return;
  }
  const counts = groups.map((g) => g.builds.length);
  const pick = new Array<number>(groups.length).fill(0);
  while (true) {
    yield groups.map((g, i) => g.builds[pick[i]]);
    let p = groups.length - 1;
    while (p >= 0 && pick[p] === counts[p] - 1) {
      pick[p] = 0;
      p--;
    }
    if (p < 0) break;
    pick[p]++;
  }
}

/** `e_k` — the elementary symmetric polynomial (sum of all `k`-subset products). */
function elementarySymmetric(counts: number[], k: number): number {
  if (k < 0) return 0;
  const e = new Array<number>(k + 1).fill(0);
  e[0] = 1;
  for (const c of counts) {
    for (let j = k; j >= 1; j--) e[j] += e[j - 1] * c;
  }
  return e[k];
}

function classOrderIndex(classRoot: string): number {
  return CLASS_ROOTS.indexOf(classRoot as (typeof CLASS_ROOTS)[number]);
}

/**
 * The set of `size`-distinct-class strata. Each combo is a list of class groups
 * in `CLASS_ROOTS` order. When `lockClass` is set, every combo includes it.
 */
function classCombos(
  groups: ClassGroup[],
  lockClass: string | undefined,
  size: number,
): ClassGroup[][] {
  if (groups.length < size) return [];
  const combos: ClassGroup[][] = [];

  if (lockClass) {
    const lockIdx = groups.findIndex((g) => g.classRoot === lockClass);
    if (lockIdx < 0) return [];
    const lockGroup = groups[lockIdx];
    const others = groups.filter((_, i) => i !== lockIdx);
    for (const combo of indexCombinations(others.length, size - 1)) {
      const chosen = [lockGroup, ...combo.map((i) => others[i])].sort(
        (a, b) => classOrderIndex(a.classRoot) - classOrderIndex(b.classRoot),
      );
      combos.push(chosen);
    }
    return combos;
  }

  for (const combo of indexCombinations(groups.length, size)) {
    combos.push(combo.map((i) => groups[i]));
  }
  return combos;
}

/**
 * Every overlord party: `size` builds drawn from `size` **distinct** classes
 * (no class appears twice — a realistic group never runs 4 of one class). When
 * `lockClass` is set, every party is guaranteed to include one build of that
 * class (the "locked slot"), with the remaining slots filled from distinct other
 * classes. Yielded lazily; classes are kept in `CLASS_ROOTS` order so the
 * partition is deterministic for sharding.
 */
export function* enumerateDistinctClassParties(
  builds: BuildSpec[],
  lockClass?: string,
  size = OVERLORD_PARTY_SIZE,
): Generator<BuildSpec[]> {
  const groups = groupBuildsByClass(builds);
  for (const combo of classCombos(groups, lockClass, size)) {
    yield* cartesianBuilds(combo);
  }
}

/** Exact count of distinct-class parties (mirrors `enumerateDistinctClassParties`). */
export function countDistinctClassParties(
  builds: BuildSpec[],
  lockClass?: string,
  size = OVERLORD_PARTY_SIZE,
): number {
  const groups = groupBuildsByClass(builds);
  if (groups.length < size) return 0;

  if (lockClass) {
    const lockIdx = groups.findIndex((g) => g.classRoot === lockClass);
    if (lockIdx < 0) return 0;
    const lockCount = groups[lockIdx].builds.length;
    const otherCounts = groups
      .filter((_, i) => i !== lockIdx)
      .map((g) => g.builds.length);
    return lockCount * elementarySymmetric(otherCounts, size - 1);
  }

  return elementarySymmetric(
    groups.map((g) => g.builds.length),
    size,
  );
}

// ── Stratified random sampling (overlord) ───────────────────────────────────

/** Deterministic seed so every shard process samples the identical scenarios. */
const SAMPLE_SEED = 0x9e3779b9;

/** Small fast PRNG; deterministic given a seed (so samples are reproducible). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MELEE_PREFIXES = new Set(['cadence', 'cooldown']);
const RANGED_PREFIXES = new Set(['energy', 'reload']);

/**
 * The range choice as a bare `range-<kind>` tag.
 *
 * Real skill ids are class-prefixed (`cadence-range-close`), so comparing a path
 * entry against the bare suffix matched NOTHING: every build scored "neutral"
 * and the optimized-first party ordering below was silently a no-op. Same root
 * cause as the `unlock failed: range-close` crash. Fixed 2026-08-02.
 */
function rangeNodeOf(build: BuildSpec): string | null {
  const id = selectedRangeFromSkillPath(build.skillPath);
  if (!id) return null;
  for (const range of RANGES) {
    if (id.endsWith(`-${range}`)) return range;
  }
  return null;
}

/**
 * "Optimized" score by range-node fit: 2 = ideal range for the archetype,
 * 1 = acceptable/neutral, 0 = mismatched. Melee wants close, ranged wants
 * far/mid, DoT wants mid; summoner is treated as ranged-leaning (best guess).
 */
function rangeFitScore(build: BuildSpec): 0 | 1 | 2 {
  const prefix = classPrefixFromRoot(build.classRoot);
  const range = rangeNodeOf(build);
  if (range === null) return 1; // shallow build with no range node → neutral
  if (MELEE_PREFIXES.has(prefix)) {
    return range === 'range-close' ? 2 : range === 'range-mid' ? 1 : 0;
  }
  if (RANGED_PREFIXES.has(prefix)) {
    return range === 'range-far' || range === 'range-mid' ? 2 : 0;
  }
  if (prefix === 'dot') {
    return range === 'range-mid' ? 2 : 1;
  }
  // summoner / unknown → ranged-leaning.
  return range === 'range-far' || range === 'range-mid' ? 2 : 1;
}

/** Sort builds optimized-first (range fit desc); shuffle within equal score for variety. */
function prioritizeBuilds(builds: BuildSpec[], rng: () => number): BuildSpec[] {
  return builds
    .map((b) => ({ b, score: rangeFitScore(b), jitter: rng() }))
    .sort((x, y) => y.score - x.score || x.jitter - y.jitter)
    .map((x) => x.b);
}

/** Index tuples bounded by `lengths`, summing to exactly `remaining`, from `pos`. */
function* boundedCompositions(
  remaining: number,
  lengths: number[],
  pos: number,
): Generator<number[]> {
  if (pos === lengths.length - 1) {
    if (remaining <= lengths[pos] - 1) yield [remaining];
    return;
  }
  const maxHere = Math.min(remaining, lengths[pos] - 1);
  for (let v = 0; v <= maxHere; v++) {
    for (const rest of boundedCompositions(remaining - v, lengths, pos + 1)) {
      yield [v, ...rest];
    }
  }
}

/**
 * Index tuples over the cartesian product of `lengths`, yielded in ascending
 * coordinate-sum order. With per-class lists pre-sorted optimized-first, low
 * coordinate sums = the most optimized parties, so these come first.
 */
function* diagonalIndexTuples(lengths: number[]): Generator<number[]> {
  const maxSum = lengths.reduce((acc, l) => acc + (l - 1), 0);
  for (let s = 0; s <= maxSum; s++) {
    yield* boundedCompositions(s, lengths, 0);
  }
}

/**
 * Up to `target` overlord parties, sampled to (1) spread evenly across class
 * archetypes (round-robin over the distinct-class strata), (2) spot-check build
 * variants rather than exhaust them, and (3) prioritize "optimized" builds —
 * those whose range node fits their archetype — over mismatched ones.
 *
 * Deterministic (fixed seed) so every shard process produces the same ordered
 * sample and simulates its slice. If `target` exceeds the full space it simply
 * degrades to a full (optimized-first) enumeration.
 */
export function* sampleDistinctClassParties(
  builds: BuildSpec[],
  lockClass: string | undefined,
  target: number,
  size = OVERLORD_PARTY_SIZE,
): Generator<BuildSpec[]> {
  if (target <= 0) return;
  const groups = groupBuildsByClass(builds);
  const combos = classCombos(groups, lockClass, size);
  if (combos.length === 0) return;

  const rng = mulberry32(SAMPLE_SEED);
  const streams = combos.map((combo) => {
    const lists = combo.map((g) => prioritizeBuilds(g.builds, rng));
    return {
      lists,
      gen: diagonalIndexTuples(lists.map((l) => l.length)),
      done: false,
    };
  });

  let produced = 0;
  let active = true;
  while (produced < target && active) {
    active = false;
    for (const st of streams) {
      if (st.done) continue;
      const next = st.gen.next();
      if (next.done) {
        st.done = true;
        continue;
      }
      active = true;
      yield st.lists.map((list, i) => list[next.value[i]]);
      produced++;
      if (produced >= target) return;
    }
  }
}

export function enumerateContentTargets(
  tiers: number[],
  filter?: MatrixFilter,
): ContentTarget[] {
  const targets: ContentTarget[] = [];

  for (const tier of tiers) {
    if (tier === 0) {
      if (filter?.biome && filter.biome !== 'clearing') continue;
      targets.push({
        // Was the pre-map-rework `node-5-5`, an id that no longer exists — the
        // node resolved to nothing, so every tier-0 match reported an instant
        // `clear` against an empty arena. Fixed 2026-08-02.
        nodeId: CLEARING_NODE_ID,
        biomeGroup: 'clearing',
        contentTier: 0,
        isDungeon: false,
      });
      continue;
    }

    for (const biomeGroup of listBiomeGroupsAtTier(tier)) {
      if (filter?.biome && filter.biome !== biomeGroup) continue;
      const nodeId = findDungeonNodeFor(biomeGroup, tier);
      // Not every biome has a dungeon at every tier (e.g. cave T2). Those
      // biomes have no boss content to benchmark, so skip them.
      if (!nodeId) continue;
      targets.push({
        nodeId,
        biomeGroup,
        contentTier: tier,
        isDungeon: true,
      });
    }
  }

  return targets;
}
