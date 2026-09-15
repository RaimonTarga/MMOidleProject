/**
 * Sweep TEMPO — attack-equivalents hasten a Technique's remaining cooldown.
 *
 * Covers the four things that can silently break the mechanic:
 *   1. T1 Sweep is untouched — no Tempo, no new numbers;
 *   2. the generic rule (one landed basic attack = 1.0 = one refund), the
 *      minimum cycle, and composition with ordinary cooldown reduction;
 *   3. nothing that is not a basic attack pays — DoT ticks, Sweep's own splash,
 *      cast payloads, thorns;
 *   4. the two normalized class adapters (Slinger clip, Conduit formation) each
 *      add up to exactly one attack per logical cycle, however many damage
 *      events that cycle emits.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/abilityTempo.test.ts
 */
import {
  ABILITY_DATABASE,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  TECHNIQUE_TEMPO_MIN_CYCLE_MS,
  abilityCooldownMs,
  abilityRankAt,
  abilityTempoRefundMs,
  emptyEquipment,
  getCooldown,
  getStatusEffect,
  tickCooldowns,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { syncArchetypeSlices } from "../src/ecs/archetypeSliceSync";
import { updateDotArchetype } from "../src/systems/classes/archetypes/dot/dotPrototype";
import { runFormationAttack } from "../src/systems/classes/archetypes/summoner/formationAttack";
import { updateSummonerArchetype } from "../src/systems/classes/archetypes/summoner/summonerPrototype";
import { updateReloadArchetype } from "../src/systems/classes/archetypes/reload/reloadPrototype";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { runMonsterAttack, runPlayerAttack } from "../src/systems/combat/engine/combat";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
import { resolveCastPayload } from "../src/systems/player/abilities/abilityEffects";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import { World } from "../src/world/World";
import type { PlayerEntity } from "../src/ecs/entity";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

type Archetype = "dot" | "reload" | "summoner" | null;

interface Options {
  tier?: number;
  archetype?: Archetype;
  techniques?: string[];
  passives?: Record<string, number>;
  unlockedSkills?: string[];
  subVariant?: string | null;
}

function slices(id: string, options: Options = {}): PersistedPlayerSlices {
  const techniques = options.techniques ?? ["sweep"];
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 5_000, maxHp: 5_000, recovery: GAME_CONFIG.PLAYER_RECOVERY },
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
      playerTier: options.tier ?? 2,
      currentSkillTier: options.tier ?? 2,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: techniques,
      attunedAbilities: { techniques, guards: [] },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: options.unlockedSkills ?? [],
      passives: options.passives ?? {},
      selectedClass: options.archetype === "summoner" ? "summoner-root" : null,
      selectedSubVariant: (options.subVariant ?? null) as never,
      selectedRange: null,
      combatArchetype: options.archetype ?? null,
    },
  };
}

function spawn(id: string, options: Options = {}) {
  const world = new World();
  const player = world.attachPlayerEntity(slices(id, options), id);
  player.usesAutocombat.auto = true;
  syncArchetypeSlices(world, player);
  player.dealsDamage.attack = 100;
  // Passives are REBUILT from the skill tree on attach/recalc, so a raw passive
  // handed to the persisted slice is wiped before the test ever sees it. Stamp
  // it back on afterwards — this is a fixture, not a skill-tree assertion.
  Object.assign(player.usesSkills.passives, options.passives ?? {});
  return { world, player };
}

function durableMonster(world: World, x: number) {
  const monster = world.createMonster("node-5-5", "plains-slime", { x, y: 400 });
  if (!monster) throw new Error("failed to create Tempo target");
  monster.hasHealth.hp = 1_000_000;
  monster.hasHealth.maxHp = 1_000_000;
  monster.mitigatesDamage.plating = 0;
  monster.mitigatesDamage.damageReduction = 0;
  // Evasion would silently drop attacks and make every refund count flaky.
  monster.mitigatesDamage.evasion = 0;
  return monster;
}

const sweepCooldown = (player: PlayerEntity): number =>
  getCooldown(player.tracksCombat, abilityCooldownKey("sweep"));

/** Arm Sweep through the real firing driver, so the cooldown starts the real way. */
function armSweep(world: World, player: PlayerEntity, targetId: string, now = 1_000): void {
  setAttackTarget(world, player, targetId);
  updateAbilityFiring(world, now);
}

function attack(world: World, player: PlayerEntity, target: ReturnType<typeof durableMonster>, now: number): string {
  return runPlayerAttack(world, player, target, now, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: "player" },
  });
}

initCombatSystems();

// ── 1. T1 Sweep is mechanically untouched ────────────────────────────────────
{
  const sweep = ABILITY_DATABASE.get("sweep")!;
  const rank = abilityRankAt(sweep, 1).effect;
  assert(
    rank.kind === "cleave" && rank.splashPct === 0.6 && rank.radius === 90,
    "Sweep I must still be 60% splash at 90px",
  );
  assert(abilityCooldownMs(sweep, 1) === 6000, "Sweep I must still be a 6s cooldown");
  assert(abilityTempoRefundMs(sweep, 1) === 0, "Sweep I must own no Tempo refund");

  const { world, player } = spawn("tempo-t1", { tier: 1 });
  const target = durableMonster(world, 430);
  armSweep(world, player, target.isMonster.id);
  assert(sweepCooldown(player) === 6000, "Sweep I should start its authored 6s cooldown");

  for (let i = 0; i < 5; i++) attack(world, player, target, 1_100 + i);
  assert(
    sweepCooldown(player) === 6000,
    `T1 attacks must not refund Sweep's cooldown (got ${sweepCooldown(player)})`,
  );
}

// ── 2. Generic Tempo: one landed attack, one refund ──────────────────────────
{
  const { world, player } = spawn("tempo-generic");
  const target = durableMonster(world, 430);
  armSweep(world, player, target.isMonster.id);
  assert(sweepCooldown(player) === 7000, "Sweep II should start its authored 7s cooldown");

  // The attack that DELIVERS Sweep counts toward the next one: the cooldown it
  // feeds started when Sweep armed, so it is already running.
  attack(world, player, target, 1_100);
  assert(player.hasArmedAbility === undefined, "the delivering attack should consume Sweep");
  assert(sweepCooldown(player) === 6000, "Sweep's own delivery attack must pay Tempo");

  attack(world, player, target, 1_200);
  attack(world, player, target, 1_300);
  assert(sweepCooldown(player) === 4000, "ordinary attacks should accumulate one refund each");

  // Minimum cycle: no number of attacks can bring it back sooner than
  // TECHNIQUE_TEMPO_MIN_CYCLE_MS after the activation, and that floor decays in
  // real time rather than being a hard cooldown floor.
  for (let i = 0; i < 20; i++) attack(world, player, target, 1_400 + i);
  assert(
    sweepCooldown(player) === TECHNIQUE_TEMPO_MIN_CYCLE_MS,
    `Tempo must stop at the ${TECHNIQUE_TEMPO_MIN_CYCLE_MS}ms minimum cycle (got ${sweepCooldown(player)})`,
  );

  // 3s of real time later the floor is spent, and the banked attacks are gone —
  // Tempo is a live refund, not stored credit — so fresh attacks finish it off.
  tickCooldowns(player.tracksCombat, TECHNIQUE_TEMPO_MIN_CYCLE_MS);
  assert(sweepCooldown(player) === 0, "the remaining cooldown should have ticked away");
  const readyBefore = sweepCooldown(player);
  for (let i = 0; i < 5; i++) attack(world, player, target, 1_500 + i);
  assert(
    sweepCooldown(player) === readyBefore,
    "a ready Sweep must not bank cooldown credit for its next activation",
  );
}

// ── 2b. Tempo composes with ordinary Technique cooldown reduction ────────────
{
  const { world, player } = spawn("tempo-cdr", {
    passives: { "technique.cooldown-reduction-pct": 0.2 },
  });
  const target = durableMonster(world, 430);
  armSweep(world, player, target.isMonster.id);
  assert(
    Math.round(sweepCooldown(player)) === 5600,
    `cooldown reduction should still apply to the authored 7s (got ${sweepCooldown(player)})`,
  );
  attack(world, player, target, 1_100);
  assert(
    Math.round(sweepCooldown(player)) === 4600,
    "Tempo should take its refund off the ALREADY reduced cooldown",
  );
}

// ── 2c. The minimum cycle can never LENGTHEN a shorter cooldown ──────────────
{
  const { world, player } = spawn("tempo-cdr-deep", {
    passives: { "technique.cooldown-reduction-pct": 0.7 },
  });
  const target = durableMonster(world, 430);
  armSweep(world, player, target.isMonster.id);
  const started = sweepCooldown(player);
  assert(
    started < TECHNIQUE_TEMPO_MIN_CYCLE_MS,
    "fixture should push the cooldown below the minimum cycle",
  );
  attack(world, player, target, 1_100);
  assert(
    sweepCooldown(player) === started,
    "a cooldown already shorter than the minimum cycle must be left exactly alone",
  );
}

// ── 3. Non-qualifying damage pays nothing ────────────────────────────────────

// 3a. Sweep's own splash: two monsters in radius is still ONE attack.
{
  const { world, player } = spawn("tempo-splash");
  const primary = durableMonster(world, 430);
  durableMonster(world, 470);
  durableMonster(world, 460);
  armSweep(world, player, primary.isMonster.id);
  attack(world, player, primary, 1_100);
  assert(
    sweepCooldown(player) === 6000,
    `one attack splashing three monsters must refund once (got ${sweepCooldown(player)})`,
  );
}

// 3b. Apprentice: basic attacks contribute, DoT ticks and Sweep-spread stacks do not.
{
  const { world, player } = spawn("tempo-apprentice", { archetype: "dot" });
  assert(!!player.appliesDots, "Apprentice fixture should attach AppliesDots");
  const primary = durableMonster(world, 430);
  const secondary = durableMonster(world, 470);
  armSweep(world, player, primary.isMonster.id);

  attack(world, player, primary, 1_100);
  assert(
    sweepCooldown(player) === 6000,
    "an Apprentice's real basic attack should contribute normally",
  );
  assert(
    getStatusEffect(secondary.tracksCombat, "dot")?.stacks === 1,
    "Sweep should have spread a stack to the secondary",
  );

  // Ten seconds of pure damage-over-time. Every tick is real damage on two
  // monsters and none of it is an attack.
  const afterAttacks = sweepCooldown(player);
  for (let i = 0; i < 100; i++) updateDotArchetype(world, 100);
  assert(
    sweepCooldown(player) === afterAttacks,
    `DoT ticks must never refund Sweep (got ${sweepCooldown(player)})`,
  );
}

// 3c. Cast payloads (Slam, Power Strike) pay nothing.
for (const castId of ["slam", "power-strike"]) {
  const { world, player } = spawn(`tempo-cast-${castId}`, {
    techniques: ["sweep", castId],
  });
  const target = durableMonster(world, 430);
  durableMonster(world, 460);
  armSweep(world, player, target.isMonster.id);
  const before = sweepCooldown(player);
  for (let i = 0; i < 5; i++) {
    resolveCastPayload(world, player, ABILITY_DATABASE.get(castId)!, target);
  }
  assert(
    sweepCooldown(player) === before,
    `${castId}'s cast payload must not refund Sweep (got ${sweepCooldown(player)})`,
  );
}

// 3d. Thorns/retaliation: a MONSTER's swing is not the player's attack.
{
  const { world, player } = spawn("tempo-thorns");
  const target = durableMonster(world, 430);
  armSweep(world, player, target.isMonster.id);
  const before = sweepCooldown(player);
  for (let i = 0; i < 5; i++) runMonsterAttack(world, target, player, 1_100 + i);
  assert(
    sweepCooldown(player) === before,
    "incoming monster attacks (and the thorns they trigger) must not refund Sweep",
  );
}

// ── 4a. Slinger: one nominal clip is one attack, whatever the magazine size ──
function slingerRefundOverShots(ammoMax: number, shots: number, reloadEvery: number): number {
  const { world, player } = spawn(`tempo-slinger-${ammoMax}-${reloadEvery}`, {
    archetype: "reload",
    passives: { "reload.max-ammo": ammoMax },
  });
  updateReloadArchetype(world, 0);
  assert(player.usesReload?.ammo === ammoMax, "Slinger fixture should start with a full clip");
  const target = durableMonster(world, 430);
  armSweep(world, player, target.isMonster.id);
  const before = sweepCooldown(player);

  for (let shot = 0; shot < shots; shot++) {
    // A "tactical reload" — top the clip back up before it is empty. The
    // exploit this guards against is firing tiny clips to make every bullet a
    // larger share of an attack.
    if (shot > 0 && shot % reloadEvery === 0) {
      player.usesReload!.reloadingMs = 0;
      player.usesReload!.ammo = ammoMax;
    }
    if (player.usesReload!.ammo === 0) {
      player.usesReload!.reloadingMs = 0;
      player.usesReload!.ammo = ammoMax;
    }
    attack(world, player, target, 1_100 + shot);
  }
  // Tempo never drives the cooldown below the floor, so keep the sample well
  // inside it: this measures contribution, not the clamp.
  return before - sweepCooldown(player);
}

{
  // One complete clip == one attack-equivalent == exactly one 1000ms refund.
  for (const ammoMax of [4, 6, 10]) {
    const refunded = slingerRefundOverShots(ammoMax, ammoMax, ammoMax + 1);
    assert(
      refunded === 1000,
      `a full ${ammoMax}-shot clip should contribute exactly one attack (refunded ${refunded}ms)`,
    );
  }

  // Magazine size changes the per-shot fraction but not the per-clip total: two
  // full clips are two attacks whether that is 8 shots or 20.
  for (const ammoMax of [4, 10]) {
    const refunded = slingerRefundOverShots(ammoMax, ammoMax * 2, ammoMax + 1);
    assert(
      refunded === 2000,
      `two full ${ammoMax}-shot clips should contribute exactly two attacks (refunded ${refunded}ms)`,
    );
  }

  // Partial/tactical reloads cannot inflate contribution: twelve bullets out of
  // a six-round magazine are two attacks however often the clip was topped up.
  const straight = slingerRefundOverShots(6, 12, 99);
  const tactical = slingerRefundOverShots(6, 12, 2);
  assert(
    straight === 2000 && tactical === straight,
    `firing tiny clips must not inflate Tempo (straight ${straight}ms vs tactical ${tactical}ms)`,
  );
}

// ── 4b. Conduit: one complete formation cycle is one attack ──────────────────
function conduitSetup(id: string, subVariant: string | null, expectedCount: number) {
  const { world, player } = spawn(id, {
    archetype: "summoner",
    subVariant,
    unlockedSkills: ["summoner-root", ...(subVariant ? [`summoner-${subVariant}`] : [])],
  });
  updateSummonerArchetype(world, 0, 1_000);
  const minions = (player.summonsMinions?.minionIds ?? []).map((entityId) =>
    world.getMinionEntity(entityId)!,
  );
  assert(
    minions.length === expectedCount && minions.every(Boolean),
    `${id} should field ${expectedCount} summons, got ${minions.length}`,
  );
  return { world, player, minions };
}

for (const [subVariant, count] of [[null, 4], ["light", 6], ["heavy", 2]] as const) {
  const { world, player, minions } = conduitSetup(
    `tempo-conduit-${subVariant ?? "root"}`,
    subVariant,
    count,
  );
  const target = durableMonster(world, 430);
  armSweep(world, player, target.isMonster.id);
  setAttackTarget(world, player, null);
  const before = sweepCooldown(player);

  // One complete formation cycle — every body swings once.
  for (const [index, minion] of minions.entries()) {
    runFormationAttack(world, player, minion, target, 1_100 + index);
  }
  const refunded = before - sweepCooldown(player);
  assert(
    refunded === 1000,
    `a complete ${count}-body formation cycle should be exactly one attack (refunded ${refunded}ms)`,
  );
}

// A damaged formation delivers less Tempo — the survivors are NOT renormalized
// upward to cover for the dead, which is the whole point of weighting against
// the authored formation rather than the living one.
{
  const { world, player, minions } = conduitSetup("tempo-conduit-broken", null, 4);
  const target = durableMonster(world, 430);
  minions[0]!.hasHealth.hp = 0;
  armSweep(world, player, target.isMonster.id);
  setAttackTarget(world, player, null);
  const before = sweepCooldown(player);

  for (const [index, minion] of minions.slice(1).entries()) {
    runFormationAttack(world, player, minion, target, 1_100 + index);
  }
  assert(
    sweepCooldown(player) === before,
    "three of four bodies is 0.75 of an attack and must not complete a refund",
  );

  // It still earns its refund, it just takes longer — the dead body's share is
  // never paid, so the formation needs a second partial round to get there.
  for (const [index, minion] of minions.slice(1).entries()) {
    runFormationAttack(world, player, minion, target, 1_200 + index);
  }
  assert(
    before - sweepCooldown(player) === 1000,
    "six deliveries from three bodies is 1.5 attacks, so exactly one refund",
  );
}

console.log("abilityTempo.test.ts: ok");
