/** Present iff Alternating Currents is currently in its discharge phase. */
export interface InAcDischarge {
  remainingMs: number;
  tickNext: number;
  baseCd: number;
}
