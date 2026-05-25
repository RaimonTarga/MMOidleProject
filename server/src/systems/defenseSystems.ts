import type { PlayerState } from '@mmo-idle/shared';
import { GAME_CONFIG } from '@mmo-idle/shared';
import { registerCombatListener } from './combatPipeline';
import {
  getCounter, addCounter, setCounter,
  getResource, setResource, addResource,
  isCooldownActive, setCooldown,
} from './combatState';
import type { CombatState } from './combatState';
import { removeStatusEffectStacks } from './statusEffects';
import type { World } from '../world/World';

// ── Constants ─────────────────────────────────────────────────────────────────

const EVASION_KEY    = 'evasionHits';
const DEBT_POOL_KEY   = 'damageDebtPool';
const ABSORB_POOL_KEY = 'absorbPool';
const BURST_POOL_KEY  = 'regenBurstPool';

/** Duration over which hit-to-DoT debt and absorb pools drain (ms). */
const POOL_DRAIN_MS = 4000;
/** Duration over which regen burst pools drain (ms). Shorter = snappier burst feel. */
const BURST_DRAIN_MS = 2000;

// ── Antiheal / healing helpers ─────────────────────────────────────────────────

/**
 * Returns the healing multiplier for this entity (1 = full, 0.1 = hard floor).
 * Reads the 'antiheal' status effect; each stack reduces healing by
 * effect.data['reductionPerStack'] (default 0.20).
 * Apply this multiplier to every player heal source for consistency.
 */
export function getAntiHealMult(cs: CombatState): number {
  const effect = cs.statusEffects.find(e => e.id === 'antiheal');
  if (!effect) return 1;
  const reductionPerStack = effect.data['reductionPerStack'] ?? 0.20;
  return Math.max(0.1, 1 - effect.stacks * reductionPerStack);
}

/**
 * Returns [0, 1] — how much of a non-DoT debuff's magnitude reaches the player.
 * Future debuff-application code should multiply potency by this before applying.
 * Resistance is capped at 90% (multiplier floor 0.10).
 */
export function getDebuffResistanceMult(player: PlayerState): number {
  const resist = Math.min(0.9, player.passives['defense.debuff-resistance'] ?? 0);
  return 1 - resist;
}

/**
 * Apply healing to a player with antiheal and maxHp cap applied.
 * Use for every player heal source so antiheal is consistent.
 */
export function applyHealToPlayer(
  player: PlayerState,
  cs: CombatState,
  amount: number,
): void {
  if (amount <= 0) return;
  player.hp = Math.min(player.maxHp, player.hp + amount * getAntiHealMult(cs));
}

// ── Pool accessors (for buffSync) ─────────────────────────────────────────────

export function getDefenseDebtPool(cs: CombatState): number {
  return getResource(cs, DEBT_POOL_KEY);
}

export function getDefenseAbsorbPool(cs: CombatState): number {
  return getResource(cs, ABSORB_POOL_KEY);
}

export function getDefenseBurstPool(cs: CombatState): number {
  return getResource(cs, BURST_POOL_KEY);
}

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * Register all defense-layer combat pipeline listeners.
 * Call once at server startup after weapon/archetype effects so defense
 * listeners run last in onDamageTaken.
 *
 * Listener order within onDamageTaken (player as defender):
 *   1. Evasion         — may zero ctx.damage
 *   2. Damage cap      — clamps to defense.max-hit-pct of maxHp
 *   3. Shield          — absorbs remaining damage
 *   4. Hit-to-DoT      — redirects defense.hit-to-dot-pct to debt pool
 *   5. Damage absorb   — converts defense.absorb-pct of hit into HoT pool
 */
export function initDefenseSystems(): void {
  // ── 1. Evasion ─────────────────────────────────────────────────────────────
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.defenderType !== 'player') return;
    const player = ctx.defender as PlayerState;
    if (player.evasion <= 0) return;

    const state = world.playerCombatState.get(player.id);
    if (!state) return;

    addCounter(state, EVASION_KEY, 1);
    const count = getCounter(state, EVASION_KEY);

    if (count >= player.evasion) {
      setCounter(state, EVASION_KEY, 0);
      player.evasionCount    = 0;
      ctx.damage             = 0;
      ctx.metadata['evaded'] = true;
    } else {
      player.evasionCount = count;
    }
  });

  // ── 2. Damage cap ──────────────────────────────────────────────────────────
  // Clamps a single hit to at most defense.max-hit-pct × maxHp.
  // Runs after evasion (no-op on evaded hits) so only non-evaded damage is capped,
  // and before shields so shields only absorb the capped amount.
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.damage <= 0) return;

    const player = ctx.defender as PlayerState;
    const maxHitPct = player.passives['defense.max-hit-pct'] ?? 0;
    if (maxHitPct <= 0) return;

    ctx.damage = Math.min(ctx.damage, Math.ceil(player.maxHp * maxHitPct));
  });

  // ── 3. Shield absorption ───────────────────────────────────────────────────
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.damage <= 0) return;

    const player = ctx.defender as PlayerState;
    if (player.shields.length === 0) return;

    let remaining = ctx.damage;
    for (const shield of player.shields) {
      if (remaining <= 0) break;
      const absorbed = Math.min(shield.amount, remaining);
      shield.amount -= absorbed;
      remaining     -= absorbed;
    }
    player.shields = player.shields.filter(s => s.amount > 0);
    ctx.damage     = Math.max(0, remaining);
  });

  // ── 4. Hit-to-DoT conversion ───────────────────────────────────────────────
  // Takes defense.hit-to-dot-pct of surviving damage from ctx.damage and queues
  // it as a debt pool that drains over POOL_DRAIN_MS. DoT-tagged hits (isDot) are
  // skipped to prevent recursion. Deferred damage benefits from defense.dot-resistance
  // when it drains in updateDefensiveSystems.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.damage <= 0) return;
    if (ctx.metadata['isDot']) return;

    const player = ctx.defender as PlayerState;
    const conversionPct = player.passives['defense.hit-to-dot-pct'] ?? 0;
    if (conversionPct <= 0) return;

    const cs = world.playerCombatState.get(player.id);
    if (!cs) return;

    const debtAmount = ctx.damage * conversionPct;
    ctx.damage      -= debtAmount;
    addResource(cs, DEBT_POOL_KEY, debtAmount);
  });

  // ── Kill-triggered regen burst ────────────────────────────────────────────
  // When defense.kill-burst-pct > 0, each kill deposits that fraction of
  // maxHp into the burst pool. Drains back over POOL_DRAIN_MS the same as the
  // timer-based burst. Multiple kills stack (accumulate) in the pool.
  registerCombatListener('onKill', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    const player = ctx.attacker as PlayerState;
    const killBurstPct = player.passives['defense.kill-burst-pct'] ?? 0;
    if (killBurstPct <= 0) return;
    const cs = world.playerCombatState.get(player.id);
    if (!cs) return;
    addResource(cs, BURST_POOL_KEY, player.maxHp * killBurstPct);
  });

  // ── 5. Damage absorb ───────────────────────────────────────────────────────
  // Converts defense.absorb-pct of the final damage taken into a HoT pool
  // that drains back to the player over POOL_DRAIN_MS (antiheal applied on drain).
  // This is purely defensive — it scales with damage received, not damage dealt.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.damage <= 0) return;

    const player = ctx.defender as PlayerState;
    const absorbPct = player.passives['defense.absorb-pct'] ?? 0;
    if (absorbPct <= 0) return;

    const cs = world.playerCombatState.get(player.id);
    if (!cs) return;

    addResource(cs, ABSORB_POOL_KEY, ctx.damage * absorbPct);
  });
}

// ── Shield management ──────────────────────────────────────────────────────────

/**
 * Apply a temporary shield to a player.
 *
 * @param amount     Shield HP. Caller is responsible for scaling by maxHp if needed.
 * @param durationMs Duration in ms. 0 or negative = permanent until fully depleted.
 */
export function applyShield(player: PlayerState, amount: number, durationMs: number): void {
  if (amount <= 0) return;
  player.shields.push({
    amount,
    maxAmount: amount,
    remainingMs: durationMs > 0 ? durationMs : -1,
  });
}

/**
 * Convenience: apply a shield sized as a fraction of the player's max HP.
 * e.g. applyShieldPercent(player, 0.20, 5000) → 20% maxHp shield for 5 s.
 */
export function applyShieldPercent(
  player: PlayerState,
  pct: number,
  durationMs: number,
): void {
  applyShield(player, Math.round(player.maxHp * pct), durationMs);
}

/**
 * Tick shield timers and remove expired ones.
 * Call once per world tick, before combat resolution, so shields that
 * expire mid-tick are gone before they can absorb damage in that tick.
 */
export function updateShields(world: World, dt: number): void {
  for (const player of world.players.values()) {
    if (player.shields.length === 0) continue;

    for (const shield of player.shields) {
      if (shield.remainingMs > 0) {
        shield.remainingMs = Math.max(0, shield.remainingMs - dt);
      }
    }

    player.shields = player.shields.filter(
      s => s.amount > 0 && (s.remainingMs === -1 || s.remainingMs > 0),
    );
  }
}

// ── Per-tick defensive systems ─────────────────────────────────────────────────

/**
 * Run once per world tick after combat resolution.
 *
 * Handles all time-based defensive and recovery mechanics:
 *   - Damage debt drain (hit-to-DoT conversion delayed damage, with dot-resistance)
 *   - Damage absorb HoT drain
 *   - Regen burst trigger and pool drain
 *   - Periodic combat shield
 *   - Debuff cleanse
 *   - In-combat regen fraction
 */
export function updateDefensiveSystems(world: World, dt: number, now: number): void {
  for (const player of world.players.values()) {
    const cs = world.playerCombatState.get(player.id);
    if (!cs) continue;

    const lastCombatAt = world.playerCombatAt.get(player.id) ?? 0;
    const inCombat = player.attackTargetId !== null ||
      (now - lastCombatAt) < GAME_CONFIG.COMBAT_REGEN_DELAY;

    // ── Damage debt drain ──────────────────────────────────────────────────
    // Deferred damage from hit-to-DoT conversion. Fires once per second to
    // avoid sub-1 damage spam at 10 Hz. Each tick drains 1 s worth of the pool.
    const debtPool = getResource(cs, DEBT_POOL_KEY);
    if (debtPool > 0) {
      if (!isCooldownActive(cs, 'debtTick')) {
        setCooldown(cs, 'debtTick', 1000);
        const drainAmount = debtPool * (1000 / POOL_DRAIN_MS);
        const remaining   = debtPool - drainAmount;
        setResource(cs, DEBT_POOL_KEY, remaining < 0.5 ? 0 : remaining);

        const dotResist  = Math.min(0.9, player.passives['defense.dot-resistance'] ?? 0);
        const debtDamage = Math.round(drainAmount * (1 - dotResist));
        if (debtDamage >= 1) {
          player.hp = Math.max(0, player.hp - debtDamage);
          if (player.hp <= 0) {
            setResource(cs, DEBT_POOL_KEY, 0);
            world.respawnPlayer(player.id);
            continue;
          }
        }
      }
    }

    // ── Damage absorb HoT drain ───────────────────────────────────────────
    // Healing accumulated from damage taken drains back to the player over
    // POOL_DRAIN_MS. Antiheal is applied on each drain tick.
    const absorbPool = getResource(cs, ABSORB_POOL_KEY);
    if (absorbPool > 0) {
      const healAmount  = absorbPool * (dt / POOL_DRAIN_MS);
      const absorbLeft  = absorbPool - healAmount;
      setResource(cs, ABSORB_POOL_KEY, absorbLeft < 0.5 ? 0 : absorbLeft);
      applyHealToPlayer(player, cs, healAmount);
    }

    // ── Regen burst trigger ────────────────────────────────────────────────
    // Every defense.regen-burst-interval-ms, deposit defense.regen-burst-pct × maxHp
    // into the burst pool (in-combat only). Both keys must be > 0 to activate.
    const burstPct        = player.passives['defense.regen-burst-pct'] ?? 0;
    const burstIntervalMs = player.passives['defense.regen-burst-interval-ms'] ?? 0;
    if (burstPct > 0 && burstIntervalMs > 0) {
      if (!isCooldownActive(cs, 'regenBurst') && inCombat) {
        addResource(cs, BURST_POOL_KEY, player.maxHp * burstPct);
        setCooldown(cs, 'regenBurst', burstIntervalMs);
      }
    }

    // ── Burst pool drain ──────────────────────────────────────────────────
    // Drains over BURST_DRAIN_MS regardless of source (timer burst or kill burst).
    const burstPool = getResource(cs, BURST_POOL_KEY);
    if (burstPool > 0) {
      const healAmount = burstPool * (dt / BURST_DRAIN_MS);
      const burstLeft  = burstPool - healAmount;
      setResource(cs, BURST_POOL_KEY, burstLeft < 0.5 ? 0 : burstLeft);
      applyHealToPlayer(player, cs, healAmount);
    }

    // ── Periodic combat shield ─────────────────────────────────────────────
    // When in combat and the cooldown is ready, apply a permanent (lasts until
    // consumed) shield sized at defense.shield-pct × maxHp.
    // The cooldown ticks down regardless of combat state, so:
    //   - On first combat entry the cooldown is 0 → shield fires immediately.
    //   - Subsequent applications repeat every defense.shield-interval-ms while
    //     in combat; the cooldown freezes (checked but not reset) while out of combat.
    const shieldPct        = player.passives['defense.shield-pct'] ?? 0;
    const shieldIntervalMs = player.passives['defense.shield-interval-ms'] ?? 0;
    if (shieldPct > 0 && shieldIntervalMs > 0 && inCombat) {
      if (!isCooldownActive(cs, 'shieldRegen')) {
        const shieldDurationMs = player.passives['defense.shield-duration-ms'] ?? -1;
        applyShieldPercent(player, shieldPct, shieldDurationMs);
        setCooldown(cs, 'shieldRegen', shieldIntervalMs);
      }
    }

    // ── Debuff cleanse ─────────────────────────────────────────────────────
    // Every defense.cleanse-interval-ms, remove defense.cleanse-stacks stacks
    // from every non-DoT status effect on the player (antiheal, slows, etc.).
    // DoT effects (data.isDot === 1) are skipped; instanced effects are left
    // to a future cleanse pass when player debuffs are implemented.
    const cleanseStacks    = Math.round(player.passives['defense.cleanse-stacks'] ?? 0);
    const cleanseIntervalMs = player.passives['defense.cleanse-interval-ms'] ?? 0;
    if (cleanseStacks > 0 && cleanseIntervalMs > 0) {
      if (!isCooldownActive(cs, 'cleanse')) {
        const toReduce = [...new Set(
          cs.statusEffects
            .filter(e => !e.data['isDot'] && !e.instanced)
            .map(e => e.id),
        )];
        for (const id of toReduce) {
          removeStatusEffectStacks(cs, id, cleanseStacks);
        }
        setCooldown(cs, 'cleanse', cleanseIntervalMs);
      }
    }

    // ── In-combat regen ────────────────────────────────────────────────────
    // While the player has an active attack target, applies defense.in-combat-regen-pct
    // fraction of the out-of-combat regen rate. Antiheal applies.
    const inCombatRegenPct = player.passives['defense.in-combat-regen-pct'] ?? 0;
    if (inCombatRegenPct > 0 && player.attackTargetId !== null) {
      const baseRegenPerMs = player.maxHp * (player.hpRegen / 100) / 1000;
      applyHealToPlayer(player, cs, baseRegenPerMs * inCombatRegenPct * dt);
    }
  }
}
