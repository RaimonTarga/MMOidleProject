import {
  GAME_CONFIG,
  NODE_BIOMES,
  RESOLVED_NODE_FEATURES,
  getJungleBushes,
  getNodeTrees,
  jungleTreeTarget,
  JUNGLE_CLEARING_R,
  type JungleBushArrangement,
} from "@mmo-idle/shared";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const jungleNodes = Object.entries(NODE_BIOMES).filter(
  ([, info]) => info.biomeGroup === "jungle",
);
assert(jungleNodes.length > 0, "the world has jungle nodes");

const centre = { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 };
const seen = new Map<JungleBushArrangement, number>();
const signatures = new Set<string>();
let walkable = 0;

for (const [nodeId, info] of jungleNodes) {
  const layout = getJungleBushes(nodeId);
  // The features the server actually resolves, not just what the generator returned —
  // the two ends have to describe one layout, which is the trap cave patrols fell into.
  const features = (RESOLVED_NODE_FEATURES[nodeId] ?? []).filter((f) =>
    f.id.startsWith("jungle_bush_"),
  );

  if (info.isDungeon) {
    // No thickets in a jungle arena: the clearing is the shape, and cover inside it fought
    // the one thing a boss node has to read as.
    assert(layout.bushes.length === 0, `${nodeId} is a dungeon and carries no thickets`);
    assert(features.length === 0, `${nodeId} resolves no bush features`);

    // The treeline rings the cut edge rather than scattering across the node.
    const clearing = GAME_CONFIG.NODE_WIDTH * JUNGLE_CLEARING_R;
    const trees = getNodeTrees(nodeId);
    assert(trees.length >= 5, `${nodeId} raises a treeline around its clearing`);
    for (const tree of trees) {
      const shape = tree.shapes[0];
      const r = Math.hypot(shape.x - centre.x, shape.y - centre.y);
      assert(
        r > clearing && r < clearing * 2.1,
        `${tree.id} stands just outside the clearing, not in it or across the node`,
      );
    }
    continue;
  }

  walkable++;
  seen.set(layout.arrangement, (seen.get(layout.arrangement) ?? 0) + 1);
  assert(
    layout.bushes.length >= 4 && layout.bushes.length <= 6,
    `${nodeId} carries 4-6 thickets`,
  );
  assert(
    features.length === layout.bushes.length,
    `${nodeId} resolves one bush feature per generated thicket`,
  );

  for (const bush of layout.bushes) {
    // Fully on the node: a thicket clipped by the border is a slow zone you cannot see.
    assert(
      bush.x - bush.radius > 0 &&
        bush.y - bush.radius > 0 &&
        bush.x + bush.radius < GAME_CONFIG.NODE_WIDTH &&
        bush.y + bush.radius < GAME_CONFIG.NODE_HEIGHT,
      `${nodeId} thicket sits fully on the node`,
    );
    // The centre is where you spawn and where a fight resolves; it stays legible.
    assert(
      Math.hypot(bush.x - centre.x, bush.y - centre.y) - bush.radius >= 560,
      `${nodeId} thicket keeps clear of the node centre`,
    );
  }

  // The defect this replaced: fifteen nodes shared two authored layouts at identical
  // coordinates and identical radii. Every node must now be its own.
  signatures.add(
    layout.bushes.map((b) => `${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.radius)}`).join("|"),
  );

  const trees = getNodeTrees(nodeId);
  assert(
    trees.length > 0 && trees.length <= jungleTreeTarget(nodeId),
    `${nodeId} places its arrangement's tree quota`,
  );
}

assert(signatures.size === walkable, "every walkable jungle node has a distinct thicket layout");
// Arrangements are DEALT rather than rolled precisely so the player meets all four; an
// independent roll left cluster on a single node out of fifteen.
assert(seen.size === 4, "all four arrangements appear across the biome");
for (const [arrangement, count] of seen) {
  assert(count >= 2, `${arrangement} appears on more than one node`);
}

console.log(
  `jungleBushes.test.ts: ok (${walkable} distinct layouts, ` +
    `${[...seen].map(([a, c]) => `${a} ${c}`).join(", ")})`,
);
