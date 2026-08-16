import {
  GAME_CONFIG,
  NODE_BIOMES,
  RESOLVED_NODE_FEATURES,
  getNodeTrees,
  getTundraLakes,
  isOnTundraLake,
} from "@mmo-idle/shared";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const W = GAME_CONFIG.NODE_WIDTH;
const H = GAME_CONFIG.NODE_HEIGHT;
const AREA = W * H;
const centre = { x: W / 2, y: H / 2 };

// ── Volcanic lava lakes ───────────────────────────────────────────────────────

const lavaSignatures = new Set<string>();
let volcanicNodes = 0;

for (const [nodeId, info] of Object.entries(NODE_BIOMES)) {
  if (info.biomeGroup !== "volcanic") continue;
  volcanicNodes++;
  const features = RESOLVED_NODE_FEATURES[nodeId] ?? [];
  const lakes = features.filter((f) => f.id.includes("vent"));

  // The heat ramp is node-wide and is what makes a volcanic node volcanic; regenerating
  // the lava must not have dropped it.
  assert(
    features.some((f) => f.id === "volcanic_heat"),
    `${nodeId} still carries the node-wide heat ramp`,
  );
  // Every volcanic node has lava. The first cut produced ZERO on the T4 dungeon, because
  // no lake radius could fit between the arena clearance and the node edge.
  assert(lakes.length >= 1, `${nodeId} has at least one lava lake`);

  const coverage = lakes.reduce(
    (a, l) => a + Math.PI * (l.displayW / 2) ** 2,
    0,
  ) / AREA;
  // Lava burns, so coverage is a balance number with a ceiling, not just a look.
  assert(coverage < 0.25, `${nodeId} lava coverage stays under a quarter of the node`);

  for (const lake of lakes) {
    const r = lake.displayW / 2;
    assert(
      lake.x - r > 0 && lake.y - r > 0 && lake.x + r < W && lake.y + r < H,
      `${nodeId} lava lake sits fully on the node`,
    );
    assert(
      Math.hypot(lake.x - centre.x, lake.y - centre.y) - r > 0,
      `${nodeId} lava lake keeps off the node centre`,
    );
  }

  lavaSignatures.add(
    lakes.map((l) => `${Math.round(l.x)},${Math.round(l.y)},${Math.round(l.displayW / 2)}`).join("|"),
  );
}

// The defect this replaced: twelve walkable nodes shared TWO authored vent layouts.
assert(
  lavaSignatures.size === volcanicNodes,
  "every volcanic node has a distinct lava layout",
);

// ── Tundra frozen lakes ───────────────────────────────────────────────────────

const iceSignatures = new Set<string>();
let tundraNodes = 0;

for (const [nodeId, info] of Object.entries(NODE_BIOMES)) {
  if (info.biomeGroup !== "tundra") continue;
  tundraNodes++;
  const lakes = getTundraLakes(nodeId);
  assert(lakes.length >= 1, `${nodeId} has at least one frozen lake`);

  for (const lake of lakes) {
    assert(
      lake.x - lake.radius > 0 &&
        lake.y - lake.radius > 0 &&
        lake.x + lake.radius < W &&
        lake.y + lake.radius < H,
      `${nodeId} frozen lake sits fully on the node`,
    );
  }

  if (info.isDungeon) {
    // The user's call: the boss is fought on solid ground with the ice off to the sides,
    // inverting the old behaviour where the arena court itself was painted as ice.
    for (const lake of lakes) {
      assert(
        Math.hypot(lake.x - centre.x, lake.y - centre.y) - lake.radius >= W * 0.29,
        `${nodeId} keeps its boss arena off the ice`,
      );
    }
  }

  // The whole reason this layout moved into `shared/`: trees are collision and are placed
  // server-side, so a client-only ice pattern could not be avoided and they grew out of
  // the lake.
  for (const tree of getNodeTrees(nodeId)) {
    const shape = tree.shapes[0];
    assert(
      !isOnTundraLake(nodeId, shape.x, shape.y),
      `${tree.id} does not grow out of a frozen lake`,
    );
  }

  iceSignatures.add(
    lakes.map((l) => `${Math.round(l.x)},${Math.round(l.y)},${Math.round(l.radius)}`).join("|"),
  );
}

assert(
  iceSignatures.size === tundraNodes,
  "every tundra node has a distinct ice layout",
);

console.log(
  `lavaAndIceLakes.test.ts: ok (${volcanicNodes} volcanic + ${tundraNodes} tundra nodes, all distinct)`,
);
