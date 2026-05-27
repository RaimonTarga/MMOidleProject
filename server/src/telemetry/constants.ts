/** Rolling window for per-node telemetry aggregation (matches server flush interval). */
export const TELEMETRY_WINDOW_MS = 2_000;

/** History sample interval for monster trend / leak detection. */
export const TELEMETRY_HISTORY_INTERVAL_MS = 30_000;

/** Max history samples kept per node (~10 min at 30 s intervals). */
export const TELEMETRY_HISTORY_MAX_SAMPLES = 20;

/** membershipDrift above this triggers a leak flag. */
export const LEAK_MEMBERSHIP_DRIFT_THRESHOLD = 2;

/** monsterTrend10m above this on unoccupied nodes triggers a leak flag. */
export const LEAK_MONSTER_TREND_THRESHOLD = 0.1;

/** Rough byte estimates for live footprint proxy (calibrated once, not exact). */
export const EST_PLAYER_BYTES = 2_500;
export const EST_MONSTER_BYTES = 1_800;
export const EST_NET_ID_BYTES = 48;

/** Population top-up interval for active (non-frozen) occupied nodes. */
export const POPULATION_INTERVAL_MS = 5_000;
