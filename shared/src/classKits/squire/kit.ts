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
  KitParams,
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

export function response(piece: Omit<SquirePiece, 'classId' | 'params'> & { params?: KitParams }): SquirePiece {
  return { classId: 'cooldown', ...piece, params: piece.params ?? {} };
}

export function squireTrophy(entry: Omit<SquireTrophy, 'classId' | 'params'> & { params?: KitParams }): SquireTrophy {
  return { classId: 'cooldown', ...entry, params: entry.params ?? {} };
}

function discipline(
  entry: Omit<DisciplineDef, 'classId' | 'params'> & { id: SquireDisciplineId; params?: KitParams },
): DisciplineDef {
  return { classId: 'cooldown', params: {}, ...entry };
}

function specialization(
  entry: Omit<SpecializationDef, 'classId' | 'params'> & { disciplineId: SquireDisciplineId; params?: KitParams },
): SpecializationDef {
  return { classId: 'cooldown', ...entry, params: entry.params ?? {} };
}

function leaf(
  entry: Omit<LeafDef, 'classId' | 'params' | 'tier'> & {
    disciplineId: SquireDisciplineId;
    column: SquireLeafColumn;
    params?: KitParams;
  },
): LeafDef {
  return { classId: 'cooldown', tier: 4, ...entry, params: entry.params ?? {} };
}

const PIECES: readonly SquirePiece[] = [
  response({
    id: 'squire-slam',
    name: 'Slam',
    family: 'slam',
    text: 'When your Resolve bar is full, you slam everything around you with the shield. Each boss you beat changes the slam or how Resolve flows.',
    // The target takes the swing times `mult` (the empowered multiplier); everything within
    // `radius` px of you takes the same blow.
    params: { mult: 5, radius: 110 },
  }),
  // ── T1 (§8.4) ──
  response({
    id: 'squire-shove',
    name: 'Shove',
    family: 'hold',
    answers: 'enemies-near',
    text: 'When three or more enemies crowd you, you shove them all back a step with your shield.',
    // Lands when it moves `minMoved` enemies. Costs and refunds are in pips of Resolve.
    params: { cost: 1, refund: 1.5, radius: 110, distance: 60, minMoved: 3, lockoutMs: 2500 },
  }),
  response({
    id: 'squire-riposte',
    name: 'Riposte',
    family: 'counter',
    answers: 'repeat-hits',
    text: 'The third time one enemy hits you, you strike it back at once.',
    params: { cost: 0.5, refund: 1, damagePct: 1 },
  }),
  response({
    id: 'squire-steel-will',
    name: 'Steel Will',
    family: 'guard',
    answers: 'dot-landed',
    text: 'When a poison or bleed lands on you, you spend Resolve to shake it off.',
    params: { cost: 1, refund: 1.5 },
    ranks: [{ rank: 2, text: 'It also shakes off corrosion and slows.' }],
  }),
  response({
    id: 'squire-guard',
    name: 'Guard',
    family: 'guard',
    answers: 'telegraph-at-me',
    text: 'When a telegraphed blow is aimed at you, you brace behind your shield: it deals much less, and catching it gives Resolve back.',
    // The brace holds until the blow lands (at most `maxWindowMs`); a caught blow takes `cut` off.
    params: { cost: 1, refund: 2, cut: 0.7, maxWindowMs: 4000 },
    ranks: [
      // PLACEHOLDER (T3-SQUIRE): after a catch, the brace stays up this long for a second blow.
      { rank: 2, text: 'One brace also catches a second telegraphed blow that comes within a few seconds.', params: { secondCatchMs: 3000 } },
      // PLACEHOLDER (T4-SQUIRE): a caught blow staggers its attacker this long (a boss that accepts no control stays unmoved).
      { rank: 3, text: 'A caught blow also staggers its attacker.', params: { staggerMs: 1000 } },
    ],
  }),
  response({
    id: 'squire-shield-bash',
    name: 'Shield Bash',
    family: 'counter',
    answers: 'enemy-winds-up',
    text: 'When the enemy you fight starts a wind-up, you bash it with your shield: the stun interrupts it.',
    params: { cost: 1, refund: 2, stunMs: 1200 },
  }),
  // ── T2 (§8.16) ──
  response({
    id: 'squire-stand-fast',
    name: 'Stand Fast',
    family: 'guard',
    sidegradeOf: 'squire-guard',
    answers: 'charging-at-me',
    text: 'When an enemy charges at you, you brace for it: the charge stops dead and the charger staggers.',
    // PLACEHOLDERS (T2-RT): a guard costs 1 pip and a landed answer refunds about double (§8.8).
    params: { cost: 1, refund: 2, staggerMs: 800, lockoutMs: 2500 },
  }),
  response({
    id: 'squire-unshaken',
    name: 'Unshaken',
    family: 'guard',
    answers: 'control-on-me',
    // The bible names only the trigger; the effect is the dive log's (Break Free's successor).
    text: 'When a stun, root or knockdown lands on you, you spend Resolve to break free.',
    params: { cost: 1, refund: 2 },
  }),
  response({
    id: 'squire-splitting-blow',
    name: 'Splitting Blow',
    family: 'counter',
    answers: 'target-shielded',
    text: 'When your target raises a shield or barrier, you strike a blow that hits barriers twice as hard.',
    params: { cost: 1, refund: 2, barrierMult: 2, breakBarrier: 0, lockoutMs: 3000 },
    ranks: [{ rank: 2, text: 'The blow breaks Ice Armor in one hit.', params: { breakBarrier: 1 } }],
  }),
  response({
    id: 'squire-earthstamp',
    name: 'Earthstamp',
    family: 'hold',
    answers: 'burrow-at-me',
    text: 'When an enemy burrows or dashes unseen toward you, you stamp the ground: it surfaces at your feet, staggered.',
    params: { cost: 1, refund: 2, staggerMs: 1000, knockdownRadius: 0, knockdownMs: 900, lockoutMs: 3000 },
    ranks: [{ rank: 2, text: 'The stamp also knocks down everything around it.', params: { knockdownRadius: 140 } }],
  }),
  response({
    id: 'squire-watchful',
    name: 'Watchful',
    family: 'guard',
    answers: 'ambush',
    text: "An ambusher's first hit on you is caught on your shield, at no cost, and fills your Resolve.",
    // No cost (§8.16): the catch refunds its fill. cut is the share of the hit it stops.
    params: { cost: 0, refund: 1, cut: 0.7, staggerMs: 0 },
    ranks: [{ rank: 2, text: 'The caught ambusher is staggered.', params: { staggerMs: 1000 } }],
  }),
  response({
    id: 'squire-challenge',
    name: 'Challenge',
    family: 'hold',
    answers: 'ranged-attacker',
    text: 'When an enemy hits you from range, kites you or attacks an ally, you pull it onto you.',
    params: { cost: 1, refund: 2, maxPulled: 3, range: 700, lockoutMs: 3000, rootMs: 0 },
    ranks: [{ rank: 2, text: "A pulled enemy can't move away for a moment.", params: { rootMs: 1200 } }],
  }),
  // ── T3 (§8.16) ──
  response({
    id: 'squire-anchor',
    name: 'Anchor',
    family: 'guard',
    answers: 'drag-or-push',
    text: "When something drags or pushes you, you plant your feet: you don't move, and it fills your Resolve.",
    // PLACEHOLDERS (T3-RT): the brace holds until the push or drag lands (at most `maxWindowMs`).
    params: { cost: 1, refund: 2, maxWindowMs: 4000, lockoutMs: 2500 },
    ranks: [{ rank: 2, text: 'Not even a push into a hazard can move you.' }],
  }),
  response({
    id: 'squire-chain-hook',
    name: 'Chain Hook',
    family: 'hold',
    answers: 'target-flees',
    text: 'When your target flees, you hook it and drag it back.',
    // PLACEHOLDERS: reaches `range` px; the hooked enemy lands `PULL_GAP_PX` from you.
    params: { cost: 1, refund: 2, range: 700, lockoutMs: 3000 },
  }),
  response({
    id: 'squire-frostward',
    name: 'Frostward',
    family: 'guard',
    answers: 'chill-threshold',
    text: 'When the Chill on you is about to freeze you, you hold it there for a few seconds instead.',
    // PLACEHOLDERS: fires at `thresholdStacks` of Chill (the Deep Freeze gate is 4) and keeps it
    // at `holdStacks` for `holdMs`.
    params: { cost: 1, refund: 2, thresholdStacks: 3, holdStacks: 3, holdMs: 4000, lockoutMs: 8000 },
  }),
  response({
    id: 'squire-backdraft',
    name: 'Backdraft',
    family: 'counter',
    answers: 'fire-attack',
    text: 'When a fire attack or burning shot comes at you, you throw the heat back at its source.',
    // PLACEHOLDERS: the counter hits for `damagePct` of a swing; one per `cooldownMs`.
    params: { cost: 1, refund: 2, damagePct: 1.5, cooldownMs: 1500 },
  }),
  // ── T4 (§8.16) ──
  response({
    id: 'squire-disarm',
    name: 'Disarm',
    family: 'counter',
    sidegradeOf: 'squire-shield-bash',
    answers: 'enemy-winds-up',
    text: "When the enemy you fight starts a big attack, you disarm it: the attack lands at half strength. It isn't a stun, so it works even on bosses that can't be controlled.",
    // PLACEHOLDERS (T4-SQUIRE): the attack it was raised against deals `cut` less; the mark holds until it lands (at most `maxWindowMs`).
    params: { cost: 1, refund: 2, cut: 0.5, maxWindowMs: 4000 },
  }),
  response({
    id: 'squire-lay-to-rest',
    name: 'Lay to Rest',
    family: 'hold',
    answers: 'risen',
    text: 'When a fallen enemy rises near you, you strike it down before it stands.',
    // PLACEHOLDERS (T4-SQUIRE): every enemy that rose within `radius` px in the last `freshMs` takes `damagePct` of a swing and is staggered.
    params: { cost: 1, refund: 2, radius: 500, damagePct: 1, staggerMs: 1000, freshMs: 2000 },
  }),
  response({
    id: 'squire-lie-in-wait',
    name: 'Lie in Wait',
    family: 'counter',
    answers: 'target-out-of-reach',
    text: 'When your target dives out of reach, you hold your slam, and it lands twice as hard when the target comes back.',
    // PLACEHOLDERS (T4-SQUIRE): the held slam lands `slamMult` times over on that target, if it comes back within `holdMs`; one hold at a time (`lockoutMs`).
    params: { cost: 1, refund: 2, slamMult: 2, holdMs: 8000, lockoutMs: 8000 },
  }),
  // ── The discipline pieces (§8.5) ──
  response({
    id: 'squire-parry',
    name: 'Parry',
    family: 'counter',
    answers: 'telegraph-at-me',
    text: 'When a telegraphed melee blow is aimed at you, you negate it and counter at once. It costs more than Guard and fails against ground telegraphs and ranged shots.',
    // Parry and Intercept cost 2 pips (§8.8). cut 1: the blow is negated.
    params: { cost: 2, refund: 3, cut: 1, counterPct: 1, maxWindowMs: 4000 },
  }),
  response({
    id: 'squire-intercept',
    name: 'Intercept',
    family: 'hold',
    answers: 'ally-threatened',
    text: 'When an ally stands under a telegraph or runs low on HP, you step in front of them and take the blow.',
    // STAND-IN: the threats on the ally turn on you, and you brace (cut) for windowMs.
    params: { cost: 2, refund: 3, cut: 0.6, windowMs: 3000, radius: 700, lockoutMs: 4000 },
  }),
  response({
    id: 'squire-unbowed',
    name: 'Unbowed',
    family: 'guard',
    answers: 'big-hit',
    text: 'When an untelegraphed blow takes a big share of your HP, you spend Resolve to take it on your armor, where your plating counts double.',
    // hpShare is the blow's share of max HP (§8.5: a quarter); plating counts platingMult times.
    params: { cost: 1, refund: 2, hpShare: 0.25, platingMult: 2 },
  }),
  // ── Every Squire's one emergency answer (§8.3, §8.10) ──
  response({
    id: 'squire-last-breath',
    name: 'Last Breath',
    family: 'emergency',
    answers: 'hp-low',
    text: 'When your HP runs low, you spend your whole Resolve bar to heal.',
    // PLACEHOLDER: heals this share of max HP per pip spent; below minPips it does nothing.
    params: { cost: 0, healPctPerPip: 0.1, minPips: 1, lockoutMs: 30000 },
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
    // A wave is waveMin or more enemies joining at once.
    params: { fillPerEnemy: 0.5, waveMult: 1, waveMin: 3 },
    ranks: [{ rank: 2, bossTier: 2, text: 'A whole wave rallying to the fight fills twice as much.', params: { waveMult: 2 } }],
  }),
  squireTrophy({
    id: 'squire-relic-forest',
    lineage: 'forest',
    name: 'Relentless',
    kind: 'resolve',
    text: 'Your slam fires at a third of a full bar, at a third the size; each slam fired soon after the last is a bit bigger.',
    // Each slam within `chainMs` of the last adds `chainPct` to the next, up to `chainMax`.
    params: { barShare: 0.34, sizePct: 0.34, chainPct: 0.15, chainMs: 6000, chainMax: 1 },
    ranks: [{ rank: 2, bossTier: 2, text: 'The chain of slams grows faster.', params: { chainPct: 0.3, chainMax: 2 } }],
  }),
  squireTrophy({
    id: 'squire-relic-swamp',
    lineage: 'swamp',
    name: 'Rot-Eater',
    kind: 'resolve',
    text: 'Poison and bleed on you fill your Resolve as if they were hits.',
    // debuffFill: pips for each debuff that lands on you (rank 2).
    params: { dotFillMult: 1, debuffFill: 0 },
    ranks: [
      { rank: 2, bossTier: 2, text: 'Every debuff that lands on you also fills your Resolve.', params: { debuffFill: 0.5 } },
      { rank: 3, bossTier: 3, text: 'Rot-Eater grows stronger.', params: { dotFillMult: 1.5, debuffFill: 0.75 } },
    ],
  }),
  squireTrophy({
    id: 'squire-relic-mountain',
    lineage: 'mountain',
    name: 'Faultline',
    kind: 'slam',
    text: 'Your slam runs as a shockwave down a line through the target and everything behind it, reaching enemies at range.',
    params: { length: 320, width: 70, barrierMult: 1 },
    ranks: [
      { rank: 2, bossTier: 2, text: 'The shockwave hits barriers twice as hard.', params: { barrierMult: 2 } },
      { rank: 3, bossTier: 3, text: 'The line runs longer.', params: { length: 420 } },
      // PLACEHOLDERS (T4-SQUIRE): `aftershocks` more strikes along the line, each `aftershockStepMs` after the last, each `aftershockPct` of the slam.
      { rank: 4, bossTier: 4, text: 'Aftershocks follow along the line.', params: { aftershocks: 3, aftershockPct: 0.3, aftershockRadius: 90, aftershockStepMs: 400 } },
    ],
  }),
  squireTrophy({
    id: 'squire-relic-cave',
    lineage: 'cave',
    name: 'Corrode',
    kind: 'slam',
    text: 'Each slam strips plating from everything it hits, more with every slam.',
    params: { platingPerSlam: 2, maxStacks: 5, durationMs: 8000 },
    ranks: [
      { rank: 2, bossTier: 2, text: 'Your slams can strip more plating in all.', params: { maxStacks: 8 } },
      { rank: 3, bossTier: 3, text: 'Corrode grows stronger.', params: { platingPerSlam: 3, maxStacks: 10 } },
    ],
  }),
  squireTrophy({
    id: 'squire-relic-jungle',
    lineage: 'jungle',
    name: 'Strangler Vine',
    kind: 'slam',
    text: 'Before your slam lands, it pulls every enemy in a wide ring to you, fleeing ones included.',
    params: { ringRadius: 260 },
    ranks: [
      { rank: 2, bossTier: 3, text: 'The ring is wider.', params: { ringRadius: 360 } },
      { rank: 3, bossTier: 4, text: 'Strangler Vine grows stronger.', params: { ringRadius: 440 } },
    ],
  }),
  squireTrophy({
    id: 'squire-relic-desert',
    lineage: 'desert',
    name: "Executioner's Oath",
    kind: 'resolve',
    text: 'Your slam can fire early on an enemy below a third of its HP, with whatever Resolve you have.',
    // hpShare: the target's HP share below which the slam may fire early; minPips the least Resolve it needs.
    params: { hpShare: 0.33, minPips: 0.5 },
    ranks: [
      { rank: 2, bossTier: 3, text: 'It works on enemies with more HP left.', params: { hpShare: 0.45 } },
      { rank: 3, bossTier: 4, text: "Executioner's Oath grows stronger.", params: { hpShare: 0.55 } },
    ],
  }),
  squireTrophy({
    id: 'squire-relic-tundra',
    lineage: 'tundra',
    name: 'Deep Winter',
    kind: 'resolve',
    text: 'Your Resolve bar can fill past full, up to double, and an overfull slam hits as hard as two.',
    // The bar holds up to `capMult` times its size; the slam is sized by how full it is when it lands.
    params: { capMult: 2 },
    ranks: [{ rank: 2, bossTier: 4, text: 'The bar can fill up to triple.', params: { capMult: 3 } }],
  }),
  squireTrophy({
    id: 'squire-relic-volcanic',
    lineage: 'volcanic',
    name: 'Kindling',
    kind: 'resolve',
    text: 'Everything that fills your Resolve fills a bit more the longer the fight has lasted.',
    // PLACEHOLDERS: every `stepMs` of the fight adds `perStep` to every gain, up to `maxSteps` steps.
    params: { stepMs: 10000, perStep: 0.1, maxSteps: 6 },
    ranks: [{ rank: 2, bossTier: 4, text: 'Kindling grows stronger.', params: { perStep: 0.15 } }],
  }),
  squireTrophy({
    id: 'squire-relic-graveyard',
    lineage: 'graveyard',
    name: 'Charnel Ring',
    kind: 'slam',
    text: "Your slam's circle widens with every enemy in the fight.",
    // PLACEHOLDERS (T4-SQUIRE): the circle grows `radiusPerEnemy` per enemy on you, at most `maxExtra` over its size.
    params: { radiusPerEnemy: 0.1, maxExtra: 1.5 },
    ranks: [],
  }),
  squireTrophy({
    id: 'squire-relic-trench',
    lineage: 'trench',
    name: 'Undertow',
    kind: 'slam',
    text: "For a few seconds after your slam, the target can't dive, burrow or flee.",
    // PLACEHOLDERS (T4-SQUIRE): the hold lasts `holdMs`; a dive or flight it starts is cut short with a `staggerMs` stagger.
    params: { holdMs: 3000, staggerMs: 800 },
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
    // PLACEHOLDERS (§8.5): answers fill answerFillMult times, plain hits hitFillMult; each landed
    // answer is followed by a counter that costs counterCost pips and hits for counterPct of a swing.
    params: { answerFillMult: 1.5, hitFillMult: 0.6, counterCost: 0.5, counterPct: 0.4 },
  }),
  discipline({
    id: 'squire-bulwark',
    name: 'Bulwark',
    fantasy: 'Everything comes to me, and nothing gets past.',
    text: 'Every enemy on you fills more Resolve, by its hits and just by being there. Your slams hold: everything they hit turns on you, and the circle grows with the enemies on you.',
    pieceId: 'squire-intercept',
    // PLACEHOLDERS: hits fill hitFillMult times and each enemy's trickle trickleMult times; the slam
    // turns what it hits onto you and its circle grows slamRadiusPerEnemy per enemy on you, up to slamRadiusMax.
    params: { hitFillMult: 1.25, trickleMult: 2, slamRadiusPerEnemy: 0.1, slamRadiusMax: 0.6 },
  }),
  discipline({
    id: 'squire-juggernaut',
    name: 'Juggernaut',
    fantasy: 'My armor is my weapon.',
    text: 'Your armor and max HP fill Resolve steadily, hit or not, and hits fill less. You spend it on one huge slam, the biggest hit you have.',
    pieceId: 'squire-unbowed',
    // PLACEHOLDERS: steady fill (pips/s) from a base plus your plating and max HP, hit or not; hits fill
    // hitFillMult times; the slam is slamMult times its size.
    params: { hitFillMult: 0.5, steadyBasePips: 0.04, steadyPerPlating: 0.002, steadyPerMaxHp: 0.00001, slamMult: 1.8 },
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
    // PLACEHOLDERS (T3-RT): the echo lands `delayMs` later at `pct` of the slam.
    params: { delayMs: 3000, pct: 0.5 },
  }),
  specialization({
    id: 'squire-bastion',
    disciplineId: 'squire-bulwark',
    name: 'Bastion',
    text: 'Each enemy on you adds a pip to your Resolve bar, up to double its size; a boss counts as several.',
    // PLACEHOLDER: each enemy on you adds a pip (a boss counts as several) up to `maxMult` times the bar.
    params: { maxMult: 2 },
  }),
  specialization({
    id: 'squire-consecrate',
    disciplineId: 'squire-bulwark',
    name: 'Consecrate',
    text: 'Your slam lasts a few seconds instead: everything around you is struck again and again, and nothing can move you.',
    // PLACEHOLDERS: the slam's blow lands, then the circle is struck every `pulseMs` for `channelMs`, each for `pulsePct` of the slam.
    params: { channelMs: 3000, pulseMs: 500, pulsePct: 0.25 },
  }),
  // Avenger
  specialization({
    id: 'squire-measure-for-measure',
    disciplineId: 'squire-avenger',
    name: 'Measure for Measure',
    text: 'Each counter hits back with part of what its answer stopped, up to a limit: the bigger the blow you caught, the harder you hit back.',
    // PLACEHOLDERS: a counter adds `sharePct` of the blow its answer stopped, up to `capAttackMult` swings.
    params: { sharePct: 0.5, capAttackMult: 3 },
  }),
  specialization({
    id: 'squire-second-nature',
    disciplineId: 'squire-avenger',
    name: 'Second Nature',
    text: 'For a few seconds after a counter lands, your answers cost nothing.',
    // PLACEHOLDER: answers are free for `freeMs` after a counter lands.
    params: { freeMs: 4000 },
  }),
  specialization({
    id: 'squire-sunderer',
    disciplineId: 'squire-avenger',
    name: 'Sunderer',
    text: 'Your counters ignore plating and crack shells.',
    // PLACEHOLDER: a counter hits a raised barrier `barrierMult` times as hard.
    params: { barrierMult: 2 },
  }),
  // Juggernaut
  specialization({
    id: 'squire-destroyer',
    disciplineId: 'squire-juggernaut',
    name: 'Destroyer',
    text: 'Your slam becomes a charge: you crash into your next target from range.',
    // PLACEHOLDER: with the slam armed, you crash into a target up to `chargeRangePx` away.
    params: { chargeRangePx: 450 },
  }),
  specialization({
    id: 'squire-inexorable',
    disciplineId: 'squire-juggernaut',
    name: 'Inexorable',
    text: 'Your bulk keeps filling your Resolve between fights and while you walk, so every fight opens with a slam.',
    // PLACEHOLDER: the discipline's steady fill runs `fillMult` times over out of combat and while you walk.
    params: { fillMult: 5 },
  }),
  specialization({
    id: 'squire-rampage',
    disciplineId: 'squire-juggernaut',
    name: 'Rampage',
    text: 'Each slam starts a burst of faster swings.',
    // PLACEHOLDERS: each slam hastens your swings by `hastePct` for `burstMs`.
    params: { hastePct: 0.5, burstMs: 4000 },
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
    // PLACEHOLDERS (T4-SQUIRE): with an empty bar (less than Parry's cost), Parry fires free once per `everyMs`.
    params: { everyMs: 10000 },
  }),
  leaf({
    id: 'squire-read-again',
    disciplineId: 'squire-avenger',
    column: 'wasted-answer',
    name: 'Read Again',
    text: 'An answer that hits nothing gives back half its cost, and your next answer of the same kind costs less.',
    // PLACEHOLDERS (T4-SQUIRE): a wasted answer gives back `refundShare` of its cost, and the next answer of its family costs `nextCostCut` less.
    params: { refundShare: 0.5, nextCostCut: 0.5 },
  }),
  leaf({
    id: 'squire-seize-the-opening',
    disciplineId: 'squire-avenger',
    column: 'quiet',
    name: 'Seize the Opening',
    text: "An enemy that hasn't attacked you for a few seconds is open: your next swing on it counts as a counter.",
    // PLACEHOLDERS (T4-SQUIRE): an enemy quiet for `quietMs` is open; your next swing on it is followed by a counter of `counterPct` swings.
    params: { quietMs: 4000, counterPct: 0.5 },
  }),
  // Bulwark
  leaf({
    id: 'squire-second-line',
    disciplineId: 'squire-bulwark',
    column: 'empty-bar',
    name: 'Second Line',
    text: 'When your Resolve bar empties, it refills a pip for every enemy on you, every so often.',
    // PLACEHOLDERS (T4-SQUIRE): on an empty bar, a pip per enemy on you comes back, once per `everyMs`.
    params: { everyMs: 12000 },
  }),
  leaf({
    id: 'squire-no-wasted-effort',
    disciplineId: 'squire-bulwark',
    column: 'wasted-answer',
    name: 'No Wasted Effort',
    text: 'An answer that hits nothing puts its cost into your next slam instead of losing it.',
    // PLACEHOLDERS (T4-SQUIRE): each pip of a wasted answer adds `slamPctPerPip` to the next slam.
    params: { slamPctPerPip: 0.25 },
  }),
  leaf({
    id: 'squire-goad',
    disciplineId: 'squire-bulwark',
    column: 'quiet',
    name: 'Goad',
    text: 'When nothing has hit you for a few seconds, a free Challenge pulls the nearest enemies onto you.',
    // PLACEHOLDERS (T4-SQUIRE): after `quietMs` of nothing hitting you, a free Challenge (its range, count and root) once per `everyMs`.
    params: { quietMs: 4000, everyMs: 10000 },
  }),
  // Juggernaut
  leaf({
    id: 'squire-last-rampart',
    disciplineId: 'squire-juggernaut',
    column: 'empty-bar',
    name: 'Last Rampart',
    text: 'When your Resolve bar is empty, Unbowed still fires every so often, at no cost.',
    // PLACEHOLDERS (T4-SQUIRE): with an empty bar (less than Unbowed's cost), Unbowed fires free once per `everyMs`.
    params: { everyMs: 10000 },
  }),
  leaf({
    id: 'squire-focused-weight',
    disciplineId: 'squire-juggernaut',
    column: 'wasted-answer',
    name: 'Focused Weight',
    text: 'A slam that hits only one enemy gives you back a quarter of your Resolve bar.',
    // PLACEHOLDERS (T4-SQUIRE): a slam that hits one enemy refunds `refundShare` of the bar.
    params: { refundShare: 0.25 },
  }),
  leaf({
    id: 'squire-siege-engine',
    disciplineId: 'squire-juggernaut',
    column: 'quiet',
    name: 'Siege Engine',
    text: 'While nothing has hit you for a few seconds, your swings hit harder.',
    // PLACEHOLDERS (T4-SQUIRE): after `quietMs` of nothing hitting you, your swings hit `swingPct` harder.
    params: { quietMs: 4000, swingPct: 0.5 },
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
