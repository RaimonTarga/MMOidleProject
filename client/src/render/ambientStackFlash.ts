import type { CombatEvent } from '@mmo-idle/shared';

export type AmbientStackGain = Extract<CombatEvent, { kind: 'ambient-stack-gain' }>;
export interface AmbientStackFlash {
  startedAt: number;
  nodeId: string;
  effectId: AmbientStackGain['effectId'];
}

export const AMBIENT_STACK_FLASH_MS = 180;

/** Soft multiply tint: quick onset, then fade back to the current underlying tint. */
export function ambientStackFlashTint(flash: AmbientStackFlash, now: number, base: number): number | null {
  const age = now - flash.startedAt;
  if (age < 0 || age >= AMBIENT_STACK_FLASH_MS) return null;
  const weight = 0.55 * (1 - age / AMBIENT_STACK_FLASH_MS) ** 2;
  const color = flash.effectId === 'volcanic-heat' ? 0xff5555 : 0x88d9ff;
  let result = 0;
  for (const shift of [16, 8, 0]) {
    const from = (base >>> shift) & 255;
    const to = (color >>> shift) & 255;
    result |= Math.round(from + (to - from) * weight) << shift;
  }
  return result;
}
