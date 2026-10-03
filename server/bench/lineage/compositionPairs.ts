/**
 * The lean × verb COMPOSITION MATRIX's rows (course-correction W3-A, design §24.2).
 *
 * "Two purchases give nine real combinations per weapon." A row here is one weapon
 * lineage's T1 lean (row 1, `stat`) and T1 verb (row 2, `payoff`) — every lean of
 * its three lanes against every verb of its three lanes — plus one NO-BAND control
 * per (weapon, class): the same form worn, no cards, so a pair's uplift is read
 * against the same character without its band, exactly as the lane bench reads a
 * lane against its lineage's lane-less control.
 *
 * Shared by both instruments that measure the matrix — the boss lab's plan
 * (`scripts/_t1BossPlan.ts --matrix=composition`) and the lane bench
 * (`bench/compositionLanes.ts`) — so the two cannot enumerate different pairs.
 *
 * Pure data over `LINEAGE_DATABASE`: a weapon lineage that is not parked, its
 * cards by row and lane. Nothing here buys anything; both instruments buy through
 * the real economy handler (`unlockLineageCard` / `setLineageActive`).
 *
 * TIER (verbs-that-fire B, design §24.9: "T2+ bands compose too"). Every function
 * takes the band's tier, default 1. A tier-2 pair is the T2 lean and the T2 verb,
 * worn on the lineage's band-2 form (`bandFormOf`); its control wears the same
 * form with no cards. Labels are the same `lean×verb` at every tier, so a T1 and a
 * T2 reading of one pair line up by label.
 */
import { LINEAGE_DATABASE, type LineageDefinition, type PacketId } from '@mmo-idle/shared';

/** The six tutorial classes, by class root, in `T1_BASELINE_ROUTES` order. */
export const CLASS_BY_ROOT: Readonly<Record<string, string>> = {
  'cadence-root': 'striker',
  'cooldown-root': 'squire',
  'reload-root': 'slinger',
  'energy-root': 'spirit',
  'dot-root': 'apprentice',
  'summoner-root': 'conduit',
};

export const ROOT_BY_CLASS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(CLASS_BY_ROOT).map(([root, name]) => [name, root]),
);

/** The live weapon lineages (non-weapon trees are parked, design §24.5). */
export function weaponLineages(): LineageDefinition[] {
  return [...LINEAGE_DATABASE.values()].filter((l) => l.slot === 'weapon' && !l.parked);
}

/** The lineage's tier-1 form — what a matrix row wears. */
export function t1FormOf(lineage: LineageDefinition): string {
  return bandFormOf(lineage, 1);
}

/**
 * The form a tier's matrix row wears: the lineage's FIRST authored form of that
 * tier — at T1 the crafted base form, at T2 the door in the lineage's own home
 * biome (the Rapier's Gale Needle, the Broadsword's Knight Steelsword). The same
 * convention as the lane bench's band-2 references (`t2WornForm` in
 * `bot/src/tierEntry/profiles.ts`), and for the same reason: one fixed form per
 * lineage, so its capstone sits in the control as well as in every pair.
 */
export function bandFormOf(lineage: LineageDefinition, tier = 1): string {
  const form = lineage.forms.find((f) => f.tier === tier);
  if (!form) throw new Error(`${lineage.id}: no tier-${tier} form`);
  return form.recipeId;
}

export interface CompositionPair {
  lineageId: string;
  /** The lean's lane (row 1), or null on the control. */
  lean: PacketId | null;
  /** The verb's lane (row 2), or null on the control. */
  verb: PacketId | null;
  leanCardId: string | null;
  verbCardId: string | null;
  /** `tempo×affliction` (lean × verb), or `control` for the no-band row. */
  label: string;
  /** Same-lane pair: the hand-authored pure sentence (design §24.2). */
  pure: boolean;
}

function bandCard(lineage: LineageDefinition, row: 'stat' | 'payoff', lane: PacketId, tier: number): string {
  const card = lineage.cards.find((c) => c.tier === tier && c.row === row && c.lane === lane);
  if (!card) throw new Error(`${lineage.id}: no T${tier} ${row} card on lane ${lane}`);
  return card.id;
}

/** The label a pair is filed under. `control` is never a lane label (lanes are `a×b`). */
export function pairLabel(lean: PacketId | null, verb: PacketId | null): string {
  return lean === null && verb === null ? 'control' : `${lean ?? 'none'}×${verb ?? 'none'}`;
}

/**
 * Nine lean × verb pairs plus the no-band control, in lane order (control last),
 * of the band of `tier` (default 1).
 */
export function compositionPairs(lineage: LineageDefinition, tier = 1): CompositionPair[] {
  const pairs: CompositionPair[] = [];
  for (const lean of lineage.lanes) {
    for (const verb of lineage.lanes) {
      pairs.push({
        lineageId: lineage.id,
        lean,
        verb,
        leanCardId: bandCard(lineage, 'stat', lean, tier),
        verbCardId: bandCard(lineage, 'payoff', verb, tier),
        label: pairLabel(lean, verb),
        pure: lean === verb,
      });
    }
  }
  pairs.push({
    lineageId: lineage.id, lean: null, verb: null, leanCardId: null, verbCardId: null,
    label: 'control', pure: false,
  });
  return pairs;
}

/**
 * The band's three LEANS alone — a lean slotted, no verb (`<lean>×none`). Not
 * matrix cells: the decomposition rows for the T2 report (verbs-that-fire B). A
 * pair's uplift minus its lean's uplift alone is what the VERB's payload adds on
 * top of the lean's stat, which is the half of a pair a tier's verb numbers move.
 */
export function leanOnlyPairs(lineage: LineageDefinition, tier = 1): CompositionPair[] {
  return lineage.lanes.map((lean) => ({
    lineageId: lineage.id,
    lean,
    verb: null,
    leanCardId: bandCard(lineage, 'stat', lean, tier),
    verbCardId: null,
    label: pairLabel(lean, null),
    pure: false,
  }));
}
