import type { TracksCombat, WorldLogActor } from '@mmo-idle/shared';
import type { MinionEntity, PlayerEntity } from '../../../ecs/entity';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import type { World } from '../../../world/World';
import { recordWorldLogEvent } from '../../../world/worldLog';
import { actorFromMinion, actorFromPlayer } from '../../../world/worldLogActors';
import { applyShield } from '../shields/shields';

// Duration of the temp shield minted from overheal (defense.overheal-shield-pct).
const OVERHEAL_SHIELD_MS = 6000;

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
  const resist = Math.min(0.9, player.usesSkills.passives['defense.debuff-resistance'] ?? 0);
  return 1 - resist;
}

/**
 * Apply healing to a player with antiheal and maxHp cap applied.
 * When `world` is provided, emits a heal log event for applied HP.
 *
 * This is the single funnel for every player heal — regen burst, in-combat regen,
 * ramp regen, kill burst, guard.heal-on-fire, ability heals, the post-cheat-death
 * HoT — which is what makes `core.recovery-mult` a one-line change rather than a
 * subsystem. Route new healing through here; anything that writes `hasHealth.hp`
 * directly silently opts out of antiheal, overheal-shield AND core recovery.
 *
 * Deliberately NOT applied to applyHealToMinion: minion sustain is the summoner's
 * budget, not the core slot's.
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
  // Core recovery scales the heal BEFORE antiheal, so an antiheal debuff still
  // counters a Survivalist rather than being outrun by one.
  const recoveryMult = 1 + (player.usesSkills.passives['core.recovery-mult'] ?? 0);
  const scaled = Math.max(0, amount * recoveryMult);
  const raw = before + scaled * getAntiHealMult(cs);
  player.hasHealth.hp = Math.min(maxHp, raw);
  const applied = Math.round(player.hasHealth.hp - before);

  // Overheal → temporary shield: convert HP that would spill past max into a shield.
  const overhealPct = player.usesSkills.passives['defense.overheal-shield-pct'] ?? 0;
  if (world && overhealPct > 0 && raw > maxHp) {
    applyShield(world, player, Math.round((raw - maxHp) * overhealPct), OVERHEAL_SHIELD_MS);
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
  const applied = Math.round(minion.hasHealth.hp - before);
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
