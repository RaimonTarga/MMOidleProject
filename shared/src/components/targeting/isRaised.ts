/**
 * Marker: monster was re-animated from a corpse by a `raisesDead` necromancer.
 *
 * Presence is the reward gate — a risen mob grants zero essence, biome XP,
 * catalyst progress and quest credit, so a necromancer's tide can never be
 * farmed. It also keys the raiser's `maxAlive` cap and the crumble-on-raiser-
 * death sweep, which is why the marker carries its raiser instead of being empty.
 */
export interface IsRaised {
  /** `isMonster.id` of the necromancer that raised it. */
  raiserId: string;
}
