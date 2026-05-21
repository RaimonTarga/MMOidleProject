import type { PlayerState } from '@mmo-idle/shared';
import { registerCombatListener } from './combatPipeline';
import {
  addCounter, getCounter, setCounter,
  getResource, setResource, addResource,
} from './combatState';
import { applyStatusEffect, removeStatusEffect, getStatusEffects, pruneStatusEffects } from './statusEffects';
import { grantMonsterRewards } from './rewards';
import { setEmpoweredAttack, registerEmpoweredMultiplier } from './empoweredAttacks';
import type { World } from '../world/World';

// ── Fallback constants (balanced-frame values, used when no frame is unlocked) ─

const CADENCE_THRESHOLD_DEFAULT   = 5;   // cycle length: (N-1) normal hits + 1 empowered
const CADENCE_DAMAGE_MULT_DEFAULT = 2.0;

// ── Passive mechanic constants ─────────────────────────────────────────────────

// Accelerando (cadence-light-t3-a)
const CADENCE_SPEED_PER_STACK_MS = 80;
const CADENCE_MAX_SPEED_STACKS   = 5;

// Rising Tide (cadence-balanced-t3-b)
const MOMENTUM_ECHO_HITS  = 5;
const MOMENTUM_ECHO_BONUS = 0.5;

// Delayed Verdict (cadence-balanced-t3-c)
const DETONATION_FUSE_MS = 3_000;
const DETONATION_MULT    = 1.0;

// Hemorrhage (cadence-heavy-t3-b)
const HEMORRHAGE_TICKS    = 4;
const HEMORRHAGE_TICK_MS  = 1_000;
const HEMORRHAGE_MULT     = 1.5;

// ── CombatState keys ───────────────────────────────────────────────────────────

const CADENCE_KEY = 'cadenceCount';
const SEQ_DMG_KEY = 'cadenceSeqDmg';
const CHARGE_KEY  = 'cadenceCharge';
const ECHO_KEY    = 'cadenceEcho';

// ── Init — registers combat pipeline listeners ─────────────────────────────────

/**
 * Register the cadence hit-counter mechanic for the 'cadence' class.
 * Called by activateClassMechanics('cadence') at startup.
 *
 * Passive modifiers (read from player.passives):
 *   'cadence.empowered-threshold' — total cycle length N (set by frame node). The (N-1)th
 *                                   normal hit arms empowered; the Nth hit fires it.
 *   'cadence.empowered-mult'      — base empowered damage multiplier (set by frame node).
 *   'cadence.threshold-mod'       — integer delta applied to the frame's base threshold (min 2).
 *   'cadence.damage-mult-add'     — additive bonus on top of cadence.empowered-mult.
 *   'cadence.trigger-count'       — how many times the burst fires (Double Time = 2).
 *   'cadence.speed-stack'         — Accelerando: each finisher reduces attackCooldown.
 *   'cadence.debuff-vuln-pct'     — Cursed Finale: damage-taken vulnerability %.
 *   'cadence.debuff-vuln-ms'      — Cursed Finale: vulnerability duration ms.
 *   'cadence.debuff-plating-shred'— Cursed Finale: permanent plating reduction per stack.
 *   'cadence.momentum-buildup'    — Rising Tide: finisher damage bonus per pre-finisher hit.
 *   'cadence.momentum-echo'       — Rising Tide: echo hit count after finisher.
 *   'cadence.detonation'          — Delayed Verdict: enable detonation tagging.
 *   'cadence.hemorrhage'          — Hemorrhage: convert finisher to DoT.
 *   'cadence.charge-buildup'      — Iron Patience: fraction of pre-hit damage stored.
 *
 * Empowered attack rule: the finisher (empowered) hit does NOT count toward the
 * next cycle. The counter is reset to 0 when the empowered attack is armed.
 */
export function initCadenceArchetype(): void {
  // Register the empowered multiplier listener FIRST so it fires before the counter
  // logic below. When the empowered flag is consumed here, ctx.metadata['empoweredAttack']
  // is set to true, which the counter listener reads to detect the finisher hit.
  registerEmpoweredMultiplier(CADENCE_DAMAGE_MULT_DEFAULT, {
    attackerType:  'player',
    attackerArchetype: 'cadence',
    passiveKey:    'cadence.empowered-mult',
    passiveAddKey: 'cadence.damage-mult-add',
  });

  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'cadence') return;

    const state = world.playerCombatState.get(ctx.attacker.id);
    if (!state) return;
    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (!player) return;

    // ── EMPOWERED (FINISHER) HIT ───────────────────────────────────────────────
    // ctx.metadata['empoweredAttack'] is true when registerEmpoweredMultiplier
    // fired above and consumed the flag. The base multiplier is already applied.
    // Empowered hits do NOT increment the cadence counter.

    if (ctx.metadata['empoweredAttack']) {
      player.cadenceEmpoweredArmed = false;

      // Double Time: multiply again for extra hits (already multiplied once above)
      const triggerCount = Math.max(1, Math.round(player.passives['cadence.trigger-count'] ?? 1));
      if (triggerCount > 1) {
        ctx.damage = Math.round(ctx.damage * triggerCount);
      }

      // Rising Tide: additional multiplier based on how many normal hits built up to this finisher
      const momentumPerHit = player.passives['cadence.momentum-buildup'] ?? 0;
      if (momentumPerHit > 0) {
        const normalHits = (player.cadenceThreshold || CADENCE_THRESHOLD_DEFAULT) - 1;
        ctx.damage = Math.round(ctx.damage * (1 + normalHits * momentumPerHit));
      }

      // Iron Patience: add all stored charge to finisher damage, then clear
      if ((player.passives['cadence.charge-buildup'] ?? 0) > 0) {
        ctx.damage += getResource(state, CHARGE_KEY);
        setResource(state, CHARGE_KEY, 0);
      }

      // Hemorrhage: convert finisher damage to a non-stacking bleed DoT
      if ((player.passives['cadence.hemorrhage'] ?? 0) > 0 && ctx.defenderType === 'monster') {
        const monsterState = world.monsterCombatState.get(ctx.defender.id);
        if (monsterState) {
          const damagePerTick = Math.max(1, Math.round(ctx.damage * HEMORRHAGE_MULT / HEMORRHAGE_TICKS));
          removeStatusEffect(monsterState, 'cadence-hemorrhage');
          applyStatusEffect(monsterState, {
            id:          'cadence-hemorrhage',
            instanced:   false,
            remainingMs: -1,
            sourceId:    player.id,
            data: {
              damagePerTick,
              ticksLeft:      HEMORRHAGE_TICKS,
              nextTickIn:     HEMORRHAGE_TICK_MS,
              tickIntervalMs: HEMORRHAGE_TICK_MS,
            },
          });
          ctx.damage = 0;
        }
      }

      // Delayed Verdict: tag the target with accumulated pre-finisher damage
      if ((player.passives['cadence.detonation'] ?? 0) > 0 && ctx.defenderType === 'monster') {
        const monsterState = world.monsterCombatState.get(ctx.defender.id);
        if (monsterState) {
          const seqDmg = getResource(state, SEQ_DMG_KEY);
          removeStatusEffect(monsterState, 'cadence-detonation');
          applyStatusEffect(monsterState, {
            id:          'cadence-detonation',
            instanced:   false,
            remainingMs: -1,
            sourceId:    player.id,
            data: {
              damage: Math.round(seqDmg * DETONATION_MULT),
              fuseMs: DETONATION_FUSE_MS,
            },
          });
        }
      }
      setResource(state, SEQ_DMG_KEY, 0);

      // Accelerando: gain a speed stack on each finisher
      if ((player.passives['cadence.speed-stack'] ?? 0) > 0) {
        if (player.cadenceSpeedStacks < CADENCE_MAX_SPEED_STACKS) {
          player.cadenceSpeedStacks++;
          player.attackCooldown = Math.max(200, player.attackCooldown - CADENCE_SPEED_PER_STACK_MS);
        }
      }

      // Cursed Finale: vulnerability and plating-shred debuffs on the target
      const vulnPct      = player.passives['cadence.debuff-vuln-pct']      ?? 0;
      const vulnMs       = player.passives['cadence.debuff-vuln-ms']       ?? 5000;
      const platingShred = player.passives['cadence.debuff-plating-shred'] ?? 0;
      if ((vulnPct > 0 || platingShred > 0) && ctx.defenderType === 'monster') {
        const monsterState = world.monsterCombatState.get(ctx.defender.id);
        if (monsterState) {
          if (vulnPct > 0) {
            applyStatusEffect(monsterState, {
              id: 'vulnerability',
              instanced: false,
              refreshable: true,
              remainingMs: vulnMs,
              sourceId: player.id,
              data: { damageMultiplier: 1 + vulnPct / 100 },
            });
          }
          if (platingShred > 0) {
            applyStatusEffect(monsterState, {
              id: 'plating-shred',
              instanced: false,
              remainingMs: -1,
              sourceId: player.id,
              data: { platingReduction: platingShred },
            });
          }
        }
      }

      // Rising Tide echo: arm the post-finisher echo counter for subsequent hits
      if ((player.passives['cadence.momentum-echo'] ?? 0) > 0) {
        setCounter(state, ECHO_KEY, MOMENTUM_ECHO_HITS);
      }

      ctx.metadata['cadenceTrigger'] = true;
      return;
    }

    // ── NORMAL HIT ─────────────────────────────────────────────────────────────
    // Empowered attacks never reach this branch, so only normal hits build
    // the cadence counter toward the next finisher.

    // Lazily initialize cadenceThreshold on first hit if still 0 as fallback.
    if (player.cadenceThreshold === 0) {
      const base = Math.round(player.passives['cadence.empowered-threshold'] ?? CADENCE_THRESHOLD_DEFAULT);
      const mod  = Math.round(player.passives['cadence.threshold-mod'] ?? 0);
      player.cadenceThreshold = Math.max(2, base + mod);
    }

    // Rising Tide echo bonus: boost this hit if the echo counter is running
    const echo = getCounter(state, ECHO_KEY);
    if (echo > 0 && (player.passives['cadence.momentum-echo'] ?? 0) > 0) {
      ctx.damage = Math.round(ctx.damage * (1 + MOMENTUM_ECHO_BONUS));
      setCounter(state, ECHO_KEY, echo - 1);
    }

    // Delayed Verdict: accumulate this hit's damage for the eventual detonation
    if ((player.passives['cadence.detonation'] ?? 0) > 0) {
      addResource(state, SEQ_DMG_KEY, ctx.damage);
    }

    // Iron Patience: store a fraction of this hit as charge for the finisher
    const chargePct = player.passives['cadence.charge-buildup'] ?? 0;
    if (chargePct > 0) {
      addResource(state, CHARGE_KEY, Math.round(ctx.damage * chargePct));
    }

    addCounter(state, CADENCE_KEY, 1);
    const newCount = getCounter(state, CADENCE_KEY);
    player.cadenceCount = newCount;

    // cadenceThreshold is the full cycle length N.
    // After (N-1) normal hits the counter arms empowered for the next attack.
    if (newCount >= player.cadenceThreshold - 1) {
      setEmpoweredAttack(state);
      setCounter(state, CADENCE_KEY, 0);
      player.cadenceCount = 0;
      player.cadenceEmpoweredArmed = true;
      console.log(`[Cadence] ${player.id}: finisher armed after ${newCount} hit(s)`);
    }
  });
}

// ── Per-tick updates ───────────────────────────────────────────────────────────

export function updateCadenceEffects(world: World, dt: number): void {
  updateDetonations(world, dt);
  updateHemorrhages(world, dt);
}

// ── Delayed Verdict: tick fuses, detonate on expiry ───────────────────────────

function updateDetonations(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const [monsterId, state] of world.monsterCombatState) {
    const tags = getStatusEffects(state, 'cadence-detonation');
    if (tags.length === 0) continue;

    const monster = world.monsters.get(monsterId);
    if (!monster) continue;

    let lastSourceId = '';

    for (const tag of tags) {
      tag.data['fuseMs'] -= dt;
      if (tag.data['fuseMs'] > 0) continue;

      monster.hp -= tag.data['damage'];
      lastSourceId = tag.sourceId;
      console.log(`[Detonation] ${monsterId}: ${tag.data['damage']} damage, hp=${Math.max(0, monster.hp)}`);
    }

    pruneStatusEffects(state, e => e.id === 'cadence-detonation' && e.data['fuseMs'] <= 0);

    if (monster.hp <= 0) {
      toKill.push({ monsterId, sourceId: lastSourceId });
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

// ── Hemorrhage: tick bleed damage ─────────────────────────────────────────────

function updateHemorrhages(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const [monsterId, state] of world.monsterCombatState) {
    const bleeds = getStatusEffects(state, 'cadence-hemorrhage');
    if (bleeds.length === 0) continue;

    const monster = world.monsters.get(monsterId);
    if (!monster) continue;

    let lastSourceId = '';

    for (const bleed of bleeds) {
      bleed.data['nextTickIn'] -= dt;
      if (bleed.data['nextTickIn'] > 0) continue;

      bleed.data['nextTickIn'] = bleed.data['tickIntervalMs'];
      bleed.data['ticksLeft']--;
      monster.hp -= bleed.data['damagePerTick'];
      lastSourceId = bleed.sourceId;
      console.log(
        `[Hemorrhage] ${monsterId}: ${bleed.data['damagePerTick']} bleed dmg, ${bleed.data['ticksLeft']} ticks left`,
      );
    }

    pruneStatusEffects(state, e => e.id === 'cadence-hemorrhage' && e.data['ticksLeft'] <= 0);

    if (monster.hp <= 0) {
      toKill.push({ monsterId, sourceId: lastSourceId });
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
