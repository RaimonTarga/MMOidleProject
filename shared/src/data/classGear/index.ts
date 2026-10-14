/**
 * Every class's gear, keyed by archetype. `recipes/index.ts` registers the weapons as recipes
 * for their class and attaches the lines to the shared bases they name.
 */
import type { ClassArchetype } from '../../classKits/types';
import { APPRENTICE_GEAR } from './apprentice';
import { CONDUIT_GEAR } from './conduit';
import { SLINGER_GEAR } from './slinger';
import { SPIRIT_GEAR } from './spirit';
import { SQUIRE_GEAR } from './squire';
import { STRIKER_GEAR } from './striker';
import type { ClassGearDef } from './types';

export type { ClassGearDef } from './types';

export const CLASS_GEAR: Readonly<Record<ClassArchetype, ClassGearDef>> = {
  cadence: STRIKER_GEAR,
  cooldown: SQUIRE_GEAR,
  dot: APPRENTICE_GEAR,
  reload: SLINGER_GEAR,
  energy: SPIRIT_GEAR,
  summoner: CONDUIT_GEAR,
};
