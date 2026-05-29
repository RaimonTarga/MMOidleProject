import type { LogActorSide } from '@mmo-idle/shared';

/** Ally-owned name or stat (you / party). */
export const ALLY_COLOR = '#c8c8e0';
/** Enemy-owned name or stat. */
export const ENEMY_COLOR = '#ff5555';
/** Separators, verbs, and non-actor text. */
export const NEUTRAL_COLOR = '#9a9ab4';

export function sideColor(side: LogActorSide): string {
  switch (side) {
    case 'ally':
      return ALLY_COLOR;
    case 'enemy':
      return ENEMY_COLOR;
    default:
      return NEUTRAL_COLOR;
  }
}
