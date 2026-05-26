import type { PlayerEntity } from '../../../ecs/components/player';
import { applyHealToPlayer } from './healing';

/**
 * Per-tick in-combat regen. While the player has an active attack target,
 * applies `defense.in-combat-regen-pct` fraction of the out-of-combat regen
 * rate. Antiheal applies via `applyHealToPlayer`.
 */
export function runInCombatRegen(player: PlayerEntity, dt: number): void {
  const inCombatRegenPct = player.usesSkills.passives['defense.in-combat-regen-pct'] ?? 0;
  if (inCombatRegenPct <= 0) return;
  if (player.hasAttackTarget === undefined) return;

  const baseRegenPerMs = player.hasHealth.maxHp * ((player.hasHealth.hpRegen ?? 0) / 100) / 1000;
  applyHealToPlayer(player, player.tracksCombat, baseRegenPerMs * inCombatRegenPct * dt);
}
