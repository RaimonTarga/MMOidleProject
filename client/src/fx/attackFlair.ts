/**
 * ATTACK FLAIR — the visual progression of a player's attacks (2026-09-27).
 *
 * A fresh character should swing plainly and a specialised, ascended one should
 * look like it earned it. Two axes, both already on every PlayerView (own and
 * remote), so this is pure presentation with no protocol:
 *
 *   STAGE      class advancement: 0 class root, 1 frame, 2 range, 3 specialization.
 *              It changes WHAT is drawn: stage 0 is the bare stroke; the frame adds
 *              the glow and contact flash; the range swaps in its own weapon shape
 *              (ATTACK_FX_BY_RANGE); the specialization brings its own bespoke
 *              attack (bespokePaths.ts) showing the path's resource.
 *   ASCENSION  `playerTier` (T0..T4 quest ascension). It changes HOW MUCH: particle
 *              counts and size climb a little per tier, and from T3 a specialized
 *              payoff rings out in the class colour (bespokePaths.ts).
 *
 * Base FX take an optional `flair`; without one (monsters, minions, previews) they
 * draw exactly what they always did, which is the stage-2 look.
 */
import type { PlayerView } from '@mmo-idle/shared';

export type FlairStage = 0 | 1 | 2 | 3;

export interface AttackFlair {
  stage: FlairStage;
  /** `playerTier`, clamped 0..4. */
  ascension: number;
  /** The tier-3 specialization node id, once one is chosen. */
  specId?: string;
  /** Glow under-layers and contact flashes (stage >= 1). */
  glow: boolean;
  /** Multiplier on particle counts. */
  sparks: number;
  /** Multiplier on shape size. */
  scale: number;
}

const T3_ID = /-t3-[abc]$/;

/** The flair a player's attacks are drawn with. */
export function attackFlairOf(player: Pick<PlayerView, 'selectedSubVariant' | 'selectedRange' | 'unlockedSkills' | 'playerTier'>): AttackFlair {
  const specId = player.unlockedSkills?.find((id) => T3_ID.test(id));
  const stage: FlairStage = specId ? 3 : player.selectedRange ? 2 : player.selectedSubVariant ? 1 : 0;
  const ascension = Math.max(0, Math.min(4, player.playerTier ?? 0));
  const stageSparks = [0.35, 0.7, 1, 1.2][stage];
  const stageScale = [0.85, 0.93, 1, 1.06][stage];
  return {
    stage,
    ascension,
    specId,
    glow: stage >= 1,
    sparks: stageSparks * (1 + 0.12 * ascension),
    scale: stageScale * (1 + 0.035 * ascension),
  };
}

/** A particle count under this flair (at least 1 when the base is positive). */
export function flairCount(base: number, flair: AttackFlair | undefined): number {
  if (!flair || base <= 0) return base;
  return Math.max(1, Math.round(base * flair.sparks));
}

/** A length / radius under this flair. */
export const flairSize = (base: number, flair: AttackFlair | undefined): number =>
  flair ? base * flair.scale : base;

/** Whether glow layers draw under this flair (always, without one). */
export const flairGlow = (flair: AttackFlair | undefined): boolean => flair?.glow ?? true;
