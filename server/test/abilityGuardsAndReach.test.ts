/**
 * The Guard families and the extended-reach Techniques.
 *
 * Covers the behaviours this rework introduced that nothing else asserts:
 *   1. Cleanse is DISCRETE (n stacks off m afflictions, deterministic order) and
 *      carries no damage-reduction rider;
 *   2. Break Free fires WHILE hard-controlled — the one trigger that has to work
 *      when the player cannot act — and its resistance shortens the next stun;
 *   3. Frenzy's attack speed lives in a status effect, never in `attackCooldown`;
 *   4. two Recovery Guards run on independent sources, so the strong/short one
 *      cannot ride the weak/long one's window;
 *   5. an ability's ENGAGEMENT RANGE lets a cast open on something the player
 *      cannot reach, and holds position while it does.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/abilityGuardsAndReach.test.ts
 */
import {
  ABILITY_CONTROL_RESIST_EFFECT_ID,
  ABILITY_FRENZY_EFFECT_ID,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  emptyEquipment,
  getResource,
  getStatusEffect,
  guardEffectIdForSlot,
  hasStatusEffect,
  recoveryEffectIdForSlot,
  emptyEquippedAbilities,
  type TracksCombat,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import {
  beginAbilityCast,
  holdsPositionWhileCasting,
} from "../src/systems/player/abilities/abilityCasting";
import { STUN_EFFECT, applyStun } from "../src/systems/combat/status/stun";
import { syncPlayerControlLockout } from "../src/systems/combat/status/playerControlLockout";
import { ABILITY_DATABASE } from "@mmo-idle/shared";
import { World } from "../src/world/World";
import { takeWorldLogEvents } from "../src/world/worldLog";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(
  id: string,
  techniques: string[],
  guards: string[],
  playerTier = 4,
): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Guardian" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
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
      playerTier,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [...techniques, ...guards],
      equippedAbilities: {
        ...emptyEquippedAbilities(),
        techniques: [...techniques],
        guards: [...guards],
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
 * Stack a harmful effect to `stacks`. `applyStatusEffect` always starts at one
 * and increments, so a fixture that wants depth has to apply repeatedly.
 */
function paintDebuff(cs: TracksCombat, id: string, stacks: number): void {
  for (let i = 0; i < stacks; i++) {
    applyStatusEffect(cs, {
      id,
      maxStacks: 9,
      remainingMs: 60_000,
      refreshable: true,
      sourceId: "tester",
      data: { totalMs: 60_000 },
    });
  }
}

initCombatSystems();

// ── 1. Cleanse: discrete, prioritised, and with no DR rider ──────────────────

{
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("cleanse-player", [], ["cleanse"]),
    "cleanse-player",
  );
  // Two afflictions at different depths. Cleanse IV strips 3 stacks off up to 2,
  // deepest first — that ordering is authored, not map order.
  paintDebuff(player.tracksCombat, "swamp-rot", 5);
  paintDebuff(player.tracksCombat, "antiheal", 2);

  updateAbilityFiring(world, Date.now());

  const rot = getStatusEffect(player.tracksCombat, "swamp-rot");
  assert(!!rot && rot.stacks === 2, `deepest affliction should lose 3 stacks, got ${rot?.stacks}`);
  const anti = getStatusEffect(player.tracksCombat, "antiheal");
  assert(!anti || anti.stacks === 0, "the second affliction should be stripped to nothing");
  // The accidental post-cleanse damage reduction is gone: mitigation belongs to
  // Brace and Endure, and a Guard that quietly did both would make them redundant.
  assert(
    getStatusEffect(player.tracksCombat, guardEffectIdForSlot(0)) === undefined,
    "Cleanse must not grant a damage-reduction buff",
  );
  const activation = takeWorldLogEvents(world, player.isPlayer.id).find(
    (event) => event.kind === "ability-activation" && event.abilityId === "cleanse",
  );
  assert(
    activation?.kind === "ability-activation" &&
      activation.removedEffects?.some((effect) => effect.effectId === "swamp-rot" && effect.stacks === 3),
    "Cleanse telemetry should record the actual harmful stacks removed",
  );
}

// Cleanse with nothing to strip must hold its cooldown.
{
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("cleanse-idle", [], ["cleanse"]),
    "cleanse-idle",
  );
  updateAbilityFiring(world, Date.now());
  assert(
    !player.tracksCombat.cooldowns["ability.cd.cleanse"],
    "Cleanse must not fire with no eligible affliction",
  );
}

// ── 2. Break Free works through hard control ─────────────────────────────────

{
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("breakfree-player", [], ["break-free"]),
    "breakfree-player",
  );

  applyStun(player.tracksCombat, 4000, "tester");
  syncPlayerControlLockout(world, player);
  assert(player.isRooted !== undefined, "the stun should have locked the player down");

  updateAbilityFiring(world, Date.now());

  assert(
    !hasStatusEffect(player.tracksCombat, STUN_EFFECT),
    "Break Free must remove the hard control holding the player",
  );
  // Removing the effect is not enough — the lockout reconciler owns isRooted and
  // cannotAttack, so a stale marker would leave the player free on paper only.
  assert(player.isRooted === undefined, "the movement lock must lift with the stun");
  assert(player.cannotAttack === undefined, "the attack lock must lift with the stun");

  const resist = getStatusEffect(player.tracksCombat, ABILITY_CONTROL_RESIST_EFFECT_ID);
  assert(!!resist, "Break Free II should leave a control-resistance window");

  // Post-stun immunity is live right after a stun, so clear it before testing the
  // resistance — otherwise the second stun is refused for an unrelated reason.
  player.tracksCombat.statusEffects = player.tracksCombat.statusEffects.filter(
    (e) => e.id !== "stun-immune",
  );
  applyStun(player.tracksCombat, 2000, "tester");
  const shortened = getStatusEffect(player.tracksCombat, STUN_EFFECT);
  assert(
    !!shortened && shortened.remainingMs < 2000,
    `control resistance should shorten the next stun, got ${shortened?.remainingMs}`,
  );
}

// Break Free with nothing holding the player must not burn its cooldown.
{
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("breakfree-idle", [], ["break-free"]),
    "breakfree-idle",
  );
  updateAbilityFiring(world, Date.now());
  assert(
    player.tracksCombat.cooldowns["ability.cd.break-free"] === undefined,
    "Break Free must not fire when the player is not controlled",
  );
}

// ── 3. Frenzy never writes the attack-cooldown stat ──────────────────────────

{
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("frenzy-player", ["frenzy"], []),
    "frenzy-player",
  );
  const target = world.createMonster("node-5-5", "plains-slime", { x: 410, y: 400 });
  if (!target) throw new Error("failed to create target");
  setAttackTarget(world, player, target.isMonster.id);

  const baseCd = player.performsAttack.attackCooldown;
  updateAbilityFiring(world, Date.now());

  const buff = getStatusEffect(player.tracksCombat, ABILITY_FRENZY_EFFECT_ID);
  assert(!!buff, "Frenzy should apply its attack-speed window");
  assert(buff!.data["attackSpeedPct"] > 0, "the window must carry its magnitude");
  // The Zealot's Frenzy mutates attackCooldown from a cached base. A second
  // mutator would read that output as ITS clean base and the two would ratchet
  // the cooldown toward zero, so this one stays a read at the cadence gate.
  assert(
    player.performsAttack.attackCooldown === baseCd,
    "Frenzy must not write the attack-cooldown stat",
  );
  // An instant Technique is self-facing: it must not occupy the armed channel.
  assert(
    player.hasArmedAbility === undefined,
    "an instant Technique must not arm the next attack",
  );
}

// ── 4. Two Recovery Guards, two independent windows ──────────────────────────

{
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("recovery-player", [], ["second-wind", "recuperate"]),
    "recovery-player",
  );
  player.hasHealth.hp = player.hasHealth.maxHp * 0.5;

  // One activation per decision window, so drive two windows.
  updateAbilityFiring(world, Date.now());
  player.tracksCombat.cooldowns["ability.guard.window"] = 0;
  updateAbilityFiring(world, Date.now());

  assert(
    !!getStatusEffect(player.tracksCombat, recoveryEffectIdForSlot(0)),
    "the first Recovery Guard should have its own buff",
  );
  assert(
    !!getStatusEffect(player.tracksCombat, recoveryEffectIdForSlot(1)),
    "the second Recovery Guard should have an INDEPENDENT buff, not overwrite the first",
  );
  // Sharing one engine source would let Second Wind's 70% ride Recuperate's 10s
  // window — strictly better than either ability as authored.
  assert(
    getResource(player.tracksCombat, "recovery.skillPct") > 0 &&
      getResource(player.tracksCombat, "recovery.skill2Pct") > 0,
    "each Recovery Guard must switch on its own Recovery source",
  );
  assert(
    getResource(player.tracksCombat, "recovery.skillMs") !==
      getResource(player.tracksCombat, "recovery.skill2Ms"),
    "the strong/short and weak/long windows must stay different lengths",
  );
}

// ── 5. Engagement range: a cast opens beyond the player's own reach ──────────

{
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("snipe-player", ["snipe"], []),
    "snipe-player",
  );
  // 200px away: far outside a 12px melee reach, well inside Snipe's +300.
  const target = world.createMonster("node-5-5", "plains-slime", { x: 600, y: 400 });
  if (!target) throw new Error("failed to create target");

  assert(
    !world.collision.canReach(player, target, player.performsAttack.attackRange),
    "the fixture must place the target outside the player's own reach",
  );

  const snipe = ABILITY_DATABASE.get("snipe")!;
  const started = beginAbilityCast(world, player, snipe, 0, 1_000);
  assert(started, "Snipe must be able to open on a target the player cannot reach");
  assert(
    player.isCastingAbility?.targetId === target.isMonster.id,
    "the cast should have claimed the distant target",
  );
  // Holding position is what turns extra reach into a real standoff tool rather
  // than a slow opener the player immediately walks out of.
  assert(
    holdsPositionWhileCasting(player),
    "a cast with extra reach should hold the player's position",
  );

  // A cast with no reach bonus must not hold position — ordinary casts still
  // walk with the fight, because auto-movement is rune-driven.
  const world2 = new World();
  const player2 = world2.attachPlayerEntity(
    makePlayerSlices("power-player", ["power-strike"], []),
    "power-player",
  );
  const near = world2.createMonster("node-5-5", "plains-slime", { x: 410, y: 400 });
  if (!near) throw new Error("failed to create target");
  assert(
    beginAbilityCast(world2, player2, ABILITY_DATABASE.get("power-strike")!, 0, 1_000),
    "Power Strike should open on an adjacent target",
  );
  assert(
    !holdsPositionWhileCasting(player2),
    "a cast without extra reach must not pin the player in place",
  );
}

console.log("abilityGuardsAndReach: ok");
