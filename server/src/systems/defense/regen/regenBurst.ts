import {
  addResource, getResource, setResource,
  isCooldownActive, setCooldown,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { BURST_POOL_KEY, BURST_DRAIN_MS, BURST_DRAIN_CD } from '../core/pools';
import { registerCombatListener } from '../../combat/engine/combatPipeline';
import { applyHealToPlayer } from './healing';

export function registerKillBurst(): void {
  registerCombatListener('onKill', (ctx) => {
    if (ctx.attackerType !== 'player') return;

    const player = ctx.attacker;
    const killBurstPct = player.usesSkills.passives['defense.kill-burst-pct'] ?? 0;
    if (killBurstPct <= 0) return;

    addResource(player.tracksCombat, BURST_POOL_KEY, player.hasHealth.maxHp * killBurstPct);
    setCooldown(player.tracksCombat, BURST_DRAIN_CD, BURST_DRAIN_MS);
  });
}

/**
 * Per-tick regen burst. Every `defense.regen-burst-interval-ms`, deposits
 * `defense.regen-burst-pct × maxHp` into a healing pool that drains back over
 * POOL_DRAIN_MS (antiheal applies). Both passives must be > 0 for the
 * mechanic to activate.
 */
export function runRegenBurst(world: World, player: PlayerEntity, dt: number, inCombat: boolean): void {
  const burstPct        = player.usesSkills.passives['defense.regen-burst-pct'] ?? 0;
  const burstIntervalMs = player.usesSkills.passives['defense.regen-burst-interval-ms'] ?? 0;

  const cs = player.tracksCombat;
  if (inCombat && burstPct > 0 && burstIntervalMs > 0 && !isCooldownActive(cs, 'regenBurst')) {
    addResource(cs, BURST_POOL_KEY, player.hasHealth.maxHp * burstPct);
    setCooldown(cs, 'regenBurst', burstIntervalMs);
    setCooldown(cs, BURST_DRAIN_CD, BURST_DRAIN_MS);
  }
  const burstPool = getResource(cs, BURST_POOL_KEY);
  if (burstPool <= 0) return;

  const healAmount = burstPool * (dt / BURST_DRAIN_MS);
  const burstLeft  = burstPool - healAmount;
  setResource(cs, BURST_POOL_KEY, burstLeft < 0.5 ? 0 : burstLeft);
  applyHealToPlayer(player, cs, healAmount, world);
}
