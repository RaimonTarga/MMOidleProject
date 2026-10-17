/**
 * The Apprentice's kit (`dot`): bible §9.
 *
 * The student of three schools. Its hits lay **sigils** on enemies; pieces are **payoffs**
 * dropped on moments of the enemy (full, winds up, low, shell up, frozen, dies, out of reach)
 * in the Payoff rules. The relic slot's trophy is a payoff relic or a sigil relic. The budget
 * is the sigil cap: how many sigils every enemy can hold.
 *
 * Entered through T4: Detonate (the starter), the six T1 payoffs (§9.4), the three discipline
 * pieces (§9.5), every T2–T4 lesson (§9.16), the eleven trophies (§9.9), the disciplines
 * (§9.5), specializations (§9.6) and T4 leaves (§9.7). Totals (§9.8, §9.16): 21 pieces, 30
 * lessons counting 9 rank-ups; by lesson Poison 11, Fire 10, Frost 9.
 */
import { standardBudgetSteps } from '../budget';
import { STARTER, fromDiscipline, learn, rankUp, zone } from '../kitHelpers';
import type { MomentId } from '../moments';
import type { ClassKit, DisciplineDef, LeafDef, PieceDef, SpecializationDef, TrophyDef } from '../types';

/** The three schools (§9.8). A payoff belongs to one; every discipline keeps the others' basics. */
export type ApprenticeSchool = 'poison' | 'fire' | 'frost';

export interface ApprenticePieceExtra {
  /**
   * The one moment this lesson happens at, for lessons bound to their own moment (Seep: an
   * enemy goes out of reach; Recoil: a debuff lands on you). Payoffs without it are placed
   * freely on any moment of the enemy card.
   */
  moment?: MomentId;
}

export type ApprenticePiece = PieceDef<ApprenticeSchool, ApprenticePieceExtra>;

/** Payoff relics change what a payoff does; sigil relics change how sigils build (§9.9). */
export type ApprenticeTrophyKind = 'payoff' | 'sigil';
export type ApprenticeTrophy = TrophyDef<ApprenticeTrophyKind>;

/** The T4 leaves' question, "what reaches you?" (§9.7): one column per kind of threat. */
type ApprenticeLeafColumn = 'charger' | 'ambusher' | 'shooter';

export function payoff(piece: Omit<ApprenticePiece, 'classId' | 'params'> & { params?: ApprenticePiece['params'] }): ApprenticePiece {
  return { classId: 'dot', ...piece, params: piece.params ?? {} };
}

export function apprenticeTrophy(entry: Omit<ApprenticeTrophy, 'classId' | 'params'> & { params?: ApprenticeTrophy['params'] }): ApprenticeTrophy {
  return { classId: 'dot', ...entry, params: entry.params ?? {} };
}

function discipline(entry: Omit<DisciplineDef, 'classId' | 'params'> & { params?: DisciplineDef['params'] }): DisciplineDef {
  return { classId: 'dot', params: {}, ...entry };
}

function specialization(entry: Omit<SpecializationDef, 'classId' | 'params'> & { params?: SpecializationDef['params'] }): SpecializationDef {
  return { classId: 'dot', params: {}, ...entry };
}

function leaf(entry: Omit<LeafDef, 'classId' | 'params' | 'tier' | 'column'> & { column: ApprenticeLeafColumn; params?: LeafDef['params'] }): LeafDef {
  return { classId: 'dot', tier: 4, ...entry, params: entry.params ?? {} };
}

/**
 * The sigil cap by Global Mastery (§9.2: 4 at the start, 5 at Mastery 15, 6 at 30; bots tune it).
 * PLACEHOLDER (OV-APPRENTICE): after T1 it grows one step per tier, not the standard three. On the
 * standard steps the cap reached 12-13 at T3 and no weapon filled it inside a boss fight, so
 * Detonate (and Fire's whole chain) never fired; a payoff's size per sigil already grows with the
 * weapon's tier.
 */
const APPRENTICE_SIGIL_STEPS = [
  ...standardBudgetSteps(4).slice(0, 3),
  { mastery: 72, value: 7 },
  { mastery: 114, value: 8 },
  { mastery: 156, value: 9 },
];

const POISON = 'apprentice-poison';
const FIRE = 'apprentice-fire';
const FROST = 'apprentice-frost';

const PIECES: readonly ApprenticePiece[] = [
  payoff({
    id: 'apprentice-detonate',
    params: { payoffPct: 1, cooldownMs: 1500 },
    name: 'Detonate',
    family: 'fire',
    text: "Sets off every sigil on the target at once, dealing what they still had to deal in one blast.",
  }),
  // ── T1 (§9.4): every school twice ──
  payoff({
    id: 'apprentice-spread',
    params: { everyMs: 1000, neighbours: 1 },
    name: 'Spread',
    family: 'poison',
    text: 'A target full of your sigils keeps passing one to its nearest neighbour.',
    ranks: [{ rank: 2, text: 'Spread and the plague reach a hiding or fleeing enemy anywhere within your reach.' }],
  }),
  payoff({
    id: 'apprentice-numb',
    params: { slowBase: 0.2, slowPerSigil: 0.05, msBase: 2000, msPerSigil: 400, cooldownMs: 6000 },
    name: 'Numb',
    family: 'frost',
    text: "Spends the target's sigils to slow its attacks and movement for a few seconds, longer the more sigils it carried.",
    ranks: [{ rank: 2, text: "A numbed enemy's wind-ups also take longer." }],
  }),
  payoff({
    id: 'apprentice-siphon',
    params: { healPerSigil: 0.02, cooldownMs: 8000 },
    name: 'Siphon',
    family: 'poison',
    text: "Spends the target's sigils to heal you. It needs a while to come back.",
    ranks: [{ rank: 2, text: 'It also washes a poison, bleed or Corrosion off you.' }],
  }),
  payoff({
    id: 'apprentice-seize',
    params: { holdBase: 500, holdPerSigil: 150, cooldownMs: 5000, catchWindowMs: 4000 },
    name: 'Seize',
    family: 'frost',
    text: "Spends the target's sigils to hold it for a moment, breaking its wind-up.",
    ranks: [
      { rank: 2, text: 'It also catches a second wind-up that starts within a few seconds.' },
      { rank: 3, text: "A seized enemy's delayed attacks, like fault lines, are cancelled too." },
    ],
  }),
  payoff({
    id: 'apprentice-converge',
    params: { radius: 180, cooldownMs: 4000 },
    name: 'Converge',
    family: 'fire',
    text: 'Pulls the sigils of every enemy near the target onto it, even past what it can normally hold.',
  }),
  // ── The discipline pieces (§9.5) ──
  payoff({
    id: 'apprentice-wither',
    params: { lessPct: 0.25, ms: 4000, cooldownMs: 6000 },
    name: 'Wither',
    family: 'poison',
    text: "Spends the target's sigils so it deals less damage for a few seconds.",
  }),
  payoff({
    id: 'apprentice-fuse',
    params: { fuseMs: 3000, cooldownMs: 6000 },
    name: 'Fuse',
    family: 'fire',
    text: "The target's sigils blow after a short fuse, and every sigil you lay on it meanwhile adds to the blast.",
  }),
  payoff({
    id: 'apprentice-cold-snap',
    // ms 2500 → 4000 (OV2-APPRENTICE, PLACEHOLDER): the chill now slows attacks too, and covers most of its cooldown.
    params: { radius: 180, slowPct: 0.35, ms: 4000, cooldownMs: 6000 },
    name: 'Cold Snap',
    family: 'frost',
    text: "Spends the target's sigils to chill every enemy around it, slowing its movement and attacks.",
  }),
  // ── T2 (§9.16) ──
  payoff({
    id: 'apprentice-blast-back',
    params: { payoffPct: 0.8, knockback: 120, cooldownMs: 3000 },
    name: 'Blast Back',
    family: 'fire',
    sidegradeOf: 'apprentice-detonate',
    moment: 'charging-at-me',
    text: "Sets off a charging enemy's sigils: the blast stops its charge and knocks it back.",
  }),
  payoff({
    id: 'apprentice-sear',
    params: { payoffPct: 0.8, barrierMult: 2, cooldownMs: 4000 },
    name: 'Sear',
    family: 'fire',
    moment: 'target-shielded',
    text: "Spends a shielded target's sigils to burn through its barrier twice as hard.",
  }),
  payoff({
    id: 'apprentice-seep',
    params: { tickMult: 2, burstRadius: 200 },
    name: 'Seep',
    family: 'poison',
    moment: 'target-out-of-reach',
    text: 'When an enemy burrows or dives out of reach, its sigils keep ticking, doubled, until it surfaces.',
    ranks: [{ rank: 2, text: 'When it surfaces, its sigils burst onto every enemy near the spot.' }],
  }),
  payoff({
    id: 'apprentice-snag',
    params: { rootMs: 1500, cooldownMs: 6000, holdRadius: 160 },
    name: 'Snag',
    family: 'frost',
    moment: 'target-flees',
    text: 'A fleeing or kiting enemy full of your sigils is rooted for a moment.',
    ranks: [{ rank: 2, text: 'The root also holds every enemy near the snagged one.' }],
  }),
  payoff({
    id: 'apprentice-recoil',
    params: { cooldownMs: 3000 },
    name: 'Recoil',
    family: 'poison',
    moment: 'debuff-landed',
    text: "When an enemy's mark, slow or curse lands on you, its caster catches a full bar of your sigils.",
    ranks: [{ rank: 2, text: 'The caster also suffers its own mark or slow.' }],
  }),
  // ── T3 (§9.16) ──
  // T3 numbers are PLACEHOLDERS (the bible names the shapes, not the values).
  payoff({
    id: 'apprentice-spore-burst',
    params: { radius: 180, share: 0.5, cooldownMs: 6000 },
    name: 'Spore Burst',
    family: 'poison',
    sidegradeOf: 'apprentice-spread',
    text: "Spends the target's sigils to burst them onto every enemy around it at once, each catching half.",
  }),
  payoff({
    id: 'apprentice-signal-fire',
    params: { payoffPct: 0.8 },
    name: 'Signal Fire',
    family: 'fire',
    text: 'When you detonate your target, your sigils on the enemy furthest from you go off too.',
  }),
  payoff({
    id: 'apprentice-melt',
    params: { cooldownMs: 4000 },
    name: 'Melt',
    family: 'fire',
    moment: 'chill-threshold',
    text: "When the Chill on you reaches its threshold, you spend the nearest enemy's sigils to melt it off.",
  }),
  payoff({
    id: 'apprentice-cinderfall',
    // `heatWiden` (rank 2, PLACEHOLDER): the radius grows by this share for each step of the Heat.
    params: { payoffPct: 0.8, radius: 180, share: 0.5, cooldownMs: 1500, heatWiden: 0.1 },
    name: 'Cinderfall',
    family: 'fire',
    sidegradeOf: 'apprentice-detonate',
    text: "Sets off the target's sigils in a blast that hits everything around it, each enemy taking a share.",
    ranks: [{ rank: 2, text: 'Each step of the Heat widens the blast.' }],
  }),
  // ── T4 (§9.16) ──
  // T4 numbers are PLACEHOLDERS (the bible names the shapes, not the values).
  payoff({
    id: 'apprentice-frostcrack',
    params: { cooldownMs: 5000 },
    name: 'Frostcrack',
    family: 'frost',
    moment: 'target-shielded',
    text: 'Seizes a shielded or shelled enemy and cracks its shell open at once.',
  }),
  payoff({
    id: 'apprentice-pyre',
    name: 'Pyre',
    family: 'fire',
    moment: 'risen',
    text: 'A fallen enemy carrying your sigils burns and cannot rise, and the sigils it still carried pass on.',
  }),
  payoff({
    id: 'apprentice-transference',
    params: { cooldownMs: 6000 },
    name: 'Transference',
    family: 'poison',
    text: "Spends the target's sigils to move one of the debuffs on you onto it.",
  }),
];

const LESSONS = [
  learn('apprentice-detonate', STARTER),
  // T1 (§9.4)
  learn('apprentice-spread', zone('plains', 1)),
  learn('apprentice-numb', zone('forest', 1)),
  learn('apprentice-siphon', zone('swamp', 1)),
  learn('apprentice-seize', zone('mountain', 1)),
  learn('apprentice-converge', zone('cave', 1)),
  // The T2 pick (§9.5)
  learn('apprentice-wither', fromDiscipline(POISON)),
  learn('apprentice-fuse', fromDiscipline(FIRE)),
  learn('apprentice-cold-snap', fromDiscipline(FROST)),
  // T2 (§9.16)
  learn('apprentice-blast-back', zone('plains', 2), 'sidegrade'),
  rankUp('apprentice-numb', 2, zone('forest', 2)),
  learn('apprentice-sear', zone('mountain', 2)),
  rankUp('apprentice-siphon', 2, zone('swamp', 2)),
  learn('apprentice-seep', zone('cave', 2)),
  learn('apprentice-snag', zone('jungle', 2)),
  learn('apprentice-recoil', zone('desert', 2)),
  // T3 (§9.16)
  rankUp('apprentice-seize', 2, zone('mountain', 3)),
  rankUp('apprentice-seep', 2, zone('cave', 3)),
  learn('apprentice-spore-burst', zone('swamp', 3), 'sidegrade'),
  rankUp('apprentice-snag', 2, zone('jungle', 3)),
  learn('apprentice-signal-fire', zone('desert', 3)),
  learn('apprentice-melt', zone('tundra', 3)),
  learn('apprentice-cinderfall', zone('volcanic', 3), 'sidegrade'),
  // T4 (§9.16)
  rankUp('apprentice-seize', 3, zone('mountain', 4)),
  learn('apprentice-frostcrack', zone('tundra', 4)),
  rankUp('apprentice-spread', 2, zone('jungle', 4)),
  rankUp('apprentice-recoil', 2, zone('desert', 4)),
  rankUp('apprentice-cinderfall', 2, zone('volcanic', 4)),
  learn('apprentice-pyre', zone('graveyard', 4)),
  learn('apprentice-transference', zone('trench', 4)),
];

/**
 * One trophy per boss lineage (§9.4, §9.9, §9.16); ranks come from the same lineage's later
 * bosses. Where §9.16 names a rank without its twist ("Petrify III"), the rank text only says
 * the trophy grows stronger, for the designer to fill in.
 */
const TROPHIES: readonly ApprenticeTrophy[] = [
  apprenticeTrophy({
    id: 'apprentice-relic-plains',
    params: { neighbours: 2 },
    lineage: 'plains',
    name: 'Outbreak',
    kind: 'payoff',
    text: 'Your Spread passes to two neighbours instead of one.',
    ranks: [{ rank: 2, bossTier: 2, text: 'It passes to three neighbours.', params: { neighbours: 3 } }],
  }),
  apprenticeTrophy({
    id: 'apprentice-relic-forest',
    params: { sigils: 3 },
    lineage: 'forest',
    name: 'Firstbrand',
    kind: 'sigil',
    text: 'Your first hit on an enemy carrying none of your sigils lays three at once.',
    ranks: [{ rank: 2, bossTier: 2, text: 'That first hit lays half a bar.', params: { barShare: 0.5 } }],
  }),
  apprenticeTrophy({
    id: 'apprentice-relic-swamp',
    params: { radius: 160 },
    lineage: 'swamp',
    name: 'Glut',
    kind: 'payoff',
    text: 'Your Siphon also drains every enemy near the target.',
    ranks: [
      { rank: 2, bossTier: 2, text: 'It drains from twice as far.', params: { radius: 320 } },
      // PLACEHOLDER: the bible names the rank without its twist ("Glut III, the last rank").
      { rank: 3, bossTier: 3, text: 'Glut grows stronger.', params: { radius: 480 } },
    ],
  }),
  apprenticeTrophy({
    id: 'apprentice-relic-mountain',
    params: { holdMult: 1.6, damageTakenPct: 0.2 },
    lineage: 'mountain',
    name: 'Petrify',
    kind: 'payoff',
    text: 'Your Seize holds longer, and the held enemy takes more damage.',
    ranks: [
      { rank: 2, bossTier: 2, text: 'The held enemy also takes more damage from your sigils as they tick.', params: { tickDamageTakenPct: 0.2 } },
      // PLACEHOLDER (no twist in the bible): it holds longer still.
      { rank: 3, bossTier: 3, text: 'Petrify grows stronger.', params: { holdMult: 2 } },
      // PLACEHOLDER (no twist in the bible, "the last rank"): it holds longer still.
      { rank: 4, bossTier: 4, text: 'Petrify grows stronger.', params: { holdMult: 2.4 } },
    ],
  }),
  apprenticeTrophy({
    id: 'apprentice-relic-cave',
    params: { minSigils: 3, everyMs: 2000 },
    lineage: 'cave',
    name: 'Brood Sigils',
    kind: 'sigil',
    text: 'An enemy carrying three or more of your sigils grows another one every few seconds.',
    ranks: [
      { rank: 2, bossTier: 2, text: 'They grow faster.', params: { everyMs: 1500 } },
      // PLACEHOLDER (no twist in the bible, "the last rank"): they grow faster again.
      { rank: 3, bossTier: 3, text: 'Brood Sigils grows stronger.', params: { everyMs: 1000 } },
    ],
  }),
  apprenticeTrophy({
    id: 'apprentice-relic-jungle',
    params: { tickMult: 1.5 },
    lineage: 'jungle',
    name: 'Scent',
    kind: 'sigil',
    text: 'Your sigils on an enemy that flees or kites never fall off while it runs, and they tick faster.',
    ranks: [
      // PLACEHOLDER (no twist in the bible): they tick faster again.
      { rank: 2, bossTier: 3, text: 'Scent grows stronger.', params: { tickMult: 2 } },
      { rank: 3, bossTier: 4, text: 'Scent grows stronger.', params: { tickMult: 2.5 } },
    ],
  }),
  apprenticeTrophy({
    id: 'apprentice-relic-desert',
    lineage: 'desert',
    name: 'Dune Wind',
    kind: 'payoff',
    text: 'Your Spread or chain can leap any distance to an enemy carrying your sigils.',
    ranks: [
      // PLACEHOLDER (no twist in the bible): a Spread passes to one more enemy.
      { rank: 2, bossTier: 3, text: 'Dune Wind grows stronger.', params: { extraNeighbours: 1 } },
      { rank: 3, bossTier: 4, text: 'Dune Wind grows stronger.', params: { extraNeighbours: 2 } },
    ],
  }),
  apprenticeTrophy({
    id: 'apprentice-relic-tundra',
    // PLACEHOLDERS: the brittle window after a Seize ends.
    params: { brittleMs: 3000, brittlePct: 0.3 },
    lineage: 'tundra',
    name: 'Frostheart',
    kind: 'payoff',
    text: 'Every Seize also leaves its target brittle for a few seconds after.',
    ranks: [{ rank: 2, bossTier: 4, text: 'Frostheart grows stronger.', params: { brittleMs: 5000 } }],
  }),
  apprenticeTrophy({
    id: 'apprentice-relic-volcanic',
    params: { shellTickMult: 1 },
    lineage: 'volcanic',
    name: 'Magma Core',
    kind: 'sigil',
    text: 'Your sigils on a shelled enemy keep ticking at full strength through the shell.',
    ranks: [{ rank: 2, bossTier: 4, text: 'Magma Core grows stronger.', params: { shellTickMult: 1.25 } }],
  }),
  apprenticeTrophy({
    id: 'apprentice-relic-graveyard',
    lineage: 'graveyard',
    name: 'Dirge',
    kind: 'payoff',
    text: 'Your Detonate also sets off your sigils on every risen enemy in the fight.',
    ranks: [],
  }),
  apprenticeTrophy({
    id: 'apprentice-relic-trench',
    // PLACEHOLDER: a Detonate held back by an out-of-reach enemy goes off this many times as hard.
    params: { pressureMult: 2 },
    lineage: 'trench',
    name: 'Pressure Fuse',
    kind: 'payoff',
    text: 'A Detonate on an enemy out of reach waits, then goes off twice as hard when it resurfaces.',
    ranks: [],
  }),
];

/** The T2 pick (§9.5): the sigils' element, the school's signature and one new piece. */
const DISCIPLINES: readonly DisciplineDef[] = [
  discipline({
    id: POISON,
    // PLACEHOLDERS (§9.5 illustrative): the cap holds 2 more, ticks fast, each sigil small.
    params: { capShift: 2, tickSpeed: 1.5, sigilDamageMult: 0.8, passEveryMs: 1000 },
    name: 'Poison',
    fantasy: 'I touch one, and the whole pack is already dying.',
    text: 'Your sigils turn to poison: every enemy holds more of them, and they tick fast. Spread happens on its own: a full enemy keeps passing sigils to its nearest neighbour, and a dying one passes on what it still carried.',
    pieceId: 'apprentice-wither',
  }),
  discipline({
    id: FIRE,
    // PLACEHOLDERS: a hit into a full-burn target strikes this much harder; a detonation
    // throws `chainSigils` burn onto everything within `chainRadius`.
    params: { burnHitPct: 0.25, chainRadius: 160, chainSigils: 2 },
    name: 'Fire',
    fantasy: 'One spark, and they go up one after another.',
    text: 'Your sigils become burn, and your hits strike harder on a target full of it. A detonation throws burn onto every enemy around it, and any enemy it fills goes off too, each once per chain.',
    pieceId: 'apprentice-fuse',
  }),
  discipline({
    id: FROST,
    // PLACEHOLDERS: the cap holds 1 fewer, each sigil is heavy and slows its carrier.
    params: { capShift: -1, sigilDamageMult: 1.5, slowPerSigil: 0.03, shatterMult: 2, shatterRadius: 160, chillPct: 0.3, chillMs: 2000, brittlePct: 0.3, brittleMs: 4000 },
    name: 'Frost',
    fantasy: 'I lock the giant in ice, then break it.',
    text: 'Your sigils turn to frost: fewer and heavier, each slowing its carrier a little, and Seize freezes its target (a boss that cannot be held turns brittle for a few seconds, taking more damage). A Detonate on a frozen or brittle target shatters it in a heavy hit whose cold chills its neighbours.',
    pieceId: 'apprentice-cold-snap',
  }),
];

/** The T3 pick (§9.6): each bends its discipline's signature or the chain's delivery. */
const SPECIALIZATIONS: readonly SpecializationDef[] = [
  // The `params` are PLACEHOLDERS (the bible names the shapes and a few figures: ~5 s, 2 s, ~6 s, ~8 s, 3 shards).
  // Poison: the plague
  specialization({
    id: 'apprentice-carrier',
    params: { radius: 140, everyMs: 1000 },
    disciplineId: POISON,
    name: 'Carrier',
    text: 'The plague also walks from you: every enemy near you keeps catching your sigils.',
  }),
  specialization({
    id: 'apprentice-ripening',
    params: { ripeMs: 5000, ripeMult: 2 },
    disciplineId: POISON,
    name: 'Ripening',
    text: 'Your sigils darken as they age, and an old one ticks double. The walking plague passes on its ripest sigil.',
  }),
  specialization({
    id: 'apprentice-wasting',
    params: {},
    disciplineId: POISON,
    name: 'Wasting',
    text: "Wither's weakening stays on any enemy carrying a full bar of your sigils, so plagued packs and bosses hit softer.",
  }),
  // Fire: the blast
  specialization({
    id: 'apprentice-afterburn',
    params: { keepShare: 0.5 },
    disciplineId: FIRE,
    name: 'Afterburn',
    text: 'A detonation leaves half its sigils burning on the target, so the next blast comes sooner.',
  }),
  specialization({
    id: 'apprentice-long-fuse',
    params: { fuseMs: 2000 },
    disciplineId: FIRE,
    name: 'Long Fuse',
    text: 'Every detonation waits a moment and grows with every sigil you lay meanwhile; the chain carries the extra.',
  }),
  specialization({
    id: 'apprentice-hair-trigger',
    params: {},
    disciplineId: FIRE,
    name: 'Hair Trigger',
    text: 'Your chain sets off any enemy carrying your sigils, not only those it fills; each goes off for what it carries.',
  }),
  // Frost: the freeze
  specialization({
    id: 'apprentice-ice-tomb',
    params: { tombMs: 6000 },
    disciplineId: FROST,
    name: 'Ice Tomb',
    text: 'A frozen target stays frozen, and a brittle boss stays brittle, until you shatter it, up to a limit.',
  }),
  specialization({
    id: 'apprentice-creeping-frost',
    params: { everyMs: 8000 },
    disciplineId: FROST,
    name: 'Creeping Frost',
    text: 'A target you fill with sigils freezes on its own, though not again for a while. That frees the winds-up moment for another payoff.',
  }),
  specialization({
    id: 'apprentice-shardstorm',
    params: { shards: 3, shardSigils: 1, radius: 400 },
    disciplineId: FROST,
    name: 'Shardstorm',
    text: "A shatter's shards fly to the three nearest enemies and lay frost sigils on them; a frozen one hit by a shard shatters too, once per chain.",
  }),
];

/** T4's leaves (§9.7): "what reaches you?", answered in each discipline's style. The `params` are PLACEHOLDERS. */
const LEAVES: readonly LeafDef[] = [
  // Poison: they catch it
  leaf({
    id: 'apprentice-thick-air',
    params: { slowPct: 0.4, slowMs: 1500 },
    disciplineId: POISON,
    column: 'charger',
    name: 'Thick Air',
    text: 'An enemy that charges or leaps at you lands carrying a full bar of your sigils, slowed for a moment.',
  }),
  leaf({
    id: 'apprentice-taint',
    params: { lessPct: 0.5 },
    disciplineId: POISON,
    column: 'ambusher',
    name: 'Taint',
    text: "An ambusher's first hit on you is halved, and it arrives carrying a full bar of your sigils.",
  }),
  leaf({
    id: 'apprentice-windborne',
    params: { everyMs: 1000 },
    disciplineId: POISON,
    column: 'shooter',
    name: 'Windborne',
    text: 'Your plague also walks to whoever hits you from range, however far away.',
  }),
  // Fire: blast them back
  leaf({
    id: 'apprentice-fire-ward',
    params: { everyMs: 4000, knockback: 120 },
    disciplineId: FIRE,
    column: 'charger',
    name: 'Fire Ward',
    text: 'Once every few seconds, an enemy reaching melee range sets off its own sigils and is knocked back a step.',
  }),
  leaf({
    id: 'apprentice-tinderbox',
    params: { everyMs: 8000, radius: 400 },
    disciplineId: FIRE,
    column: 'ambusher',
    name: 'Tinderbox',
    text: 'Once in a while, an enemy appearing beside you sets off your sigils on every enemy around you at once.',
  }),
  leaf({
    id: 'apprentice-smokescreen',
    params: { ms: 2000, lessPct: 0.5 },
    disciplineId: FIRE,
    column: 'shooter',
    name: 'Smokescreen',
    text: 'For a moment after a detonation, the enemies it hit deal half damage to you with ranged hits.',
  }),
  // Frost: lock them out
  leaf({
    id: 'apprentice-frozen-step',
    params: { holdMs: 1500 },
    disciplineId: FROST,
    column: 'charger',
    name: 'Frozen Step',
    text: 'A charge that reaches you freezes the charger for a moment, or leaves it brittle if it cannot be held.',
  }),
  leaf({
    id: 'apprentice-cold-shoulder',
    params: { lessPct: 0.5, holdMs: 1500 },
    disciplineId: FROST,
    column: 'ambusher',
    name: 'Cold Shoulder',
    text: 'The first hit an ambusher lands on you is halved and freezes it.',
  }),
  leaf({
    id: 'apprentice-frost-mirror',
    params: { everyMs: 8000, holdMs: 1500 },
    disciplineId: FROST,
    column: 'shooter',
    name: 'Frost Mirror',
    text: 'Each ranged hit on you lays a frost sigil on the shooter, and a shooter full of them freezes.',
  }),
];

export const APPRENTICE_KIT: ClassKit<ApprenticePiece, ApprenticeTrophy> = {
  classId: 'dot',
  className: 'apprentice',
  displayName: 'Apprentice',
  systemName: 'Payoff rules',
  budget: { label: 'Sigils', steps: APPRENTICE_SIGIL_STEPS },
  pieces: PIECES,
  lessons: LESSONS,
  trophies: TROPHIES,
  disciplines: DISCIPLINES,
  specializations: SPECIALIZATIONS,
  leaves: LEAVES,
};
