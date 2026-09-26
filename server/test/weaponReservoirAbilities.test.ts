/**
 * Ability damage feeds a DoT-conversion weapon's reservoir (2026-09-26).
 *
 * A conversion weapon converts the WIELDER'S damage, whatever delivers it. Cast
 * strikes (Power Strike, Slam) and Sweep splash resolve outside the attack
 * pipeline, so they used to land in full and never reach the reservoir. They now
 * go through the same `feedWeaponReservoir` a normal swing uses. Detonate must
 * NOT feed it: its damage IS a consumed reservoir.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/weaponReservoirAbilities.test.ts
 */
import {
  ABILITY_DATABASE,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
  weaponDotProfileForWeapon,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { syncArchetypeSlices } from "../src/ecs/archetypeSliceSync";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { runPlayerAttack } from "../src/systems/combat/engine/combat";
import { resolveCastPayload } from "../src/systems/player/abilities/abilityEffects";
import { fireWithReferenceWiring } from "./fixtures/abilityWiring";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const WEAPON = "swamp-mirebrand";
const PROFILE = weaponDotProfileForWeapon(WEAPON)!;
assert(!!PROFILE && PROFILE.convPct > 0, `${WEAPON} must be a DoT-conversion weapon`);

function slices(id: string, abilities: string[], weapon: string | null): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: "node-5-5", speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: GAME_CONFIG.PLAYER_RECOVERY },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 3, currentSkillTier: 3, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [...abilities], attunedAbilities: { techniques: [...abilities], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null, knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: { ...emptyEquipment(), weapon }, itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

function spawn(id: string, abilities: string[], weapon: string | null) {
  const world = new World();
  const player = world.attachPlayerEntity(slices(id, abilities, weapon), id);
  player.usesAutocombat.auto = true;
  syncArchetypeSlices(world, player);
  player.dealsDamage.attack = 100;
  return { world, player };
}

function monsterAt(world: World, x: number) {
  const monster = world.createMonster("node-5-5", "plains-slime", { x, y: 400 });
  if (!monster) throw new Error("failed to create target");
  monster.hasHealth.hp = monster.hasHealth.maxHp = 100_000;
  monster.mitigatesDamage.plating = 0;
  monster.mitigatesDamage.damageReduction = 0;
  monster.mitigatesDamage.evasion = 0;
  return monster;
}

const pool = (m: ReturnType<typeof monsterAt>) =>
  getStatusEffect(m.tracksCombat, PROFILE.effectId)?.data.pool ?? 0;

initCombatSystems();

// ── 1. A cast strike converts, exactly like a swing ─────────────────────────
for (const abilityId of ["power-strike", "slam"]) {
  const ability = ABILITY_DATABASE.get(abilityId)!;
  const withWeapon = spawn(`${abilityId}-dot`, [abilityId], WEAPON);
  const bare = spawn(`${abilityId}-bare`, [abilityId], null);
  bare.player.dealsDamage.attack = withWeapon.player.dealsDamage.attack;

  const a = monsterAt(withWeapon.world, 430);
  const b = monsterAt(bare.world, 430);
  resolveCastPayload(withWeapon.world, withWeapon.player, ability, a);
  resolveCastPayload(bare.world, bare.player, ability, b);

  const fullHit = 100_000 - b.hasHealth.hp;
  const convertedHit = 100_000 - a.hasHealth.hp;
  assert(fullHit > 0, `${abilityId}: the control cast must deal damage`);
  assert(a.hasWeaponDot !== undefined && pool(a) > 0, `${abilityId}: the cast must feed the weapon reservoir`);
  assert(
    Math.abs(convertedHit - Math.round(fullHit * (1 - PROFILE.convPct))) <= 1,
    `${abilityId}: the direct hit keeps (1 - convPct) of the cast (${convertedHit} vs ${fullHit})`,
  );
  assert(b.hasWeaponDot === undefined, `${abilityId}: no weapon, no reservoir`);
}

// ── 2. Slam converts on every target it hits ────────────────────────────────
{
  const { world, player } = spawn("slam-area-dot", ["slam"], WEAPON);
  const target = monsterAt(world, 430);
  const inside = monsterAt(world, 470);
  resolveCastPayload(world, player, ABILITY_DATABASE.get("slam")!, target);
  assert(pool(target) > 0 && pool(inside) > 0, "every monster in Slam's area gets its own reservoir");
}

// ── 3. Sweep splash converts on the splashed monster ────────────────────────
{
  const { world, player } = spawn("sweep-dot", ["sweep"], WEAPON);
  const target = monsterAt(world, 430);
  const splashed = monsterAt(world, 470);
  setAttackTarget(world, player, target.isMonster.id);
  fireWithReferenceWiring(world, Date.now());
  assert(player.hasArmedAbility?.abilityId === "sweep", "Sweep must arm for the test to mean anything");
  runPlayerAttack(world, player, target, Date.now(), {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: "player" },
  });
  assert(splashed.hasHealth.hp < 100_000, "the second monster must take Sweep splash");
  assert(pool(splashed) > 0, "Sweep splash must feed the weapon reservoir on the splashed monster");
  assert(pool(target) > 0, "the swing itself still feeds the primary target's reservoir");
}

// ── 4. Detonate does not refill what it consumes ────────────────────────────
{
  const { world, player } = spawn("detonate-dot", ["power-strike", "detonate"], WEAPON);
  const target = monsterAt(world, 430);
  resolveCastPayload(world, player, ABILITY_DATABASE.get("power-strike")!, target);
  assert(pool(target) > 0, "setup: the reservoir must be primed");
  resolveCastPayload(world, player, ABILITY_DATABASE.get("detonate")!, target);
  assert(pool(target) === 0 && target.hasWeaponDot === undefined, "Detonate consumes the reservoir and does not refill it");
}

console.log("weaponReservoirAbilities: ok");
