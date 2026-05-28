/**
 * Player slice for the summoner archetype. Presence indicates the player is in
 * summoner mode (personal attack disabled; slimes attack on their behalf).
 *
 * `minionIds[slot]` carries the network id of the slime occupying that slot, or
 * an empty string if the slot is currently dead/respawning. `respawnTimers[slot]`
 * counts down ms while the slot is empty; when it hits 0, the summoner tick
 * spawns a fresh minion.
 */
export interface SummonsMinions {
  minionIds: string[];
  respawnTimers: number[];
  targetCount: number;
}

export function initSummonsMinions(args: { targetCount: number }): SummonsMinions {
  const targetCount = Math.max(1, Math.round(args.targetCount));
  return {
    minionIds:     new Array(targetCount).fill(''),
    respawnTimers: new Array(targetCount).fill(0),
    targetCount,
  };
}
