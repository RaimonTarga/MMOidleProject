import {
  BIOME_DATABASE,
  FAMILY_DATABASE,
  LINEAGE_DATABASE,
  WEAPON_PACKET_IDS,
  type PacketId,
} from "@mmo-idle/shared";
import {
  LANES_WITHOUT_T1_SHARD_SOURCE,
  LINEAGE_LANE_PROFILES,
  LINEAGE_LANE_REFERENCES,
  LINEAGE_REFERENCE_CLASS,
  laneReferenceFor,
  lineageRouteSteps,
} from "./profiles";
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
// allowlist that says so; this recomputes it from the biome pools and the family
// table, so the entry cannot outlive the gap (nor the gap the entry).

const t1Biomes = ["plains", "forest", "mountain", "cave", "swamp"] as const;
const fieldableAtT1 = new Set<string>(
  t1Biomes.flatMap((biome) => BIOME_DATABASE.get(biome)?.monsterPoolByTier[1] ?? []),
);
const t1ShardSources = new Set<PacketId>();
for (const family of FAMILY_DATABASE.values()) {
  if (family.monsterIds.some((id) => fieldableAtT1.has(id))) t1ShardSources.add(family.drops);
}
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

console.log("laneProfiles.test.ts: ok");
