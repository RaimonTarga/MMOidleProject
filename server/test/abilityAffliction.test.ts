/**
 * The affliction toolkit: the DoT inventory, Contagion, Detonate, Imbue
 * Lightning, and the `target-max-stacks` rune condition.
 *
 * These are WIRING tests, not balance tests: they assert that the seam
 * enumerates what it should, that a copy is a real full-strength copy, that a
 * detonation actually consumes what it billed for, that a charge window is spent
 * per hit, and that a situational cast declines instead of burning its cooldown.
 * No authored number is asserted except where the mechanic IS the number
 * (charges spent, stacks copied).
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/abilityAffliction.test.ts
 */
import {
  ABILITY_DATABASE,
  ABILITY_IMBUE_EFFECT_ID,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  emptyEquipment,
  emptyAttunedAbilities,
  getStatusEffect,
  resolveAbilityEffect,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import {
  playerDotAtMaxStacks,
  playerDotsOnMonster,
  totalRemainingDamage,
} from "../src/systems/combat/damage/dotInventory";
import {
  afflictionTechniqueHasWork,
  detonateWindupElement,
  resolveContagion,
  resolveDetonate,
} from "../src/systems/player/abilities/abilityAffliction";
import { updateAbilityCasts } from "../src/systems/player/abilities/abilityCasting";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import { STUN_EFFECT } from "../src/systems/combat/status/stun";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { applyImbueWindow } from "../src/systems/player/abilities/abilityImbue";
import { runPlayerAttack } from "../src/systems/combat/engine/combat";
import { emitCombatEvent } from "../src/systems/combat/engine/combatPipeline";
import { syncPlayerBuffs } from "../src/systems/combat/buffs/buffSync";
import { World } from "../src/world/World";
import type { MonsterEntity, PlayerEntity } from "../src/ecs/entity";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = "node-5-5";

function makePlayerSlices(id: string, techniques: string[]): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Afflictor" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: NODE,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
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
      playerTier: 3,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [...techniques],
      attunedAbilities: {
        ...emptyAttunedAbilities(),
        techniques: [...techniques],
      },
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

/**
 * Paint a core class DoT at a given stack depth. `applyStatusEffect` always
 * starts at one and increments, so depth has to be built by repetition — the
 * same thing the real on-hit path does over several swings.
 */
function paintClassDot(
  monster: MonsterEntity,
  sourceId: string,
  stacks: number,
  opts: { damagePerStack?: number; maxStacks?: number } = {},
): void {
  const maxStacks = opts.maxStacks ?? 6;
  for (let i = 0; i < stacks; i++) {
    const effect = applyStatusEffect(monster.tracksCombat, {
      id: "dot",
      maxStacks,
      refreshable: true,
      remainingMs: 4500,
      sourceId,
      data: {
        damagePerStack: opts.damagePerStack ?? 10,
        nextTickIn: 1000,
        tickIntervalMs: 1000,
      },
    });
    effect.data["damagePerStack"] = opts.damagePerStack ?? 10;
  }
}

/** Paint a weapon reservoir DoT with a stored pool. */
function paintReservoir(monster: MonsterEntity, sourceId: string, pool: number): void {
  applyStatusEffect(monster.tracksCombat, {
    id: "swamp-mirebrand-burn",
    maxStacks: 1,
    refreshable: true,
    remainingMs: 4500,
    sourceId,
    data: {
      pool,
      nextTickIn: 1000,
      tickIntervalMs: 1000,
      drainDurationMs: 4500,
      dotMultiplier: 1.15,
    },
  });
}

function spawn(world: World, x: number, y: number): MonsterEntity {
  const monster = world.createMonster(NODE, "plains-slime", { x, y });
  if (!monster) throw new Error("failed to spawn monster");
  monster.hasHealth.maxHp = 100_000;
  monster.hasHealth.hp = 100_000;
  return monster;
}

function setup(techniques: string[]): { world: World; player: PlayerEntity } {
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("afflictor", techniques),
    "afflictor",
  );
  return { world, player };
}

initCombatSystems();

// ── 1. The inventory enumerates every family, and only the owner's ───────────

{
  const { world, player } = setup([]);
  const monster = spawn(world, 410, 400);

  paintClassDot(monster, "afflictor", 3);
  paintReservoir(monster, "afflictor", 250);

  const entries = playerDotsOnMonster(world, player, monster);
  assert(entries.length === 2, `expected 2 owned DoTs, got ${entries.length}`);
  assert(
    entries.every((e) => e.effect.sourceId === "afflictor"),
    "the inventory must only return DoTs the querying player owns",
  );

  // Ownership filter, on a SEPARATE monster on purpose. The core class DoT is one
  // shared `dot` effect per monster and `applyStatusEffect` reassigns `sourceId`
  // to the most recent applier ("latest attacker gets kill credit"), so painting
  // a second player's DoT onto the same target does not create a rival effect —
  // it steals the existing one. That is pre-existing game behaviour, not
  // something this seam introduces, but it means the filter has to be proven
  // somewhere it can actually be observed.
  const someoneElses = spawn(world, 470, 400);
  paintClassDot(someoneElses, "someone-else", 4);
  assert(
    playerDotsOnMonster(world, player, someoneElses).length === 0,
    "the inventory must not return another player's DoTs",
  );

  const families = new Set(entries.map((e) => e.familyId));
  assert(families.has("class-dot"), "the class DoT family must be enumerated");
  assert(
    families.has("weapon-reservoir"),
    "the weapon reservoir family must be enumerated",
  );

  const reservoir = entries.find((e) => e.familyId === "weapon-reservoir")!;
  assert(
    reservoir.remainingDamage >= 250,
    `a reservoir owes at least its pool; got ${reservoir.remainingDamage}`,
  );
  assert(
    reservoir.stackCap === 0,
    "a reservoir must report stackCap 0 — it is maxStacks:1 internally and would " +
      "otherwise read as permanently 'at max'",
  );

  const classDot = entries.find((e) => e.familyId === "class-dot")!;
  assert(
    classDot.remainingDamage > 0,
    "a live class DoT with ticks left must owe damage",
  );
  assert(classDot.stackCap === 6, "the class DoT must report its authored ceiling");
  assert(totalRemainingDamage(entries) > 0, "total owed must be positive");
}
console.log("affliction: inventory enumerates families and respects ownership");

// ── 2. `target-max-stacks` reads stacking DoTs only ──────────────────────────

{
  const { world, player } = setup([]);
  const belowCap = spawn(world, 410, 400);
  paintClassDot(belowCap, "afflictor", 3, { maxStacks: 6 });
  assert(
    !playerDotAtMaxStacks(world, player, belowCap),
    "3 of 6 stacks must not satisfy the max-stacks condition",
  );

  const atCap = spawn(world, 430, 400);
  paintClassDot(atCap, "afflictor", 6, { maxStacks: 6 });
  assert(
    playerDotAtMaxStacks(world, player, atCap),
    "6 of 6 stacks must satisfy the max-stacks condition",
  );

  // The trap this condition was written around: a reservoir is maxStacks:1, so
  // a naive implementation reports "at max" from the very first hit and the
  // condition never turns off again.
  const reservoirOnly = spawn(world, 450, 400);
  paintReservoir(reservoirOnly, "afflictor", 500);
  assert(
    !playerDotAtMaxStacks(world, player, reservoirOnly),
    "a weapon reservoir must NEVER satisfy the max-stacks condition",
  );
}
console.log("affliction: target-max-stacks counts stacking DoTs and ignores reservoirs");

// ── 3. Contagion copies at full strength, capped, leaving the original ───────

{
  const { world, player } = setup(["contagion"]);
  const contagion = ABILITY_DATABASE.get("contagion")!;
  const primary = spawn(world, 400, 400);
  // Eight candidates inside rank II's 150px radius; the cap is 6.
  const victims = [
    spawn(world, 420, 400),
    spawn(world, 440, 400),
    spawn(world, 400, 425),
    spawn(world, 400, 450),
    spawn(world, 460, 400),
    spawn(world, 480, 400),
    spawn(world, 500, 400),
    spawn(world, 520, 400),
  ];
  // Far outside the radius — must never be infected.
  const bystander = spawn(world, 400, 900);

  paintClassDot(primary, "afflictor", 5, { maxStacks: 6 });
  paintReservoir(primary, "afflictor", 300);

  resolveContagion(world, player, contagion, primary);

  // The fixture player is T3 and Contagion is homed at T2, so this is rank II —
  // radius 150, cap 6. The cap, not the radius, is what bounds the spread.
  const infected = victims.filter(
    (v) => getStatusEffect(v.tracksCombat, "dot") !== undefined,
  );
  assert(
    infected.length === 6,
    `rank II must cap at 6 infected targets, got ${infected.length}`,
  );
  assert(
    getStatusEffect(bystander.tracksCombat, "dot") === undefined,
    "a monster outside the radius must never be infected",
  );

  // COPY, not move.
  const originalDot = getStatusEffect(primary.tracksCombat, "dot");
  assert(
    originalDot !== undefined && originalDot.stacks === 5,
    "the original target must keep its own afflictions at full depth",
  );

  // Full strength: stacks AND the reservoir pool travel.
  for (const victim of infected) {
    const dot = getStatusEffect(victim.tracksCombat, "dot")!;
    assert(
      dot.stacks === 5,
      `a copy must carry full stacks; got ${dot.stacks} instead of 5`,
    );
    assert(
      dot.sourceId === "afflictor",
      "a copy must be credited to the player who spread it",
    );
    assert(
      victim.hasDot !== undefined,
      "an infected monster needs the hasDot marker or no tick driver will see it",
    );
    const burn = getStatusEffect(victim.tracksCombat, "swamp-mirebrand-burn");
    assert(burn !== undefined, "the weapon reservoir must spread too");
    assert(
      burn!.data["pool"] === 300,
      `a reservoir copy must carry the full pool; got ${burn!.data["pool"]}`,
    );
    assert(
      victim.hasWeaponDot !== undefined,
      "an infected monster needs the hasWeaponDot marker for the reservoir tick driver",
    );
  }
}
console.log("affliction: Contagion copies at full strength, capped, original retained");

// ── 3b. The cap is per RANK, and rank I (its home tier) is tighter ──────────

{
  const { world, player } = setup(["contagion"]);
  // Contagion's home tier. A T2 player reads rank I: cap 5, not 6.
  player.tracksProgression.playerTier = 2;
  const contagion = ABILITY_DATABASE.get("contagion")!;
  const primary = spawn(world, 400, 400);
  const victims = [
    spawn(world, 415, 400),
    spawn(world, 430, 400),
    spawn(world, 445, 400),
    spawn(world, 400, 460),
    spawn(world, 475, 400),
    spawn(world, 490, 400),
    spawn(world, 505, 400),
  ];
  paintClassDot(primary, "afflictor", 4, { maxStacks: 6 });

  resolveContagion(world, player, contagion, primary);

  const infected = victims.filter(
    (v) => getStatusEffect(v.tracksCombat, "dot") !== undefined,
  );
  assert(
    infected.length === 5,
    `rank I must cap at 5 infected targets, got ${infected.length}`,
  );
  // Nearest-first, so the cap takes the five closest rather than an arbitrary five.
  for (let i = 0; i < 5; i++) {
    assert(
      getStatusEffect(victims[i]!.tracksCombat, "dot") !== undefined,
      `the cap must select the NEAREST candidates, so the cast is aimable by positioning (victim ${i} missed)`,
    );
  }
  for (let i = 5; i < victims.length; i++) {
    assert(
      getStatusEffect(victims[i]!.tracksCombat, "dot") === undefined,
      `the two farthest candidates must be excluded by the cap (victim ${i} was infected)`,
    );
  }
}
console.log("affliction: Contagion's target cap follows the authored rank");

// ── 3c. The wind-up broadcasts the footprint the spread will cover ──────────
//
// Contagion spends a full second deciding which neighbours inherit the target's
// afflictions, and the client draws that circle for the whole wind-up. The
// drawing is only honest if it is the circle the spread actually queries, so the
// radius travels on `player-cast-start` rather than being re-derived in the UI —
// and these assertions are what stop the two from ever parting company.

/** The spread radius the caster's live rank resolves to. */
function contagionRadius(playerTier: number): number {
  const effect = resolveAbilityEffect(ABILITY_DATABASE.get("contagion")!, {
    playerTier,
  });
  if (effect.kind !== "spread-dots") throw new Error("contagion is not a spread");
  return effect.radius;
}

function castStarts(world: World) {
  return world
    .takeNodeEvents(NODE)
    .flatMap((event) => (event.kind === "player-cast-start" ? [event] : []));
}

function castEnds(world: World) {
  return world
    .takeNodeEvents(NODE)
    .flatMap((event) => (event.kind === "player-cast-end" ? [event] : []));
}

/** Arm and begin a Contagion cast on an afflicted `primary`. */
function beginContagion(
  world: World,
  player: PlayerEntity,
  primary: MonsterEntity,
): void {
  setAttackTarget(world, player, primary.isMonster.id);
  player.usesAutocombat.auto = true;
  world.takeNodeEvents(NODE);
  updateAbilityFiring(world, 2_000_000);
}

{
  const { world, player } = setup(["contagion"]);
  const primary = spawn(world, 405, 400);
  paintClassDot(primary, "afflictor", 4, { maxStacks: 6 });

  // THE EDGE TEST. A monster exactly on the drawn rim inherits the afflictions;
  // one pixel further out does not. This is the whole promise the indicator
  // makes, and the cap (3 at this rank) is wide enough that what is being
  // measured here is the RADIUS and not the target limit.
  const radius = contagionRadius(player.tracksProgression.playerTier);
  const onRim = spawn(world, 405 + radius, 400);
  const pastRim = spawn(world, 405 + radius + 1, 400);

  beginContagion(world, player, primary);

  const starts = castStarts(world);
  assert(starts.length === 1, `one wind-up should announce itself, got ${starts.length}`);
  const start = starts[0]!;
  assert(start.ability === "contagion", "the fixture should be casting Contagion");
  assert(
    start.aoeRadius === radius,
    `the wind-up must carry Contagion's authored spread radius (${radius}), got ${String(
      start.aoeRadius,
    )}`,
  );
  // The indicator is centred on the AFFLICTED SOURCE, because that is the origin
  // the spread radiates from — so the event has to name it.
  assert(
    start.targetId === primary.isMonster.id,
    "the wind-up must name the afflicted monster the footprint is centred on",
  );
  assert(
    start.castMs === player.isCastingAbility!.castMs,
    "the footprint's countdown must run on the same clock as the cast",
  );

  updateAbilityCasts(world, 2_000_000 + player.isCastingAbility!.castMs);
  assert(
    getStatusEffect(onRim.tracksCombat, "dot") !== undefined,
    "a monster standing exactly on the drawn rim must actually be infected",
  );
  assert(
    getStatusEffect(pastRim.tracksCombat, "dot") === undefined,
    "a monster outside the drawn rim must inherit nothing",
  );

  const ends = castEnds(world);
  assert(
    ends.length === 1 && ends[0]!.fired,
    "a resolved cast must emit the end event the client clears the footprint on",
  );
}
console.log("affliction: Contagion's wind-up carries the spread radius it resolves with");

// The footprint follows the SOURCE. The client redraws it against that monster's
// live position every frame, which is only honest because the server resolves the
// spread around wherever the source has walked to by the time the cast ends —
// never around a snapshot taken when it started.
{
  const { world, player } = setup(["contagion"]);
  const primary = spawn(world, 405, 400);
  paintClassDot(primary, "afflictor", 4, { maxStacks: 6 });

  const radius = contagionRadius(player.tracksProgression.playerTier);
  // Sits outside the circle drawn at the start, and inside the circle drawn once
  // the source has walked toward it.
  const drifter = spawn(world, 405 + radius + 40, 400);
  // Keeps the cast legal to begin: something must be in radius at arm time.
  const anchorVictim = spawn(world, 415, 400);

  beginContagion(world, player, primary);
  assert(castStarts(world).length === 1, "the wind-up should have announced itself");
  assert(
    getStatusEffect(drifter.tracksCombat, "dot") === undefined,
    "the drifter starts outside the footprint",
  );

  primary.hasPosition.current.x += 60;
  updateAbilityCasts(world, 2_000_000 + player.isCastingAbility!.castMs);

  assert(
    getStatusEffect(drifter.tracksCombat, "dot") !== undefined,
    "the spread must resolve around the source's CURRENT position, which is what " +
      "makes a footprint that tracks the source honest",
  );
  assert(
    getStatusEffect(anchorVictim.tracksCombat, "dot") !== undefined,
    "the anchor victim is still well inside the moved circle",
  );
}
console.log("affliction: Contagion resolves around the source's live position");

// An INTERRUPTED wind-up must clear the footprint just as surely as a resolved
// one — a stale circle would promise a spread that is never coming.
{
  const { world, player } = setup(["contagion"]);
  const primary = spawn(world, 405, 400);
  spawn(world, 415, 400);
  paintClassDot(primary, "afflictor", 4, { maxStacks: 6 });
  beginContagion(world, player, primary);
  assert(castStarts(world).length === 1, "the wind-up should have announced itself");

  applyStatusEffect(player.tracksCombat, {
    id: STUN_EFFECT,
    maxStacks: 1,
    refreshable: true,
    remainingMs: 2_000,
    sourceId: primary.isMonster.id,
    data: { totalMs: 2_000 },
  });
  updateAbilityCasts(world, 2_000_010);
  const ends = castEnds(world);
  assert(
    ends.length === 1 && ends[0]!.fired === false,
    "an interrupted wind-up must still emit the end event that clears the footprint",
  );
}

// Losing the source clears it too — the footprint is centred on that monster, so
// there is nothing left to draw it on.
{
  const { world, player } = setup(["contagion"]);
  const primary = spawn(world, 405, 400);
  spawn(world, 415, 400);
  paintClassDot(primary, "afflictor", 4, { maxStacks: 6 });
  beginContagion(world, player, primary);
  assert(castStarts(world).length === 1, "the wind-up should have announced itself");

  world.removeMonsterEntity(primary.isMonster.id);
  updateAbilityCasts(world, 2_000_010);
  const ends = castEnds(world);
  assert(
    ends.length === 1 && ends[0]!.fired === false,
    "losing the source mid-wind-up must clear the footprint",
  );
}

// Dying mid-wind-up clears it as well. The cast loop only walks LIVE players, so
// without the explicit cancel the footprint would be left drawing over a corpse.
{
  const { world, player } = setup(["contagion"]);
  const primary = spawn(world, 405, 400);
  const victim = spawn(world, 415, 400);
  paintClassDot(primary, "afflictor", 4, { maxStacks: 6 });
  beginContagion(world, player, primary);
  assert(castStarts(world).length === 1, "the wind-up should have announced itself");

  world.killPlayer(player.isPlayer.id, {
    kind: "melee",
    damage: 1,
    killer: {
      monsterTypeId: primary.isMonster.typeId,
      monsterName: "Contagion Source",
      isBoss: false,
      nodeId: NODE,
    },
  });
  assert(
    player.isCastingAbility === undefined,
    "death must drop the wind-up rather than leaving it attached across the respawn",
  );
  const ends = castEnds(world);
  assert(
    ends.length === 1 && ends[0]!.fired === false,
    "dying mid-wind-up must emit the end event that clears the footprint",
  );
  assert(
    getStatusEffect(victim.tracksCombat, "dot") === undefined,
    "a cast the caster did not live to finish spreads nothing",
  );
}
console.log("affliction: every Contagion cancellation path announces the end");

// ── 4. A Contagion copy never WEAKENS an existing affliction ────────────────

{
  const { world, player } = setup(["contagion"]);
  const contagion = ABILITY_DATABASE.get("contagion")!;
  const primary = spawn(world, 400, 400);
  const victim = spawn(world, 420, 400);

  // The primary carries less than the victim already has.
  paintClassDot(primary, "afflictor", 2, { maxStacks: 6 });
  paintClassDot(victim, "afflictor", 5, { maxStacks: 6 });

  resolveContagion(world, player, contagion, primary);

  const dot = getStatusEffect(victim.tracksCombat, "dot")!;
  assert(
    dot.stacks === 5,
    `a weaker copy must not reduce an existing stack (got ${dot.stacks}, expected 5)`,
  );
}
console.log("affliction: a Contagion copy never reduces an existing affliction");

// ── 5. Detonate consumes what it bills for ──────────────────────────────────

{
  const { world, player } = setup(["detonate"]);
  const detonate = ABILITY_DATABASE.get("detonate")!;
  const target = spawn(world, 405, 400);
  target.mitigatesDamage.plating = 0;

  paintClassDot(target, "afflictor", 6, { maxStacks: 6, damagePerStack: 20 });
  paintReservoir(target, "afflictor", 400);

  const owed = totalRemainingDamage(playerDotsOnMonster(world, player, target));
  assert(owed > 0, "the fixture must actually owe damage");

  const hpBefore = target.hasHealth.hp;
  resolveDetonate(world, player, detonate, target);

  assert(
    getStatusEffect(target.tracksCombat, "dot") === undefined,
    "Detonate must consume the class DoT",
  );
  assert(
    getStatusEffect(target.tracksCombat, "swamp-mirebrand-burn") === undefined,
    "Detonate must consume the weapon reservoir too",
  );
  const dealt = hpBefore - target.hasHealth.hp;
  assert(dealt > 0, "Detonate must deal damage");
  assert(
    dealt >= owed,
    `rank I multiplies what was owed (${owed}); dealt only ${dealt}`,
  );
}
console.log("affliction: Detonate consumes every owned DoT and pays out what was owed");

// ── 5b. Detonate's PRESENTATION cues reach the client ───────────────────────
//
// Wiring only: the client cannot work any of this out for itself. The element
// lives in server-only status effects, and Detonate resolves through the AoE
// seam — which has no `player-hit` event — so without these fields the biggest
// number the ability produces renders as a plain white number with no element
// and no crit styling, which is exactly what it used to do.

{
  const { world, player } = setup(["detonate"]);
  const detonate = ABILITY_DATABASE.get("detonate")!;
  const target = spawn(world, 405, 400);
  target.mitigatesDamage.plating = 0;

  paintClassDot(target, "afflictor", 6, { maxStacks: 6, damagePerStack: 20 });
  world.takeNodeEvents(NODE); // drop spawn noise

  resolveDetonate(world, player, detonate, target);
  const events = world.takeNodeEvents(NODE);

  const burst = events.find((e) => e.kind === "dot-detonate");
  assert(burst !== undefined, "Detonate must queue a dot-detonate FX event");
  assert(
    burst!.kind === "dot-detonate" && burst!.element !== undefined,
    "the FX event must name the element it detonated",
  );

  const number = events.find((e) => e.kind === "damage");
  assert(number !== undefined, "Detonate must queue a damage event for its number");
  assert(
    number!.kind === "damage" && number!.element !== undefined,
    "Detonate's damage number must carry the element (it renders white otherwise)",
  );
  assert(
    number!.kind === "damage" && number!.empowered === true,
    "Detonate's damage number must carry the cosmetic crit flag",
  );
  assert(
    burst!.kind === "dot-detonate" &&
      number!.kind === "damage" &&
      burst!.element === number!.element,
    "the FX and the number must agree on the element, or the two cues fight",
  );
}
console.log("affliction: Detonate ships element + crit styling to the client");

// ── 5c. The wind-up can be drawn on the right monster, in the right colour ──
//
// Detonate is a two-second cast. `player-cast-start` has to name the TARGET
// (the FX is drawn on it, and it moves during those two seconds) and the
// element, neither of which the client can derive.

{
  const { world, player } = setup(["detonate"]);
  const detonate = ABILITY_DATABASE.get("detonate")!;
  const target = spawn(world, 405, 400);
  paintClassDot(target, "afflictor", 4, { maxStacks: 6, damagePerStack: 20 });
  world.takeNodeEvents(NODE);

  assert(
    detonateWindupElement(world, player, detonate, target) !== null,
    "a target carrying afflictions must resolve a wind-up colour",
  );

  setAttackTarget(world, player, target.isMonster.id);
  player.usesAutocombat.auto = true;
  updateAbilityFiring(world, 2_000_000);

  const start = world
    .takeNodeEvents(NODE)
    .find((e) => e.kind === "player-cast-start");
  assert(start !== undefined, "beginning Detonate must queue a player-cast-start");
  assert(
    start!.kind === "player-cast-start" && start!.targetId === target.isMonster.id,
    "the wind-up must name the monster it is drawn on",
  );
  assert(
    start!.kind === "player-cast-start" && start!.element !== undefined,
    "the wind-up must carry a colour when the target has afflictions to lose",
  );
  // Detonate is single-target BY DESIGN, so it announces no area. Its sibling
  // Contagion does, and this is what keeps the two from borrowing each other's
  // presentation: a footprint here would promise a splash that never comes.
  assert(
    start!.kind === "player-cast-start" && start!.aoeRadius === undefined,
    "Detonate must carry no footprint radius - absence is what keeps it circle-free",
  );

  // A clean target has no colour to give, so the field is omitted rather than
  // defaulted — the client keeps the bare cast bar instead of drawing a lie.
  const clean = spawn(world, 800, 800);
  assert(
    detonateWindupElement(world, player, detonate, clean) === null,
    "a target carrying nothing must resolve no wind-up colour",
  );
}
console.log("affliction: Detonate's wind-up names its target and its colour");

// ── 6. Both decline when there is nothing to act on ─────────────────────────

{
  const { world, player } = setup(["contagion", "detonate"]);
  const clean = spawn(world, 405, 400);

  for (const id of ["contagion", "detonate"]) {
    const ability = ABILITY_DATABASE.get(id)!;
    assert(
      !afflictionTechniqueHasWork(world, player, ability, clean),
      `${id} must decline against a target carrying no afflictions`,
    );
  }

  // Contagion also declines with afflictions but nobody to give them to: the
  // lone target is the source, and there is no second monster in radius.
  paintClassDot(clean, "afflictor", 4);
  assert(
    !afflictionTechniqueHasWork(
      world,
      player,
      ABILITY_DATABASE.get("contagion")!,
      clean,
    ),
    "Contagion must decline when there is nothing in radius to spread to",
  );
  assert(
    afflictionTechniqueHasWork(
      world,
      player,
      ABILITY_DATABASE.get("detonate")!,
      clean,
    ),
    "Detonate has work as soon as the target carries anything",
  );
}
console.log("affliction: situational casts decline rather than burning a cooldown");

// ── 7. Imbue Lightning: a window spent in HITS, not seconds ─────────────────
//
// Driven through `runPlayerAttack` (the real pipeline), not a bare
// `emitCombatEvent("onHit", ...)` — the bonus is handed off via
// `ctx.metadata["imbueOnHitBonus"]` and folded into the SAME onHitDamage term
// combat.ts applies for gear, so a test that only fires the onHit listeners
// in isolation would pass even if that composition seam were broken.

{
  const { world, player } = setup(["imbue-lightning"]);
  player.tracksProgression.playerTier = 4;
  const imbue = ABILITY_DATABASE.get("imbue-lightning")!;
  const target = spawn(world, 405, 400);

  const attackOpts = {
    attackOrigin: { ...player.hasPosition.current },
    aggroSource: { id: player.isPlayer.id, kind: "player" as const },
  };

  // Baseline: an ordinary hit with no window open, for a same-state comparison.
  target.hasHealth.hp = target.hasHealth.maxHp;
  runPlayerAttack(world, player, target, 0, attackOpts);
  const baselineDamage = target.hasHealth.maxHp - target.hasHealth.hp;

  applyImbueWindow(world, player, imbue);
  const window = getStatusEffect(player.tracksCombat, ABILITY_IMBUE_EFFECT_ID);
  assert(window !== undefined, "Imbue must apply its window");
  assert(
    window!.remainingMs === -1,
    "the window must be PERMANENT by duration — it is spent by charges",
  );
  const charges = window!.data["charges"]!;
  assert(charges > 0, "the window must carry charges");
  const bonus = window!.data["onHitDamage"]!;
  assert(bonus > 0, "the window must carry an on-hit magnitude");

  // Each of the charges must add exactly the bonus on top of the baseline —
  // proof the bonus is composed as part of the real onHitDamage term rather
  // than a separately-added number.
  let spent = 0;
  for (let i = 0; i < charges; i++) {
    target.hasHealth.hp = target.hasHealth.maxHp;
    runPlayerAttack(world, player, target, 1_000 + i, attackOpts);
    const damage = target.hasHealth.maxHp - target.hasHealth.hp;
    assert(
      damage === baselineDamage + bonus,
      `hit ${i + 1} must carry the imbue bonus composed onto the base hit; damage was ${damage}, expected ${baselineDamage + bonus}`,
    );
    spent++;
  }
  assert(spent === charges, "every charge must be spendable");
  assert(
    getStatusEffect(player.tracksCombat, ABILITY_IMBUE_EFFECT_ID) === undefined,
    "the window must be removed once its last charge is spent",
  );

  // One hit past the end must be an ordinary hit again.
  target.hasHealth.hp = target.hasHealth.maxHp;
  runPlayerAttack(world, player, target, 9_999, attackOpts);
  const afterDamage = target.hasHealth.maxHp - target.hasHealth.hp;
  assert(
    afterDamage === baselineDamage,
    `a hit after the window closes must not carry the bonus; damage was ${afterDamage}, expected ${baselineDamage}`,
  );
}
console.log("affliction: Imbue Lightning spends one charge per hit and then closes");

// ── 8. Imbue Lightning gets its own buff tile, and the count is the mechanic ──

{
  const { world, player } = setup(["imbue-lightning"]);
  player.tracksProgression.playerTier = 4;
  const imbue = ABILITY_DATABASE.get("imbue-lightning")!;
  const target = spawn(world, 405, 400);

  const noTile = () =>
    (syncPlayerBuffs(world, Date.now()),
    player.hasStatus.activeBuffs?.find((b) => b.id === ABILITY_IMBUE_EFFECT_ID));

  assert(!noTile(), "no tile before the window is opened");

  applyImbueWindow(world, player, imbue);
  const tile = noTile();
  assert(!!tile, "Imbue must project its own buff tile");
  const total = tile!.stacks;
  assert(total > 1, "the tile must open with its full charge count");
  assert(
    tile!.showSingleStack === true,
    "a countdown must keep showing its badge at one — going blank a hit early " +
      "tells the player the resource is already gone",
  );
  assert(
    tile!.durationPct === -1,
    "Imbue has NO timer; a clock would misrepresent a charge-based window",
  );
  assert(
    (tile!.values ?? []).some((v) => v.label === "Attacks remaining"),
    "the tooltip must state how many attacks are left",
  );

  // Spend down to exactly one and confirm the tile still reports it.
  for (let i = 0; i < total - 1; i++) {
    const ctx = {
      attacker: player,
      defender: target,
      attackerType: "player" as const,
      defenderType: "monster" as const,
      damage: 10,
      cancelled: false,
      metadata: {} as Record<string, unknown>,
    };
    emitCombatEvent("onHit", ctx as never, world);
  }
  const lastTile = noTile();
  assert(
    lastTile?.stacks === 1,
    `the tile must still report the final charge (got ${lastTile?.stacks})`,
  );

  // And disappear once spent, rather than lingering at zero.
  const finalCtx = {
    attacker: player,
    defender: target,
    attackerType: "player" as const,
    defenderType: "monster" as const,
    damage: 10,
    cancelled: false,
    metadata: {} as Record<string, unknown>,
  };
  emitCombatEvent("onHit", finalCtx as never, world);
  assert(!noTile(), "the tile must clear once the last charge is spent");
}
console.log("affliction: Imbue Lightning projects a charge-counting buff tile");

console.log("abilityAffliction: ok");
