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

/** One class's line on a shared base: what the player reads, and the keys its runtime reads. */
export interface ClassLineDef {
  /** The line's name (Shoulder Through, Bramble, Warding Sigils...): a placeholder, renamed freely. */
  name: string;
  /** Player-facing: what the line does for this class, plain words, no numbers. */
  text: string;
  /** Mechanic keys merged into the wearer's passives; the class runtime reads them. */
  effects: MechanicEffects;
}

export interface ClassLined {
  classLines?: Partial<Record<ClassArchetype, ClassLineDef>>;
}

/** Whether a recipe or item is offered to a character of this class. */
export function availableToClass(entry: ClassScoped | undefined, archetype: CombatArchetype): boolean {
  if (!entry?.classes || entry.classes.length === 0) return true;
  return archetype !== null && entry.classes.includes(archetype);
}

/** The line a shared base carries for this class, if any. */
export function classLineFor(entry: ClassLined | undefined, archetype: CombatArchetype): ClassLineDef | undefined {
  if (!entry?.classLines || archetype === null) return undefined;
  return entry.classLines[archetype];
}
