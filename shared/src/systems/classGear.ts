/**
 * Class gear (class-first build plan §3.6, bible §4).
 *
 * Smart loot: a recipe or item may name the classes it is for (`classes`); one that names
 * none is for everyone (the shared armor, charm and boots bases). A shared base may carry a
 * line per class (`classLines`): the same plate does a different thing for a Squire and a
 * Conduit, and each class runtime reads its own line keys from the character's passives.
 */
import type { MechanicEffects } from '../passives';
import type { CombatArchetype } from '../types/combat';
import type { ClassArchetype } from '../classKits/types';

export interface ClassScoped {
  classes?: readonly ClassArchetype[];
}

export interface ClassLined {
  classLines?: Partial<Record<ClassArchetype, MechanicEffects>>;
}

/** Whether a recipe or item is offered to a character of this class. */
export function availableToClass(entry: ClassScoped | undefined, archetype: CombatArchetype): boolean {
  if (!entry?.classes || entry.classes.length === 0) return true;
  return archetype !== null && entry.classes.includes(archetype);
}

/** The line a shared base carries for this class, if any. */
export function classLineFor(entry: ClassLined | undefined, archetype: CombatArchetype): MechanicEffects | undefined {
  if (!entry?.classLines || archetype === null) return undefined;
  return entry.classLines[archetype];
}
