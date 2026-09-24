/** Logarithmic visual weight, never one particle per unit of currency. */
export function essenceMoteProfile(amount: number): { tier: number; count: number; size: number } {
  if (!Number.isFinite(amount) || amount < 1) return { tier: 0, count: 0, size: 0 };
  const magnitude = Math.floor(Math.log10(amount));
  const tier = Math.min(4, magnitude);
  const leading = amount / 10 ** magnitude;
  return {
    tier,
    count: Math.min(16, tier * 4 + Math.ceil(leading / 2)),
    size: 13 + tier * 4,
  };
}

export const MAX_ESSENCE_MOTES = 96;
