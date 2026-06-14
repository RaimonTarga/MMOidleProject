/** Merged reload archetype slice — wire fields + runtime bookkeeping. */
export interface UsesReload {
  ammo: number;
  ammoMax: number;
  laserHeat: number;
  laserOverheated: boolean;
  reloadingMs: number;
  snipeCooldownMs: number;
  /** Hair Trigger / Chain Gun: attack-speed stacks built during current clip. */
  clipSpeedStacks: number;
  /** Hair Trigger / Chain Gun: attack cooldown captured on first shot of clip (0 = not yet set). */
  clipBaseAttackCooldownMs: number;
  // ── T4 spec runtime state ──────────────────────────────────────────────────
  /** Momentum: reload-stacked attack-speed stacks (decays out of combat). */
  momentumStacks: number;
  /** Momentum: base attack cooldown captured when the first stack is gained. */
  momentumBaseCd: number;
  /** Momentum: ms accumulator for out-of-combat stack decay. */
  momentumDecayMs: number;
  /** Siege: shots fired from the clip being reloaded (captured at reload start). */
  siegeShotsFired: number;
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
    momentumStacks:  0,
    momentumBaseCd:  0,
    momentumDecayMs: 0,
    siegeShotsFired: 0,
  };
}
