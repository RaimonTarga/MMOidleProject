import {
  ITEM_DATABASE,
  LINEAGE_DATABASE,
  SKILL_TREE,
  WEAPON_PACKET_IDS,
  biomeLevelCap,
  globalMastery,
  lineageMasteryLevelForRow,
  nodeShard,
  rowsForTier,
  type PacketId,
} from "@mmo-idle/shared";
import {
  ALL_FRAME_PROFILES,
  ALL_FRAME_REFERENCES,
  ALL_LANE_PROFILES,
  ALL_LANE_REFERENCES,
  FRAME_REFERENCE_ROOTS,
  FRAME_SHAPES,
  LANES_WITHOUT_T1_SHARD_SOURCE,
  LINEAGE_FRAME_PROFILES,
  LINEAGE_FRAME_PROFILES_T2,
  LINEAGE_FRAME_REFERENCES,
  LINEAGE_FRAME_REFERENCES_T2,
  LINEAGE_LANE_PROFILES,
  LINEAGE_LANE_PROFILES_T2,
  LINEAGE_LANE_REFERENCES,
  LINEAGE_LANE_REFERENCES_T2,
  LINEAGE_REFERENCE_CLASS,
  frameReferenceFor,
  laneReferenceFor,
  lineageRouteSteps,
  lineageSwapReference,
  lineageSwapRouteSteps,
} from "./profiles";
import { requireRoute } from "../routes/index";
import { normalNodesFor } from "../state/observation";
import type { RouteStep } from "../route/types";
import { formatValidation, validateProfile } from "./validate";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

const weaponLineages = [...LINEAGE_DATABASE.values()].filter((l) => l.slot === "weapon");

// ── Shape ────────────────────────────────────────────────────────────────────

assert(
  LINEAGE_LANE_REFERENCES.length === weaponLineages.length * 4,
  `three lanes plus one lane-less control per weapon lineage (got ${LINEAGE_LANE_REFERENCES.length})`,
);
assert(
  LINEAGE_LANE_PROFILES.size === LINEAGE_LANE_REFERENCES.length,
  "one profile per reference — a colliding id would silently drop a lane",
);

for (const lineage of weaponLineages) {
  const refs = LINEAGE_LANE_REFERENCES.filter((r) => r.lineageId === lineage.id);
  const lanes = refs.map((r) => r.lane);
  assert(
    JSON.stringify(lanes) === JSON.stringify([...lineage.lanes, null]),
    `${lineage.id}: references cover its three lanes in matrix order, then the control`,
  );
  const expected = LINEAGE_REFERENCE_CLASS[lineage.id];
  assert(expected, `${lineage.id}: has a reference class`);
  for (const ref of refs) {
    assert(ref.classRoot === expected.classRoot && ref.frameId === expected.frameId,
      `${ref.profileId}: every lane of a lineage runs the SAME class and frame, or the lane is not the variable`);
    assert(ref.baseForm === expected.baseForm, `${ref.profileId}: wears the lineage base form`);
  }
}

// ── Every profile is a legal character ───────────────────────────────────────

for (const ref of LINEAGE_LANE_REFERENCES) {
  const profile = LINEAGE_LANE_PROFILES.get(ref.profileId)!;
  const report = validateProfile(profile);
  assert(report.pass, formatValidation(ref.profileId, report));
  assert(profile.lane === (ref.lane ?? undefined), `${ref.profileId}: declares its lane`);
  assert(profile.equipment.weapon === ref.baseForm, `${ref.profileId}: equips the base form`);

  const tree = profile.lineages?.[ref.lineageId];
  assert(tree, `${ref.profileId}: declares its own lineage's tree`);
  assert(tree.wornForm === ref.baseForm, `${ref.profileId}: worn form mirrors equipment.weapon`);
  assert(
    JSON.stringify(tree.ownedCards) === JSON.stringify(ref.cardIds),
    `${ref.profileId}: owns exactly its lane's cards`,
  );
  // A bought card that is not ACTIVE pays nothing, so a lane profile that owned
  // its cards without activating them would measure the control twice.
  for (const cardId of ref.cardIds) {
    const card = LINEAGE_DATABASE.get(ref.lineageId)!.cards.find((c) => c.id === cardId)!;
    assert(tree.active[card.row] === cardId, `${ref.profileId}: ${cardId} is the active ${card.row}`);
    assert(card.tier === 1 && card.lane === ref.lane, `${ref.profileId}: ${cardId} is a T1 card of its lane`);
  }
  if (!ref.lane) {
    assert(ref.cardIds.length === 0 && Object.keys(tree.active).length === 0,
      `${ref.profileId}: the control buys and runs nothing`);
  } else {
    assert(ref.cardIds.length === 2, `${ref.profileId}: the T1 band is a stat row and a payoff row`);
  }
}

// Only the wallet-free `clean` model is used, so a lane difference can never be
// a carryover-essence difference.
for (const profile of LINEAGE_LANE_PROFILES.values()) {
  assert(Object.values(profile.wallet.essences).every((v) => v === 0),
    `${profile.id}: lane references carry no essence`);
}

// ── Route steps ──────────────────────────────────────────────────────────────

for (const ref of LINEAGE_LANE_REFERENCES) {
  const steps = lineageRouteSteps(ref);
  if (!ref.lane) {
    assert(steps.length === 0, `${ref.profileId}: the control buys no cards`);
    continue;
  }
  assert(steps.length === 4, `${ref.profileId}: one unlockCard and one setActive per row`);
  assert(steps.filter((s) => s.type === "unlockCard").length === 2, `${ref.profileId}: two purchases`);
  assert(steps.filter((s) => s.type === "setActive").length === 2, `${ref.profileId}: two activations`);
  const bought = steps.flatMap((s) => (s.type === "unlockCard" ? [s.cardId] : []));
  assert(JSON.stringify(bought) === JSON.stringify(ref.cardIds),
    `${ref.profileId}: route buys exactly the declared cards, in row order`);
}

assert(laneReferenceFor(LINEAGE_LANE_REFERENCES[0].profileId) === LINEAGE_LANE_REFERENCES[0],
  "laneReferenceFor round-trips a profile id");

// ── The Tier-1 shard-source gap is computed, not asserted by hand ────────────
//
// A lane whose shard no Tier-1 node can drop cannot buy its cards from Tier-1
// kills, so a harness has to grant them. `LANES_WITHOUT_T1_SHARD_SOURCE` is the
// allowlist that says so; this recomputes it from the node rule (design §24.3:
// every kill in a node pays its dominant family's shard, `nodeShard`), so the
// entry cannot outlive the gap (nor the gap the entry).

const t1Biomes = ["plains", "forest", "mountain", "cave", "swamp"] as const;
const t1ShardSources = new Set<PacketId>(
  t1Biomes.flatMap((biome) => normalNodesFor(biome, 1))
    .map((nodeId) => nodeShard(nodeId))
    .filter((shard): shard is PacketId => shard !== undefined),
);
const weaponLanesInUse = new Set<PacketId>(weaponLineages.flatMap((l) => [...l.lanes]));
const computedGap = [...weaponLanesInUse].filter((lane) => !t1ShardSources.has(lane)).sort();
assert(
  JSON.stringify(computedGap) === JSON.stringify([...LANES_WITHOUT_T1_SHARD_SOURCE].sort()),
  `LANES_WITHOUT_T1_SHARD_SOURCE is stale: T1 pools leave ${JSON.stringify(computedGap)} unbuyable`,
);
for (const ref of LINEAGE_LANE_REFERENCES) {
  assert(
    ref.shardsUnobtainableAtT1 === (ref.lane !== null && computedGap.includes(ref.lane)),
    `${ref.profileId}: flags whether its shard has a T1 source`,
  );
}
// Weapons draw from the first six packets only (design §3); a lane outside that
// list would mean the matrix is measuring a defensive packet on a weapon.
for (const lane of weaponLanesInUse) {
  assert(WEAPON_PACKET_IDS.includes(lane), `${lane} is not a weapon packet`);
}

// ── The two-card row swap ────────────────────────────────────────────────────
//
// The only route shape on which `setLineageActive` does real work: a row that
// already has a live card being re-answered, and then answered back.

for (const ref of LINEAGE_LANE_REFERENCES) {
  const swap = lineageSwapReference(ref);
  if (!ref.lane) {
    assert(swap === null, `${ref.profileId}: a lane-less control has no row to swap`);
    continue;
  }
  assert(swap, `${ref.profileId}: has a rival stat card to swap with`);
  const lineage = LINEAGE_DATABASE.get(ref.lineageId)!;
  const cards = [swap.firstCardId, swap.secondCardId].map(
    (id) => lineage.cards.find((c) => c.id === id)!,
  );
  assert(cards.every((c) => c && c.tier === 1 && c.row === swap.row),
    `${ref.profileId}: both cards answer the same T1 row`);
  assert(cards[0].lane === ref.lane && cards[1].lane === swap.secondLane,
    `${ref.profileId}: the second card belongs to another lane of the same lineage`);
  assert(swap.firstCardId !== swap.secondCardId,
    `${ref.profileId}: a swap between a card and itself proves nothing`);

  const steps = lineageSwapRouteSteps(swap);
  const unlocks = steps.flatMap((s) => (s.type === "unlockCard" ? [s] : []));
  const actives = steps.flatMap((s) => (s.type === "setActive" ? [s] : []));
  assert(unlocks.length === 2, `${ref.profileId}: TWO cards are bought for one row`);
  assert(actives.length === 3,
    `${ref.profileId}: the first activation plus the two flips the swap is named for`);
  assert(
    JSON.stringify(unlocks.map((s) => s.cardId)) === JSON.stringify([swap.firstCardId, swap.secondCardId]),
    `${ref.profileId}: the lane's own card is bought first`,
  );
  assert(
    JSON.stringify(actives.map((s) => s.cardId))
      === JSON.stringify([swap.firstCardId, swap.secondCardId, swap.firstCardId]),
    `${ref.profileId}: flips to the rival card and back again`,
  );
  assert(actives.every((s) => s.row === swap.row && s.lineageId === ref.lineageId),
    `${ref.profileId}: every flip addresses the same row of the same lineage`);
  // Each flip has to follow a state the previous step established, or the
  // executor's own early-return makes it a no-op again.
  assert(steps.findIndex((s) => s.type === "unlockCard" && s.cardId === swap.secondCardId)
    < steps.findIndex((s) => s.type === "setActive" && s.cardId === swap.secondCardId),
    `${ref.profileId}: the rival card is owned before it is slotted`);
  assert(unlocks[1].farmAt === undefined,
    `${ref.profileId}: the second card's lane drops elsewhere, so the executor picks the node`);
}

// The live route that carries it is registered and ends on the first card.
{
  const route = requireRoute("striker-lineage-swap-forest-t1");
  const steps = route.steps as RouteStep[];
  const actives = steps.flatMap((s) => (s.type === "setActive" ? [s] : []));
  assert(actives.length === 3, "the swap route flips the stat row three times in all");
  assert(actives[0].cardId === actives[2].cardId,
    "the swap route finishes on the card it started with");
  assert(actives[1].cardId !== actives[0].cardId, "the middle flip is a different card");
  const unlocks = steps.flatMap((s) => (s.type === "unlockCard" ? [s] : []));
  assert(unlocks.length === 2, "the swap route buys two cards");
  assert(
    steps.some((s) => s.type === "equip" && s.definitionIds?.includes("flash-rapier")),
    "the swap route still holds the base form that opens the tree",
  );
}

// ── Frame references (design §18.10) ────────────────────────────────────────

assert(
  LINEAGE_FRAME_REFERENCES.length === 18,
  `design §18.10 asks for eighteen rows, three frames per root (got ${LINEAGE_FRAME_REFERENCES.length})`,
);
assert(
  LINEAGE_FRAME_PROFILES.size === LINEAGE_FRAME_REFERENCES.length,
  "one profile per frame reference — a colliding id would silently drop a frame",
);
assert(FRAME_REFERENCE_ROOTS.length === 6, "six class roots");

for (const classRoot of FRAME_REFERENCE_ROOTS) {
  const refs = LINEAGE_FRAME_REFERENCES.filter((r) => r.classRoot === classRoot);
  assert(refs.length === 3, `${classRoot}: Light, Balanced and Heavy`);
  assert(
    JSON.stringify(refs.map((r) => r.frameShape)) === JSON.stringify([...FRAME_SHAPES]),
    `${classRoot}: frames in design §10's order`,
  );
  assert(
    refs.filter((r) => r.canonical).length === 1,
    `${classRoot}: exactly one frame is the one its canonical T1 route wears — the denominator`,
  );
  // Within a root the frame is the ONLY variable, or the column is not a frame
  // column. Weapon and class are held fixed.
  const [first] = refs;
  for (const ref of refs) {
    assert(ref.baseForm === first.baseForm, `${ref.profileId}: the whole root wears one weapon`);
    const frame = SKILL_TREE.get(ref.frameId);
    assert(frame && frame.tier === 1 && frame.parent === classRoot,
      `${ref.profileId}: ${ref.frameId} is a tier-1 frame of ${classRoot}`);
    assert(ref.frameId === `${classRoot.replace("-root", "")}-${ref.frameShape}`,
      `${ref.profileId}: frame id matches its shape`);
  }
}

for (const ref of LINEAGE_FRAME_REFERENCES) {
  const profile = LINEAGE_FRAME_PROFILES.get(ref.profileId)!;
  const report = validateProfile(profile);
  assert(report.pass, formatValidation(ref.profileId, report));
  assert(profile.frameId === ref.frameId, `${ref.profileId}: declares its frame`);
  assert(profile.classRoot === ref.classRoot, `${ref.profileId}: declares its root`);
  assert(profile.equipment.weapon === ref.baseForm, `${ref.profileId}: equips the root's weapon`);
  assert(profile.itemUpgrades[ref.baseForm] === 0,
    `${ref.profileId}: the weapon is carried at +0, as the lane references are`);
  // Lane-less on purpose: design §10 gives the frame its own loop, so a card on
  // top of it would be a second variable.
  assert(profile.lane === undefined, `${ref.profileId}: a frame reference declares no lane`);
  for (const tree of Object.values(profile.lineages ?? {})) {
    assert(tree.ownedCards.length === 0, `${ref.profileId}: a frame reference buys no cards`);
  }
  assert(Object.values(profile.wallet.essences).every((v) => v === 0),
    `${ref.profileId}: frame references carry no essence`);
}

// The frame column and the lane matrix must be readable side by side: a root's
// canonical frame row is the SAME build as its lineage's lane-less control.
//
// Only for the five roots the lane matrix actually pairs with a lineage.
// `summoner-root` wears the Chaotic Axe because that is what its own canonical
// route finishes T1 on, but the Axe lineage's lane rows are the DOT root's — so
// its frame rows share a weapon with the Axe matrix and nothing else, and
// comparing them to `lineage-axe-baseline` would be comparing two classes.
for (const ref of LINEAGE_FRAME_REFERENCES) {
  if (!ref.canonical || !ref.lineageId) continue;
  if (LINEAGE_REFERENCE_CLASS[ref.lineageId]?.classRoot !== ref.classRoot) continue;
  const control = LINEAGE_LANE_REFERENCES.find(
    (r) => r.lineageId === ref.lineageId && r.lane === null,
  );
  if (!control) continue;
  assert(control.classRoot === ref.classRoot && control.frameId === ref.frameId
    && control.baseForm === ref.baseForm,
    `${ref.profileId}: the canonical frame row matches ${control.profileId}, or the two readings cannot be compared`);
}

// Every frame profile id is distinct from every lane profile id: the bench keys
// cells by profile id, so a collision would overwrite a measurement.
{
  const ids = new Set([
    ...LINEAGE_LANE_REFERENCES.map((r) => r.profileId),
    ...LINEAGE_FRAME_REFERENCES.map((r) => r.profileId),
  ]);
  assert(ids.size === LINEAGE_LANE_REFERENCES.length + LINEAGE_FRAME_REFERENCES.length,
    "lane and frame profile ids do not collide");
}

assert(frameReferenceFor(LINEAGE_FRAME_REFERENCES[0].profileId) === LINEAGE_FRAME_REFERENCES[0],
  "frameReferenceFor round-trips a profile id");

// --- The band-2 reference set (run 4, W2-A step 1) --------------------------
//
// Twenty more lane rows and eighteen more frame rows, carrying the TIER-2 band on
// TIER-2 gear: the character the Tier-2 gate hands over, which is what the matrix
// needs before it can read a Tier-2 node as anything but a gear gap.
//
// The band-1 rows above are untouched by this, and that is the point of two arrays
// rather than one: their size and T1 shape are an older contract.

assert(
  LINEAGE_LANE_REFERENCES_T2.length === weaponLineages.length * 4,
  `one band-2 row per lane plus a control per weapon lineage (got ${LINEAGE_LANE_REFERENCES_T2.length})`,
);
assert(
  LINEAGE_LANE_PROFILES_T2.size === LINEAGE_LANE_REFERENCES_T2.length,
  "one band-2 profile per band-2 reference",
);
assert(
  ALL_LANE_REFERENCES.length === LINEAGE_LANE_REFERENCES.length + LINEAGE_LANE_REFERENCES_T2.length
    && ALL_LANE_PROFILES.size === ALL_LANE_REFERENCES.length,
  "both bands join without an id collision -- the bench keys cells by profile id",
);

for (const ref of LINEAGE_LANE_REFERENCES) {
  assert(ref.bandTier === 1, `${ref.profileId}: the first array is band 1`);
  assert(ref.wornForm === ref.baseForm, `${ref.profileId}: band 1 wears the base form`);
  assert(JSON.stringify(ref.activeCardIds) === JSON.stringify(ref.cardIds),
    `${ref.profileId}: at band 1 every owned card is slotted`);
}

for (const ref of LINEAGE_LANE_REFERENCES_T2) {
  const lineage = LINEAGE_DATABASE.get(ref.lineageId)!;
  const profile = LINEAGE_LANE_PROFILES_T2.get(ref.profileId)!;
  const report = validateProfile(profile);
  assert(report.pass, formatValidation(ref.profileId, report));
  assert(ref.bandTier === 2, `${ref.profileId}: the second array is band 2`);

  // The worn form is the lineage's FIRST tier-2 form, fixed per lineage so the
  // capstone it carries is the same for every lane of that lineage and for its
  // control (see `t2WornForm`'s own note on the residual confound).
  const t2Form = lineage.forms.find((f) => f.tier === 2);
  assert(t2Form && ref.wornForm === t2Form.recipeId,
    `${ref.profileId}: wears ${lineage.id}'s first tier-2 form`);
  assert(ref.baseForm === LINEAGE_REFERENCE_CLASS[ref.lineageId].baseForm,
    `${ref.profileId}: still owns the tier-1 base form that opened the tree`);
  assert(profile.equipment.weapon === ref.wornForm, `${ref.profileId}: equips the worn form`);
  assert(profile.inventory.includes(ref.baseForm),
    `${ref.profileId}: the displaced base form stays in the bag`);

  // THE WHOLE GEAR SET MOVED. A band-2 row whose armour is still tier 1 would read
  // as a weak T2 band rather than as a gear gap, which is the exact confusion run 3
  // ran into on the Tier-2 nodes.
  for (const slot of ["weapon", "armor", "recovery", "mobility"] as const) {
    const id = profile.equipment[slot];
    assert(id, `${ref.profileId}: ${slot} is equipped`);
    assert(ITEM_DATABASE.get(id!)?.tier === 2,
      `${ref.profileId}: ${slot} "${id}" is not a tier-2 item`);
  }

  // Mastery at the Tier-2 cap, which is NOT one number: a T1 group reaches 12
  // inside Tier 2, Jungle and Desert do not pass 6 until Tier 3.
  for (const [group, level] of Object.entries(profile.biomeLevels)) {
    if (group === "clearing") continue;
    assert(level === biomeLevelCap(2, group),
      `${ref.profileId}: ${group} is ${level}, the tier-2 cap is ${biomeLevelCap(2, group)}`);
  }
  assert(globalMastery(profile.biomeLevels) >= lineageMasteryLevelForRow(2, "amplifier"),
    `${ref.profileId}: mastery does not reach the T2 amplifier row`);

  if (!ref.lane) {
    assert(ref.cardIds.length === 0 && ref.activeCardIds.length === 0,
      `${ref.profileId}: the band-2 control buys and runs nothing`);
    const tree = profile.lineages?.[ref.lineageId];
    assert(tree && Object.keys(tree.active).length === 0,
      `${ref.profileId}: the control slots nothing`);
    continue;
  }

  // Owned: the T1 band plus the whole T2 band, all of one lane. Slotted: the T2
  // rows only -- `active` is one card per row across the tree, and the T1 stat row
  // is inside the worn form now (design §4 band collapse), which is why it is still
  // owned and no longer active.
  const expectedOwned = [
    ...rowsForTier(1).map((row) =>
      lineage.cards.find((c) => c.tier === 1 && c.row === row && c.lane === ref.lane)!.id),
    ...rowsForTier(2).map((row) =>
      lineage.cards.find((c) => c.tier === 2 && c.row === row && c.lane === ref.lane)!.id),
  ];
  assert(JSON.stringify(ref.cardIds) === JSON.stringify(expectedOwned),
    `${ref.profileId}: owns the T1 band then the T2 band of its own lane, in row order`);
  assert(ref.cardIds.length === 5,
    `${ref.profileId}: two T1 rows and three T2 rows (got ${ref.cardIds.length})`);
  assert(ref.activeCardIds.length === 3,
    `${ref.profileId}: the T2 band is stat, payoff and amplifier`);
  const tree = profile.lineages?.[ref.lineageId];
  assert(tree, `${ref.profileId}: declares its own lineage's tree`);
  assert(tree!.wornForm === ref.wornForm, `${ref.profileId}: worn form mirrors equipment.weapon`);
  assert(JSON.stringify(tree!.ownedCards) === JSON.stringify(ref.cardIds),
    `${ref.profileId}: the profile owns exactly the declared cards`);
  for (const cardId of ref.activeCardIds) {
    const card = lineage.cards.find((c) => c.id === cardId)!;
    assert(card.tier === 2 && card.lane === ref.lane,
      `${ref.profileId}: ${cardId} is a T2 card of its lane`);
    assert(tree!.active[card.row] === cardId,
      `${ref.profileId}: ${cardId} is the active ${card.row}`);
  }
  assert(Object.keys(tree!.active).length === 3,
    `${ref.profileId}: exactly the three T2 rows are slotted`);
  // The amplifier modifies the payoff of the same band, and owning the target is
  // what the purchase gate checks -- so a band that slotted an amplifier without it
  // would be an inert card the matrix would read as a weak lane.
  const amplifier = lineage.cards.find((c) => ref.activeCardIds.includes(c.id) && c.row === "amplifier")!;
  assert(amplifier.modifies && ref.cardIds.includes(amplifier.modifies),
    `${ref.profileId}: the amplifier's target payoff is owned`);
}

// Band 1 and band 2 differ in the BAND and the GEAR, and in nothing else: same
// class, same frame, same lane. Anything else moving would make the pair
// unreadable as a tier comparison.
for (const t2 of LINEAGE_LANE_REFERENCES_T2) {
  const t1 = LINEAGE_LANE_REFERENCES.find(
    (r) => r.lineageId === t2.lineageId && r.lane === t2.lane,
  );
  assert(t1, `${t2.profileId}: has a band-1 sibling`);
  assert(t1!.classRoot === t2.classRoot && t1!.frameId === t2.frameId
    && t1!.baseForm === t2.baseForm && t1!.homeBiome === t2.homeBiome,
    `${t2.profileId}: differs from ${t1!.profileId} in more than the band`);
  const p1 = LINEAGE_LANE_PROFILES.get(t1!.profileId)!;
  const p2 = LINEAGE_LANE_PROFILES_T2.get(t2.profileId)!;
  assert(p1.classRoot === p2.classRoot && p1.frameId === p2.frameId,
    `${t2.profileId}: class and frame are held fixed across the bands`);
  assert(JSON.stringify(p1.attunedAbilities) === JSON.stringify(p2.attunedAbilities),
    `${t2.profileId}: the ability package is held fixed across the bands`);
}

// --- Band-2 frame references ------------------------------------------------

assert(LINEAGE_FRAME_REFERENCES_T2.length === 18,
  `eighteen band-2 frame rows (got ${LINEAGE_FRAME_REFERENCES_T2.length})`);
assert(LINEAGE_FRAME_PROFILES_T2.size === LINEAGE_FRAME_REFERENCES_T2.length,
  "one band-2 frame profile per band-2 frame reference");
assert(ALL_FRAME_REFERENCES.length === 36 && ALL_FRAME_PROFILES.size === 36,
  "both frame bands join without an id collision");

for (const ref of LINEAGE_FRAME_REFERENCES) assert(ref.bandTier === 1, `${ref.profileId}: band 1`);
for (const ref of LINEAGE_FRAME_REFERENCES_T2) {
  const profile = LINEAGE_FRAME_PROFILES_T2.get(ref.profileId)!;
  const report = validateProfile(profile);
  assert(report.pass, formatValidation(ref.profileId, report));
  assert(ref.bandTier === 2, `${ref.profileId}: band 2`);
  assert(profile.lane === undefined, `${ref.profileId}: a frame reference declares no lane`);
  for (const tree of Object.values(profile.lineages ?? {})) {
    assert(tree.ownedCards.length === 0, `${ref.profileId}: a frame reference buys no cards`);
  }
  // A frame is a TIER-1 skill node at both bands -- bought once, never replaced --
  // so what band 2 varies is the gear the frame is read on.
  const frame = SKILL_TREE.get(ref.frameId);
  assert(frame && frame.tier === 1 && frame.parent === ref.classRoot,
    `${ref.profileId}: ${ref.frameId} is still a tier-1 frame of ${ref.classRoot}`);
  for (const slot of ["weapon", "armor", "recovery", "mobility"] as const) {
    const id = profile.equipment[slot];
    assert(id && ITEM_DATABASE.get(id)?.tier === 2,
      `${ref.profileId}: ${slot} "${id}" is not a tier-2 item`);
  }
  // Within a root the frame is still the only variable at band 2.
  const siblings = LINEAGE_FRAME_REFERENCES_T2.filter((r) => r.classRoot === ref.classRoot);
  assert(siblings.length === 3, `${ref.classRoot}: Light, Balanced and Heavy at band 2`);
  assert(siblings.every((r) => r.wornForm === ref.wornForm),
    `${ref.profileId}: the whole root wears one band-2 weapon`);
  assert(siblings.filter((r) => r.canonical).length === 1,
    `${ref.classRoot}: exactly one band-2 frame is the denominator`);
}

assert(laneReferenceFor(LINEAGE_LANE_REFERENCES_T2[0].profileId) === LINEAGE_LANE_REFERENCES_T2[0],
  "laneReferenceFor round-trips a band-2 profile id");
assert(frameReferenceFor(LINEAGE_FRAME_REFERENCES_T2[0].profileId) === LINEAGE_FRAME_REFERENCES_T2[0],
  "frameReferenceFor round-trips a band-2 profile id");

// Lane and frame ids stay distinct across BOTH bands.
{
  const ids = new Set([
    ...ALL_LANE_REFERENCES.map((r) => r.profileId),
    ...ALL_FRAME_REFERENCES.map((r) => r.profileId),
  ]);
  assert(ids.size === ALL_LANE_REFERENCES.length + ALL_FRAME_REFERENCES.length,
    "no profile id is shared by two reference rows");
}

console.log("laneProfiles.test.ts: ok");
