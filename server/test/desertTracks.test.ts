import {
  GAME_CONFIG,
  NODE_BIOMES,
  getDesertTracks,
  getNodeTallProps,
  isOnDesertTrack,
} from "@mmo-idle/shared";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const desertNodes = Object.entries(NODE_BIOMES).filter(
  ([, info]) => info.biomeGroup === "desert",
);
assert(desertNodes.length > 0, "the world has desert nodes");

let tracked = 0;
for (const [nodeId, info] of desertNodes) {
  const layout = getDesertTracks(nodeId);

  if (info.isDungeon) {
    // Desert dungeons invert the usual rule: the road does not cross the court, it ENDS at
    // it. So a boss node ALWAYS has one, and it has to actually reach both ends — an
    // arrival road that stops in open sand is the one failure that would undo the idea.
    assert(layout.shape === "arrival", `${nodeId} is a dungeon and carries its road`);
    const centre = { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 };
    // Measured on the PAINT, not on disc centres: what must not exist is a band of sand
    // between the end of the road and the rim of the court. The court is 0.115 * W and
    // rolls +/-3%, so the smallest it is ever painted is the bar to clear.
    const reach = Math.min(
      ...layout.discs.map((d) => Math.hypot(d.x - centre.x, d.y - centre.y) - d.r),
    );
    assert(
      reach <= GAME_CONFIG.NODE_WIDTH * 0.115 * 0.97,
      `${nodeId} road paint reaches into the arena court`,
    );
    const edgeGap = Math.min(
      ...layout.discs.map((d) =>
        Math.min(d.x, d.y, GAME_CONFIG.NODE_WIDTH - d.x, GAME_CONFIG.NODE_HEIGHT - d.y),
      ),
    );
    assert(edgeGap <= 0, `${nodeId} road runs off the node edge it arrives from`);
    continue;
  }

  if (layout.shape === "none") {
    assert(layout.discs.length === 0, `${nodeId} has no track and no discs`);
    continue;
  }
  tracked++;

  assert(layout.discs.length >= 8, `${nodeId} track is long enough to read as a road`);

  // The failure this exists to catch: the first draft let a quarter-turn track clip a
  // corner, so a node's entire road lay off the map bar one disc. A track must put real
  // length ON the node, not merely exist.
  const onNode = layout.discs.filter(
    (d) =>
      d.x > 0 &&
      d.x < GAME_CONFIG.NODE_WIDTH &&
      d.y > 0 &&
      d.y < GAME_CONFIG.NODE_HEIGHT,
  );
  assert(onNode.length >= 6, `${nodeId} track actually crosses the node`);

  // Rock formations are collision and the track has to stay walkable. `collision.test.ts`
  // asserts the same thing across every rock biome; this keeps the desert half of it next
  // to the layout it depends on.
  for (const prop of getNodeTallProps(nodeId)) {
    const shape = prop.shapes[0];
    assert(
      !isOnDesertTrack(nodeId, shape.x, shape.y),
      `${prop.id} keeps off the caravan track`,
    );
  }
}

// Both halves of the split must exist for the biome to read the way it is meant to: a
// track is only a landmark because most nodes are open pan, and open pan only reads as
// desolate because some nodes prove roads exist.
const walkable = desertNodes.filter(([, info]) => !info.isDungeon).length;
assert(tracked > 0, "some desert nodes carry a track");
assert(tracked < walkable, "most desert nodes stay open pan");

console.log(
  `desertTracks.test.ts: ok (${tracked}/${walkable} open nodes tracked, ` +
    `${desertNodes.length - walkable} dungeons with an arrival road)`,
);
