import {
  GAME_CONFIG,
  NODE_BIOMES,
  getGraveRows,
  getNodeTallProps,
  getNodeTrees,
  getWhaleFall,
  isOnWhaleFall,
} from "@mmo-idle/shared";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const W = GAME_CONFIG.NODE_WIDTH;
const H = GAME_CONFIG.NODE_HEIGHT;
const centre = { x: W / 2, y: H / 2 };

// ── Wasteland: the grave rows ─────────────────────────────────────────────────

const wastelandDungeons = Object.entries(NODE_BIOMES).filter(
  ([, i]) => i.biomeGroup === "graveyard" && i.isDungeon,
);
assert(wastelandDungeons.length > 0, "the world has a wasteland dungeon");

for (const [nodeId] of wastelandDungeons) {
  const markers = getGraveRows(nodeId);
  const trees = getNodeTrees(nodeId);
  assert(
    trees.length === markers.length,
    `${nodeId} raises one dead tree per grave marker`,
  );
  assert(markers.length >= 24, `${nodeId} has enough markers to read as rows`);

  for (const marker of markers) {
    assert(
      Math.hypot(marker.x - centre.x, marker.y - centre.y) >= W * 0.2,
      `${nodeId} keeps the boss arena clear of markers`,
    );
    assert(
      marker.x > 0 && marker.y > 0 && marker.x < W && marker.y < H,
      `${nodeId} marker sits on the node`,
    );
  }

  // The point of rows is that they ARE rows. Recover the best-fitting row axis and check
  // the markers quantise onto evenly spaced lines — an early tuning pass frayed them so
  // hard (wander comparable to the marker spacing) that the grid dissolved into a scatter,
  // which is the one outcome this layout exists to avoid.
  const spacing = W * 0.115;
  let best = { angle: 0, error: Number.POSITIVE_INFINITY };
  for (let i = 0; i < 360; i++) {
    const a = (i / 360) * Math.PI;
    const px = -Math.sin(a);
    const py = Math.cos(a);
    let error = 0;
    for (const m of markers) {
      const off = (m.x - centre.x) * px + (m.y - centre.y) * py;
      const d = off / spacing - Math.round(off / spacing);
      error += d * d;
    }
    if (error < best.error) best = { angle: a, error };
  }
  const px = -Math.sin(best.angle);
  const py = Math.cos(best.angle);
  const rows = new Set<number>();
  for (const m of markers) {
    const off = (m.x - centre.x) * px + (m.y - centre.y) * py;
    rows.add(Math.round(off / spacing));
  }
  assert(rows.size >= 5, `${nodeId} markers fall into distinct rows`);
  assert(
    markers.length / rows.size >= 3,
    `${nodeId} rows carry several markers each rather than one stray`,
  );
}

// ── Trench: the whale fall ────────────────────────────────────────────────────

const trenchDungeons = Object.entries(NODE_BIOMES).filter(
  ([, i]) => i.biomeGroup === "trench" && i.isDungeon,
);
assert(trenchDungeons.length > 0, "the world has a trench dungeon");

for (const [nodeId] of trenchDungeons) {
  const spine = getWhaleFall(nodeId);
  assert(spine.length >= 8, `${nodeId} lays out a full spine`);

  // The carcass tapers: the ribcage end is meaningfully larger than the tail. Without this
  // it is a row of identical props rather than one animal.
  const scales = spine.map((v) => v.scale);
  assert(
    Math.max(...scales) / Math.min(...scales) > 1.5,
    `${nodeId} spine tapers from ribcage to tail`,
  );

  for (const v of spine) {
    assert(
      v.x > 0 && v.y > 0 && v.x < W && v.y < H,
      `${nodeId} vertebra sits on the node`,
    );
  }

  // The spine must be CONTINUOUS across the altar gap. The first cut used a bow, whose
  // maximum curvature landed inside that gap and produced two straight arms meeting at a
  // visible kink. Consecutive vertebrae either side of the gap must keep a similar heading.
  const sorted = [...spine].sort(
    (a, b) => Math.hypot(a.x - centre.x, a.y - centre.y) - Math.hypot(b.x - centre.x, b.y - centre.y),
  );
  const nearest = sorted.slice(0, 2);
  const turn = Math.abs(nearest[0].angle - nearest[1].angle) % Math.PI;
  assert(
    turn < 0.25 || Math.PI - turn < 0.25,
    `${nodeId} spine runs continuously through the arena rather than kinking at it`,
  );

  // Rock formations are collision; one standing in the skeleton breaks the image.
  for (const prop of getNodeTallProps(nodeId)) {
    const shape = prop.shapes[0];
    assert(
      !isOnWhaleFall(nodeId, shape.x, shape.y),
      `${prop.id} keeps off the whale fall`,
    );
  }
}

console.log(
  `wastelandTrenchDungeons.test.ts: ok (${getGraveRows(wastelandDungeons[0][0]).length} grave markers, ` +
    `${getWhaleFall(trenchDungeons[0][0]).length} vertebrae)`,
);
