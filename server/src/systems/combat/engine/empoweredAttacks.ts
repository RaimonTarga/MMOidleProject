import {
  relicRatingsFromPassives,
  resolveCadenceRelicProfile,
  resolveCooldownRelicProfile,
  resolveEnergyMaxBeforeRelic,
  resolveEnergyRelicProfile,
  type PassiveKey,
} from '@mmo-idle/shared';
import { registerCombatListener } from './combatPipeline';
import { isClassActive } from '../../classes/shared/classActive';
import type { ServerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';

// ── Flag helpers ──────────────────────────────────────────────────────────────

/** Mark the entity's next attack as empowered. */
export function setEmpoweredAttack(world: World, entity: ServerEntity): void {
  attachComponent(world, entity, 'hasEmpoweredAttack', {});
}

export function isEmpoweredAttack(entity: ServerEntity): boolean {
  return entity.hasEmpoweredAttack !== undefined;
}

/**
 * If the entity is currently empowered, consume the flag and return true.
 * Returns false (and makes no change) if the entity was not empowered.
 * Designed for single-use: empowerment is spent exactly once.
 */
export function consumeEmpoweredAttack(world: World, entity: ServerEntity): boolean {
  if (!isEmpoweredAttack(entity)) return false;
  detachComponent(world, entity, 'hasEmpoweredAttack');
  return true;
}

// ── Multiplier registration ───────────────────────────────────────────────────

type EmpoweredAttackerSlice =
  | 'usesCadence'
  | 'usesCooldown'
  | 'usesEnergy'
  | 'usesReload'
  | 'appliesDots';

export interface EmpoweredMultiplierOptions {
  /** Restrict to one attacker side. Omit to apply to both players and monsters. */
  attackerType?: 'player' | 'monster';
  /** Player-only: only fires when this archetype slice is attached. */
  attackerSlice?: EmpoweredAttackerSlice;
  /** Monster-only: monsters still expose their archetype as a compact discriminator. */
  attackerMonsterArchetype?: string;
  /**
   * If set, only fires when the attacker's selectedClass matches this value.
   * Checked via isClassActive — preferred over archetype strings for player
   * class mechanics because it uses selectedClass as the source of truth.
   */
  attackerClass?: string;
  /**
   * If set, reads the base multiplier from player.passives[passiveKey] at runtime
   * instead of using the static `multiplier` argument.
   * Falls back to the static argument when the passive is absent or zero.
   */
  passiveKey?: PassiveKey;
  /**
   * If set alongside passiveKey, adds player.passives[passiveAddKey] to the
   * effective multiplier. Useful when a tier-3 node stacks an additive bonus
   * on top of the frame-set base (e.g. cadence.damage-mult-add).
   */
  passiveAddKey?: PassiveKey;
}

/**
 * Register a combat listener that applies `multiplier` to ctx.damage whenever
 * the attacker has a pending empowered attack flag.
 *
 * Fires at the 'onHit' phase so the final damage value is still modifiable
 * before it is written to the defender's hp.
 *
 * Multiple archetypes can call this with different multipliers; each
 * registration is independent. Multipliers stack multiplicatively if both
 * fire on the same hit.
 *
 * Call once at server startup (before the World is created).
 */
export function registerEmpoweredMultiplier(
  multiplier: number,
  options: EmpoweredMultiplierOptions = {},
): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (options.attackerType && ctx.attackerType !== options.attackerType) return;
    if (options.attackerSlice) {
      if (ctx.attackerType !== 'player') return;
      if (ctx.attacker[options.attackerSlice] === undefined) return;
    }
    if (options.attackerMonsterArchetype) {
      if (ctx.attackerType !== 'monster') return;
      if (ctx.attacker.isMonster.combatArchetype !== options.attackerMonsterArchetype) return;
    }
    if (options.attackerClass) {
      if (ctx.attackerType !== 'player') return;
      if (!isClassActive(world, ctx.attacker.isPlayer.id, options.attackerClass)) return;
    }

    // Chaotic miss: the attack whiffs. Don't consume the empowered charge, don't
    // multiply, don't set empoweredAttack metadata (which would restart cooldowns and
    // mark the hit empowered). The charge stays armed for the next real hit.
    if (ctx.metadata['chaoticMiss']) return;

    if (!consumeEmpoweredAttack(world, ctx.attacker)) return;

    // Some T4 mechanics suppress the standard multiplier but still need the
    // empoweredAttack metadata set so their own onHit handlers can detect the trigger.
    if (ctx.metadata['suppressEmpoweredMult']) {
      ctx.metadata['empoweredAttack']     = true;
      ctx.metadata['empoweredMultiplier'] = 1;
      ctx.metadata['empoweredBonus']      = 0;
      return;
    }

    // Resolve effective multiplier: use passives at runtime when passiveKey is given.
    let effectiveMult = multiplier;
    if (options.passiveKey && ctx.attackerType === 'player') {
      const base = ctx.attacker.usesSkills.passives[options.passiveKey];
      if (base !== undefined && base > 0) {
        effectiveMult = base;
        if (options.passiveAddKey) {
          effectiveMult += ctx.attacker.usesSkills.passives[options.passiveAddKey] ?? 0;
        }
      }
    }
    // Universal item/passive bonus — stacks on top of archetype base + T3 add.
    if (ctx.attackerType === 'player') {
      effectiveMult += ctx.attacker.usesSkills.passives['shared.empowered-mult-add'] ?? 0;
      // Multiplicative empowered bonus (weapon mechanic): scales the resolved
      // multiplier by (1 + bonus), so every spec gains the same % regardless of
      // its base multiplier. e.g. 2.5x base with +0.5 → 3.75x (NOT additive 3.0x).
      const multBonus = ctx.attacker.usesSkills.passives['weapon.empowered-mult-bonus'] ?? 0;
      if (multBonus !== 0) effectiveMult *= 1 + multBonus;

      const passives = ctx.attacker.usesSkills.passives;
      const ratings = relicRatingsFromPassives(passives);
      if (options.attackerSlice === 'usesCadence') {
        effectiveMult = resolveCadenceRelicProfile(5, effectiveMult, ratings).empoweredMultiplier.after;
      } else if (options.attackerSlice === 'usesCooldown') {
        effectiveMult = resolveCooldownRelicProfile(7000, effectiveMult, ratings).empoweredMultiplier.after;
      } else if (options.attackerSlice === 'usesEnergy') {
        effectiveMult = resolveEnergyRelicProfile(
          passives['energy.per-hit'] ?? 14,
          resolveEnergyMaxBeforeRelic(passives, ctx.attacker.tracksProgression.playerTier),
          effectiveMult,
          ratings,
        ).dischargeMultiplier.after;
      }
    }

    const base     = ctx.damage;
    ctx.damage     = Math.floor(base * effectiveMult);

    ctx.metadata['empoweredAttack']    = true;
    ctx.metadata['empoweredMultiplier'] = effectiveMult;
    ctx.metadata['empoweredBonus']      = ctx.damage - base;

  });
}
