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
    if (options.attackerArchetype && ctx.attacker.combatArchetype !== options.attackerArchetype) return;
    if (options.attackerClass && !isClassActive(world, ctx.attacker.id, options.attackerClass)) return;

    const state = ctx.attackerType === 'player'
      ? world.playerCombatState.get(ctx.attacker.id)
      : world.monsterCombatState.get(ctx.attacker.id);
    if (!state) return;

    if (!consumeEmpoweredAttack(state)) return;

    const base     = ctx.damage;
    ctx.damage     = Math.floor(base * multiplier);

    ctx.metadata['empoweredAttack']    = true;
    ctx.metadata['empoweredMultiplier'] = multiplier;
    ctx.metadata['empoweredBonus']      = ctx.damage - base;

    console.log(
      `[Empowered] ${ctx.attacker.id}: ${multiplier}x hit on ${ctx.defender.id} — ` +
      `${base} → ${ctx.damage} dmg (+${ctx.damage - base})`,
    );
  });
}
