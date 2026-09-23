import type { CombatEvent } from '@mmo-idle/shared';

export type AmbientStackGain = Extract<CombatEvent, { kind: 'ambient-stack-gain' }>;
export interface AmbientStackFlash {
  startedAt: number;
  nodeId: string;
  effectId: AmbientStackGain['effectId'];
}

export const AMBIENT_STACK_FLASH_MS = 360;
const PEAK_HOLD_MS = 60;

/** Brief saturated pulse, held long enough to read, then a smooth fade to the current tint. */
export function ambientStackFlashTint(flash: AmbientStackFlash, now: number, base: number): number | null {
  const age = now - flash.startedAt;
  if (age < 0 || age >= AMBIENT_STACK_FLASH_MS) return null;
  const fade = Math.max(0, age - PEAK_HOLD_MS) / (AMBIENT_STACK_FLASH_MS - PEAK_HOLD_MS);
  const weight = 0.85 * (1 - fade);
  const color = flash.effectId === 'volcanic-heat' ? 0xff3333 : 0x66ccff;
  let result = 0;
  for (const shift of [16, 8, 0]) {
    const from = (base >>> shift) & 255;
    const to = (color >>> shift) & 255;
    result |= Math.round(from + (to - from) * weight) << shift;
  }
  return result;
}
