import type { PassiveKey } from '@mmo-idle/shared';
import { defineBuff, type BuffDescriptor } from '../../registry/buffs';
import { registerCombatListener } from '../../combatPipeline';
import { isEmpoweredAttack, consumeEmpoweredAttack } from '../../empoweredAttacks';
import type { TracksCombat } from '@mmo-idle/shared';
import {
  applyStatusEffect, removeStatusEffect, getStatusEffect,
} from '@mmo-idle/shared';
import { grantMonsterRewards } from '../../rewards';
import { EXECUTION_COOLDOWN_MS } from './cooldownPrototype';
import type { UsesCooldown } from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import type { PlayerEntity } from '../../../ecs/components/player';
import type { MonsterEntity } from '../../../ecs/components/monster';
import { attachComponent, attachMarker, detachComponent, detachMarkerIfNoEffect } from '../../../ecs/markerHelpers';
import { setAttackTarget } from '../../targeting';

// ── Fallback constants ─────────────────────────────────────────────────────────
//
// All values here are pending balance tuning. They serve as defaults when the
// player has no passiveKey override unlocked.

// Overdrive (cooldown-light-T3-a)
const OVERDRIVE_BUFF_MS      = 2_500; // ~50% uptime with 5 000 ms light CD
const OVERDRIVE_SPEED_FACTOR = 2 / 3; // attackCooldown × 2/3 → 1.5× attacks/s

// Eternal Cycle (cooldown-light-T3-b)
const ETERNAL_COEFF              = 0.65;   // empowered dmg = attack × stacks × coeff
const ETERNAL_CHARGE_DURATION_MS = 10_000; // stacks fall off after 10 s without hits
const ETERNAL_FLAT_PER_STACK     = 1.5;   // flat bonus per stack on each normal hit

// Temporal Extension (cooldown-light-T3-c)
const TEMPORAL_INIT_MS   = 3_000; // initial buff duration on empowered trigger
const TEMPORAL_MAX_MS    = 4_500; // max buff duration (extension cap)
const TEMPORAL_FLAT_DMG  = 6;     // flat on-hit bonus per attack while buff active
const TEMPORAL_EXTEND_MS = 1_000; // buff duration added per normal attack

// Battery (cooldown-balanced-T3-b)
const BATTERY_ATK_PER_STACK = 2; // flat attack damage added per stack

// Alignment (cooldown-balanced-T3-c)
const ALIGNMENT_BUFF_MS      = 2_000;
const ALIGNMENT_SPEED_FACTOR = 2 / 3; // same 1.5× speed factor as Overdrive

// Entropy Collapse (cooldown-heavy-T3-a)
const ENTROPY_BASE_DMG    = 5;    // base damage per tick at full HP
const ENTROPY_DURATION_MS = 8_000;
const ENTROPY_TICK_MS     = 1_000;

// Singular Extraction (cooldown-heavy-T3-b)
const SINGULAR_NO_TARGET_MS = 4_000; // ms without a target before CD resets

// Channeled Beam (cooldown-heavy-T3-c)
const BEAM_DURATION_MS       = 3_000;
const BEAM_TICK_MS           = 500;
const BEAM_DMG_PER_TICK_MULT = 1.0; // damage per tick = player.attack × this

// ── Status effect IDs (these still live on TracksCombat as stack containers) ──

// Eternal Cycle: per-player charge stacks
const EC_CHARGE_FX = 'eternal-cycle-charge';

// Temporal Extension: per-player buff with duration / flat damage
const TE_BUFF_FX = 'temporal-extension-buff';

// Battery: per-player charge stacks
const BAT_CHARGE_FX = 'battery-charge';

// Entropy Collapse: per-monster DoT
const ENT_DOT_FX = 'entropy-collapse-dot';

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasPassive(player: PlayerEntity, key: PassiveKey): boolean {
  return (player.usesSkills.passives[key] ?? 0) > 0;
}

function endChannel(world: World, player: PlayerEntity): void {
  detachComponent(world, player, 'isChanneling');
  setAttackTarget(world, player, null);
}

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * Register all tier-4 cooldown combat pipeline listeners.
 * Called once from initCooldownArchetype() at server startup.
 *
 * Registration order:
 *   1. beforeAttack — suppress standard empowered mult for mechanics that replace it
 *   2. onHit (a)    — empowered-hit mechanics (fires after base empoweredMultiplier)
 *   3. onHit (b)    — normal-hit mechanics
 *   4. onHit (c)    — battery empowered bonus + Alignment buff (empowered only)
 */
export function initCooldownT3(): void {

  // ── 1. beforeAttack: suppress the standard empowered multiplier ────────────
  // Sets ctx.metadata['suppressEmpoweredMult'] so empoweredAttacks.ts skips the
  // multiplication but still consumes the flag and sets 'empoweredAttack' = true.
  registerCombatListener('beforeAttack', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;

    const entity = ctx.attacker;
    if (!entity?.usesCooldown) return;

    if (!isEmpoweredAttack(entity)) return;

    const player = entity;
    if (
      hasPassive(player, 'cooldown.overdrive')          ||
      hasPassive(player, 'cooldown.eternal-cycle')      ||
      hasPassive(player, 'cooldown.temporal-extension') ||
      hasPassive(player, 'cooldown.entropy-collapse')   ||
      hasPassive(player, 'cooldown.channeled-beam')
    ) {
      ctx.metadata['suppressEmpoweredMult'] = true;
    }
  });

  // ── 2. onHit (empowered hits): each mechanic with a unique empowered effect ─
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (!ctx.metadata['empoweredAttack']) return;

    const entity = ctx.attacker;
    if (!entity?.usesCooldown) return;

    const player = entity;
    const passives = player.usesSkills.passives;
    const state  = entity.tracksCombat;
    const cd     = entity.usesCooldown;

    // Overdrive: grant attack speed buff; empowered deals normal unmultiplied damage.
    if (hasPassive(player, 'cooldown.overdrive')) {
      const active = player.hasOverdrive;
      if (!active) {
        const baseCd = player.performsAttack.attackCooldown;
        player.performsAttack.attackCooldown = Math.max(200, Math.round(player.performsAttack.attackCooldown * OVERDRIVE_SPEED_FACTOR));
        attachComponent(world, player, 'hasOverdrive', { remainingMs: OVERDRIVE_BUFF_MS, baseCd });
      } else {
        active.remainingMs = OVERDRIVE_BUFF_MS;
      }
      console.log(`[Overdrive] ${player.isPlayer.id}: speed buff started (${OVERDRIVE_BUFF_MS}ms)`);
      return;
    }

    // Eternal Cycle: damage = attack × stacks × coeff; resets charge.
    if (hasPassive(player, 'cooldown.eternal-cycle')) {
      const chargeEffect = getStatusEffect(state, EC_CHARGE_FX);
      const stacks = chargeEffect ? chargeEffect.stacks : 0;
      ctx.damage = Math.max(1, Math.round(player.dealsDamage.attack * Math.max(1, stacks) * ETERNAL_COEFF));
      if (stacks > 0) removeStatusEffect(state, EC_CHARGE_FX);
      console.log(`[EternalCycle] ${player.isPlayer.id}: ${stacks} stacks -> ${ctx.damage} dmg`);
      return;
    }

    // Temporal Extension: grant on-hit flat damage buff; empowered deals normal damage.
    if (hasPassive(player, 'cooldown.temporal-extension')) {
      const initMs  = passives['cooldown.temporal-buff-init-ms'] ?? TEMPORAL_INIT_MS;
      const maxMs   = passives['cooldown.temporal-buff-max-ms']  ?? TEMPORAL_MAX_MS;
      const flatDmg = passives['cooldown.temporal-flat-dmg']     ?? TEMPORAL_FLAT_DMG;
      removeStatusEffect(state, TE_BUFF_FX);
      applyStatusEffect(state, {
        id:          TE_BUFF_FX,
        instanced:   false,
        remainingMs: initMs,
        refreshable: false,
        sourceId:    player.isPlayer.id,
        data:        { flatDamagePerHit: flatDmg, maxDurationMs: maxMs },
      });
      console.log(`[TempExt] ${player.isPlayer.id}: buff granted (${initMs}ms, +${flatDmg}/hit)`);
      return;
    }

    // Entropy Collapse: apply scaling DoT; empowered deals 0 direct damage.
    if (hasPassive(player, 'cooldown.entropy-collapse') && ctx.defenderType === 'monster') {
      const monsterState = ctx.defender.tracksCombat;
      const baseDmg = passives['cooldown.entropy-base-damage'] ?? ENTROPY_BASE_DMG;
      removeStatusEffect(monsterState, ENT_DOT_FX);
      applyStatusEffect(monsterState, {
        id:          ENT_DOT_FX,
        instanced:   false,
        remainingMs: ENTROPY_DURATION_MS,
        refreshable: false,
        sourceId:    player.isPlayer.id,
        data:        { baseDamagePerTick: baseDmg, nextTickIn: ENTROPY_TICK_MS, tickIntervalMs: ENTROPY_TICK_MS },
      });
      attachMarker(world, ctx.defender, 'hasEntropy');
      console.log(`[EntropyColl] ${player.isPlayer.id}: DoT applied on ${ctx.defender.isMonster.id} (${baseDmg} base/tick)`);
      ctx.damage = 0;
      return;
    }

    // Channeled Beam: begin channel; no direct damage, beam ticks handle damage.
    if (hasPassive(player, 'cooldown.channeled-beam') && ctx.defenderType === 'monster') {
      attachComponent(world, player, 'isChanneling', {
        remainingMs: BEAM_DURATION_MS,
        nextTickMs: BEAM_TICK_MS,
        targetId: ctx.defender.isMonster.id,
        pct: 0,
      });
      setAttackTarget(world, player, ctx.defender.isMonster.id);
      ctx.damage = 0;
      console.log(`[BeamChannel] ${player.isPlayer.id}: channel started on ${ctx.defender.isMonster.id}`);
      return;
    }
  });

  // ── 3. onHit (normal hits): each mechanic that reacts to non-empowered hits ─
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.metadata['empoweredAttack']) return;

    const entity = ctx.attacker;
    if (!entity?.usesCooldown) return;

    const player = entity;
    const passives = player.usesSkills.passives;
    const state  = entity.tracksCombat;
    const cd     = entity.usesCooldown;

    // Eternal Cycle: add flat bonus from existing stacks, then grant a new stack.
    if (hasPassive(player, 'cooldown.eternal-cycle')) {
      const existing = getStatusEffect(state, EC_CHARGE_FX);
      if (existing && existing.stacks > 0) {
        ctx.damage += Math.round(existing.stacks * ETERNAL_FLAT_PER_STACK);
      }
      applyStatusEffect(state, {
        id:          EC_CHARGE_FX,
        instanced:   false,
        remainingMs: ETERNAL_CHARGE_DURATION_MS,
        refreshable: true,
        sourceId:    player.isPlayer.id,
        data:        {},
      });
    }

    // Temporal Extension: add flat damage if buff active, extend duration by 1 s.
    if (hasPassive(player, 'cooldown.temporal-extension')) {
      const buff = getStatusEffect(state, TE_BUFF_FX);
      if (buff && buff.remainingMs > 0) {
        ctx.damage += Math.round(buff.data['flatDamagePerHit'] ?? TEMPORAL_FLAT_DMG);
        const maxMs = buff.data['maxDurationMs'] ?? TEMPORAL_MAX_MS;
        buff.remainingMs = Math.min(buff.remainingMs + TEMPORAL_EXTEND_MS, maxMs);
      }
    }

    // Acceleration: each hit reduces the remaining execution CD by a fixed amount.
    const accelMs = passives['cooldown.acceleration-ms'] ?? 0;
    if (accelMs > 0 && cd.executionCooldownMs > 0) {
      cd.executionCooldownMs = Math.max(0, cd.executionCooldownMs - accelMs);
    }

    // Battery: add flat bonus from accumulated stacks to this hit.
    if (hasPassive(player, 'cooldown.battery')) {
      const charge = getStatusEffect(state, BAT_CHARGE_FX);
      if (charge && charge.stacks > 0) {
        ctx.damage += Math.round(charge.stacks * BATTERY_ATK_PER_STACK);
      }
    }

    // Singular Extraction: normal attacks deal 0 damage.
    if (hasPassive(player, 'cooldown.singular-extraction')) {
      ctx.damage = 0;
    }
  });

  // ── 4. onHit (empowered): Battery stack bonus applied before reset; Alignment buff ─
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    if (!ctx.metadata['empoweredAttack']) return;

    const entity = ctx.attacker;
    if (!entity?.usesCooldown) return;

    const player = entity;
    const state  = entity.tracksCombat;
    const cd     = entity.usesCooldown;

    // Battery: bonus on empowered too, then reset stacks and timer.
    if (hasPassive(player, 'cooldown.battery')) {
      const charge = getStatusEffect(state, BAT_CHARGE_FX);
      if (charge && charge.stacks > 0) {
        ctx.damage += Math.round(charge.stacks * BATTERY_ATK_PER_STACK);
        console.log(`[Battery] ${player.isPlayer.id}: ${charge.stacks} stacks -> +${charge.stacks * BATTERY_ATK_PER_STACK} bonus on empowered`);
      }
      removeStatusEffect(state, BAT_CHARGE_FX);
      cd.batteryTimerAcc = 0;
    }

    // Alignment: grant attack speed buff after the execution fires.
    if (hasPassive(player, 'cooldown.alignment')) {
      if (!player.hasAlignment) {
        const baseCd = player.performsAttack.attackCooldown;
        player.performsAttack.attackCooldown = Math.max(200, Math.round(player.performsAttack.attackCooldown * ALIGNMENT_SPEED_FACTOR));
        attachComponent(_world, player, 'hasAlignment', { remainingMs: ALIGNMENT_BUFF_MS, baseCd });
      } else {
        player.hasAlignment.remainingMs = ALIGNMENT_BUFF_MS;
      }
      console.log(`[Alignment] ${player.isPlayer.id}: speed buff started (${ALIGNMENT_BUFF_MS}ms)`);
    }
  });
}

// ── Per-tick update ───────────────────────────────────────────────────────────

/**
 * Run once per world tick, after updateCombatState (so cooldowns are already
 * decremented) to handle time-driven T3 cooldown mechanics.
 */
export function updateCooldownT3(world: World, dt: number): void {
  updateOverdrive(world, dt);
  updateAlignment(world, dt);
  updateBattery(world, dt);
  updateSingularExtraction(world, dt);
  updateEntropyCollapse(world, dt);
  updateChanneledBeam(world, dt);
}

// ── Overdrive update ──────────────────────────────────────────────────────────

function updateOverdrive(world: World, dt: number): void {
  for (const entity of world.overdrivenPlayers) {
    const od = entity.hasOverdrive;
    if (!hasPassive(entity, 'cooldown.overdrive')) continue;

    od.remainingMs = Math.max(0, od.remainingMs - dt);
    if (od.remainingMs <= 0) {
      entity.performsAttack.attackCooldown = od.baseCd || entity.performsAttack.attackCooldown;
      detachComponent(world, entity, 'hasOverdrive');
      console.log(`[Overdrive] ${entity.isPlayer.id}: buff expired - speed restored`);
    }
  }
}

// ── Alignment update ──────────────────────────────────────────────────────────

function updateAlignment(world: World, dt: number): void {
  for (const entity of world.alignedPlayers) {
    const cd     = entity.usesCooldown;
    const alignment = entity.hasAlignment;
    if (!hasPassive(entity, 'cooldown.alignment')) continue;

    alignment.remainingMs = Math.max(0, alignment.remainingMs - dt);
    if (alignment.remainingMs <= 0) {
      entity.performsAttack.attackCooldown = alignment.baseCd || entity.performsAttack.attackCooldown;
      detachComponent(world, entity, 'hasAlignment');

      if (cd.executionCooldownMs > 0) {
        const halved = Math.round(cd.executionCooldownMs * 0.5);
        console.log(`[Alignment] ${entity.isPlayer.id}: buff expired - CD halved (${cd.executionCooldownMs} -> ${halved}ms)`);
        cd.executionCooldownMs = halved;
      }
    }
  }
}

// ── Battery update ────────────────────────────────────────────────────────────

function updateBattery(world: World, dt: number): void {
  for (const entity of world.cooldownPlayers) {
    const state  = entity.tracksCombat;
    const cd     = entity.usesCooldown;
    if (!hasPassive(entity, 'cooldown.battery')) continue;

    // Only accumulate while the execution CD is actively ticking
    if (cd.executionCooldownMs <= 0) continue;

    const acc       = cd.batteryTimerAcc + dt;
    const newStacks = Math.floor(acc / 1000);
    cd.batteryTimerAcc = acc - newStacks * 1000;

    for (let i = 0; i < newStacks; i++) {
      applyStatusEffect(state, {
        id:          BAT_CHARGE_FX,
        instanced:   false,
        remainingMs: -1, // permanent until empowered fires
        refreshable: false,
        sourceId:    entity.isPlayer.id,
        data:        {},
      });
    }

    if (newStacks > 0) {
      const total = getStatusEffect(state, BAT_CHARGE_FX)?.stacks ?? 0;
      console.log(`[Battery] ${entity.isPlayer.id}: +${newStacks} stack(s) -> ${total} total`);
    }
  }
}

// ── Singular Extraction update ────────────────────────────────────────────────

function updateSingularExtraction(world: World, dt: number): void {
  for (const entity of world.cooldownPlayers) {
    const cd     = entity.usesCooldown;
    if (!hasPassive(entity, 'cooldown.singular-extraction')) continue;

    if (entity.hasAttackTarget) {
      cd.singularNoTargetMs = 0;
    } else {
      cd.singularNoTargetMs += dt;

      if (cd.singularNoTargetMs >= SINGULAR_NO_TARGET_MS) {
        const cdMs = entity.usesSkills.passives['cooldown.empowered-cd-ms'] ?? EXECUTION_COOLDOWN_MS;
        cd.executionCooldownMs = cdMs;
        consumeEmpoweredAttack(world, entity); // disarm if already armed
        cd.singularNoTargetMs = 0;
        console.log(`[SingExtract] ${entity.isPlayer.id}: out of combat - cycle reset (${cdMs}ms)`);
      }
    }
  }
}

// ── Entropy Collapse update ───────────────────────────────────────────────────

function updateEntropyCollapse(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const entity of world.entropyMonsters) {
    const monsterId = entity.isMonster.id;
    const state     = entity.tracksCombat;
    const effect = getStatusEffect(state, ENT_DOT_FX);
    if (!effect) {
      detachMarkerIfNoEffect(world, entity, 'hasEntropy', state, ENT_DOT_FX);
      continue;
    }

    effect.data['nextTickIn'] -= dt;
    if (effect.data['nextTickIn'] > 0) continue;

    effect.data['nextTickIn'] = effect.data['tickIntervalMs'];

    // Scaling: 1× at full HP → 4× at 90% missing HP.
    // Formula: mult = 1 + (min(missing, 0.9) / 0.9)^3 × 3
    const missingFraction = Math.max(0, 1 - entity.hasHealth.hp / entity.hasHealth.maxHp);
    const scaled          = Math.min(missingFraction, 0.9) / 0.9;
    const mult            = 1 + Math.pow(scaled, 3) * 3;
    const damage          = Math.max(1, Math.round(effect.data['baseDamagePerTick'] * mult));

    entity.hasHealth.hp -= damage;
    console.log(
      `[EntropyColl] ${monsterId}: ${damage} tick (${(missingFraction * 100).toFixed(0)}% missing, ${mult.toFixed(2)}x), hp=${Math.max(0, entity.hasHealth.hp)}`,
    );

    if (entity.hasHealth.hp <= 0) {
      toKill.push({ monsterId, sourceId: effect.sourceId });
    }
  }

  for (const entity of world.entropyMonsters) {
    detachMarkerIfNoEffect(world, entity, 'hasEntropy', entity.tracksCombat, ENT_DOT_FX);
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.removeMonsterEntity(monsterId);
  }
}

// ── Channeled Beam update ─────────────────────────────────────────────────────

function updateChanneledBeam(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const entity of world.channelingPlayers) {
    const player = entity;
    const channel = entity.isChanneling;

    const remaining = channel.remainingMs - dt;
    if (remaining <= 0) {
      endChannel(world, player);
      console.log(`[BeamChannel] ${player.isPlayer.id}: channel complete`);
      continue;
    }

    channel.remainingMs = remaining;
    channel.pct = Math.round((1 - remaining / BEAM_DURATION_MS) * 100);

    // Validate target — it may have been killed by another player
    if (!channel.targetId) { endChannel(world, player); continue; }

    let monster = world.getMonsterEntity(channel.targetId);
    if (!monster || monster.hasPosition.nodeId !== player.hasPosition.nodeId) {
      const newTarget = findBeamTarget(world, player);
      if (newTarget) {
        channel.targetId = newTarget.isMonster.id;
        setAttackTarget(world, player, newTarget.isMonster.id);
        monster = newTarget;
        console.log(`[BeamChannel] ${player.isPlayer.id}: target lost - reacquired ${newTarget.isMonster.id}`);
      } else {
        endChannel(world, player);
        console.log(`[BeamChannel] ${player.isPlayer.id}: target gone, no reacquisition - channel ended`);
        continue;
      }
    }

    // Beam damage tick
    const nextTick = channel.nextTickMs - dt;
    if (nextTick <= 0) {
      channel.nextTickMs = nextTick + BEAM_TICK_MS;

      const dmgPerTick = Math.max(1, Math.round(player.dealsDamage.attack * BEAM_DMG_PER_TICK_MULT));
      monster.hasHealth.hp -= dmgPerTick;
      console.log(
        `[BeamChannel] ${player.isPlayer.id}: ${dmgPerTick} tick dmg on ${monster.isMonster.id}, hp=${Math.max(0, monster.hasHealth.hp)}`,
      );

      if (monster.hasHealth.hp <= 0) {
        toKill.push({ monsterId: monster.isMonster.id, sourceId: player.isPlayer.id });
        const newTarget = findBeamTarget(world, player, monster.isMonster.id);
        if (newTarget) {
          channel.targetId = newTarget.isMonster.id;
          setAttackTarget(world, player, newTarget.isMonster.id);
          console.log(`[BeamChannel] ${player.isPlayer.id}: kill-reacquire -> ${newTarget.isMonster.id}`);
        } else {
          endChannel(world, player);
          console.log(`[BeamChannel] ${player.isPlayer.id}: target killed, no reacquisition - channel ended`);
        }
      }
    } else {
      channel.nextTickMs = nextTick;
    }
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.removeMonsterEntity(monsterId);
  }
}

/** Nearest monster within attack range on the player's node, excluding one ID. */
function findBeamTarget(world: World, player: PlayerEntity, excludeId?: string): MonsterEntity | undefined {
  let best: MonsterEntity | undefined;
  let bestDist = Infinity;

  for (const entity of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (excludeId && entity.isMonster.id === excludeId) continue;
    const dx   = entity.hasPosition.current.x - player.hasPosition.current.x;
    const dy   = entity.hasPosition.current.y - player.hasPosition.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= player.performsAttack.attackRange && dist < bestDist) {
      bestDist = dist;
      best     = entity;
    }
  }
  return best;
}

// ── buffSync helpers ──────────────────────────────────────────────────────────

export function getOverdrivePct(player: PlayerEntity): number {
  if (!player.hasOverdrive) return 0;
  return Math.round((player.hasOverdrive.remainingMs / OVERDRIVE_BUFF_MS) * 100);
}

export function getEternalChargeStacks(state: TracksCombat): number {
  return getStatusEffect(state, EC_CHARGE_FX)?.stacks ?? 0;
}

export function getTemporalExtPct(state: TracksCombat): number {
  const buff = getStatusEffect(state, TE_BUFF_FX);
  if (!buff || buff.remainingMs <= 0) return 0;
  const maxMs = buff.data['maxDurationMs'] ?? TEMPORAL_MAX_MS;
  return Math.round((buff.remainingMs / maxMs) * 100);
}

export function getBatteryStacks(state: TracksCombat): number {
  return getStatusEffect(state, BAT_CHARGE_FX)?.stacks ?? 0;
}

export function getAlignmentPct(player: PlayerEntity): number {
  if (!player.hasAlignment) return 0;
  return Math.round((player.hasAlignment.remainingMs / ALIGNMENT_BUFF_MS) * 100);
}

// ── Buff descriptors ──────────────────────────────────────────────────────────

function getChannelingRemainingPct(player: PlayerEntity): number {
  return Math.max(0, Math.min(100, 100 - (player.isChanneling?.pct ?? 0)));
}

export const COOLDOWN_T3_BUFFS = [
  defineBuff('cooldown-overdrive', ({ player }) => {
    const pct = getOverdrivePct(player);
    return pct > 0 ? { id: 'cooldown-overdrive', label: 'Ovrdv', stacks: 1, durationPct: pct, color: '#ff6622' } : null;
  }),
  defineBuff('cooldown-eternal-charge', ({ playerCs }) => {
    if (!playerCs) return null;
    const stacks = getEternalChargeStacks(playerCs);
    return stacks > 0 ? { id: 'cooldown-eternal-charge', label: 'Chrge', stacks, durationPct: -1, color: '#ffaa00' } : null;
  }),
  defineBuff('cooldown-temporal-ext', ({ playerCs }) => {
    if (!playerCs) return null;
    const pct = getTemporalExtPct(playerCs);
    return pct > 0 ? { id: 'cooldown-temporal-ext', label: 'Xtend', stacks: 1, durationPct: pct, color: '#44ddff' } : null;
  }),
  defineBuff('cooldown-battery', ({ playerCs }) => {
    if (!playerCs) return null;
    const stacks = getBatteryStacks(playerCs);
    return stacks > 0 ? { id: 'cooldown-battery', label: 'Batry', stacks, durationPct: -1, color: '#aaffaa' } : null;
  }),
  defineBuff('cooldown-alignment', ({ player }) => {
    const pct = getAlignmentPct(player);
    return pct > 0 ? { id: 'cooldown-alignment', label: 'Algn', stacks: 1, durationPct: pct, color: '#cc44ff' } : null;
  }),
  defineBuff('cooldown-channel', ({ player }) => {
    if (!player.isChanneling) return null;
    return { id: 'cooldown-channel', label: 'Beam', stacks: 1, durationPct: getChannelingRemainingPct(player), color: '#ff44aa' };
  }),
] as const satisfies readonly BuffDescriptor[];
