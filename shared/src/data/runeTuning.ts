/**
 * The distances a rune rule actually moves you.
 *
 * Rune ACTIONS are authored in `runeDatabase.ts` with a name, a blurb and an RP
 * cost, but the numbers that decide what "Keep Distance" or "Careful Pulling"
 * means lived as private constants inside the server's auto-combat systems.
 * That left runes the one build system with nothing concrete to show a player:
 * every other system can state its magnitudes, while a rune could only promise
 * "back away" without saying how far.
 *
 * These are the player-facing tuning values, moved here so the rune cards can
 * quote them. The server imports them — it does not keep its own copies — so a
 * balance change moves the number in the UI and in the simulation together.
 *
 * Deliberately NOT everything the auto-combat systems use: nav epsilons, latch
 * windows, steering handoff thresholds and hazard skirt angles stay server-side
 * because they describe how the movement code works, not what the rule promises.
 */

/**
 * Personal-space gap (edge-to-edge px) a Keep Distance / Orbit rule holds. Hold
 * position until an enemy is closer than this, then back away.
 */
export const RUNE_KEEP_DISTANCE_GAP = 220;

/**
 * Extra edge-to-edge px a kiting player tries to hold BEYOND the target's own
 * reach, so it stands just outside a ranged mob's range rather than inside it.
 * Only fully achievable when the player still out-ranges the mob.
 */
export const RUNE_KEEP_DISTANCE_RANGED_BUFFER = 45;

/**
 * Careful Pulling gives elites a berth scaled to their leash, clamped to this
 * band (px). The route bends around anything inside the radius.
 */
export const RUNE_CAREFUL_PULLING_MIN_THREAT_RADIUS = 280;
export const RUNE_CAREFUL_PULLING_MAX_THREAT_RADIUS = 720;

/** How far (px) Careful Pulling steps aside to avoid crossing an elite's ground. */
export const RUNE_CAREFUL_PULLING_SIDE_STEP = 220;

/**
 * Distance (px) from any node edge a fleeing player must reach before it holds
 * to heal — parking in the gate band bounces it straight back through.
 */
export const RUNE_FLEE_GATE_CLEAR_MARGIN = 120;
