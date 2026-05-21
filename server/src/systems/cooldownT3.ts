import type { PlayerState, MonsterState } from '@mmo-idle/shared';
import { registerCombatListener } from './combatPipeline';
import { isEmpoweredAttack, consumeEmpoweredAttack } from './empoweredAttacks';
import type { CombatState } from './combatState';
import {
  isCooldownActive, setCooldown, getCooldown,
  getResource, setResource,
  getFlag, setFlag,
  getString, setString,
} from './combatState';
import {
  applyStatusEffect, removeStatusEffect, getStatusEffect,
} from './statusEffects';
import { grantMonsterRewards } from './rewards';
import { getNodeMonsters } from '../world/nodeQueries';
import { EXEC_COOLDOWN_KEY, EXECUTION_COOLDOWN_MS } from './cooldownPrototype';
import type { World } from '../world/World';

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

// ── CombatState keys ──────────────────────────────────────────────────────────

// Overdrive
const OD_REMAINING = 'overdrive-remaining'; // cooldown, auto-ticked by updateCombatState
const OD_BASE_CD   = 'overdrive-base-cd';   // resource: stored attackCooldown pre-buff
const OD_ACTIVE    = 'overdrive-active';    // flag: buff is currently applied

// Eternal Cycle
const EC_CHARGE_FX = 'eternal-cycle-charge'; // statusEffect on player CombatState

// Temporal Extension
const TE_BUFF_FX = 'temporal-extension-buff'; // statusEffect on player CombatState

// Battery
const BAT_CHARGE_FX = 'battery-charge';   // statusEffect on player CombatState
const BAT_TIMER_KEY = 'battery-tick-acc'; // resource: accumulated ms toward next stack

// Alignment
const AL_REMAINING = 'alignment-remaining'; // cooldown, auto-ticked
const AL_BASE_CD   = 'alignment-base-cd';   // resource: stored attackCooldown pre-buff
const AL_ACTIVE    = 'alignment-active';    // flag: buff is currently applied

// Entropy Collapse
const ENT_DOT_FX = 'entropy-collapse-dot'; // statusEffect on monster CombatState

// Singular Extraction
const SING_NO_TARGET_KEY = 'singular-no-target-acc'; // resource: accumulated no-target ms

// Channeled Beam
const BEAM_REMAINING_KEY = 'beam-remaining'; // resource: ms left in channel
const BEAM_NEXT_TICK_KEY = 'beam-next-tick'; // resource: countdown to next dmg tick
const BEAM_TARGET_KEY    = 'beam-target';    // string: monster id being channeled

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasPassive(player: PlayerState, key: string): boolean {
  return (player.passives[key] ?? 0) > 0;
}

function endChannel(player: PlayerState, state: CombatState): void {
  player.isChanneling  = false;
  player.channelingPct = 0;
  setResource(state, BEAM_REMAINING_KEY, 0);
  setResource(state, BEAM_NEXT_TICK_KEY, 0);
  setString(state, BEAM_TARGET_KEY, '');
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
  registerCombatListener('beforeAttack', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'cooldown') return;

    const state = world.playerCombatState.get(ctx.attacker.id);
    if (!state || !isEmpoweredAttack(state)) return;

    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (!player) return;

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
    if (ctx.attacker.combatArchetype !== 'cooldown') return;
    if (!ctx.metadata['empoweredAttack']) return;

    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (!player) return;
    const state = world.playerCombatState.get(ctx.attacker.id);
    if (!state) return;

    // Overdrive: grant attack speed buff; empowered deals normal unmultiplied damage.
    if (hasPassive(player, 'cooldown.overdrive')) {
      if (!getFlag(state, OD_ACTIVE)) {
        setResource(state, OD_BASE_CD, player.attackCooldown);
        player.attackCooldown = Math.max(200, Math.round(player.attackCooldown * OVERDRIVE_SPEED_FACTOR));
      }
      setCooldown(state, OD_REMAINING, OVERDRIVE_BUFF_MS);
      setFlag(state, OD_ACTIVE, true);
      console.log(`[Overdrive] ${player.id}: speed buff started (${OVERDRIVE_BUFF_MS}ms)`);
      return;
    }

    // Eternal Cycle: damage = attack × stacks × coeff; resets charge.
    if (hasPassive(player, 'cooldown.eternal-cycle')) {
      const chargeEffect = getStatusEffect(state, EC_CHARGE_FX);
      const stacks = chargeEffect ? chargeEffect.stacks : 0;
      ctx.damage = Math.max(1, Math.round(player.attack * Math.max(1, stacks) * ETERNAL_COEFF));
      if (stacks > 0) removeStatusEffect(state, EC_CHARGE_FX);
      console.log(`[EternalCycle] ${player.id}: ${stacks} stacks → ${ctx.damage} dmg`);
      return;
    }

    // Temporal Extension: grant on-hit flat damage buff; empowered deals normal damage.
    if (hasPassive(player, 'cooldown.temporal-extension')) {
      const initMs  = player.passives['cooldown.temporal-buff-init-ms'] ?? TEMPORAL_INIT_MS;
      const maxMs   = player.passives['cooldown.temporal-buff-max-ms']  ?? TEMPORAL_MAX_MS;
      const flatDmg = player.passives['cooldown.temporal-flat-dmg']     ?? TEMPORAL_FLAT_DMG;
      removeStatusEffect(state, TE_BUFF_FX);
      applyStatusEffect(state, {
        id:          TE_BUFF_FX,
        instanced:   false,
        remainingMs: initMs,
        refreshable: false,
        sourceId:    player.id,
        data:        { flatDamagePerHit: flatDmg, maxDurationMs: maxMs },
      });
      console.log(`[TempExt] ${player.id}: buff granted (${initMs}ms, +${flatDmg}/hit)`);
      return;
    }

    // Entropy Collapse: apply scaling DoT; empowered deals 0 direct damage.
    if (hasPassive(player, 'cooldown.entropy-collapse') && ctx.defenderType === 'monster') {
      const monsterState = world.monsterCombatState.get(ctx.defender.id);
      if (monsterState) {
        const baseDmg = player.passives['cooldown.entropy-base-damage'] ?? ENTROPY_BASE_DMG;
        removeStatusEffect(monsterState, ENT_DOT_FX);
        applyStatusEffect(monsterState, {
          id:          ENT_DOT_FX,
          instanced:   false,
          remainingMs: ENTROPY_DURATION_MS,
          refreshable: false,
          sourceId:    player.id,
          data:        { baseDamagePerTick: baseDmg, nextTickIn: ENTROPY_TICK_MS, tickIntervalMs: ENTROPY_TICK_MS },
        });
        console.log(`[EntropyColl] ${player.id}: DoT applied on ${ctx.defender.id} (${baseDmg} base/tick)`);
      }
      ctx.damage = 0;
      return;
    }

    // Channeled Beam: begin channel; no direct damage, beam ticks handle damage.
    if (hasPassive(player, 'cooldown.channeled-beam') && ctx.defenderType === 'monster') {
      player.isChanneling   = true;
      player.channelingPct  = 0;
      setResource(state, BEAM_REMAINING_KEY, BEAM_DURATION_MS);
      setResource(state, BEAM_NEXT_TICK_KEY, BEAM_TICK_MS);
      setString(state, BEAM_TARGET_KEY, ctx.defender.id);
      player.attackTargetId = ctx.defender.id;
      ctx.damage = 0;
      console.log(`[BeamChannel] ${player.id}: channel started on ${ctx.defender.id}`);
      return;
    }
  });

  // ── 3. onHit (normal hits): each mechanic that reacts to non-empowered hits ─
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'cooldown') return;
    if (ctx.metadata['empoweredAttack']) return;

    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (!player) return;
    const state = world.playerCombatState.get(ctx.attacker.id);
    if (!state) return;

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
        sourceId:    player.id,
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
    const accelMs = player.passives['cooldown.acceleration-ms'] ?? 0;
    if (accelMs > 0) {
      const remaining = getCooldown(state, EXEC_COOLDOWN_KEY);
      if (remaining > 0) {
        setCooldown(state, EXEC_COOLDOWN_KEY, Math.max(0, remaining - accelMs));
      }
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
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'cooldown') return;
    if (!ctx.metadata['empoweredAttack']) return;

    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (!player) return;
    const state = world.playerCombatState.get(ctx.attacker.id);
    if (!state) return;

    // Battery: bonus on empowered too, then reset stacks and timer.
    if (hasPassive(player, 'cooldown.battery')) {
      const charge = getStatusEffect(state, BAT_CHARGE_FX);
      if (charge && charge.stacks > 0) {
        ctx.damage += Math.round(charge.stacks * BATTERY_ATK_PER_STACK);
        console.log(`[Battery] ${player.id}: ${charge.stacks} stacks → +${charge.stacks * BATTERY_ATK_PER_STACK} bonus on empowered`);
      }
      removeStatusEffect(state, BAT_CHARGE_FX);
      setResource(state, BAT_TIMER_KEY, 0);
    }

    // Alignment: grant attack speed buff after the execution fires.
    if (hasPassive(player, 'cooldown.alignment')) {
      if (!getFlag(state, AL_ACTIVE)) {
        setResource(state, AL_BASE_CD, player.attackCooldown);
        player.attackCooldown = Math.max(200, Math.round(player.attackCooldown * ALIGNMENT_SPEED_FACTOR));
      }
      setCooldown(state, AL_REMAINING, ALIGNMENT_BUFF_MS);
      setFlag(state, AL_ACTIVE, true);
      console.log(`[Alignment] ${player.id}: speed buff started (${ALIGNMENT_BUFF_MS}ms)`);
    }
  });
}

// ── Per-tick update ───────────────────────────────────────────────────────────

/**
 * Run once per world tick, after updateCombatState (so cooldowns are already
 * decremented) to handle time-driven T3 cooldown mechanics.
 */
export function updateCooldownT3(world: World, dt: number): void {
  updateOverdrive(world);
  updateAlignment(world);
  updateBattery(world, dt);
  updateSingularExtraction(world, dt);
  updateEntropyCollapse(world, dt);
  updateChanneledBeam(world, dt);
}

// ── Overdrive update ──────────────────────────────────────────────────────────

function updateOverdrive(world: World): void {
  for (const player of world.players.values()) {
    if (player.combatArchetype !== 'cooldown') continue;
    if (!hasPassive(player, 'cooldown.overdrive')) continue;

    const state = world.playerCombatState.get(player.id);
    if (!state) continue;

    if (getFlag(state, OD_ACTIVE) && !isCooldownActive(state, OD_REMAINING)) {
      player.attackCooldown = getResource(state, OD_BASE_CD) || player.attackCooldown;
      setFlag(state, OD_ACTIVE, false);
      console.log(`[Overdrive] ${player.id}: buff expired — speed restored`);
    }
  }
}

// ── Alignment update ──────────────────────────────────────────────────────────

function updateAlignment(world: World): void {
  for (const player of world.players.values()) {
    if (player.combatArchetype !== 'cooldown') continue;
    if (!hasPassive(player, 'cooldown.alignment')) continue;

    const state = world.playerCombatState.get(player.id);
    if (!state) continue;

    if (getFlag(state, AL_ACTIVE) && !isCooldownActive(state, AL_REMAINING)) {
      player.attackCooldown = getResource(state, AL_BASE_CD) || player.attackCooldown;
      setFlag(state, AL_ACTIVE, false);

      const remaining = getCooldown(state, EXEC_COOLDOWN_KEY);
      if (remaining > 0) {
        const halved = Math.round(remaining * 0.5);
        setCooldown(state, EXEC_COOLDOWN_KEY, halved);
        console.log(`[Alignment] ${player.id}: buff expired — CD halved (${remaining} → ${halved}ms)`);
      }
    }
  }
}

// ── Battery update ────────────────────────────────────────────────────────────

function updateBattery(world: World, dt: number): void {
  for (const player of world.players.values()) {
    if (player.combatArchetype !== 'cooldown') continue;
    if (!hasPassive(player, 'cooldown.battery')) continue;

    const state = world.playerCombatState.get(player.id);
    if (!state) continue;

    // Only accumulate while the execution CD is actively ticking
    if (!isCooldownActive(state, EXEC_COOLDOWN_KEY)) continue;

    const acc       = getResource(state, BAT_TIMER_KEY) + dt;
    const newStacks = Math.floor(acc / 1000);
    setResource(state, BAT_TIMER_KEY, acc - newStacks * 1000);

    for (let i = 0; i < newStacks; i++) {
      applyStatusEffect(state, {
        id:          BAT_CHARGE_FX,
        instanced:   false,
        remainingMs: -1, // permanent until empowered fires
        refreshable: false,
        sourceId:    player.id,
        data:        {},
      });
    }

    if (newStacks > 0) {
      const total = getStatusEffect(state, BAT_CHARGE_FX)?.stacks ?? 0;
      console.log(`[Battery] ${player.id}: +${newStacks} stack(s) → ${total} total`);
    }
  }
}

// ── Singular Extraction update ────────────────────────────────────────────────

function updateSingularExtraction(world: World, dt: number): void {
  for (const player of world.players.values()) {
    if (player.combatArchetype !== 'cooldown') continue;
    if (!hasPassive(player, 'cooldown.singular-extraction')) continue;

    const state = world.playerCombatState.get(player.id);
    if (!state) continue;

    if (player.attackTargetId !== null) {
      setResource(state, SING_NO_TARGET_KEY, 0);
    } else {
      const noTargetMs = getResource(state, SING_NO_TARGET_KEY) + dt;
      setResource(state, SING_NO_TARGET_KEY, noTargetMs);

      if (noTargetMs >= SINGULAR_NO_TARGET_MS) {
        const cdMs = player.passives['cooldown.empowered-cd-ms'] ?? EXECUTION_COOLDOWN_MS;
        setCooldown(state, EXEC_COOLDOWN_KEY, cdMs);
        consumeEmpoweredAttack(state); // disarm if already armed
        player.executionReady = false;
        setResource(state, SING_NO_TARGET_KEY, 0);
        console.log(`[SingExtract] ${player.id}: out of combat — cycle reset (${cdMs}ms)`);
      }
    }
  }
}

// ── Entropy Collapse update ───────────────────────────────────────────────────

function updateEntropyCollapse(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const [monsterId, state] of world.monsterCombatState) {
    const effect = getStatusEffect(state, ENT_DOT_FX);
    if (!effect) continue;

    const monster = world.monsters.get(monsterId);
    if (!monster) continue;

    effect.data['nextTickIn'] -= dt;
    if (effect.data['nextTickIn'] > 0) continue;

    effect.data['nextTickIn'] = effect.data['tickIntervalMs'];

    // Scaling: 1× at full HP → 4× at 90% missing HP.
    // Formula: mult = 1 + (min(missing, 0.9) / 0.9)^3 × 3
    const missingFraction = Math.max(0, 1 - monster.hp / monster.maxHp);
    const scaled          = Math.min(missingFraction, 0.9) / 0.9;
    const mult            = 1 + Math.pow(scaled, 3) * 3;
    const damage          = Math.max(1, Math.round(effect.data['baseDamagePerTick'] * mult));

    monster.hp -= damage;
    console.log(
      `[EntropyColl] ${monsterId}: ${damage} tick (${(missingFraction * 100).toFixed(0)}% missing, ${mult.toFixed(2)}×), hp=${Math.max(0, monster.hp)}`,
    );

    if (monster.hp <= 0) {
      toKill.push({ monsterId, sourceId: effect.sourceId });
    }
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.monsters.get(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.monsters.delete(monsterId);
    world.monsterAI.delete(monsterId);
    world.monsterCombatState.delete(monsterId);
  }
}

// ── Channeled Beam update ─────────────────────────────────────────────────────

function updateChanneledBeam(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const player of world.players.values()) {
    if (!player.isChanneling) continue;

    const state = world.playerCombatState.get(player.id);
    if (!state) continue;

    const remaining = getResource(state, BEAM_REMAINING_KEY) - dt;

    if (remaining <= 0) {
      endChannel(player, state);
      console.log(`[BeamChannel] ${player.id}: channel complete`);
      continue;
    }

    setResource(state, BEAM_REMAINING_KEY, remaining);
    player.channelingPct = Math.round((1 - remaining / BEAM_DURATION_MS) * 100);

    // Validate target — it may have been killed by another player
    const targetId = getString(state, BEAM_TARGET_KEY);
    if (!targetId) { endChannel(player, state); continue; }

    let monster = world.monsters.get(targetId);
    if (!monster || monster.nodeId !== player.nodeId) {
      const newTarget = findBeamTarget(world, player);
      if (newTarget) {
        setString(state, BEAM_TARGET_KEY, newTarget.id);
        player.attackTargetId = newTarget.id;
        monster = newTarget;
        console.log(`[BeamChannel] ${player.id}: target lost — reacquired ${newTarget.id}`);
      } else {
        endChannel(player, state);
        console.log(`[BeamChannel] ${player.id}: target gone, no reacquisition — channel ended`);
        continue;
      }
    }

    // Beam damage tick
    const nextTick = getResource(state, BEAM_NEXT_TICK_KEY) - dt;
    if (nextTick <= 0) {
      setResource(state, BEAM_NEXT_TICK_KEY, nextTick + BEAM_TICK_MS);

      const dmgPerTick = Math.max(1, Math.round(player.attack * BEAM_DMG_PER_TICK_MULT));
      monster.hp -= dmgPerTick;
      console.log(
        `[BeamChannel] ${player.id}: ${dmgPerTick} tick dmg on ${monster.id}, hp=${Math.max(0, monster.hp)}`,
      );

      if (monster.hp <= 0) {
        toKill.push({ monsterId: monster.id, sourceId: player.id });
        const newTarget = findBeamTarget(world, player, monster.id);
        if (newTarget) {
          setString(state, BEAM_TARGET_KEY, newTarget.id);
          player.attackTargetId = newTarget.id;
          console.log(`[BeamChannel] ${player.id}: kill-reacquire → ${newTarget.id}`);
        } else {
          endChannel(player, state);
          console.log(`[BeamChannel] ${player.id}: target killed, no reacquisition — channel ended`);
        }
      }
    } else {
      setResource(state, BEAM_NEXT_TICK_KEY, nextTick);
    }
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.monsters.get(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.monsters.delete(monsterId);
    world.monsterAI.delete(monsterId);
    world.monsterCombatState.delete(monsterId);
  }
}

/** Nearest monster within attack range on the player's node, excluding one ID. */
function findBeamTarget(world: World, player: PlayerState, excludeId?: string): MonsterState | undefined {
  let best: MonsterState | undefined;
  let bestDist = Infinity;

  for (const m of getNodeMonsters(world, player.nodeId)) {
    if (excludeId && m.id === excludeId) continue;
    const dx   = m.x - player.x;
    const dy   = m.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= player.attackRange && dist < bestDist) {
      bestDist = dist;
      best     = m;
    }
  }
  return best;
}

// ── buffSync helpers ──────────────────────────────────────────────────────────

export function getOverdrivePct(state: CombatState): number {
  if (!getFlag(state, OD_ACTIVE)) return 0;
  return Math.round((getCooldown(state, OD_REMAINING) / OVERDRIVE_BUFF_MS) * 100);
}

export function getEternalChargeStacks(state: CombatState): number {
  return getStatusEffect(state, EC_CHARGE_FX)?.stacks ?? 0;
}

export function getTemporalExtPct(state: CombatState): number {
  const buff = getStatusEffect(state, TE_BUFF_FX);
  if (!buff || buff.remainingMs <= 0) return 0;
  const maxMs = buff.data['maxDurationMs'] ?? TEMPORAL_MAX_MS;
  return Math.round((buff.remainingMs / maxMs) * 100);
}

export function getBatteryStacks(state: CombatState): number {
  return getStatusEffect(state, BAT_CHARGE_FX)?.stacks ?? 0;
}

export function getAlignmentPct(state: CombatState): number {
  if (!getFlag(state, AL_ACTIVE)) return 0;
  return Math.round((getCooldown(state, AL_REMAINING) / ALIGNMENT_BUFF_MS) * 100);
}
