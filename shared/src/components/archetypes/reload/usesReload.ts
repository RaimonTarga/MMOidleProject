/** Merged reload archetype slice — wire fields + runtime bookkeeping. */
export interface UsesReload {
  ammo: number;
  ammoMax: number;
  laserHeat: number;
  laserOverheated: boolean;
  reloadingMs: number;
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
  /** Cannon: damage banked from shots this clip; fired as a burst mid-reload. */
  cannonStored: number;
  /** Cannon: ms left on the mid-reload charge before the burst fires (0 = idle). */
  cannonFireMs: number;
  /** Cannon: full charge duration (= half the reload), for the charge-up FX pct. */
  cannonChargeTotalMs: number;
  /** Cannon: target the pending burst will hit. */
  cannonTargetId: string | null;
  /** Death Mark: ms left on the delayed detonation armed at reload start (0 = none). */
  deathMarkDetonateMs: number;
  /** Death Mark: target whose stacks the pending detonation will hit. */
  deathMarkTargetId: string | null;
}

export function initUsesReload(args: { ammoMax: number }): UsesReload {
  return {
    ammo:            args.ammoMax,
    ammoMax:         args.ammoMax,
    laserHeat:       0,
    laserOverheated: false,
    reloadingMs:     0,
    clipSpeedStacks: 0,
    clipBaseAttackCooldownMs: 0,
    momentumStacks:  0,
    momentumBaseCd:  0,
    momentumDecayMs: 0,
    cannonStored: 0,
    cannonFireMs: 0,
    cannonChargeTotalMs: 0,
    cannonTargetId: null,
    deathMarkDetonateMs: 0,
    deathMarkTargetId: null,
  };
}
