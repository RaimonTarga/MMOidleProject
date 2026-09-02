import {
  MONSTER_DATABASE,
  NODE_BIOMES,
  NODE_MODIFIERS,
  getCounter,
  getStatusEffect,
  modifiedDotDamagePerStack,
  removeStatusEffect,
  setCounter,
  type MonsterDefinition,
  type MonsterDotEffect,
  type Vec2,
} from "@mmo-idle/shared";
import type { MonsterEntity } from "../../../ecs/entity";

export const BOSS_ROAR_HASTE_EFFECT_ID = "boss-roar-haste";

/** Effective basic-attack cadence after temporary roar haste and combat ramping. */
export function monsterAttackCooldown(monster: MonsterEntity): number {
  const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  const rampPct = def?.rampOnCombat?.stat === "attackSpeed"
    ? Math.max(0, monster.controlsMonster.rampPct ?? 0)
    : 0;
  const roar = getStatusEffect(monster.tracksCombat, BOSS_ROAR_HASTE_EFFECT_ID);
  const roarPct = Math.max(0, roar?.data.attackSpeedPct ?? 0);
  const castedBuffPct = monster.tracksCombat.statusEffects.reduce(
    (total, effect) => effect.remainingMs !== 0 && effect.data.monsterAttackSpeedBuff === 1
      ? total + Math.max(0, effect.data.attackSpeedPct ?? 0)
      : total,
    0,
  );
  return Math.max(
    100,
    Math.round(monster.performsAttack.attackCooldown / (1 + rampPct + roarPct + castedBuffPct)),
  );
}

// ── T4 monster mechanics ────────────────────────────────────────────────────
//
// Server-side ports of four player mechanics onto the monster→player (and
// player→monster) directions. All are deterministic (counters / timers off the
// authoritative tick clock — no RNG), matching the game's core invariant.
//
// State lives on the monster's `tracksCombat` scratch (runtime-only, freed on
// despawn). Keys are private to this module — do not reuse them elsewhere.

const CADENCE_COUNTER_KEY = "t4CadenceCount";
// The tick on which a cadence finisher last fired. Read by the Constrict root
// rider so it lands only on the boosted beat, without threading a return-shape
// change through every caller of monsterEmpoweredMultiplier.
const CADENCE_FIRED_AT_KEY = "cadenceFiredAt";
// Private counter for a node Volatility overlay cadence when the def itself has
// NO cadenceFinisher (kept separate from CADENCE_COUNTER_KEY so they never mix).
const EMP_CD_NEXT_KEY = "t4EmpCooldownNextAt";
const EMP_CD_SESSION_KEY = "t4EmpCooldownSession";
const OPENING_FIRED_SESSION_KEY = "openingStrikeFiredSession";
const SHIELD_AMOUNT_KEY = "t4EnemyShieldAmount";
const SHIELD_EXPIRES_KEY = "t4EnemyShieldExpiresAt";
const SHIELD_NEXT_KEY = "t4EnemyShieldNextAt";
const SHIELD_SESSION_KEY = "t4EnemyShieldSession";
// Clean-recharge barrier (`enemyShield.rechargeAfterCleanMs`): the last time this
// monster was hit. The barrier returns only once `now` clears it by the configured
// window, and every landed hit pushes it forward again.
const SHIELD_LAST_HIT_KEY = "enemyShieldLastHitAt";
// Volley counters — beat-keyed, deliberately separate from CADENCE_COUNTER_KEY so
// a cadence volley and a cadence finisher never share a counter.
const VOLLEY_COUNTER_KEY = "volleyBeatCount";
const OPENING_VOLLEY_SESSION_KEY = "openingVolleyFiredSession";
// Venomous opener (`dotEffect.openerStacks`): the session whose first hit has
// already paid out the multi-stack bite.
const DOT_OPENER_SESSION_KEY = "dotOpenerFiredSession";

// Charged (cast-time) attack state — the telegraphed Power-Shot wind-up.
const CHARGE_CAST_ENDS_KEY = "chargeCastEndsAt"; // >now while winding up (0 = idle)
const CHARGE_CD_NEXT_KEY = "chargeCdNextAt"; // earliest time the next cast may begin
const CHARGE_SESSION_KEY = "chargeSession"; // combat-session token (re-arm on engage)
// Planted impact point of an `aoe` charge. Captured once at cast start and never
// re-read from the target, which is what makes the slam COMMITTED: the circle
// lands where it was drawn, so walking out of it is real counterplay.
const CHARGE_AOE_X_KEY = "chargeAoeX";
const CHARGE_AOE_Y_KEY = "chargeAoeY";
// Marks that the pending cast is a planted ground slam (1) rather than a
// target-following power shot (0). Read on the out-of-range bail path.
const CHARGE_AOE_ACTIVE_KEY = "chargeAoeActive";
const BUFF_CAST_ENDS_KEY = "buffCastEndsAt";
const BUFF_CAST_CD_NEXT_KEY = "buffCastCdNextAt";
const BUFF_CAST_SESSION_KEY = "buffCastSession";
const LOW_HEALTH_WARD_CAST_ENDS_KEY = "lowHealthWardCastEndsAt";
const LOW_HEALTH_WARD_USED_KEY = "lowHealthWardUsed";

/** Combat-entry timestamp for the monster's current aggro session (or `now`). */
function combatSession(monster: MonsterEntity, now: number): number {
  return monster.hasAggroTarget?.sinceMs ?? now;
}

/**
 * The DoT effect this monster actually applies on hit, in precedence order:
 *   boss morph override → the def's own DoT, scaled by the node modifier.
 * Only the SOURCE and MAGNITUDE change, so evade rules, shield-bypass, and the buff
 * UI all flow through unchanged.
 *
 * The modifier scale is derived from the monster's node rather than baked in at
 * spawn, because a boss morph can swap the DoT mid-fight and the override must not
 * inherit a multiplier computed for a different effect. Bosses are modifier-immune,
 * matching their stat immunity.
 */
export function effectiveMonsterDot(
  monster: MonsterEntity,
  def: MonsterDefinition | undefined,
): MonsterDotEffect | undefined {
  const override = monster.scriptsBoss?.dotEffectOverride;
  if (override) return override;
  const dot = def?.dotEffect;
  if (!dot || monster.isMonster.isBoss) return dot;

  const nodeId = monster.hasPosition.nodeId;
  const modifier = NODE_MODIFIERS[nodeId]?.modifier;
  if (!modifier) return dot;
  const damagePerStack = modifiedDotDamagePerStack(
    dot.damagePerStack,
    modifier,
    NODE_BIOMES[nodeId]?.biomeTier ?? 0,
  );
  return damagePerStack === dot.damagePerStack ? dot : { ...dot, damagePerStack };
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
    if (count % cadence.everyNAttacks === 0) {
      mult *= cadence.multiplier;
      setCounter(cs, CADENCE_FIRED_AT_KEY, now);
    }
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

  // Opening strike — the FIRST landed attack of each combat session is amplified
  // (the ambush pounce / duelist's lethal opener), then disarms until the monster
  // re-engages (a new session). Session-keyed like empoweredCooldown, so it re-arms
  // every fresh aggro rather than once per life. Deterministic (no RNG).
  // Also fires when injected at spawn via tracksDungeon.openingStrikeMult (guardians).
  const openingMult =
    monster.tracksDungeon?.openingStrikeMult ?? def?.openingStrike?.multiplier ?? 1;
  if (openingMult > 1) {
    const session = combatSession(monster, now);
    if (getCounter(cs, OPENING_FIRED_SESSION_KEY) !== session) {
      mult *= openingMult;
      setCounter(cs, OPENING_FIRED_SESSION_KEY, session);
    }
  }

  return mult;
}

/**
 * How many full combat-pipeline hits this attack BEAT delivers.
 *
 * Three sources, in precedence order (highest wins — they never multiply, because
 * a mob that stacked an opening volley on top of a cadence volley would fire a
 * wall of projectiles on one beat):
 *
 *   openingVolley  the FIRST beat of each combat session (the Chameleon uncloaking
 *                  and emptying two shots before you have closed);
 *   cadenceVolley  every Nth beat (the Thorn Spitter's periodic burst);
 *   consecutiveHits the flat, always-on multi-hit already in the schema.
 *
 * Deterministic — session tokens and counters off the authoritative clock, no RNG.
 * Mutates counters, so call EXACTLY ONCE per attack beat (not once per hit).
 */
export function monsterVolleyHits(
  monster: MonsterEntity,
  def: MonsterDefinition | undefined,
  now: number,
): number {
  const cs = monster.tracksCombat;
  const base = Math.max(1, Math.round(def?.consecutiveHits ?? 1));

  const cadence = def?.cadenceVolley;
  let cadenceHits = 0;
  if (cadence && cadence.everyNAttacks > 0) {
    const count = getCounter(cs, VOLLEY_COUNTER_KEY) + 1;
    setCounter(cs, VOLLEY_COUNTER_KEY, count);
    if (count % cadence.everyNAttacks === 0) {
      cadenceHits = Math.max(1, Math.round(cadence.hits));
    }
  }

  const opening = def?.openingVolley;
  if (opening && opening.hits > 1) {
    const session = combatSession(monster, now);
    if (getCounter(cs, OPENING_VOLLEY_SESSION_KEY) !== session) {
      setCounter(cs, OPENING_VOLLEY_SESSION_KEY, session);
      return Math.max(base, cadenceHits, Math.round(opening.hits));
    }
  }

  return Math.max(base, cadenceHits);
}

/**
 * VENOMOUS OPENER — how many DoT stacks this landed hit should apply.
 *
 * 1 for an ordinary bite; `dotEffect.openerStacks` for the first landed hit of a
 * combat session. Session-keyed and consumed on the first hit that actually lands,
 * so a whiffed or evaded opener does not silently burn the ambush.
 */
export function monsterDotStacksForHit(
  monster: MonsterEntity,
  dot: MonsterDotEffect | undefined,
  now: number,
): number {
  const opener = dot?.openerStacks;
  if (!opener || opener <= 1) return 1;
  const cs = monster.tracksCombat;
  const session = combatSession(monster, now);
  if (getCounter(cs, DOT_OPENER_SESSION_KEY) === session) return 1;
  setCounter(cs, DOT_OPENER_SESSION_KEY, session);
  return Math.min(Math.round(opener), dot!.maxStacks);
}

/** True when this monster's cadence finisher fired on THIS tick. */
export function cadenceFiredThisTick(monster: MonsterEntity, now: number): boolean {
  return getCounter(monster.tracksCombat, CADENCE_FIRED_AT_KEY) === now;
}

/** Record a landed player hit, for the clean-recharge barrier's idle timer. */
export function noteMonsterHitTaken(monster: MonsterEntity, now: number): void {
  setCounter(monster.tracksCombat, SHIELD_LAST_HIT_KEY, now);
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
  setCounter(monster.tracksCombat, CHARGE_AOE_ACTIVE_KEY, 0);
}

/**
 * Plant the impact point of an `aoe` charge. Called once, immediately after
 * `beginCharge`, with the target's position AT CAST START.
 */
export function plantChargeAoe(monster: MonsterEntity, at: Vec2): void {
  const cs = monster.tracksCombat;
  setCounter(cs, CHARGE_AOE_ACTIVE_KEY, 1);
  setCounter(cs, CHARGE_AOE_X_KEY, at.x);
  setCounter(cs, CHARGE_AOE_Y_KEY, at.y);
}

/** True while the pending cast is a planted ground slam. */
export function isChargeAoePlanted(monster: MonsterEntity): boolean {
  return getCounter(monster.tracksCombat, CHARGE_AOE_ACTIVE_KEY) === 1;
}

/** The planted impact point, or null when the pending cast isn't a slam. */
export function chargeAoeImpactPoint(monster: MonsterEntity): Vec2 | null {
  const cs = monster.tracksCombat;
  if (getCounter(cs, CHARGE_AOE_ACTIVE_KEY) !== 1) return null;
  return { x: getCounter(cs, CHARGE_AOE_X_KEY), y: getCounter(cs, CHARGE_AOE_Y_KEY) };
}

/** Consume a completed cast and put the charged attack on cooldown. */
export function completeCharge(
  monster: MonsterEntity,
  now: number,
  cooldownMs: number,
): void {
  setCounter(monster.tracksCombat, CHARGE_CAST_ENDS_KEY, 0);
  setCounter(monster.tracksCombat, CHARGE_AOE_ACTIVE_KEY, 0);
  setCounter(monster.tracksCombat, CHARGE_CD_NEXT_KEY, now + cooldownMs);
}

/** Abort an in-progress wind-up (interrupt / out-of-range / target lost). Leaves
 *  the cooldown untouched so it retries once the situation allows. */
export function cancelCharge(monster: MonsterEntity): void {
  setCounter(monster.tracksCombat, CHARGE_CAST_ENDS_KEY, 0);
  setCounter(monster.tracksCombat, CHARGE_AOE_ACTIVE_KEY, 0);
}

/** Timestamp the current non-damaging buff cast completes at (0 when idle). */
export function castedBuffCastEndsAt(monster: MonsterEntity): number {
  return getCounter(monster.tracksCombat, BUFF_CAST_ENDS_KEY);
}

/** True when a cast-time haste boon is ready in this combat session. */
export function castedBuffReady(
  monster: MonsterEntity,
  now: number,
  initialCooldownMs: number,
): boolean {
  const cs = monster.tracksCombat;
  const session = combatSession(monster, now);
  if (getCounter(cs, BUFF_CAST_SESSION_KEY) !== session) {
    setCounter(cs, BUFF_CAST_SESSION_KEY, session);
    setCounter(cs, BUFF_CAST_CD_NEXT_KEY, session + initialCooldownMs);
    setCounter(cs, BUFF_CAST_ENDS_KEY, 0);
  }
  return now >= getCounter(cs, BUFF_CAST_CD_NEXT_KEY);
}

export function beginCastedBuff(monster: MonsterEntity, now: number, castMs: number): void {
  setCounter(monster.tracksCombat, BUFF_CAST_ENDS_KEY, now + castMs);
}

export function completeCastedBuff(monster: MonsterEntity, now: number, cooldownMs: number): void {
  setCounter(monster.tracksCombat, BUFF_CAST_ENDS_KEY, 0);
  setCounter(monster.tracksCombat, BUFF_CAST_CD_NEXT_KEY, now + cooldownMs);
}

export function cancelCastedBuff(monster: MonsterEntity): void {
  setCounter(monster.tracksCombat, BUFF_CAST_ENDS_KEY, 0);
}

/** Timestamp the one-time low-health ward cast resolves (0 while idle). */
export function lowHealthWardCastEndsAt(monster: MonsterEntity): number {
  return getCounter(monster.tracksCombat, LOW_HEALTH_WARD_CAST_ENDS_KEY);
}

/** A ward becomes available once per life after the monster crosses its HP threshold. */
export function lowHealthWardReady(
  monster: MonsterEntity,
  ward: NonNullable<MonsterDefinition['lowHealthWard']>,
): boolean {
  return (
    getCounter(monster.tracksCombat, LOW_HEALTH_WARD_USED_KEY) === 0 &&
    monster.hasHealth.hp <= monster.hasHealth.maxHp * ward.thresholdPct
  );
}

export function beginLowHealthWard(monster: MonsterEntity, now: number, castMs: number): void {
  setCounter(monster.tracksCombat, LOW_HEALTH_WARD_CAST_ENDS_KEY, now + castMs);
}

export function completeLowHealthWard(monster: MonsterEntity): void {
  setCounter(monster.tracksCombat, LOW_HEALTH_WARD_CAST_ENDS_KEY, 0);
  setCounter(monster.tracksCombat, LOW_HEALTH_WARD_USED_KEY, 1);
}

export function cancelLowHealthWard(monster: MonsterEntity): void {
  setCounter(monster.tracksCombat, LOW_HEALTH_WARD_CAST_ENDS_KEY, 0);
}

/** Drain a temporary casted ward before any periodic enemy shield. */
function applyCastedMonsterWard(
  monster: MonsterEntity,
  damage: number,
): { damage: number; absorbed: number } {
  if (damage <= 0) return { damage, absorbed: 0 };
  const ward = monster.tracksCombat.statusEffects.find(effect =>
    effect.remainingMs > 0 && effect.data.monsterWard === 1 && (effect.data.wardAmount ?? 0) > 0,
  );
  if (!ward) return { damage, absorbed: 0 };
  const amount = Math.max(0, Math.round(ward.data.wardAmount ?? 0));
  const absorbed = Math.min(amount, damage);
  ward.data.wardAmount = amount - absorbed;
  if (ward.data.wardAmount <= 0) removeStatusEffect(monster.tracksCombat, ward.id);
  return { damage: damage - absorbed, absorbed };
}

/** Spend one upcoming-attack haste charge after a monster completes a basic beat. */
export function consumeMonsterAttackSpeedCharge(monster: MonsterEntity): void {
  for (const effect of monster.tracksCombat.statusEffects) {
    if (effect.data.monsterAttackSpeedBuff !== 1) continue;
    const remaining = Math.max(0, Math.round(effect.data.attacksRemaining ?? 0));
    if (remaining <= 0) continue;
    if (remaining <= 1) {
      removeStatusEffect(monster.tracksCombat, effect.id);
      return;
    }
    effect.data.attacksRemaining = remaining - 1;
    effect.stacks = remaining - 1;
    return;
  }
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

export interface EnemyShieldRuntimeState {
  shield: NonNullable<MonsterDefinition['enemyShield']>;
  amount: number;
  expiresAt: number;
  nextAt: number;
  lastHitAt: number;
  activated: boolean;
}

/**
 * Advance the deterministic enemy-barrier cadence even when no hit lands this
 * tick. Combat used to refresh this state lazily on the next incoming hit, which
 * was mechanically equivalent but left the client with nothing authoritative to
 * render between hits. Both combat and the presentation mirror share this path.
 */
export function refreshEnemyShieldState(
  monster: MonsterEntity,
  def: MonsterDefinition | undefined,
  now: number,
): EnemyShieldRuntimeState | undefined {
  if (monster.scriptsBoss?.defenseShed) return undefined;
  const shield = monster.scriptsBoss?.shieldOverride ?? def?.enemyShield;
  if (!shield) return undefined;
  const cs = monster.tracksCombat;
  const session = combatSession(monster, now);

  if (getCounter(cs, SHIELD_SESSION_KEY) !== session) {
    setCounter(cs, SHIELD_SESSION_KEY, session);
    setCounter(cs, SHIELD_NEXT_KEY, session);
    setCounter(cs, SHIELD_AMOUNT_KEY, 0);
    setCounter(cs, SHIELD_EXPIRES_KEY, 0);
    setCounter(cs, SHIELD_LAST_HIT_KEY, session - (shield.rechargeAfterCleanMs ?? 0));
  }

  if (
    getCounter(cs, SHIELD_AMOUNT_KEY) > 0 &&
    now >= getCounter(cs, SHIELD_EXPIRES_KEY)
  ) {
    setCounter(cs, SHIELD_AMOUNT_KEY, 0);
  }

  let activated = false;
  const cleanMs = shield.rechargeAfterCleanMs;
  if (cleanMs !== undefined) {
    const lastHitAt = getCounter(cs, SHIELD_LAST_HIT_KEY);
    const barrierLifetimeOpen = now < getCounter(cs, SHIELD_EXPIRES_KEY);
    if (!barrierLifetimeOpen && lastHitAt > 0 && now - lastHitAt >= cleanMs) {
      setCounter(cs, SHIELD_AMOUNT_KEY, Math.round(monster.hasHealth.maxHp * shield.shieldPct));
      setCounter(cs, SHIELD_EXPIRES_KEY, now + shield.durationMs);
      activated = true;
    }
  } else if (now >= getCounter(cs, SHIELD_NEXT_KEY)) {
    setCounter(cs, SHIELD_AMOUNT_KEY, Math.round(monster.hasHealth.maxHp * shield.shieldPct));
    setCounter(cs, SHIELD_EXPIRES_KEY, now + shield.durationMs);
    setCounter(cs, SHIELD_NEXT_KEY, now + shield.intervalMs);
    activated = true;
  }

  return {
    shield,
    amount: Math.max(0, getCounter(cs, SHIELD_AMOUNT_KEY)),
    expiresAt: getCounter(cs, SHIELD_EXPIRES_KEY),
    nextAt: getCounter(cs, SHIELD_NEXT_KEY),
    lastHitAt: getCounter(cs, SHIELD_LAST_HIT_KEY),
    activated,
  };
}

/**
 * Periodic absorb shield on the monster. NOT the player's barrier — this one is
 * timed and cyclic. Lazily refreshes the shield when its interval comes due
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
  const castedWard = applyCastedMonsterWard(monster, damage);
  damage = castedWard.damage;
  const runtime = refreshEnemyShieldState(monster, def, now);
  if (!runtime || damage <= 0) return { damage, absorbed: castedWard.absorbed, broke: false };

  // Absorb only while the active barrier is still up.
  if (now >= runtime.expiresAt) return { damage, absorbed: castedWard.absorbed, broke: false };
  const amount = runtime.amount;
  if (amount <= 0) return { damage, absorbed: castedWard.absorbed, broke: false };

  const absorbed = Math.min(amount, damage);
  const remaining = amount - absorbed;
  setCounter(monster.tracksCombat, SHIELD_AMOUNT_KEY, remaining);
  // The barrier broke if this hit drained the last of it (was up, now empty).
  return { damage: damage - absorbed, absorbed: castedWard.absorbed + absorbed, broke: remaining <= 0 };
}
