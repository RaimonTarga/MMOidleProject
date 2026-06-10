import {
  getCounter,
  setCounter,
  type MonsterDefinition,
} from "@mmo-idle/shared";
import type { MonsterEntity } from "../../../ecs/entity";

// ── T4 monster mechanics ────────────────────────────────────────────────────
//
// Server-side ports of four player mechanics onto the monster→player (and
// player→monster) directions. All are deterministic (counters / timers off the
// authoritative tick clock — no RNG), matching the game's core invariant.
//
// State lives on the monster's `tracksCombat` scratch (runtime-only, freed on
// despawn). Keys are private to this module — do not reuse them elsewhere.

const CADENCE_COUNTER_KEY = "t4CadenceCount";
const EMP_CD_NEXT_KEY = "t4EmpCooldownNextAt";
const EMP_CD_SESSION_KEY = "t4EmpCooldownSession";
const SHIELD_AMOUNT_KEY = "t4EnemyShieldAmount";
const SHIELD_EXPIRES_KEY = "t4EnemyShieldExpiresAt";
const SHIELD_NEXT_KEY = "t4EnemyShieldNextAt";
const SHIELD_SESSION_KEY = "t4EnemyShieldSession";

/** Combat-entry timestamp for the monster's current aggro session (or `now`). */
function combatSession(monster: MonsterEntity, now: number): number {
  return monster.hasAggroTarget?.sinceMs ?? now;
}

/**
 * Combined empowered-attack multiplier for a single monster attack, porting the
 * player cadence + cooldown empowered mechanics:
 *   - cadenceFinisher:  every Nth landed attack ×mult (deterministic counter).
 *   - empoweredCooldown: timer from combat entry; once cooldownMs elapses the
 *     next landed attack is ×mult, then the timer resets. Because this is only
 *     evaluated when the monster actually attacks, an empowered hit that comes
 *     due during a gap simply applies to the next real attack (never wasted).
 *
 * Returns 1 when nothing fires. Mutates the monster's combat-state counters, so
 * call EXACTLY ONCE per confirmed (non-cancelled) monster attack. The caller
 * multiplies the already-mitigated `ctx.damage` by the result before the hit
 * reaches the player's onDamageTaken pipeline, so the player's damage-cap,
 * shields, plating and DR all apply to the boosted spike — same as a player
 * empowered attack.
 */
export function monsterEmpoweredMultiplier(
  monster: MonsterEntity,
  def: MonsterDefinition | undefined,
  now: number,
): number {
  let mult = 1;
  const cs = monster.tracksCombat;

  const cadence = def?.cadenceFinisher;
  if (cadence && cadence.everyNAttacks > 0) {
    const count = getCounter(cs, CADENCE_COUNTER_KEY) + 1;
    if (count % cadence.everyNAttacks === 0) mult *= cadence.multiplier;
    setCounter(cs, CADENCE_COUNTER_KEY, count);
  }

  const cooldown = def?.empoweredCooldown;
  if (cooldown && cooldown.cooldownMs > 0) {
    const session = combatSession(monster, now);
    // Restart the timer on a fresh combat session ("starts on combat entry").
    if (getCounter(cs, EMP_CD_SESSION_KEY) !== session) {
      setCounter(cs, EMP_CD_SESSION_KEY, session);
      setCounter(cs, EMP_CD_NEXT_KEY, session + cooldown.cooldownMs);
    }
    if (now >= getCounter(cs, EMP_CD_NEXT_KEY)) {
      mult *= cooldown.multiplier;
      setCounter(cs, EMP_CD_NEXT_KEY, now + cooldown.cooldownMs);
    }
  }

  return mult;
}

/**
 * Clip an oversized single player hit against this monster — mirror of the
 * player damage-cap (defense.max-hit-pct / max-hit-mult). Damage above
 * `capPct × maxHp` keeps the threshold and scales only the excess by `capMult`.
 * Partial only (never reduces to zero). No-op unless `enemySoftCap` is defined.
 */
export function applyEnemySoftCap(
  monster: MonsterEntity,
  def: MonsterDefinition | undefined,
  damage: number,
): number {
  const cap = def?.enemySoftCap;
  if (!cap || damage <= 0) return damage;
  const threshold = monster.hasHealth.maxHp * cap.capPct;
  if (damage <= threshold) return damage;
  return Math.ceil(threshold + (damage - threshold) * cap.capMult);
}

/**
 * Periodic absorb barrier on the monster — mirror of the player periodic shield
 * (defense.shield-pct). Lazily refreshes the barrier when its interval comes due
 * (sized `shieldPct × maxHp`, lasting `durationMs`) and drains incoming player
 * direct-hit damage off it before HP. Like the player shield it only sees the
 * combat-pipeline direct hit; a big burst pops it in one go while small chip
 * hits waste themselves against it. Deterministic (timer off `now`).
 *
 * Returns the post-absorb damage and the amount absorbed. No-op (absorbed 0)
 * unless `enemyShield` is defined.
 */
export function applyEnemyShield(
  monster: MonsterEntity,
  def: MonsterDefinition | undefined,
  damage: number,
  now: number,
): { damage: number; absorbed: number } {
  const shield = def?.enemyShield;
  if (!shield || damage <= 0) return { damage, absorbed: 0 };
  const cs = monster.tracksCombat;

  // New combat session: reset the cadence so the first barrier is up immediately
  // on combat entry (mirrors the player shield firing on combat entry).
  const session = combatSession(monster, now);
  if (getCounter(cs, SHIELD_SESSION_KEY) !== session) {
    setCounter(cs, SHIELD_SESSION_KEY, session);
    setCounter(cs, SHIELD_NEXT_KEY, session); // due immediately
    setCounter(cs, SHIELD_AMOUNT_KEY, 0);
    setCounter(cs, SHIELD_EXPIRES_KEY, 0);
  }

  // Refresh the barrier when the interval comes due.
  if (now >= getCounter(cs, SHIELD_NEXT_KEY)) {
    setCounter(
      cs,
      SHIELD_AMOUNT_KEY,
      Math.round(monster.hasHealth.maxHp * shield.shieldPct),
    );
    setCounter(cs, SHIELD_EXPIRES_KEY, now + shield.durationMs);
    setCounter(cs, SHIELD_NEXT_KEY, now + shield.intervalMs);
  }

  // Absorb only while the active barrier is still up.
  if (now >= getCounter(cs, SHIELD_EXPIRES_KEY)) return { damage, absorbed: 0 };
  const amount = getCounter(cs, SHIELD_AMOUNT_KEY);
  if (amount <= 0) return { damage, absorbed: 0 };

  const absorbed = Math.min(amount, damage);
  setCounter(cs, SHIELD_AMOUNT_KEY, amount - absorbed);
  return { damage: damage - absorbed, absorbed };
}
