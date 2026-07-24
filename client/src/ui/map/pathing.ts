import { shortestWorldPath } from '@mmo-idle/shared';

/** Compatibility name retained for map detail consumers. */
export function bfsPath(from: string, to: string): string[] | null {
  return shortestWorldPath(from, to);
}
