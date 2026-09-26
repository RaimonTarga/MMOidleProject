// BIOME ECOLOGY POLISH — Volcanic mixed packs, Wasteland Gravewright packs,
// Tundra monster identity (2026-09-11).
//
// A wiring smoke test, not a balance test. Every assertion is about SHAPE — what
// composes with what, what cannot recurse, what actually fires — and none of them
// pin a damage number.
//
// What is covered:
//   1. Volcanic packs mix weak bodies with a stronger anchor, at BOTH tiers, using
//      only monsters that tier's pool can legitimately field.
//   2. `followerVariants` produces more than one composition for the same alpha,
//      and every variant is reachable.
//   3. Pack spawning CANNOT recurse — a follower entry naming an alpha yields one
//      monster, not a nested pack.
//   4. A real `ensurePopulation` run lands inside the node's density budget rather
//      than multiplying it, and yields multiple distinct packs.
//   5. Wasteland: Gravewright entourages are valid, reanimatable Wasteland bodies,
//      and the corpse→raise loop still works when the corpse came from its own pack.
//   6. Tundra: Rime Pounce arms and lands; Frost-Tusk Impact is a planted circle
//      with knockback; Deep Freeze is a planted circle that actually ROOTS (the
//      rider path that used to be silently dropped on `aoe` charges).
//   7. The preserved Tundra signatures are still authored.
//   8. Pack composition and the new Tundra beats reach a player-facing surface.

import {
  AMBIENT_RAMP_KEY,
  BIOME_DATABASE,
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  TUNDRA_CHILL_EFFECT_ID,
  applyStatusEffect,
  describeMonsterAbilities,
  describeMonsterMechanics,
  emptyEquipment,
  getStatusEffect,
  type MonsterDefinition,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import type { PlayerEntity } from "../src/ecs/entity";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { updateCombat } from "../src/systems/combat/engine/combat";
import { updateMonsters } from "../src/systems/combat/ai/ai";
import { updateRaisers } from "../src/systems/combat/ai/raiseDead";
import { updatePacks } from "../src/systems/combat/ai/packs";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";
import { recordCorpse } from "../src/systems/world/corpses";
import {
  ensurePopulation,
  packFollowerGroups,
  spawnPack,
} from "../src/systems/world/spawning";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function def(id: string): MonsterDefinition {
  const d = MONSTER_DATABASE.get(id);
  assert(!!d, `${id} should exist in MONSTER_DATABASE`);
  return d!;
}

function poolFor(biome: string, tier: number): string[] {
  const pool = BIOME_DATABASE.get(biome)?.monsterPoolByTier?.[tier] ?? [];
  assert(pool.length > 0, `${biome} T${tier} should have a spawn pool`);
  return pool;
}

/** Every follower typeId an alpha can ever field, across all its variants. */
function allFollowerTypes(d: MonsterDefinition): string[] {
  const out = new Set<string>();
  for (const g of d.pack?.followers ?? []) out.add(g.typeId);
  for (const variant of d.pack?.followerVariants ?? []) {
    for (const g of variant) out.add(g.typeId);
  }
  return [...out];
}

/** Size of one spawn of this alpha under a given variant choice (alpha included). */
function packSizeForVariant(d: MonsterDefinition, variantIndex: number): number {
  const groups = packFollowerGroups(d.pack!, () => variantIndex);
  return 1 + groups.reduce((n, g) => n + g.count, 0);
}

function maxPackSize(d: MonsterDefinition): number {
  const variants = d.pack?.followerVariants ?? [];
  if (variants.length === 0) {
    return 1 + (d.pack?.followers ?? []).reduce((n, g) => n + g.count, 0);
  }
  return Math.max(...variants.map((_, i) => packSizeForVariant(d, i)));
}

initCombatSystems();

// ═══════════════════════════════════════════════════════════════════════════
// 1. VOLCANIC — authored mixed packs
// ═══════════════════════════════════════════════════════════════════════════

const VOLCANO_TIERS: { tier: number; alphas: string[]; bodies: string[] }[] = [
  {
    tier: 3,
    alphas: ["magma-brute", "cinder-hound"],
    bodies: ["ember-scuttler", "ash-slinger"],
  },
  {
    tier: 4,
    alphas: ["infernal-direhound", "obsidian-tortoise", "magma-salamander"],
    bodies: ["ember-skink", "ashspitter-salamander"],
  },
];

for (const { tier, alphas, bodies } of VOLCANO_TIERS) {
  const pool = poolFor("volcanic", tier);

  for (const alphaId of alphas) {
    const alpha = def(alphaId);
    assert(
      alpha.pack?.role === "alpha",
      `${alphaId} should be a Volcanic T${tier} pack alpha`,
    );
    assert(
      pool.includes(alphaId),
      `${alphaId} must be in the Volcanic T${tier} pool or its pack can never roll`,
    );

    const followerTypes = allFollowerTypes(alpha);
    assert(
      followerTypes.length > 0,
      `${alphaId} should field followers — a pack of one is not a pack`,
    );

    // TIER CONTAINMENT: a pack must never reach into another tier's roster. This
    // is the bug that forced Plains/Forest to mint `prairie-yearling` /
    // `dire-whelp` — a T2 alpha calling T1 bodies welded the two tiers together.
    for (const t of followerTypes) {
      assert(
        pool.includes(t),
        `${alphaId} follower ${t} must belong to the Volcanic T${tier} pool`,
      );
      assert(
        def(t).biome === "volcanic",
        `${alphaId} follower ${t} must be a Volcanic monster`,
      );
    }

    // WEAK/STRONG MIXTURE: the anchor has to actually out-mass what it leads,
    // otherwise the "several weak creatures plus something dangerous" read is a
    // label rather than a fact.
    const anchorHp = alpha.stats.hp;
    for (const t of followerTypes) {
      assert(
        def(t).stats.hp < anchorHp,
        `${alphaId} (hp ${anchorHp}) must anchor bodies weaker than itself, ` +
          `but ${t} has hp ${def(t).stats.hp}`,
      );
    }

    // At least one variant must be made of the tier's basic swarm filler, so a
    // pack is never entirely composed of specials.
    const fodder = bodies[0];
    assert(
      followerTypes.includes(fodder),
      `${alphaId} should field ${fodder} bodies as the bulk of its pack`,
    );

    // COMPOSITION VARIETY — the requirement that packs not be one formation
    // repeated forever.
    const variants = alpha.pack?.followerVariants ?? [];
    assert(
      variants.length >= 2,
      `${alphaId} should author at least two follower variants`,
    );
    const signatures = new Set(
      variants.map((_, i) =>
        packFollowerGroups(alpha.pack!, () => i)
          .map((g) => `${g.typeId}x${g.count}`)
          .sort()
          .join("+"),
      ),
    );
    assert(
      signatures.size === variants.length,
      `${alphaId} variants should all produce DISTINCT compositions (got ${signatures.size} of ${variants.length})`,
    );

    // DENSITY SANITY: one roll must not swallow a meaningful share of the node.
    const density = BIOME_DATABASE.get("volcanic")!.mobDensity!;
    assert(
      maxPackSize(alpha) <= Math.floor(density / 4),
      `${alphaId}'s largest pack (${maxPackSize(alpha)}) is too big a slice of density ${density}`,
    );
  }

  // The fodder must stay VISUALLY QUIET: with six bodies on screen the player has
  // to be able to tell which thing demands attention, so followers carry no casts.
  for (const bodyId of bodies) {
    const body = def(bodyId);
    assert(
      body.pack?.role === "follower",
      `${bodyId} should be authored as a Volcanic pack follower`,
    );
    assert(
      body.monsterAbilities === undefined && body.chargedAttack === undefined,
      `${bodyId} is pack fodder and must not cast or telegraph`,
    );
  }
}

// Non-recursion, stated as a property of the DATA as well as the spawner: an
// alpha must never list another alpha as a follower.
for (const [id, d] of MONSTER_DATABASE) {
  for (const t of allFollowerTypes(d)) {
    assert(
      MONSTER_DATABASE.get(t)?.pack?.role !== "alpha",
      `${id} lists ${t} as a follower, but ${t} is itself a pack alpha — packs must not nest`,
    );
  }
}

// ── Variant selection actually varies, and every variant is reachable ─────────
{
  const alpha = def("magma-brute");
  const variants = alpha.pack!.followerVariants!;
  for (let i = 0; i < variants.length; i++) {
    const groups = packFollowerGroups(alpha.pack!, () => i);
    const core = alpha.pack!.followers!.reduce((n, g) => n + g.count, 0);
    const extra = variants[i].reduce((n, g) => n + g.count, 0);
    assert(
      groups.reduce((n, g) => n + g.count, 0) === core + extra,
      `variant ${i} should be the fixed core PLUS exactly that variant`,
    );
  }
  // Out-of-range picks clamp rather than producing an undefined group.
  assert(
    packFollowerGroups(alpha.pack!, () => 999).length > 0,
    "an out-of-range variant pick should clamp, not drop the followers",
  );
  // An alpha with no variants keeps its legacy fixed-core behavior untouched.
  const wolf = def("wolf");
  assert(
    wolf.pack?.followerVariants === undefined &&
      packFollowerGroups(wolf.pack!).length === 1 &&
      packFollowerGroups(wolf.pack!)[0].count === 2,
    "an alpha without variants should still spawn exactly its fixed followers",
  );
}

// ── Live spawn: composition, non-recursion, and pack linkage ─────────────────
{
  const world = new World();
  const NODE = "node-t3-volcanic-01";
  const members = spawnPack(world, NODE, "magma-brute", { x: 1_200, y: 1_200 });
  // 5-6 until the 2026-09-26 volcanic T3 pass cut the herd to 4 (1 + 2 + one add-on).
  assert(!!members && members.length >= 4, "a Magma Tortoise herd should be 4+ strong");

  const alpha = members![0];
  assert(alpha.inPack?.role === "alpha", "the tortoise should carry the alpha link");
  const packId = alpha.inPack!.packId;
  assert(
    members!.slice(1).every((m) => m.inPack?.role === "follower" && m.inPack.packId === packId),
    "every follower should share the alpha's packId",
  );

  // One roll of a pack produces EXACTLY the authored bodies — no nested pack, no
  // follower spawning followers of its own.
  const spawnedTypes = members!.map((m) => m.isMonster.monsterTypeId);
  assert(
    spawnedTypes.filter((t) => t === "magma-brute").length === 1,
    "spawning a pack must create exactly one alpha",
  );
  assert(
    world.getMonsterCountInNode(NODE) === members!.length,
    "a pack spawn must add exactly its own members to the node",
  );

  // Followers must not be stacked on a single point — a six-body pack has to read
  // as a ring, not a pile.
  const anchor = alpha.hasPosition.current;
  const spread = members!
    .slice(1)
    .map((m) => Math.hypot(m.hasPosition.current.x - anchor.x, m.hasPosition.current.y - anchor.y));
  assert(
    spread.every((d) => d > 40),
    "followers should be placed off the alpha's own point",
  );
}

// ── The pack actually attacks TOGETHER, gunner included ──────────────────────
//
// The whole point of the model is simultaneity, and one composition is worth
// proving specifically: the Ash Salamander is `staticSentry`, so as a follower it
// is pinned to its spawn point on the pack ring. A mob nailed to the floor still
// has to JOIN the call — otherwise the "pack with a backline" composition would
// quietly be a pack plus a bystander.
{
  const world = new World();
  const NODE = "node-t3-volcanic-03";
  const alphaDef = def("magma-brute");
  const gunnerVariant = alphaDef
    .pack!.followerVariants!.findIndex((v) => v.some((g) => g.typeId === "ash-slinger"));
  assert(gunnerVariant >= 0, "a Magma Tortoise variant should field the gunner");

  // Roll until the gunner composition comes up, discarding the others.
  let members: ReturnType<typeof spawnPack> = null;
  for (let i = 0; i < 80 && !members; i++) {
    const rolled = spawnPack(world, NODE, "magma-brute", { x: 1_200 + i * 8, y: 1_200 });
    if (rolled?.some((e) => e.isMonster.monsterTypeId === "ash-slinger")) {
      members = rolled;
    } else if (rolled) {
      for (const e of rolled) world.removeMonsterEntity(e.isMonster.id);
    }
  }
  assert(!!members, "the gunner variant should be reachable by rolling");

  const gunner = members!.find((e) => e.isMonster.monsterTypeId === "ash-slinger")!;
  assert(
    gunner.controlsMonster.wanderRadius === 0 && !!gunner.controlsMonster.holdPost,
    "the gunner should still be a static sentry while in a pack",
  );

  const packTarget = makePlayer(world, members![0].hasPosition.nodeId,
    members![0].hasPosition.current.x + 100, members![0].hasPosition.current.y);
  setAggroTarget(world, members![0], { id: packTarget.isPlayer.id, kind: "player" }, 1_000);
  updatePacks(world, 1_000);
  const alerted = members!.filter((e) => e.hasAggroTarget?.targetId === packTarget.isPlayer.id);
  assert(
    alerted.length === members!.length,
    `the whole pack should engage together (${alerted.length}/${members!.length})`,
  );
  assert(
    gunner.hasAggroTarget?.targetId === packTarget.isPlayer.id,
    "the planted gunner must join the call rather than watch",
  );
  assert(
    world
      .takeNodeEvents(NODE)
      .some((e) => e.kind === "ecology-pulse" && e.pulse === "pack-call"),
    "the call should telegraph itself",
  );
}

// ── ensurePopulation stays inside the density budget ─────────────────────────
//
// THE DENSITY CLAIM these packs rest on: packs REPLACE loose spawns rather than
// adding to them, because `ensurePopulation` re-reads the node count each
// iteration instead of assuming +1 per roll. The only legal overshoot is the last
// roll happening to be the biggest authored pack, minus one.
//
// Sampled over several populations per node: which types roll is random, so a
// single run cannot speak to a distribution. The BOUND is asserted on every run
// (it must never be violated); the "packs actually happen" claim is asserted
// across the whole sample.
const POPULATION_RUNS = 8;
for (const { nodeId, biome, tier } of [
  { nodeId: "node-t3-volcanic-02", biome: "volcanic", tier: 3 },
  { nodeId: "node-t4-volcanic-02", biome: "volcanic", tier: 4 },
  { nodeId: "node-t4-graveyard-02", biome: "graveyard", tier: 4 },
]) {
  const biggest = Math.max(
    ...poolFor(biome, tier).map((id) => maxPackSize(def(id))),
  );
  let totalPacks = 0;
  let worstShortfall = 1;

  for (let run = 0; run < POPULATION_RUNS; run++) {
    const world = new World();
    const target = world.getMobDensity(nodeId);
    ensurePopulation(world, nodeId);
    const actual = world.getMonsterCountInNode(nodeId);

    assert(
      actual <= target + biggest - 1,
      `${nodeId} population ${actual} blew past density ${target} ` +
        `(max legal overshoot ${biggest - 1})`,
    );
    worstShortfall = Math.min(worstShortfall, actual / target);

    const packIds = new Set<string>();
    for (const e of world.monsterEntitiesInNode(nodeId)) {
      if (e.inPack) packIds.add(e.inPack.packId);
    }
    totalPacks += packIds.size;
  }

  // Spawn placement can legitimately give up on a crowded node, so this is a
  // "did it broadly fill" check rather than an exact headcount.
  assert(
    worstShortfall >= 0.8,
    `${nodeId} failed to fill toward its density target (worst run ${Math.round(worstShortfall * 100)}%)`,
  );
  // Averaging at least one pack per populated node, with wide margin: Volcano's
  // pools are half alphas and Wasteland's is one in five.
  assert(
    totalPacks >= POPULATION_RUNS,
    `${nodeId} produced only ${totalPacks} packs across ${POPULATION_RUNS} populations`,
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. WASTELAND — Gravewright-centred necromancer packs
// ═══════════════════════════════════════════════════════════════════════════

const GRAVEWRIGHT = def("gravewright");
{
  const pool = poolFor("graveyard", 4);
  assert(
    GRAVEWRIGHT.pack?.role === "alpha",
    "the Gravewright should be the nucleus of a Wasteland pack",
  );
  assert(GRAVEWRIGHT.elite === true, "the Gravewright should still read as the elite");

  const escort = allFollowerTypes(GRAVEWRIGHT);
  assert(escort.length >= 3, "a Gravewright entourage should have real variety");

  for (const t of escort) {
    const body = def(t);
    assert(pool.includes(t), `entourage member ${t} must be in the Wasteland T4 pool`);
    assert(body.biome === "graveyard", `entourage member ${t} must be a Wasteland creature`);
    // VALID CORPSE MATERIAL is the entire point of the pack. `recordCorpse`
    // refuses bosses and risen mobs; everything else is raisable.
    assert(!body.isBoss, `entourage member ${t} must be raisable (not a boss)`);
    assert(
      body.raisesDead === undefined,
      `entourage member ${t} must not itself be a raiser — one necromancer per pack`,
    );
  }

  // NOT A SWARM BIOME. Wasteland's pressure is a pack that refuses to stay dead,
  // not initial volume: its packs must stay smaller than Volcano's.
  const biggestWasteland = maxPackSize(GRAVEWRIGHT);
  const biggestVolcano = Math.max(
    ...["magma-brute", "obsidian-tortoise"].map((id) => maxPackSize(def(id))),
  );
  assert(
    biggestWasteland <= biggestVolcano,
    `a Gravewright pack (${biggestWasteland}) must not out-swarm Volcano (${biggestVolcano})`,
  );

  // The escort must fit comfortably inside the raiser's reach when it spawns,
  // or the pack would not feed the mechanic it exists to feed.
  assert(
    GRAVEWRIGHT.raisesDead!.corpseRange >= 200,
    "the Gravewright's corpse reach should still cover the pack ring",
  );
}

// ── Live: the entourage becomes the tide ────────────────────────────────────
{
  const world = new World();
  const NODE = "node-t4-graveyard-01";
  const members = spawnPack(world, NODE, "gravewright", { x: 1_500, y: 1_500 });
  assert(!!members && members.length >= 4, "a Gravewright should arrive with an escort");

  const wright = members![0];
  assert(
    wright.isMonster.monsterTypeId === "gravewright",
    "the Gravewright should be the pack alpha",
  );
  const escorts = members!.slice(1);
  assert(
    escorts.every((m) => m.isMonster.monsterTypeId !== "gravewright"),
    "a Gravewright entourage must never contain another Gravewright",
  );

  // Every escort body spawns inside the raiser's reach, so killing the pack
  // reliably feeds it rather than depending on where the fight drifted.
  const reach = GRAVEWRIGHT.raisesDead!.corpseRange;
  for (const m of escorts) {
    const d = Math.hypot(
      m.hasPosition.current.x - wright.hasPosition.current.x,
      m.hasPosition.current.y - wright.hasPosition.current.y,
    );
    assert(d <= reach, `escort spawned ${Math.round(d)}px away, outside the ${reach}px reach`);
  }

  // The loop: kill an escort → corpse → the surviving raiser stands it back up.
  const player = makePlayer(world, NODE, wright.hasPosition.current.x + 120, wright.hasPosition.current.y);
  const victim = escorts[0];
  const victimType = victim.isMonster.monsterTypeId;
  recordCorpse(world, victim);
  world.removeMonsterEntity(victim.isMonster.id);

  let now = Date.now();
  setAggroTarget(world, wright, { id: player.isPlayer.id, kind: "player" }, now);
  const before = world.getMonsterCountInNode(NODE);
  for (let i = 0; i < 200; i++) {
    now += 100;
    updateRaisers(world, now);
  }
  const risen = [...world.monsterEntitiesInNode(NODE)].filter((m) => m.isRaised);
  assert(risen.length >= 1, "the Gravewright should reanimate a body from its own pack");
  assert(
    risen.some((m) => m.isMonster.monsterTypeId === victimType),
    "the risen body should be the escort that actually died",
  );
  assert(
    world.getMonsterCountInNode(NODE) > before,
    "reanimation should put the pack's dead back into the encounter",
  );

  // NON-RECURSION, live: a risen escort leaves no corpse, so the entourage is a
  // one-time meal rather than a generator.
  const raised = risen[0];
  const corpsesBefore = (world.corpses.get(NODE) ?? []).length;
  recordCorpse(world, raised);
  assert(
    (world.corpses.get(NODE) ?? []).length === corpsesBefore,
    "a risen pack member must never record a reusable corpse",
  );

  // And the cap still holds: the raiser cannot exceed maxAlive however many of
  // its own escort it is fed.
  for (let i = 0; i < 12; i++) {
    const filler = world.createMonster(NODE, "plague-rat", {
      x: wright.hasPosition.current.x + 30,
      y: wright.hasPosition.current.y + 30,
    });
    if (filler) {
      recordCorpse(world, filler);
      world.removeMonsterEntity(filler.isMonster.id);
    }
  }
  for (let i = 0; i < 600; i++) {
    now += 100;
    updateRaisers(world, now);
  }
  const aliveRisen = [...world.monsterEntitiesInNode(NODE)].filter(
    (m) => m.isRaised?.raiserId === wright.isMonster.id,
  ).length;
  assert(
    aliveRisen <= GRAVEWRIGHT.raisesDead!.maxAlive,
    `risen population ${aliveRisen} exceeded maxAlive ${GRAVEWRIGHT.raisesDead!.maxAlive}`,
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. TUNDRA — monster identity
// ═══════════════════════════════════════════════════════════════════════════

// ── Preserved signatures: this pass must not have quietly eaten them ─────────
{
  assert(
    def("glacier-bear").enemyShield?.shatter?.vulnerability !== undefined &&
      def("glacial-direbear").enemyShield?.shatter?.vulnerability !== undefined,
    "the Bear line should keep Ice Armor and its shatter window",
  );
  assert(
    def("rime-caster").chargedAttack?.rootMs === 1_500 &&
      def("rime-caster").chargedAttack?.requiresAmbientStacks === 3 &&
      def("rime-caster").chargedAttack?.aoe === undefined,
    "the T3 Rime Caster should keep its single-target, Chill-gated Frostbind",
  );
  assert(
    def("permafrost-behemoth").scalesWithAmbientRamp?.chargedOnly === true &&
      def("permafrost-behemoth").chargedAttack?.aoe?.radius === 150,
    "the Behemoth should keep Glacial Slam and its charged-only Chill scaling",
  );

  // CONTROL BUDGET: the caster line is the ONLY root in the Tundra, nothing here
  // stuns, and no ordinary mob reapplies a slow on every hit.
  const tundra = [...MONSTER_DATABASE.values()].filter(
    (d) => d.biome === "tundra" && !d.isBoss,
  );
  const rooters = tundra.filter((d) => (d.chargedAttack?.rootMs ?? 0) > 0);
  assert(
    rooters.length === 2 &&
      rooters.every((d) => d.id === "rime-caster" || d.id === "hoarfrost-yeti"),
    "only the caster line may root in the Tundra",
  );
  for (const d of tundra) {
    assert(d.slowEffect === undefined, `${d.id} must not reapply a per-hit slow`);
    assert(d.rampDebuff === undefined, `${d.id} must not carry a ramping debuff`);
    assert(
      (d.chargedAttack?.stunMs ?? 0) === 0,
      `${d.id} must not stun — the Tundra does not remove agency`,
    );
    for (const ability of d.monsterAbilities ?? []) {
      for (const action of ability.actions) {
        assert(
          action.type !== "area-hit" || (action.stunMs ?? 0) === 0,
          `${d.id}'s ${ability.name} must not stun`,
        );
      }
    }
  }
}

// ── Frost Lurker: RIME POUNCE ───────────────────────────────────────────────
{
  const lurker = def("frost-lurker");
  const seq = lurker.engageSequence;
  assert(
    seq?.kind === "cast-charge-strike",
    "the Frost Lurker should open with a committed lunge",
  );
  assert(seq!.kind === "cast-charge-strike" && seq.name === "Rime Pounce", "named Rime Pounce");
  assert(
    seq!.kind === "cast-charge-strike" &&
      lurker.stats.speed * seq.speedMult > GAME_CONFIG.PLAYER_SPEED,
    "the pounce must actually close on a moving player, or the slow ambusher never reaches anyone",
  );
  // Modest by design: the tier ladder is measured off sustained pressure, and this
  // fires once per aggro session.
  assert(
    seq!.kind === "cast-charge-strike" && seq.damageMultiplier <= 1.5,
    "the pounce should be a readable spike, not a one-shot",
  );
  assert(
    lurker.stats.attack === 160,
    "the Frost Lurker's base attack must stay untouched (the tier ladder is measured off it)",
  );

  // It fires: cast bar up, then the landing hit lands amplified.
  const world = new World();
  const NODE = "node-t3-tundra-01";
  const player = makePlayer(world, NODE, 1_000, 1_000);
  const mob = world.createMonster(NODE, "frost-lurker", { x: 1_060, y: 1_000 })!;

  let now = Date.now();
  setAggroTarget(world, mob, { id: player.isPlayer.id, kind: "player" }, now);
  updateMonsters(world, 100, now);
  updateCombat(world, 100, now);
  const started = world
    .takeNodeEvents(NODE)
    .filter((e) => e.kind === "monster-cast-start" && e.label === "Rime Pounce");
  assert(started.length === 1, "aggro should open the Rime Pounce wind-up");

  const hpBefore = player.hasHealth.hp;
  for (let i = 0; i < 60; i++) {
    now += 100;
    updateMonsters(world, 100, now);
    updateCombat(world, 100, now);
  }
  assert(player.hasHealth.hp < hpBefore, "the pounce should reach and bite its target");
  // Once per engagement, never a hit-and-run loop.
  const casts = world
    .takeNodeEvents(NODE)
    .filter((e) => e.kind === "monster-cast-start" && e.label === "Rime Pounce");
  assert(casts.length === 0, "the Rime Pounce must not re-arm inside one engagement");
}

// ── Rime-Tusk Mastodon: the committed circle ─────────────────────────────────
{
  const mastodon = def("rime-tusk-mastodon");
  const ability = mastodon.monsterAbilities?.[0];
  assert(ability?.name === "Frost-Tusk Impact", "the Mastodon should keep its named impact");
  const action = ability!.actions[0];
  assert(action.type === "area-hit", "Frost-Tusk Impact should be a planted circle");
  assert(
    action.type === "area-hit" && action.multiplier === 1.6,
    "the impact multiplier is unchanged — it was made avoidable, not bigger",
  );
  assert(
    action.type === "area-hit" && (action.knockback?.distance ?? 0) > 0,
    "a battering ram should displace",
  );
  assert(
    action.type === "area-hit" && (action.stunMs ?? 0) === 0,
    "the ram displaces; it does not control",
  );

  // The telegraph has to be WALKABLE at base speed, or it is a tax rather than a
  // tell. (At full Chill it is deliberately marginal — that is the biome fusion.)
  const reachable = (GAME_CONFIG.PLAYER_SPEED * ability!.castMs) / 1_000;
  assert(
    action.type === "area-hit" && reachable > action.radius,
    `a player at base speed must be able to clear the ${
      action.type === "area-hit" ? action.radius : 0
    }px circle inside the ${ability!.castMs}ms tell (covers ${Math.round(reachable)}px)`,
  );

  // Shared vocabulary with the T3 it descends from: both COMMIT.
  assert(
    mastodon.color === def("frost-lurker").color,
    "the Mastodon should stay in the Frost Lurker's lineage slot",
  );
  // Kept, but do not read it as a charge: 18 base x 2.3 = 41px/s against a player
  // who walks at 120, so it closes on nobody who is moving. Pre-existing and left
  // alone (base speeds feed the measured tier ladder); pinned here so the next
  // reader does not assume the lineage's "commitment" lives in its movement.
  assert(
    mastodon.chargeOnAggro !== undefined,
    "the Mastodon should keep its engagement burst",
  );
  assert(
    mastodon.stats.speed * mastodon.chargeOnAggro!.speedMult < GAME_CONFIG.PLAYER_SPEED,
    "if the Mastodon's burst is ever retuned to actually close, revisit the comment above it",
  );

  // THE COUNTERPLAY, live. The whole deepening is that the impact became a circle
  // you can leave — a claim worth measuring rather than reading off the authoring,
  // since this is the first `area-hit` anyone has authored.
  const impactDamage = (dodge: boolean): number => {
    const world = new World();
    const NODE = "node-t4-tundra-01";
    const player = makePlayer(world, NODE, 3_000, 3_000);
    const mob = world.createMonster(NODE, "rime-tusk-mastodon", { x: 3_010, y: 3_000 })!;
    const radius = action.type === "area-hit" ? action.radius : 0;

    let now = Date.now();
    setAggroTarget(world, mob, { id: player.isPlayer.id, kind: "player" }, now);
    let planted = false;
    let hpAtPlant = 0;
    for (let i = 0; i < 300; i++) {
      now += 100;
      updateMonsters(world, 100, now);
      updateCombat(world, 100, now);
      for (const e of world.takeNodeEvents(NODE)) {
        if (e.kind === "monster-cast-start" && e.label === "Frost-Tusk Impact") {
          planted = true;
          hpAtPlant = player.hasHealth.hp;
          if (dodge) {
            player.hasPosition.current = { x: 3_000, y: 3_000 + radius + 60 };
          }
        } else if (e.kind === "monster-cast-end" && planted) {
          return hpAtPlant - player.hasHealth.hp;
        }
      }
    }
    throw new Error("the Mastodon never resolved a Frost-Tusk Impact");
  };

  assert(impactDamage(false) > 0, "standing in the tusk circle should hurt");
  assert(
    impactDamage(true) === 0,
    "leaving the tusk circle before it resolves must avoid it entirely",
  );
}

// ── Hoarfrost Yeti: Deep Freeze plants, and the root actually lands ──────────
{
  const yeti = def("hoarfrost-yeti");
  const charge = yeti.chargedAttack!;
  assert(charge.name === "Deep Freeze", "the Yeti should keep Deep Freeze");
  assert(charge.aoe?.radius !== undefined, "Deep Freeze should be a planted circle");
  assert((charge.rootMs ?? 0) > 0, "Deep Freeze should still root");
  assert(
    charge.requiresAmbientStacks !== undefined,
    "Deep Freeze should stay gated on the node's Chill",
  );
  assert(
    (charge.rootMs ?? 0) > (def("rime-caster").chargedAttack!.rootMs ?? 0),
    "the T4 root should still be the deeper one",
  );
  const reachable = (GAME_CONFIG.PLAYER_SPEED * charge.castMs) / 1_000;
  assert(
    reachable > charge.aoe!.radius,
    "a player at base speed must be able to leave the Deep Freeze circle",
  );

  // THE RIDER PATH. Before this pass the planted resolution returned before
  // charged-attack riders ran, so `aoe` + `rootMs` produced a circle that rooted
  // nobody. Pin it live rather than trusting the authoring.
  const world = new World();
  const NODE = "node-t4-tundra-01";
  const player = makePlayer(world, NODE, 1_000, 1_000);
  const mob = world.createMonster(NODE, "hoarfrost-yeti", { x: 1_120, y: 1_000 })!;

  chillPlayer(player, charge.requiresAmbientStacks!);

  let now = Date.now();
  setAggroTarget(world, mob, { id: player.isPlayer.id, kind: "player" }, now);
  let rooted = false;
  let plantedRadius = 0;
  for (let i = 0; i < 300 && !rooted; i++) {
    now += 100;
    updateMonsters(world, 100, now);
    updateCombat(world, 100, now);
    for (const e of world.takeNodeEvents(NODE)) {
      if (e.kind === "monster-cast-end" && e.fired && e.radius) plantedRadius = e.radius;
    }
    const slow = getStatusEffect(player.tracksCombat, "slow");
    if (slow && slow.data.speedMult === 0) rooted = true;
  }
  assert(rooted, "a planted Deep Freeze must ROOT the player standing in its circle");
  assert(
    plantedRadius === charge.aoe!.radius,
    "the resolved circle should broadcast the authored radius so the client can draw it",
  );

  // THE COUNTERPLAY, which is the entire reason for the deepening: the same cast
  // resolved against a player who WALKED OUT roots nobody. The T3 Frostbind cannot
  // be answered this way, and that difference is the deepening.
  {
    const w2 = new World();
    const p2 = makePlayer(w2, NODE, 2_000, 2_000);
    const yeti2 = w2.createMonster(NODE, "hoarfrost-yeti", { x: 2_120, y: 2_000 })!;
    chillPlayer(p2, charge.requiresAmbientStacks!);

    let t = Date.now();
    setAggroTarget(w2, yeti2, { id: p2.isPlayer.id, kind: "player" }, t);
    let casting = false;
    let resolved = false;
    for (let i = 0; i < 300 && !resolved; i++) {
      t += 100;
      updateMonsters(w2, 100, t);
      updateCombat(w2, 100, t);
      for (const e of w2.takeNodeEvents(NODE)) {
        if (e.kind === "monster-cast-start" && e.label === "Deep Freeze") {
          casting = true;
          // Step clear of the circle the instant it is planted. Relative to where
          // the player actually IS, because the plant point is captured at cast
          // start — a fixed destination would put them back inside the next one.
          p2.hasPosition.current = {
            x: p2.hasPosition.current.x,
            y: p2.hasPosition.current.y + charge.aoe!.radius + 80,
          };
        }
        if (e.kind === "monster-cast-end" && casting) resolved = true;
      }
      const slow = getStatusEffect(p2.tracksCombat, "slow");
      if (slow && slow.data.speedMult === 0) {
        throw new Error("walking out of a planted Deep Freeze must avoid the root");
      }
    }
    assert(casting && resolved, "the control run should have opened AND resolved a Deep Freeze");
  }
}

// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// 4. THE PLAYER CAN ACTUALLY SEE IT
// ═══════════════════════════════════════════════════════════════════════════
//
// Which creatures arrive TOGETHER is the mechanic — it is the whole of the
// Gravewright's "kill the necromancer or the escort?" question — so it has to
// reach a player-facing surface, not just the spawner.
{
  for (const alphaId of ["gravewright", "magma-brute", "obsidian-tortoise"]) {
    const line = describeMonsterMechanics(def(alphaId)).find((l) => l.id === "pack-alpha");
    assert(!!line, `${alphaId}'s pack should appear in its bestiary mechanics`);
    for (const t of allFollowerTypes(def(alphaId))) {
      assert(
        line!.detail.includes(MONSTER_DATABASE.get(t)!.name),
        `${alphaId}'s pack line should name ${t}`,
      );
    }
  }
  // Followers must NOT repeat their alpha's line — it would just be noise on the
  // creature that is not making the decision.
  assert(
    describeMonsterMechanics(def("ember-scuttler")).every((l) => l.id !== "pack-alpha"),
    "a pack follower should not claim to lead a pack",
  );

  // The Tundra beats need a readable description, or the telegraph is the only
  // thing that ever teaches them.
  for (const [id, name] of [
    ["frost-lurker", "Rime Pounce"],
    ["rime-tusk-mastodon", "Frost-Tusk Impact"],
    ["hoarfrost-yeti", "Deep Freeze"],
  ] as const) {
    const lines = describeMonsterAbilities(def(id));
    assert(
      lines.some((l) => l.name === name && (l.detail ?? "").length > 0),
      `${id} should describe ${name} on its ability panel`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hand a player N stacks of the node's ambient ramp, the way a long fight would.
 *
 * ⚠ `applyStatusEffect` does NOT honour a `stacks` field on the way in — it adds
 * one stack per call — so a test that asks for three stacks in one call silently
 * gets one and the Chill gate never opens.
 */
function chillPlayer(player: PlayerEntity, stacks: number): void {
  for (let i = 0; i < stacks; i++) {
    applyStatusEffect(player.tracksCombat, {
      id: TUNDRA_CHILL_EFFECT_ID,
      maxStacks: 6,
      remainingMs: 600_000,
      refreshable: true,
      sourceId: "test-chill",
      data: { [AMBIENT_RAMP_KEY]: 1, totalMs: 600_000 },
    });
  }
}

function makePlayerSlices(
  id: string,
  nodeId: string,
  x: number,
  y: number,
): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x, y }, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 500_000, maxHp: 500_000, recovery: 0 },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      attunedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  };
}

function makePlayer(world: World, nodeId: string, x: number, y: number): PlayerEntity {
  const id = `p-${nodeId}-${Math.round(x)}-${Math.round(y)}`;
  return world.attachPlayerEntity(makePlayerSlices(id, nodeId, x, y), id);
}

console.log("biomeEcologyPolish: ok");
