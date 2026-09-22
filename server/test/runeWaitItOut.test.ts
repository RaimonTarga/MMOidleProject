import {
  ACTION_DATABASE,
  DEFAULT_AUTOCOMBAT_CONFIG,
  GAME_CONFIG,
  RESOLVED_NODE_FEATURES,
  STARTER_RUNE_IDS,
  ambientRampData,
  analyzeRuneLoadoutConflicts,
  applyStatusEffect,
  composeRuneEdit,
  deriveAutoConfigFromRunes,
  emptyEquipment,
  getFlag,
  getStatusEffect,
  tickStatusEffectDurations,
  type EquippedRule,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import type { PlayerEntity } from "../src/ecs/entity";
import { updateAutoTargets } from "../src/systems/combat/ai/autoTarget";
import {
  clearEngagement,
  markEngaged,
} from "../src/systems/combat/ai/engagement";
import {
  RUNE_WAIT_FOR_REGEN_FLAG,
  RUNE_WAIT_IT_OUT_FLAG,
  updateRuneDerivedConfig,
} from "../src/systems/combat/ai/runeConfig";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { setEntityMotion } from "../src/systems/world/movement";
import { updateNodeFeatures } from "../src/systems/world/nodeFeatures";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const CLEARING_NODE = "node-5-5";
const ALWAYS_WAIT: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "always", actionId: "wait-it-out" },
];

function makePlayerSlices(
  id: string,
  nodeId = CLEARING_NODE,
  hp = GAME_CONFIG.PLAYER_MAX_HP,
): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp,
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

function makeAutoPlayer(
  id: string,
  rules: EquippedRule[] = ALWAYS_WAIT,
  nodeId = CLEARING_NODE,
  hp = GAME_CONFIG.PLAYER_MAX_HP,
): { world: World; player: PlayerEntity } {
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices(id, nodeId, hp), id);
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, {
    auto: true,
    focusLeaderTarget: false,
  });
  player.tracksProgression.runesEquipped = rules;
  return { world, player };
}

function addBystander(world: World) {
  const monster = world.createMonster(CLEARING_NODE, "plains-slime", { x: 600, y: 400 });
  if (!monster) throw new Error("failed to create bystander monster");
  return monster;
}

assert(STARTER_RUNE_IDS.includes("wait-it-out"), "Wait It Out should be generally available like Recover First");
assert(ACTION_DATABASE.get("wait-it-out")?.cost === 1, "Wait It Out should cost 1 RP");

const idleWait = deriveAutoConfigFromRunes(
  [{ conditionId: "when-idle", actionId: "wait-it-out" }],
  {
    hpPct: 1,
    inCombat: false,
    activelyEngaged: false,
    inParty: false,
    aggroCount: 0,
    combatArchetype: null,
  },
);
assert(idleWait.waitItOut, "Out of Combat -> Wait It Out should activate after combat clears");
const idleWaitInGrace = deriveAutoConfigFromRunes(
  [{ conditionId: "when-idle", actionId: "wait-it-out" }],
  {
    hpPct: 1,
    inCombat: true,
    activelyEngaged: false,
    inParty: false,
    aggroCount: 0,
    combatArchetype: null,
  },
);
assert(!idleWaitInGrace.waitItOut, "Out of Combat -> Wait It Out should retain the combat-timer gate");

// The two OOC maintenance actions remain separate loadout entries and both fold.
{
  const rules: EquippedRule[] = [
    { conditionId: "always", actionId: "auto-path-enemy" },
    { conditionId: "always", actionId: "wait-for-regen" },
    { conditionId: "always", actionId: "wait-it-out" },
  ];
  const composed = composeRuneEdit(
    [{ conditionId: "always", actionId: "wait-for-regen" }],
    { conditionId: "always", actionId: "wait-it-out" },
    null,
  );
  assert(composed.length === 2, "same-condition OOC maintenance predicates should compose in the editor");
  assert(analyzeRuneLoadoutConflicts(rules).length === 0, "composed maintenance predicates should not conflict");

  const folded = deriveAutoConfigFromRunes(rules, {
    hpPct: 0.5,
    inCombat: true,
    activelyEngaged: false,
    inParty: false,
    aggroCount: 0,
    combatArchetype: null,
  });
  assert(folded.waitForRegen && folded.waitItOut, "Recover First and Wait It Out should both claim while disengaged");
  assert(folded.oocMaintenanceClaims.length === 2, "both maintenance claims should remain observable");

  const { world, player } = makeAutoPlayer("composed", rules, CLEARING_NODE, 50);
  addBystander(world);
  applyStatusEffect(player.tracksCombat, {
    id: "poison-dagger-burn",
    sourceId: "test",
    remainingMs: 1_000,
    data: { isDot: 1, damagePerStack: 1, totalMs: 1_000 },
  });
  updateRuneDerivedConfig(world);
  assert(getFlag(player.tracksCombat, RUNE_WAIT_FOR_REGEN_FLAG), "Recover First hold should be active");
  assert(getFlag(player.tracksCombat, RUNE_WAIT_IT_OUT_FLAG), "Wait It Out hold should be active");

  tickStatusEffectDurations(player.tracksCombat, 1_000);
  updateRuneDerivedConfig(world);
  assert(!getFlag(player.tracksCombat, RUNE_WAIT_IT_OUT_FLAG), "Wait It Out releases when the effect expires");
  assert(getFlag(player.tracksCombat, RUNE_WAIT_FOR_REGEN_FLAG), "Recover First continues holding independently");

  player.hasHealth.hp = player.hasHealth.maxHp;
  updateRuneDerivedConfig(world);
  updateAutoTargets(world, Date.now());
  assert(player.isMoving !== undefined, "movement resumes only after both holds clear");
}

// Heat and Chill use the generic ambient-ramp marker and cool after combat.
for (const nodeId of ["node-t3-volcanic-01", "node-t4-tundra-01"]) {
  const ramp = RESOLVED_NODE_FEATURES[nodeId]?.find((feature) => feature.ambientRamp)?.ambientRamp;
  assert(ramp !== undefined, `${nodeId} must define an ambient ramp`);
  const { world, player } = makeAutoPlayer(`ambient-${nodeId}`, ALWAYS_WAIT, nodeId);
  const effect = applyStatusEffect(player.tracksCombat, {
    id: ramp!.effectId,
    sourceId: `node-feature:${ramp!.effectId}`,
    maxStacks: ramp!.maxStacks,
    remainingMs: -1,
    data: ambientRampData(ramp!.payload, ramp!),
  });
  effect.stacks = 2;

  markEngaged(world, player, Date.now());
  updateRuneDerivedConfig(world);
  assert(getFlag(player.tracksCombat, RUNE_WAIT_IT_OUT_FLAG), `${ramp!.effectId} should hold immediately after combat`);
  setEntityMotion(world, player, { x: 800, y: 400 });
  updateAutoTargets(world, Date.now());
  assert(player.isMoving === undefined, `${ramp!.effectId} should prevent seeking the next enemy`);

  clearEngagement(world, player);
  updateNodeFeatures(world, ramp!.rampMs * 2);
  assert(getStatusEffect(player.tracksCombat, ramp!.effectId) === undefined, `${ramp!.effectId} should naturally clear while disengaged`);
  updateRuneDerivedConfig(world);
  assert(!getFlag(player.tracksCombat, RUNE_WAIT_IT_OUT_FLAG), `${ramp!.effectId} should release after cooling`);
}

// A generic encounter floor may make an ambient ramp non-decaying at its current
// stack count. In that state Wait It Out must release instead of holding forever.
{
  const nodeId = "node-t3-volcanic-01";
  const ramp = RESOLVED_NODE_FEATURES[nodeId]!.find((feature) => feature.ambientRamp)!.ambientRamp!;
  const { world, player } = makeAutoPlayer("ambient-floor", ALWAYS_WAIT, nodeId);
  const effect = applyStatusEffect(player.tracksCombat, {
    id: ramp.effectId,
    sourceId: `node-feature:${ramp.effectId}`,
    maxStacks: ramp.maxStacks,
    remainingMs: -1,
    data: ambientRampData(ramp.payload, ramp),
  });
  effect.stacks = 2;
  world.ambientRampOverrides.set(nodeId, { minStacks: 2 });
  updateRuneDerivedConfig(world);
  assert(!getFlag(player.tracksCombat, RUNE_WAIT_IT_OUT_FLAG), "a non-decaying ambient floor must not softlock Wait It Out");
}

// A normal timed DoT holds, then target acquisition resumes at expiry.
{
  const { world, player } = makeAutoPlayer("timed-dot");
  addBystander(world);
  applyStatusEffect(player.tracksCombat, {
    id: "poison-dagger-burn",
    sourceId: "test",
    remainingMs: 500,
    data: { isDot: 1, damagePerStack: 1, totalMs: 500 },
  });
  updateRuneDerivedConfig(world);
  updateAutoTargets(world, Date.now());
  assert(player.hasAttackTarget === undefined, "a temporary DoT should block the next acquisition");

  tickStatusEffectDurations(player.tracksCombat, 500);
  updateRuneDerivedConfig(world);
  updateAutoTargets(world, Date.now());
  assert(player.isMoving !== undefined, "acquisition should resume as soon as the DoT expires");
}

// Always never interrupts an active fight, even while a waitable status is present.
{
  const { world, player } = makeAutoPlayer("active-fight");
  const monster = world.createMonster(CLEARING_NODE, "plains-slime", { x: 600, y: 400 });
  if (!monster) throw new Error("failed to create active monster");
  applyStatusEffect(player.tracksCombat, {
    id: "antiheal",
    sourceId: monster.isMonster.id,
    remainingMs: 2_000,
    data: { antihealPct: 0.5, totalMs: 2_000 },
  });
  setAttackTarget(world, player, monster.isMonster.id);
  updateRuneDerivedConfig(world);
  assert(!getFlag(player.tracksCombat, RUNE_WAIT_IT_OUT_FLAG), "Wait It Out must yield to an active attack target");
  assert(player.hasAttackTarget?.targetId === monster.isMonster.id, "the active fight must remain targeted");
}

// Permanent, continuously refreshed environmental, and hard-control statuses do not hold.
for (const [id, remainingMs, data] of [
  ["slow", -1, { speedMult: 0.7 }],
  ["slow", 1_000, { speedMult: 0.7, isNodeFeature: 2 }],
  ["slow", 1_000, { speedMult: 0.7, isGroundZone: 1 }],
  ["slow", 1_000, { speedMult: 0 }],
  ["stunned", 1_000, { totalMs: 1_000 }],
] as const) {
  const { world, player } = makeAutoPlayer(`non-waitable-${id}-${remainingMs}`);
  addBystander(world);
  applyStatusEffect(player.tracksCombat, { id, sourceId: "test", remainingMs, data });
  updateRuneDerivedConfig(world);
  assert(!getFlag(player.tracksCombat, RUNE_WAIT_IT_OUT_FLAG), `${id}/${remainingMs} must not create a maintenance softlock`);
  updateAutoTargets(world, Date.now());
  assert(player.isMoving !== undefined, `${id}/${remainingMs} should not block target acquisition`);
}

console.log("runeWaitItOut.test.ts: ok");
