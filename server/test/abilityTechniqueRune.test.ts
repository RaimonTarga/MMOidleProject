import { baseRecoveryForTier } from '@mmo-idle/shared';
import {
  ABILITY_SWEEP_FX,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { updateRuneDerivedConfig } from "../src/systems/combat/ai/runeConfig";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { runPlayerAttack } from "../src/systems/combat/engine/combat";
import { registerCombatListener } from "../src/systems/combat/engine/combatPipeline";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import { World } from "../src/world/World";
import { takeWorldLogEvents } from "../src/world/worldLog";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(
  abilityId = "sweep",
  playerId = "technique-rune-player",
): PersistedPlayerSlices {
  return {
    isPlayer: { id: playerId, name: "Technique Rune" },
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
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runesEquipped: [{ conditionId: "in-combat", actionId: "use-ability", targetAbilityId: abilityId }],
      knownAbilities: [abilityId],
      attunedAbilities: { techniques: [abilityId], guards: [] },
    },
    holdsInventory: {
      inventory: [],
      equipment: emptyEquipment(),
      itemUpgrades: {},
    },
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

// Registered BEFORE the combat systems so this stands ahead of the ability
// rider's own `onHit` listener; it stays inert until the windowed scenario at the
// bottom of the file arms it. See that scenario for what it is proving.
const WINDOW_MULT = 1.5;
let windowArmed = false;
registerCombatListener("onHit", (ctx) => {
  if (!windowArmed) return;
  ctx.damage = Math.round(ctx.damage * WINDOW_MULT);
  ctx.metadata["empoweredMultiplier"] =
    Number(ctx.metadata["empoweredMultiplier"] ?? 1) * WINDOW_MULT;
});

initCombatSystems();

const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices(), "technique-rune-player");
player.usesAutocombat.auto = true;
const target = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
if (!target) throw new Error("failed to create target");

setAttackTarget(world, player, target.isMonster.id);
updateRuneDerivedConfig(world, 1_000);
updateAbilityFiring(world, Date.now());

// The armed Technique here is Sweep (Expose Weakness carried this test until the
// ability pass cut it, design §22.2; its own debuff assertions went with it).
assert(
  player.hasArmedAbility?.abilityId === "sweep",
  "In Combat -> Fire Technique should arm Sweep when off cooldown",
);
assert(
  takeWorldLogEvents(world, player.isPlayer.id).some(
    (event) => event.kind === "ability-activation" && event.abilityId === "sweep",
  ),
  "Technique activation should reach bot-visible telemetry",
);

const hpBefore = target.hasHealth.hp;
const baseDamage = player.dealsDamage.attack;
const outcome = runPlayerAttack(world, player, target, 1_100, {
  attackOrigin: player.hasPosition.current,
  aggroSource: { id: player.isPlayer.id, kind: "player" },
});
assert(outcome === "hit" || outcome === "killed", "armed Sweep attack should land");
assert(player.hasArmedAbility === undefined, "Technique should be consumed by the hit");

// Sweep's cleave splashes the bodies AROUND the target; the target itself takes
// the ordinary swing.
const dealt = hpBefore - Math.max(0, target.hasHealth.hp);
assert(
  dealt === baseDamage,
  `the armed Sweep hit should land the ordinary swing on its target (${dealt} !== ${baseDamage})`,
);

const hit = world
  .takeNodeEvents("node-5-5")
  .find((event) => event.kind === "player-hit");
assert(!!hit && hit.kind === "player-hit", "expected a player-hit event");
assert(
  hit!.effects?.includes(ABILITY_SWEEP_FX),
  "Sweep should tag the hit so the client plays its Technique FX",
);

updateRuneDerivedConfig(world, 1_200);
updateAbilityFiring(world, Date.now());
assert(
  player.hasArmedAbility === undefined,
  "Technique should not re-arm again while its cooldown is still running",
);

// ── One multiplier per hit, against a WINDOW rather than a finisher ──────────
//
// `addEmpoweredDamage` divides the rider's basis by any multiplier the hit is
// already carrying, so a rider ADDS its share instead of compounding. It used to
// read that divisor only when `ctx.metadata.empoweredAttack` was set — the marker
// meaning "the class mechanic fired this hit".
//
// That marker is strictly narrower than "this hit already carries a multiplier".
// A lineage `damage-window` card and a Light or Balanced frame window both fold
// themselves into `empoweredMultiplier` and deliberately do NOT set the marker,
// because setting it would restart cooldowns and fire every `mechanic-fired`
// card. So the division was skipped for exactly those sources and the rider
// compounded with the window — the thing `lineageCards.ts` promises cannot
// happen, and a hard axiom either way.
//
// The window rides `onHit` exactly as the real `damage-window` payoff does, and
// is registered ahead of `initCombatSystems()` above so it runs before the
// ability rider's own `onHit` listener. It cannot be applied on `onAttack`
// instead: the swing's damage is computed after that stage, which would discard
// the scaling and leave only the metadata.
//
// Binding Strike: its root rider carries a true hit multiplier (`damageMult`)
// through `addEmpoweredDamage`, which is the path under test (Quick Strike's
// `empower` rider carried this until the ability pass cut it, design §22.2). Its
// multiplier is never hardcoded here — the control run below measures what the
// rider is worth, so the ability's balance can move freely.
const BIG_ATTACK = 1000;

function armedRun(playerId: string, withWindow: boolean): { base: number; dealt: number } {
  const w = new World();
  const p = w.attachPlayerEntity(makePlayerSlices("binding-strike", playerId), playerId);
  p.usesAutocombat.auto = true;
  const t = w.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
  if (!t) throw new Error("failed to create the rider target");
  t.hasHealth.maxHp = 10_000_000;
  t.hasHealth.hp = 10_000_000;
  t.mitigatesDamage.plating = 0;
  t.mitigatesDamage.damageReduction = 0;

  setAttackTarget(w, p, t.isMonster.id);
  updateRuneDerivedConfig(w, 1_000);
  updateAbilityFiring(w, Date.now());
  assert(
    p.hasArmedAbility?.abilityId === "binding-strike",
    `${playerId}: Binding Strike should be armed before the hit`,
  );

  // A big swing on purpose: compounding and adding differ by
  // `base × (WINDOW_MULT − 1) × riderPct`, which rounding can hide entirely at a
  // starter attack of ~15.
  p.dealsDamage.attack = BIG_ATTACK;
  const hp = t.hasHealth.hp;
  windowArmed = withWindow;
  const outcome = runPlayerAttack(w, p, t, 1_100, {
    attackOrigin: p.hasPosition.current,
    aggroSource: { id: p.isPlayer.id, kind: "player" },
  });
  windowArmed = false;
  assert(outcome === "hit" || outcome === "killed", `${playerId}: the armed attack should land`);
  return { base: BIG_ATTACK, dealt: hp - Math.max(0, t.hasHealth.hp) };
}

// Control: the rider with no window, to measure what it is worth.
const control = armedRun("rider-control", false);
const riderShare = control.dealt - control.base;
assert(
  riderShare > 50,
  `the control run must show a real rider share, got ${riderShare} over ${control.base}`,
);

const windowed = armedRun("rider-windowed", true);
const windowedSwing = Math.round(control.base * WINDOW_MULT);
// Adding: the window scales the swing, and the rider contributes the same share it
// was worth without the window. Compounding would scale that share by the window too.
const additive = windowedSwing + riderShare;
const compounded = windowedSwing + Math.round(riderShare * WINDOW_MULT);
assert(
  compounded - additive > 10,
  `the fixture is useless unless compounding and adding differ clearly ` +
    `(${compounded} vs ${additive})`,
);
assert(
  Math.abs(windowed.dealt - additive) <= 2,
  `a rider inside a damage window must ADD its share, not compound: got ${windowed.dealt}, ` +
    `expected about ${additive} (compounding would be ${compounded})`,
);

console.log("abilityTechniqueRune.test.ts: ok");
