/** Cooldown archetype slice — the HUD dial and the Resolve bar (class-first CQ.1). */
export interface UsesCooldown {
  /** 0–100 fill of the HUD dial. `addResolve` writes it from resolve / resolveMax. */
  executionCooldownPct: number;
  /** Resolve in pips (fractional while it fills). */
  resolve: number;
  /** The bar's size in pips: the class budget. */
  resolveMax: number;
  /** The pips that arm the slam. The bar can grow past it (Deep Winter, Bastion); the HUD marks it. */
  resolveBudget: number;
}

export function initUsesCooldown(): UsesCooldown {
  return {
    executionCooldownPct: 0,
    resolve:              0,
    resolveMax:           0,
    resolveBudget:        0,
  };
}
