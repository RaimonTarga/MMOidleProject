/**
 * Boss fight scripting system.
 *
 * Each boss can opt-in by setting `bossScript` in its MonsterDefinition.
 * The script declares:
 *   - phases:    one-shot HP-threshold triggers (fire once per fight life)
 *   - repeating: periodic timers (run continuously once the boss is engaged)
 *
 * Supported actions (BossAction union in monsterDatabase.ts):
 *   enrage         — multiply attack + accelerate cooldown, optional duration
 *   regen          — heal hpPctPerSec × maxHp per second, optional duration
 *   shield         — add flat damage-reduction for a fixed window (cyclic)
 *   summon         — spawn N minions of a given type near the boss
 *   stat-buff      — multiply any single stat (incl. evasion), optional duration
 *   morph          — flip non-numeric stance fields (ranged/style/range/dot/kite)
 *   roar           — temporarily hasten the boss and nearby monster allies
 *   apply-shield   — gain a runtime enemyShield override mid-fight
 *   apply-soft-cap — gain a runtime enemySoftCap override mid-fight
 *   shed-defense   — drop all defenses (clear overrides, suppress static, cut plating)
 *   modify-ramp-debuff — raise the rampDebuff slow caps mid-fight
 *   spawn-adds     — spawn tracked adds despawned on boss death
 *   raise-dead     — burst-resurrect nearby corpses (Wasteland)
 *   stoke-ramp     — bend the node's ambient ramp: faster, deeper, with a floor (Volcano)
 *   spawn-pool     — lay a hazard pool centred on the boss (Swamp / Volcano)
 *   empower-charged— scale the boss's signature telegraphed attack
 *   empower-shred  — deepen the boss's plating-shred package (Cave)
 *
 * Runtime state lives on `entity.scriptsBoss` (server-only, never serialized).
 * Dead bosses are pruned when the monster entity is removed from the world.
 */

import type { BossAction, BossPhase, BossScript, RepeatingAction } from '@mmo-idle/shared';
import {
  applyStatusEffect,
  BOSS_DEBUFF_KEY,
  circleGeometry,
  distanceSq,
  removeStatusEffect,
  MONSTER_DATABASE,
  GAME_CONFIG,
  FROST_RAMP_EFFECT_ID,
  frostRampMaxStacks,
  getStatusEffect,
} from '@mmo-idle/shared';
import { NODE_REGISTRY } from '../../../world/nodeRegistry';
import type { World } from '../../../world/World';
import type { MonsterEntity } from '../../../ecs/entity';
import type { ActiveBossEffect, ScriptsBoss } from '@mmo-idle/shared';
import { initScriptsBoss } from '@mmo-idle/shared';
import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import { setAggroTarget, setAttackTarget } from './targeting';
import { BONE_TITHE_EFFECT_ID, BOSS_RALLIED_EFFECT_ID, BOSS_ROAR_HASTE_EFFECT_ID } from '../engine/monsterMechanics';
import { abortMonsterCast } from '../engine/combat';
import { publishFaultLineBurst, publishToxicPool } from '../../world/groundZones';
import { stokeAmbientRamp } from '../../world/nodeFeatures';
import { countRaisedBy, raiseCorpsesBurst } from './raiseDead';
import { applyMonsterDotToPlayer } from '../status/monsterDot';
import { hasIndependentRoot, setRooted } from '../../world/rooted';

export type { ScriptsBoss, ActiveBossEffect } from '@mmo-idle/shared';
export { initScriptsBoss } from '@mmo-idle/shared';

// ── Main update ───────────────────────────────────────────────────────────────

export function updateBossScripts(world: World, dt: number): void {
  for (const e of world.bossScriptedMonsters) {
    const def = MONSTER_DATABASE.get(e.isMonster.monsterTypeId);
    if (!def?.bossScript) continue;

    const script = def.bossScript;
    const state = e.scriptsBoss!;

    if (e.hasAggroTarget) attachComponent(world, e, 'isBossEngaged', {});

    tickActiveEffects(state, e, world, dt);
    tickScriptedCast(state, e, world, dt);

    if (e.isBossEngaged) {
      if (script.phases)    checkPhaseTransitions(state, script.phases,    e, world);
      if (script.repeating) tickRepeatingActions(state,  script.repeating,  e, world, dt);
      tickPoolSpread(state, e, world, dt);
      tickRoomAffliction(state, e, world, dt);
      tickRoomDebuffs(state, e, world, dt);
      tickVents(state, e, world);
      tickBoneTithe(state, e, world);
      tickHarvest(state, e, world, dt);
    }

    const bossEffectStacks: Record<string, number> = {};
    const bossEffectDurations: Record<string, { remainingMs: number; totalMs: number }> = {};
    for (const effect of state.activeEffects) {
      bossEffectStacks[effect.type] = (bossEffectStacks[effect.type] ?? 0) + 1;
      const current = bossEffectDurations[effect.type];
      if (
        !current ||
        effect.remainingMs < 0 ||
        (current.remainingMs >= 0 && effect.remainingMs > current.remainingMs)
      ) {
        bossEffectDurations[effect.type] = {
          remainingMs: effect.remainingMs,
          totalMs: effect.totalMs,
        };
      }
    }
    // Replace only the script's own keys: boss patterns publish onto the same list
    // (recovery, instinct, cast announcements) and must survive the script's pass.
    const previous = new Set(state.publishedEffects ?? []);
    const stacks = { ...(e.hasStatus.bossEffectStacks ?? {}) };
    const durations = { ...(e.hasStatus.bossEffectDurations ?? {}) };
    for (const id of previous) { delete stacks[id]; delete durations[id]; }
    const scriptKeys = Object.keys(bossEffectStacks);
    e.hasStatus.bossEffects = [
      ...(e.hasStatus.bossEffects ?? []).filter(id => !previous.has(id) && !(id in bossEffectStacks)),
      ...scriptKeys,
    ];
    e.hasStatus.bossEffectStacks = { ...stacks, ...bossEffectStacks };
    e.hasStatus.bossEffectDurations = { ...durations, ...bossEffectDurations };
    state.publishedEffects = scriptKeys;
    e.hasStatus.bossPhase = state.phaseLabel;
    e.hasStatus.bossWeather = state.weather;
    markSliceDirty(world, e, 'hasStatus');
  }
}

// ── Arena escalation (Swamp Rot Bloom) ───────────────────────────────────────

/** Grow every live pool this boss owns toward its spread cap. */
function tickPoolSpread(state: ScriptsBoss, monster: MonsterEntity, world: World, dt: number): void {
  const spread = state.poolSpread;
  if (!spread) return;
  for (const zone of world.groundZones.get(monster.hasPosition.nodeId) ?? []) {
    if (zone.kind !== 'toxic-pool' || zone.ownerId !== monster.isMonster.id) continue;
    const base = zone.baseRadius ?? zone.radius;
    zone.baseRadius = base;
    const cap = base * spread.maxRadiusMult;
    if (zone.radius >= cap) continue;
    zone.radius = Math.min(cap, zone.radius + spread.radiusPerSec * (dt / 1000));
    zone.geometry = circleGeometry(zone.pos, zone.radius);
  }
}

/** The arena's own DoT ramp: one stack per interval on every engaged player here. */
function tickRoomAffliction(state: ScriptsBoss, monster: MonsterEntity, world: World, dt: number): void {
  const room = state.roomAffliction;
  if (!room) return;
  room.timerMs -= dt;
  if (room.timerMs > 0) return;
  room.timerMs = room.intervalMs;
  // The whole room, while the boss is engaged (the caller gates on that).
  for (const player of world.livePlayersInNode(monster.hasPosition.nodeId)) {
    applyMonsterDotToPlayer(world, monster, player, { ...room.dot, element: 'poison' }, room.dot.label);
  }
}

/**
 * Each vent erupts on its own clock: a delayed circle on the vent (the shared
 * scattered-impact path, so a boss telegraph never erases it), resolved through
 * the boss's hit pipeline. Being ON the vent when it goes is the mistake.
 */
function tickVents(state: ScriptsBoss, monster: MonsterEntity, world: World): void {
  const rhythm = state.ventRhythm;
  if (!rhythm || !state.vents) return;
  const now = Date.now();

  // FISSURE: a new vent splits open under a player and erupts straight away.
  const fissure = rhythm.fissure;
  if (fissure && now >= fissure.nextAtMs) {
    fissure.nextAtMs = now + fissure.everyMs;
    const players = [...world.livePlayersInNode(monster.hasPosition.nodeId)];
    const victim = players.find(p => p.isPlayer.id === monster.hasAggroTarget?.targetId) ?? players[0];
    if (victim && state.vents.length < fissure.maxVents) {
      const vent = openVent(world, monster, clampToArena(monster, victim.hasPosition.current), rhythm.radius, rhythm.rampAccelMult, now);
      vent.nextEruptAtMs = now; // erupts this tick, behind its telegraph
      state.vents.push(vent);
    }
  }

  for (const vent of state.vents) {
    if (now < vent.nextEruptAtMs) continue;
    vent.nextEruptAtMs = now + rhythm.eruptEveryMs;
    publishFaultLineBurst(world, monster.hasPosition.nodeId, {
      kind: 'fault-line-telegraph',
      sourceLabel: 'Vent Eruption',
      pos: { ...vent.pos },
      radius: vent.radius,
      startedAtMs: now,
      resolvesAtMs: now + rhythm.telegraphMs,
      ownerId: monster.isMonster.id,
      points: [{ ...vent.pos }],
      damageMultiplier: rhythm.damageMult,
      scattered: true,
      fx: 'vent-eruption',
    });
  }
}

/** Keep a vent inside the arena bounds. */
function clampToArena(monster: MonsterEntity, pos: { x: number; y: number }): { x: number; y: number } {
  const nodeDef = NODE_REGISTRY.get(monster.hasPosition.nodeId);
  const width = nodeDef?.width ?? GAME_CONFIG.NODE_WIDTH;
  const height = nodeDef?.height ?? GAME_CONFIG.NODE_HEIGHT;
  return {
    x: Math.max(80, Math.min(width - 80, pos.x)),
    y: Math.max(80, Math.min(height - 80, pos.y)),
  };
}

/** Lay one magma vent: a fight-long pool whose standing Heat is a choice. */
function openVent(
  world: World,
  monster: MonsterEntity,
  pos: { x: number; y: number },
  radius: number,
  rampAccelMult: number,
  now: number,
): NonNullable<ScriptsBoss['vents']>[number] {
  const zone = publishToxicPool(world, monster.hasPosition.nodeId, {
    kind: 'toxic-pool',
    pos,
    radius,
    startedAtMs: now,
    // Lasts the fight; retired with the boss like every owned pool.
    expiresAtMs: now + 3_600_000,
    damagePerTick: 0,
    tickIntervalMs: 1000,
    flavor: 'magma-vent',
    rampAccelMult,
    ownerId: monster.isMonster.id,
    sourceId: 'magma-vent',
    sourceLabel: 'Magma Vent',
    // Standing on it is a CHOICE (Heat for damage), so never auto-avoided.
    semantics: { disposition: 'hostile-to-player', persistence: 'persistent', movementResponse: 'none' },
    killer: {
      monsterTypeId: monster.isMonster.monsterTypeId,
      monsterName: monster.isMonster.name,
      isBoss: monster.isMonster.isBoss,
      nodeId: monster.hasPosition.nodeId,
    },
  });
  return { pos: { ...pos }, radius, nextEruptAtMs: now, zoneId: zone.id };
}

/** BONE TITHE: the boss's damage reduction tracks how many risen stand for it. */
function tickBoneTithe(state: ScriptsBoss, monster: MonsterEntity, world: World): void {
  const tithe = state.boneTithe;
  if (!tithe) return;
  const risen = Math.min(tithe.maxStacks, countRaisedBy(world, monster));
  if (risen <= 0) {
    removeStatusEffect(monster.tracksCombat, BONE_TITHE_EFFECT_ID);
    return;
  }
  const effect = applyStatusEffect(monster.tracksCombat, {
    id: BONE_TITHE_EFFECT_ID,
    maxStacks: tithe.maxStacks,
    remainingMs: 600_000,
    refreshable: true,
    sourceId: monster.isMonster.id,
    data: { damageReductionPerStack: tithe.damageReductionPerRisen, totalMs: 600_000 },
  });
  effect.stacks = risen;
}

/** HARVEST: every interval it devours one of its risen for a permanent attack buff. */
function tickHarvest(state: ScriptsBoss, monster: MonsterEntity, world: World, dt: number): void {
  const harvest = state.harvest;
  if (!harvest) return;
  harvest.timerMs -= dt;
  if (harvest.timerMs > 0) return;
  harvest.timerMs = harvest.intervalMs;
  const risen = [...world.monsterEntitiesInNode(monster.hasPosition.nodeId)]
    .find(m => m.isRaised?.raiserId === monster.isMonster.id && m.hasHealth.hp > 0);
  if (!risen) return;
  // Its own cue: the soul drawn out of the risen and into the boss.
  world.pushEvent(monster.hasPosition.nodeId, {
    kind: 'boss-fx',
    monsterId: monster.isMonster.id,
    pos: { ...risen.hasPosition.current },
    fx: 'harvest',
  });
  world.removeMonsterEntity(risen.isMonster.id);
  applyAction({ type: 'stat-buff', stat: 'attack', mult: harvest.attackMult, label: 'harvest' }, monster, world, state);
}

/** The arena's boss-debuff ramps (Frostbite, Depth): a stack per interval, per player. */
function tickRoomDebuffs(state: ScriptsBoss, monster: MonsterEntity, world: World, dt: number): void {
  for (const room of state.roomDebuffs ?? []) {
    room.timerMs -= dt;
    if (room.timerMs > 0) continue;
    for (const player of world.livePlayersInNode(monster.hasPosition.nodeId)) {
      const effect = applyStatusEffect(player.tracksCombat, {
        id: room.effectId,
        maxStacks: room.maxStacks,
        remainingMs: room.durationMs,
        refreshable: true,
        sourceId: monster.isMonster.id,
        data: { [BOSS_DEBUFF_KEY]: 1, ...room.data, ...(room.durationMs > 0 ? { totalMs: room.durationMs } : {}) },
      });
      // A lasting ramp: a re-applied effect keeps its data, so refresh the payload.
      Object.assign(effect.data, room.data);
    }
    if (room.accelerate) {
      room.intervalMs = Math.max(room.accelerate.minIntervalMs, room.intervalMs * room.accelerate.intervalMult);
    }
    room.timerMs = room.intervalMs;
  }
}

// ── Active-effect lifecycle ───────────────────────────────────────────────────

function tickActiveEffects(
  state: ScriptsBoss,
  monster: MonsterEntity,
  world: World,
  dt: number,
): void {
  const toExpire: ActiveBossEffect[] = [];

  for (const effect of state.activeEffects) {
    if (effect.regenHpPctPerSec !== undefined) {
      monster.hasHealth.hp = Math.min(
        monster.hasHealth.maxHp,
        monster.hasHealth.hp + monster.hasHealth.maxHp * effect.regenHpPctPerSec * (dt / 1000),
      );
    }

    if (effect.remainingMs === -1) continue;
    effect.remainingMs -= dt;
    if (effect.remainingMs <= 0) toExpire.push(effect);
  }

  for (const effect of toExpire) {
    restoreStats(effect, monster, world, state);
    state.activeEffects = state.activeEffects.filter(fx => fx !== effect);
  }
}

/**
 * Resolve generic boss-script casts. The ownership flags ensure a cast never
 * releases a root or attack lock that a separate mechanic already owned.
 */
function tickScriptedCast(
  state: ScriptsBoss,
  monster: MonsterEntity,
  world: World,
  dt: number,
): void {
  const cast = state.scriptedCast;
  if (!cast) return;

  cast.remainingMs -= dt;
  if (cast.remainingMs > 0) return;

  state.scriptedCast = undefined;
  if (cast.ownsRoot) setRooted(world, monster, false);
  if (cast.ownsCannotAttack) detachComponent(world, monster, 'cannotAttack');

  for (const action of cast.actions) applyAction(action, monster, world, state);
  world.pushEvent(monster.hasPosition.nodeId, {
    kind: 'monster-cast-end',
    monsterId: monster.isMonster.id,
    fired: true,
    ...(cast.castFx ? { fx: cast.castFx } : {}),
  });

  const next = state.scriptedCastQueue?.shift();
  if (next) beginScriptedCast(next, monster, world, state);
}

function beginScriptedCast(
  action: { castMs: number; label: string; actions: BossAction[]; fx?: 'roar' | 'frenzy' | 'shield'; castFx?: string },
  monster: MonsterEntity,
  world: World,
  state: ScriptsBoss,
): void {
  // A capped cast should stop being a dead, repeated wind-up once every action
  // it contains is already saturated.
  if (!action.actions.some(nestedAction => canApplyAction(nestedAction, state))) return;

  if (state.scriptedCast) {
    (state.scriptedCastQueue ??= []).push(action);
    return;
  }

  // A scripted cast OUTRANKS any telegraphed attack the boss already had running.
  // The `cannotAttack` marker below makes the combat tick drop that wind-up anyway,
  // but it would do so AFTER this cast-start — and its `monster-cast-end` would
  // then wipe the bar we just opened, because the client keys cast bars by monster.
  // Retiring it here means the node sees end-then-start and the two telegraphs
  // never share the screen. (No-op when nothing is casting.)
  abortMonsterCast(world, monster);

  const ownsRoot = !hasIndependentRoot(monster);
  const ownsCannotAttack = !monster.cannotAttack;
  if (ownsRoot) setRooted(world, monster, true);
  if (ownsCannotAttack) attachComponent(world, monster, 'cannotAttack', {});
  state.scriptedCast = {
    remainingMs: action.castMs,
    label: action.label,
    actions: action.actions,
    castFx: action.castFx ?? action.fx,
    ownsRoot,
    ownsCannotAttack,
  };
  world.pushEvent(monster.hasPosition.nodeId, {
    kind: 'monster-cast-start',
    monsterId: monster.isMonster.id,
    castMs: action.castMs,
    label: action.label,
    ...(action.castFx ?? action.fx ? { fx: action.castFx ?? action.fx } : {}),
  });
  pushBossFx(world, monster, action.fx ?? 'roar', { radius: 360 });
}

/** Whether a scripted action would still change encounter state. */
function canApplyAction(action: BossAction, state: ScriptsBoss): boolean {
  if (action.type === 'stat-buff' && action.maxStacks !== undefined) {
    const effectType = action.label ?? `stat-buff-${action.stat}`;
    return state.activeEffects.filter(effect => effect.type === effectType).length < action.maxStacks;
  }
  if (action.type === 'cast') return action.actions.some(nestedAction => canApplyAction(nestedAction, state));
  return true;
}

function restoreStats(
  effect: ActiveBossEffect,
  monster: MonsterEntity,
  world: World,
  state: ScriptsBoss,
): void {
  if (effect.savedAttack          !== undefined) monster.dealsDamage.attack = effect.savedAttack;
  if (effect.savedCooldown        !== undefined) monster.performsAttack.attackCooldown = effect.savedCooldown;
  if (effect.savedPlating         !== undefined) monster.mitigatesDamage.plating = effect.savedPlating;
  if (effect.savedDamageReduction !== undefined) monster.mitigatesDamage.damageReduction = effect.savedDamageReduction;
  if (effect.savedSpeed           !== undefined) monster.hasPosition.speed = effect.savedSpeed;

  // Morph reverts — restore networked combat fields and the server-only overrides.
  if (effect.savedIsRanged !== undefined) {
    monster.isMonster.isRanged = effect.savedIsRanged;
    markSliceDirty(world, monster, 'isMonster');
  }
  if (effect.savedAttackStyle !== undefined) {
    monster.dealsDamage.attackStyle = effect.savedAttackStyle;
    markSliceDirty(world, monster, 'dealsDamage');
  }
  if (effect.savedAttackRange !== undefined) {
    monster.performsAttack.attackRange = effect.savedAttackRange;
    markSliceDirty(world, monster, 'performsAttack');
  }
  if (effect.hadDotOverride !== undefined) {
    state.dotEffectOverride = effect.hadDotOverride ? effect.savedDotEffect : undefined;
  }
  if (effect.hadKiteOverride !== undefined) {
    state.kiteOverride = effect.hadKiteOverride ? effect.savedKite : undefined;
  }
  if (effect.hadEvasionOverride !== undefined) {
    state.evasionOverride = effect.hadEvasionOverride ? effect.savedEvasionOverride : undefined;
  }
}

function checkPhaseTransitions(
  state: ScriptsBoss,
  phases: BossPhase[],
  monster: MonsterEntity,
  world: World,
): void {
  const hpPct = monster.hasHealth.hp / monster.hasHealth.maxHp;
  for (let i = 0; i < phases.length; i++) {
    if (state.phaseTriggered[i]) continue;
    if (hpPct > phases[i].hpPct) continue;

    state.phaseTriggered[i] = true;
    // ANNOUNCED PHASE: the one generic "the fight just changed" beat. The roar is
    // the moment; the label on the boss bar is the reminder of which fight this is.
    const name = phases[i].name;
    if (name) {
      state.phaseLabel = name;
      pushBossFx(world, monster, 'roar', { radius: 360 });
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'boss-phase',
        monsterId: monster.isMonster.id,
        name,
      });
    }
    for (const action of phases[i].actions) {
      applyAction(action, monster, world, state);
    }
  }
}

function tickRepeatingActions(
  state: ScriptsBoss,
  repeating: RepeatingAction[],
  monster: MonsterEntity,
  world: World,
  dt: number,
): void {
  for (let i = 0; i < repeating.length; i++) {
    state.repeatingTimers[i] -= dt;
    if (state.repeatingTimers[i] > 0) continue;

    state.repeatingTimers[i] = repeating[i].intervalMs;
    for (const action of repeating[i].actions) {
      applyAction(action, monster, world, state);
    }
  }
}

function inheritBossTarget(world: World, boss: MonsterEntity, add: MonsterEntity): void {
  // Boss summons are part of their encounter, not fresh ambient monsters. Give
  // them the boss's return anchor and leash, then let AI keep their target synced
  // for the rest of the fight (including boss retargets).
  add.controlsMonster.bossSpawnerId = boss.isMonster.id;
  add.controlsMonster.spawn = { ...boss.controlsMonster.spawn };
  add.controlsMonster.leashRange = boss.controlsMonster.leashRange;
  add.hasAwareness.leashRange = boss.hasAwareness.leashRange;

  const aggroTarget = boss.hasAggroTarget;
  if (!aggroTarget) return;

  setAggroTarget(
    world,
    add,
    { id: aggroTarget.targetId, kind: aggroTarget.targetKind },
    Date.now(),
  );
  setAttackTarget(world, add, boss.hasAttackTarget?.targetId ?? aggroTarget.targetId);
}

/**
 * Push a cosmetic node-wide boss cue so the client can animate a scripted action
 * (telegraphed slam, add-summon, barrier-up, morph). The mechanic itself is
 * already applied server-side — this only drives the FX.
 */
function pushBossFx(
  world: World,
  monster: MonsterEntity,
  fx: 'summon' | 'shield' | 'morph' | 'roar' | 'frenzy',
  extra?: { radius?: number; element?: string },
): void {
  world.pushEvent(monster.hasPosition.nodeId, {
    kind: 'boss-fx',
    monsterId: monster.isMonster.id,
    pos: { ...monster.hasPosition.current },
    fx,
    ...(extra?.radius !== undefined ? { radius: extra.radius } : {}),
    ...(extra?.element !== undefined ? { element: extra.element } : {}),
  });
}

function applyAction(
  action: BossAction,
  monster: MonsterEntity,
  world: World,
  state: ScriptsBoss,
): void {
  switch (action.type) {

    case 'enrage': {
      const effect: ActiveBossEffect = {
        type:          'enrage',
        remainingMs:   action.durationMs ?? -1,
        totalMs:       action.durationMs ?? -1,
        savedAttack:   monster.dealsDamage.attack,
        savedCooldown: monster.performsAttack.attackCooldown,
      };
      monster.dealsDamage.attack = Math.round(monster.dealsDamage.attack * action.atkMult);
      monster.performsAttack.attackCooldown = Math.max(200, Math.round(monster.performsAttack.attackCooldown * action.cdMult));
      state.activeEffects.push(effect);
      break;
    }

    case 'regen': {
      const effect: ActiveBossEffect = {
        type:               'regen',
        remainingMs:        action.durationMs ?? -1,
        totalMs:            action.durationMs ?? -1,
        regenHpPctPerSec:   action.hpPctPerSec,
      };
      state.activeEffects.push(effect);
      break;
    }

    case 'shield': {
      const effect: ActiveBossEffect = {
        type:                 'shield',
        remainingMs:          action.durationMs,
        totalMs:              action.durationMs,
        savedDamageReduction: monster.mitigatesDamage.damageReduction,
      };
      monster.mitigatesDamage.damageReduction = Math.min(0.95, monster.mitigatesDamage.damageReduction + action.drAdd);
      state.activeEffects.push(effect);
      pushBossFx(world, monster, 'shield');
      break;
    }

    case 'stat-buff': {
      const effectType = action.label ?? `stat-buff-${action.stat}`;
      if (
        action.maxStacks !== undefined &&
        state.activeEffects.filter(effect => effect.type === effectType).length >= action.maxStacks
      ) break;
      const effect: ActiveBossEffect = {
        type:        effectType,
        remainingMs: action.durationMs ?? -1,
        totalMs:     action.durationMs ?? -1,
      };
      switch (action.stat) {
        case 'attack':
          effect.savedAttack = monster.dealsDamage.attack;
          monster.dealsDamage.attack = Math.round(monster.dealsDamage.attack * action.mult);
          break;
        case 'speed':
          effect.savedSpeed = monster.hasPosition.speed;
          monster.hasPosition.speed = Math.round(monster.hasPosition.speed * action.mult);
          break;
        case 'plating':
          effect.savedPlating = monster.mitigatesDamage.plating;
          monster.mitigatesDamage.plating = Math.round(monster.mitigatesDamage.plating * action.mult);
          break;
        case 'damageReduction':
          effect.savedDamageReduction = monster.mitigatesDamage.damageReduction;
          monster.mitigatesDamage.damageReduction = Math.min(0.95, monster.mitigatesDamage.damageReduction * action.mult);
          break;
        case 'evasion': {
          // Evasion is a runtime override (no entity field). Base off the live
          // override or the static def. A timed buff saves the prior override.
          const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
          const base = state.evasionOverride ?? def?.evasion ?? 0;
          if (action.durationMs !== undefined) {
            effect.hadEvasionOverride = state.evasionOverride !== undefined;
            effect.savedEvasionOverride = state.evasionOverride;
          }
          state.evasionOverride = base * action.mult;
          break;
        }
        case 'attackSpeed':
          effect.savedCooldown = monster.performsAttack.attackCooldown;
          monster.performsAttack.attackCooldown = Math.max(
            200,
            Math.round(monster.performsAttack.attackCooldown / action.mult),
          );
          if (action.moveSpeedMult !== undefined) {
            effect.savedSpeed = monster.hasPosition.speed;
            monster.hasPosition.speed = Math.round(monster.hasPosition.speed * action.moveSpeedMult);
          }
          break;
      }
      state.activeEffects.push(effect);
      break;
    }

    case 'roar': {
      const radiusSq = action.radius === undefined ? Infinity : action.radius * action.radius;
      for (const ally of world.monsterEntitiesInNode(monster.hasPosition.nodeId)) {
        if (ally.hasHealth.hp <= 0) continue;
        if (distanceSq(ally.hasPosition.current, monster.hasPosition.current) > radiusSq) continue;
        applyStatusEffect(ally.tracksCombat, {
          id: BOSS_ROAR_HASTE_EFFECT_ID,
          maxStacks: 1,
          remainingMs: action.durationMs,
          refreshable: true,
          sourceId: monster.isMonster.id,
          data: {
            attackSpeedPct: action.attackSpeedPct,
            totalMs: action.durationMs,
          },
        });
      }
      pushBossFx(world, monster, 'roar', { radius: action.radius });
      break;
    }

    case 'summon': {
      const nodeDef     = NODE_REGISTRY.get(monster.hasPosition.nodeId);
      const nodeWidth   = nodeDef?.width  ?? GAME_CONFIG.NODE_WIDTH;
      const nodeHeight  = nodeDef?.height ?? GAME_CONFIG.NODE_HEIGHT;
      const offsetRange = action.offsetRange ?? 200;

      for (let i = 0; i < action.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist  = Math.random() * offsetRange;
        const pos = {
          x: Math.max(64, Math.min(nodeWidth  - 64, monster.hasPosition.current.x + Math.cos(angle) * dist)),
          y: Math.max(64, Math.min(nodeHeight - 64, monster.hasPosition.current.y + Math.sin(angle) * dist)),
        };
        const summon = world.createMonster(monster.hasPosition.nodeId, action.monsterTypeId, pos);
        if (summon) {
          inheritBossTarget(world, monster, summon);
          pushBossFx(world, summon, 'summon');
        }
      }
      break;
    }

    case 'morph': {
      const timed = action.durationMs !== undefined;
      const effect: ActiveBossEffect = {
        type:        'morph',
        remainingMs: action.durationMs ?? -1,
        totalMs:     action.durationMs ?? -1,
      };

      if (action.isRanged !== undefined) {
        if (timed) effect.savedIsRanged = monster.isMonster.isRanged ?? false;
        monster.isMonster.isRanged = action.isRanged;
        markSliceDirty(world, monster, 'isMonster');
      }
      if (action.attackStyle !== undefined) {
        if (timed) effect.savedAttackStyle = monster.dealsDamage.attackStyle;
        monster.dealsDamage.attackStyle = action.attackStyle;
        markSliceDirty(world, monster, 'dealsDamage');
      }
      if (action.attackRange !== undefined) {
        if (timed) effect.savedAttackRange = monster.performsAttack.attackRange;
        monster.performsAttack.attackRange = action.attackRange;
        markSliceDirty(world, monster, 'performsAttack');
      }
      if (action.dotEffect !== undefined) {
        if (timed) {
          effect.hadDotOverride = state.dotEffectOverride !== undefined;
          effect.savedDotEffect = state.dotEffectOverride;
        }
        state.dotEffectOverride = action.dotEffect ?? undefined;
      }
      if (action.kite !== undefined) {
        if (timed) {
          effect.hadKiteOverride = state.kiteOverride !== undefined;
          effect.savedKite = state.kiteOverride;
        }
        state.kiteOverride = action.kite;
      }

      // Only track the effect when it can expire — a permanent morph needs no bookkeeping.
      if (timed) state.activeEffects.push(effect);
      pushBossFx(world, monster, 'morph');
      break;
    }

    case 'apply-shield': {
      // Runtime enemyShield gained mid-fight. The barrier comes up on the next
      // incoming hit (the monsterMechanics shield path refreshes on demand).
      state.shieldOverride = {
        shieldPct:  action.shieldPct,
        intervalMs: action.intervalMs,
        durationMs: action.durationMs,
        ...(action.shatter ? { shatter: action.shatter } : {}),
      };
      pushBossFx(world, monster, 'shield');
      break;
    }

    case 'apply-soft-cap': {
      // Runtime enemySoftCap gained mid-fight — clips the player's oversized hits.
      state.softCapOverride = { capPct: action.capPct, capMult: action.capMult };
      break;
    }

    case 'shed-defense': {
      // Desperation finale: drop every defense. Clear the runtime overrides and
      // set the suppression flag so any STATIC enemyShield/enemySoftCap is also
      // ignored, then crumble plating to ~20% of its current value.
      state.defenseShed = true;
      state.shieldOverride = undefined;
      state.softCapOverride = undefined;
      monster.mitigatesDamage.plating = Math.round(monster.mitigatesDamage.plating * 0.2);
      break;
    }

    case 'modify-ramp-debuff': {
      // Raise the rampDebuff caps. Future applications read the override (see the
      // combat onHit rampDebuff path); patch live frost-ramp stacks here so the
      // tightening is felt immediately by anyone already debuffed.
      state.rampDebuffCapOverride = {
        moveSlowMaxPct: action.moveSlowMaxPct,
        atkSlowMaxPct:  action.atkSlowMaxPct,
      };
      const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
      const ramp = def?.rampDebuff;
      if (ramp) {
        const newMaxStacks = frostRampMaxStacks({
          ...ramp,
          moveSlowMaxPct: action.moveSlowMaxPct,
          atkSlowMaxPct:  action.atkSlowMaxPct,
        });
        for (const player of world.livePlayersInNode(monster.hasPosition.nodeId)) {
          const fx = getStatusEffect(player.tracksCombat, FROST_RAMP_EFFECT_ID);
          if (!fx) continue;
          fx.maxStacks = newMaxStacks;
          fx.data.moveSlowMaxPct = action.moveSlowMaxPct;
          fx.data.atkSlowMaxPct  = action.atkSlowMaxPct;
        }
      }
      break;
    }

    case 'spawn-adds': {
      // Same spawn geometry as 'summon', but track the ids so the swarm is
      // despawned when the boss dies (see grantMonsterRewards).
      // TODO(leash): adds do not yet leash to the boss — they use normal AI leash.
      const nodeDef     = NODE_REGISTRY.get(monster.hasPosition.nodeId);
      const nodeWidth   = nodeDef?.width  ?? GAME_CONFIG.NODE_WIDTH;
      const nodeHeight  = nodeDef?.height ?? GAME_CONFIG.NODE_HEIGHT;
      const offsetRange = action.offsetRange ?? 200;

      state.spawnedAddIds ??= [];
      // Prune dead adds, then (if capped) only top the swarm back up to maxAlive —
      // so a repeating summoner (necromancer) can never flood the node.
      state.spawnedAddIds = state.spawnedAddIds.filter((id) => world.hasMonster(id));
      let budget = action.count;
      if (action.maxAlive !== undefined) {
        budget = Math.min(budget, Math.max(0, action.maxAlive - state.spawnedAddIds.length));
      }
      // A `target-ring` add arrives at a distance from the boss's TARGET, so an
      // add with an engage opener (a hawk's dive) has the room to perform it.
      const ringTarget = action.at === 'target-ring' && monster.hasAggroTarget?.targetKind === 'player'
        ? world.getPlayerEntity(monster.hasAggroTarget.targetId)
        : undefined;
      for (let i = 0; i < budget; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist  = ringTarget ? (action.ringDistance ?? 380) : Math.random() * offsetRange;
        const anchor = ringTarget?.hasPosition.current ?? monster.hasPosition.current;
        const pos = {
          x: Math.max(64, Math.min(nodeWidth  - 64, anchor.x + Math.cos(angle) * dist)),
          y: Math.max(64, Math.min(nodeHeight - 64, anchor.y + Math.sin(angle) * dist)),
        };
        const add = world.createMonster(monster.hasPosition.nodeId, action.monsterTypeId, pos);
        if (add) {
          inheritBossTarget(world, monster, add);
          state.spawnedAddIds.push(add.isMonster.id);
          pushBossFx(world, add, 'summon');
        }
      }
      break;
    }

    case 'cast': {
      beginScriptedCast(action, monster, world, state);
      break;
    }

    case 'empower-adds': {
      state.spawnedAddIds = (state.spawnedAddIds ?? []).filter((id) => world.hasMonster(id));
      const maxStacks = action.maxStacks ?? 3;
      for (const id of state.spawnedAddIds) {
        const add = world.getMonsterEntity(id);
        if (!add || add.hasHealth.hp <= 0) continue;
        const rally = applyStatusEffect(add.tracksCombat, {
          id: BOSS_RALLIED_EFFECT_ID,
          maxStacks,
          // Lasts until the add dies — the herd does not calm down.
          remainingMs: 600_000,
          refreshable: true,
          sourceId: monster.isMonster.id,
          data: { monsterAttackSpeedBuff: 1, attackSpeedPct: 0, rallyDamagePct: action.damagePct, totalMs: 600_000 },
        });
        // The haste reader sums `attackSpeedPct` per EFFECT, not per stack.
        const live = rally ?? getStatusEffect(add.tracksCombat, BOSS_RALLIED_EFFECT_ID);
        if (live) live.data.attackSpeedPct = action.attackSpeedPct * live.stacks;
        pushBossFx(world, add, 'frenzy');
      }
      pushBossFx(world, monster, 'roar', { radius: 420 });
      break;
    }

    case 'spread-pools': {
      state.poolSpread = { radiusPerSec: action.radiusPerSec, maxRadiusMult: action.maxRadiusMult };
      break;
    }

    case 'bone-tithe': {
      state.boneTithe = { damageReductionPerRisen: action.damageReductionPerRisen, maxStacks: action.maxStacks };
      break;
    }

    case 'harvest': {
      state.harvest = { intervalMs: action.intervalMs, timerMs: action.intervalMs, attackMult: action.attackMult };
      pushBossFx(world, monster, 'roar', { radius: 480 });
      break;
    }

    case 'vent-field': {
      const now = Date.now();
      state.ventRhythm = {
        eruptEveryMs: action.eruptEveryMs,
        telegraphMs: action.telegraphMs,
        damageMult: action.damageMult,
        radius: action.radius,
        rampAccelMult: action.rampAccelMult,
        ...(action.fissure
          ? { fissure: { ...action.fissure, nextAtMs: now + action.fissure.everyMs } }
          : {}),
      };
      const vents = (state.vents ??= []);
      const spawn = monster.controlsMonster.spawn;
      // Two rings on a golden-angle walk, so vents added by a later phase fall in
      // the gaps between the ones already down instead of on top of them.
      for (let i = vents.length; i < action.count; i++) {
        const angle = i * 2.39996 + Math.PI / 4;
        const distance = action.ringRadius * (i % 2 === 0 ? 1 : 0.55);
        const pos = clampToArena(monster, {
          x: spawn.x + Math.cos(angle) * distance,
          y: spawn.y + Math.sin(angle) * distance,
        });
        vents.push(openVent(world, monster, pos, action.radius, action.rampAccelMult, now));
      }
      // A phase that widens the vents widens the ones already down, too.
      for (const vent of vents) {
        if (vent.radius >= action.radius) continue;
        vent.radius = action.radius;
        const zone = (world.groundZones.get(monster.hasPosition.nodeId) ?? []).find(z => z.id === vent.zoneId);
        if (zone && zone.kind === 'toxic-pool') {
          zone.radius = action.radius;
          zone.baseRadius = action.radius;
          zone.geometry = circleGeometry(zone.pos, zone.radius);
        }
      }
      // Staggered clocks so the vents erupt in turn, not all at once.
      vents.forEach((vent, i) => {
        vent.nextEruptAtMs = now + action.eruptEveryMs * ((i + 1) / vents.length);
      });
      pushBossFx(world, monster, 'roar', { radius: 480 });
      break;
    }

    case 'room-debuff': {
      const rooms = (state.roomDebuffs ??= []).filter(room => room.effectId !== action.effectId);
      rooms.push({
        effectId: action.effectId,
        intervalMs: action.intervalMs,
        timerMs: action.intervalMs,
        maxStacks: action.maxStacks,
        durationMs: action.durationMs ?? -1,
        data: { ...(action.data ?? {}) },
        ...(action.accelerate ? { accelerate: { ...action.accelerate } } : {}),
      });
      state.roomDebuffs = rooms;
      break;
    }

    case 'room-affliction': {
      state.roomAffliction = { intervalMs: action.intervalMs, timerMs: 0, dot: { ...action.dot } };
      pushBossFx(world, monster, 'roar', { radius: 480 });
      break;
    }

    case 'add-pattern': {
      const extras = (state.extraPatternIds ??= []);
      if (!extras.includes(action.patternId)) extras.push(action.patternId);
      break;
    }

    case 'remove-pattern': {
      state.extraPatternIds = (state.extraPatternIds ?? []).filter(id => id !== action.patternId);
      break;
    }

    case 'set-weather': {
      state.weather = action.weather ?? undefined;
      break;
    }

    case 'set-pattern': {
      // Read by `bossPatternFor`; a pattern already running notices the id change
      // and finishes through its own teardown, so a swap never splices two sequences.
      state.patternOverrideId = action.patternId;
      break;
    }

    case 'raise-dead': {
      // MASS RESURRECTION. Reads the same node corpse registry the ordinary
      // `raisesDead` cadence uses, so it can only ever give back what the player
      // already killed — an empty arena produces nothing.
      const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
      const base = def?.raisesDead;
      if (!base) break;
      if (action.maxAliveAdd) {
        state.raiseMaxAliveAdd = (state.raiseMaxAliveAdd ?? 0) + action.maxAliveAdd;
      }
      const spec = {
        ...base,
        corpseRange: action.corpseRange ?? base.corpseRange,
        hpMult: action.hpMult ?? base.hpMult,
        damageMult: action.damageMult ?? base.damageMult,
      };
      const raised = raiseCorpsesBurst(
        world,
        monster,
        spec,
        action.count,
        base.maxAlive + (state.raiseMaxAliveAdd ?? 0),
        Date.now(),
      );
      if (raised > 0) pushBossFx(world, monster, 'summon');
      break;
    }

    case 'stoke-ramp': {
      stokeAmbientRamp(world, monster.hasPosition.nodeId, {
        rampMsMult: action.rampMsMult,
        minStacks: action.minStacks,
        maxStacksAdd: action.maxStacksAdd,
      });
      pushBossFx(world, monster, 'roar', { radius: 360 });
      break;
    }

    case 'spawn-pool': {
      const now = Date.now();
      publishToxicPool(world, monster.hasPosition.nodeId, {
        kind: 'toxic-pool',
        pos: { ...monster.hasPosition.current },
        radius: action.radius,
        startedAtMs: now,
        expiresAtMs: now + action.durationMs,
        damagePerTick: action.damagePerTick,
        tickIntervalMs: action.tickIntervalMs,
        slowSpeedMult: action.slowSpeedMult,
        ownerId: monster.isMonster.id,
        sourceId: 'scripted-pool',
        sourceLabel: 'Scripted Pool',
        killer: {
          monsterTypeId: monster.isMonster.monsterTypeId,
          monsterName: monster.isMonster.name,
          isBoss: monster.isMonster.isBoss,
          nodeId: monster.hasPosition.nodeId,
        },
      });
      break;
    }

    case 'empower-charged': {
      // Multipliers COMPOSE so a lineage can deepen one idea across several phases
      // instead of acquiring unrelated ones.
      const current = state.chargedOverride ?? {
        multiplierMult: 1,
        cooldownMult: 1,
        radiusMult: 1,
        castMsMult: 1,
        aftershockRayCountAdd: 0,
        aftershockDamageMult: 1,
      };
      state.chargedOverride = {
        multiplierMult: current.multiplierMult * (action.multiplierMult ?? 1),
        cooldownMult:   current.cooldownMult   * (action.cooldownMult   ?? 1),
        radiusMult:     current.radiusMult     * (action.radiusMult     ?? 1),
        castMsMult:     current.castMsMult     * (action.castMsMult     ?? 1),
        aftershockRayCountAdd:
          current.aftershockRayCountAdd + (action.aftershockRayCountAdd ?? 0),
        aftershockDamageMult:
          current.aftershockDamageMult * (action.aftershockDamageMult ?? 1),
      };
      break;
    }

    case 'empower-shred': {
      const current = state.shredOverride ?? {
        platingPerStackAdd: 0,
        maxStacksAdd: 0,
        extraThresholds: [],
      };
      state.shredOverride = {
        platingPerStackAdd:
          current.platingPerStackAdd + (action.platingPerStackAdd ?? 0),
        maxStacksAdd: current.maxStacksAdd + (action.maxStacksAdd ?? 0),
        extraThresholds: [
          ...current.extraThresholds,
          ...(action.extraThresholds ?? []),
        ],
      };
      break;
    }
  }
}
