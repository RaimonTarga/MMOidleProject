import { defineBuff, type BuffDescriptor } from '../../../combat/buffs/descriptor';
import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { applyStatusEffect, removeStatusEffect, getStatusEffects, pruneStatusEffects } from '@mmo-idle/shared';
import { grantMonsterRewards } from '../../../player/progression/rewards';
import { setEmpoweredAttack, registerEmpoweredMultiplier } from '../../../combat/engine/empoweredAttacks';
import type { World } from '../../../../world/World';
import { attachMarker, detachMarkerIfNoEffects } from '../../../../ecs/markerHelpers';

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

// ── Init — registers combat pipeline listeners ─────────────────────────────────
// Per-archetype state (count/threshold/speedStacks/seqDmg/charge/echo)
// lives on the usesCadence slice (see ecs/components/usesCadence.ts), not on
// CombatState counters/resources. The CombatState empowered-attack flag is
// shared across archetypes and is still set via setEmpoweredAttack.

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
    attackerSlice: 'usesCadence',
    passiveKey:    'cadence.empowered-mult',
    passiveAddKey: 'cadence.damage-mult-add',
  });

  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;

    // Query by component presence, not by combatArchetype string.
    const entity = ctx.attacker;
    if (!entity?.usesCadence) return;

    const state   = entity.tracksCombat;
    const player  = entity;
    const cadence = entity.usesCadence;
    const passives = player.usesSkills.passives;

    // ── EMPOWERED (FINISHER) HIT ───────────────────────────────────────────────
    // ctx.metadata['empoweredAttack'] is true when registerEmpoweredMultiplier
    // fired above and consumed the flag. The base multiplier is already applied.
    // Empowered hits do NOT increment the cadence counter.

    if (ctx.metadata['empoweredAttack']) {
      // Double Time: multiply again for extra hits (already multiplied once above)
      const triggerCount = Math.max(1, Math.round(passives['cadence.trigger-count'] ?? 1));
      if (triggerCount > 1) {
        ctx.damage = Math.round(ctx.damage * triggerCount);
      }

      // Rising Tide: additional multiplier based on how many normal hits built up to this finisher
      const momentumPerHit = passives['cadence.momentum-buildup'] ?? 0;
      if (momentumPerHit > 0) {
        const normalHits = (cadence.threshold || CADENCE_THRESHOLD_DEFAULT) - 1;
        ctx.damage = Math.round(ctx.damage * (1 + normalHits * momentumPerHit));
      }

      // Iron Patience: add all stored charge to finisher damage, then clear
      if ((passives['cadence.charge-buildup'] ?? 0) > 0) {
        ctx.damage += cadence.charge;
        cadence.charge = 0;
      }

      // Hemorrhage: convert finisher damage to a non-stacking bleed DoT
      if ((passives['cadence.hemorrhage'] ?? 0) > 0 && ctx.defenderType === 'monster') {
        const monsterState = ctx.defender.tracksCombat;
        const damagePerTick = Math.max(1, Math.round(ctx.damage * HEMORRHAGE_MULT / HEMORRHAGE_TICKS));
        removeStatusEffect(monsterState, 'cadence-hemorrhage');
        applyStatusEffect(monsterState, {
          id:          'cadence-hemorrhage',
          instanced:   false,
          remainingMs: -1,
          sourceId:    player.isPlayer.id,
          data: {
            damagePerTick,
            ticksLeft:      HEMORRHAGE_TICKS,
            nextTickIn:     HEMORRHAGE_TICK_MS,
            tickIntervalMs: HEMORRHAGE_TICK_MS,
          },
        });
        attachMarker(world, ctx.defender, 'hasHemorrhage');
        ctx.damage = 0;
      }

      // Delayed Verdict: tag the target with accumulated pre-finisher damage
      if ((passives['cadence.detonation'] ?? 0) > 0 && ctx.defenderType === 'monster') {
        const monsterState = ctx.defender.tracksCombat;
        removeStatusEffect(monsterState, 'cadence-detonation');
        applyStatusEffect(monsterState, {
          id:          'cadence-detonation',
          instanced:   false,
          remainingMs: -1,
          sourceId:    player.isPlayer.id,
          data: {
            damage: Math.round(cadence.seqDmg * DETONATION_MULT),
            fuseMs: DETONATION_FUSE_MS,
          },
        });
        attachMarker(world, ctx.defender, 'hasDetonation');
      }
      cadence.seqDmg = 0;

      // Accelerando: gain a speed stack on each finisher
      if ((passives['cadence.speed-stack'] ?? 0) > 0) {
        if (cadence.speedStacks < CADENCE_MAX_SPEED_STACKS) {
          cadence.speedStacks++;
          player.performsAttack.attackCooldown = Math.max(
            200,
            player.performsAttack.attackCooldown - CADENCE_SPEED_PER_STACK_MS,
          );
        }
      }

      // Cursed Finale: vulnerability and plating-shred debuffs on the target
      const vulnPct      = passives['cadence.debuff-vuln-pct']      ?? 0;
      const vulnMs       = passives['cadence.debuff-vuln-ms']       ?? 5000;
      const platingShred = passives['cadence.debuff-plating-shred'] ?? 0;
      if ((vulnPct > 0 || platingShred > 0) && ctx.defenderType === 'monster') {
        const monsterState = ctx.defender.tracksCombat;
        if (vulnPct > 0) {
          applyStatusEffect(monsterState, {
            id: 'vulnerability',
            instanced: false,
            refreshable: true,
            remainingMs: vulnMs,
            sourceId: player.isPlayer.id,
            data: { damageMultiplier: 1 + vulnPct / 100 },
          });
        }
        if (platingShred > 0) {
          applyStatusEffect(monsterState, {
            id: 'plating-shred',
            instanced: false,
            remainingMs: -1,
            sourceId: player.isPlayer.id,
            data: { platingReduction: platingShred },
          });
        }
      }

      // Rising Tide echo: arm the post-finisher echo counter for subsequent hits
      if ((passives['cadence.momentum-echo'] ?? 0) > 0) {
        cadence.echo = MOMENTUM_ECHO_HITS;
      }

      ctx.metadata['cadenceTrigger'] = true;
      return;
    }

    // ── NORMAL HIT ─────────────────────────────────────────────────────────────
    // Empowered attacks never reach this branch, so only normal hits build
    // the cadence counter toward the next finisher.

    // Lazily initialize threshold on first hit if still 0 (fallback path).
    if (cadence.threshold === 0) {
      const base = Math.round(passives['cadence.empowered-threshold'] ?? CADENCE_THRESHOLD_DEFAULT);
      const mod  = Math.round(passives['cadence.threshold-mod'] ?? 0);
      cadence.threshold = Math.max(2, base + mod);
    }

    // Rising Tide echo bonus: boost this hit if the echo counter is running
    if (cadence.echo > 0 && (passives['cadence.momentum-echo'] ?? 0) > 0) {
      ctx.damage = Math.round(ctx.damage * (1 + MOMENTUM_ECHO_BONUS));
      cadence.echo--;
    }

    // Delayed Verdict: accumulate this hit's damage for the eventual detonation
    if ((passives['cadence.detonation'] ?? 0) > 0) {
      cadence.seqDmg += ctx.damage;
    }

    // Iron Patience: store a fraction of this hit as charge for the finisher
    const chargePct = passives['cadence.charge-buildup'] ?? 0;
    if (chargePct > 0) {
      cadence.charge += Math.round(ctx.damage * chargePct);
    }

    cadence.count++;

    // threshold is the full cycle length N. After (N-1) normal hits the counter
    // arms empowered for the next attack.
    if (cadence.count >= cadence.threshold - 1) {
      setEmpoweredAttack(world, entity);
      cadence.count = 0;
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

  for (const entity of world.detonatedMonsters) {
    const monsterId = entity.isMonster.id;
    const state     = entity.tracksCombat;
    const tags = getStatusEffects(state, 'cadence-detonation');
    if (tags.length === 0) continue;

    let lastSourceId = '';

    for (const tag of tags) {
      tag.data['fuseMs'] -= dt;
      if (tag.data['fuseMs'] > 0) continue;

      entity.hasHealth.hp -= tag.data['damage'];
      lastSourceId = tag.sourceId;
      console.log(`[Detonation] ${monsterId}: ${tag.data['damage']} damage, hp=${Math.max(0, entity.hasHealth.hp)}`);
    }

    pruneStatusEffects(state, e => e.id === 'cadence-detonation' && e.data['fuseMs'] <= 0);
    detachMarkerIfNoEffects(world, entity, 'hasDetonation', state, 'cadence-detonation');

    if (entity.hasHealth.hp <= 0) {
      toKill.push({ monsterId, sourceId: lastSourceId });
    }
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.removeMonsterEntity(monsterId);
  }
}

// ── Hemorrhage: tick bleed damage ─────────────────────────────────────────────

function updateHemorrhages(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const entity of world.hemorrhagedMonsters) {
    const monsterId = entity.isMonster.id;
    const state     = entity.tracksCombat;
    const bleeds = getStatusEffects(state, 'cadence-hemorrhage');
    if (bleeds.length === 0) continue;

    let lastSourceId = '';

    for (const bleed of bleeds) {
      bleed.data['nextTickIn'] -= dt;
      if (bleed.data['nextTickIn'] > 0) continue;

      bleed.data['nextTickIn'] = bleed.data['tickIntervalMs'];
      bleed.data['ticksLeft']--;
      entity.hasHealth.hp -= bleed.data['damagePerTick'];
      lastSourceId = bleed.sourceId;
      console.log(
        `[Hemorrhage] ${monsterId}: ${bleed.data['damagePerTick']} bleed dmg, ${bleed.data['ticksLeft']} ticks left`,
      );
    }

    pruneStatusEffects(state, e => e.id === 'cadence-hemorrhage' && e.data['ticksLeft'] <= 0);
    detachMarkerIfNoEffects(world, entity, 'hasHemorrhage', state, 'cadence-hemorrhage');

    if (entity.hasHealth.hp <= 0) {
      toKill.push({ monsterId, sourceId: lastSourceId });
    }
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.removeMonsterEntity(monsterId);
  }
}

// ── Buff descriptors ──────────────────────────────────────────────────────────

export const CADENCE_BUFFS = [
  defineBuff(
    'cadence-accelerando',
    ({ player }) => {
      const stacks = player.usesCadence?.speedStacks ?? 0;
      return stacks > 0
        ? { id: 'cadence-accelerando', label: 'Accel', stacks, durationPct: -1, color: '#00ffaa' }
        : null;
    },
    { label: 'Accel', color: '#00ffaa', category: 'cadence', shape: 'square' },
  ),
  defineBuff(
    'cadence-echo',
    ({ player }) => {
      const echo = player.usesCadence?.echo ?? 0;
      return echo > 0
        ? { id: 'cadence-echo', label: 'Echo', stacks: echo, durationPct: -1, color: '#4488ff' }
        : null;
    },
    { label: 'Echo', color: '#4488ff', category: 'cadence', shape: 'square' },
  ),
] as const satisfies readonly BuffDescriptor[];
