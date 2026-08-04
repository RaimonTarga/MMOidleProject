/**
 * Marker: this entity has lost the ability to attack.
 *
 * Every entity can attack by default; presence of this marker is the *only*
 * thing that disables attacking. Two sources currently attach it (during the
 * player stat recalc):
 *   - The summoner archetype, whose minions fight in the player's place, except
 *     for the explicit Battle Bond specialization.
 *   - Any combatant whose attack range is pushed below 1px (range can never
 *     drop below 1; when it would, the combatant simply cannot reach anything).
 *
 * Server-only (combat is server-authoritative) — never networked.
 */
export interface CannotAttack {}
