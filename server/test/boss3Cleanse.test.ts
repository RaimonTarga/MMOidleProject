/**
 * Boss3 QUALIFICATION — does the substituted Guard actually do anything, against the
 * effects these two bosses actually generate?
 *
 * This is the functional half of freezing the Boss3 packet, and it exists because
 * the alternative is spending 24 fights to discover a null result that source could
 * have predicted. It spends ZERO fights: no arena, no boss, no combat loop. It paints
 * the real effects, with their AUTHORED shapes read out of `MONSTER_DATABASE`, and
 * fires the real ability driver.
 *
 * What it must establish, per the packet:
 *
 *   1. Cleanse REMOVES the effect each block declares as its primary target, and the
 *      number of stacks it removes is the authored rank-II count, not a guess.
 *   2. On Cave, where TWO cleanseable effects are present, the authored priority
 *      selects `plating-shred` over `slow` -- in the ramped case AND in the 1-vs-1
 *      tie. If it picked the 2-second self-expiring slow instead, the treatment
 *      would be a no-op dressed as a substitution.
 *   3. `ability-activation.removedEffects` RECORDS the removal, since that receipt is
 *      the only evidence the Boss3 report will have that the treatment acted.
 *   4. The Guard-order and one-activation-per-window gates do not suppress Cleanse
 *      behind Second Wind at index 0.
 *   5. The two arms differ in WHEN they can act at all: Cleanse's `has-debuff` fires
 *      at full HP, Brace's `hp-below 0.5` does not. That is the substitution's real
 *      shape and the reason the contrast is not a pure damage question.
 *
 * MUTATION-CHECKED. Each assertion is paired with a negative control that fails on
 * the cheap wrong implementation: an immune effect must NOT be stripped (a policy
 * that ignored `isCleanseable` passes 1-4 otherwise), Cleanse must hold its cooldown
 * with nothing eligible, and Brace must be shown not to fire on the same fixture.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss3Cleanse.test.ts
 */
import {
  ABILITY_DATABASE,
  GAME_CONFIG,
  MONSTER_DATABASE,
  PLATING_SHRED_EFFECT_ID,
  STARTER_RUNE_IDS,
  VOLCANIC_HEAT_EFFECT_ID,
  abilityRankAt,
  applyStatusEffect,
  emptyAttunedAbilities,
  emptyEquipment,
  getStatusEffect,
  isCleanseable,
  resolveMonsterDotDebuff,
  type TracksCombat,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import { World } from "../src/world/World";
import { takeWorldLogEvents } from "../src/world/worldLog";
import {
  BOSS3_BLOCKS_DEF,
  BOSS3_GUARD_IN,
  BOSS3_GUARD_OUT,
  BOSS3_TIER,
  assertBoss3Definitions,
} from "../bench/balance/boss3Spec";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/**
 * The substitution arm's loadout, at the screen's player tier.
 *
 * `guards` is passed in rather than fixed so the same fixture can be run on the
 * BASELINE arm too — which is how assertion 5 is checked rather than asserted.
 */
function makePlayerSlices(id: string, guards: string[]): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Boss3" },
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
      // The screen's tier, so the rank the fixture exercises is the rank the fights
      // will exercise. A fixture at tier 4 would silently test Cleanse III.
      playerTier: BOSS3_TIER,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [...guards],
      attunedAbilities: { ...emptyAttunedAbilities(), techniques: [], guards: [...guards] },
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

function armedPlayer(world: World, id: string, guards: string[]) {
  const player = world.attachPlayerEntity(makePlayerSlices(id, guards), id);
  player.usesAutocombat.auto = true;
  return player;
}

/**
 * Paint the venom DoT with the Behemoth's OWN authored shape.
 *
 * Derived from the definition rather than transcribed, so retuning `damagePerStack`,
 * `maxStacks` or the debuff id changes what this fixture tests instead of leaving it
 * asserting a stale literal.
 */
function paintVenom(cs: TracksCombat, bossId: string, stacks: number): string {
  const def = MONSTER_DATABASE.get(bossId)!;
  const dot = def.dotEffect!;
  const debuff = resolveMonsterDotDebuff({ monster: def });
  for (let i = 0; i < stacks; i++) {
    applyStatusEffect(cs, {
      id: debuff.statusEffectId,
      maxStacks: dot.maxStacks,
      instanced: false,
      remainingMs: dot.durationMs ?? 5000,
      refreshable: true,
      sourceId: bossId,
      data: {
        damagePerStack: dot.damagePerStack,
        tickIntervalMs: dot.tickIntervalMs,
        totalMs: dot.durationMs ?? 5000,
        flavorCode: debuff.code,
        isDot: 1,
      },
    });
  }
  return debuff.statusEffectId;
}

/** Paint corrosion with the Dreadbore's own authored cap and per-stack plating. */
function paintShred(cs: TracksCombat, bossId: string, stacks: number): void {
  const shred = MONSTER_DATABASE.get(bossId)!.appliesPlatingShred!;
  for (let i = 0; i < stacks; i++) {
    applyStatusEffect(cs, {
      id: PLATING_SHRED_EFFECT_ID,
      maxStacks: shred.maxStacks,
      remainingMs: -1,
      refreshable: false,
      sourceId: bossId,
      data: { platingPerStack: shred.platingPerStack },
    });
  }
}

/** Paint the burrow's contact slow, in the shape `applyContactSlow` uses. */
function paintContactSlow(cs: TracksCombat, bossId: string): void {
  const pattern = MONSTER_DATABASE.get(bossId)!.bossPattern!;
  const conceal = pattern.steps.find(
    (s): s is Extract<typeof s, { kind: "conceal" }> => s.kind === "conceal",
  )!;
  const slow = conceal.contactSlow!;
  applyStatusEffect(cs, {
    id: "slow",
    maxStacks: 1,
    remainingMs: slow.durationMs,
    refreshable: true,
    sourceId: bossId,
    data: { speedMult: slow.speedMult, totalMs: slow.durationMs },
  });
}

/** The `removedEffects` record for the substituted Guard, from the world log. */
function removedByCleanse(world: World, playerId: string): { effectId: string; stacks: number }[] {
  const activation = takeWorldLogEvents(world, playerId).find(
    (event) => event.kind === "ability-activation" && event.abilityId === BOSS3_GUARD_IN,
  );
  if (!activation || activation.kind !== "ability-activation") return [];
  return [...(activation.removedEffects ?? [])];
}

initCombatSystems();
assertBoss3Definitions();

const SUB_GUARDS = ["second-wind", BOSS3_GUARD_IN];
const REF_GUARDS = ["second-wind", BOSS3_GUARD_OUT];

// The authored rank the fights will actually run, resolved once and used as the
// expected stack count everywhere below.
const cleanseRank = abilityRankAt(ABILITY_DATABASE.get(BOSS3_GUARD_IN)!, BOSS3_TIER).effect;
assert(cleanseRank.kind === "cleanse", "the substituted Guard must resolve a cleanse effect");
const RANK_STACKS = cleanseRank.stacks;
const RANK_DEBUFFS = cleanseRank.debuffs;
console.log(
  `boss3Cleanse: ${BOSS3_GUARD_IN} at player tier ${BOSS3_TIER} = ${RANK_STACKS} stacks off ${RANK_DEBUFFS} affliction(s)`,
);

const swamp = BOSS3_BLOCKS_DEF.find((b) => b.name === "swamp-response")!;
const cave = BOSS3_BLOCKS_DEF.find((b) => b.name === "cave-response")!;

// ── 1. SWAMP: the venom DoT is the only cleanseable effect, and it is stripped ────

{
  const world = new World();
  const player = armedPlayer(world, "b3-swamp", SUB_GUARDS);
  // Four stacks: the state every one of the six Boss2 deaths was recorded in.
  const venomId = paintVenom(player.tracksCombat, swamp.bossId, 4);
  assert(
    venomId === swamp.expectedPrimaryTarget,
    `the venom effect id is ${venomId}, declared ${swamp.expectedPrimaryTarget}`,
  );
  const before = getStatusEffect(player.tracksCombat, venomId)!.stacks;
  assert(before === 4, `the fixture should hold four venom stacks, got ${before}`);

  updateAbilityFiring(world, Date.now());

  const after = getStatusEffect(player.tracksCombat, venomId)?.stacks ?? 0;
  assert(
    after === before - RANK_STACKS,
    `Cleanse should take ${RANK_STACKS} venom stacks off ${before}, leaving ${before - RANK_STACKS}; got ${after}`,
  );
  const removed = removedByCleanse(world, player.isPlayer.id);
  assert(
    removed.some((r) => r.effectId === venomId && r.stacks === RANK_STACKS),
    `the activation receipt must record ${RANK_STACKS} stacks of ${venomId}; got ${JSON.stringify(removed)}`,
  );
  // The substitution is status removal INSTEAD OF mitigation: it must not also
  // quietly grant a damage-reduction window, or the contrast is not a tradeoff.
  assert(
    !player.tracksCombat.cooldowns[`ability.cd.${BOSS3_GUARD_OUT}`],
    "the substitution arm must not hold the substituted-out Guard at all",
  );
  console.log("  swamp: venom stripped, receipt recorded");
}

// ── 2. CAVE: priority selects corrosion over the slow, ramped AND at a 1-1 tie ────

{
  const world = new World();
  const player = armedPlayer(world, "b3-cave-ramped", SUB_GUARDS);
  // The state the Boss2 recordings reach: corrosion ramped past the slow, both live.
  paintShred(player.tracksCombat, cave.bossId, 5);
  paintContactSlow(player.tracksCombat, cave.bossId);

  updateAbilityFiring(world, Date.now());

  const shredAfter = getStatusEffect(player.tracksCombat, PLATING_SHRED_EFFECT_ID)?.stacks ?? 0;
  assert(
    shredAfter === 5 - RANK_STACKS,
    `Cleanse should take ${RANK_STACKS} corrosion stacks off 5, leaving ${5 - RANK_STACKS}; got ${shredAfter}`,
  );
  const removed = removedByCleanse(world, player.isPlayer.id);
  assert(
    removed.length === RANK_DEBUFFS,
    `rank ${RANK_DEBUFFS} may touch ${RANK_DEBUFFS} affliction(s); receipt lists ${removed.length}`,
  );
  assert(
    removed[0]?.effectId === cave.expectedPrimaryTarget,
    `the deepest affliction must be selected first; got ${removed[0]?.effectId}`,
  );
  // The negative control for priority: the slow must still be standing. A policy that
  // walked map order would have spent the activation here and left corrosion at 5.
  assert(
    (getStatusEffect(player.tracksCombat, "slow")?.stacks ?? 0) === 1,
    "the 2-second contact slow must be left alone while corrosion is deeper",
  );
  console.log("  cave (ramped): corrosion selected over the slow");
}

{
  // The TIE. One stack each, which is the state at the very first Cleanse window in a
  // real fight (the slow lands ~800 ms before the first corrosion stack). Ties break
  // by ascending id, so 'plating-shred' must still win — and that is exactly the case
  // where a wrong tiebreak would burn the whole 10-second cooldown on a rider that
  // expires by itself.
  const world = new World();
  const player = armedPlayer(world, "b3-cave-tie", SUB_GUARDS);
  paintShred(player.tracksCombat, cave.bossId, 1);
  paintContactSlow(player.tracksCombat, cave.bossId);

  updateAbilityFiring(world, Date.now());

  const removed = removedByCleanse(world, player.isPlayer.id);
  assert(
    removed[0]?.effectId === PLATING_SHRED_EFFECT_ID,
    `at a 1-1 tie the ascending-id tiebreak must select corrosion; got ${removed[0]?.effectId}`,
  );
  assert(
    (getStatusEffect(player.tracksCombat, "slow")?.stacks ?? 0) === 1,
    "the slow must survive the tie",
  );
  console.log("  cave (1-1 tie): corrosion still selected");
}

// ── 3. The Guard-order gate does not suppress the substituted Guard ───────────────

{
  // Second Wind sits at index 0 and guards are walked top-to-bottom, with one
  // ACTIVATION per 100 ms window. At full HP its `hp-below 0.6` trigger is inactive,
  // so it must not consume the window Cleanse needs.
  const world = new World();
  const player = armedPlayer(world, "b3-order", SUB_GUARDS);
  const venomId = paintVenom(player.tracksCombat, swamp.bossId, 4);

  updateAbilityFiring(world, Date.now());

  assert(
    !!player.tracksCombat.cooldowns[`ability.cd.${BOSS3_GUARD_IN}`],
    "the substituted Guard must claim the window at full HP; the order gate is suppressing it",
  );
  assert(
    !player.tracksCombat.cooldowns["ability.cd.second-wind"],
    "Second Wind must not fire at full HP — it would mean the fixture proves nothing about ordering",
  );
  assert(
    (getStatusEffect(player.tracksCombat, venomId)?.stacks ?? 0) === 4 - RANK_STACKS,
    "the removal must have happened on the same tick the window was claimed",
  );
  console.log("  order: Second Wind at index 0 does not block the substitution");
}

// ── 4. NEGATIVE CONTROL: an immune effect is neither stripped nor spent on ────────

{
  // Heat is HARMFUL (so `has-debuff` fires) and Cleanse-IMMUNE. It is not a Boss3
  // effect; it is here because it separates "Cleanse respects the status policy" from
  // "Cleanse strips whatever is harmful", and every assertion above passes on the
  // wrong one of those.
  assert(
    !isCleanseable(VOLCANIC_HEAT_EFFECT_ID, {}),
    "this control assumes Heat is Cleanse-immune; the status policy has moved",
  );
  const world = new World();
  const player = armedPlayer(world, "b3-immune", SUB_GUARDS);
  applyStatusEffect(player.tracksCombat, {
    id: VOLCANIC_HEAT_EFFECT_ID,
    maxStacks: 9,
    remainingMs: 60_000,
    refreshable: true,
    sourceId: "fixture",
    data: { totalMs: 60_000 },
  });

  updateAbilityFiring(world, Date.now());

  assert(
    (getStatusEffect(player.tracksCombat, VOLCANIC_HEAT_EFFECT_ID)?.stacks ?? 0) === 1,
    "a Cleanse-immune effect must not be stripped",
  );
  // It DOES fire — `has-debuff` reads harmfulness, not cleanseability — and removes
  // nothing. A legal activation with an EMPTY `removedEffects` is therefore a real
  // outcome, and the Boss3 verifier must not treat it as a defect.
  assert(
    removedByCleanse(world, player.isPlayer.id).length === 0,
    "an activation against an immune effect must record no removals",
  );
  console.log("  immune control: not stripped; an empty removal record is legal");
}

{
  // And with nothing at all, the cooldown is held rather than burned.
  const world = new World();
  const player = armedPlayer(world, "b3-idle", SUB_GUARDS);
  updateAbilityFiring(world, Date.now());
  assert(
    !player.tracksCombat.cooldowns[`ability.cd.${BOSS3_GUARD_IN}`],
    "the substituted Guard must not fire with no affliction present",
  );
  console.log("  idle control: cooldown held with nothing to remove");
}

// ── 5. The two arms act at different times, which is the substitution's shape ─────

{
  // The BASELINE arm, on the identical fixture: four venom stacks at full HP. Brace's
  // trigger is `hp-below 0.5`, so it cannot act here at all. This is why the contrast
  // is a tradeoff in WHEN a Guard is available and not only in what it does, and it
  // is measured rather than asserted from the ability table.
  const world = new World();
  const player = armedPlayer(world, "b3-baseline", REF_GUARDS);
  const venomId = paintVenom(player.tracksCombat, swamp.bossId, 4);

  updateAbilityFiring(world, Date.now());

  assert(
    !player.tracksCombat.cooldowns[`ability.cd.${BOSS3_GUARD_OUT}`],
    `${BOSS3_GUARD_OUT} must not fire at full HP; its trigger is an HP threshold`,
  );
  assert(
    (getStatusEffect(player.tracksCombat, venomId)?.stacks ?? 0) === 4,
    "the baseline arm removes nothing — it carries no status-removal tool at all",
  );
  console.log("  baseline arm: no removal, and no activation at full HP");
}

console.log("boss3Cleanse: ok");
