import { BIOME_DATABASE } from '../../biomeDatabase';
import { MONSTER_DATABASE } from '../../monsterDatabase';
import {
  MODIFIER_BANS,
  NATIVE_MODIFIER,
  NODE_MODIFIER_FAMILIES,
  type NodeModifierFamily,
} from '../nodeModifierTypes';
import {
  WORLD_NODE_LIST,
  WORLD_NODES,
  adjacentWorldNodeIds,
  worldNodeExits,
} from './registry';
import { WORLD_REGIONS } from './regions';
import { validateNodeDisplayNames } from './displayNames';
import type { WorldNodeAuthoring } from './types';

const EXPECTED_ACTIVE_BIOMES: Record<number, readonly string[]> = {
  1: ['forest', 'mountain', 'plains', 'swamp', 'cave'],
  2: ['forest', 'mountain', 'plains', 'swamp', 'cave', 'jungle', 'desert'],
  3: ['mountain', 'swamp', 'cave', 'jungle', 'tundra', 'desert', 'volcanic'],
  4: ['mountain', 'jungle', 'tundra', 'desert', 'volcanic', 'graveyard', 'trench'],
};

const EXPECTED_KIND_COUNTS: Record<string, number> = {
  normal: 140,
  dungeon: 26,
  sanctuary: 3,
  tutorial: 1,
  unique: 0,
};

const EXPECTED_NORMAL_COUNTS: Record<number, number> = {
  1: 27,
  2: 37,
  3: 38,
  4: 38,
};

function reachableWithin(
  startId: string,
  allowed: ReadonlySet<string>,
  excludedId?: string,
): Set<string> {
  if (startId === excludedId || !allowed.has(startId)) return new Set();
  const reached = new Set([startId]);
  const queue = [startId];
  for (let index = 0; index < queue.length; index += 1) {
    for (const neighbor of adjacentWorldNodeIds(queue[index])) {
      if (
        neighbor === excludedId ||
        !allowed.has(neighbor) ||
        reached.has(neighbor)
      ) {
        continue;
      }
      reached.add(neighbor);
      queue.push(neighbor);
    }
  }
  return reached;
}

function validateIdentity(violations: string[]): void {
  const ids = new Set<string>();
  const cells = new Set<string>();
  for (const node of WORLD_NODE_LIST) {
    if (ids.has(node.id)) violations.push(`duplicate node id '${node.id}'`);
    ids.add(node.id);
    const cell = `${node.map.row},${node.map.col}`;
    if (cells.has(cell)) violations.push(`duplicate map cell ${cell}`);
    cells.add(cell);

    const region = WORLD_REGIONS.get(node.regionId);
    if (!region) {
      violations.push(`${node.id}: unknown region '${node.regionId}'`);
    } else if (
      node.kind !== 'tutorial' &&
      node.biomeTier !== region.tier
    ) {
      violations.push(
        `${node.id}: biome tier ${node.biomeTier} does not match ${node.regionId}`,
      );
    }
  }

  for (const region of WORLD_REGIONS.values()) {
    const respawn = WORLD_NODES.get(region.respawnNodeId);
    if (!respawn) {
      violations.push(`${region.id}: missing respawn node '${region.respawnNodeId}'`);
    } else if (respawn.regionId !== region.id) {
      violations.push(`${region.id}: respawn node belongs to ${respawn.regionId}`);
    }
  }
}

function validateKindsAndContent(violations: string[]): void {
  for (const node of WORLD_NODE_LIST) {
    const biome = BIOME_DATABASE.get(node.biomeGroup);
    if (!biome) {
      violations.push(`${node.id}: unknown biome '${node.biomeGroup}'`);
      continue;
    }

    if (node.kind === 'normal') {
      if (!node.modifier) violations.push(`${node.id}: normal node has no modifier`);
      const pool = biome.monsterPoolByTier[node.biomeTier] ?? [];
      if (pool.length === 0) {
        violations.push(`${node.id}: normal node has no monster pool`);
      }
      if (
        node.modifier &&
        (MODIFIER_BANS[node.biomeGroup] ?? []).includes(node.modifier)
      ) {
        violations.push(`${node.id}: banned modifier '${node.modifier}'`);
      }
    } else if (node.kind === 'dungeon') {
      if (node.modifier) {
        violations.push(`${node.id}: dungeon must be modifier-free`);
      }
      if ((biome.bossPoolByTier?.[node.biomeTier] ?? []).length === 0) {
        violations.push(`${node.id}: dungeon has no boss pool`);
      }
    } else if (node.kind === 'sanctuary') {
      if (node.modifier || node.bossTypeId || node.mobDensity !== 0) {
        violations.push(`${node.id}: sanctuary must be empty and modifier-free`);
      }
    } else if (node.kind === 'tutorial') {
      if (node.id !== 'node-clearing' || node.biomeTier !== 0) {
        violations.push(`${node.id}: invalid tutorial-node identity`);
      }
    } else if (node.kind === 'unique') {
      violations.push(`${node.id}: no unique nodes are authored in this stage`);
    }
  }
}

function validateBiomeCoverage(violations: string[]): void {
  for (const [tierText, expectedBiomes] of Object.entries(EXPECTED_ACTIVE_BIOMES)) {
    const tier = Number(tierText);
    const normals = WORLD_NODE_LIST.filter(
      (node) => node.kind === 'normal' && node.biomeTier === tier,
    );
    const dungeons = WORLD_NODE_LIST.filter(
      (node) => node.kind === 'dungeon' && node.biomeTier === tier,
    );

    for (const biomeGroup of expectedBiomes) {
      const biomeNormals = normals.filter(
        (node) => node.biomeGroup === biomeGroup,
      );
      const allowed = NODE_MODIFIER_FAMILIES.filter(
        (modifier) => !(MODIFIER_BANS[biomeGroup] ?? []).includes(modifier),
      );
      const modifierCounts = new Map<NodeModifierFamily, number>();
      for (const node of biomeNormals) {
        if (node.modifier) {
          modifierCounts.set(
            node.modifier,
            (modifierCounts.get(node.modifier) ?? 0) + 1,
          );
        }
      }
      // One node per allowed modifier, two for the biome's native — this is also
      // what fixes the biome's node count against its hand-cut region mask.
      for (const modifier of allowed) {
        const expected = NATIVE_MODIFIER[biomeGroup] === modifier ? 2 : 1;
        if ((modifierCounts.get(modifier) ?? 0) !== expected) {
          violations.push(
            `T${tier} ${biomeGroup}: expected ${expected} '${modifier}' nodes`,
          );
        }
      }

      if (
        dungeons.filter((node) => node.biomeGroup === biomeGroup).length !== 1
      ) {
        violations.push(`T${tier} ${biomeGroup}: expected exactly one dungeon`);
      }
    }

    const actualBiomes = new Set(normals.map((node) => node.biomeGroup));
    for (const biomeGroup of actualBiomes) {
      if (!expectedBiomes.includes(biomeGroup)) {
        violations.push(`T${tier}: unexpected active biome '${biomeGroup}'`);
      }
    }
  }
}

function validateTopology(violations: string[]): void {
  const allIds = new Set(WORLD_NODE_LIST.map((node) => node.id));
  const firstId = WORLD_NODE_LIST[0]?.id;
  if (!firstId || reachableWithin(firstId, allIds).size !== allIds.size) {
    violations.push('world graph is not connected');
  }

  for (const node of WORLD_NODE_LIST) {
    if (Object.keys(worldNodeExits(node.id)).length === 0) {
      violations.push(`${node.id}: isolated node`);
    }
  }

  for (const region of WORLD_REGIONS.values()) {
    const regionIds = new Set(
      WORLD_NODE_LIST
        .filter((node) => node.regionId === region.id)
        .map((node) => node.id),
    );
    const start = regionIds.values().next().value as string | undefined;
    if (!start || reachableWithin(start, regionIds).size !== regionIds.size) {
      violations.push(`${region.id}: induced regional graph is not connected`);
    }

    for (const nodeId of regionIds) {
      const node = WORLD_NODES.get(nodeId);
      if (!node || (node.kind !== 'dungeon' && node.kind !== 'sanctuary')) continue;
      const remaining = new Set([...regionIds].filter((id) => id !== nodeId));
      const remainingStart = remaining.values().next().value as string | undefined;
      if (
        remainingStart &&
        reachableWithin(remainingStart, remaining, nodeId).size !== remaining.size
      ) {
        violations.push(`${nodeId}: forbidden regional articulation point`);
      }

      if (node.kind === 'dungeon') {
        const sameRegionNeighbors = adjacentWorldNodeIds(node.id).filter(
          (neighborId) => WORLD_NODES.get(neighborId)?.regionId === node.regionId,
        ).length;
        if (sameRegionNeighbors > 2) {
          violations.push(`${node.id}: dungeon is not on a regional corner or edge`);
        }

        const respawn = WORLD_NODES.get(region.respawnNodeId);
        if (
          respawn &&
          Math.abs(node.map.row - respawn.map.row) +
            Math.abs(node.map.col - respawn.map.col) <
            4
        ) {
          violations.push(`${node.id}: dungeon is too close to its respawn anchor`);
        }

        const touchesOwnBiome = adjacentWorldNodeIds(node.id).some((neighborId) => {
          const neighbor = WORLD_NODES.get(neighborId);
          return (
            neighbor?.kind === 'normal' &&
            neighbor.regionId === node.regionId &&
            neighbor.biomeGroup === node.biomeGroup
          );
        });
        if (!touchesOwnBiome) {
          violations.push(`${node.id}: dungeon does not touch its own biome`);
        }
      }
    }

    const biomeGroups = new Set(
      [...regionIds]
        .map((nodeId) => WORLD_NODES.get(nodeId))
        .filter(
          (node): node is WorldNodeAuthoring =>
            Boolean(node && (node.kind === 'normal' || node.kind === 'dungeon')),
        )
        .map((node) => node.biomeGroup),
    );
    for (const biomeGroup of biomeGroups) {
      const biomeIds = new Set(
        [...regionIds].filter((nodeId) => {
          const node = WORLD_NODES.get(nodeId);
          return (
            node?.biomeGroup === biomeGroup &&
            (node.kind === 'normal' || node.kind === 'dungeon')
          );
        }),
      );
      const biomeStart = biomeIds.values().next().value as string | undefined;
      if (
        !biomeStart ||
        reachableWithin(biomeStart, biomeIds).size !== biomeIds.size
      ) {
        violations.push(
          `${region.id} ${biomeGroup}: biome cluster is disconnected from its dungeon`,
        );
      }
    }
  }

  const frontierCounts = new Map<string, number>();
  const allowedFrontiers = new Set(['1-2', '2-3', '3-4', '1-4']);
  for (const node of WORLD_NODE_LIST) {
    const nodeTier = WORLD_REGIONS.get(node.regionId)?.tier ?? 0;
    for (const neighborId of adjacentWorldNodeIds(node.id)) {
      if (node.id >= neighborId) continue;
      const neighbor = WORLD_NODES.get(neighborId);
      if (!neighbor || neighbor.regionId === node.regionId) continue;
      const neighborTier = WORLD_REGIONS.get(neighbor.regionId)?.tier ?? 0;
      const key = [nodeTier, neighborTier].sort((a, b) => a - b).join('-');
      if (!allowedFrontiers.has(key)) {
        violations.push(`${node.id}<->${neighborId}: unintended tier frontier`);
      }
      frontierCounts.set(key, (frontierCounts.get(key) ?? 0) + 1);
    }
  }
  for (const pair of allowedFrontiers) {
    if ((frontierCounts.get(pair) ?? 0) < 2) {
      violations.push(`frontier ${pair}: fewer than two traversable edges`);
    }
  }
}

function validateBiomeShape(violations: string[]): void {
  const byCell = new Map(
    WORLD_NODE_LIST.map((node) => [
      `${node.map.row},${node.map.col}`,
      node,
    ]),
  );
  const rows = WORLD_NODE_LIST.map((node) => node.map.row);
  const cols = WORLD_NODE_LIST.map((node) => node.map.col);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);

  const inspectLine = (nodes: Array<WorldNodeAuthoring | undefined>) => {
    let previousKey: string | undefined;
    let runLength = 0;
    for (const node of [...nodes, undefined]) {
      const key =
        node && (node.kind === 'normal' || node.kind === 'dungeon')
          ? `${node.regionId}:${node.biomeGroup}`
          : undefined;
      if (key && key === previousKey) {
        runLength += 1;
        continue;
      }
      if (previousKey && runLength > 5) {
        violations.push(
          `${previousKey}: straight biome run is ${runLength} nodes long`,
        );
      }
      previousKey = key;
      runLength = key ? 1 : 0;
    }
  };

  for (let row = minRow; row <= maxRow; row += 1) {
    inspectLine(
      Array.from(
        { length: maxCol - minCol + 1 },
        (_, index) => byCell.get(`${row},${minCol + index}`),
      ),
    );
  }
  for (let col = minCol; col <= maxCol; col += 1) {
    inspectLine(
      Array.from(
        { length: maxRow - minRow + 1 },
        (_, index) => byCell.get(`${minRow + index},${col}`),
      ),
    );
  }
}

function validateCountSnapshot(violations: string[]): void {
  if (WORLD_NODE_LIST.length !== 170) {
    violations.push(`expected 170 nodes, found ${WORLD_NODE_LIST.length}`);
  }
  for (const [kind, expected] of Object.entries(EXPECTED_KIND_COUNTS)) {
    const actual = WORLD_NODE_LIST.filter((node) => node.kind === kind).length;
    if (actual !== expected) {
      violations.push(`expected ${expected} ${kind} nodes, found ${actual}`);
    }
  }
  for (const [tierText, expected] of Object.entries(EXPECTED_NORMAL_COUNTS)) {
    const tier = Number(tierText);
    const actual = WORLD_NODE_LIST.filter(
      (node) => node.kind === 'normal' && node.biomeTier === tier,
    ).length;
    if (actual !== expected) {
      violations.push(`T${tier}: expected ${expected} normal nodes, found ${actual}`);
    }
  }
}

/** Human-readable executable specification for the canonical sparse atlas. */
export function validateWorldMap(): string[] {
  const violations: string[] = [];
  validateIdentity(violations);
  validateKindsAndContent(violations);
  violations.push(...validateNodeDisplayNames(WORLD_NODE_LIST));
  validateBiomeCoverage(violations);
  validateTopology(violations);
  validateBiomeShape(violations);
  validateCountSnapshot(violations);
  return violations;
}

export function assertValidWorldMap(): void {
  const violations = validateWorldMap();
  if (violations.length > 0) {
    throw new Error(`Invalid canonical world:\n- ${violations.join('\n- ')}`);
  }
}
