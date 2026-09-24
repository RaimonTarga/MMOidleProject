import { CHAOTIC_HIT_COUNTER_KEY, addCounter, getCounter } from '@mmo-idle/shared';
import type { CombatContext } from './combatPipeline';

interface DeadSwingProgress { logicalHits: number; remainder: number }

/** Peek before listeners; commit only once an attack/tick actually fires.
 * Channels pay every Nth delivered tick; formations retain weighted logical hits.
 * The flag precedes onHit so dead-swing riders work without suppressing debuffs.
 */
export function prepareWeaponDeadSwing(ctx: CombatContext): DeadSwingProgress | undefined {
  if (ctx.attackerType !== 'player') return;
  const player = ctx.attacker;
  const interval = Math.round(player.usesSkills.passives['weapon.dead-swing-interval'] ?? 0);
  if (interval <= 0) return;
  const previous = ctx.formation && player.controlsSummons
    ? (player.controlsSummons.procProgress['weapon.chaotic-logical-hit'] ?? 0) : 0;
  const next = previous + (ctx.formation?.procWeight ?? 1);
  const logicalHits = Math.floor(next + 1e-9);
  if (logicalHits > 0 && (getCounter(player.tracksCombat, CHAOTIC_HIT_COUNTER_KEY) + logicalHits) % interval === 0) {
    ctx.metadata.chaoticMiss = true;
  }
  return { logicalHits, remainder: next - logicalHits };
}

export function commitWeaponDeadSwing(ctx: CombatContext, progress: DeadSwingProgress | undefined): void {
  if (!progress || ctx.attackerType !== 'player') return;
  const player = ctx.attacker;
  if (ctx.formation && player.controlsSummons) {
    player.controlsSummons.procProgress['weapon.chaotic-logical-hit'] = progress.remainder;
  }
  if (progress.logicalHits > 0) addCounter(player.tracksCombat, CHAOTIC_HIT_COUNTER_KEY, progress.logicalHits);
}
