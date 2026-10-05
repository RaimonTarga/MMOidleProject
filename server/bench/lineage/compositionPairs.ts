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
 * form with no cards. T2 labels are the same `lean×verb` they always were.
 *
 * THE T1 BAND AFTER DESIGN §26.1 (legibility run): one verb per weapon (the
 * weapon's own) and a lean row of three RANKED cards, so the T1 matrix is no longer
 * lean × verb but lean × RANK × the one verb: 3 leans × 3 ranks per weapon, plus a
 * verb-only row (`none×<verb>`, the verb's pure pair at its base size) and the
 * no-band control. A T1 row is labelled `<kind>-<rank>×<verb lane>` (e.g.
 * `effect-3×tempo`); `leanRank` is how many times the lean is bought (each purchase
 * of an owned ranked card buys its next rank through the real handler).
 */
import { LINEAGE_DATABASE, isRankedCard, maxCardRank, type LeanKind, type LineageDefinition, type PacketId } from '@mmo-idle/shared';

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
  /** The lean's lane (row 1), or null on the control. At T1 its colour and shard only. */
  lean: PacketId | null;
  /** The verb's lane (row 2), or null on the control. */
  verb: PacketId | null;
  leanCardId: string | null;
  verbCardId: string | null;
  /**
   * A RANKED lean's rank (design §26.1): how many times the row buys it — 1..3 at
   * T1. Null on an unranked lean (every T2 lean) and on a row with no lean.
   */
  leanRank: number | null;
  /** The T1 lean's kind (`attack` / `speed` / `effect`); absent on a lane lean. */
  leanKind?: LeanKind;
  /**
   * `tempo×affliction` (lean × verb) at T2, `effect-3×tempo` (kind-rank × verb) at
   * T1, `none×<verb>` for a verb alone, or `control` for the no-band row.
   */
  label: string;
  /** The pair reads the verb's hand-authored pure sentence (design §24.2). */
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

/** A T1 rank row's label: `<kind>-<rank>×<verb lane>` (design §26.1). */
export function rankedPairLabel(kind: LeanKind, rank: number, verb: PacketId | null): string {
  return `${kind}-${rank}×${verb ?? 'none'}`;
}

/** The band's ONE verb (design §26.1: the T1 payoff row is the weapon's own). */
function onlyVerb(lineage: LineageDefinition, tier: number) {
  const verbs = lineage.cards.filter((c) => c.tier === tier && c.row === 'payoff');
  if (verbs.length !== 1) throw new Error(`${lineage.id}: T${tier} has ${verbs.length} verbs, expected the weapon's one`);
  return verbs[0]!;
}

/** The band's ranked leans, in Attack / Speed / Effect order. */
function rankedLeans(lineage: LineageDefinition, tier: number) {
  const order: LeanKind[] = ['attack', 'speed', 'effect'];
  return lineage.cards
    .filter((c) => c.tier === tier && c.row === 'stat' && isRankedCard(c))
    .sort((a, b) => order.indexOf(a.leanKind!) - order.indexOf(b.leanKind!));
}

/** Does this band carry the ranked lean trio (the T1 band after design §26.1)? */
export function bandIsRanked(lineage: LineageDefinition, tier = 1): boolean {
  return rankedLeans(lineage, tier).length > 0;
}

/**
 * The T1 matrix rows (design §26.1): every ranked lean at every rank with the
 * weapon's one verb, the verb ALONE (`none×<verb>`), and the no-band control.
 */
function rankedCompositionPairs(lineage: LineageDefinition, tier: number): CompositionPair[] {
  const verb = onlyVerb(lineage, tier);
  const pairs: CompositionPair[] = [];
  for (const lean of rankedLeans(lineage, tier)) {
    for (let rank = 1; rank <= maxCardRank(lean); rank++) {
      pairs.push({
        lineageId: lineage.id, lean: lean.lane, verb: verb.lane,
        leanCardId: lean.id, verbCardId: verb.id, leanRank: rank, leanKind: lean.leanKind,
        label: rankedPairLabel(lean.leanKind!, rank, verb.lane),
        // Every T1 lean leaves the fixed verb on its pure pair (Attack and Speed
        // name no payload, Effect names the verb's own lane).
        pure: true,
      });
    }
  }
  pairs.push({
    lineageId: lineage.id, lean: null, verb: verb.lane, leanCardId: null, verbCardId: verb.id,
    leanRank: null, label: pairLabel(null, verb.lane), pure: true,
  });
  pairs.push({
    lineageId: lineage.id, lean: null, verb: null, leanCardId: null, verbCardId: null,
    leanRank: null, label: 'control', pure: false,
  });
  return pairs;
}

/**
 * The matrix rows of the band of `tier` (default 1), control last.
 *
 *  - T1 (design §26.1): lean × rank × the weapon's one verb (9), the verb alone, the
 *    control — 11 rows per weapon.
 *  - T2: nine lean × verb pairs in lane order, plus the control — 10 rows per weapon
 *    (unchanged).
 */
export function compositionPairs(lineage: LineageDefinition, tier = 1): CompositionPair[] {
  if (bandIsRanked(lineage, tier)) return rankedCompositionPairs(lineage, tier);
  const pairs: CompositionPair[] = [];
  for (const lean of lineage.lanes) {
    for (const verb of lineage.lanes) {
      pairs.push({
        lineageId: lineage.id,
        lean,
        verb,
        leanCardId: bandCard(lineage, 'stat', lean, tier),
        verbCardId: bandCard(lineage, 'payoff', verb, tier),
        leanRank: null,
        label: pairLabel(lean, verb),
        pure: lean === verb,
      });
    }
  }
  pairs.push({
    lineageId: lineage.id, lean: null, verb: null, leanCardId: null, verbCardId: null,
    leanRank: null, label: 'control', pure: false,
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
  if (bandIsRanked(lineage, tier)) {
    // T1 (design §26.1): each ranked lean alone, at each rank.
    return rankedLeans(lineage, tier).flatMap((lean) => Array.from({ length: maxCardRank(lean) }, (_, i) => ({
      lineageId: lineage.id, lean: lean.lane, verb: null, leanCardId: lean.id, verbCardId: null,
      leanRank: i + 1, leanKind: lean.leanKind, label: rankedPairLabel(lean.leanKind!, i + 1, null), pure: false,
    })));
  }
  return lineage.lanes.map((lean) => ({
    lineageId: lineage.id,
    lean,
    verb: null,
    leanCardId: bandCard(lineage, 'stat', lean, tier),
    verbCardId: null,
    leanRank: null,
    label: pairLabel(lean, null),
    pure: false,
  }));
}

/**
 * The purchases a row makes, in order: the lean once per rank (each purchase of an
 * owned ranked card buys its NEXT rank through the real handler), then the verb.
 * What the boss lab and the lane bench both buy, so the two instruments cannot
 * disagree about a rank.
 */
export function pairPurchases(pair: Pick<CompositionPair, 'leanCardId' | 'verbCardId' | 'leanRank'>): string[] {
  const lean = pair.leanCardId ? Array.from({ length: pair.leanRank ?? 1 }, () => pair.leanCardId!) : [];
  return [...lean, ...(pair.verbCardId ? [pair.verbCardId] : [])];
}
