import type { TracksCombat, WorldLogActor } from '@mmo-idle/shared';
import type { MinionEntity, PlayerEntity } from '../../../ecs/entity';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import type { World } from '../../../world/World';
import { recordWorldLogEvent } from '../../../world/worldLog';
import { actorFromMinion, actorFromPlayer } from '../../../world/worldLogActors';
import { applyWard } from '../barrier/wards';
import { getCounter, setCounter } from '@mmo-idle/shared';

/**
 * Heal-log carry. Flat Recovery heals in sub-1 HP slices at 10 Hz, and logging each
 * slice rounded (0.5 -> 1, 0.4 -> 0) over-reported some classes by ~75% and reported
 * zero healing for others (T1 boss pass, 2026-10-02). HP was always right; only the
 * log was wrong. The exact applied amount is accumulated in a server-only counter and
 * logged in whole points as it crosses each integer, so the logged total matches the
 * HP ledger to within one point at any moment.
 */
const HEAL_LOG_CARRY = 'heal-log-carry';

function takeLoggableHeal(cs: TracksCombat, exactApplied: number): number {
  if (exactApplied <= 0) return 0;
  const carry = getCounter(cs, HEAL_LOG_CARRY) + exactApplied;
  const whole = Math.floor(carry);
  setCounter(cs, HEAL_LOG_CARRY, carry - whole);
  return whole;
}

// Duration of the temporary ward minted from overheal (defense.overheal-ward-pct).
const OVERHEAL_WARD_MS = 6000;

/**
 * A consumer of the HP a heal spills past full, beside the overheal-ward passive
 * (the "overheal-ward hook"). Handed only what the passive did not convert, so a
 * spill is never turned into a ward twice. Registered once per process by the
 * combat bootstrap's keystone registration (Recuperate's Overflow, design §22.4),
 * so this module imports no keystone.
 */
export type OverhealSink = (world: World, player: PlayerEntity, overheal: number) => void;

const overhealSinks: OverhealSink[] = [];

/** Hang a consumer off the overheal hook. Called once per process. */
export function registerOverhealSink(sink: OverhealSink): void {
  overhealSinks.push(sink);
}

/**
 * Returns the healing multiplier for this entity (1 = full, 0.1 = hard floor).
 */
export function getAntiHealMult(cs: TracksCombat): number {
  const effect = cs.statusEffects.find(e => e.id === 'antiheal');
  if (!effect) return 1;
  const reductionPerStack = effect.data['reductionPerStack'] ?? 0.20;
  return Math.max(0.1, 1 - effect.stacks * reductionPerStack);
}

export function getDebuffResistanceMult(player: PlayerEntity): number {
  const resist = Math.max(0, Math.min(0.9, player.usesSkills.passives['defense.debuff-resistance'] ?? 0));
  return 1 - resist;
}

/**
 * Apply healing to a player with antiheal and maxHp cap applied.
 * When `world` is provided, emits a heal log event for applied HP.
 *
 * This is the single funnel for every player heal — all Recovery access and the
 * absorb drain — so antiheal and the overheal ward are
 * one place, not a per-effect concern. Route new healing through here; anything
 * that writes `hasHealth.hp` directly silently opts out of both.
 *
 * NOTE: `core.recovery-mult` is deliberately NOT applied here. It scales the
 * `recovery` STAT in shared/src/systems/stats.ts, and every in-combat regen
 * effect now activates a fraction of that stat — so applying it again per-heal
 * would compound it. Absorb is not Recovery-derived and is not meant to scale
 * with it (handoff §7).
 */
export function applyHealToPlayer(
  player: PlayerEntity,
  cs: TracksCombat,
  amount: number,
  world?: World,
  source?: WorldLogActor,
): void {
  if (amount <= 0) return;
  const before = player.hasHealth.hp;
  const maxHp = player.hasHealth.maxHp;
  const raw = before + amount * getAntiHealMult(cs);
  player.hasHealth.hp = Math.min(maxHp, raw);
  const applied = takeLoggableHeal(cs, player.hasHealth.hp - before);

  // Overheal → ward: convert HP that would spill past max into a temporary pool.
  const overhealPct = player.usesSkills.passives['defense.overheal-ward-pct'] ?? 0;
  if (world && overhealPct > 0 && raw > maxHp) {
    const capPct=player.usesSkills.passives['defense.overheal-ward-cap-pct'];
    const occupied=player.holdsWards?.wards.reduce((sum,w)=>sum+w.amount,0)??0;
    const headroom=capPct===undefined?Infinity:Math.max(0,maxHp*capPct-occupied);
    applyWard(world, player, Math.min(headroom,Math.round((raw - maxHp) * overhealPct)), OVERHEAL_WARD_MS);
  }
  if (world && raw > maxHp && overhealSinks.length > 0) {
    const spill = (raw - maxHp) * (1 - Math.min(1, Math.max(0, overhealPct)));
    if (spill > 0) for (const sink of overhealSinks) sink(world, player, spill);
  }
  if (world && player.hasHealth.hp > before) {
    markSliceDirty(world, player, 'hasHealth');
  }
  if (world && applied >= 1) {
    recordWorldLogEvent(
      world,
      {
        kind: 'heal',
        nodeId: player.hasPosition.nodeId,
        target: actorFromPlayer(player),
        source,
        amount: applied,
      },
      {
        visibility: 'combat',
        relatedPlayerIds: [player.isPlayer.id],
        nodeId: player.hasPosition.nodeId,
      },
    );
  }
}

export function applyHealToMinion(
  minion: MinionEntity,
  ownerPlayerId: string,
  amount: number,
  world: World,
  source?: WorldLogActor,
): void {
  if (amount <= 0) return;
  const before = minion.hasHealth.hp;
  minion.hasHealth.hp = Math.min(
    minion.hasHealth.maxHp,
    minion.hasHealth.hp + amount * getAntiHealMult(minion.tracksCombat),
  );
  const applied = takeLoggableHeal(minion.tracksCombat, minion.hasHealth.hp - before);
  if (minion.hasHealth.hp > before) {
    markSliceDirty(world, minion, 'hasHealth');
  }
  if (applied >= 1) {
    recordWorldLogEvent(
      world,
      {
        kind: 'heal',
        nodeId: minion.hasPosition.nodeId,
        target: actorFromMinion(minion, ownerPlayerId),
        source,
        amount: applied,
      },
      {
        visibility: 'combat',
        relatedPlayerIds: [ownerPlayerId],
        nodeId: minion.hasPosition.nodeId,
      },
    );
  }
}
