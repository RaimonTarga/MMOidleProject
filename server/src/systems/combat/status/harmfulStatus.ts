/**
 * ONE WRITER for "how hard does an incoming harmful status land on this player?".
 *
 * Several systems want to shorten or soften a debuff on its way in — mobility-boot
 * tenacity (Graveyard stacks, Trench), the Warding stance, and whatever gear line
 * grows the axis next. They must not each scale the value independently: two
 * callers that both read the raw duration and both multiply it would each treat
 * the other's output as the clean base, exactly the ratchet `monsterControl.ts`
 * exists to prevent for monster slows.
 *
 * So every application site calls THESE, not the individual sources, and every new
 * source registers here rather than adding a call at the application site.
 *
 * Both are capped strictly below 1: a resisted status is always shortened or
 * softened, never deleted. A status that sometimes simply does not happen is far
 * harder to read than one that visibly lasts less time — the same reasoning
 * `stun.ts` gives for scaling control duration instead of gating the stun.
 */
import type { PlayerEntity } from "../../../ecs/entity";
import { mobilityTenacityDurationMult } from "../../world/mobility/mobilityBoots";

/** A resisted effect keeps at least this fraction of its authored value. */
const RESIST_FLOOR = 0.1;

function resistMult(fraction: number): number {
  if (fraction <= 0) return 1;
  return Math.max(RESIST_FLOOR, 1 - fraction);
}

/**
 * Multiplier on the DURATION an incoming harmful status is applied with. 1 = full.
 *
 * Folds mobility tenacity (which historically owned this seam alone) with the
 * `shared.status-duration-resist` passive. The two multiply: they are different
 * kinds of investment — boots you wear and a posture you hold — and neither should
 * make the other worthless.
 */
export function harmfulStatusDurationMult(player: PlayerEntity): number {
  const resist = player.usesSkills?.passives["shared.status-duration-resist"] ?? 0;
  return mobilityTenacityDurationMult(player) * resistMult(resist);
}

/**
 * Multiplier on the POTENCY of an incoming damage-over-time — its per-stack damage.
 * 1 = full. Deliberately narrower than the duration seam: "potency" means different
 * numbers on different debuffs (a speed multiplier, a plating shred, a damage-taken
 * percentage), and one function cannot honestly scale all of them. DoT damage is the
 * one that is unambiguously a magnitude, so it is the one this covers.
 */
export function harmfulStatusPotencyMult(player: PlayerEntity): number {
  return resistMult(player.usesSkills?.passives["shared.status-potency-resist"] ?? 0);
}
