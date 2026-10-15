/** Server-authoritative tick driver for the persistent summon formation. */
import type { World } from '../../../../world/World';
import type { MinionEntity, PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import {
  computeMinionMaxHp,
  computeMinionSizeMult,
  computeMinionSpeed,
  despawnMinion,
  resolveMinionType,
  spawnMinionForOwner,
  syncMinionHitbox,
  syncMinionMaxHp,
  syncMinionMitigation,
  minionRecoveryFor,
} from './spawn';
import { driveMinion } from './ai';
import { validateSummonerCommand } from './command';
import { applyHealToMinion } from '../../../defense/regen/healing';
import { summonerProfileFor } from './profile';
import {
  enqueueSummonReconstruction,
  tickSummonReconstruction,
} from './reconstruction';
import { onSummonDeath, tickSummonerSpecializations } from './specs';
import { syncSummonerFormationTarget } from './formationTarget';
import { isPlayerInCombat } from '../../../combat/ai/engagement';
import { pruneFormationTechnique } from './formationTechnique';
import { registerSummonerFrameLoop, summonerFrenzyApsPct } from './frameLoop';
import { registerSummonPieces } from './summonPieces';
import { summonerLineBonus, syncSummonerLine } from './lineHolds';
import { syncFormationRecall } from './formationOrders';
import { onSoulSummonDeath, updateSoul } from './souls';

type SummonerPlayerEntity = PlayerEntity & {
  summonsMinions: NonNullable<PlayerEntity['summonsMinions']>;
};

/** Preserve matching logical slots and cleanly replace only changed layouts. */
function reconcileMinionSlots(world: World, owner: SummonerPlayerEntity): void {
  const summons = owner.summonsMinions;
  const desired = summonerProfileFor(owner).slots;
  const sameLayout = desired.length === summons.slotIds.length
    && desired.every((slot, index) => (
      summons.slotIds[index] === slot.slotId && summons.slotRoles[index] === slot.role
    ));
  if (sameLayout) return;

  const oldIndexBySlot = new Map(summons.slotIds.map((slotId, index) => [slotId, index]));
  const desiredIds = new Set(desired.map((slot) => slot.slotId));
  for (let oldIndex = 0; oldIndex < summons.slotIds.length; oldIndex++) {
    if (desiredIds.has(summons.slotIds[oldIndex]!)) continue;
    const entityId = summons.minionIds[oldIndex];
    const minion = entityId ? world.getMinionEntity(entityId) : undefined;
    if (minion) despawnMinion(world, minion);
  }

  const nextMinionIds = desired.map((slot, index) => {
    const oldIndex = oldIndexBySlot.get(slot.slotId);
    const id = oldIndex === undefined ? '' : (summons.minionIds[oldIndex] ?? '');
    const minion = id ? world.getMinionEntity(id) : undefined;
    if (minion) {
      minion.isMinion.slot = index;
      minion.isMinion.slotId = slot.slotId;
      minion.isMinion.role = slot.role;
      markSliceDirty(world, minion, 'isMinion');
    }
    return minion ? id : '';
  });

  summons.minionIds = nextMinionIds;
  summons.respawnTimers = new Array(desired.length).fill(0);
  summons.slotIds = desired.map((slot) => slot.slotId);
  summons.slotRoles = desired.map((slot) => slot.role);
  summons.targetCount = desired.length;
  summons.reconstructionQueue = summons.reconstructionQueue.filter((slotId) => desiredIds.has(slotId));
  if (summons.activeReconstruction && !desiredIds.has(summons.activeReconstruction.slotId)) {
    summons.activeReconstruction = undefined;
  }
  summons.ritualCharges = undefined;
  if (owner.controlsSummons) owner.controlsSummons.pendingDeadSlotIds = [];
  markSliceDirty(world, owner, 'summonsMinions');
}

function syncLiveMinionFrameStats(world: World, owner: SummonerPlayerEntity): void {
  const profile = summonerProfileFor(owner);
  const desiredSpeed = computeMinionSpeed(owner);
  // Consort's frame loop (`lineHolds.ts`). Resolved ONCE per pass: it is a
  // property of the whole formation, so re-deriving it per body would read the
  // same slots n times and could not usefully disagree with itself.
  const lineBonus = summonerLineBonus(world, owner);
  for (let index = 0; index < owner.summonsMinions.minionIds.length; index++) {
    const id = owner.summonsMinions.minionIds[index];
    const minion = id ? world.getMinionEntity(id) : undefined;
    if (!minion) continue;
    const slot = profile.slots[index] ?? profile.slots[0]!;
    const desiredType = resolveMinionType(owner, index);
    const desiredSizeMult = computeMinionSizeMult(owner, index);
    const typeChanged = minion.isMinion.monsterTypeId !== desiredType;
    const sizeChanged = minion.isMinion.sizeMult !== desiredSizeMult;
    if (typeChanged) {
      minion.isMinion.monsterTypeId = desiredType;
      markSliceDirty(world, minion, 'isMinion');
    }
    if (minion.hasPosition.speed !== desiredSpeed) {
      minion.hasPosition.speed = desiredSpeed;
      markSliceDirty(world, minion, 'hasPosition');
    }
    if (sizeChanged) {
      minion.isMinion.sizeMult = desiredSizeMult;
      markSliceDirty(world, minion, 'isMinion');
    }
    if (typeChanged || sizeChanged) {
      syncMinionHitbox(world, minion, desiredSizeMult);
    }
    if (minion.isMinion.slotId !== slot.slotId || minion.isMinion.role !== slot.role) {
      minion.isMinion.slotId = slot.slotId;
      minion.isMinion.role = slot.role;
      markSliceDirty(world, minion, 'isMinion');
    }
    syncMinionMaxHp(world, minion, computeMinionMaxHp(owner, index));
    syncMinionMitigation(world, minion, owner, lineBonus);
    const desiredHpRegen = minionRecoveryFor(minion.hasHealth.maxHp);
    if (minion.hasHealth.recovery !== desiredHpRegen) {
      minion.hasHealth.recovery = desiredHpRegen;
      markSliceDirty(world, minion, 'hasHealth');
    }
    // `summoner.minion-damage-pct` is applied at SPAWN (`spawnMinionForOwner`)
    // and was missing here, so this per-tick resync silently overwrote it one
    // tick after every spawn. Currently a no-op -- no skill node or item sets
    // the key yet -- but it is a landmine: the first T3/T4 node that grants
    // minion damage would appear to do nothing, with no error anywhere. Kept
    // identical to the spawn formula so the two cannot drift again.
    const damagePct = owner.usesSkills.passives['summoner.minion-damage-pct'] ?? 1.0;
    const desiredAttack = Math.max(
      1,
      Math.round(
        owner.dealsDamage.attack * damagePct * profile.formationOffenseMult * slot.offenseWeight * (slot.damageMult ?? 1),
      ),
    );
    if (minion.dealsDamage.attack !== desiredAttack) {
      minion.dealsDamage.attack = desiredAttack;
      markSliceDirty(world, minion, 'dealsDamage');
    }
    // Splinter's frenzy window (Phase 3) lives HERE rather than writing minion
    // cooldowns of its own: this resync runs every tick and is the single writer, so
    // the window applies and lapses without an un-apply step that could be missed.
    const desiredCooldown = Math.max(
      100,
      Math.round(
        (owner.performsAttack.attackCooldown * profile.summonAttackCooldownMult * (slot.cooldownMult ?? 1))
        / (1 + summonerFrenzyApsPct(owner)),
      ),
    );
    const desiredRange = slot.attackRange ?? profile.attackRange;
    if (minion.performsAttack.attackCooldown !== desiredCooldown
      || minion.performsAttack.attackRange !== desiredRange) {
      minion.performsAttack.attackCooldown = desiredCooldown;
      minion.performsAttack.attackRange = desiredRange;
      markSliceDirty(world, minion, 'performsAttack');
    }
  }
}

function isMinionInCombat(
  world: World,
  owner: SummonerPlayerEntity,
  minion: MinionEntity,
  now: number,
): boolean {
  if (minion.hasAttackTarget !== undefined) return true;
  if (isPlayerInCombat(owner, now)) return true;
  return [...world.aggroedMonsters].some((monster) => (
    monster.hasAggroTarget.targetKind === 'minion'
    && monster.hasAggroTarget.targetId === minion.isMinion.id
  ));
}

function runMinionRegen(
  world: World,
  owner: SummonerPlayerEntity,
  minion: MinionEntity,
  dt: number,
  now: number,
): void {
  if (minion.hasHealth.hp >= minion.hasHealth.maxHp) return;
  // In combat a summon has no Recovery of its own.
  if (isMinionInCombat(world, owner, minion, now)) return;
  const recovery = minion.hasHealth.recovery ?? 0;
  if (recovery <= 0) return;
  // Flat HP/s: `minionRecoveryFor` already expressed the out-of-combat rule as a
  // share of the minion's OWN pool, so it applies directly. This path is
  // out-of-combat only — the guard above is what makes that the right rule.
  applyHealToMinion(minion, owner.isPlayer.id, recovery * (dt / 1_000), world);
}


function collectDeaths(world: World, owner: SummonerPlayerEntity): void {
  const summons = owner.summonsMinions;
  for (let index = 0; index < summons.targetCount; index++) {
    const id = summons.minionIds[index];
    if (!id) continue;
    const minion = world.getMinionEntity(id);
    if (minion && minion.hasHealth.hp > 0) continue;
    enqueueSummonReconstruction(world, owner, summons.slotIds[index]!);
    if (minion) {
      onSoulSummonDeath(world, owner, minion);
      if (owner.controlsSummons) {
        onSummonDeath(
          world,
          owner as SummonerPlayerEntity & { controlsSummons: NonNullable<PlayerEntity['controlsSummons']> },
          minion,
        );
      }
      despawnMinion(world, minion);
    }
    else summons.minionIds[index] = '';
  }
}

function spawnFreshSlots(world: World, owner: SummonerPlayerEntity): void {
  const summons = owner.summonsMinions;
  for (let index = 0; index < summons.targetCount; index++) {
    if (summons.minionIds[index]) continue;
    const slotId = summons.slotIds[index]!;
    const owesReconstruction = summons.activeReconstruction?.slotId === slotId
      || summons.reconstructionQueue.includes(slotId)
      || owner.controlsSummons?.pendingDeadSlotIds.includes(slotId);
    if (!owesReconstruction) spawnMinionForOwner(world, owner, index);
  }
}

export function initSummonerArchetype(): void {
  // Frame loops + the root's `mechanic-fired` moment, both hung off the formation
  // cycle (progression rework Phase 3).
  registerSummonerFrameLoop();
  registerSummonPieces();
}

export function updateSummonerArchetype(world: World, dt: number, now: number): void {
  for (const owner of world.summonerPlayers) {
    const summoner = owner as SummonerPlayerEntity;
    reconcileMinionSlots(world, summoner);
    syncFormationRecall(world, summoner, now);
    if (summoner.controlsSummons) {
      tickSummonerSpecializations(
        world,
        summoner as SummonerPlayerEntity & { controlsSummons: NonNullable<PlayerEntity['controlsSummons']> },
        now,
      );
    }
    collectDeaths(world, summoner);
    pruneFormationTechnique(world, summoner);
    spawnFreshSlots(world, summoner);
    tickSummonReconstruction(world, summoner, dt, now);
    // AFTER `collectDeaths` and `tickSummonReconstruction`, so a death breaks
    // Consort's line and a completed reconstruction restores it on the same pass
    // that observed either, and BEFORE the resync, so the HUD record and the
    // bodies' mitigation are decided from one reading of the formation.
    syncSummonerLine(world, summoner);
    syncLiveMinionFrameStats(world, summoner);
    validateSummonerCommand(world, summoner, now);

    for (const id of summoner.summonsMinions.minionIds) {
      const minion = id ? world.getMinionEntity(id) : undefined;
      if (!minion || minion.hasHealth.hp <= 0) continue;
      if (minion.hasPosition.nodeId !== summoner.hasPosition.nodeId) {
        minion.hasPosition.nodeId = summoner.hasPosition.nodeId;
        markSliceDirty(world, minion, 'hasPosition');
      }
      runMinionRegen(world, summoner, minion, dt, now);
      driveMinion(world, minion, summoner, now);
    }
    syncSummonerFormationTarget(world, summoner);
    updateSoul(world, summoner, dt, now);
  }
}
