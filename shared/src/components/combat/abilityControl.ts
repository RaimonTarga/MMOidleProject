/**
 * Markers: a monster is under player-ability movement control.
 *
 * Presence gates the reconciliation loop in
 * `server/src/systems/combat/status/monsterControl.ts` — the effect's data holds
 * the magnitude, the marker holds "look at me this tick".
 */

/** Marker: monster is slowed by an ability (Hamstring). */
export interface HasAbilitySlow {}

/** Marker: monster is rooted by an ability (Binding Strike). */
export interface HasAbilityRoot {}
