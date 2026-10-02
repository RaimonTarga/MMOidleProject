import {
  FAMILY_DATABASE,
  blendShareTotal,
  type NodeBlend,
} from '../../data/families';
import {
  MODIFIER_BANS,
  NATIVE_MODIFIER,
  NODE_MODIFIER_FAMILIES,
  type NodeModifierFamily,
} from '../nodeModifierTypes';
import type {
  WorldMapCoord,
  WorldNodeAuthoring,
  WorldRegionId,
} from './types';
import {
  resolveDungeonNodeDisplayName,
  resolveNormalNodeDisplayName,
} from './displayNames';

interface RegionSpecialNode
  extends Omit<WorldNodeAuthoring, 'regionId' | 'biomeTier'> {
  biomeTier?: number;
}

export interface RegionAuthoringInput {
  regionId: WorldRegionId;
  tier: number;
  origin: WorldMapCoord;
  mask: readonly string[];
  biomes: readonly string[];
  specials: readonly RegionSpecialNode[];
  dungeonCells: readonly WorldMapCoord[];
  /**
   * Per-biome node blends (design 12), one per normal node of that biome.
   *
   * THIS LIST IS THE BIOME'S NODE COUNT. It took that job from the modifier
   * list (see the warning on `MODIFIER_BANS`): `normalNodeCountForBiome` reads the
   * blend list where one exists and the modifier list where none does. The
   * hand-cut region masks are sized to that count exactly, so adding or removing a
   * blend changes how many cells the biome needs and will break its mask.
   *
   * T2's blend lists stay exactly as long as their biome's modifier sequence
   * (Phase 2a's dual-authored state: a T2 node still carries `modifier` too,
   * and several bot routes select T2 farm nodes by it). Only T1 (`dropsModifier`
   * below) has moved past that.
   */
  blends?: Readonly<Record<string, readonly NodeBlend[]>>;
  /**
   * Phase 2b (2026-10-01), T1 only: a blended normal node carries no
   * `modifier` field at all any more (cosmetic only -- shard granting is
   * family-keyed). Display names still draw from the SAME modifier-keyed
   * table, but only as an authoring-time lookup: `buildRegionNodes` takes a
   * PREFIX of the biome's modifier sequence, as long as `blends[biome]`, to
   * name its nodes, and never attaches a `modifier` to the pushed node. That
   * lets a blend list be shorter than the modifier sequence (e.g. Cave/Swamp's
   * re-cut from six nodes to five) without touching `MODIFIER_BANS` or
   * `NATIVE_MODIFIER`, which stay T2's (and a future T3/T4's) node-count and
   * `modifier`-field source.
   */
  dropsModifier?: boolean;
}

function cellKey(coord: WorldMapCoord): string {
  return `${coord.row},${coord.col}`;
}

const CARDINAL_OFFSETS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

function neighboringKeys(coord: WorldMapCoord): string[] {
  return CARDINAL_OFFSETS.map(([rowOffset, colOffset]) =>
    cellKey({
      row: coord.row + rowOffset,
      col: coord.col + colOffset,
    }),
  );
}

function organicNoise(
  coord: WorldMapCoord,
  biomeIndex: number,
  tier: number,
): number {
  let value =
    coord.row * 73856093 ^
    coord.col * 19349663 ^
    biomeIndex * 83492791 ^
    tier * 2654435761;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) & 31;
}

function straightLinePenalty(
  coord: WorldMapCoord,
  claimed: ReadonlySet<string>,
): number {
  let penalty = 0;
  for (const [rowOffset, colOffset] of [
    [0, 1],
    [1, 0],
  ] as const) {
    const negativeOne = cellKey({
      row: coord.row - rowOffset,
      col: coord.col - colOffset,
    });
    const negativeTwo = cellKey({
      row: coord.row - rowOffset * 2,
      col: coord.col - colOffset * 2,
    });
    const positiveOne = cellKey({
      row: coord.row + rowOffset,
      col: coord.col + colOffset,
    });
    const positiveTwo = cellKey({
      row: coord.row + rowOffset * 2,
      col: coord.col + colOffset * 2,
    });
    if (claimed.has(negativeOne) && claimed.has(negativeTwo)) penalty += 240;
    if (claimed.has(positiveOne) && claimed.has(positiveTwo)) penalty += 240;
    if (claimed.has(negativeOne) && claimed.has(positiveOne)) penalty += 320;
  }
  return penalty;
}

function allocateNormalCellsByBiome(
  input: RegionAuthoringInput,
  normalCells: readonly WorldMapCoord[],
): Map<string, WorldMapCoord[]> {
  const remaining = new Map(normalCells.map((coord) => [cellKey(coord), coord]));
  const territories = input.biomes.map((biomeGroup, biomeIndex) => {
    const capacity = normalNodeCountForBiome(input, biomeGroup);
    const seed = input.dungeonCells[biomeIndex];
    return {
      biomeGroup,
      biomeIndex,
      capacity,
      seed,
      cells: [] as WorldMapCoord[],
      claimed: new Set([cellKey(seed)]),
    };
  });

  let attempts = 0;
  function growTerritories(): boolean {
    attempts += 1;
    if (attempts > 250_000) return false;
    if (remaining.size === 0) return true;

    const options = territories
      .filter((territory) => territory.cells.length < territory.capacity)
      .map((territory) => ({
        territory,
        candidates: [...remaining.values()].filter((coord) =>
          neighboringKeys(coord).some((key) => territory.claimed.has(key)),
        ),
      }))
      .sort(
        (a, b) =>
          a.candidates.length - b.candidates.length ||
          b.territory.capacity -
            b.territory.cells.length -
            (a.territory.capacity - a.territory.cells.length) ||
          a.territory.biomeIndex - b.territory.biomeIndex,
      );
    const next = options[0];
    if (!next || next.candidates.length === 0) return false;

    next.candidates.sort((a, b) => {
      const score = (coord: WorldMapCoord) => {
        const distance =
          Math.abs(coord.row - next.territory.seed.row) +
          Math.abs(coord.col - next.territory.seed.col);
        const sameBiomeNeighbors = neighboringKeys(coord).filter((key) =>
          next.territory.claimed.has(key),
        ).length;
        return (
          distance * 100 -
          sameBiomeNeighbors * 34 +
          straightLinePenalty(coord, next.territory.claimed) +
          organicNoise(
            coord,
            next.territory.biomeIndex,
            input.tier,
          )
        );
      };
      return score(a) - score(b) || a.row - b.row || a.col - b.col;
    });

    for (const candidate of next.candidates) {
      const key = cellKey(candidate);
      next.territory.cells.push(candidate);
      next.territory.claimed.add(key);
      remaining.delete(key);
      if (growTerritories()) return true;
      remaining.set(key, candidate);
      next.territory.claimed.delete(key);
      next.territory.cells.pop();
    }
    return false;
  }

  if (!growTerritories()) {
    throw new Error(
      `${input.regionId}: could not grow connected biome territories after ${attempts} attempts`,
    );
  }

  const assignment = new Map<string, string>();
  const layoutCells = [...normalCells, ...input.dungeonCells];
  for (const territory of territories) {
    assignment.set(cellKey(territory.seed), territory.biomeGroup);
    for (const coord of territory.cells) {
      assignment.set(cellKey(coord), territory.biomeGroup);
    }
  }

  function territoryIsConnected(territory: (typeof territories)[number]): boolean {
    const allowed = new Set([
      cellKey(territory.seed),
      ...territory.cells.map(cellKey),
    ]);
    const reached = new Set([cellKey(territory.seed)]);
    const queue = [territory.seed];
    for (let index = 0; index < queue.length; index += 1) {
      for (const neighborKey of neighboringKeys(queue[index])) {
        if (allowed.has(neighborKey) && !reached.has(neighborKey)) {
          reached.add(neighborKey);
          const [row, col] = neighborKey.split(',').map(Number);
          queue.push({ row, col });
        }
      }
    }
    return reached.size === allowed.size;
  }

  function layoutScore(): number {
    const rows = layoutCells.map((coord) => coord.row);
    const cols = layoutCells.map((coord) => coord.col);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    let linePenalty = 0;

    const scoreLine = (values: Array<string | undefined>) => {
      let runLength = 0;
      let previous: string | undefined;
      for (const value of [...values, undefined]) {
        if (value && value === previous) {
          runLength += 1;
          continue;
        }
        if (runLength >= 3) {
          linePenalty += (runLength - 2) ** 2;
        }
        previous = value;
        runLength = value ? 1 : 0;
      }
    };

    for (let row = minRow; row <= maxRow; row += 1) {
      scoreLine(
        Array.from(
          { length: maxCol - minCol + 1 },
          (_, index) => assignment.get(`${row},${minCol + index}`),
        ),
      );
    }
    for (let col = minCol; col <= maxCol; col += 1) {
      scoreLine(
        Array.from(
          { length: maxRow - minRow + 1 },
          (_, index) => assignment.get(`${minRow + index},${col}`),
        ),
      );
    }

    const distancePenalty = territories.reduce(
      (sum, territory) =>
        sum +
        territory.cells.reduce(
          (cellSum, coord) =>
            cellSum +
            Math.abs(coord.row - territory.seed.row) +
            Math.abs(coord.col - territory.seed.col),
          0,
        ),
      0,
    );
    return linePenalty * 500 + distancePenalty;
  }

  // Connected boundary swaps soften long grid-aligned bands without scattering a
  // biome away from its dungeon seed.
  for (let pass = 0; pass < 24; pass += 1) {
    const currentScore = layoutScore();
    let best:
      | {
          territoryA: number;
          cellA: number;
          territoryB: number;
          cellB: number;
          score: number;
        }
      | undefined;

    for (let territoryA = 0; territoryA < territories.length; territoryA += 1) {
      for (
        let territoryB = territoryA + 1;
        territoryB < territories.length;
        territoryB += 1
      ) {
        const a = territories[territoryA];
        const b = territories[territoryB];
        for (let cellA = 0; cellA < a.cells.length; cellA += 1) {
          for (let cellB = 0; cellB < b.cells.length; cellB += 1) {
            const coordA = a.cells[cellA];
            const coordB = b.cells[cellB];
            const keyA = cellKey(coordA);
            const keyB = cellKey(coordB);
            a.cells[cellA] = coordB;
            b.cells[cellB] = coordA;
            assignment.set(keyA, b.biomeGroup);
            assignment.set(keyB, a.biomeGroup);

            if (territoryIsConnected(a) && territoryIsConnected(b)) {
              const score = layoutScore();
              if (score < (best?.score ?? currentScore)) {
                best = { territoryA, cellA, territoryB, cellB, score };
              }
            }

            a.cells[cellA] = coordA;
            b.cells[cellB] = coordB;
            assignment.set(keyA, a.biomeGroup);
            assignment.set(keyB, b.biomeGroup);
          }
        }
      }
    }

    if (!best) break;
    const a = territories[best.territoryA];
    const b = territories[best.territoryB];
    const coordA = a.cells[best.cellA];
    const coordB = b.cells[best.cellB];
    a.cells[best.cellA] = coordB;
    b.cells[best.cellB] = coordA;
    assignment.set(cellKey(coordA), b.biomeGroup);
    assignment.set(cellKey(coordB), a.biomeGroup);
  }

  return new Map(
    territories.map((territory) => [
      territory.biomeGroup,
      territory.cells,
    ]),
  );
}

function maskCells(input: RegionAuthoringInput): WorldMapCoord[] {
  const cells: WorldMapCoord[] = [];
  input.mask.forEach((line, localRow) => {
    const columns: number[] = [];
    for (let localCol = 0; localCol < line.length; localCol += 1) {
      if (line[localCol] === '#') columns.push(localCol);
    }
    if (localRow % 2 === 1) columns.reverse();
    for (const localCol of columns) {
      cells.push({
        row: input.origin.row + localRow,
        col: input.origin.col + localCol,
      });
    }
  });
  return cells;
}

/**
 * The modifiers a biome may host, in canonical order. Still the source of each
 * normal node's display name and stat scaling; no longer the source of the node
 * COUNT for a biome whose region authors a blend list -- see `blends` above.
 */
function allowedModifiersForBiome(biomeGroup: string): NodeModifierFamily[] {
  const bans = new Set(MODIFIER_BANS[biomeGroup] ?? []);
  return NODE_MODIFIER_FAMILIES.filter((modifier) => !bans.has(modifier));
}

/** One node per allowed modifier, plus a second for the biome's native. */
function modifierSequenceForBiome(biomeGroup: string): NodeModifierFamily[] {
  const allowed = allowedModifiersForBiome(biomeGroup);
  const native = NATIVE_MODIFIER[biomeGroup];
  return native ? [...allowed, native] : allowed;
}

/**
 * How many normal nodes a biome gets: the blend list where the region authors
 * one, the modifier list otherwise. See the warning on `blends`.
 */
function normalNodeCountForBiome(
  input: RegionAuthoringInput,
  biomeGroup: string,
): number {
  return (
    input.blends?.[biomeGroup]?.length ??
    modifierSequenceForBiome(biomeGroup).length
  );
}

/**
 * A blend must name only families of its own biome, and its shares must sum to 1.
 * Authored decimals do not sum exactly in binary, hence the tolerance.
 */
function validateBlend(
  regionId: WorldRegionId,
  biomeGroup: string,
  index: number,
  blend: NodeBlend,
): void {
  const where = `${regionId} ${biomeGroup} blend ${index + 1}`;
  const keys = Object.keys(blend) as (keyof NodeBlend)[];
  if (keys.length === 0) throw new Error(`${where}: empty blend`);
  for (const key of keys) {
    const family = FAMILY_DATABASE.get(key);
    if (!family) throw new Error(`${where}: unknown family '${key}'`);
    if (family.biome !== biomeGroup) {
      throw new Error(`${where}: family '${key}' belongs to ${family.biome}`);
    }
  }
  const total = blendShareTotal(blend);
  if (Math.abs(total - 1) > 1e-6) {
    throw new Error(`${where}: shares sum to ${total}, not 1`);
  }
}

/**
 * Expands a compact, reviewed regional mask into stable canonical node records.
 * Dungeon cells seed connected biome territories; deterministic boundary swaps
 * keep the result compact while avoiding long grid-aligned bands.
 */
export function buildRegionNodes(
  input: RegionAuthoringInput,
): WorldNodeAuthoring[] {
  const allCells = maskCells(input);
  const allCellKeys = new Set(allCells.map(cellKey));
  const occupiedSpecialCells = new Set(
    input.specials.map((special) => cellKey(special.map)),
  );
  const occupiedDungeonCells = new Set(input.dungeonCells.map(cellKey));
  if (input.dungeonCells.length !== input.biomes.length) {
    throw new Error(
      `${input.regionId}: expected one dungeon cell per biome`,
    );
  }
  if (occupiedDungeonCells.size !== input.dungeonCells.length) {
    throw new Error(`${input.regionId}: duplicate dungeon cell`);
  }
  for (const dungeonCell of occupiedDungeonCells) {
    if (!allCellKeys.has(dungeonCell)) {
      throw new Error(`${input.regionId}: dungeon cell ${dungeonCell} is outside its mask`);
    }
    if (occupiedSpecialCells.has(dungeonCell)) {
      throw new Error(`${input.regionId}: dungeon cell ${dungeonCell} overlaps a special`);
    }
  }
  const normalCells = allCells.filter(
    (coord) =>
      !occupiedSpecialCells.has(cellKey(coord)) &&
      !occupiedDungeonCells.has(cellKey(coord)),
  );
  const normalCellsByBiome = allocateNormalCellsByBiome(input, normalCells);
  const nodes: WorldNodeAuthoring[] = input.specials.map((special) => ({
    ...special,
    regionId: input.regionId,
    biomeTier: special.biomeTier ?? input.tier,
  }));

  input.biomes.forEach((biomeGroup, biomeIndex) => {
    const modifiers = modifierSequenceForBiome(biomeGroup);
    const blends = input.blends?.[biomeGroup];
    if (blends && !input.dropsModifier && blends.length !== modifiers.length) {
      throw new Error(
        `${input.regionId} ${biomeGroup}: ${blends.length} blends but ` +
          `${modifiers.length} modifiers -- a region that still attaches the ` +
          'modifier field (the T2 dual-authored state) must keep the two lists ' +
          'the same length',
      );
    }
    if (blends && input.dropsModifier && blends.length > modifiers.length) {
      throw new Error(
        `${input.regionId} ${biomeGroup}: ${blends.length} blends exceed the ` +
          `${modifiers.length} modifiers available to name them`,
      );
    }
    const normalCount = blends ? blends.length : modifiers.length;
    // Naming is still a modifier-table lookup (`dropsModifier` only deletes
    // the node's own `modifier` field; the authored name tables stay keyed by
    // it). A shorter blend list takes a PREFIX of the full modifier sequence
    // -- the native modifier's extra occurrence is always appended last by
    // `modifierSequenceForBiome`, so trimming the tail here is exactly "fewer
    // of the biome's native flavour", never a skipped or duplicated modifier.
    const namingModifiers = blends ? modifiers.slice(0, normalCount) : modifiers;
    const biomeCells = normalCellsByBiome.get(biomeGroup) ?? [];
    const normalNameOccurrences = new Map<NodeModifierFamily, number>();

    for (let normalIndex = 0; normalIndex < normalCount; normalIndex += 1) {
      const map = biomeCells[normalIndex];
      if (!map) {
        throw new Error(
          `${input.regionId}: missing clustered cell for ${biomeGroup}`,
        );
      }
      const blend = blends?.[normalIndex];
      if (blend) validateBlend(input.regionId, biomeGroup, normalIndex, blend);
      const namingModifier = namingModifiers[normalIndex];
      const nameOccurrence = normalNameOccurrences.get(namingModifier) ?? 0;
      normalNameOccurrences.set(namingModifier, nameOccurrence + 1);
      nodes.push({
        id: `node-${input.regionId}-${biomeGroup}-${String(normalIndex + 1).padStart(2, '0')}`,
        displayName: resolveNormalNodeDisplayName(
          input.tier,
          biomeGroup,
          namingModifier,
          nameOccurrence,
        ),
        regionId: input.regionId,
        map,
        kind: 'normal',
        biomeGroup,
        biomeTier: input.tier,
        // A blend-authored T1 node carries no `modifier` at all (Phase 2b:
        // vestigial once a family blend exists). A blend-authored T2 node
        // keeps BOTH (Phase 2a's still-live dual-authored state). Every
        // other node (T3-T4, no blend yet) keeps modifier as its only
        // identity, same as always.
        ...(blend ? { blend } : {}),
        ...(blend && input.dropsModifier ? {} : { modifier: namingModifier }),
        featureSetId: biomeGroup,
        featureVariant: normalIndex,
      });
    }

    const dungeonMap = input.dungeonCells[biomeIndex];
    nodes.push({
      id: `node-${input.regionId}-${biomeGroup}-dungeon`,
      displayName: resolveDungeonNodeDisplayName(input.tier, biomeGroup),
      regionId: input.regionId,
      map: dungeonMap,
      kind: 'dungeon',
      biomeGroup,
      biomeTier: input.tier,
      featureSetId: biomeGroup,
      featureVariant: modifiers.length,
    });
  });

  return nodes;
}
