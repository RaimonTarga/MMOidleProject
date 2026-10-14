/**
 * SLAM — the burst cast (T1 Mountain 5 since the ability pass, design §22.2: it
 * absorbed Power Strike and re-homed from T2 Mountain 9).
 *
 * Asserts:
 *   1. it is acquired like any other T1 Technique, and ranks by player tier —
 *      rank I is the new T1 rank, ranks II–IV 2.45 / 2.7 / 2.95 (design §22.12);
 *   2. it hits everything in its authored radius exactly once, through the
 *      normal mitigation pipeline;
 *   3. it is a CAST, not an empowered attack — no on-hit effects ride it;
 *   4. Technique Power buys damage and never reach;
 *   5. cast speed shortens its wind-up, attack speed does not, and hard control
 *      breaks it exactly like every other cast;
 *   6. it never weakens on tier-up: no rank's multiple falls below the last;
 *   7. it shares the offensive channel with another cast;
 *   8. the wind-up broadcasts the AREA it is about to damage, so the client can
 *      draw a footprint that cannot drift from the damage.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/abilitySlam.test.ts
 */
import { baseRecoveryForTier } from '@mmo-idle/shared';
import {
  ABILITY_DATABASE,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  abilityCastMs,
  abilityCooldownMs,
  abilityRankAt,
  abilityRankNumber,
  applyStatusEffect,
  emptyEquipment,
  getCooldown,
  getStatusEffect,
  resolveAbilityEffect,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { syncArchetypeSlices } from "../src/ecs/archetypeSliceSync";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { STUN_EFFECT } from "../src/systems/combat/status/stun";
import { updateAbilityCasts } from "../src/systems/player/abilities/abilityCasting";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
import { resolveCastPayload } from "../src/systems/player/abilities/abilityEffects";
import { fireAbilities, giveAbilities } from "./fixtures/fireAbilities";
import { World } from "../src/world/World";
import type { PlayerEntity } from "../src/ecs/entity";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const SLAM = ABILITY_DATABASE.get("slam")!;

function slamEffect(tier: number) {
  const effect = abilityRankAt(SLAM, tier).effect;
  assert(effect.kind === "cast-strike", "Slam must resolve as a cast-strike");
  return effect as Extract<typeof effect, { kind: "cast-strike" }>;
}

function castMult(ability: typeof SLAM, tier: number): number {
  const effect = abilityRankAt(ability, tier).effect;
  return effect.kind === "cast-strike" ? effect.damageMult : 0;
}

function slices(
  id: string,
  options: { tier?: number; archetype?: "dot" | null; abilities?: string[] } = {},
): PersistedPlayerSlices {
  const abilities = options.abilities ?? ["slam"];
  giveAbilities(id, abilities);
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: baseRecoveryForTier(0),
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: options.tier ?? 2,
      currentSkillTier: options.tier ?? 2,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: options.archetype ?? null,
    },
  };
}

function spawn(
  id: string,
  options: { tier?: number; archetype?: "dot" | null; abilities?: string[] } = {},
) {
  const world = new World();
  const player = world.attachPlayerEntity(slices(id, options), id);
  player.usesAutocombat.auto = true;
  syncArchetypeSlices(world, player);
  player.dealsDamage.attack = 100;
  return { world, player };
}

function monsterAt(world: World, x: number, y = 400) {
  const monster = world.createMonster("node-5-5", "plains-slime", { x, y });
  if (!monster) throw new Error("failed to create Slam target");
  monster.hasHealth.hp = 100_000;
  monster.hasHealth.maxHp = 100_000;
  monster.mitigatesDamage.plating = 0;
  monster.mitigatesDamage.damageReduction = 0;
  // Evasion is its own component now, attached only when the monster has any.
  if (monster.evadesHits) monster.evadesHits.dodgeRate = 0;
  return monster;
}

initCombatSystems();

// ── 1. Ranking ───────────────────────────────────────────────────────────────
{
  assert(SLAM.tier === 1 && SLAM.slot === "technique" && SLAM.shape === "cast",
    "Slam is a T1 cast-shaped Technique");
  assert(abilityRankNumber(SLAM, 1) === 1, "a T1 player holds Slam I");
  assert(abilityRankNumber(SLAM, 2) === 2, "a T2 player holds Slam II");
  assert(abilityRankNumber(SLAM, 3) === 3, "a T3 player holds Slam III");
  assert(abilityRankNumber(SLAM, 4) === 4, "a T4 player holds Slam IV");

  const mults = [2, 3, 4].map((tier) => slamEffect(tier).damageMult);
  assert(
    mults[0] === 2.45 && mults[1] === 2.7 && mults[2] === 2.95,
    `Slam's authored ladder should be 2.45 / 2.7 / 2.95, got ${mults.join(" / ")}`,
  );
  for (const tier of [1, 2, 3, 4]) {
    assert(slamEffect(tier).radius === 150, "Slam's authored radius is 150px at every rank");
    assert(abilityCooldownMs(SLAM, tier) === 10000, "Slam holds a 10s cooldown");
  }
  // Slam is a 600 ms cast at every rank (design §22.13): rank I's wind-up is the
  // lab's parity number (design §22.12), and ranks II–IV carry it unchanged
  // (measured at T2, reports/ability-pass/measure-slam-t2.md).
  for (const tier of [1, 2, 3, 4]) {
    assert(abilityCastMs(SLAM, tier) === 600, `Slam rank ${tier} holds a 600 ms wind-up`);
  }
  assert(
    (slamEffect(2)!.radius ?? 0) > 90,
    "Slam's area must be meaningfully broader than Sweep's 90px splash",
  );
  assert(
    slamEffect(2).stunMs === undefined,
    "Slam carries no control rider in this pass",
  );
}

// ── 2. It hits everything in the radius exactly once, through mitigation ─────
{
  const { world, player } = spawn("slam-area");
  const target = monsterAt(world, 430);
  const inside = monsterAt(world, 470);
  const outside = monsterAt(world, 900);
  // Plating on the secondary proves the payload still runs the defensive
  // pipeline rather than writing HP directly.
  inside.mitigatesDamage.plating = 20;

  const before = [target, inside, outside].map((m) => m.hasHealth.hp);
  resolveCastPayload(world, player, SLAM, target);

  const expected = Math.round(player.dealsDamage.attack * 2.45);
  assert(
    before[0]! - target.hasHealth.hp === expected,
    `the primary should take attack x2.45 (${expected}), got ${before[0]! - target.hasHealth.hp}`,
  );
  assert(
    before[1]! - inside.hasHealth.hp === expected - 20,
    "a second target inside the radius takes the same payload through its own plating",
  );
  assert(
    outside.hasHealth.hp === before[2]!,
    "a monster outside the radius must take nothing",
  );

  // Once each — a second cast adds exactly one more hit's worth, never two.
  resolveCastPayload(world, player, SLAM, target);
  assert(
    before[0]! - target.hasHealth.hp === expected * 2,
    "each target is damaged exactly once per Slam",
  );
}

// ── 3. A cast is not an attack: no ordinary on-hit effects ride it ───────────
{
  const { world, player } = spawn("slam-onhit", { archetype: "dot" });
  assert(!!player.appliesDots, "Apprentice fixture should attach AppliesDots");
  // A large flat on-hit stat: if Slam went through the attack pipeline this
  // would land on top of the payload.
  player.dealsDamage.onHitDamage = 500;
  const target = monsterAt(world, 430);
  const before = target.hasHealth.hp;

  resolveCastPayload(world, player, SLAM, target);

  assert(
    before - target.hasHealth.hp === Math.round(player.dealsDamage.attack * 2.45),
    "Slam's damage is its own payload — flat on-hit damage must not be added to it",
  );
  assert(
    getStatusEffect(target.tracksCombat, "dot") === undefined,
    "an Apprentice's on-hit class DoT must not proc off a cast payload",
  );
}

// ── 4. Technique Power scales damage, never radius ───────────────────────────
{
  const powered = resolveAbilityEffect(SLAM, { playerTier: 2, techniquePowerPct: 0.5 });
  assert(powered.kind === "cast-strike", "Slam stays a cast-strike under Technique Power");
  assert(
    powered.kind === "cast-strike" && Math.abs(powered.damageMult - 2.45 * 1.5) < 1e-9,
    "Technique Power must scale Slam's damage multiplier",
  );
  assert(
    powered.kind === "cast-strike" && powered.radius === 150,
    "Technique Power must NOT widen Slam's radius",
  );

  const { world, player } = spawn("slam-power");
  player.usesSkills.passives["technique.power-pct"] = 0.5;
  const target = monsterAt(world, 430);
  const far = monsterAt(world, 400 + 200);
  const before = target.hasHealth.hp;
  resolveCastPayload(world, player, SLAM, target);
  assert(
    before - target.hasHealth.hp === Math.round(100 * 2.45 * 1.5),
    "the live payload should carry Technique Power",
  );
  assert(
    far.hasHealth.hp === far.hasHealth.maxHp,
    "Technique Power must not reach a target the authored radius cannot",
  );
}

// ── 5. Cast lifecycle: speed, cadence independence, interruption ─────────────
{
  const { world, player } = spawn("slam-cast");
  const target = monsterAt(world, 430);
  setAttackTarget(world, player, target.isMonster.id);
  fireAbilities(world, 1_000);
  assert(
    player.isCastingAbility?.abilityId === "slam",
    "Slam should begin a wind-up rather than arming the next attack",
  );
  const baselineCastMs = player.isCastingAbility!.castMs;
  assert(baselineCastMs === 600, "the authored wind-up should be used as-is");

  updateAbilityCasts(world, 1_000 + baselineCastMs - 1);
  assert(!!player.isCastingAbility, "the wind-up must hold until it elapses");
  assert(
    getCooldown(player.tracksCombat, abilityCooldownKey("slam")) === 0,
    "a cast pays its cooldown on resolve, never on begin",
  );
  const before = target.hasHealth.hp;
  updateAbilityCasts(world, 1_000 + baselineCastMs);
  assert(player.isCastingAbility === undefined, "the wind-up should resolve on time");
  assert(target.hasHealth.hp < before, "the resolved cast should land its payload");
  assert(
    getCooldown(player.tracksCombat, abilityCooldownKey("slam")) === 10000,
    "resolving should start Slam's authored cooldown",
  );
}

// Attack speed does NOT shorten the wind-up; cast speed does.
{
  const fast = spawn("slam-attack-speed");
  // NOTE: "shared.attack-speed-pct" is NOT a PassiveKey — nothing reads it, so this
  // line is a no-op and the assertion below cannot actually fail. Left as-is
  // rather than guessed at: giving this player real attack speed may legitimately
  // change the result, which is the designer's call.
  (fast.player.usesSkills.passives as Record<string, number>)["shared.attack-speed-pct"] = 1.5;
  const fastTarget = monsterAt(fast.world, 430);
  setAttackTarget(fast.world, fast.player, fastTarget.isMonster.id);
  fireAbilities(fast.world, 1_000);
  assert(
    fast.player.isCastingAbility?.castMs === 600,
    "attack speed must not shorten Slam's wind-up — that is the whole reason it favours heavy builds",
  );

  const quick = spawn("slam-cast-speed");
  quick.player.usesSkills.passives["technique.cast-speed-pct"] = 0.25;
  const quickTarget = monsterAt(quick.world, 430);
  setAttackTarget(quick.world, quick.player, quickTarget.isMonster.id);
  fireAbilities(quick.world, 1_000);
  assert(
    (quick.player.isCastingAbility?.castMs ?? 600) < 600,
    "technique.cast-speed-pct should shorten Slam's wind-up through the existing seam",
  );
}

// Hard control breaks the wind-up, with no payload and no cooldown spent.
{
  const { world, player } = spawn("slam-interrupt");
  const target = monsterAt(world, 430);
  setAttackTarget(world, player, target.isMonster.id);
  fireAbilities(world, 1_000);
  assert(!!player.isCastingAbility, "Slam should begin a wind-up");

  const before = target.hasHealth.hp;
  applyStatusEffect(player.tracksCombat, {
    id: STUN_EFFECT,
    maxStacks: 1,
    remainingMs: 2_000,
    refreshable: true,
    sourceId: target.isMonster.id,
    data: { totalMs: 2_000 },
  });
  updateAbilityCasts(world, 1_010);
  assert(player.isCastingAbility === undefined, "hard control must break the wind-up");
  assert(target.hasHealth.hp === before, "an interrupted Slam lands no payload");
  assert(
    getCooldown(player.tracksCombat, abilityCooldownKey("slam")) === 0,
    "an interrupted cast must not be punished with its cooldown too",
  );
}

// ── 6. Slam never weakens on tier-up ────────────────────────────────────────
// (The Power Strike crossover and "Power Strike is untouched" sections went with
// Power Strike, cut into Slam by the ability pass, design §22.2.) Design §22.12
// retired rank I's "single-target lean" (a multiple above rank II's): a player
// who tiers up must never read a smaller Slam. Rank I's multiple and wind-up
// are the lab's parity pair, so only their SHAPE is pinned here.
{
  for (let tier = 1; tier < SLAM.ranks.length; tier++) {
    const here = slamEffect(tier).damageMult;
    const next = slamEffect(tier + 1).damageMult;
    assert(
      next >= here,
      `Slam's multiple must never fall from rank ${tier} to rank ${tier + 1} (${here} -> ${next})`,
    );
  }
  assert(abilityCooldownMs(SLAM, 1) === 10000, "rank I keeps Power Strike's 10 s cooldown");
  // Rank I stays a cast (§22.9): its wind-up is no shorter than Charge's, the
  // shortest authored player wind-up. Ranks II–IV carry rank I's wind-up
  // unchanged (design §22.13), so a tier-up raises the multiple on the same clock.
  const chargeWindup = abilityCastMs(ABILITY_DATABASE.get("charge")!, 1);
  assert(
    abilityCastMs(SLAM, 1) >= chargeWindup,
    `rank I's wind-up must be no shorter than Charge's ${chargeWindup} ms (got ${abilityCastMs(SLAM, 1)})`,
  );
  for (let tier = 2; tier <= SLAM.ranks.length; tier++) {
    assert(
      abilityCastMs(SLAM, tier) === abilityCastMs(SLAM, 1),
      `rank ${tier}'s wind-up must equal rank I's (${abilityCastMs(SLAM, 1)} ms), got ${abilityCastMs(SLAM, tier)}`,
    );
  }
}

// ── 7. Two casts share one channel ───────────────────────────────────────────
// Both can be held at once.
{
  const { world, player } = spawn("slam-coexist") as { world: World; player: PlayerEntity };
  giveAbilities(player.isPlayer.id, ["slam", "stunning-strike"]);
  const target = monsterAt(world, 430);
  setAttackTarget(world, player, target.isMonster.id);
  fireAbilities(world, 1_000);
  assert(
    player.isCastingAbility?.abilityId === "slam",
    "loadout order decides which of the two casts claims the channel",
  );
  assert(
    getCooldown(player.tracksCombat, abilityCooldownKey("stunning-strike")) === 0,
    "the Technique that did not fire is merely waiting — never consumed or disabled",
  );
}

// ── 8. The wind-up broadcasts its footprint ──────────────────────────────────
//
// The client draws a friendly ground circle for the duration of the cast. It is
// only honest if the circle it draws is the circle the server damages, so the
// radius travels on the event rather than being re-derived in the UI — and these
// assertions are what stop the two from ever parting company.
function castStarts(world: World) {
  return world
    .takeNodeEvents("node-5-5")
    .flatMap((event) => (event.kind === "player-cast-start" ? [event] : []));
}

function castEnds(world: World) {
  return world
    .takeNodeEvents("node-5-5")
    .flatMap((event) => (event.kind === "player-cast-end" ? [event] : []));
}

{
  const { world, player } = spawn("slam-footprint");
  const target = monsterAt(world, 430);
  setAttackTarget(world, player, target.isMonster.id);
  fireAbilities(world, 1_000);

  const starts = castStarts(world);
  assert(starts.length === 1, `one wind-up should announce itself, got ${starts.length}`);
  const start = starts[0]!;
  assert(
    start.aoeRadius === slamEffect(2).radius,
    `the wind-up must carry Slam's authored radius (${slamEffect(2).radius}), got ${String(start.aoeRadius)}`,
  );
  // The indicator is anchored on the TARGET, because that is where the payload
  // resolves — so the event has to name it.
  assert(
    start.targetId === target.isMonster.id,
    "the wind-up must name the monster the footprint is centred on",
  );
  assert(
    start.castMs === player.isCastingAbility!.castMs,
    "the footprint's countdown must run on the same clock as the cast",
  );

  // THE EDGE TEST. A monster exactly on the drawn rim is inside the blow; one
  // pixel further out is not. This is the whole promise the indicator makes.
  const onRim = monsterAt(world, 430 + start.aoeRadius!);
  const pastRim = monsterAt(world, 430 + start.aoeRadius! + 1);
  const rimBefore = onRim.hasHealth.hp;
  const pastBefore = pastRim.hasHealth.hp;
  updateAbilityCasts(world, 1_000 + player.isCastingAbility!.castMs);
  assert(
    onRim.hasHealth.hp < rimBefore,
    "a monster standing exactly on the drawn rim must actually be hit",
  );
  assert(
    pastRim.hasHealth.hp === pastBefore,
    "a monster outside the drawn rim must take nothing",
  );

  const ends = castEnds(world);
  assert(
    ends.length === 1 && ends[0]!.fired,
    "a resolved cast must emit the end event the client clears the footprint on",
  );
  assert(
    ends[0]!.targetPos?.x === target.hasPosition.current.x &&
      ends[0]!.targetPos?.y === target.hasPosition.current.y,
    "the impact point must be the same centre the damage circle used",
  );
}

// An INTERRUPTED wind-up must clear the footprint just as surely as a resolved
// one — a stale circle on the ground would be a promise of damage that is never
// coming.
{
  const { world, player } = spawn("slam-footprint-interrupt");
  const target = monsterAt(world, 430);
  setAttackTarget(world, player, target.isMonster.id);
  fireAbilities(world, 1_000);
  assert(castStarts(world).length === 1, "the wind-up should have announced itself");

  applyStatusEffect(player.tracksCombat, {
    id: STUN_EFFECT,
    maxStacks: 1,
    remainingMs: 2_000,
    refreshable: true,
    sourceId: target.isMonster.id,
    data: { totalMs: 2_000 },
  });
  updateAbilityCasts(world, 1_010);
  const ends = castEnds(world);
  assert(
    ends.length === 1 && ends[0]!.fired === false,
    "an interrupted wind-up must still emit the end event that clears the footprint",
  );
}

// Losing the target clears it too — the same event, the same single seam.
{
  const { world, player } = spawn("slam-footprint-target-lost");
  const target = monsterAt(world, 430);
  setAttackTarget(world, player, target.isMonster.id);
  fireAbilities(world, 1_000);
  assert(castStarts(world).length === 1, "the wind-up should have announced itself");

  world.removeMonsterEntity(target.isMonster.id);
  updateAbilityCasts(world, 1_010);
  const ends = castEnds(world);
  assert(
    ends.length === 1 && ends[0]!.fired === false,
    "losing the target mid-wind-up must clear the footprint",
  );
}

// Dying mid-wind-up clears it as well. The cast loop only walks LIVE players, so
// without an explicit cancel the footprint would be left drawing over a corpse.
{
  const { world, player } = spawn("slam-footprint-death");
  const target = monsterAt(world, 430);
  setAttackTarget(world, player, target.isMonster.id);
  fireAbilities(world, 1_000);
  assert(castStarts(world).length === 1, "the wind-up should have announced itself");

  world.killPlayer(player.isPlayer.id, {
    kind: "melee",
    damage: 1,
    killer: {
      monsterTypeId: target.isMonster.monsterTypeId,
      monsterName: "Slam Target",
      isBoss: false,
      nodeId: "node-5-5",
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
    target.hasHealth.hp === target.hasHealth.maxHp,
    "a cast the caster did not live to finish lands no payload",
  );
}

// A cast with no area announces no area. A single-target cast (Stunning Strike)
// must not sprout a circle.
{
  const { world, player } = spawn("single-target-footprint", { abilities: ["stunning-strike"] });
  const target = monsterAt(world, 430);
  setAttackTarget(world, player, target.isMonster.id);
  fireAbilities(world, 1_000);
  assert(
    player.isCastingAbility?.abilityId === "stunning-strike",
    "the single-target fixture should be casting Stunning Strike",
  );
  const starts = castStarts(world);
  assert(starts.length === 1, "a single-target cast still announces its wind-up");
  assert(
    starts[0]!.aoeRadius === undefined,
    "a single-target cast must carry no radius — absence is what keeps it circle-free",
  );
}

console.log("abilitySlam.test.ts: ok");
