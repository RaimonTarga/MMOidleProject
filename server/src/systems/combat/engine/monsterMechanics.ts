import {
  getCounter,
  setCounter,
  type MonsterDefinition,
  type MonsterDotEffect,
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
// Private counter for a node Volatility overlay cadence when the def itself has
// NO cadenceFinisher (kept separate from CADENCE_COUNTER_KEY so they never mix).
const VOLATILITY_CADENCE_KEY = "nodeVolatilityCadence";
const EMP_CD_NEXT_KEY = "t4EmpCooldownNextAt";
const EMP_CD_SESSION_KEY = "t4EmpCooldownSession";
const OPENING_FIRED_SESSION_KEY = "openingStrikeFiredSession";
const SHIELD_AMOUNT_KEY = "t4EnemyShieldAmount";
const SHIELD_EXPIRES_KEY = "t4EnemyShieldExpiresAt";
const SHIELD_NEXT_KEY = "t4EnemyShieldNextAt";
const SHIELD_SESSION_KEY = "t4EnemyShieldSession";

// Charged (cast-time) attack state — the telegraphed Power-Shot wind-up.
const CHARGE_CAST_ENDS_KEY = "chargeCastEndsAt"; // >now while winding up (0 = idle)
const CHARGE_CD_NEXT_KEY = "chargeCdNextAt"; // earliest time the next cast may begin
const CHARGE_SESSION_KEY = "chargeSession"; // combat-session token (re-arm on engage)

/** Combat-entry timestamp for the monster's current aggro session (or `now`). */
function combatSession(monster: MonsterEntity, now: number): number {
  return monster.hasAggroTarget?.sinceMs ?? now;
}

/**
 * The DoT effect this monster actually applies on hit, in precedence order:
 *   boss morph override → node Blight overlay (Map Variety) → the def's own DoT.
 * Only the SOURCE of the effect changes, so evade rules, shield-bypass, and the
 * buff UI all flow through unchanged.
 */
export function effectiveMonsterDot(
  monster: MonsterEntity,
  def: MonsterDefinition | undefined,
): MonsterDotEffect | undefined {
  return (
    monster.scriptsBoss?.dotEffectOverride ??
    monster.moddedByNode?.dot ??
    def?.dotEffect
  );
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
  const overlayCadence = monster.moddedByNode?.cadence;
  if (cadence && cadence.everyNAttacks > 0) {
    const count = getCounter(cs, CADENCE_COUNTER_KEY) + 1;
    if (count % cadence.everyNAttacks === 0) {
      // A node Volatility overlay amplifies the def's own cadence on the SAME
      // beat (never a second independent counter).
      mult *= cadence.multiplier * (overlayCadence?.multiplier ?? 1);
    }
    setCounter(cs, CADENCE_COUNTER_KEY, count);
  } else if (overlayCadence && overlayCadence.everyNAttacks > 0) {
    // Synthesized Volatility cadence — the def had no cadenceFinisher, so run the
    // overlay pattern off its own private counter.
    const count = getCounter(cs, VOLATILITY_CADENCE_KEY) + 1;
    if (count % overlayCadence.everyNAttacks === 0) mult *= overlayCadence.multiplier;
    setCounter(cs, VOLATILITY_CADENCE_KEY, count);
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

  // Opening strike — the FIRST landed attack of each combat session is amplified
  // (the ambush pounce / duelist's lethal opener), then disarms until the monster
  // re-engages (a new session). Session-keyed like empoweredCooldown, so it re-arms
  // every fresh aggro rather than once per life. Deterministic (no RNG).
  // Also fires when injected at spawn via tracksDungeon.openingStrikeMult (guardians).
  // Existing chain (dungeon injection OR the def's own opener) times the node
  // Predation overlay, folded in multiplicatively.
  const baseOpening =
    monster.tracksDungeon?.openingStrikeMult ?? def?.openingStrike?.multiplier ?? 1;
  const openingMult = baseOpening * (monster.moddedByNode?.openingStrikeMult ?? 1);
  if (openingMult > 1) {
    const session = combatSession(monster, now);
    if (getCounter(cs, OPENING_FIRED_SESSION_KEY) !== session) {
      mult *= openingMult;
      setCounter(cs, OPENING_FIRED_SESSION_KEY, session);
    }
  }

  return mult;
}

// ── Charged (cast-time) attacks ──────────────────────────────────────────────
//
// A telegraphed big hit: when the per-combat cooldown is ready and the monster is
// in range, it begins a cast (a cast bar shows client-side); the caller skips
// movement/normal attacks during the wind-up, then resolves a ×multiplier hit when
// it completes. Stun/freeze during the wind-up interrupts it. State lives on the
// monster's `tracksCombat` scratch; keys are private to this module.

/** True while the monster is mid wind-up of a charged attack. */
export function isMonsterCharging(monster: MonsterEntity, now: number): boolean {
  return getCounter(monster.tracksCombat, CHARGE_CAST_ENDS_KEY) > now;
}

/** Timestamp the current wind-up completes at (0 when not casting). */
export function chargedCastEndsAt(monster: MonsterEntity): number {
  return getCounter(monster.tracksCombat, CHARGE_CAST_ENDS_KEY);
}

/**
 * Whether the charged attack is ARMED (off its per-combat cooldown). The caller
 * only consults this at a normal-attack opportunity, so an armed charge turns the
 * mob's NEXT attack into the cast. Re-arms on a new combat session using
 * `initialCooldownMs` (session-keyed like empoweredCooldown) so the first cast
 * lands a couple of attacks in; `completeCharge` then uses the recurring cooldown.
 */
export function chargeReady(
  monster: MonsterEntity,
  now: number,
  initialCooldownMs: number,
): boolean {
  const cs = monster.tracksCombat;
  const session = combatSession(monster, now);
  if (getCounter(cs, CHARGE_SESSION_KEY) !== session) {
    setCounter(cs, CHARGE_SESSION_KEY, session);
    setCounter(cs, CHARGE_CD_NEXT_KEY, session + initialCooldownMs);
    setCounter(cs, CHARGE_CAST_ENDS_KEY, 0);
  }
  return now >= getCounter(cs, CHARGE_CD_NEXT_KEY);
}

/** Open a `castMs` wind-up. */
export function beginCharge(
  monster: MonsterEntity,
  now: number,
  castMs: number,
): void {
  setCounter(monster.tracksCombat, CHARGE_CAST_ENDS_KEY, now + castMs);
}

/** Consume a completed cast and put the charged attack on cooldown. */
export function completeCharge(
  monster: MonsterEntity,
  now: number,
  cooldownMs: number,
): void {
  setCounter(monster.tracksCombat, CHARGE_CAST_ENDS_KEY, 0);
  setCounter(monster.tracksCombat, CHARGE_CD_NEXT_KEY, now + cooldownMs);
}

/** Abort an in-progress wind-up (interrupt / out-of-range / target lost). Leaves
 *  the cooldown untouched so it retries once the situation allows. */
export function cancelCharge(monster: MonsterEntity): void {
  setCounter(monster.tracksCombat, CHARGE_CAST_ENDS_KEY, 0);
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
  // shed-defense suppresses both the runtime override and any static cap.
  if (monster.scriptsBoss?.defenseShed) return damage;
  const cap = monster.scriptsBoss?.softCapOverride ?? def?.enemySoftCap;
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
 * Returns the post-absorb damage, the amount absorbed, and whether THIS hit broke
 * the barrier (depleted it to zero) — the Tundra ice-armor shatter trigger. No-op
 * (absorbed 0, broke false) unless `enemyShield` is defined.
 */
export function applyEnemyShield(
  monster: MonsterEntity,
  def: MonsterDefinition | undefined,
  damage: number,
  now: number,
): { damage: number; absorbed: number; broke: boolean } {
  // shed-defense suppresses both the runtime override and any static barrier.
  if (monster.scriptsBoss?.defenseShed) return { damage, absorbed: 0, broke: false };
  const shield = monster.scriptsBoss?.shieldOverride ?? def?.enemyShield;
  if (!shield || damage <= 0) return { damage, absorbed: 0, broke: false };
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
  if (now >= getCounter(cs, SHIELD_EXPIRES_KEY)) return { damage, absorbed: 0, broke: false };
  const amount = getCounter(cs, SHIELD_AMOUNT_KEY);
  if (amount <= 0) return { damage, absorbed: 0, broke: false };

  const absorbed = Math.min(amount, damage);
  const remaining = amount - absorbed;
  setCounter(cs, SHIELD_AMOUNT_KEY, remaining);
  // The barrier broke if this hit drained the last of it (was up, now empty).
  return { damage: damage - absorbed, absorbed, broke: remaining <= 0 };
}
