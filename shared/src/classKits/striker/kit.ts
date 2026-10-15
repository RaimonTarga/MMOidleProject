/**
 * The Striker's kit (`cadence`): bible §12.
 *
 * The combo fighter. Pieces are **techniques** placed on the beats of the Order; the
 * finisher is the relic slot's trophy (a plain finisher until the first boss kill). The
 * budget is "open, then master": each step opens a beat for a technique, then masters one.
 *
 * Complete through T4: the T1 form (§12.4) and every T2–T4 lesson and trophy (§12.16) are
 * here; the disciplines (§12.5), specializations (§12.6) and leaves (§12.7) are in
 * `tree.ts`. This kit is the worked example for the other kits.
 */
import { standardBudgetSteps } from '../budget';
import { STARTER, learn, rankUp, zone } from '../kitHelpers';
import type { ClassKit, KitParams, PieceDef, TrophyDef } from '../types';
import { STRIKER_DISCIPLINES, STRIKER_LEAVES, STRIKER_SPECIALIZATIONS } from './tree';

/**
 * Technique families (§12.8): attack setups (make your beats faster or harder; Light's),
 * finisher setups and control (Heavy's), damage techniques (Balanced's).
 */
export type StrikerFamily = 'damage' | 'attack-setup' | 'finisher-setup';

export interface StrikerPieceExtra {
  /**
   * A cast sits at one of two positions, at most one of each per combo (§12.2): the opener
   * (the first beat) or the wind-up (the beat before the finisher). Attack speed never
   * shortens a cast.
   */
  cast?: 'opener' | 'windup';
  /** A control technique (slow, stun, root, knockdown): what Subjugator feeds on (§12.6). */
  control?: true;
  /** The combo's last beat. Only the plain finisher carries this; trophies replace it. */
  finisher?: true;
}

export type StrikerPiece = PieceDef<StrikerFamily, StrikerPieceExtra>;

/** Spark trophies ride the next combo; weight trophies land on the finisher (§12.9). */
export type StrikerTrophyKind = 'spark' | 'weight';
export type StrikerTrophy = TrophyDef<StrikerTrophyKind>;

export function technique(piece: Omit<StrikerPiece, 'classId' | 'params'> & { params?: KitParams }): StrikerPiece {
  return { classId: 'cadence', ...piece, params: piece.params ?? {} };
}

export function strikerTrophy(entry: Omit<StrikerTrophy, 'classId' | 'params'> & { params?: KitParams }): StrikerTrophy {
  return { classId: 'cadence', ...entry, params: entry.params ?? {} };
}

const PIECES: readonly StrikerPiece[] = [
  technique({
    id: 'striker-finisher',
    name: 'Finisher',
    family: 'damage',
    finisher: true,
    text: "The last beat of every combo: one heavy blow. Each boss you beat gives you a finisher of its own.",
  }),
  // ── T1 (§12.4) ──
  technique({
    id: 'striker-sweep',
    name: 'Sweep',
    family: 'damage',
    text: 'You hit every enemy around you.',
    // Each other enemy within `radius` px takes `splashPct` of the beat's full swing.
    params: { radius: 90, splashPct: 0.6 },
  }),
  technique({
    id: 'striker-hamstring',
    name: 'Hamstring',
    // An attack setup by §12.16's family totals (4 by T2); also control, which Subjugator reads.
    family: 'attack-setup',
    control: true,
    text: 'The target attacks and moves slower for a moment.',
    params: { moveSlowPct: 0.3, attackSlowPct: 0.2, durationMs: 2500 },
  }),
  technique({
    id: 'striker-rend',
    name: 'Rend',
    family: 'damage',
    text: 'You open a bleed on the target.',
    // `ticks` ticks of `tickPct` of the beat's full swing, one every `tickMs`.
    params: { ticks: 4, tickMs: 1000, tickPct: 0.15 },
    ranks: [{ rank: 2, text: 'The bleed lasts longer and cuts deeper.', params: { ticks: 6, tickPct: 0.2 } }],
  }),
  technique({
    id: 'striker-coil',
    name: 'Coil',
    family: 'finisher-setup',
    cast: 'windup',
    text: 'You wind up before the finisher, and the finisher hits much harder.',
    params: { castMs: 900, finisherBonusPct: 0.6 },
  }),
  technique({
    id: 'striker-focus',
    name: 'Focus',
    family: 'attack-setup',
    cast: 'opener',
    text: 'You open the combo with a breath of focus, and every beat after it swings faster.',
    // Lasts until the finisher; `maxMs` only ends one a broken combo left behind.
    params: { castMs: 700, attackSpeedPct: 0.25, maxMs: 15000 },
  }),
  // ── T2 (§12.16) ──
  technique({
    id: 'striker-whirlwind',
    name: 'Whirlwind',
    family: 'damage',
    sidegradeOf: 'striker-sweep',
    // The bible calls it a cast but gives it no position (opener or wind-up): `cast` waits
    // for the designer.
    text: 'You spin through every enemy around you three times.',
  }),
  technique({
    id: 'striker-feint',
    name: 'Feint',
    family: 'attack-setup',
    text: 'You feint instead of striking: no damage, but your next beat is a critical hit.',
  }),
  technique({
    id: 'striker-armor-break',
    name: 'Armor Break',
    family: 'attack-setup',
    text: "You crack the target's plating for a few seconds.",
  }),
  technique({
    id: 'striker-concuss',
    name: 'Concuss',
    family: 'finisher-setup',
    control: true,
    text: 'You stun the target for a moment.',
  }),
  technique({
    id: 'striker-charge',
    name: 'Charge',
    // A damage technique by §12.16's family totals (4 by T2).
    family: 'damage',
    cast: 'opener',
    text: 'You open the combo with a dash to the target and a strike, catching enemies that run or keep their distance.',
  }),
  technique({
    id: 'striker-pin',
    name: 'Pin',
    family: 'finisher-setup',
    control: true,
    text: "You root the target in place, so it can't back away from you.",
  }),
  // ── T3 (§12.16) ──
  technique({
    id: 'striker-earthsplitter',
    name: 'Earthsplitter',
    family: 'damage',
    cast: 'windup',
    text: 'You wind up before the finisher, then slam down through a line of enemies.',
  }),
  technique({
    id: 'striker-upheaval',
    name: 'Upheaval',
    family: 'finisher-setup',
    control: true,
    sidegradeOf: 'striker-concuss',
    text: 'The ground erupts under the target and knocks it down, along with every enemy touching it.',
  }),
  technique({
    id: 'striker-hemorrhage',
    name: 'Hemorrhage',
    family: 'damage',
    sidegradeOf: 'striker-rend',
    text: 'You open a deep bleed that outlasts Rend.',
  }),
  technique({
    id: 'striker-triple-cut',
    name: 'Triple Cut',
    family: 'damage',
    text: 'You cut three times in quick succession, and each cut sets off your hit effects.',
  }),
  technique({
    id: 'striker-shadowstep',
    name: 'Shadowstep',
    family: 'attack-setup',
    cast: 'opener',
    text: 'You open the combo by stepping behind the target, and your next beat is sure to be a critical hit.',
  }),
  technique({
    id: 'striker-icebreaker',
    name: 'Icebreaker',
    family: 'damage',
    text: 'You hit much harder against a target behind a shield or shell.',
  }),
  technique({
    id: 'striker-overheat',
    name: 'Overheat',
    family: 'attack-setup',
    cast: 'opener',
    text: 'You open the combo overheated: your beats swing much faster, but you take more damage until the finisher.',
  }),
  // ── T4 (§12.16) ──
  technique({
    id: 'striker-avalanche',
    name: 'Avalanche',
    family: 'finisher-setup',
    control: true,
    cast: 'windup',
    sidegradeOf: 'striker-earthsplitter',
    text: 'You wind up before the finisher, then charge through a line of enemies and knock them all down.',
  }),
  technique({
    id: 'striker-frostbind',
    name: 'Frostbind',
    family: 'finisher-setup',
    control: true,
    sidegradeOf: 'striker-pin',
    text: 'Ice roots everything around the target for a moment. Bosses immune to roots ignore it.',
  }),
  technique({
    id: 'striker-bloodrush',
    name: 'Bloodrush',
    family: 'attack-setup',
    sidegradeOf: 'striker-focus',
    text: 'Without a cast, your beats come faster for the rest of the combo.',
  }),
  technique({
    id: 'striker-coup-de-grace',
    name: 'Coup de Grâce',
    family: 'damage',
    text: 'You hit much harder against a target low on HP.',
  }),
  technique({
    id: 'striker-magma-breaker',
    name: 'Magma Breaker',
    family: 'damage',
    cast: 'windup',
    text: 'You wind up before the finisher, then strike the target and everything around it, harder against a shell.',
  }),
  technique({
    id: 'striker-reaping-arc',
    name: 'Reaping Arc',
    family: 'damage',
    text: 'You cut a wide arc through every enemy around you.',
  }),
  technique({
    id: 'striker-pressure-point',
    name: 'Pressure Point',
    family: 'finisher-setup',
    text: 'Your next finisher hits this target much harder.',
  }),
];

/** Every tier, each living biome teaches one lesson (§12.8, §12.16). */
const LESSONS = [
  learn('striker-finisher', STARTER),
  // T1 (§12.4)
  learn('striker-sweep', zone('plains', 1)),
  learn('striker-hamstring', zone('forest', 1)),
  learn('striker-rend', zone('swamp', 1)),
  learn('striker-coil', zone('mountain', 1)),
  learn('striker-focus', zone('cave', 1)),
  // T2
  learn('striker-whirlwind', zone('plains', 2), 'sidegrade'),
  learn('striker-feint', zone('forest', 2)),
  learn('striker-armor-break', zone('mountain', 2)),
  rankUp('striker-rend', 2, zone('swamp', 2)),
  learn('striker-concuss', zone('cave', 2)),
  learn('striker-charge', zone('jungle', 2)),
  learn('striker-pin', zone('desert', 2)),
  // T3 (the Plains and Forest have retired)
  learn('striker-earthsplitter', zone('mountain', 3)),
  learn('striker-upheaval', zone('cave', 3), 'sidegrade'),
  learn('striker-hemorrhage', zone('swamp', 3), 'sidegrade'),
  learn('striker-triple-cut', zone('jungle', 3)),
  learn('striker-shadowstep', zone('desert', 3)),
  learn('striker-icebreaker', zone('tundra', 3)),
  learn('striker-overheat', zone('volcanic', 3)),
  // T4 (the Swamp and Cave have retired)
  learn('striker-avalanche', zone('mountain', 4), 'sidegrade'),
  learn('striker-frostbind', zone('tundra', 4), 'sidegrade'),
  learn('striker-bloodrush', zone('jungle', 4), 'sidegrade'),
  learn('striker-coup-de-grace', zone('desert', 4)),
  learn('striker-magma-breaker', zone('volcanic', 4)),
  learn('striker-reaping-arc', zone('graveyard', 4)),
  learn('striker-pressure-point', zone('trench', 4)),
];

/** One trophy per boss lineage (§12.4, §12.16); ranks come from the same lineage's later bosses. */
const TROPHIES: readonly StrikerTrophy[] = [
  strikerTrophy({
    id: 'striker-relic-plains',
    lineage: 'plains',
    name: 'Wide Arc',
    kind: 'spark',
    text: "Your next combo's beats each also strike one enemy beside the target.",
    params: { extraTargets: 1, radius: 110, damagePct: 0.5 },
    ranks: [{ rank: 2, bossTier: 2, text: 'They strike two extra enemies.', params: { extraTargets: 2 } }],
  }),
  strikerTrophy({
    id: 'striker-relic-forest',
    lineage: 'forest',
    name: 'Double Slash',
    kind: 'spark',
    text: 'Every beat of your next combo strikes twice, each strike a bit over half as hard.',
    params: { strikePct: 0.55 },
    ranks: [{ rank: 2, bossTier: 2, text: 'Each strike hits harder.', params: { strikePct: 0.65 } }],
  }),
  strikerTrophy({
    id: 'striker-relic-swamp',
    lineage: 'swamp',
    name: 'Festering Cut',
    kind: 'weight',
    text: "Your finisher's wound rots, dealing part of its damage again.",
    // `sharePct` of the finisher's damage, spread over `ticks` ticks `tickMs` apart.
    params: { sharePct: 0.3, ticks: 3, tickMs: 1000 },
    ranks: [
      { rank: 2, bossTier: 2, text: 'The rot deals a bigger share.', params: { sharePct: 0.4 } },
      { rank: 3, bossTier: 3, text: 'The rot deals a bigger share still.', params: { sharePct: 0.5 } },
    ],
  }),
  strikerTrophy({
    id: 'striker-relic-mountain',
    lineage: 'mountain',
    name: 'Skyfall',
    kind: 'weight',
    text: 'Your finisher becomes a cast: a longer wind-up, then a blow about twice as big.',
    params: { castMs: 1500, blowMult: 2 },
    ranks: [
      { rank: 2, bossTier: 2, text: 'The blow also ignores part of the plating.' },
      { rank: 3, bossTier: 3, text: 'The wind-up is shorter.', params: { castMs: 1100 } },
      { rank: 4, bossTier: 4, text: 'The blow hits harder still.', params: { blowMult: 2.5 } },
    ],
  }),
  strikerTrophy({
    id: 'striker-relic-cave',
    lineage: 'cave',
    name: 'Sunder',
    kind: 'weight',
    text: 'Your finisher exposes the target: it takes more damage from everyone for a few seconds.',
    params: { damageTakenPct: 0.12, durationMs: 5000 },
    ranks: [
      { rank: 2, bossTier: 2, text: 'The exposed target also loses plating.' },
      { rank: 3, bossTier: 3, text: 'The exposure lasts longer.', params: { durationMs: 7000 } },
    ],
  }),
  // ── New lineages from T2 on (§12.16). A rank the bible names without its twist says only
  // that the trophy grows stronger. ──
  strikerTrophy({
    id: 'striker-relic-jungle',
    lineage: 'jungle',
    name: 'Pounce',
    kind: 'weight',
    text: 'Your finisher leaps to the target, reaching it even if it ran, and hits harder the farther it leaps.',
    ranks: [
      { rank: 2, bossTier: 3, text: 'The landing also hits the enemies around it.' },
      { rank: 3, bossTier: 4, text: 'Pounce grows stronger.' },
    ],
  }),
  strikerTrophy({
    id: 'striker-relic-desert',
    lineage: 'desert',
    name: 'Verdict',
    kind: 'weight',
    text: 'Your finisher kills the target outright once its HP is low enough.',
    ranks: [
      { rank: 2, bossTier: 3, text: "It kills outright with more of the target's HP left." },
      { rank: 3, bossTier: 4, text: 'Verdict grows stronger.' },
    ],
  }),
  strikerTrophy({
    id: 'striker-relic-tundra',
    lineage: 'tundra',
    name: 'Hoarfrost',
    kind: 'spark',
    text: 'Every beat of your next combo slows the target a little more. Bosses immune to slows ignore it.',
    ranks: [{ rank: 2, bossTier: 4, text: 'Hoarfrost grows stronger.' }],
  }),
  strikerTrophy({
    id: 'striker-relic-volcanic',
    lineage: 'volcanic',
    name: 'Eruption',
    kind: 'weight',
    text: 'Your finisher hits the target and everything around it, harder against a target with a shell up.',
    ranks: [{ rank: 2, bossTier: 4, text: 'Eruption grows stronger.' }],
  }),
  strikerTrophy({
    id: 'striker-relic-graveyard',
    lineage: 'graveyard',
    name: 'Grave Toll',
    kind: 'spark',
    text: "Your next combo's beats hit harder for every enemy in the fight.",
    ranks: [],
  }),
  strikerTrophy({
    id: 'striker-relic-trench',
    lineage: 'trench',
    name: 'Deep Pressure',
    kind: 'weight',
    text: 'Your finisher deals more damage the more HP the target has left.',
    ranks: [],
  }),
];

export const STRIKER_KIT: ClassKit<StrikerPiece, StrikerTrophy> = {
  classId: 'cadence',
  className: 'striker',
  displayName: 'Striker',
  systemName: 'the Order',
  /** Illustrative T1: one slot at the start, two at Mastery 15, three at Mastery 30 (§12.3). */
  budget: { label: 'Techniques', steps: standardBudgetSteps(1) },
  pieces: PIECES,
  lessons: LESSONS,
  trophies: TROPHIES,
  disciplines: STRIKER_DISCIPLINES,
  specializations: STRIKER_SPECIALIZATIONS,
  leaves: STRIKER_LEAVES,
};
