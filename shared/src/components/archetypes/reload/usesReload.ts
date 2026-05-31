/** Merged reload archetype slice — wire fields + runtime bookkeeping. */
export interface UsesReload {
  ammo: number;
  ammoMax: number;
  laserHeat: number;
  laserOverheated: boolean;
  reloadingMs: number;
  snipeCooldownMs: number;
  /** Hair Trigger: attack-speed stacks built during current clip. */
  clipSpeedStacks: number;
  /** Hair Trigger: attack cooldown captured on first shot of clip (0 = not yet set). */
  clipBaseAttackCooldownMs: number;
}

export function initUsesReload(args: { ammoMax: number }): UsesReload {
  return {
    ammo:            args.ammoMax,
    ammoMax:         args.ammoMax,
    laserHeat:       0,
    laserOverheated: false,
    reloadingMs:     0,
    snipeCooldownMs: 0,
    clipSpeedStacks: 0,
    clipBaseAttackCooldownMs: 0,
  };
}
