import {
  SUMMONER_CHORUS_EFFECT_ID,
  SUMMONER_HARRIER_EFFECT_ID,
  SUMMONER_SPECIALIZATION_TUNING,
  type StatusEffect,
  type SummonerProfile,
} from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../../ecs/entity';
import type { World } from '../../../../../world/World';
import { markSliceDirty } from '../../../../../ecs/dirtyHelpers';
import { applyPlayerAoe } from '../../../../combat/damage/aoeDamage';
import { applyPlayerProcDamage } from '../../../../combat/damage/procDamage';
import { registerCombatListener } from '../../../../combat/engine/combatPipeline';
import { summonerProfileFor } from '../profile';

type SummonerOwner = PlayerEntity & {
  summonsMinions: NonNullable<PlayerEntity['summonsMinions']>;
  controlsSummons: NonNullable<PlayerEntity['controlsSummons']>;
};

export interface PreparedSpecializationAttack {
  damageMult: number;
  directDamageBonusWeight: number;
  openingStrike: boolean;
  consumeRitualCharge: boolean;
}

function aliveSlotIds(world: World, owner: SummonerOwner): string[] {
  const result: string[] = [];
  for (let index = 0; index < owner.summonsMinions.targetCount; index++) {
    const id = owner.summonsMinions.minionIds[index];
    const minion = id ? world.getMinionEntity(id) : undefined;
    if (minion && minion.hasHealth.hp > 0) result.push(owner.summonsMinions.slotIds[index]!);
  }
  return result;
}

function removeOwnedTargetEffect(
  target: MonsterEntity | undefined,
  ownerId: string,
  effectId: string,
): void {
  if (!target?.tracksCombat) return;
  target.tracksCombat.statusEffects = target.tracksCombat.statusEffects.filter((effect) => (
    effect.id !== effectId || effect.sourceId !== ownerId
  ));
}

function syncOwnedTargetEffect(
  target: MonsterEntity,
  owner: SummonerOwner,
  effectId: string,
  stacks: number,
  remainingMs: number,
  totalMs: number,
): void {
  const state = target.tracksCombat;
  let effect = state.statusEffects.find((candidate) => (
    candidate.id === effectId && candidate.sourceId === owner.isPlayer.id
  ));
  if (stacks <= 0 || remainingMs <= 0) {
    removeOwnedTargetEffect(target, owner.isPlayer.id, effectId);
    return;
  }
  if (!effect) {
    effect = {
      id: effectId,
      stacks,
      maxStacks: owner.summonsMinions.targetCount,
      remainingMs,
      refreshable: true,
      // One independently timed entry per Conduit keeps party sources isolated.
      instanced: true,
      sourceId: owner.isPlayer.id,
      data: {},
    } satisfies StatusEffect;
    state.statusEffects.push(effect);
  }
  effect.stacks = stacks;
  effect.maxStacks = owner.summonsMinions.targetCount;
  effect.remainingMs = remainingMs;
  effect.sourceId = owner.isPlayer.id;
  effect.data.totalMs = totalMs;
  effect.data.uniqueSlots = stacks;
}

export function prepareSpecializationAttack(
  world: World,
  owner: SummonerOwner,
  minion: MinionEntity,
  target: MonsterEntity,
  now: number,
  cycle: { completed: boolean; serial: number },
): PreparedSpecializationAttack {
  const profile = summonerProfileFor(owner);
  const slotId = minion.isMinion.slotId;
  let damageMult = 1;
  let directDamageBonusWeight = 0;
  let openingStrike = false;
  let consumeRitualCharge = false;

  if (profile.specialization === 'harrier-brood') {
    const state = owner.controlsSummons.harrierMarksByTarget[target.isMonster.id];
    if (state && state.expiresAt > now) {
      damageMult *= 1 + state.slotIds.length
        * SUMMONER_SPECIALIZATION_TUNING.harrierBrood.damageTakenPctPerSlot;
    }
  }
  if (profile.specialization === 'coordinated-hunt') {
    const openers = owner.controlsSummons.coordinatedOpenersByTarget[target.isMonster.id] ?? [];
    if (!openers.includes(slotId)) {
      damageMult *= SUMMONER_SPECIALIZATION_TUNING.coordinatedHunt.openingDamageMult;
      openingStrike = true;
    }
    const tuning = SUMMONER_SPECIALIZATION_TUNING.coordinatedHunt;
    if (cycle.completed && cycle.serial > 0 && cycle.serial % tuning.cyclesRequired === 0) {
      const living = new Set(aliveSlotIds(world, owner));
      const livingOffenseWeight = profile.slots.reduce(
        (sum, slot) => sum + (living.has(slot.slotId) ? slot.offenseWeight : 0),
        0,
      );
      // Resolve the cadence event as one synchronized formation strike. A partial
      // formation contributes only its living budget; it never inherits missing slots.
      directDamageBonusWeight += livingOffenseWeight * (tuning.coordinatedDamageMult - 1);
    }
  }
  if (profile.specialization === 'grand-ritual') {
    const charges = owner.summonsMinions.ritualCharges?.[minion.isMinion.slot] ?? 0;
    if (charges > 0) {
      damageMult *= SUMMONER_SPECIALIZATION_TUNING.grandRitual.damageMult;
      consumeRitualCharge = true;
    }
  }
  if (profile.specialization === 'twin-covenant' && aliveSlotIds(world, owner).length === 1) {
    damageMult *= 1.1;
  }
  return { damageMult, directDamageBonusWeight, openingStrike, consumeRitualCharge };
}

export function commitSpecializationAttack(
  world: World,
  owner: SummonerOwner,
  minion: MinionEntity,
  target: MonsterEntity,
  now: number,
  prepared: PreparedSpecializationAttack,
): void {
  const profile = summonerProfileFor(owner);
  const targetId = target.isMonster.id;
  const slotId = minion.isMinion.slotId;
  if (profile.specialization === 'harrier-brood') {
    const current = owner.controlsSummons.harrierMarksByTarget[targetId];
    const living = new Set(aliveSlotIds(world, owner));
    const slotIds = current?.expiresAt && current.expiresAt > now
      ? current.slotIds.filter((id) => living.has(id))
      : [];
    if (!slotIds.includes(slotId)) slotIds.push(slotId);
    const durationMs = SUMMONER_SPECIALIZATION_TUNING.harrierBrood.durationMs;
    owner.controlsSummons.harrierMarksByTarget[targetId] = {
      slotIds,
      expiresAt: now + durationMs,
    };
    syncOwnedTargetEffect(target, owner, SUMMONER_HARRIER_EFFECT_ID, slotIds.length, durationMs, durationMs);
  }
  if (profile.specialization === 'coordinated-hunt' && prepared.openingStrike) {
    const openers = owner.controlsSummons.coordinatedOpenersByTarget[targetId] ?? [];
    if (!openers.includes(slotId)) openers.push(slotId);
    owner.controlsSummons.coordinatedOpenersByTarget[targetId] = openers;
  }
  if (profile.specialization === 'withering-chorus') {
    const tuning = SUMMONER_SPECIALIZATION_TUNING.witheringChorus;
    const current = owner.controlsSummons.chorusByTarget[targetId];
    const slotIds = current?.expiresAt && current.expiresAt > now ? [...current.slotIds] : [];
    if (!slotIds.includes(slotId)) slotIds.push(slotId);
    owner.controlsSummons.chorusByTarget[targetId] = {
      slotIds,
      expiresAt: now + tuning.durationMs,
      nextTickAt: current?.nextTickAt && current.nextTickAt > now
        ? current.nextTickAt
        : now + tuning.tickMs,
    };
    syncOwnedTargetEffect(target, owner, SUMMONER_CHORUS_EFFECT_ID, slotIds.length, tuning.durationMs, tuning.durationMs);
  }
  if (prepared.consumeRitualCharge && owner.summonsMinions.ritualCharges) {
    const index = minion.isMinion.slot;
    owner.summonsMinions.ritualCharges[index] = Math.max(
      0,
      (owner.summonsMinions.ritualCharges[index] ?? 0) - 1,
    );
    markSliceDirty(world, owner, 'summonsMinions');
  }
}

function explosionDamage(owner: SummonerOwner, minion: MinionEntity, mult: number): number {
  const profile = summonerProfileFor(owner);
  const slot = profile.slots.find((candidate) => candidate.slotId === minion.isMinion.slotId)
    ?? profile.slots[minion.isMinion.slot]
    ?? profile.slots[0]!;
  return Math.max(1, Math.round(
    owner.dealsDamage.attack * profile.formationOffenseMult * slot.offenseWeight * mult,
  ));
}

function detonate(
  world: World,
  owner: SummonerOwner,
  minion: MinionEntity,
  mult: number,
  center = minion.hasPosition.current,
): void {
  if (owner.controlsSummons.explodedMinionIds.includes(minion.isMinion.id)) return;
  owner.controlsSummons.explodedMinionIds.push(minion.isMinion.id);
  const tuning = SUMMONER_SPECIALIZATION_TUNING.volatileBrood;
  applyPlayerAoe(
    world,
    owner,
    center,
    tuning.explosionRadius,
    explosionDamage(owner, minion, mult),
  );
}

function deliberateDetonationTarget(
  world: World,
  owner: SummonerOwner,
  minion: MinionEntity,
): MonsterEntity | undefined {
  const candidateIds = [minion.hasAttackTarget?.targetId, owner.hasAttackTarget?.targetId];
  for (const targetId of candidateIds) {
    const target = targetId ? world.getMonsterEntity(targetId) : undefined;
    if (target && target.hasHealth.hp > 0 && target.hasPosition.nodeId === owner.hasPosition.nodeId) {
      return target;
    }
  }
  return undefined;
}

export function onSummonDeath(
  world: World,
  owner: SummonerOwner,
  minion: MinionEntity,
): void {
  if (summonerProfileFor(owner).specialization !== 'volatile-brood') return;
  const tuning = SUMMONER_SPECIALIZATION_TUNING.volatileBrood;
  const deliberate = owner.summonsMinions.volatileMarkedSlotId === minion.isMinion.slotId;
  if (!owner.controlsSummons.explodedMinionIds.includes(minion.isMinion.id)) {
    detonate(
      world,
      owner,
      minion,
      deliberate ? tuning.explosionDamageMult : tuning.naturalDeathExplosionMult,
    );
  }
  owner.controlsSummons.explodedMinionIds = owner.controlsSummons.explodedMinionIds
    .filter((id) => id !== minion.isMinion.id);
  if (deliberate) owner.summonsMinions.volatileMarkedSlotId = undefined;
}

function tickVolatile(world: World, owner: SummonerOwner, now: number): void {
  const controls = owner.controlsSummons;
  const summons = owner.summonsMinions;
  const tuning = SUMMONER_SPECIALIZATION_TUNING.volatileBrood;
  if (controls.volatileNextDetonationAt <= 0) {
    controls.volatileNextDetonationAt = now + tuning.detonationIntervalMs;
  }
  const living = aliveSlotIds(world, owner);
  if (living.length === 0) return;
  if (!summons.volatileMarkedSlotId && now >= controls.volatileNextDetonationAt - 2_000) {
    summons.volatileMarkedSlotId = living[controls.volatileCursor % living.length]!;
    markSliceDirty(world, owner, 'summonsMinions');
  }
  if (now < controls.volatileNextDetonationAt) return;
  const marked = summons.volatileMarkedSlotId;
  const index = marked ? summons.slotIds.indexOf(marked) : -1;
  const id = index >= 0 ? summons.minionIds[index] : '';
  const minion = id ? world.getMinionEntity(id) : undefined;
  if (minion && minion.hasHealth.hp > 0) {
    const target = deliberateDetonationTarget(world, owner, minion);
    if (!target) return;
    const profile = summonerProfileFor(owner);
    if (profile.range === 'close') {
      const dx = target.hasPosition.current.x - minion.hasPosition.current.x;
      const dy = target.hasPosition.current.y - minion.hasPosition.current.y;
      if (Math.hypot(dx, dy) > tuning.explosionRadius) return;
    }
    // Mid/Far formations deliver the volatile payload to their valid target;
    // close formations burst from the summon itself.
    const center = profile.range === 'close'
      ? minion.hasPosition.current
      : target.hasPosition.current;
    detonate(world, owner, minion, tuning.explosionDamageMult, center);
    minion.hasHealth.hp = 0;
    markSliceDirty(world, minion, 'hasHealth');
  }
  controls.volatileCursor++;
  controls.volatileNextDetonationAt = now + tuning.detonationIntervalMs;
  if (!minion) summons.volatileMarkedSlotId = undefined;
  markSliceDirty(world, owner, 'summonsMinions');
}

function resetSpecializationState(
  world: World,
  owner: SummonerOwner,
  next: SummonerProfile['specialization'],
): void {
  const controls = owner.controlsSummons;
  const persistedBondCharge = next === 'battle-bond'
    ? Math.max(0, owner.summonsMinions.bondCharge ?? 0)
    : 0;
  for (const targetId of Object.keys(controls.harrierMarksByTarget)) {
    removeOwnedTargetEffect(world.getMonsterEntity(targetId), owner.isPlayer.id, SUMMONER_HARRIER_EFFECT_ID);
  }
  for (const targetId of Object.keys(controls.chorusByTarget)) {
    removeOwnedTargetEffect(world.getMonsterEntity(targetId), owner.isPlayer.id, SUMMONER_CHORUS_EFFECT_ID);
  }
  controls.harrierMarksByTarget = {};
  controls.coordinatedOpenersByTarget = {};
  controls.chorusByTarget = {};
  controls.cycleContributorsByTarget = {};
  controls.cycleSerialByTarget = {};
  controls.volatileNextDetonationAt = 0;
  controls.volatileCursor = 0;
  controls.explodedMinionIds = [];
  controls.ritualNextAt = 0;
  controls.bondProgress = 0;
  controls.bondLastSide = undefined;
  controls.bondHydrated = false;
  controls.activeSpecialization = next;
  owner.summonsMinions.volatileMarkedSlotId = undefined;
  owner.summonsMinions.ritualCharges = undefined;
  owner.summonsMinions.bondCharge = persistedBondCharge;
  markSliceDirty(world, owner, 'summonsMinions');
}

function tickRitual(world: World, owner: SummonerOwner, now: number): void {
  const tuning = SUMMONER_SPECIALIZATION_TUNING.grandRitual;
  if (owner.controlsSummons.ritualNextAt <= 0) {
    owner.controlsSummons.ritualNextAt = now + tuning.intervalMs;
  }
  if (now < owner.controlsSummons.ritualNextAt) return;
  const charges = new Array(owner.summonsMinions.targetCount).fill(0);
  for (let index = 0; index < charges.length; index++) {
    const id = owner.summonsMinions.minionIds[index];
    const minion = id ? world.getMinionEntity(id) : undefined;
    if (minion && minion.hasHealth.hp > 0) charges[index] = tuning.chargesPerLivingSlot;
  }
  owner.summonsMinions.ritualCharges = charges;
  owner.controlsSummons.ritualNextAt = now + tuning.intervalMs;
  markSliceDirty(world, owner, 'summonsMinions');
}

function tickChorus(world: World, owner: SummonerOwner, now: number): void {
  const tuning = SUMMONER_SPECIALIZATION_TUNING.witheringChorus;
  for (const [targetId, state] of Object.entries(owner.controlsSummons.chorusByTarget)) {
    const target = world.getMonsterEntity(targetId);
    if (!target || target.hasHealth.hp <= 0 || state.expiresAt <= now) {
      removeOwnedTargetEffect(target, owner.isPlayer.id, SUMMONER_CHORUS_EFFECT_ID);
      delete owner.controlsSummons.chorusByTarget[targetId];
      continue;
    }
    syncOwnedTargetEffect(
      target,
      owner,
      SUMMONER_CHORUS_EFFECT_ID,
      state.slotIds.length,
      state.expiresAt - now,
      tuning.durationMs,
    );
    if (now < state.nextTickAt) continue;
    state.nextTickAt += tuning.tickMs;
    applyPlayerProcDamage(
      world,
      owner,
      target,
      Math.max(1, Math.round(owner.dealsDamage.attack * tuning.damagePctPerSlot * state.slotIds.length)),
      { tags: ['summoner', 'withering-chorus'] },
    );
  }
}

export function tickSummonerSpecializations(
  world: World,
  owner: SummonerOwner,
  now: number,
): void {
  const specialization = summonerProfileFor(owner).specialization;
  if (owner.controlsSummons.activeSpecialization !== specialization) {
    resetSpecializationState(world, owner, specialization);
  }
  if (specialization === 'battle-bond' && !owner.controlsSummons.bondHydrated) {
    owner.controlsSummons.bondProgress = Math.max(0, owner.summonsMinions.bondCharge ?? 0);
    owner.controlsSummons.bondHydrated = true;
  }
  if (specialization === 'volatile-brood') tickVolatile(world, owner, now);
  if (specialization === 'grand-ritual') tickRitual(world, owner, now);
  if (specialization === 'withering-chorus') tickChorus(world, owner, now);
  for (const [targetId, state] of Object.entries(owner.controlsSummons.harrierMarksByTarget)) {
    const target = world.getMonsterEntity(targetId);
    const living = new Set(aliveSlotIds(world, owner));
    state.slotIds = state.slotIds.filter((slotId) => living.has(slotId));
    if (state.expiresAt <= now || !target || state.slotIds.length === 0) {
      removeOwnedTargetEffect(target, owner.isPlayer.id, SUMMONER_HARRIER_EFFECT_ID);
      delete owner.controlsSummons.harrierMarksByTarget[targetId];
    } else {
      const durationMs = SUMMONER_SPECIALIZATION_TUNING.harrierBrood.durationMs;
      syncOwnedTargetEffect(target, owner, SUMMONER_HARRIER_EFFECT_ID, state.slotIds.length, state.expiresAt - now, durationMs);
    }
  }
  for (const targetId of Object.keys(owner.controlsSummons.coordinatedOpenersByTarget)) {
    if (!world.getMonsterEntity(targetId)) delete owner.controlsSummons.coordinatedOpenersByTarget[targetId];
  }
  for (const targetId of Object.keys(owner.controlsSummons.cycleContributorsByTarget)) {
    if (!world.getMonsterEntity(targetId)) {
      delete owner.controlsSummons.cycleContributorsByTarget[targetId];
      delete owner.controlsSummons.cycleSerialByTarget[targetId];
    }
  }
}

export function registerSummonerSpecializationHooks(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    if (!ctx.formation || ctx.formation.side === undefined) return;
    const owner = ctx.attacker;
    if (!owner.summonsMinions || !owner.controlsSummons) return;
    const profile: SummonerProfile = summonerProfileFor(owner);
    if (profile.specialization !== 'battle-bond') return;
    if (ctx.metadata.chaoticMiss === true) return;
    const tuning = SUMMONER_SPECIALIZATION_TUNING.battleBond;
    owner.controlsSummons.bondProgress++;
    owner.controlsSummons.bondLastSide = ctx.formation.side;
    if (owner.controlsSummons.bondProgress >= tuning.threshold) {
      owner.controlsSummons.bondProgress = 0;
      ctx.damage += Math.max(1, Math.round(owner.dealsDamage.attack * 0.5));
      ctx.metadata.empoweredAttack = true;
    }
    owner.summonsMinions.bondCharge = owner.controlsSummons.bondProgress;
    markSliceDirty(world, owner, 'summonsMinions');
  });
}
