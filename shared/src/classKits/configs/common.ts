/**
 * Shared pieces of the six class-system configs: the spec each class implements, structural
 * guards for configs arriving from a client or a save, and the checks every system makes.
 */
import { CLASS_STATE_CONDITIONS, type ClassConfigContext, type ClassSystemConfig, type ConditionRef } from '../configTypes';
import { isMomentId } from '../moments';
import type { ClassArchetype, ClassKit, PieceDef } from '../types';

/** One class system's rules for its config. */
export interface ClassSystemSpec<C extends ClassSystemConfig> {
  kind: C['kind'];
  /** Rebuild a clean config of this kind from untrusted input, or null if it isn't one. */
  parse(raw: Record<string, unknown>): C | null;
  /** The class default for what the character owns (each section's §N.13). */
  defaults(ctx: ClassConfigContext): C;
  /** Every reason the config can't be used; empty when it can. */
  validate(config: C, ctx: ClassConfigContext): string[];
}

// ── Structural guards ────────────────────────────────────────────────────────

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function stringArray(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) return null;
  return [...value];
}

export function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function conditionRefs(value: unknown): ConditionRef[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const refs: ConditionRef[] = [];
  for (const raw of value) {
    if (!isRecord(raw) || typeof raw.id !== 'string') return null;
    const ref: ConditionRef = { id: raw.id as ConditionRef['id'] };
    if (raw.param !== undefined) {
      const param = finiteNumber(raw.param);
      if (param === null) return null;
      ref.param = param;
    }
    if (raw.not === true) ref.not = true;
    refs.push(ref);
  }
  return refs;
}

export function oneOf<T extends string>(value: unknown, options: readonly T[]): T | null {
  return typeof value === 'string' && (options as readonly string[]).includes(value) ? value as T : null;
}

// ── Checks every system makes ────────────────────────────────────────────────

/** Unknown condition ids, or another class's state conditions. */
export function conditionProblems(
  conditions: readonly ConditionRef[],
  archetype: ClassArchetype,
  where: string,
): string[] {
  const problems: string[] = [];
  for (const ref of conditions) {
    if (isMomentId(ref.id)) continue;
    const state = (CLASS_STATE_CONDITIONS as Record<string, { archetype: ClassArchetype }>)[ref.id];
    if (!state) problems.push(`${where}: unknown condition "${ref.id}"`);
    else if (state.archetype !== archetype) problems.push(`${where}: "${ref.id}" belongs to another class`);
  }
  return problems;
}

/** The kit's pieces the character owns, in the kit's order. */
export function ownedPieces<P extends PieceDef>(kit: ClassKit<P>, ctx: ClassConfigContext): P[] {
  return kit.pieces.filter((piece) => ctx.pieceRanks.has(piece.id));
}

/** An owned piece of this kit by id, or undefined. */
export function ownedPiece<P extends PieceDef>(kit: ClassKit<P>, ctx: ClassConfigContext, id: string): P | undefined {
  if (!ctx.pieceRanks.has(id)) return undefined;
  return kit.pieces.find((piece) => piece.id === id);
}
