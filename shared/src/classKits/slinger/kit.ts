/**
 * The Slinger's kit (`reload`): bible §10.
 *
 * The gunslinger. Pieces are **clip types**: every round in a clip is the same, and the
 * Loadout's free rules pick the next clip at each reload. The relic slot's trophy is the
 * **last round** of every clip. The budget is rack slots, then double loads.
 *
 * Entered through T4: clip types (§10.4, §10.16), trophy rounds (§10.9), disciplines
 * (§10.5), specializations (§10.6) and leaves (§10.7). The disciplines bring rules, not
 * pieces. Clip colours are the ammo ring's (ICONS-T1 uses the same ones).
 */
import { STARTER, learn, rankUp, zone } from '../kitHelpers';
import type {
  BudgetStep,
  ClassKit,
  DisciplineDef,
  LeafDef,
  LessonDef,
  PieceDef,
  SpecializationDef,
  TrophyDef,
} from '../types';

/** Clip families (§10.8). The plain clip is the damage clip. */
export type SlingerFamily = 'damage' | 'control' | 'utility';

export interface SlingerPieceExtra {
  /** The ammo ring's colour for this clip (`#rrggbb`). */
  color: string;
  /** The plain clip: always in the rack, takes no slot, pays no price (§10.3). */
  plain?: true;
}

export type SlingerPiece = PieceDef<SlingerFamily, SlingerPieceExtra>;

/** Every Slinger trophy is a round loaded last in every clip (§10.2). */
export type SlingerTrophyKind = 'round';
export type SlingerTrophy = TrophyDef<SlingerTrophyKind>;

/** The trophy rounds' colour on the ring. */
export const SLINGER_LAST_ROUND_COLOR = '#f5c542';

export function clip(piece: Omit<SlingerPiece, 'classId' | 'params'> & { params?: SlingerPiece['params'] }): SlingerPiece {
  return { classId: 'reload', ...piece, params: piece.params ?? {} };
}

export function slingerTrophy(entry: Omit<SlingerTrophy, 'classId' | 'params' | 'kind'> & { params?: SlingerTrophy['params'] }): SlingerTrophy {
  return { classId: 'reload', kind: 'round', ...entry, params: entry.params ?? {} };
}

function discipline(entry: Omit<DisciplineDef, 'classId' | 'params'>): DisciplineDef {
  return { classId: 'reload', params: {}, ...entry };
}

function specialization(entry: Omit<SpecializationDef, 'classId' | 'params'>): SpecializationDef {
  return { classId: 'reload', params: {}, ...entry };
}

/** T4 leaves (§10.7). Later leaf tiers are not designed yet. */
function leaf(entry: Omit<LeafDef, 'classId' | 'params' | 'tier'>): LeafDef {
  return { classId: 'reload', params: {}, tier: 4, ...entry };
}

const PIECES: readonly SlingerPiece[] = [
  clip({
    id: 'slinger-plain-clip',
    name: 'Plain clip',
    family: 'damage',
    plain: true,
    color: '#9aa3ad',
    text: 'Plain rounds that hit the hardest. Always in your rack.',
  }),
  // ── T1 (§10.4) ──
  clip({
    id: 'slinger-scatter',
    params: { nicks: 2, nickPct: 0.4, damagePct: 0.9 },
    name: 'Scatter',
    family: 'damage',
    color: '#f2a33a',
    text: 'Each round bursts on impact and nicks up to two enemies beside your target.',
  }),
  clip({
    id: 'slinger-snare',
    params: { slowPerRound: 0.08, slowCap: 0.4, durationMs: 3000, damagePct: 0.9 },
    name: 'Snare',
    family: 'control',
    color: '#39c9b8',
    text: "Each round slows the target's movement and attacks a little. The slow stops growing past a point.",
    ranks: [{ rank: 2, text: "It builds faster, and at its strongest the target's wind-ups take longer.", params: { slowPerRound: 0.12, capAttackSlow: 0.3 } }],
  }),
  clip({
    id: 'slinger-venom',
    params: { ticksPerRound: 2, maxTicks: 12, tickShare: 0.2, tickMs: 1000, damagePct: 0.9 },
    name: 'Venom',
    family: 'damage',
    color: '#8fdc3c',
    text: 'Each round poisons the target, and the poison keeps hurting them.',
    ranks: [{ rank: 2, text: 'The poison hurts more and lasts longer.', params: { ticksPerRound: 3, maxTicks: 18, tickShare: 0.3 } }],
  }),
  clip({
    id: 'slinger-stopping',
    params: { shovePx: 22, maxShoves: 4, windowMs: 3000, damagePct: 0.9 },
    name: 'Stopping',
    family: 'control',
    color: '#4a78ff',
    text: 'Each round shoves the target back a little, so a charger reaches you later.',
    ranks: [{ rank: 2, text: 'A charger you stop is also staggered.' }],
  }),
  clip({
    id: 'slinger-breaching',
    params: { platingMult: 0.25, damagePct: 0.9 },
    name: 'Breaching',
    family: 'damage',
    color: '#ff5a3c',
    text: "Each round ignores most of the target's plating.",
    ranks: [{ rank: 2, text: "Rounds ignore all of the target's plating.", params: { platingMult: 0 } }],
  }),
  // ── T2 (§10.16) ──
  clip({
    id: 'slinger-buckshot',
    params: { damagePct: 0.9, pelletPct: 0.25, maxPellets: 3, coneDeg: 35, coneRangePx: 220, closeBonus: 0.5, closePx: 160 },
    name: 'Buckshot',
    family: 'damage',
    color: '#d9822b',
    sidegradeOf: 'slinger-scatter',
    text: 'Each round sprays a cone of pellets that hits harder up close. The pellets stop a charging enemy in its tracks.',
  }),
  clip({
    id: 'slinger-shellbreaker',
    params: { damagePct: 0.9, barrierMult: 2 },
    name: 'Shellbreaker',
    family: 'utility',
    color: '#b8c4ff',
    text: 'Each round hits barriers and shields twice as hard.',
    ranks: [{ rank: 2, text: 'A barrier breaks after a few rounds.' }],
  }),
  clip({
    id: 'slinger-tracer',
    params: { damagePct: 0.9, tracedMs: 8000 },
    name: 'Tracer',
    family: 'utility',
    color: '#ff6fd8',
    text: "Each round tags its target, so it can't hide, vanish, or break away from you. Ambushers in cover are revealed.",
    ranks: [
      { rank: 2, text: 'A traced target also moves slower while it flees.' },
      { rank: 3, text: 'Rounds hit a traced target harder while it flees or hides.' },
    ],
  }),
  clip({
    id: 'slinger-hollow-point',
    params: { damagePct: 0.9, belowHp: 0.5, bonusPct: 0.5 },
    name: 'Hollow-point',
    family: 'damage',
    color: '#ff9f6b',
    text: 'Each round hits harder when the target is below half health.',
    ranks: [{ rank: 2, text: 'The bonus doubles when the target is below a third of its health.' }],
  }),
  // ── T3 ──
  clip({
    id: 'slinger-seeker',
    name: 'Seeker',
    family: 'utility',
    color: '#9b7bff',
    text: 'Rounds find a target that has burrowed, dived, or gone out of sight, and they hit lighter.',
  }),
  clip({
    id: 'slinger-acid',
    name: 'Acid',
    family: 'damage',
    color: '#c6e34a',
    sidegradeOf: 'slinger-venom',
    text: "Instead of poison, each round eats a little of the target's plating. It stops eating past a point.",
  }),
  clip({
    id: 'slinger-tether',
    name: 'Tether',
    family: 'control',
    color: '#2fa39a',
    text: "A target hit by several rounds in a row can't dash or teleport away for a moment.",
  }),
  clip({
    id: 'slinger-frost',
    name: 'Frost',
    family: 'control',
    color: '#8fe6ff',
    text: 'Each round chills the target, so it attacks and moves slower. The chill stops growing, and it never freezes.',
    ranks: [{ rank: 2, text: 'The chill builds twice as fast, and Ice Armor takes twice as much of it.' }],
  }),
  clip({
    id: 'slinger-incendiary',
    name: 'Incendiary',
    family: 'damage',
    color: '#ff7a1a',
    text: 'Each round sets the target burning. The burn stops growing, and it never detonates.',
  }),
  // ── T4 ──
  clip({
    id: 'slinger-thermite',
    name: 'Thermite',
    family: 'damage',
    color: '#ff3d6e',
    sidegradeOf: 'slinger-incendiary',
    text: 'The burn eats shells. Obsidian and ice shells take it twice as hard.',
  }),
  clip({
    id: 'slinger-hallowed',
    name: 'Hallowed',
    family: 'damage',
    color: '#fff1b8',
    text: 'Risen enemies take twice as much from these rounds, and they rise weaker.',
  }),
  clip({
    id: 'slinger-exploit',
    name: 'Exploit',
    family: 'damage',
    color: '#b06cff',
    text: 'Each round hits harder for each different harmful effect on the target.',
  }),
];

const LESSONS: readonly LessonDef[] = [
  learn('slinger-plain-clip', STARTER),
  // T1
  learn('slinger-scatter', zone('plains', 1)),
  learn('slinger-snare', zone('forest', 1)),
  learn('slinger-venom', zone('swamp', 1)),
  learn('slinger-stopping', zone('mountain', 1)),
  learn('slinger-breaching', zone('cave', 1)),
  // T2
  learn('slinger-buckshot', zone('plains', 2), 'sidegrade'),
  rankUp('slinger-snare', 2, zone('forest', 2)),
  learn('slinger-shellbreaker', zone('mountain', 2)),
  rankUp('slinger-venom', 2, zone('swamp', 2)),
  rankUp('slinger-breaching', 2, zone('cave', 2)),
  learn('slinger-tracer', zone('jungle', 2)),
  learn('slinger-hollow-point', zone('desert', 2)),
  // T3
  rankUp('slinger-stopping', 2, zone('mountain', 3)),
  learn('slinger-seeker', zone('cave', 3)),
  learn('slinger-acid', zone('swamp', 3), 'sidegrade'),
  rankUp('slinger-tracer', 2, zone('jungle', 3)),
  learn('slinger-tether', zone('desert', 3)),
  learn('slinger-frost', zone('tundra', 3)),
  learn('slinger-incendiary', zone('volcanic', 3)),
  // T4
  rankUp('slinger-shellbreaker', 2, zone('mountain', 4)),
  rankUp('slinger-frost', 2, zone('tundra', 4)),
  rankUp('slinger-tracer', 3, zone('jungle', 4)),
  rankUp('slinger-hollow-point', 2, zone('desert', 4)),
  learn('slinger-thermite', zone('volcanic', 4), 'sidegrade'),
  learn('slinger-hallowed', zone('graveyard', 4)),
  learn('slinger-exploit', zone('trench', 4)),
];

/**
 * One trophy round per boss lineage (§10.4, §10.9, §10.16).
 *
 * Named in §10.16 without a twist, so left out: Rot Round III, Hunter's Round II and III,
 * Bounty Round III, Rime Round II, Cinder Round II.
 */
const TROPHIES: readonly SlingerTrophy[] = [
  slingerTrophy({
    id: 'slinger-relic-plains',
    params: { shovePx: 90, lineLength: 240, lineWidth: 44 },
    lineage: 'plains',
    name: 'Stampede Round',
    text: 'Your last round knocks the target, and everything in a line behind it, back.',
    ranks: [{ rank: 2, bossTier: 2, text: 'The shove also knocks them down.', params: { knockdownMs: 1200 } }],
  }),
  slingerTrophy({
    id: 'slinger-relic-forest',
    params: { secondShotPct: 0.6 },
    lineage: 'forest',
    name: 'Twin Round',
    text: 'Your last round fires twice.',
    ranks: [{ rank: 2, bossTier: 2, text: 'Both shots hit at full strength.', params: { secondShotPct: 1 } }],
  }),
  slingerTrophy({
    id: 'slinger-relic-swamp',
    params: { sharePct: 0.5, ticks: 4, tickMs: 1000 },
    lineage: 'swamp',
    name: 'Rot Round',
    text: "Your last round's wound rots, and it hits again over a few seconds.",
    ranks: [
      { rank: 2, bossTier: 2, text: 'The rot deals a bigger share.', params: { sharePct: 0.8 } },
      { rank: 3, bossTier: 3, text: 'Rot Round grows stronger.' },
    ],
  }),
  slingerTrophy({
    id: 'slinger-relic-mountain',
    params: { radius: 110, blastPct: 0.8 },
    lineage: 'mountain',
    name: 'Quake Round',
    text: 'Your last round is a heavy slug that hits everything around the target.',
    ranks: [
      { rank: 2, bossTier: 2, text: 'The blast is wider, and it also cracks plating.', params: { radius: 150, crackFraction: 0.3, crackMs: 6000 } },
      { rank: 3, bossTier: 3, text: 'It knocks down.' },
      { rank: 4, bossTier: 4, text: 'The blast leaves aftershocks.' },
    ],
  }),
  slingerTrophy({
    id: 'slinger-relic-cave',
    params: { splinters: 3, splinterPct: 0.5, radius: 220 },
    lineage: 'cave',
    name: 'Splinter Round',
    text: 'Your last round splits into three that strike the nearest other enemies.',
    ranks: [
      { rank: 2, bossTier: 2, text: 'It splits into four.', params: { splinters: 4 } },
      { rank: 3, bossTier: 3, text: 'Each splinter splits once more.' },
    ],
  }),
  slingerTrophy({
    id: 'slinger-relic-jungle',
    params: { farPctPer100px: 0.2 },
    lineage: 'jungle',
    name: "Hunter's Round",
    text: "Your last round follows its target, can't miss a fleeing enemy, and hits harder the farther it flies.",
    ranks: [
      { rank: 2, bossTier: 3, text: "Hunter's Round grows stronger." },
      { rank: 3, bossTier: 4, text: "Hunter's Round grows stronger." },
    ],
  }),
  slingerTrophy({
    id: 'slinger-relic-desert',
    params: { threshold: 0.15 },
    lineage: 'desert',
    name: 'Bounty Round',
    text: 'Your last round finishes a target below a threshold of its health.',
    ranks: [
      { rank: 2, bossTier: 3, text: 'The threshold is higher.' },
      { rank: 3, bossTier: 4, text: 'Bounty Round grows stronger.' },
    ],
  }),
  slingerTrophy({
    id: 'slinger-relic-tundra',
    lineage: 'tundra',
    name: 'Rime Round',
    text: 'Your last round leaves frozen ground that slows enemies standing on it.',
    ranks: [
      { rank: 2, bossTier: 4, text: 'Rime Round grows stronger.' },
    ],
  }),
  slingerTrophy({
    id: 'slinger-relic-volcanic',
    lineage: 'volcanic',
    name: 'Cinder Round',
    text: 'Your last round sets everything around the target burning.',
    ranks: [
      { rank: 2, bossTier: 4, text: 'Cinder Round grows stronger.' },
    ],
  }),
  slingerTrophy({
    id: 'slinger-relic-graveyard',
    lineage: 'graveyard',
    name: 'Toll Round',
    text: 'Your last round hits harder for every enemy in the fight.',
    ranks: [],
  }),
  slingerTrophy({
    id: 'slinger-relic-trench',
    lineage: 'trench',
    name: 'Harpoon Round',
    text: "Your last round harpoons the target. For a few seconds it can't dive, burrow, or flee.",
    ranks: [],
  }),
];

/** Gunslinger, Siege, Trickshot (§10.5). Rules, not pieces. */
const DISCIPLINES: readonly DisciplineDef[] = [
  discipline({
    id: 'slinger-gunslinger',
    name: 'Gunslinger',
    fantasy: 'Two guns, never still for long.',
    text: 'You hold two of whatever gun you carry, each with half the clip and its own clip type. Shots alternate between them, and both reload together in a quick spin.',
  }),
  discipline({
    id: 'slinger-siege',
    name: 'Siege',
    fantasy: 'I dig in and shell everything.',
    text: 'You load a big drum, and the reload is long. Every round charges a siege gun on your back, and reloading fires it where your target stands, a blast made of the rounds you fired.',
  }),
  discipline({
    id: 'slinger-trickshot',
    name: 'Trickshot',
    fantasy: 'Every clip ends with the impossible shot.',
    text: 'Your last round flies to a target your rule picks, anywhere in range, past whatever stands in the way, and it hits harder.',
  }),
];

/** Three specializations per discipline (§10.6). */
const SPECIALIZATIONS: readonly SpecializationDef[] = [
  specialization({
    id: 'slinger-fan-the-hammer',
    disciplineId: 'slinger-gunslinger',
    name: 'Fan the Hammer',
    text: "After every reload spin, both guns' first three rounds fire at triple speed.",
  }),
  specialization({
    id: 'slinger-crossfire',
    disciplineId: 'slinger-gunslinger',
    name: 'Crossfire',
    text: "A target hit by both guns back to back takes both clips' effects, and harder.",
  }),
  specialization({
    id: 'slinger-gun-kata',
    disciplineId: 'slinger-gunslinger',
    name: 'Gun Kata',
    text: "You fight at arm's length. Rounds hit much harder up close, and both guns fire at once at enemies in melee with you.",
  }),
  specialization({
    id: 'slinger-deathmark',
    disciplineId: 'slinger-siege',
    name: 'Deathmark',
    text: 'Rounds mark the enemies they hit, one mark each. When you reload, the shell bursts on every marked enemy at once.',
  }),
  specialization({
    id: 'slinger-entrenched',
    disciplineId: 'slinger-siege',
    name: 'Entrenched',
    text: 'The longer you stand still, the faster you fire and the bigger your shell grows, up to a point. Moving resets it, and standing to reload counts.',
  }),
  specialization({
    id: 'slinger-rolling-fire',
    disciplineId: 'slinger-siege',
    name: 'Rolling Fire',
    text: 'The shell fires in small blasts every few rounds, and the reload carries none of it.',
  }),
  specialization({
    id: 'slinger-ricochet',
    disciplineId: 'slinger-trickshot',
    name: 'Ricochet',
    text: 'The called shot bounces on to two more enemies your rule picks, and each one does what the last round does.',
  }),
  specialization({
    id: 'slinger-pierce',
    disciplineId: 'slinger-trickshot',
    name: 'Pierce',
    text: 'The called shot passes through every enemy between you and its target, and each one takes the full shot.',
  }),
  specialization({
    id: 'slinger-deadeye',
    disciplineId: 'slinger-trickshot',
    name: 'Deadeye',
    text: "You can hold the last round, and the clip waits for your rule's moment or a few seconds. A held round hits much harder.",
  }),
];

/**
 * T4 leaves (§10.7). Columns answer "what goes wrong?": caught reloading, they reach
 * you, or the wrong clip is loaded.
 */
const LEAVES: readonly LeafDef[] = [
  leaf({
    id: 'slinger-light-hands',
    disciplineId: 'slinger-gunslinger',
    column: 'caught-reloading',
    name: 'Light Hands',
    text: 'While you reload, the first hit every few seconds deals half as much.',
  }),
  leaf({
    id: 'slinger-slip-away',
    disciplineId: 'slinger-gunslinger',
    column: 'they-reach-you',
    name: 'Slip Away',
    text: 'While an enemy is in melee with you, you move a quarter faster.',
  }),
  leaf({
    id: 'slinger-quick-swap',
    disciplineId: 'slinger-gunslinger',
    column: 'wrong-clip',
    name: 'Quick Swap',
    text: 'When you switch clips early, you keep the rounds you had left, and they come back in the next clip.',
  }),
  leaf({
    id: 'slinger-bunker',
    disciplineId: 'slinger-siege',
    column: 'caught-reloading',
    name: 'Bunker',
    text: 'While you reload, you take a quarter less damage.',
  }),
  leaf({
    id: 'slinger-stakes',
    disciplineId: 'slinger-siege',
    column: 'they-reach-you',
    name: 'Stakes',
    text: 'An enemy that charges or rushes you stops dead at your feet for a moment. Each enemy can be caught only once every few seconds.',
  }),
  leaf({
    id: 'slinger-fresh-powder',
    disciplineId: 'slinger-siege',
    column: 'wrong-clip',
    name: 'Fresh Powder',
    text: 'The shell takes on the clip you are loading, not the one you fired, so a switch reload fires the right shell at once.',
  }),
  leaf({
    id: 'slinger-cool-reload',
    disciplineId: 'slinger-trickshot',
    column: 'caught-reloading',
    name: 'Cool Reload',
    text: 'While you reload, a telegraphed attack aimed at you deals half as much.',
  }),
  leaf({
    id: 'slinger-steady-nerve',
    disciplineId: 'slinger-trickshot',
    column: 'they-reach-you',
    name: 'Steady Nerve',
    text: "While an enemy is in melee with you, you can't be stunned or knocked back.",
  }),
  leaf({
    id: 'slinger-improvise',
    disciplineId: 'slinger-trickshot',
    column: 'wrong-clip',
    name: 'Improvise',
    text: "When the loaded clip does nothing to the called shot's target, that shot hits a third harder.",
  }),
];

/**
 * Illustrative (§10.2): one rack slot at the start, two at Mastery 15, three at 30, four by
 * the end of T2; from T3 each step lets one clip carry two properties (a double load).
 */
const RACK_STEPS: readonly BudgetStep[] = [
  { mastery: 0, value: 1 },
  { mastery: 15, value: 2 },
  { mastery: 30, value: 3 },
  { mastery: 72, value: 4 },
  { mastery: 86, value: 5 },
  { mastery: 100, value: 6 },
  { mastery: 114, value: 7 },
  { mastery: 128, value: 8 },
  { mastery: 142, value: 9 },
  { mastery: 156, value: 10 },
];

/** Rack slots stop at four; every step after that is one more double load. */
export const SLINGER_RACK_SLOT_MAX = 4;

export function slingerRack(value: number): { slots: number; doubleLoads: number } {
  return {
    slots: Math.min(value, SLINGER_RACK_SLOT_MAX),
    doubleLoads: Math.max(0, value - SLINGER_RACK_SLOT_MAX),
  };
}

export const SLINGER_KIT: ClassKit<SlingerPiece, SlingerTrophy> = {
  classId: 'reload',
  className: 'slinger',
  displayName: 'Slinger',
  systemName: 'the Loadout',
  budget: {
    label: 'Rack',
    steps: RACK_STEPS,
    describe: (value) => {
      const { slots, doubleLoads } = slingerRack(value);
      if (doubleLoads === 0) return String(slots);
      return `${slots}, ${doubleLoads} double load${doubleLoads === 1 ? '' : 's'}`;
    },
  },
  pieces: PIECES,
  lessons: LESSONS,
  trophies: TROPHIES,
  disciplines: DISCIPLINES,
  specializations: SPECIALIZATIONS,
  leaves: LEAVES,
};
