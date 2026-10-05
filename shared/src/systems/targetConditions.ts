/**
 * TARGET CONDITIONS — which status ids on a MONSTER mean "afflicted" and "held".
 *
 * Two §24.2 moments look for a state on the target: the Affliction moment for an
 * affliction (any damage-over-time record), the Control moment for a hold (a slow,
 * a root, a chill, a freeze, a stun — a knockdown is a stun, so it holds too). The
 * server decides both (`monsterIsHeld`, the DoT inventory's families); the HUD reads
 * the SAME lists — the rhythm ring's blocked state, the target frame's three homes
 * (owes / slowed / held) — so the client can never call a target held that the
 * server does not, or the reverse.
 *
 * Also the home of the lineage-owned target ids (design §26.2):
 *
 *   `lineage.bleed`    the ONE damage-over-time record a lineage card leaves on a
 *                      weapon with no reservoir of its own. The Affliction lean's
 *                      light bleed, the composed heavy bleed, the re-dose and the
 *                      `poison-stack` payoff all ADD to it. On a weapon that owns a
 *                      reservoir (`weaponDot`) they add to that reservoir instead,
 *                      and no `lineage.*` DoT record exists at all.
 *   `lineage.hobbled`  the Control lean's slow ("Hobbled").
 *   `lineage.pinned`   the Control payload's root ("Pinned").
 *
 * The last two have their own ids rather than Hamstring's `ability-slowed` and
 * Binding Strike's `ability-rooted`, whose labels ("Hamstrung", "Bound") and help
 * name abilities the player may not have. They are the same ladder rungs: the
 * server's slow/root reconciler, the root ownership rules, the Control keystone's
 * ladder and boss control immunity all read both ids of a rung.
 *
 * Pure data and predicates — `shared/` owns no world state.
 */
import { ABILITY_ROOT_EFFECT_ID, ABILITY_SLOW_EFFECT_ID } from '../abilities';
import { FROZEN_STATUS_ID, STUN_STATUS_ID } from './statusPolicy';
import { weaponDotProfileForEffect } from './weaponFamilies';

/** The one lineage bleed (design §26.2). Replaces `lineage.hemorrhage`, `lineage.lean-bleed` and `lineage.poison`. */
export const LINEAGE_BLEED_STATUS_ID = 'lineage.bleed';
/** The Control lean's slow, "Hobbled". */
export const LINEAGE_SLOW_STATUS_ID = 'lineage.hobbled';
/** The Control payload's root, "Pinned". */
export const LINEAGE_ROOT_STATUS_ID = 'lineage.pinned';

/**
 * The Apprentice's class DoT (and Permafrost, which shares the id), Conflagration
 * and the frost chill. Restated from `server/` like `FROZEN_STATUS_ID`; the
 * status-registry test pins that the server's DoT inventory owns exactly what
 * {@link isAfflictionStatusId} says.
 */
export const CLASS_DOT_STATUS_ID = 'dot';
export const CONFLAGRATION_STATUS_ID = 'dot-conf';
export const CHILL_STATUS_ID = 'dot-chill';

/** Every id that is a SLOW on a monster: one rung of the control ladder. */
export const MONSTER_SLOW_STATUS_IDS: readonly string[] = [ABILITY_SLOW_EFFECT_ID, LINEAGE_SLOW_STATUS_ID];
/** Every id that is a ROOT on a monster: the middle rung. */
export const MONSTER_ROOT_STATUS_IDS: readonly string[] = [ABILITY_ROOT_EFFECT_ID, LINEAGE_ROOT_STATUS_ID];

/**
 * Which of the target frame's two hold homes an id lives in: `slowed` (moves
 * slower) or `held` (cannot move, or cannot act). Both count as HELD for the
 * Control moment.
 */
export type HoldKind = 'slowed' | 'held';

const HOLD_KIND: ReadonlyMap<string, HoldKind> = new Map<string, HoldKind>([
  ...MONSTER_SLOW_STATUS_IDS.map((id) => [id, 'slowed'] as const),
  [CHILL_STATUS_ID, 'slowed'],
  ...MONSTER_ROOT_STATUS_IDS.map((id) => [id, 'held'] as const),
  [FROZEN_STATUS_ID, 'held'],
  [STUN_STATUS_ID, 'held'],
]);

/** `slowed`, `held`, or undefined for a status that does not hold its target. */
export function holdKindOfStatusId(id: string): HoldKind | undefined {
  return HOLD_KIND.get(id);
}

/**
 * Does this status hold its target — slowed, rooted, chilled, frozen or stunned?
 * The Control moment's condition (`monsterIsHeld` on the server reads this list).
 */
export function isHoldStatusId(id: string): boolean {
  return HOLD_KIND.has(id);
}

/**
 * Server bookkeeping a monster carries that is not an effect a player reads: the
 * Effigy pair's per-owner link record (`frame.summoner.link.<ownerId>`, restated
 * from the summoner frame loop — the status-registry test pins the spelling), whose
 * bank the player's own `summoner-frame-link` tile already shows. The target
 * mirror leaves these out, so the frame never shows a badge with no meaning.
 */
const TARGET_HIDDEN_STATUS_PREFIXES: readonly string[] = ['frame.summoner.link.'];

export function isTargetHiddenStatusId(id: string): boolean {
  return TARGET_HIDDEN_STATUS_PREFIXES.some((prefix) => id.startsWith(prefix));
}

/**
 * Is this status a damage-over-time record — the Affliction moment's condition?
 * Exactly the families the server's DoT inventory owns: the class DoT (with
 * Permafrost), Conflagration, every weapon reservoir, and the one lineage bleed.
 *
 * The server additionally asks whose DoT it is (the moment reads the player's own
 * afflictions); a client reading a target's status list sees every owner's.
 */
export function isAfflictionStatusId(id: string): boolean {
  return id === CLASS_DOT_STATUS_ID
    || id === CONFLAGRATION_STATUS_ID
    || id === LINEAGE_BLEED_STATUS_ID
    || weaponDotProfileForEffect(id) !== undefined;
}
