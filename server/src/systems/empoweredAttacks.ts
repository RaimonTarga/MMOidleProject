import type { PassiveKey } from '@mmo-idle/shared';
import type { CombatState } from './combatState';
import { registerCombatListener } from './combatPipeline';
import { isClassActive } from './classMechanics';

// Flag key is an internal constant — consumers use the helper functions
// rather than writing the string directly.
const EMPOWERED_FLAG = 'empoweredAttack';

// ── Flag helpers ──────────────────────────────────────────────────────────────

/** Mark the entity's next attack as empowered. */
export function setEmpoweredAttack(state: CombatState): void {
  state.flags[EMPOWERED_FLAG] = true;
}

export function isEmpoweredAttack(state: CombatState): boolean {
  return state.flags[EMPOWERED_FLAG] === true;
}

/**
 * If the entity is currently empowered, consume the flag and return true.
 * Returns false (and makes no change) if the entity was not empowered.
 * Designed for single-use: empowerment is spent exactly once.
 */
export function consumeEmpoweredAttack(state: CombatState): boolean {
  if (!state.flags[EMPOWERED_FLAG]) return false;
  state.flags[EMPOWERED_FLAG] = false;
  return true;
}

// ── Multiplier registration ───────────────────────────────────────────────────

export interface EmpoweredMultiplierOptions {
  /** Restrict to one attacker side. Omit to apply to both players and monsters. */
  attackerType?: 'player' | 'monster';
  /** If set, only fires when attacker.combatArchetype matches this value. */
  attackerArchetype?: string;
  /**
   * If set, only fires when the attacker's selectedClass matches this value.
   * Checked via isClassActive — preferred over attackerArchetype for player
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
    if (options.attackerArchetype) {
      const archetype = ctx.attackerType === 'player'
        ? ctx.attacker.usesSkills.combatArchetype
        : ctx.attacker.isMonster.combatArchetype;
      if (archetype !== options.attackerArchetype) return;
    }
    if (options.attackerClass) {
      if (ctx.attackerType !== 'player') return;
      if (!isClassActive(world, ctx.attacker.isPlayer.id, options.attackerClass)) return;
    }

    const state = ctx.attacker.tracksCombat;

    if (!consumeEmpoweredAttack(state)) return;

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

    const base     = ctx.damage;
    ctx.damage     = Math.floor(base * effectiveMult);

    ctx.metadata['empoweredAttack']    = true;
    ctx.metadata['empoweredMultiplier'] = effectiveMult;
    ctx.metadata['empoweredBonus']      = ctx.damage - base;

    console.log(
      `[Empowered] ${ctx.attacker.entityId}: ${effectiveMult}x hit on ${ctx.defender.entityId} — ` +
      `${base} → ${ctx.damage} dmg (+${ctx.damage - base})`,
    );
  });
}
