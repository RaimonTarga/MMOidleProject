import {
  addResource, getResource, setResource,
  isCooldownActive, setCooldown,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/components/player';
import { BURST_POOL_KEY, POOL_DRAIN_MS } from '../core/pools';
import { applyHealToPlayer } from './healing';

/**
 * Per-tick regen burst. Every `defense.regen-burst-interval-ms`, deposits
 * `defense.regen-burst-pct × maxHp` into a healing pool that drains back over
 * POOL_DRAIN_MS (antiheal applies). Both passives must be > 0 for the
 * mechanic to activate.
 */
export function runRegenBurst(player: PlayerEntity, dt: number): void {
  const burstPct        = player.usesSkills.passives['defense.regen-burst-pct'] ?? 0;
  const burstIntervalMs = player.usesSkills.passives['defense.regen-burst-interval-ms'] ?? 0;
  if (burstPct <= 0 || burstIntervalMs <= 0) return;

  const cs = player.tracksCombat;
  if (!isCooldownActive(cs, 'regenBurst')) {
    addResource(cs, BURST_POOL_KEY, player.hasHealth.maxHp * burstPct);
    setCooldown(cs, 'regenBurst', burstIntervalMs);
  }
  const burstPool = getResource(cs, BURST_POOL_KEY);
  if (burstPool <= 0) return;

  const healAmount = burstPool * (dt / POOL_DRAIN_MS);
  const burstLeft  = burstPool - healAmount;
  setResource(cs, BURST_POOL_KEY, burstLeft < 0.5 ? 0 : burstLeft);
  if (healAmount >= 0.5) applyHealToPlayer(player, cs, healAmount);
}
