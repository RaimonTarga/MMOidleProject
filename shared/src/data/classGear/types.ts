/**
 * Class gear data (class-first build plan §3.6, bible §4): per class, its own weapons and its
 * lines on the shared armor and charm bases. One file per class, so each class's gear is
 * entered and changed without touching the shared recipe files.
 */
import type { ClassLineDef } from '../../systems/classGear';
import type { Recipe } from '../recipes/types';

export interface ClassGearDef {
  /**
   * The class's weapons, as recipes. `classes` is set from the class when they are registered,
   * so a weapon never needs to name it. Ids: `<class>-<weapon name>`, frozen once created.
   */
  weapons: readonly Omit<Recipe, 'classes'>[];
  /** The class's line on each shared armor or charm base, keyed by that base's recipe id. */
  lines: Readonly<Record<string, ClassLineDef>>;
  /**
   * The lines that moved here when a biome retired (bible §4, decided 2026-10-15), keyed by the
   * RECEIVING shared base's recipe id (`jungle-vest-t3`). The receiving biome keeps its own line
   * on that base; the moved line rides a second base, `<baseId>-b`, a copy of it that every class
   * sees (see `SECOND_BASE_SUFFIX`).
   */
  movedLines?: Readonly<Record<string, ClassLineDef>>;
}
