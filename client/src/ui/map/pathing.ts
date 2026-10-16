import { shortestWorldPath } from '@mmo-idle/shared';

/**
 * Compatibility name retained for map detail consumers. With `maxTier` (the player's tier)
 * it is the server's own travel path: around higher-tier zones when a way exists.
 */
export function bfsPath(from: string, to: string, maxTier?: number): string[] | null {
  return shortestWorldPath(from, to, maxTier);
}
