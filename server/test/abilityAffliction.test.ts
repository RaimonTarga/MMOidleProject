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
  emptyEquippedAbilities,
  getStatusEffect,
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
  resolveContagion,
  resolveDetonate,
} from "../src/systems/player/abilities/abilityAffliction";
import { applyImbueWindow } from "../src/systems/player/abilities/abilityImbue";
import { emitCombatEvent } from "../src/systems/combat/engine/combatPipeline";
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
      equippedAbilities: {
        ...emptyEquippedAbilities(),
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
  // Five candidates inside rank I's 140px radius; the cap is 3.
  const victims = [
    spawn(world, 420, 400),
    spawn(world, 440, 400),
    spawn(world, 400, 425),
    spawn(world, 400, 450),
    spawn(world, 460, 400),
  ];
  // Far outside the radius — must never be infected.
  const bystander = spawn(world, 400, 900);

  paintClassDot(primary, "afflictor", 5, { maxStacks: 6 });
  paintReservoir(primary, "afflictor", 300);

  resolveContagion(world, player, contagion, primary);

  const infected = victims.filter(
    (v) => getStatusEffect(v.tracksCombat, "dot") !== undefined,
  );
  assert(
    infected.length === 3,
    `rank I must cap at 3 infected targets, got ${infected.length}`,
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

{
  const { world, player } = setup(["imbue-lightning"]);
  player.tracksProgression.playerTier = 4;
  const imbue = ABILITY_DATABASE.get("imbue-lightning")!;
  const target = spawn(world, 405, 400);

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

  // Drive real onHit events through the pipeline; each must add the bonus and
  // spend exactly one charge.
  let spent = 0;
  for (let i = 0; i < charges; i++) {
    const ctx = {
      attacker: player,
      defender: target,
      attackerType: "player" as const,
      defenderType: "monster" as const,
      damage: 100,
      cancelled: false,
      metadata: {} as Record<string, unknown>,
    };
    emitCombatEvent("onHit", ctx as never, world);
    assert(
      ctx.damage === 100 + bonus,
      `hit ${i + 1} must carry the imbue bonus; damage was ${ctx.damage}`,
    );
    spent++;
  }
  assert(spent === charges, "every charge must be spendable");
  assert(
    getStatusEffect(player.tracksCombat, ABILITY_IMBUE_EFFECT_ID) === undefined,
    "the window must be removed once its last charge is spent",
  );

  // One hit past the end must be an ordinary hit.
  const after = {
    attacker: player,
    defender: target,
    attackerType: "player" as const,
    defenderType: "monster" as const,
    damage: 100,
    cancelled: false,
    metadata: {} as Record<string, unknown>,
  };
  emitCombatEvent("onHit", after as never, world);
  assert(
    after.damage === 100,
    "a hit after the window closes must not carry the bonus",
  );
}
console.log("affliction: Imbue Lightning spends one charge per hit and then closes");

console.log("abilityAffliction: ok");
