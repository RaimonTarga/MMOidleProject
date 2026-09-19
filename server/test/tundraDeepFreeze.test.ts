// TUNDRA DEEP FREEZE — the player-control and presentation repair.
//
// Deep Freeze is the one player-facing hard control in the Tundra lineage, and it
// reaches the player through the generic `apply-status` pattern step rather than
// through `applyStun`. That made it possible for the effect to land, be classified
// as hard control by `playerHardControl`, and still take nothing away: the control
// LOCKOUT reconciler recognised only Cave Lockdown and Stun, so Frozen wrote a
// status row and no locks.
//
// This asserts the control contract, not the balance: the gate, the locks, both
// removal paths, and the ownership rules that let Frozen overlap with another
// control effect and with the summoner's INTRINSIC attack restriction.
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/tundraDeepFreeze.test.ts
import {
  BUFF_IDS,
  CAVE_LOCKDOWN_EFFECT_ID,
  FROZEN_STATUS_ID,
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  emptyEquipment,
  getStatusEffect,
  isCleanseable,
  removeStatusEffect,
  statusPolicyFor,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { updateBossPatterns } from '../src/systems/combat/ai/bossPatterns';
import { updateCombatState } from '../src/systems/combat/engine/combatState';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { syncPlayerControlLockout } from '../src/systems/combat/status/playerControlLockout';
import { PLAYER_HARD_CONTROL_EFFECTS } from '../src/systems/combat/status/playerHardControl';
import { syncPlayerBuffs } from '../src/systems/combat/buffs/buffSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { World } from '../src/world/World';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
const T3_BOSS = 'frost-plated-rime-mammoth';
const T4_BOSS = 'glacial-patriarch';

function playerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 405, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      attunedAbilities: { technique: null, guard: null }, knownStances: [],
      equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

initCombatSystems();

/** The authored gate on each boss's freeze step — read from data, never re-stated. */
function freezeStep(monsterId: string) {
  const pattern = MONSTER_DATABASE.get(monsterId)?.bossPattern;
  assert(!!pattern, `${monsterId} should run a Deep Freeze pattern`);
  const step = pattern.steps.find(
    (s) => s.kind === 'apply-status' && s.effectId === FROZEN_STATUS_ID,
  );
  assert(!!step && step.kind === 'apply-status', `${monsterId} should carry a Frozen step`);
  assert(!!step.requires, `${monsterId}'s freeze must stay gated on Chill`);
  return { step, requires: step.requires };
}

function armedBoss(world: World, monsterId: string, playerId: string) {
  const pattern = MONSTER_DATABASE.get(monsterId)!.bossPattern!;
  const monster = world.createMonster(NODE, monsterId, { x: 400, y: 400 });
  assert(!!monster, `${monsterId} should spawn`);
  setAggroTarget(world, monster, { id: playerId, kind: 'player' }, 1_000);
  monster.hasAwareness.state = 'attacking';
  const armedAt = 1_000 + (pattern.initialCooldownMs ?? pattern.cooldownMs) + 1_000;
  return { monster, armedAt };
}

/**
 * Drive a pattern to completion, sampling every tick.
 *
 * `updateCombatState` first, in the real tick order — it both decrements status
 * durations and runs the lockout reconciler, so this exercises the same expiry path
 * the live server does rather than a pattern loop that never ages anything.
 */
function runPattern(
  world: World,
  monster: MonsterEntity,
  player: PlayerEntity,
  startAt: number,
  onEachTick?: (now: number) => void,
): void {
  let now = startAt;
  for (let i = 0; i < 300; i++) {
    updateCombatState(world, 100);
    updateBossPatterns(world, 100, now);
    onEachTick?.(now);
    // Stop once the pattern has reached recovery AND the freeze it applied has aged
    // out. Breaking at recovery alone would end the run 1.3s after the freeze lands,
    // well inside its 2.2s duration, and the expiry assertions would never be
    // reached — a passing test that proved nothing about the thaw.
    const settled = i > 0 && !monster.runsBossPattern && monster.recoversFromPattern;
    if (settled && !getStatusEffect(player.tracksCombat, FROZEN_STATUS_ID)) break;
    now += 100;
  }
}

/**
 * Seed the room's Chill to an exact stack count.
 *
 * `applyStatusEffect` ignores a `stacks` field on the config — it creates at one and
 * increments per application — so the only honest way to reach a count is to apply
 * that many times. Writing `stacks: n` instead silently seeds ONE stack, which makes
 * an at-threshold case quietly test the below-threshold path.
 */
function seedChill(player: PlayerEntity, effectId: string, stacks: number): void {
  for (let i = 0; i < stacks; i++) {
    applyStatusEffect(player.tracksCombat, {
      id: effectId,
      maxStacks: Math.max(1, stacks),
      remainingMs: 60_000,
      refreshable: true,
      sourceId: 'room',
      data: { totalMs: 60_000 },
    });
  }
  const seeded = getStatusEffect(player.tracksCombat, effectId);
  assert(seeded?.stacks === stacks, `Chill should seed to exactly ${stacks} stacks`);
}

function freeze(player: PlayerEntity, durationMs: number): void {
  applyStatusEffect(player.tracksCombat, {
    id: FROZEN_STATUS_ID,
    maxStacks: 1,
    remainingMs: durationMs,
    refreshable: true,
    sourceId: 'boss',
    data: { totalMs: durationMs },
  });
}

// ── 1. Below the Chill threshold the freeze is skipped ───────────────────────
// The gate is the encounter's whole question. A skipped step applies nothing and
// must not consume or reshape the Shatter step that follows it.
for (const monsterId of [T3_BOSS, T4_BOSS]) {
  const { requires } = freezeStep(monsterId);
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('under-gate'), 'under-gate');
  const { monster, armedAt } = armedBoss(world, monsterId, 'under-gate');
  seedChill(player, requires.effectId, requires.minStacks - 1);

  let sawFrozen = false;
  let sawLock = false;
  const hpBefore = player.hasHealth.hp;
  runPattern(world, monster, player, armedAt, () => {
    if (getStatusEffect(player.tracksCombat, FROZEN_STATUS_ID)) sawFrozen = true;
    if (player.isRooted || player.cannotAttack) sawLock = true;
  });

  assert(!sawFrozen, `${monsterId}: under the gate, Frozen must never land`);
  assert(!sawLock, `${monsterId}: a skipped freeze must take no control`);
  // The next step keeps its authored behavior — it is not gated with the freeze.
  assert(player.hasHealth.hp < hpBefore, `${monsterId}: the Shatter should still resolve`);
}

// ── 2. At the threshold: Frozen, the locks, and the player debuff entry ──────
for (const monsterId of [T3_BOSS, T4_BOSS]) {
  const { requires } = freezeStep(monsterId);
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('at-gate'), 'at-gate');
  const { monster, armedAt } = armedBoss(world, monsterId, 'at-gate');
  seedChill(player, requires.effectId, requires.minStacks);

  let frozenAndRooted = false;
  let frozenAndAttackLocked = false;
  let tile: { durationPct: number; remainingMs?: number; label: string } | undefined;
  runPattern(world, monster, player, armedAt, (now) => {
    if (!getStatusEffect(player.tracksCombat, FROZEN_STATUS_ID)) return;
    if (player.isRooted) frozenAndRooted = true;
    if (player.cannotAttack) frozenAndAttackLocked = true;
    syncPlayerBuffs(world, now);
    const entry = (player.hasStatus.activeBuffs ?? []).find((b) => b.id === 'debuff-frozen');
    if (entry) tile = entry;
  });

  assert(frozenAndRooted, `${monsterId}: a Frozen player must be rooted`);
  assert(frozenAndAttackLocked, `${monsterId}: a Frozen player must not be able to attack`);
  assert(!!tile, `${monsterId}: Frozen must project a player debuff entry`);
  // The tile is a clock, so it has to carry live remaining time, not a bare flag.
  assert(
    tile.durationPct > 0 && tile.durationPct <= 100,
    `${monsterId}: the Frozen tile must report a real remaining fraction`,
  );
  assert((tile.remainingMs ?? 0) > 0, `${monsterId}: the Frozen tile needs remaining ms`);
  // And the locks must lift with it, on the pattern's own timeline.
  assert(
    getStatusEffect(player.tracksCombat, FROZEN_STATUS_ID) === undefined,
    `${monsterId}: Frozen should expire inside the pattern`,
  );
  assert(!player.isRooted, `${monsterId}: natural expiry must lift the root`);
  assert(!player.cannotAttack, `${monsterId}: natural expiry must lift the attack lock`);
}

// `debuff-frozen` is a distinct id, and the DoT archetype's target-facing tile is
// untouched: both must remain on the wire allowlist.
{
  const ids: readonly string[] = BUFF_IDS;
  assert(ids.includes('debuff-frozen'), 'debuff-frozen must be a networked buff id');
  assert(ids.includes('dot-frozen'), 'the target-facing Frozen tile must survive');
}

// ── 3. Break Free strips Frozen and the locks it owns ────────────────────────
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('break-free'), 'break-free');
  freeze(player, 2_200);
  syncPlayerControlLockout(world, player);
  assert(!!player.isRooted && !!player.cannotAttack, 'Frozen should take both locks');

  // What Break Free does, at the seam it does it: remove the worst hard control,
  // then reconcile. Frozen is on that list, so it is reachable.
  assert(
    PLAYER_HARD_CONTROL_EFFECTS.includes(FROZEN_STATUS_ID),
    'Break Free must be able to see Frozen',
  );
  removeStatusEffect(player.tracksCombat, FROZEN_STATUS_ID);
  syncPlayerControlLockout(world, player);
  assert(!player.isRooted, 'Break Free must release the root it owned');
  assert(!player.cannotAttack, 'Break Free must release the attack lock it owned');
}

// Ordinary Cleanse keeps its existing policy: it does not answer hard control.
{
  const policy = statusPolicyFor(FROZEN_STATUS_ID, {});
  assert(policy.hardControl, 'Frozen is hard control');
  assert(policy.cleanse === 'immune', 'Cleanse must not answer Frozen');
  assert(!isCleanseable(FROZEN_STATUS_ID, {}), 'and that is what isCleanseable reports');
}

// ── 4. Overlapping control: neither effect releases the other's locks ────────
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('overlap'), 'overlap');
  const cs = player.tracksCombat;
  freeze(player, 1_000);
  applyStatusEffect(cs, {
    id: CAVE_LOCKDOWN_EFFECT_ID, maxStacks: 1, remainingMs: 5_000,
    refreshable: true, sourceId: 'cave', data: { totalMs: 5_000 },
  });
  syncPlayerControlLockout(world, player);
  assert(!!player.isRooted && !!player.cannotAttack, 'both controls lock the player');

  removeStatusEffect(cs, FROZEN_STATUS_ID);
  syncPlayerControlLockout(world, player);
  assert(!!player.isRooted, 'the surviving Pin must keep the root');
  assert(!!player.cannotAttack, 'the surviving Pin must keep the attack lock');

  removeStatusEffect(cs, CAVE_LOCKDOWN_EFFECT_ID);
  syncPlayerControlLockout(world, player);
  assert(!player.isRooted, 'the last control to leave releases the root');
  assert(!player.cannotAttack, 'and the attack lock');
}

// ── 5. The summoner's intrinsic restriction survives a freeze ────────────────
// A non-battle-bond summoner cannot attack by design. Frozen must not hand that
// restriction back on expiry just because it was holding a lock of its own.
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('summoner'), 'summoner');
  player.usesSkills.combatArchetype = 'summoner';
  player.usesSkills.selectedSubVariant = 'balanced';
  attachComponent(world, player, 'cannotAttack', {});

  freeze(player, 1_000);
  syncPlayerControlLockout(world, player);
  assert(!!player.isRooted, 'a frozen summoner is still rooted');

  removeStatusEffect(player.tracksCombat, FROZEN_STATUS_ID);
  syncPlayerControlLockout(world, player);
  assert(!player.isRooted, 'the thaw releases the root');
  assert(
    !!player.cannotAttack,
    'the summoner keeps its INTRINSIC attack restriction after the thaw',
  );
}

console.log('tundraDeepFreeze: ok');
