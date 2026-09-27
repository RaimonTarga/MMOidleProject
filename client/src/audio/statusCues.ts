import type { PlayerView } from '@mmo-idle/shared';
import { playSfx } from './audioEngine';
import { statusCue } from './routing';
let previous = new Set<string>();
let seeded = false;
/** Only semantic status onsets; never ticks, stack increments, or target changes. */
export function notePlayerStatusCues(own: PlayerView): void {
  const current = new Set<string>();
  for (const buff of own.activeBuffs) {
    const cue = statusCue(buff);
    if (!cue) continue;
    current.add(cue);
    if (seeded && !previous.has(cue)) playSfx(cue);
  }
  previous = current;
  seeded = true;
}
export function resetPlayerStatusCues(): void {
  previous.clear();
  seeded = false;
}
