/** Shared hazard DPS display — used by server HUD projection and client BossBar. */
export function hazardDmgPerSecond(dmgPerTick: number, tickMs: number): number {
  if (tickMs <= 0) return 0;
  return Math.round((dmgPerTick * 1000) / tickMs);
}
