// The server clock as the React HUD reads it.
//
// The Phaser render state keeps its own `ServerClock`; the HUD has no handle on
// that state, and a clock it needs only when drawing (the rhythm readout's cap
// rings) has no business living in an atom that would re-render every subscriber
// on every snapshot. So the inbound seam feeds this one too, and a component
// reads `hudServerNow()` while it renders.

import { ServerClock } from '../render/serverClock';

const clock = new ServerClock();

/** Called by `deltaApplier` with every snapshot's `serverTime`. */
export function observeHudServerTime(serverTime: number | undefined): void {
  clock.observe(serverTime);
}

/** Server time now, or undefined before the first snapshot. */
export function hudServerNow(): number | undefined {
  return clock.now();
}
