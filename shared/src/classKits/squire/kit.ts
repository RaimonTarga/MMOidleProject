/**
 * The Squire's kit (`cooldown`): bible §8.
 *
 * The shield that hits back. Pieces are **responses** in the Response rules: each answers
 * one specific enemy action, costs Resolve and refunds more when it lands. The slam fires
 * at a full bar; the relic slot's trophy twists the slam or how Resolve flows. The budget is
 * Resolve's size in pips.
 *
 * Through T4 (§8.8): the slam, 16 new responses and 2 sidegrades taught by the zones (§8.4,
 * §8.16), 8 rank-ups, the three discipline pieces and Last Breath, which every Squire learns
 * with its T2 pick. Then the eleven trophies (§8.9), the disciplines (§8.5), specializations
 * (§8.6) and the T4 leaves (§8.7).
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

/**
 * Response families (§8.3): guards (take it better), counters (hit back), holds (move
 * enemies). The slam and Last Breath sit outside the three families.
 */
export type SquireFamily = 'guard' | 'counter' | 'hold' | 'slam' | 'emergency';

export interface SquirePieceExtra {
  /** The enemy action it answers (§8.3, rule 1): its natural trigger and default rule. */
  answers?: MomentId;
}

export type SquirePiece = PieceDef<SquireFamily, SquirePieceExtra>;

/** Slam relics change what the slam does; Resolve relics change how you gain or spend it (§8.9). */
export type SquireTrophyKind = 'slam' | 'resolve';
export type SquireTrophy = TrophyDef<SquireTrophyKind>;

/** The T2 picks (§8.5): Avenger (light), Bulwark (balanced), Juggernaut (heavy). */
export type SquireDisciplineId = 'squire-avenger' | 'squire-bulwark' | 'squire-juggernaut';

/** The T4 question, "what happens when you can't answer?" (§8.7), one column per answer. */
export type SquireLeafColumn = 'empty-bar' | 'wasted-answer' | 'quiet';

export function response(piece: Omit<SquirePiece, 'classId' | 'params'>): SquirePiece {
  return { classId: 'cooldown', params: {}, ...piece };
}

export function squireTrophy(entry: Omit<SquireTrophy, 'classId' | 'params'>): SquireTrophy {
  return { classId: 'cooldown', params: {}, ...entry };
}

function discipline(
  entry: Omit<DisciplineDef, 'classId' | 'params'> & { id: SquireDisciplineId },
): DisciplineDef {
  return { classId: 'cooldown', params: {}, ...entry };
}

function specialization(
  entry: Omit<SpecializationDef, 'classId' | 'params'> & { disciplineId: SquireDisciplineId },
): SpecializationDef {
  return { classId: 'cooldown', params: {}, ...entry };
}

function leaf(
  entry: Omit<LeafDef, 'classId' | 'params' | 'tier'> & {
    disciplineId: SquireDisciplineId;
    column: SquireLeafColumn;
  },
): LeafDef {
  return { classId: 'cooldown', params: {}, tier: 4, ...entry };
}

const PIECES: readonly SquirePiece[] = [
  response({
    id: 'squire-slam',
    name: 'Slam',
    family: 'slam',
    text: 'When your Resolve bar is full, you slam everything around you with the shield. Each boss you beat changes the slam or how Resolve flows.',
  }),
  // ── T1 (§8.4) ──
  response({
    id: 'squire-shove',
    name: 'Shove',
    family: 'hold',
    answers: 'enemies-near',
    text: 'When three or more enemies crowd you, you shove them all back a step with your shield.',
  }),
  response({
    id: 'squire-riposte',
    name: 'Riposte',
    family: 'counter',
    answers: 'repeat-hits',
    text: 'The third time one enemy hits you, you strike it back at once.',
  }),
  response({
    id: 'squire-steel-will',
    name: 'Steel Will',
    family: 'guard',
    answers: 'dot-landed',
    text: 'When a poison or bleed lands on you, you spend Resolve to shake it off.',
    ranks: [{ rank: 2, text: 'It also shakes off corrosion and slows.' }],
  }),
  response({
    id: 'squire-guard',
    name: 'Guard',
    family: 'guard',
    answers: 'telegraph-at-me',
    text: 'When a telegraphed blow is aimed at you, you brace behind your shield: it deals much less, and catching it gives Resolve back.',
    ranks: [
      { rank: 2, text: 'One brace also catches a second telegraphed blow that comes within a few seconds.' },
      { rank: 3, text: 'A caught blow also staggers its attacker.' },
    ],
  }),
  response({
    id: 'squire-shield-bash',
    name: 'Shield Bash',
    family: 'counter',
    answers: 'enemy-winds-up',
    text: 'When the enemy you fight starts a wind-up, you bash it with your shield: the stun interrupts it.',
  }),
  // ── T2 (§8.16) ──
  response({
    id: 'squire-stand-fast',
    name: 'Stand Fast',
    family: 'guard',
    sidegradeOf: 'squire-guard',
    answers: 'charging-at-me',
    text: 'When an enemy charges at you, you brace for it: the charge stops dead and the charger staggers.',
  }),
  response({
    id: 'squire-unshaken',
    name: 'Unshaken',
    family: 'guard',
    answers: 'control-on-me',
    // The bible names only the trigger; the effect is the dive log's (Break Free's successor).
    text: 'When a stun, root or knockdown lands on you, you spend Resolve to break free.',
  }),
  response({
    id: 'squire-splitting-blow',
    name: 'Splitting Blow',
    family: 'counter',
    answers: 'target-shielded',
    text: 'When your target raises a shield or barrier, you strike a blow that hits barriers twice as hard.',
    ranks: [{ rank: 2, text: 'The blow breaks Ice Armor in one hit.' }],
  }),
  response({
    id: 'squire-earthstamp',
    name: 'Earthstamp',
    family: 'hold',
    answers: 'burrow-at-me',
    text: 'When an enemy burrows or dashes unseen toward you, you stamp the ground: it surfaces at your feet, staggered.',
    ranks: [{ rank: 2, text: 'The stamp also knocks down everything around it.' }],
  }),
  response({
    id: 'squire-watchful',
    name: 'Watchful',
    family: 'guard',
    answers: 'ambush',
    text: "An ambusher's first hit on you is caught on your shield, at no cost, and fills your Resolve.",
    ranks: [{ rank: 2, text: 'The caught ambusher is staggered.' }],
  }),
  response({
    id: 'squire-challenge',
    name: 'Challenge',
    family: 'hold',
    answers: 'ranged-attacker',
    text: 'When an enemy hits you from range, kites you or attacks an ally, you pull it onto you.',
    ranks: [{ rank: 2, text: "A pulled enemy can't move away for a moment." }],
  }),
  // ── T3 (§8.16) ──
  response({
    id: 'squire-anchor',
    name: 'Anchor',
    family: 'guard',
    answers: 'drag-or-push',
    text: "When something drags or pushes you, you plant your feet: you don't move, and it fills your Resolve.",
    ranks: [{ rank: 2, text: 'Not even a push into a hazard can move you.' }],
  }),
  response({
    id: 'squire-chain-hook',
    name: 'Chain Hook',
    family: 'hold',
    answers: 'target-flees',
    text: 'When your target flees, you hook it and drag it back.',
  }),
  response({
    id: 'squire-frostward',
    name: 'Frostward',
    family: 'guard',
    answers: 'chill-threshold',
    text: 'When the Chill on you is about to freeze you, you hold it there for a few seconds instead.',
  }),
  response({
    id: 'squire-backdraft',
    name: 'Backdraft',
    family: 'counter',
    answers: 'fire-attack',
    text: 'When a fire attack or burning shot comes at you, you throw the heat back at its source.',
  }),
  // ── T4 (§8.16) ──
  response({
    id: 'squire-disarm',
    name: 'Disarm',
    family: 'counter',
    sidegradeOf: 'squire-shield-bash',
    answers: 'enemy-winds-up',
    text: "When the enemy you fight starts a big attack, you disarm it: the attack lands at half strength. It isn't a stun, so it works even on bosses that can't be controlled.",
  }),
  response({
    id: 'squire-lay-to-rest',
    name: 'Lay to Rest',
    family: 'hold',
    answers: 'risen',
    text: 'When a fallen enemy rises near you, you strike it down before it stands.',
  }),
  response({
    id: 'squire-lie-in-wait',
    name: 'Lie in Wait',
    family: 'counter',
    answers: 'target-out-of-reach',
    text: 'When your target dives out of reach, you hold your slam, and it lands twice as hard when the target comes back.',
  }),
  // ── The discipline pieces (§8.5) ──
  response({
    id: 'squire-parry',
    name: 'Parry',
    family: 'counter',
    answers: 'telegraph-at-me',
    text: 'When a telegraphed melee blow is aimed at you, you negate it and counter at once. It costs more than Guard and fails against ground telegraphs and ranged shots.',
  }),
  response({
    id: 'squire-intercept',
    name: 'Intercept',
    family: 'hold',
    answers: 'ally-threatened',
    text: 'When an ally stands under a telegraph or runs low on HP, you step in front of them and take the blow.',
  }),
  response({
    id: 'squire-unbowed',
    name: 'Unbowed',
    family: 'guard',
    answers: 'big-hit',
    text: 'When an untelegraphed blow takes a big share of your HP, you spend Resolve to take it on your armor, where your plating counts double.',
  }),
  // ── Every Squire's one emergency answer (§8.3, §8.10) ──
  response({
    id: 'squire-last-breath',
    name: 'Last Breath',
    family: 'emergency',
    answers: 'hp-low',
    text: 'When your HP runs low, you spend your whole Resolve bar to heal.',
  }),
];

const LESSONS = [
  learn('squire-slam', STARTER),
  // T1: each biome's threat teaches its answer (§8.4)
  learn('squire-shove', zone('plains', 1)),
  learn('squire-riposte', zone('forest', 1)),
  learn('squire-steel-will', zone('swamp', 1)),
  learn('squire-guard', zone('mountain', 1)),
  learn('squire-shield-bash', zone('cave', 1)),
  // T2 (§8.16)
  learn('squire-stand-fast', zone('plains', 2), 'sidegrade'),
  learn('squire-unshaken', zone('forest', 2)),
  learn('squire-splitting-blow', zone('mountain', 2)),
  rankUp('squire-steel-will', 2, zone('swamp', 2)),
  learn('squire-earthstamp', zone('cave', 2)),
  learn('squire-watchful', zone('jungle', 2)),
  learn('squire-challenge', zone('desert', 2)),
  // T3: the Plains and Forest have retired
  rankUp('squire-guard', 2, zone('mountain', 3)),
  rankUp('squire-earthstamp', 2, zone('cave', 3)),
  learn('squire-anchor', zone('swamp', 3)),
  learn('squire-chain-hook', zone('jungle', 3)),
  rankUp('squire-challenge', 2, zone('desert', 3)),
  learn('squire-frostward', zone('tundra', 3)),
  learn('squire-backdraft', zone('volcanic', 3)),
  // T4: the Swamp and Cave have retired
  rankUp('squire-guard', 3, zone('mountain', 4)),
  rankUp('squire-splitting-blow', 2, zone('tundra', 4)),
  rankUp('squire-watchful', 2, zone('jungle', 4)),
  learn('squire-disarm', zone('desert', 4), 'sidegrade'),
  rankUp('squire-anchor', 2, zone('volcanic', 4)),
  learn('squire-lay-to-rest', zone('graveyard', 4)),
  learn('squire-lie-in-wait', zone('trench', 4)),
  // The T2 pick: its discipline's piece, and Last Breath with any of them (§8.8)
  learn('squire-parry', fromDiscipline('squire-avenger')),
  learn('squire-intercept', fromDiscipline('squire-bulwark')),
  learn('squire-unbowed', fromDiscipline('squire-juggernaut')),
  learn('squire-last-breath', fromDiscipline()),
];

/**
 * One trophy per boss lineage (§8.9); ranks come from the same lineage's later bosses
 * (§8.16). Where the bible names a rank but no twist ("III: the last rank", a bare "III"),
 * the rank only grows stronger.
 */
const TROPHIES: readonly SquireTrophy[] = [
  squireTrophy({
    id: 'squire-relic-plains',
    lineage: 'plains',
    name: 'Muster',
    kind: 'resolve',
    text: 'Every enemy that joins the fight against you fills a chunk of your Resolve, whether it hits you or not.',
    ranks: [{ rank: 2, bossTier: 2, text: 'A whole wave rallying to the fight fills twice as much.' }],
  }),
  squireTrophy({
    id: 'squire-relic-forest',
    lineage: 'forest',
    name: 'Relentless',
    kind: 'resolve',
    text: 'Your slam fires at a third of a full bar, at a third the size; each slam fired soon after the last is a bit bigger.',
    ranks: [{ rank: 2, bossTier: 2, text: 'The chain of slams grows faster.' }],
  }),
  squireTrophy({
    id: 'squire-relic-swamp',
    lineage: 'swamp',
    name: 'Rot-Eater',
    kind: 'resolve',
    text: 'Poison and bleed on you fill your Resolve as if they were hits.',
    ranks: [
      { rank: 2, bossTier: 2, text: 'Every debuff that lands on you also fills your Resolve.' },
      { rank: 3, bossTier: 3, text: 'Rot-Eater grows stronger.' },
    ],
  }),
  squireTrophy({
    id: 'squire-relic-mountain',
    lineage: 'mountain',
    name: 'Faultline',
    kind: 'slam',
    text: 'Your slam runs as a shockwave down a line through the target and everything behind it, reaching enemies at range.',
    ranks: [
      { rank: 2, bossTier: 2, text: 'The shockwave hits barriers twice as hard.' },
      { rank: 3, bossTier: 3, text: 'The line runs longer.' },
      { rank: 4, bossTier: 4, text: 'Aftershocks follow along the line.' },
    ],
  }),
  squireTrophy({
    id: 'squire-relic-cave',
    lineage: 'cave',
    name: 'Corrode',
    kind: 'slam',
    text: 'Each slam strips plating from everything it hits, more with every slam.',
    ranks: [
      { rank: 2, bossTier: 2, text: 'Your slams can strip more plating in all.' },
      { rank: 3, bossTier: 3, text: 'Corrode grows stronger.' },
    ],
  }),
  squireTrophy({
    id: 'squire-relic-jungle',
    lineage: 'jungle',
    name: 'Strangler Vine',
    kind: 'slam',
    text: 'Before your slam lands, it pulls every enemy in a wide ring to you, fleeing ones included.',
    ranks: [
      { rank: 2, bossTier: 3, text: 'The ring is wider.' },
      { rank: 3, bossTier: 4, text: 'Strangler Vine grows stronger.' },
    ],
  }),
  squireTrophy({
    id: 'squire-relic-desert',
    lineage: 'desert',
    name: "Executioner's Oath",
    kind: 'resolve',
    text: 'Your slam can fire early on an enemy below a third of its HP, with whatever Resolve you have.',
    ranks: [
      { rank: 2, bossTier: 3, text: 'It works on enemies with more HP left.' },
      { rank: 3, bossTier: 4, text: "Executioner's Oath grows stronger." },
    ],
  }),
  squireTrophy({
    id: 'squire-relic-tundra',
    lineage: 'tundra',
    name: 'Deep Winter',
    kind: 'resolve',
    text: 'Your Resolve bar can fill past full, up to double, and an overfull slam hits as hard as two.',
    ranks: [{ rank: 2, bossTier: 4, text: 'The bar can fill up to triple.' }],
  }),
  squireTrophy({
    id: 'squire-relic-volcanic',
    lineage: 'volcanic',
    name: 'Kindling',
    kind: 'resolve',
    text: 'Everything that fills your Resolve fills a bit more the longer the fight has lasted.',
    ranks: [{ rank: 2, bossTier: 4, text: 'Kindling grows stronger.' }],
  }),
  squireTrophy({
    id: 'squire-relic-graveyard',
    lineage: 'graveyard',
    name: 'Charnel Ring',
    kind: 'slam',
    text: "Your slam's circle widens with every enemy in the fight.",
    ranks: [],
  }),
  squireTrophy({
    id: 'squire-relic-trench',
    lineage: 'trench',
    name: 'Undertow',
    kind: 'slam',
    text: "For a few seconds after your slam, the target can't dive, burrow or flee.",
    ranks: [],
  }),
];

/** The T2 pick (§8.5): each tilts where Resolve comes from and how it is spent, and unlocks one piece. */
const DISCIPLINES: readonly DisciplineDef[] = [
  discipline({
    id: 'squire-avenger',
    name: 'Avenger',
    fantasy: 'I read every blow and answer it.',
    text: 'Landed answers fill your Resolve much more, plain hits less. Every landed answer is followed by a quick strike at the attacker, paid from Resolve, so you slam less often.',
    pieceId: 'squire-parry',
  }),
  discipline({
    id: 'squire-bulwark',
    name: 'Bulwark',
    fantasy: 'Everything comes to me, and nothing gets past.',
    text: 'Every enemy on you fills more Resolve, by its hits and just by being there. Your slams hold: everything they hit turns on you, and the circle grows with the enemies on you.',
    pieceId: 'squire-intercept',
  }),
  discipline({
    id: 'squire-juggernaut',
    name: 'Juggernaut',
    fantasy: 'My armor is my weapon.',
    text: 'Your armor and max HP fill Resolve steadily, hit or not, and hits fill less. You spend it on one huge slam, the biggest hit you have.',
    pieceId: 'squire-unbowed',
  }),
];

/** The T3 pick (§8.6): a specialization bends Resolve or the slam's delivery. */
const SPECIALIZATIONS: readonly SpecializationDef[] = [
  // Bulwark
  specialization({
    id: 'squire-reverb',
    disciplineId: 'squire-bulwark',
    name: 'Reverb',
    text: 'Your slam lands, then rings out again at half strength a few seconds later.',
  }),
  specialization({
    id: 'squire-bastion',
    disciplineId: 'squire-bulwark',
    name: 'Bastion',
    text: 'Each enemy on you adds a pip to your Resolve bar, up to double its size; a boss counts as several.',
  }),
  specialization({
    id: 'squire-consecrate',
    disciplineId: 'squire-bulwark',
    name: 'Consecrate',
    text: 'Your slam lasts a few seconds instead: everything around you is struck again and again, and nothing can move you.',
  }),
  // Avenger
  specialization({
    id: 'squire-measure-for-measure',
    disciplineId: 'squire-avenger',
    name: 'Measure for Measure',
    text: 'Each counter hits back with part of what its answer stopped, up to a limit: the bigger the blow you caught, the harder you hit back.',
  }),
  specialization({
    id: 'squire-second-nature',
    disciplineId: 'squire-avenger',
    name: 'Second Nature',
    text: 'For a few seconds after a counter lands, your answers cost nothing.',
  }),
  specialization({
    id: 'squire-sunderer',
    disciplineId: 'squire-avenger',
    name: 'Sunderer',
    text: 'Your counters ignore plating and crack shells.',
  }),
  // Juggernaut
  specialization({
    id: 'squire-destroyer',
    disciplineId: 'squire-juggernaut',
    name: 'Destroyer',
    text: 'Your slam becomes a charge: you crash into your next target from range.',
  }),
  specialization({
    id: 'squire-inexorable',
    disciplineId: 'squire-juggernaut',
    name: 'Inexorable',
    text: 'Your bulk keeps filling your Resolve between fights and while you walk, so every fight opens with a slam.',
  }),
  specialization({
    id: 'squire-rampage',
    disciplineId: 'squire-juggernaut',
    name: 'Rampage',
    text: 'Each slam starts a burst of faster swings.',
  }),
];

/**
 * T4 leaves (§8.7): "what happens when you can't answer?" The bar is empty when something
 * comes, an answer you paid for hit nothing, or nothing is attacking you at all.
 */
const LEAVES: readonly LeafDef[] = [
  // Avenger
  leaf({
    id: 'squire-last-word',
    disciplineId: 'squire-avenger',
    column: 'empty-bar',
    name: 'Last Word',
    text: 'When your Resolve bar is empty, Parry still fires every so often, at no cost.',
  }),
  leaf({
    id: 'squire-read-again',
    disciplineId: 'squire-avenger',
    column: 'wasted-answer',
    name: 'Read Again',
    text: 'An answer that hits nothing gives back half its cost, and your next answer of the same kind costs less.',
  }),
  leaf({
    id: 'squire-seize-the-opening',
    disciplineId: 'squire-avenger',
    column: 'quiet',
    name: 'Seize the Opening',
    text: "An enemy that hasn't attacked you for a few seconds is open: your next swing on it counts as a counter.",
  }),
  // Bulwark
  leaf({
    id: 'squire-second-line',
    disciplineId: 'squire-bulwark',
    column: 'empty-bar',
    name: 'Second Line',
    text: 'When your Resolve bar empties, it refills a pip for every enemy on you, every so often.',
  }),
  leaf({
    id: 'squire-no-wasted-effort',
    disciplineId: 'squire-bulwark',
    column: 'wasted-answer',
    name: 'No Wasted Effort',
    text: 'An answer that hits nothing puts its cost into your next slam instead of losing it.',
  }),
  leaf({
    id: 'squire-goad',
    disciplineId: 'squire-bulwark',
    column: 'quiet',
    name: 'Goad',
    text: 'When nothing has hit you for a few seconds, a free Challenge pulls the nearest enemies onto you.',
  }),
  // Juggernaut
  leaf({
    id: 'squire-last-rampart',
    disciplineId: 'squire-juggernaut',
    column: 'empty-bar',
    name: 'Last Rampart',
    text: 'When your Resolve bar is empty, Unbowed still fires every so often, at no cost.',
  }),
  leaf({
    id: 'squire-focused-weight',
    disciplineId: 'squire-juggernaut',
    column: 'wasted-answer',
    name: 'Focused Weight',
    text: 'A slam that hits only one enemy gives you back a quarter of your Resolve bar.',
  }),
  leaf({
    id: 'squire-siege-engine',
    disciplineId: 'squire-juggernaut',
    column: 'quiet',
    name: 'Siege Engine',
    text: 'While nothing has hit you for a few seconds, your swings hit harder.',
  }),
];

export const SQUIRE_KIT: ClassKit<SquirePiece, SquireTrophy> = {
  classId: 'cooldown',
  className: 'squire',
  displayName: 'Squire',
  systemName: 'Response rules',
  /** Illustrative: Resolve 4 → 5 at Mastery 15 → 6 at 30 (§8.2). */
  budget: { label: 'Resolve', steps: standardBudgetSteps(4) },
  pieces: PIECES,
  lessons: LESSONS,
  trophies: TROPHIES,
  disciplines: DISCIPLINES,
  specializations: SPECIALIZATIONS,
  leaves: LEAVES,
};
