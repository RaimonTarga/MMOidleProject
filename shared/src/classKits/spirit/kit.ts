/**
 * The Spirit's kit (`energy`): bible §11.
 *
 * The storm in a bottle: one bar that is both damage and shield. Pieces are **spends**
 * (strikes, squalls) and **calms**, placed in bands on the Thresholds gauge; each spend
 * waits for its moment. The relic slot's trophy is a spend relic or a storm relic. The
 * budget is the bottle's size in pips.
 *
 * Task K5 enters T1–T4 (§11.4, §11.8, §11.16), the trophies (§11.9), the disciplines
 * (§11.5), specializations (§11.6) and leaves (§11.7). `params` stay empty for the
 * class runtime.
 */
import { standardBudgetSteps } from '../budget';
import { STARTER, fromDiscipline, learn, rankUp, zone } from '../kitHelpers';
import type { MomentId } from '../moments';
import type {
  ClassKit,
  DisciplineDef,
  LeafDef,
  PieceDef,
  SpecializationDef,
  TrophyDef,
} from '../types';

/** Piece families (§11.3): strikes (damage), squalls (control and movement), calms (protection). */
export type SpiritFamily = 'strike' | 'squall' | 'calm';

export interface SpiritPieceExtra {
  /**
   * The moment it waits for inside its band (§11.3): Thunderclap waits for an enemy touching
   * you, Downpour for a poison or bleed on you. Absent: it fires whenever its band allows.
   */
  waitsFor?: MomentId;
  /** A calm that sits at the floor rather than in a band (Eye of the Storm). */
  atFloor?: true;
}

export type SpiritPiece = PieceDef<SpiritFamily, SpiritPieceExtra>;

/** Spend relics twist every spend; storm relics twist the gauge (§11.9). */
export type SpiritTrophyKind = 'spend' | 'storm';
export type SpiritTrophy = TrophyDef<SpiritTrophyKind>;

export function spiritPiece(piece: Omit<SpiritPiece, 'classId' | 'params'> & { params?: SpiritPiece['params'] }): SpiritPiece {
  return { classId: 'energy', ...piece, params: piece.params ?? {} };
}

export function spiritTrophy(entry: Omit<SpiritTrophy, 'classId' | 'params'> & { params?: SpiritTrophy['params'] }): SpiritTrophy {
  return { classId: 'energy', ...entry, params: entry.params ?? {} };
}

function spiritDiscipline(entry: Omit<DisciplineDef, 'classId' | 'params'>): DisciplineDef {
  return { classId: 'energy', params: {}, ...entry };
}

function spiritSpecialization(entry: Omit<SpecializationDef, 'classId' | 'params'>): SpecializationDef {
  return { classId: 'energy', params: {}, ...entry };
}

function spiritLeaf(entry: Omit<LeafDef, 'classId' | 'params' | 'tier'> & { params?: LeafDef['params'] }): LeafDef {
  return { classId: 'energy', tier: 4, ...entry, params: entry.params ?? {} };
}

const PIECES: readonly SpiritPiece[] = [
  spiritPiece({
    id: 'spirit-bolt',
    params: { costPips: 0.75, mult: 2 },
    name: 'Bolt',
    family: 'strike',
    text: 'Spends part of your storm on one bolt of lightning at the target.',
  }),
  // ── T1 (§11.4) ──
  spiritPiece({
    id: 'spirit-chain-lightning',
    params: { costPips: 1, mult: 1.6, leaps: 3, leapPct: 0.6, radius: 160 },
    name: 'Chain Lightning',
    family: 'strike',
    text: 'Leaps from the target to the three nearest enemies.',
  }),
  spiritPiece({
    id: 'spirit-thunderclap',
    params: { costPips: 0.75, radius: 120, staggerMs: 700, atkSlowPct: 0.3, slowMs: 3000 },
    name: 'Thunderclap',
    family: 'squall',
    waitsFor: 'touched',
    text: 'Staggers every enemy around you for a moment.',
    ranks: [{ rank: 2, text: 'What it staggers also attacks slower for a few seconds.' }],
  }),
  spiritPiece({
    id: 'spirit-downpour',
    params: { costPips: 0.5 },
    name: 'Downpour',
    family: 'calm',
    waitsFor: 'carrying-dot',
    text: 'Washes a poison or bleed off you.',
    ranks: [{ rank: 2, text: 'It also washes Corrosion and slows off you.' }],
  }),
  spiritPiece({
    id: 'spirit-eye-of-the-storm',
    params: { costMult: 0.5 },
    name: 'Eye of the Storm',
    family: 'calm',
    atFloor: true,
    text: 'While you are at or below your floor, hits drain your storm at half cost.',
  }),
  spiritPiece({
    id: 'spirit-thunderbolt',
    params: { costPips: 2, mult: 4.5, staggerMs: 900 },
    name: 'Thunderbolt',
    family: 'strike',
    text: 'A costly bolt at one target. It hits very hard and staggers.',
  }),
  // ── Discipline pieces (§11.5), all strikes ──
  spiritPiece({
    id: 'spirit-ball-lightning',
    params: { costPips: 1, mult: 0.6, radius: 70, durationMs: 4000, speed: 60, tickMs: 400 },
    name: 'Ball Lightning',
    family: 'strike',
    text: 'A slow orb drifts through the pack and zaps everything it passes.',
  }),
  spiritPiece({
    id: 'spirit-storm-surge',
    params: { mult: 1.2, radius: 240 },
    name: 'Storm Surge',
    family: 'strike',
    text: 'Your surge opens with a wave that rolls through the enemies in front of you.',
  }),
  spiritPiece({
    id: 'spirit-cloudburst',
    params: { minPips: 1, multPerPip: 2.25 },
    name: 'Cloudburst',
    family: 'strike',
    text: 'Everything above your floor goes into one bolt, sized by what you spend.',
  }),
  // ── T2 (§11.16) ──
  spiritPiece({
    id: 'spirit-gale',
    params: { costPips: 0.75, radius: 200, distance: 110, stunMs: 600 },
    name: 'Gale',
    family: 'squall',
    text: 'A gust in front of you blows enemies back a few steps. A charge caught in it stops dead.',
  }),
  spiritPiece({
    id: 'spirit-hailstorm',
    params: { costPips: 1.25, mult: 0.35, radius: 110, durationMs: 3000, tickMs: 500, shieldMult: 2 },
    name: 'Hailstorm',
    family: 'strike',
    text: 'Hail pelts the area around the target for a few seconds. Hailstones hit shields and barriers twice as hard.',
  }),
  spiritPiece({
    id: 'spirit-updraft',
    params: { costPips: 0.5, staggerMs: 800 },
    name: 'Updraft',
    family: 'calm',
    waitsFor: 'inside-telegraph',
    text: 'When the ground is about to erupt under you, a gust lifts you clear.',
    ranks: [{ rank: 2, text: 'The gust also throws the surfacing enemy off its feet.' }],
  }),
  spiritPiece({
    id: 'spirit-flare',
    params: { costPips: 0.5, radius: 220, staggerMs: 800 },
    name: 'Flare',
    family: 'squall',
    waitsFor: 'ambush',
    text: 'A flash around you reveals hidden ambushers and staggers them.',
  }),
  spiritPiece({
    id: 'spirit-dust-devil',
    params: { costPips: 0.75, pull: 300, rootMs: 1000 },
    name: 'Dust Devil',
    family: 'squall',
    waitsFor: 'ranged-attacker',
    text: 'A whirlwind runs down the farthest enemy attacking you and drags it toward you.',
    ranks: [{ rank: 2, text: "The dragged enemy can't move away for a moment." }],
  }),
  // ── T3 (§11.16) ──
  spiritPiece({
    id: 'spirit-downburst',
    params: { costPips: 0.75, pinMs: 1200, lineLength: 420, lineWidth: 70 },
    name: 'Downburst',
    family: 'squall',
    waitsFor: 'charging-at-me',
    text: 'A column of wind slams down on a charging enemy and pins it for a moment.',
    ranks: [{ rank: 2, text: 'It pins every enemy in a line.' }],
  }),
  spiritPiece({
    id: 'spirit-tailwind',
    params: { costPips: 0.5, distance: 220 },
    name: 'Tailwind',
    family: 'calm',
    waitsFor: 'drag-or-push',
    text: 'When something drags or shoves you, a gust carries you back.',
  }),
  spiritPiece({
    id: 'spirit-forked-bolt',
    params: { costPips: 1, mult: 1.6, forks: 2, leapPct: 0.6, radius: 260 },
    name: 'Forked Bolt',
    family: 'strike',
    sidegradeOf: 'spirit-chain-lightning',
    text: 'Splits toward the two enemies farthest from you, catching the ones that flee.',
  }),
  spiritPiece({
    id: 'spirit-foehn',
    params: { costPips: 0.5, melt: 3 },
    name: 'Foehn',
    family: 'calm',
    waitsFor: 'chill-threshold',
    text: 'When the Chill on you nears its threshold, a warm wind melts it back down.',
  }),
  spiritPiece({
    id: 'spirit-ash-lightning',
    params: { costPips: 1.5, mult: 2.2, heatPct: 0.08, splashRadius: 160, splashPct: 0.5 },
    name: 'Ash Lightning',
    family: 'strike',
    text: "The volcano's own lightning. It hits harder for each step of the fight's Heat.",
    ranks: [{ rank: 2, text: 'It also strikes the enemies around the target.' }],
  }),
  // ── T4 (§11.16) ──
  spiritPiece({
    id: 'spirit-sleet',
    params: { costPips: 1.25, mult: 0.5, radius: 50, durationMs: 3000, tickMs: 500, shieldMult: 3, shells: 1 },
    name: 'Sleet',
    family: 'strike',
    sidegradeOf: 'spirit-hailstorm',
    text: 'A narrow sheet of sleet on one target. It breaks shells three times as fast.',
  }),
  spiritPiece({
    id: 'spirit-ground-charge',
    params: { costPips: 0.75, radius: 110, durationMs: 6000, stunMs: 1000, distance: 160 },
    name: 'Ground Charge',
    family: 'squall',
    text: 'A charged patch under you. The first enemy to leap at you is thrown back and stunned.',
  }),
  spiritPiece({
    id: 'spirit-dust-wall',
    params: { costPips: 0.75, radius: 240, distance: 150, stunMs: 600, allSides: 1 },
    name: 'Dust Wall',
    family: 'squall',
    sidegradeOf: 'spirit-gale',
    text: 'A wall of dust rolls out from you in every direction, pushing everything back.',
  }),
  spiritPiece({
    id: 'spirit-thunderstorm',
    params: { costPips: 1.5, mult: 0.5, radius: 300, durationMs: 4000, tickMs: 400 },
    name: 'Thunderstorm',
    family: 'strike',
    text: 'For a few seconds, lightning strikes at random among every enemy around you.',
  }),
  spiritPiece({
    id: 'spirit-maelstrom',
    params: { costPips: 0.75, dragGap: 90 },
    name: 'Maelstrom',
    family: 'squall',
    waitsFor: 'target-out-of-reach',
    text: 'When the enemy you fight dives out of reach, a whirlpool drags it back to the surface.',
  }),
];

const LESSONS = [
  learn('spirit-bolt', STARTER),
  // T1
  learn('spirit-chain-lightning', zone('plains', 1)),
  learn('spirit-thunderclap', zone('forest', 1)),
  learn('spirit-downpour', zone('swamp', 1)),
  learn('spirit-eye-of-the-storm', zone('mountain', 1)),
  learn('spirit-thunderbolt', zone('cave', 1)),
  // Disciplines (§11.5)
  learn('spirit-ball-lightning', fromDiscipline('spirit-overflow')),
  learn('spirit-storm-surge', fromDiscipline('spirit-tide')),
  learn('spirit-cloudburst', fromDiscipline('spirit-reservoir')),
  // T2
  learn('spirit-gale', zone('plains', 2)),
  rankUp('spirit-thunderclap', 2, zone('forest', 2)),
  learn('spirit-hailstorm', zone('mountain', 2)),
  rankUp('spirit-downpour', 2, zone('swamp', 2)),
  learn('spirit-updraft', zone('cave', 2)),
  learn('spirit-flare', zone('jungle', 2)),
  learn('spirit-dust-devil', zone('desert', 2)),
  // T3
  learn('spirit-downburst', zone('mountain', 3)),
  rankUp('spirit-updraft', 2, zone('cave', 3)),
  learn('spirit-tailwind', zone('swamp', 3)),
  learn('spirit-forked-bolt', zone('jungle', 3), 'sidegrade'),
  rankUp('spirit-dust-devil', 2, zone('desert', 3)),
  learn('spirit-foehn', zone('tundra', 3)),
  learn('spirit-ash-lightning', zone('volcanic', 3)),
  // T4
  rankUp('spirit-downburst', 2, zone('mountain', 4)),
  learn('spirit-sleet', zone('tundra', 4), 'sidegrade'),
  learn('spirit-ground-charge', zone('jungle', 4)),
  learn('spirit-dust-wall', zone('desert', 4), 'sidegrade'),
  rankUp('spirit-ash-lightning', 2, zone('volcanic', 4)),
  learn('spirit-thunderstorm', zone('graveyard', 4)),
  learn('spirit-maelstrom', zone('trench', 4)),
];

/**
 * One trophy per boss lineage (§11.9). Rank 1 is the twist; later ranks are only what
 * that rank adds. A rank whose twist §11.9 does not state is left out.
 */
const TROPHIES: readonly SpiritTrophy[] = [
  spiritTrophy({
    id: 'spirit-relic-plains',
    params: { extra: 2, pct: 0.4, rank2Extra: 1 },
    lineage: 'plains',
    name: 'Crosswind',
    kind: 'spend',
    text: 'Every spend also strikes the two enemies nearest its target, and those strikes are weaker.',
    ranks: [{ rank: 2, bossTier: 2, text: 'It strikes three enemies.' }],
  }),
  spiritTrophy({
    id: 'spirit-relic-forest',
    params: { discount: 0.2, windowMs: 3000, buildStep: 0.1, maxDiscount: 0.5 },
    lineage: 'forest',
    name: 'Squall',
    kind: 'spend',
    text: 'Each spend soon after the last costs a little less.',
    ranks: [{ rank: 2, bossTier: 2, text: 'The discount builds faster.' }],
  }),
  spiritTrophy({
    id: 'spirit-relic-swamp',
    params: { radius: 140, mult: 3, washes: 1, rank3MultX: 1.5 },
    lineage: 'swamp',
    name: 'Marsh Fire',
    kind: 'storm',
    text: 'When hits empty your storm, it bursts and strikes everything around you.',
    ranks: [
      { rank: 2, bossTier: 2, text: 'The burst also washes a debuff off you.' },
      { rank: 3, bossTier: 3, text: 'The burst is bigger.' },
    ],
  }),
  spiritTrophy({
    id: 'spirit-relic-mountain',
    params: { mult: 2, ignorePlating: 0.5, staggerMs: 700 },
    lineage: 'mountain',
    name: 'Thunderhead',
    kind: 'storm',
    text: 'A full storm makes your next spend twice as big.',
    ranks: [
      { rank: 2, bossTier: 2, text: 'That spend also ignores part of the plating.' },
      { rank: 3, bossTier: 3, text: 'A storm four-fifths full counts as full.' },
      { rank: 4, bossTier: 4, text: 'That spend also staggers.' },
    ],
  }),
  spiritTrophy({
    id: 'spirit-relic-cave',
    params: { durationMs: 4000, zapMult: 2, rank2DurationX: 1.5, passRadius: 90 },
    lineage: 'cave',
    name: 'Static Web',
    kind: 'spend',
    text: 'Enemies a spend hits stay charged for a few seconds, and your plain attacks hit them twice as hard.',
    ranks: [
      { rank: 2, bossTier: 2, text: 'The charge lasts longer.' },
      { rank: 3, bossTier: 3, text: 'A charged enemy passes its charge to one enemy touching it.' },
    ],
  }),
  spiritTrophy({
    id: 'spirit-relic-jungle',
    params: { followPx: 300, perHundredPx: 0.15, rank2X: 1.5, rank3X: 2 },
    lineage: 'jungle',
    name: 'Running Storm',
    kind: 'spend',
    text: 'A spend whose target flees follows it and lands harder the farther it ran.',
    // §11.9: "II; III" with no twist.
    ranks: [
      { rank: 2, bossTier: 3, text: 'Running Storm grows stronger.' },
      { rank: 3, bossTier: 4, text: 'Running Storm grows stronger.' },
    ],
  }),
  spiritTrophy({
    id: 'spirit-relic-desert',
    params: { radius: 180, slowPct: 0.3, rank2RadiusX: 1.4, rank3SlowX: 1.5 },
    lineage: 'desert',
    name: 'Sandstorm',
    kind: 'storm',
    text: 'While you are above your floor, a ring of blowing sand slows the enemies inside it.',
    // §11.9 rank III has no twist.
    ranks: [
      { rank: 2, bossTier: 3, text: 'The ring is wider.' },
      { rank: 3, bossTier: 4, text: 'Sandstorm grows stronger.' },
    ],
  }),
  spiritTrophy({
    id: 'spirit-relic-tundra',
    params: { radius: 90, durationMs: 5000, slowPct: 0.3, rank2SlowX: 1.5 },
    lineage: 'tundra',
    name: 'Ice Storm',
    kind: 'spend',
    text: 'Every spend glazes the ground under its target. Enemies on it are slowed, and bosses that accept no control ignore it.',
    // §11.9: "II" with no twist.
    ranks: [
      { rank: 2, bossTier: 4, text: 'Ice Storm grows stronger.' },
    ],
  }),
  spiritTrophy({
    id: 'spirit-relic-volcanic',
    params: { radius: 160, mult: 1.5, everyMs: 3000, rank2MultX: 1.5 },
    lineage: 'volcanic',
    name: 'Pyrocumulus',
    kind: 'storm',
    text: 'A full storm boils over. While you stay full, a burst strikes around you every few seconds.',
    // §11.9: "II" with no twist.
    ranks: [
      { rank: 2, bossTier: 4, text: 'Pyrocumulus grows stronger.' },
    ],
  }),
  spiritTrophy({
    id: 'spirit-relic-graveyard',
    params: { pct: 0.5, reach: 700 },
    lineage: 'graveyard',
    name: 'Stray Bolts',
    kind: 'spend',
    text: 'Every spend also strikes a random enemy elsewhere in the fight.',
    ranks: [],
  }),
  spiritTrophy({
    id: 'spirit-relic-trench',
    params: { gatherX: 2, firstX: 2 },
    lineage: 'trench',
    name: 'Depth Charge',
    kind: 'storm',
    text: 'While your target is out of reach, your storm gathers twice as fast. Your first spend when it resurfaces is twice as big.',
    ranks: [],
  }),
];

/** Overflow, Tide, Reservoir (§11.5). */
const DISCIPLINES: readonly DisciplineDef[] = [
  spiritDiscipline({
    id: 'spirit-overflow',
    name: 'Overflow',
    fantasy: "I'm crackling with more than I can hold, and it pours off me.",
    text: 'The bottle has a brim, not a cap. Flow past the brim arcs off you into the nearest enemies, faster the more you hold, and that overflow shields you too.',
    pieceId: 'spirit-ball-lightning',
  }),
  spiritDiscipline({
    id: 'spirit-tide',
    name: 'Tide',
    fantasy: 'I gather, I break over them, I pull back.',
    text: 'The storm comes in a tide. In the ebb you cannot spend, the flow runs fast, and you drift back. In the surge you cannot gather, spends cost less, and you close in. You ebb to full, then surge down to the floor.',
    pieceId: 'spirit-storm-surge',
  }),
  spiritDiscipline({
    id: 'spirit-reservoir',
    name: 'Reservoir',
    fantasy: "A deep storm behind a dam; when it's enough, the dam breaks.",
    text: 'The bottle is much deeper. You release the whole bank when it is enough to finish the target, or at a mark you set. A full bank makes you nearly untouchable, and releasing it leaves you bare.',
    pieceId: 'spirit-cloudburst',
  }),
];

/** Three specializations per discipline (§11.6). */
const SPECIALIZATIONS: readonly SpecializationDef[] = [
  spiritSpecialization({
    id: 'spirit-stormdancer',
    disciplineId: 'spirit-overflow',
    name: 'Stormdancer',
    text: 'While you overflow, you blink between enemies. Each landing lets loose a burst of the spill.',
  }),
  spiritSpecialization({
    id: 'spirit-spillway',
    disciplineId: 'spirit-overflow',
    name: 'Spillway',
    text: 'Spends you make while overflowing carry the spill to their target, wherever the bolt lands.',
  }),
  spiritSpecialization({
    id: 'spirit-lightning-rod',
    disciplineId: 'spirit-overflow',
    name: 'Lightning Rod',
    text: 'The spill stops arcing around you. All of it strikes your target.',
  }),
  spiritSpecialization({
    id: 'spirit-spring-tide',
    disciplineId: 'spirit-tide',
    name: 'Spring Tide',
    text: 'Every third tide runs twice as high. That ebb fills the bottle to double, and the surge spends it all.',
  }),
  spiritSpecialization({
    id: 'spirit-slack-water',
    disciplineId: 'spirit-tide',
    name: 'Slack Water',
    text: 'You stand your ground instead of moving with the tide. During the ebb, hits drain your storm at half cost.',
  }),
  spiritSpecialization({
    id: 'spirit-breakwater',
    disciplineId: 'spirit-tide',
    name: 'Breakwater',
    text: 'Each surge ends in a wave that crashes over everything in front of you, sized by what the surge spent.',
  }),
  spiritSpecialization({
    id: 'spirit-gathering-dark',
    disciplineId: 'spirit-reservoir',
    name: 'Gathering Dark',
    text: 'While the bank is full, it keeps darkening. The release grows each second you hold it, up to double, and your shield does not grow.',
  }),
  spiritSpecialization({
    id: 'spirit-overcast',
    disciplineId: 'spirit-reservoir',
    name: 'Overcast',
    text: 'The release splits into one bolt for each enemy around the target, and the bank is shared between them.',
  }),
  spiritSpecialization({
    id: 'spirit-deep-well',
    disciplineId: 'spirit-reservoir',
    name: 'Deep Well',
    text: 'Each release keeps a third of the bank back as your shield, so the bolts are smaller and you are never left bare.',
  }),
];

/**
 * T4 leaves (§11.7). The question is what empties your storm: the spike, the swarm,
 * or the slow drain.
 */
const LEAVES: readonly LeafDef[] = [
  spiritLeaf({
    id: 'spirit-shunt',
    params: { everyMs: 5000, share: 0.25 },
    disciplineId: 'spirit-overflow',
    column: 'spike',
    name: 'Shunt',
    text: 'Once every few seconds, a hit worth over a quarter of your storm goes into the spill instead. It costs you nothing and arcs back out at enemies.',
  }),
  spiritLeaf({
    id: 'spirit-static-field',
    params: { costMult: 0.667 },
    disciplineId: 'spirit-overflow',
    column: 'swarm',
    name: 'Static Field',
    text: 'Hits from enemies caught in your spill drain your storm a third less.',
  }),
  spiritLeaf({
    id: 'spirit-burn-off',
    params: { decayX: 2 },
    disciplineId: 'spirit-overflow',
    column: 'slow-drain',
    name: 'Burn Off',
    text: 'While you overflow, poisons and bleeds on you end twice as fast.',
  }),
  spiritLeaf({
    id: 'spirit-turn-of-the-tide',
    params: { hpShare: 0.25, flowX: 2, flowMs: 4000, distance: 160 },
    disciplineId: 'spirit-tide',
    column: 'spike',
    name: 'Turn of the Tide',
    text: 'A hit over a quarter of your health during a surge turns the tide at once. You ebb, pulling back and gathering fast.',
  }),
  spiritLeaf({
    id: 'spirit-wading',
    params: { radius: 220, slowPct: 0.3 },
    disciplineId: 'spirit-tide',
    column: 'swarm',
    name: 'Wading',
    text: 'Enemies that follow you through the ebb are slowed.',
  }),
  spiritLeaf({
    id: 'spirit-cleansing-tide',
    params: { debuffs: 1 },
    disciplineId: 'spirit-tide',
    column: 'slow-drain',
    name: 'Cleansing Tide',
    text: 'Every turn of the tide washes one debuff off you.',
  }),
  spiritLeaf({
    id: 'spirit-dam',
    params: { share: 0.25 },
    disciplineId: 'spirit-reservoir',
    column: 'spike',
    name: 'Dam',
    text: 'While the bank is above your floor, no single hit drains more than a quarter of the bottle. The rest of that hit is lost.',
  }),
  spiritLeaf({
    id: 'spirit-levee',
    params: { enemies: 3, costMult: 0.8 },
    disciplineId: 'spirit-reservoir',
    column: 'swarm',
    name: 'Levee',
    text: 'While three or more enemies are around you, hits drain your storm a fifth less.',
  }),
  spiritLeaf({
    id: 'spirit-calm-depths',
    params: { decayX: 2 },
    disciplineId: 'spirit-reservoir',
    column: 'slow-drain',
    name: 'Calm Depths',
    text: 'While the bank is full, debuffs on you last half as long.',
  }),
];

export const SPIRIT_KIT: ClassKit<SpiritPiece, SpiritTrophy> = {
  classId: 'energy',
  className: 'spirit',
  displayName: 'Spirit',
  systemName: 'Thresholds',
  /** Illustrative: Storm 4 → 5 at Mastery 15 → 6 at 30 (§11.2). */
  budget: { label: 'Storm', steps: standardBudgetSteps(4) },
  pieces: PIECES,
  lessons: LESSONS,
  trophies: TROPHIES,
  disciplines: DISCIPLINES,
  specializations: SPECIALIZATIONS,
  leaves: LEAVES,
};
