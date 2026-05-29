/** Server-global marker for a slain dungeon boss awaiting respawn. */
export interface BossFelledMarker {
  nodeId: string;
  monsterTypeId: string;
  /** Absolute epoch ms when the boss respawns. */
  respawnAt: number;
  durationMs: number;
}

export function formatRespawnRemaining(respawnAt: number, now = Date.now()): string {
  const totalSeconds = Math.max(0, Math.ceil(Math.max(0, respawnAt - now) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
